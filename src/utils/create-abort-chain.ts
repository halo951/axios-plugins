export interface AbortChainController {
    /** 中断 */
    abort(res?: any): void
    /** 中断并抛出异常 */
    abortError(reason: any): void
    /** 静默 */
    slient: () => Promise<void>
}

interface Chain<T> {
    /**
     * 下一步执行什么
     */
    next: <TResult = T>(
        onNext: (value: T, controller: AbortChainController) => TResult | PromiseLike<TResult>
    ) => Chain<TResult>
    /** 任务完成后执行 */
    completed: (onCompleted: (controller: AbortChainController) => void | PromiseLike<void>) => Chain<T>
    /** 任务中断后执行 */
    abort: (onAbort: (reason: AbortError) => AbortError | PromiseLike<AbortError>) => Chain<T>
    /** 捕获异常 */
    capture: <TResult = T>(
        onCapture: (reason: any, controller: AbortChainController) => TResult | PromiseLike<TResult>
    ) => Chain<TResult>
    /** 标记链任务添加完成, 并开始执行 */
    done(): Promise<T>
}

export class AbortError extends Error {
    type: string = 'abort'
    abort!: { success: boolean; res: any }
    constructor(abort: { success: boolean; res: any }) {
        super()
        this.abort = abort
    }
}
export class SlientError extends Error {
    type: string = 'slient'
}

/** 创建可中止的链式调用 */
export const createAbortChain = <T>(initial?: T): Chain<T> => {
    type TResult = any
    /** 任务链 */
    const chain: Array<(value: T, controller: AbortChainController) => TResult | PromiseLike<TResult>> = []

    /** 链控制器
     *
     * @description 借助 throw error 传递数据
     */
    const controller: AbortChainController = {
        abort(res: any) {
            throw new AbortError({ success: true, res })
        },
        abortError(reason: any) {
            throw new AbortError({ success: false, res: reason })
        },
        slient() {
            throw new SlientError()
        }
    }

    let onCapture: ((reason: any, controller: AbortChainController) => TResult | PromiseLike<TResult>) | undefined
    let onCompleted: ((controller: AbortChainController) => void | PromiseLike<void>) | undefined
    let onAbort: ((reason: AbortError) => TResult | PromiseLike<TResult>) | undefined
    let res: T = initial as unknown as T

    return {
        /** 下一任务 */
        next(event) {
            chain.push(event)
            return this as Chain<TResult>
        },
        /** 捕获异常后触发 */
        capture(event) {
            if (onCapture) {
                throw new Error('`onCapture` is registered')
            }
            onCapture = event
            return this as Chain<TResult>
        },
        /** 执行完成后触发 */
        completed(event) {
            if (onCompleted) {
                throw new Error('`onCompleted` is registered')
            }
            onCompleted = event
            return this as Chain<TResult>
        },
        /**
         * 执行中断后触发
         *
         * @description 增加 `abort` 以解决触发 `Abort` 后造成的后续请求阻塞. (主要体现在: merge 插件)
         */
        abort(event) {
            if (onAbort) {
                throw new Error('`onAbort` is registered')
            }
            onAbort = event
            return this as Chain<TResult>
        },
        /** 停止添加并执行 */
        async done(): Promise<T> {
            /** 包装任务执行过程 */
            const run = async (): Promise<T> => {
                let abortRes: AbortError | undefined
                try {
                    // > loop run next task
                    for (const task of chain) {
                        res = await task(res, controller)
                    }
                    return res
                } catch (reason) {
                    if (reason instanceof AbortError) {
                        abortRes = reason
                    }
                    if (onCapture && !(reason instanceof AbortError || reason instanceof SlientError)) {
                        // emit `capture` hook
                        return await onCapture(reason, controller)
                    } else {
                        throw reason
                    }
                } finally {
                    // emit `completed` hook
                    if (onCompleted) await onCompleted(controller)
                    if (!!abortRes && onAbort) await onAbort(abortRes)
                }
            }
            try {
                return await run()
            } catch (reason) {
                // ? 处理 Abort、AbortError
                if (reason instanceof AbortError) {
                    if (reason.abort.success) {
                        return reason.abort.res
                    } else {
                        throw reason.abort.res
                    }
                } else if (reason instanceof SlientError) {
                    return new Promise(() => {})
                } else {
                    throw reason
                }
            }
        }
    }
}

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
    /** 捕获异常 */
    capture: <TResult = T>(
        onCapture: (reason: any, controller: AbortChainController) => TResult | PromiseLike<TResult>
    ) => Chain<TResult>
    /** 完成后执行 */
    completed: (onCompleted: (controller: AbortChainController) => void | PromiseLike<void>) => Chain<T>
    /** 标记链任务添加完成, 并开始执行 */
    done(): Promise<T>
}

class AbortError extends Error {
    type: string = 'abort'
}
class SlientError extends Error {
    type: string = 'slient'
}

/** 创建可中止的链式调用 */
export const createAbortChain = <T>(initial?: T): Chain<T> => {
    type TResult = any
    /** 任务链 */
    const chain: Array<(value: T, controller: AbortChainController) => TResult | PromiseLike<TResult>> = []

    /** 链控制器 */
    const controller: AbortChainController = {
        abort(result: any) {
            res = result
            throw new AbortError()
        },
        abortError(reason: any) {
            isAbortError = true
            res = reason
            throw new AbortError()
        },
        slient() {
            throw new SlientError()
        }
    }

    let onCapture!: (reason: any, controller: AbortChainController) => TResult | PromiseLike<TResult>
    let onCompleted!: (controller: AbortChainController) => void | PromiseLike<void>
    let isAbortError!: boolean
    let res: T = initial as unknown as T

    return {
        /** 下一任务 */
        next(event) {
            chain.push(event)
            return this
        },
        /** 捕获异常后触发 */
        capture(event) {
            if (onCapture) {
                throw new Error('`onCapture` is registered')
            }
            onCapture = event
            return this
        },
        completed(event) {
            if (onCompleted) {
                throw new Error('`onCompleted` is registered')
            }
            onCompleted = event
            return this
        },
        /** 停止添加并执行 */
        async done(): Promise<T> {
            /** 包装任务执行过程 */
            const run = async (): Promise<T> => {
                try {
                    // > loop run next task
                    for (const task of chain) {
                        res = await task(res, controller)
                    }
                    return res
                } catch (reason) {
                    if (onCapture && !(reason instanceof AbortError || reason instanceof SlientError)) {
                        // emit `capture` hook
                        return await onCapture(reason, controller)
                    } else {
                        throw reason
                    }
                } finally {
                    // emit `completed` hook
                    if (onCompleted) await onCompleted(controller)
                }
            }
            try {
                return await run()
            } catch (reason) {
                // ? 处理 Abort、AbortError
                if (reason instanceof AbortError) {
                    if (isAbortError) {
                        throw res
                    } else {
                        return res
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

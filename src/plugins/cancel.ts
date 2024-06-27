import axios, { AxiosInstance, CancelTokenSource, CanceledError } from 'axios'
import { AxiosInstanceExtension, IPlugin, ISharedCache } from '../intf'
import { createOrGetCache } from '../utils/create-cache'

interface SharedCache extends ISharedCache {
    cancel: Array<CancelTokenSource | null>
}

/**
 * 插件: 取消请求
 *
 * @description 提供 `cancelAll()` 方法, 中止当前在进行的所有请求
 */
export const cancel = (): IPlugin => {
    return {
        name: 'cancel',
        lifecycle: {
            preRequestTransform: {
                runWhen: (config) => !config.cancelToken,
                handler: (config, { origin, shared }) => {
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['cancel'] = createOrGetCache(shared, 'cancel', [])
                    const source: CancelTokenSource = axios.CancelToken.source()
                    // > 复制给 config 用于请求过程执行
                    config.cancelToken = source.token
                    // > 复制给 origin, 用于在请求完成后作为清理内存标识
                    origin.cancelToken = source.token
                    // > 将终止请求的方法放到缓存中
                    cache.push(source)
                    return config
                }
            },
            captureException: {
                runWhen: (reason: any) => reason instanceof CanceledError,
                handler: (reason: any, {}, { abortError }) => {
                    // ? 如果是 cancel 触发的请求, 那么终止执行, 并触发 `abortError`
                    if (reason instanceof CanceledError) {
                        abortError(reason)
                    }
                    return reason
                }
            },
            completed({ origin, shared }) {
                // @ 从共享内存中创建或获取缓存对象
                const cache: SharedCache['cancel'] = createOrGetCache(shared, 'cancel', [])
                const index: number = cache.findIndex((c) => c?.token === origin.cancelToken)
                // clear
                if (index !== -1) cache[index] = null
            }
        }
    }
}

/** 终止所有请求过程 */
export const cancelAll = (axios: AxiosInstance, message?: string) => {
    const shared = (axios as AxiosInstanceExtension).__shared__ as SharedCache
    if (shared.cancel instanceof Array) {
        while (shared.cancel.length > 0) {
            const { cancel } = shared.cancel.pop()!
            cancel(message ?? '请求终止')
        }
    }
}

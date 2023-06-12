import { AxiosResponse } from 'axios'
import { IHooksShareOptions, IPlugin, ISharedCache } from '../../intf'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, FilterPattern } from '../../utils/create-filter'
import { defaultCalcRequestHash } from '../../utils/calc-hash'
declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * 接口请求失败重试次数
         *
         * @description
         *  - 需要注册 `retry()` 插件, 指示接口请求失败后, 重试几次
         *  - 设置为 0 时, 禁用重试功能
         */
        retry?: number
    }
}

/** 插件参数类型 */
export interface IRetryOptions {
    /**
     * 指定哪些接口包含
     */
    includes?: FilterPattern

    /**
     * 最大重试次数
     *
     * @description 如果请求时, 指定了失败重试次数, 那么根据请求上标识, 确认失败后重试几次
     */
    max: number

    /**
     * 自定义异常请求检查方法
     *
     * @description 默认情况下, 仅在捕获到axios抛出异常时, 触发重试规则, 也可以通过此方法自定义重试检查
     */
    isExceptionRequest?: (response: AxiosResponse, options: IHooksShareOptions) => boolean
}

interface IRetrySharedCache extends ISharedCache {
    retry: {
        [hash: string]: number
    }
}
/** 重试异常 */
class RetryError extends Error {
    type: string = 'retry'
}

/**
 * 插件: 失败重试
 *
 * @description 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常.
 *
 * 注:
 */
export const retry = (options: IRetryOptions): IPlugin => {
    // @ 定义url路径过滤器
    const filter = createUrlFilter(options.includes ?? [() => false])
    // @ 计算请求hash
    const calcRequstHash = defaultCalcRequestHash
    return {
        name: 'retry',
        enforce: 'post',
        lifecycle: {
            postResponseTransform: {
                runWhen(_, { origin }) {
                    return !!options.isExceptionRequest && filter(origin.url)
                },
                handler(response, opt) {
                    const isException = options.isExceptionRequest(response, opt)
                    if (isException) {
                        throw new RetryError()
                    }
                    return response
                }
            },
            captureException: {
                runWhen(_, { origin }) {
                    return filter(origin.url)
                },
                async handler(reason, { origin, shared, axios }) {
                    const hash: string = calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: IRetrySharedCache['retry'] = createOrGetCache(shared, 'retry')
                    const max: number = origin.retry ?? options.max
                    // ? 判断请求已达到最大重试次数
                    if (cache[hash] && cache[hash] >= max) {
                        // 删除重试记录
                        delete cache[hash]
                        throw reason
                    } else {
                        // 添加重试失败次数
                        if (!cache[hash]) {
                            cache[hash] = 1
                        } else {
                            cache[hash]++
                        }
                        // > 发起重试
                        return await axios.request(origin)
                    }
                }
            }
        }
    }
}

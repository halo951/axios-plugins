import { AxiosResponse } from 'axios'
import { IHooksShareOptions, IPlugin, ISharedCache } from '../intf'
import { createOrGetCache } from '../utils/create-cache'
import { createUrlFilter, Filter, FilterPattern } from '../utils/create-filter'
import { defaultCalcRequestHash as crh } from '../utils/calc-hash'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重试策略 */
        retry?: IRetryOptions
    }
    interface AxiosRequestConfig {
        /**
         * 接口请求失败重试规则
         *
         * @description
         *  - 需要注册 `retry()` 插件, 指示接口请求失败后, 重试几次
         *  - 设置为 0 时, 禁用重试功能
         */
        retry?: number | Pick<IRetryOptions, 'max' | 'isExceptionRequest'>
    }
}

/** 插件参数类型 */
export interface IRetryOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 建议使用 `axios.request({ retry: 3 })` 方式对单个请求设置重试规则
     */
    includes?: FilterPattern
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

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

interface SharedCache extends ISharedCache {
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
 */
export const retry = (options: IRetryOptions): IPlugin => {
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: IHooksShareOptions): boolean => {
        if (origin['retry']) {
            return !!origin['retry']
        } else {
            const filter: Filter = createUrlFilter(options.includes, options.excludes)
            return filter(origin.url)
        }
    }
    return {
        name: 'retry',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, axios.defaults['retry'])
        },
        lifecycle: {
            postResponseTransform: {
                runWhen(_, opts) {
                    if (!runWhen(_, opts)) return false
                    if (typeof opts.origin.retry === 'object') {
                        return !!opts.origin.retry.isExceptionRequest
                    } else {
                        return !!options.isExceptionRequest
                    }
                },
                handler(response, opts) {
                    let isExceptionRequest: IRetryOptions['isExceptionRequest']
                    if (typeof opts.origin.retry === 'object') {
                        isExceptionRequest = opts.origin.retry.isExceptionRequest
                    } else {
                        isExceptionRequest = options.isExceptionRequest
                    }
                    // > 通过自定义的异常判断方法, 判断请求是否需要重试
                    if (isExceptionRequest?.(response, opts)) {
                        throw new RetryError()
                    }
                    return response
                }
            },
            captureException: {
                runWhen,
                async handler(reason, { origin, shared, axios }, { abortError }) {
                    // @ 计算请求hash
                    const hash: string = crh(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['retry'] = createOrGetCache(shared, 'retry')
                    // @ 获取最大重试次数
                    let max: number
                    if (typeof origin.retry === 'object') {
                        max = origin.retry.max
                    } else if (typeof origin.retry === 'number') {
                        max = origin.retry
                    } else {
                        max = options.max
                    }
                    max = max ?? 0
                    // ? 判断请求已达到最大重试次数, 达到时中断请求过程, 并抛出异常.
                    if (cache[hash] && cache[hash] >= max) {
                        // 删除重试记录
                        delete cache[hash]
                        abortError(reason)
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

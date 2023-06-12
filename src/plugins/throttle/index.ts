import { AxiosRequestConfig } from 'axios'

import { IHooksShareOptions, IPlugin, ISharedCache } from '../../intf'
import { defaultCalcRequestHash as crh } from '../../utils/calc-hash'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, Filter, FilterPattern } from '../../utils/create-filter'
import { delay } from '../../utils/delay'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置节流策略 */
        throttle?: IThrottleOptions
    }

    interface AxiosRequestConfig {
        /**
         * 配置是否触发防抖策略
         *
         * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
         *
         *  - 需要注册 `debounce()` 插件
         *  - 不建议与 `merge`, `throttle` 插件同时使用
         */
        throttle?: boolean | Pick<IThrottleOptions, 'delay' | 'giveUp' | 'throttleErrorMessage'>
    }
}

/** 节流异常类型 */
export class ThrottleError extends Error {
    type: string = 'throttle'
}

/** 节流请求的放弃规则 */
export enum GiveUpRule {
    /** 抛出异常 */
    throw = 'throw',
    /** 放弃执行, 并返回空值结果 */
    cancel = 'cancel',
    /** 静默, 既不返回成功、也不抛出异常 */
    silent = 'silent'
}

/** 插件参数类型 */
export interface IThrottleOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含节流逻辑
     */
    includes?: FilterPattern

    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

    /**
     * 延迟判定时间
     *
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     * @default 0ms
     */
    delay?: number

    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default | 默认公式: f(url, data, params) => hash
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string

    /**
     * 遇到重复请求的抛弃逻辑
     *
     * @default `throw` 抛出异常
     */
    giveUp?: GiveUpRule

    /** 自定义触发节流异常的错误消息 */
    throttleErrorMessage?: string | (<D = any>(config: AxiosRequestConfig<D>) => string)
}

interface ISharedThrottleCache extends ISharedCache {
    throttle: {
        [hash: string]: boolean
    }
}

/**
 * 插件: 节流
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将被抛弃.
 */
export const throttle = (options: IThrottleOptions = {}): IPlugin => {
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: IHooksShareOptions): boolean => {
        if (typeof origin['throttle'] === 'boolean') {
            return origin['throttle']
        } else {
            const filter: Filter = createUrlFilter(options.includes, options.excludes)
            return filter(origin.url)
        }
    }
    return {
        name: 'throttle',
        enforce: 'pre',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, { calcRequstHash: crh }, axios.defaults['throttle'])
        },
        lifecycle: {
            preRequestTransform: {
                runWhen,
                handler: async (config, { origin, shared }, { abort, abortError, slient }) => {
                    // @ 计算请求hash
                    const hash: string = options.calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: ISharedThrottleCache['throttle'] = createOrGetCache(shared, 'throttle')
                    // ? 判断是否重复请求
                    if (cache[hash]) {
                        let message!: string
                        let giveUp: GiveUpRule = (config.throttle as IThrottleOptions)?.giveUp ?? options.giveUp
                        let throttleErrorMessage: IThrottleOptions['throttleErrorMessage'] =
                            (config.throttle as IThrottleOptions)?.throttleErrorMessage ?? options.throttleErrorMessage
                        // ! 触发 `abort`, `abortError`, `slient` 时, 将抛出相应异常, 中止请求
                        switch (giveUp) {
                            case GiveUpRule.silent:
                                slient()
                                break
                            case GiveUpRule.cancel:
                                abort()
                                break
                            case GiveUpRule.throw:
                            default:
                                // > 默认情况下, 抛出节流异常
                                if (throttleErrorMessage) {
                                    if (typeof throttleErrorMessage === 'function') {
                                        message = throttleErrorMessage(config)
                                    } else {
                                        message = throttleErrorMessage
                                    }
                                } else {
                                    message = `'${config.url}' 触发了节流规则, 请求被中止`
                                }
                                abortError(new ThrottleError(message))
                                break
                        }
                    } else {
                        // 创建重复请求缓存
                        cache[hash] = true
                    }
                    return config
                }
            },
            completed: {
                runWhen: (options) => {
                    return runWhen(undefined, options)
                },
                handler: async ({ origin, shared }) => {
                    // @ 计算请求hash
                    const hash: string = options.calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: ISharedThrottleCache['throttle'] = createOrGetCache(shared, 'throttle')
                    // ? 如果配置了延时函数, 那么执行延时等待
                    if (options.delay && options.delay > 0) {
                        await delay(options.delay)
                    }
                    delete cache[hash]
                    return void 0
                }
            }
        }
    }
}

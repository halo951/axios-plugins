import { AxiosRequestConfig } from 'axios'

import { IPlugin, ISharedCache } from '../../intf'
import { defaultCalcRequestHash } from '../../utils/calc-hash'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, FilterPattern } from '../../utils/create-filter'
import { delay } from '../../utils/delay'

interface ISharedThrottleCache extends ISharedCache {
    throttle: {
        [hash: string]: boolean
    }
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

/** 插件参数配置 */
export interface IThrottleOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含防抖逻辑
     */
    includes?: FilterPattern

    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

    /**
     * 延迟判定时间
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     */
    delay?: number

    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default | 默认公式: f(url, data, params) => hash
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string

    /** 遇到重复请求的抛弃逻辑 */
    giveUp?: GiveUpRule
    /**  */
    throttleErrorMessage?: string | ((config: IPlugin) => void)
}
/** 节流异常 */
export class ThrottleError extends Error {
    type: string = 'throttle'
}

/**
 * 插件: 节流
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将被抛弃
 */
export const throttle = (options: IThrottleOptions = {}): IPlugin => {
    // @ 定义url路径过滤器
    const filter = createUrlFilter(options.includes, options.excludes)
    // @ 定义重复请求检查方法
    const calcRequstHash = options.calcRequstHash ?? defaultCalcRequestHash
    return {
        name: 'throttle',
        enforce: 'pre',
        lifecycle: {
            /** 请求执行前触发 */
            async preRequestTransform(config, { shared }) {
                if (!filter(config.url)) return config
                // @ 计算请求hash
                const hash: string = calcRequstHash(config)
                // @ 从共享内存中创建或获取缓存对象
                const cache: ISharedThrottleCache['throttle'] = createOrGetCache(shared, 'throttle')
                // ? 判断是否重复请求
                if (cache[hash]) {
                    throw new ThrottleError(`'${config.url}' 触发了节流异常`)
                } else {
                    // 创建重复请求缓存
                    cache[hash] = true
                }
                return config
            },
            /** 请求完成后触发 */
            async completed({ origin, shared }) {
                // @ 计算请求hash
                const hash: string = calcRequstHash(origin)
                // @ 从共享内存中创建或获取缓存对象
                const cache: ISharedThrottleCache['throttle'] = createOrGetCache(shared, 'throttle')
                // ? 如果配置了延时函数, 那么执行延时等待
                if (options.delay && options.delay > 0) {
                    await delay(options.delay)
                }
                delete cache[hash]
                return void 0
            },
            /** 捕获异常 */
            captureException: {
                runWhen(error: ThrottleError) {
                    return error instanceof ThrottleError
                },
                handler(error: ThrottleError) {
                    switch (options.giveUp) {
                        case GiveUpRule.throw:
                            throw error
                        case GiveUpRule.silent:
                            return new Promise(() => {})
                        case GiveUpRule.cancel:
                        default:
                            return
                    }
                }
            }
        }
    }
}

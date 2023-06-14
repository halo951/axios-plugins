import { AxiosRequestConfig } from 'axios'

import { IHooksShareOptions, IPlugin, ISharedCache } from '../intf'
import { defaultCalcRequestHash as crh } from '../utils/calc-hash'
import { createOrGetCache } from '../utils/create-cache'
import { createUrlFilter, Filter, FilterPattern } from '../utils/create-filter'
import { delay, getDelayTime } from '../utils/delay'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重复请求合并策略 */
        merge?: IMergeOptions
    }

    interface AxiosRequestConfig {
        /**
         * 配置是否触发重复请求合并策略
         *
         * @description 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.
         *
         *  - 需要注册 `merge()` 插件
         *  - 不建议与 `debounce`, `throttle` 插件同时使用
         */
        merge?: boolean | Pick<IMergeOptions, 'delay'>
    }
}

/** 插件参数类型 */
export interface IMergeOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含重复请求合并逻辑
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
     * @default 200ms
     */
    delay?: number

    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default ``` f(url, data, params) => hash ```
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string
}

interface SharedCache extends ISharedCache {
    merge: {
        [hash: string]: Array<{ resolve: Function; reject: Function }>
    }
}

/**
 * 插件: 合并重复请求
 *
 * @description 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.
 */
export const merge = (options: IMergeOptions = {}): IPlugin => {
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: IHooksShareOptions): boolean => {
        if (typeof origin['merge'] === 'boolean') {
            return origin['merge']
        } else {
            const filter: Filter = createUrlFilter(options.includes, options.excludes)
            return filter(origin.url)
        }
    }

    /** 分发合并请求响应值 */
    const distributionMergeResponse = async (
        { origin, shared }: IHooksShareOptions,
        cb: (opt: SharedCache['merge'][any][0]) => void
    ) => {
        // @ 计算请求hash
        const hash: string = options.calcRequstHash(origin)
        // @ 从共享内存中创建或获取缓存对象
        const cache: SharedCache['merge'] = createOrGetCache(shared, 'merge')
        // @ 获取延时时间
        const delayTime: number = getDelayTime(200, origin.debounce, options.delay)
        // > 将结果分发给缓存中的请求
        if (cache[hash]) {
            // > 分2次分发 (分别是响应结束、延时结束, 避免请求过度阻塞
            for (const callback of cache[hash]) cb(callback)
            delay(delayTime).then(() => {
                for (const callback of cache[hash]) cb(callback)
                delete cache[hash]
            })
        }
    }

    return {
        name: 'merge',
        enforce: 'pre',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, { calcRequstHash: crh }, axios.defaults['merge'])
        },
        lifecycle: {
            preRequestTransform: {
                runWhen,
                /**
                 * 请求前, 创建请求缓存, 遇到重复请求时, 将重复请求放入缓存等待最先触发的请求执行完成
                 */
                handler: async (config, { origin, shared }) => {
                    // @ 计算请求hash
                    const hash: string = options.calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['merge'] = createOrGetCache(shared, 'merge')
                    // ? 当判断请求为重复请求时, 添加到缓存中, 等待最先发起的请求完成
                    if (cache[hash]) {
                        return new Promise((resolve, reject) => {
                            cache[hash].push({ resolve, reject })
                        })
                    } else {
                        // 创建重复请求缓存
                        cache[hash] = []
                        return config
                    }
                }
            },
            postResponseTransform: {
                runWhen,
                /**
                 * 请求结束后, 向缓存中的请求分发结果 (分发成果结果)
                 */
                handler: async (response, opt) => {
                    distributionMergeResponse(opt, ({ resolve }) => resolve(response))
                    return response
                }
            },
            captureException: {
                runWhen,
                /**
                 * 请求结束后, 向缓存中的请求分发结果 (分发失败结果)
                 */
                handler: async (reason, opt) => {
                    distributionMergeResponse(opt, ({ reject }) => reject(reason))
                    throw reason
                }
            }
        }
    }
}

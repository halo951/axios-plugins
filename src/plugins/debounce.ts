import { AxiosRequestConfig } from 'axios'

import { IHooksShareOptions, IPlugin, ISharedCache } from '../intf'
import { defaultCalcRequestHash as crh } from '../utils/calc-hash'
import { createOrGetCache } from '../utils/create-cache'
import { createUrlFilter, Filter, FilterPattern } from '../utils/create-filter'
import { delay, getDelayTime } from '../utils/delay'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置防抖策略 */
        debounce?: IDebounceOptions
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
        debounce?: boolean | Pick<IDebounceOptions, 'delay'>
    }
}

/** 插件参数类型 */
export interface IDebounceOptions {
    /**
     * 指定哪些接口包含
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
     * @default ``` f(url, data, params) => hash ```
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string
}

interface SharedCache extends ISharedCache {
    debounce: {
        [hash: string]: Array<{ resolve: Function }>
    }
}

/**
 * 插件: 防抖
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
 */
export const debounce = (options: IDebounceOptions = {}): IPlugin => {
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: IHooksShareOptions): boolean => {
        if (typeof origin['debounce'] === 'boolean') {
            return origin['debounce']
        } else {
            const filter: Filter = createUrlFilter(options.includes, options.excludes)
            return filter(origin.url)
        }
    }
    return {
        name: 'debounce',
        enforce: 'pre',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, { calcRequstHash: crh }, axios.defaults['debounce'])
        },
        lifecycle: {
            preRequestTransform: {
                runWhen,
                handler: async (config, { origin, shared }) => {
                    // @ 计算请求hash
                    const hash: string = options.calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['debounce'] = createOrGetCache(shared, 'debounce')
                    // ? 判断是否重复请求
                    if (cache[hash]) {
                        // 创建延迟工具, 等待其他任务执行完成
                        await new Promise((resolve) => {
                            cache[hash].push({ resolve })
                        })
                    } else {
                        // 创建重复请求缓存
                        cache[hash] = []
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
                    const cache: SharedCache['debounce'] = createOrGetCache(shared, 'debounce')
                    // @ 获取延时时间
                    const delayTime: number = getDelayTime(0, origin.debounce, options.delay)
                    // ? 判断cache中, 是否包含阻塞的请求
                    if (cache[hash]?.length) {
                        const { resolve } = cache[hash].shift()
                        // > 在延时结束后, 触发缓存中被拦截下来的请求
                        delay(delayTime).then(() => resolve())
                    } else {
                        // > 如果没有等待未执行的任务, 清理缓存
                        delete cache[hash]
                    }
                }
            }
        }
    }
}

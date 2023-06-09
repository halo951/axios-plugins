import { AxiosRequestConfig } from 'axios'

import { IPlugin, ISharedCache } from '../../intf'
import { defaultCalcRequestHash } from '../../utils/calc-hash'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, FilterPattern } from '../../utils/create-filter'
import { delay } from '../../utils/delay'

interface ISharedDebounceCache extends ISharedCache {
    debounce: {
        [hash: string]: Array<{ resolve: Function }>
    }
}

/** 插件参数配置 */
export interface IDebounceOptions {
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
}

/**
 * 插件: 防抖
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
 */
export const debounce = (options: IDebounceOptions = {}): IPlugin => {
    // @ 定义url路径过滤器
    const filter = createUrlFilter(options.includes, options.excludes)
    // @ 定义重复请求检查方法
    const calcRequstHash = options.calcRequstHash ?? defaultCalcRequestHash
    return {
        name: 'debounce',
        enforce: 'pre',
        lifecycle: {
            /** 请求执行前触发 */
            async preRequestTransform(config, { shared }) {
                if (!filter(config.url)) return config
                // @ 计算请求hash
                const hash: string = calcRequstHash(config)
                // @ 从共享内存中创建或获取缓存对象
                const cache: ISharedDebounceCache['debounce'] = createOrGetCache(shared, 'debounce')
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
            },
            /** 请求完成后触发 */
            async completed({ origin, shared }) {
                // @ 计算请求hash
                const hash: string = calcRequstHash(origin)
                // @ 从共享内存中创建或获取缓存对象
                const cache: ISharedDebounceCache['debounce'] = createOrGetCache(shared, 'debounce')
                // ? 判断cache中, 是否包含阻塞的请求
                if (cache[hash]?.length) {
                    const { resolve } = cache[hash].shift()
                    if (options.delay && options.delay > 0) {
                        // ? 如果配置了延时函数, 那么等待一段时间后, 再触发执行
                        delay(options.delay).then(() => resolve())
                    } else {
                        resolve()
                    }
                } else {
                    // > 如果没有等待未执行的任务, 清理缓存
                    delete cache[hash]
                }
            }
        }
    }
}

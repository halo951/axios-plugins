import { AxiosInstance, AxiosRequestConfig } from 'axios'

import { IHooksShareOptions, IPlugin } from '../intf'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重复请求合并策略 */
        cache?: ICacheOptions
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
        cache?: boolean | Pick<ICacheOptions, 'expires' | 'key'>
    }
}

/** 插件参数类型 */
export interface ICacheOptions {
    /**
     * 过期时间
     *
     * @description 设置缓存有效期, 超过有效期将失效
     */
    expires?: number

    /**
     * 缓存key
     *
     * @description 缓存key遵循两个规则, 可以参考 `calcRequestHash` 自定义缓存键
     * @default ``` f(url, data, params) => hash ```
     */
    key?: string | (<D>(config: AxiosRequestConfig<D>) => string)

    /**
     * 响应缓存存储空间
     *
     * @default
     */
    storage?: Storage

    /**
     * storage 中, 缓存cache的字段名
     * @default ``` axios-plugins.cache ```
     */
    storageKey?: string
}

interface ICache {
    [key: string]: {
        /** 时效时间 */
        expires: number
        /** 响应内容 */
        res: any
    }
}

const mapping: Array<{ axios: AxiosInstance; patch: (patchCache: ICache) => void; clear: () => void }> = []

/** 删除已有缓存 */
export const removeCache = (axios: AxiosInstance, cacheKey: string): boolean => {
    for (const m of mapping) {
        if (m.axios === axios) {
            m.patch({ [cacheKey]: undefined })
            return true
        }
    }
    return false
}

/** 清除全部缓存 */
export const clearAllCache = (axios: AxiosInstance): boolean => {
    for (const m of mapping) {
        if (m.axios === axios) {
            m.clear()
            return true
        }
    }
    return false
}

/**
 * 插件: 响应缓存
 *
 * @description 存储请求响应内容, 在下次请求时返回 (需要在缓存时效内)
 *
 * 注意: 考虑到缓存的复杂程度, 此插件仅允许对单个接口设置缓存, 且应在所有插件前注册
 */
export const cache = (options: ICacheOptions = {}): IPlugin => {
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: IHooksShareOptions): boolean => {
        return !!origin['cache']
    }

    // @ 获取 storage
    const storage: Storage = options.storage ?? localStorage
    // @ 获取 storage 中, 存放缓存的字段名
    const storageKey: string = options.storageKey ?? 'axios-plugins.cache'

    const getCacheKey = (origin: AxiosRequestConfig, key: unknown): string | undefined => {
        if (typeof key === 'string') return key
        else if (typeof key === 'function') return key(origin)
        else if (typeof key === 'object') return getCacheKey(origin, (key as ICacheOptions).key)
        return undefined
    }

    const getCache = (): ICache => {
        // ? 如果没有缓存, 跳过
        if (!storage.getItem(storageKey)) {
            return {}
        }
        const cache: ICache = JSON.parse(storage.getItem(storageKey))
        return cache
    }

    const patch = (patchCache: ICache): void => {
        const cache = getCache()
        Object.assign(cache, patchCache)
        for (const key of Object.keys(cache)) {
            if (!cache[key]?.expires || Date.now() > cache[key].expires) {
                delete cache[key]
            }
        }
        if (Object.keys(cache).length > 0) {
            storage.setItem(storageKey, JSON.stringify(cache))
        } else {
            storage.removeItem(storageKey)
        }
    }
    const clear = (): void => {
        storage.removeItem(storageKey)
    }

    return {
        name: 'cache',
        enforce: 'pre',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, axios.defaults['cache'])
            mapping.push({ axios, patch, clear })
            // 清理失效缓存
            patch({})
        },
        lifecycle: {
            preRequestTransform: {
                runWhen,
                /**
                 * 请求前, 创建请求缓存, 遇到重复请求时, 将重复请求放入缓存等待最先触发的请求执行完成
                 */
                handler: async (config, { origin }, { abort }) => {
                    // @ 计算缓存的 key
                    const key: string = getCacheKey(origin, origin.cache) ?? getCacheKey(origin, options.key)
                    // 获取缓存
                    const cache: ICache = getCache()

                    if (cache[key]) {
                        // ? 如果在有效期内, 中断请求并退出
                        if (Date.now() < cache[key].expires) {
                            abort(cache[key])
                        } else {
                            delete cache[key]
                        }
                    }

                    return config
                }
            },
            postResponseTransform: {
                runWhen,
                handler: (response, { origin }) => {
                    // @ 计算缓存的 key
                    const key: string = getCacheKey(origin, origin.cache) ?? getCacheKey(origin, options.key)
                    // patch to storage
                    patch({
                        [key]: {
                            expires: (origin.cache as ICacheOptions)?.expires ?? options.expires,
                            res: response
                        }
                    })
                    return response
                }
            }
        }
    }
}

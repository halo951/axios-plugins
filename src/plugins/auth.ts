import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { IPlugin, ISharedCache } from '../intf'
import { Filter, FilterPattern, createUrlFilter } from '../utils/create-filter'
import { createOrGetCache } from '../utils/create-cache'

/** 插件参数声明 */
export interface IAuthOptions {
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

    /** 是否只检查1次
     *
     * @description 如果 `login()` 返回 true 以后, 后续将跳过检查.
     */
    once?: boolean
    /**
     * 检查登录态
     *
     * @description
     *   - 如果没有登录, 那么其他请求将被阻塞, 知道这个异步方法执行完成
     *   - 如果已登录, 则校验通过后, 直接出发后续请求执行
     *   - 如果设置了 timeout, 那么超时后, 将返回失败.
     *
     * @param {InternalAxiosRequestConfig} request 请求参数
     *
     * @returns 如果登录成功, 应返回 true, 如果登录失败或取消登录, 应返回 false 或抛出异常后, 自行处理后续逻辑.
     */
    login: (request: InternalAxiosRequestConfig) => Promise<boolean>
}

interface SharedCache extends ISharedCache {
    auth: {
        /** 是否已经登录 () */
        isLogin?: boolean
    }
}

/**
 * 插件: 请求前, 登录态校验.
 *
 * @description 可以将每次请求前的登录检查、刷新token、登录操作抽象出来. 也可以用类似 `await Dialog.login()` 方式, 做前置的登录处理.
 */
export const auth = (options: IAuthOptions): IPlugin => {
    const filter: Filter = createUrlFilter(options.includes, options.excludes)

    return {
        name: 'auth',
        lifecycle: {
            transformRequest: {
                runWhen: (config) => filter(config.url),
                handler: async (config, { shared }) => {
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['auth'] = createOrGetCache(shared, 'auth')
                    if (cache.isLogin && options.once) {
                        return config
                    }
                    // ? 检查登录态
                    const res: boolean = await options.login(config)
                    if (!res) {
                        throw new AxiosError('no auth', '401', config)
                    }
                    if (options.once) {
                        cache.isLogin = true
                    }
                    return config
                }
            }
        }
    }
}

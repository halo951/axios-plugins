import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AbortChainController } from './utils/create-abort-chain'

declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * 接口 mock 请求标识符
         *
         * @description
         *  - 需要注册 `mock()` 插件
         *  - 当 `mock: true` 时, 如果插件启用, 则会使用 `mockUrl` 替代 `baseUrl` 发起请求
         *  - 当此项配置在axios实例时, 启用全局mock请求
         */
        mock?: boolean
    }
}

/** 实例内共享缓存 */
export interface ISharedCache {
    [key: string]: any
}

/** axios 扩展属性 */
export interface IAxiosPluginExtension {
    /** 已添加的插件集合 */
    __plugins__: Array<IPlugin>
    /** 插件共享数据 */
    __shared__: ISharedCache
}

/** 扩展 axios 实例 */
export type AxiosInstanceExtension = AxiosInstance & IAxiosPluginExtension

/** 钩子共享参数 */
export type IHooksShareOptions = {
    /** 原始请求参数 */
    readonly origin: AxiosRequestConfig
    /** 实例共享缓存 */
    readonly shared: ISharedCache
}

export enum ENext {
    next = 'next'
}

export type ILifecycleHookFunction<V> = (
    value: V,
    options: IHooksShareOptions,
    controller: AbortChainController
) => V | Promise<V>

export type ILifecycleHookObject<V> = {
    runWhen: (value: V, options: IHooksShareOptions) => boolean
    handler: ILifecycleHookFunction<V>
}

export type ILifecycleHook<V> = ILifecycleHookFunction<V> | ILifecycleHookObject<V>

/** 插件接口 */
export interface IPlugin {
    /** 插件名 */
    name: string

    /** 插件内部执行顺序 */
    enforce?: 'pre' | 'post'

    /**
     * 插件注册前置事件
     *
     * @description 可以在此检查 axios 实例是否可以支持当前插件的使用, 如果不能够支持, 应抛出异常.
     */
    beforeRegister?: (axios: AxiosInstanceExtension) => void

    /** 插件声明周期钩子函数
     *
     * @description 为了不对原有的axios实例产生影响,
     */
    lifecycle?: {
        /**
         * 在 `axios.request` 调用前触发钩子
         */
        preRequestTransform?: ILifecycleHook<AxiosRequestConfig>
        /**
         * 响应后触发钩子
         */
        postResponseTransform?: ILifecycleHook<AxiosResponse>
        /**
         * 捕获异常钩子
         *
         * @description 这是一个特殊钩子, 将阻塞异常反馈, 并在钩子函数完成后, 返回正常结果. 如果需要抛出异常, 那么应通过 `throw Error` 方式, 抛出异常信息.
         */
        captureException?: ILifecycleHook<Error | AxiosError | any>
        /**
         * 请求完成后置钩子
         */
        completed?:
            | ((options: IHooksShareOptions, controller: AbortChainController) => void | Promise<void>)
            | {
                  runWhen: (options: IHooksShareOptions) => boolean
                  handler: (options: IHooksShareOptions, controller: AbortChainController) => void | Promise<void>
              }
    }
}

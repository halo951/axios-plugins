import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
    interface AxiosInterceptorManager<V> {
        handles: Array<{
            fulfilled?: (value: V) => V | Promise<V>
            rejected?: (error: any) => any
        }>
    }

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

/** 钩子共享参数 */
export interface IHooksShareOptions {
    /** 原始请求参数 */
    readonly origin: AxiosRequestConfig
    /** 实例共享缓存 */
    readonly shared: ISharedCache
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

export type ILifecycleHook<P, R> =
    | ((...args: [P, R]) => P | Promise<P>)
    | {
          runWhen: (...args: [P, R]) => boolean
          handler: (...args: [P, R]) => P | Promise<P>
      }

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

    /** 插件声明周期钩子函数 */
    lifecycle?: {
        /**
         * 在 `axios.request` 调用前触发钩子
         */
        preRequestTransform?: ILifecycleHook<AxiosRequestConfig, IHooksShareOptions>
        /**
         * 转换请求参数钩子 (在 `axios` 拦截器触发阶段, 处理请求参数转换)
         *
         * @description 由于要遵循`axios.AxiosInterceptorManager` 拦截器注册机制, 所以钩子的触发时机取决于何时调用了 `useAxiosPlugin()` 方法.
         */
        transformRequest?: ILifecycleHook<InternalAxiosRequestConfig, ISharedCache>
        /**
         * 转换请求结果钩子 (在 `axios` 拦截器触发阶段, 处理响应结果转换)
         *
         * @description
         *      由于要遵循`axios.AxiosInterceptorManager` 拦截器注册机制, 所以钩子的触发时机取决于何时调用了 `useAxiosPlugin()` 方法.
         *      另外 `axios` 的实现机制中, 当 `dispatchRequest` 失败后, 将直接返回异常, 可能会导致 `transformResponse` 无法被触发
         */
        transformResponse?: ILifecycleHook<AxiosResponse, ISharedCache>
        /**
         * 响应之后进行处理
         */
        postResponseTransform?: ILifecycleHook<AxiosResponse, IHooksShareOptions>
        /**
         * 捕获异常钩子
         *
         * @description 这是一个特殊钩子, 将阻塞异常反馈, 并在钩子函数完成后, 返回正常结果. 如果需要抛出异常, 那么应通过 `throw Error` 方式, 抛出异常信息.
         */
        captureException?: ILifecycleHook<Error | AxiosError | any, IHooksShareOptions>
        /**
         * 请求完成后置钩子
         */
        completed?: ILifecycleHook<IHooksShareOptions, void>
    }
}

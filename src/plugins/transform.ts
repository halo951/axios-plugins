import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { ILifecycleHook, IPlugin } from '../intf'

/** 插件参数类型 */
export interface ITransformOptions {
    request?: ILifecycleHook<InternalAxiosRequestConfig>
    response?: ILifecycleHook<AxiosResponse>
    capture?: ILifecycleHook<Error | AxiosError | any>
}

/**
 * 插件: 转换请求/响应/异常处理
 *
 * @description 替代`axios.interceptors`的使用, 用于统一管理 axios 请求过程
 */
export const transform = (options: ITransformOptions = {}): IPlugin => {
    return {
        name: 'transform',
        lifecycle: {
            transformRequest: options.request,
            postResponseTransform: options.response,
            captureException: options.capture
        }
    }
}

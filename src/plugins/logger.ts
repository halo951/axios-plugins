import type { GlobalLogConfig } from 'axios-logger/lib/common/types'
import { IPlugin } from '../intf'
import * as log from 'axios-logger'

/** 插件参数类型 */
export interface ILoggerOptions {
    /** 是否打印请求 */
    request?: boolean
    /** 是否打印响应 */
    response?: boolean
    /** 是否打印异常 */
    error?: boolean
    /** 打印配置 */
    config?: GlobalLogConfig
}

/**
 * 插件: 日志
 *
 * @description 自定义请求过程日志打印 (通过 `axios-logger` 插件实现)
 */
export const logger = (options: ILoggerOptions = {}): IPlugin => {
    if (options.config) log.setGlobalConfig(options.config)
    return {
        name: 'logger',
        lifecycle: {
            transformRequest: {
                runWhen: () => options.request,
                handler: (config) => {
                    log.requestLogger(config)
                    return config
                }
            },
            postResponseTransform: {
                runWhen: () => options.response,
                handler: (response) => {
                    log.responseLogger(response)
                    return response
                }
            },
            captureException: {
                runWhen: () => options.error,
                handler: (reason) => {
                    log.errorLogger(reason)
                    throw reason
                }
            }
        }
    }
}

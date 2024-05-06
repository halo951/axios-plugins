import { IPlugin } from '../intf'

export interface ISentryOptions {
    /** sentry 实例 */
    sentry: {
        captureException(exception: any): ReturnType<any>
    }
}

/**
 * 插件: sentry 错误请求日志上报
 *
 * @description 提供 sentry 捕获请求异常并上报的简单实现.
 */
export const sentryCapture = (options: ISentryOptions): IPlugin => {
    return {
        name: 'sentry-capture',
        lifecycle: {
            captureException: (reason) => {
                if (options?.sentry?.captureException) options.sentry.captureException(reason)
                return reason
            }
        }
    }
}

import { toFormData, AxiosPromise, InternalAxiosRequestConfig } from 'axios'
import { IPlugin } from '../intf'
import { combineURLs, isAbsoluteURL } from '../utils/url'
/** 插件参数类型 */
export interface IOnlySendOptions {
    /** 如果浏览器不支持 `navigator.sendBeacon` api, 那么应该如何操作 */
    noSupport?: 'warn' | 'error'
}

/** 仅发送插件相关异常 */
export class OnlySendError extends Error {
    type = 'onlySend'
}

/**
 * 插件: 仅发送
 *
 * @description 提供 `navigator.sendBeacon` 方法封装, 实现页面离开时的埋点数据提交, 但这个需要后端支持
 */
export const onlySend = (options: IOnlySendOptions = {}): IPlugin => {
    return {
        name: 'onlySend',
        enforce: 'post',
        lifecycle: {
            preRequestTransform(config) {
                if (typeof config.adapter === 'function') {
                    throw new Error('适配器已经配置过了, 重复添加将产生冲突, 请检查!')
                }

                if (!navigator.sendBeacon) {
                    let message: string = '当前浏览器不支持 `navigator.sendBeacon`'
                    if (options.noSupport === 'warn') {
                        console.error(message)
                    } else {
                        throw new OnlySendError(message)
                    }
                }

                config.adapter = async (config: InternalAxiosRequestConfig): AxiosPromise => {
                    // > 补全路径
                    if (!isAbsoluteURL(config.url)) {
                        config.url = combineURLs(config.baseURL, config.url)
                    }
                    const form = new FormData()
                    toFormData(Object.assign({}, config.data, config.params), new FormData())
                    let success = navigator.sendBeacon(config.url, form)
                    return {
                        config,
                        data: null,
                        headers: {},
                        status: success ? 200 : 500,
                        statusText: 'success'
                    }
                }
                return config
            }
        }
    }
}

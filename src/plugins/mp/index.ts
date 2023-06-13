import { AxiosPromise, InternalAxiosRequestConfig } from 'axios'
import { IPlugin } from '../../intf'
import { combineURLs, isAbsoluteURL } from '../../utils/url'
/** 插件参数类型 */
export interface ILoadingOptions<C = { [key: string]: any }> {
    env:
        | 'wx' // 微信
        | 'alipay' // 支付宝
        | 'baidu' // 百度
        | 'tt' // 头条
        | 'douyin' // 抖音
        | 'feishu' // 飞书小程序
        | 'dingTalk' // 钉钉小程序
        | 'qq' // qq小程序
        | 'uni' // uni-app
        | 'Taro' // Taro
        | string // 如果小程序平台不在上述预设, 那么可以使用自定义的预设名

    /**
     * 公共参数
     *
     * @description 由于不同平台差异, 通过 axios 转化的公共参数可能不够使用, 所以 这里预留了一个注入公共参数的接口.
     */
    config?: C
}

/** 小程序API前缀映射 */
const mapping = {
    alipay: 'my',
    baidu: 'swan',
    douyin: 'tt',
    feishu: 'tt',
    dingTalk: 'dd'
}

/** 小程序请求错误 */
export class MpRequestError extends Error {
    type = 'MpRequestError'

    /** 错误信息 */
    errMsg: string
    /** 需要基础库： `2.24.0`
     *
     * errno 错误码，错误码的详细说明参考 [Errno错误码](https://developers.weixin.qq.com/miniprogram/dev/framework/usability/PublicErrno.html) */
    errno: number

    constructor(err: { errMsg: string; errno: number }) {
        super(err.errMsg)
        this.errMsg = err.errMsg
        this.errno = this.errno
    }
}
/**
 * 适配器: 小程序请求
 *
 * @description 扩展对微信、头条、qq 等小程序请求的支持
 *
 * @support 微信/支付宝/百度/头条/飞书/QQ/快手/钉钉/淘宝/快应用/uni-app/Taro
 */
export const mp = (options: ILoadingOptions): IPlugin => {
    return {
        name: 'mp',
        enforce: 'post',
        lifecycle: {
            preRequestTransform(config) {
                if (typeof config.adapter === 'function') {
                    throw new Error('适配器已经配置过了, 重复添加将产生冲突, 请检查!')
                }
                config.adapter = (config: InternalAxiosRequestConfig): AxiosPromise => {
                    return new Promise((resolve, reject) => {
                        let env: string = mapping[options.env] ?? options.env
                        let sys = globalThis[env]
                        if (!sys) {
                            reject(new Error(`插件不可用, 未找到 '${env}' 全局变量`))
                        }
                        // > 补全路径
                        if (!isAbsoluteURL(config.url)) {
                            config.url = combineURLs(config.baseURL, config.url)
                        }
                        sys.request({
                            method: config.method.toUpperCase() as any,
                            url: config.url,
                            data: Object.assign({}, config.data, config.params),
                            header: config.headers,
                            timeout: config.timeout,
                            // 合并公共参数
                            ...options.config,
                            success: (result): void => {
                                resolve({
                                    data: result.data,
                                    status: result.statusCode,
                                    statusText: result.errMsg,
                                    headers: {
                                        'set-cookie': result.cookies,
                                        ...result.header
                                    },
                                    config: config
                                })
                            },
                            fail: (err) => {
                                reject(new MpRequestError(err))
                            }
                        })
                    })
                }
                return config
            }
        }
    }
}

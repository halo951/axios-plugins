import { InternalAxiosRequestConfig } from 'axios'
import { IPlugin } from '../../intf'

import { isAbsoluteURL, combineURLs } from '../../utils/url'

/** 插件参数声明: mock */
export interface IMockOptions {
    /**
     * 启用条件
     *
     * @description mock插件启用条件。启用时, mock参数配置生效
     */
    enable?: boolean

    /**
     *  mock 工具地址 | mock's baseUrl
     */
    mockUrl: string
}

/**
 * 插件: mock 请求
 *
 * @param options mock 请求参数, 必填: `mockUrl`
 * @returns IPlugin
 */
export const mock = (options: IMockOptions): IPlugin => {
    return {
        name: 'mock',
        beforeRegister() {
            const { mockUrl } = options
            // ? 校验必要参数配置
            if (!mockUrl) {
                throw new Error(
                    `headers 中似乎并没有配置 'mockURL', 请通过 配置 'headers: { mockURL:''}' 或 使用 env() 插件启用mock能力`
                )
            }
        },
        lifecycle: {
            async transformRequest(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
                const { enable, mockUrl } = options
                const { mock: enableMock, url } = config

                // mock 启用条件
                // 条件1: `enable === true`
                // 条件2: `config.mock === true`
                if (enable && enableMock) {
                    if (!url) {
                        // ? 如果未配置请求地址, 那么替换成 `baseUrl`
                        config.baseURL = mockUrl
                    } else {
                        // ? 否则, 则填充(替换) url
                        // TIP: 考虑到有些接口是配置的完整url, 此时比较合理的做法是替换url地址, 否则会因为存在完整url, 导致baseUrl选项失效.
                        if (!isAbsoluteURL(url)) {
                            config.url = combineURLs(mockUrl, url)
                        } else {
                            // 转换为url对象
                            const u = new URL(url)
                            // 去除origin, 并附加 mockURL
                            config.url = combineURLs(mockUrl, url.replace(u.origin, ''))
                        }
                    }
                }
                return config
            }
        }
    }
}

import { IPlugin } from '../intf'

import { isAbsoluteURL, combineURLs } from '../utils/url'

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置mock请求策略 */
        mock?: boolean | Pick<IMockOptions, 'mock' | 'mockUrl'>
    }

    interface AxiosRequestConfig {
        /**
         * 配置是否将请求映射到mock服务器
         *
         * @description 提供全局或单个接口请求 mock 能力
         *
         *  - 需要注册 `mock()` 插件
         */
        mock?: boolean | Pick<IMockOptions, 'mock' | 'mockUrl'>
    }
}

/** 插件参数声明: mock */
export interface IMockOptions {
    /**
     * 是否启用插件
     *
     * @type {'webpack'} 当enable值为 `webpack`时, 根据 `process.env.NODE_ENV === 'development'` 判断是否启用 mock 插件
     * @type {'vite'} 当enable值为 `vite`时, 根据 `!!import.meta.env.DEV` 判断是否启用 mock 插件
     *
     * @default {false}
     */
    enable: boolean | 'webpack' | 'vite'

    /**
     * 配置是否将请求映射到mock服务器
     *
     * @description 提供全局或单个接口请求 mock 能力
     *
     *  - 需要注册 `mock()` 插件
     */
    mock?: boolean

    /**
     *  mock 工具地址 | mock's baseUrl
     */
    mockUrl?: string
}

/** 判断当前是否处于 webpack 开发环境 */
const isWebpackDev = (): boolean => {
    try {
        return process.env.NODE_ENV === 'development'
    } catch (error) {
        return false
    }
}

/** 判断当前是否处于 vite 开发环境 */
const isViteDev = (): boolean => {
    try {
        // @ts-ignore
        return !!import.meta.env.DEV
    } catch (error) {
        // skip
        return false
    }
}

/**
 * 插件: mock 请求
 *
 * @description 提供全局或单个接口请求 mock 能力
 *
 * 注意: `mock` 修改的请求参数会受到 `axios.interceptors.
 */
export const mock = (options: IMockOptions = { enable: false }): IPlugin => {
    return {
        name: 'mock',
        beforeRegister(axios) {
            // 参数合并
            Object.assign(options, axios.defaults['mock'])
            // ? 校验必要参数配置
            if (!options.mockUrl) {
                throw new Error(`headers 中似乎并没有配置 'mockURL'`)
            }
        },
        lifecycle: {
            preRequestTransform: {
                runWhen(_, { origin }) {
                    if (options.enable === 'webpack') {
                        options.enable = isWebpackDev()
                    } else if (options.enable === 'vite') {
                        options.enable = isViteDev()
                    }
                    if (!options.enable) {
                        return false
                    }
                    // mock 启用条件
                    // 条件1: `enable === true`
                    // 条件2: `config.mock === true` or `options.mock === true`
                    let mock = origin.mock ?? options.mock
                    if (typeof mock === 'object') {
                        return !!mock.mock
                    } else {
                        return !!mock
                    }
                },
                handler: (config) => {
                    const { mockUrl } = options
                    const { url } = config
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
                    return config
                }
            }
        }
    }
}

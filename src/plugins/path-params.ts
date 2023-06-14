import { IPlugin } from '../intf'

/** 插件参数声明 */
export interface IPathParamsOptions {
    /**
     * 从哪里获取 url 路径参数
     *
     * @default > 默认情况下, data, params 都会去检索.
     */
    form?: 'data' | 'params'
}

/**
 * 插件: 路由参数处理
 *
 * @description 扩展对 Restful API 规范的路由参数支持
 *
 * - url 格式需满足: `/api/${query}` 特征
 */
export const pathParams = (options: IPathParamsOptions = {}): IPlugin => {
    return {
        name: 'pathParams',
        lifecycle: {
            async transformRequest(config) {
                const reg: RegExp = /[\$]{0,1}\{.+?\}/g
                const getKey = (part: string): string => {
                    return part.match(/\$\{(.+?)\}/)[0]
                }
                const getValue = (key: string): any => {
                    let ds = options.form ? config[options.form] : { ...config.data, ...config.params }
                    return ds[key]
                }
                // 通过正则获取路径参数后, 将url中的路径参数进行替换
                const parts: Array<string> = config.url.match(reg)
                if (parts.length) {
                    for (const part of parts) {
                        const key: string = getKey(part)
                        const value: any = getValue(key)
                        config.url = config.url.replace(part, value)
                    }
                }
                return config
            }
        }
    }
}

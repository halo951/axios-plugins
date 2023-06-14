import { IPlugin } from '../intf'

type FilterRule =
    | {
          /** 过滤 null 值 */
          noNull?: boolean
          /** 过滤 undefined 值 */
          noUndefined?: boolean
          /** 过滤 nan */
          noNaN?: boolean
          /** 是否对对象进行递归 */
          deep?: boolean
      }
    | false

/** 插件参数声明 */
export interface INormalizeOptions {
    /** 过滤url */
    url?:
        | {
              noDuplicateSlash?: boolean
          }
        | boolean
    /**
     * 过滤 data
     *
     * @description 仅能够过滤 Object 类型参数
     */
    data?: FilterRule
    /**
     * 过滤 params
     *
     * @description 仅能够过滤 Object 类型参数
     */
    params?: FilterRule
}

/**
 * 插件: 规范化请求参数
 *
 * @description 过滤请求过程中产生的 undefined, null 等参数
 */
export const normalize = (options: INormalizeOptions = {}): IPlugin => {
    return {
        name: 'normalize',
        lifecycle: {
            async transformRequest(config) {
                const def: INormalizeOptions['data'] = {
                    noNull: false,
                    noUndefined: true,
                    noNaN: false,
                    deep: false
                }
                let filterDataRule: INormalizeOptions['data'] = def
                const normal = (data: any): void => {
                    if (!filterDataRule) return data
                    if (typeof data === 'object') {
                        if (data instanceof Array || data instanceof File) {
                            return
                        }
                        for (const key in config.data) {
                            let value = config.data[key]
                            if (filterDataRule.noUndefined && value === undefined) {
                                delete config.data[key]
                            }
                            if (filterDataRule.noNull && value === null) {
                                delete config.data[key]
                            }
                            if (filterDataRule.noNaN && isNaN(value)) {
                                delete config.data[key]
                            }
                        }
                    }
                }

                if (config.url && (options.url === true || (options.url as any)?.noDuplicateSlash)) {
                    let reg: RegExp = /^([a-z][a-z\d\+\-\.]*:)?\/\//i
                    let matched: Array<string> | null = config.url.match(reg)
                    let schema: string = matched ? matched[0] : ''
                    config.url = schema + config.url.replace(schema, '').replace(/[\/]{2,}/g, '/')
                }

                if (options.data !== false) {
                    filterDataRule = typeof options.data === 'object' ? options.data : def
                    normal(config.data)
                }

                if (options.params !== false) {
                    filterDataRule = typeof options.params === 'object' ? options.params : def
                    normal(config.params)
                }
                return config
            }
        }
    }
}

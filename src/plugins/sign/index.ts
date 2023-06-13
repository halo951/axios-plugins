import { createHash } from 'crypto'
import { IPlugin } from '../../intf'
import { klona } from 'klona/json'
import { stringify } from 'qs'

export interface IData {
    [key: string]: any
}

/** 插件参数声明 */
export interface ISignOptions {
    /** 签名字段
     *
     * @default 'sign'
     */
    key?: 'sign' | 'signature' | string

    /**
     * 签名算法
     *
     * @default 'md5'
     */
    algorithm?: 'md5' | 'sha1' | 'sha256' | string

    /**
     * 自定义参数排序规则
     *
     * @type {false} 禁用排序
     */
    sort?: false | ((key1: string, key2: string) => number)

    /** 过滤空值 */
    filter?: false | ((key: string, value: any) => boolean)

    /** 加盐
     *
     * @description 加盐操作, 在参数排序后进行, 默认附加在参数最后一位. 如果无法满足需求, 可以在 getData 中, 自行实现加盐操作.

     * @type {string} 序列化后加盐, 格式: `params1=xxx&params2=xxx${salt}`
     * @type {{ [key: string]: any }} 排序后, 在 data 中, 添加盐值字段
     */
    salt?: string | { [key: string]: any }

    /**
     * 参数序列化
     * @default 默认使用 `qs.stringify` 实现参数序列化
     */
    serialize?: (data: { [key: string]: any }) => string
}

/**
 * 插件: 请求签名
 *
 * @description 提供请求防篡改能力, 这个功能需要搭配后端逻辑实现
 *
 * 注:
 * - 需要手工添加到所有插件的末尾, 避免后续其他修改导致签名不一致.
 * - 这个插件实现为初稿, 如果无法满足需要, 可以给我提 Issue
 */
export const sign = (options: ISignOptions): IPlugin => {
    /**
     * 计算对象hash值
     *
     * @description 借助浏览器内置的 `crypto` 库实现, 如果存在兼容性问题, 那么这里可能需要添加 polyfill
     */
    const calcHash = (algorithm: string, str: string): string => {
        const hash = createHash(algorithm)
        hash.update(str)
        return hash.digest('hex')
    }

    return {
        name: 'sign',
        enforce: 'post',
        lifecycle: {
            async transformRequest(config) {
                // 序列化后的请求参数
                let serializedStr: string
                // 拷贝待结算的参数对象
                const data = klona(config.data)

                let entries = Object.entries(data)
                // 排序
                if (options.sort !== false) {
                    entries = entries.sort(([a], [b]) => {
                        if (options.sort) return options.sort(a, b)
                        else return a.localeCompare(b)
                    })
                }
                // 过滤空值
                if (options.filter !== false) {
                    entries = entries.filter(([key, value]) => {
                        if (typeof options.filter === 'function') {
                            return options.filter(key, value)
                        } else {
                            return value !== null && value !== undefined && `${value}`.trim() === ''
                        }
                    })
                }
                // 重新转化为 Object
                let obj = entries.reduce((o, [key, value]) => {
                    o[key] = value
                    return o
                }, {})

                // 加盐 & 序列化
                if (typeof options.salt === 'object') {
                    Object.assign(obj, options.salt)
                    serializedStr = stringify(data, { arrayFormat: 'brackets' })
                } else if (typeof options.salt === 'string') {
                    serializedStr = stringify(data, { arrayFormat: 'brackets' }) + options.salt
                } else {
                    serializedStr = stringify(data, { arrayFormat: 'brackets' })
                }

                // 计算签名
                const sign: string = calcHash(options.algorithm, serializedStr)

                // 添加到 data
                config.data[options.key ?? 'sign'] = sign

                return config
            }
        }
    }
}

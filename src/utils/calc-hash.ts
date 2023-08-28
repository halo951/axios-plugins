import { AxiosRequestConfig } from 'axios'
/**
 * 计算对象hash值
 *
 * @description 借助浏览器内置的 `crypto` 库实现, 如果存在兼容性问题, 那么这里可能需要添加 polyfill
 */
export const calcHash = (obj: Object): string => {
    const data = JSON.stringify(obj)
    let hash = 0
    let i: number

    for (i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }

    let result: string = ''
    for (i = 0; i < 4; i++) {
        const byte = (hash >> (i * 8)) & 0xff
        result += String.fromCharCode(byte)
    }
    return result
}

export type TCalcRequestHsah = (config: AxiosRequestConfig) => string

/** 计算请求hash值方法 */
export const defaultCalcRequestHash: TCalcRequestHsah = (config) => {
    const { url, data, params } = config
    return calcHash({ url, data, params })
}

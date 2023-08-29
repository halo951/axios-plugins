import { AxiosRequestConfig } from 'axios'
import { MD5 } from 'crypto-js'
/**
 * 计算对象hash值
 *
 * @description 借助浏览器内置的 `crypto` 库实现, 如果存在兼容性问题, 那么这里可能需要添加 polyfill
 */
export const calcHash = (obj: Object): string => {
    const data = JSON.stringify(obj)
    return MD5(data).toString()
}

export type TCalcRequestHsah = (config: AxiosRequestConfig) => string

/** 计算请求hash值方法 */
export const defaultCalcRequestHash: TCalcRequestHsah = (config) => {
    const { url, data, params } = config
    return calcHash({ url, data, params })
}

import { AxiosRequestConfig } from 'axios'
import { createHash } from 'crypto'

/**
 * 计算对象hash值
 *
 * @description 借助浏览器内置的 `crypto` 库实现, 如果存在兼容性问题, 那么这里可能需要添加 polyfill
 */
export const calcHash = (obj: Object): string => {
    const hash = createHash('md5')
    hash.update(JSON.stringify(obj))
    return hash.digest('hex')
}

export type TCalcRequestHsah = (config: AxiosRequestConfig) => string

/** 计算请求hash值方法 */
export const defaultCalcRequestHash: TCalcRequestHsah = (config) => {
    const { url, data, params } = config
    return calcHash({ url, data, params })
}

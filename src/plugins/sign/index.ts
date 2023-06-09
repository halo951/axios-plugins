import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 参数签名
 */
export const sign = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

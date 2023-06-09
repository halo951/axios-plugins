import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 小程序请求适配器
 */
export const mock = (platform: 'wx' | 'tt' | 'qq'): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

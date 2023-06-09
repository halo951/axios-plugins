import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 请求队列
 */
export const queue = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

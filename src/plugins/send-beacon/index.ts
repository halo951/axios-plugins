import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 仅发送
 *
 */
export const sendBeacon = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

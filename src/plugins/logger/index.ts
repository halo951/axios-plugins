import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 日志
 */
export const logger = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

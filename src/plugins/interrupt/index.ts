import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 中断
 */
export const interrupt = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

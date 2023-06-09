import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: loading
 */
export const loading = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

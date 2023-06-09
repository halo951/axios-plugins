import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

/**
 * 适配器: 弱网暂存 (离线请求)
 */
export const offline = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

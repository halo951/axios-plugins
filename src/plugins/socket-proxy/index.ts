import { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

export interface ISocketProxyOptions {
    /** websocket 实例 */
    socket: WebSocket
    /** 是否允许降级通信 (当) */
    demotion?: boolean
}
/**
 * 插件: socket proxy
 *
 * @description 借助 WebSocket 双工能力, 降低高延迟请求阻塞, 这一功能需要后端支持
 *
 */
export const socketProxy = (options: ISocketProxyOptions): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

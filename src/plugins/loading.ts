import { IPlugin, ISharedCache } from '../intf'
import { createOrGetCache } from '../utils/create-cache'
import { delay } from '../utils/delay'

declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * 设置当前请求是否触发 loading 切换判断
         *
         * @default {true}
         */
        loading?: boolean
    }
}

/** 插件参数类型 */
export interface ILoadingOptions {
    /**
     * 请求发起后, 延时多少毫秒显示loading
     *
     * @default 200ms
     */
    delay?: number

    /**
     * 是否延时关闭, 当所有请求完成后, 延迟多少毫秒关闭loading
     *
     * @default 200ms
     */
    delayClose?: number

    /**
     * 触发全局loading的切换事件
     *
     * @description 需要自行实现 loading 显示/隐藏的管理逻辑
     */
    onTrigger: (show: boolean) => void
}

interface SharedCache extends ISharedCache {
    /** loading 插件缓存 */
    loading: {
        /** 等待完成的请求计数 */
        pending: number
        /** loading 状态 */
        status: boolean
    }
}

/**
 * 插件: 全局 loading 控制
 *
 * @description 提供全局 loading 统一控制能力, 减少每个加载方法都需要独立 loading 控制的工作
 *
 * - 如果插件链或`axios.interceptors`中存在耗时逻辑, 那么应将 loading 插件添加在插件链的最前面
 */
export const loading = (options: ILoadingOptions): IPlugin => {
    /** 触发loading状态切换 */
    const trigger = (cache: SharedCache['loading'], status: boolean): void => {
        if (status && cache.pending) {
            options.onTrigger(status)
        } else if (!status && cache.pending === 0) {
            options.onTrigger(false)
        }
    }

    return {
        name: 'loading',
        enforce: 'pre',
        lifecycle: {
            preRequestTransform: {
                runWhen: (_, { origin }) => origin.loading !== false,
                handler: (config, { shared }) => {
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: SharedCache['loading'] = createOrGetCache(shared, 'loading', {
                        pending: 0,
                        status: false
                    })
                    cache.pending++
                    // ? 如果存在 pending request, 那么触发 loading 状态切换
                    if (cache.pending) {
                        delay(options.delay ?? 200).then(() => trigger(cache, true))
                    }
                    return config
                }
            },
            completed({ shared }) {
                // @ 从共享内存中创建或获取缓存对象
                const cache: SharedCache['loading'] = createOrGetCache(shared, 'loading', { pending: 0, status: false })
                cache.pending--
                // ? 如果存在 pending request, 那么触发 loading 状态切换
                if (cache.pending--) {
                    delay(options.delayClose ?? 200).then(() => trigger(cache, false))
                }
            }
        }
    }
}

import { IPlugin, ISharedCache } from '../intf'
import { createOrGetCache } from '../utils/create-cache'
import { Filter, FilterPattern, createUrlFilter } from '../utils/create-filter'

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
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含重复请求合并逻辑
     */
    includes?: FilterPattern

    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

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
        /** 定时器 */
        timer?: any
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
    const { delay, delayClose, onTrigger } = options
    let timer: any
    /** 触发检查 */
    const runWhen = <V>(_: V, { origin }: any): boolean => {
        if (origin['loading']) {
            return !!origin['loading']
        } else {
            const filter: Filter = createUrlFilter(options.includes, options.excludes)
            return filter(origin.url)
        }
    }
    /** 打开loading */
    const open = <T>(req: T, { shared }): T => {
        // @ 从共享内存中创建或获取缓存对象
        const cache: SharedCache['loading'] = createOrGetCache(shared, 'loading')
        cache.pending ? cache.pending++ : (cache.pending = 1)
        if (!cache.status && cache.pending > 0) {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                cache.status = true
                onTrigger(true)
            }, delay ?? 0)
        }
        return req
    }
    /** 关闭loading */
    const close = <T>(res: T, { shared }): T => {
        // @ 从共享内存中创建或获取缓存对象
        const cache: SharedCache['loading'] = createOrGetCache(shared, 'loading')
        cache.pending--
        if (cache.status && cache.pending <= 0) {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                cache.status = false
                onTrigger(false)
            }, delayClose ?? 0)
        }
        return res
    }
    /** 在捕获异常时关闭 */
    const closeOnError = (reason: unknown, { shared }) => {
        // @ 从共享内存中创建或获取缓存对象
        const cache: SharedCache['loading'] = createOrGetCache(shared, 'loading')
        cache.pending--
        if (cache.status && cache.pending <= 0) {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                cache.status = false
                onTrigger(false)
            }, delayClose ?? 0)
        }
        throw reason
    }
    return {
        name: 'loading',
        enforce: 'pre',
        lifecycle: {
            preRequestTransform: { runWhen, handler: open },
            postResponseTransform: { runWhen, handler: close },
            captureException: { runWhen, handler: closeOnError },
            aborted: { runWhen, handler: closeOnError }
        }
    }
}

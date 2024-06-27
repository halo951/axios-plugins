import { ISharedCache } from '../intf'

/** 从共享内存中, 创建或获取缓存 */
export const createOrGetCache = <T extends ISharedCache, K extends keyof T, R = T[K]>(
    shared: T,
    key: K,
    initial?: T[K]
): R => {
    if (!shared[key]) {
        shared[key] = initial ?? ({} as T[K])
    }
    return shared[key]
}

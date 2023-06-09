import { ISharedCache } from '../intf'

/** 从共享内存中, 创建或获取缓存 */
export const createOrGetCache = <T extends ISharedCache>(shared: ISharedCache, key: string, initial?: unknown): T => {
    if (!shared[key]) {
        shared[key] = initial ?? {}
    }
    return shared[key]
}

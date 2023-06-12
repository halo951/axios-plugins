import { AxiosResponse } from 'axios'
import { IHooksShareOptions, IPlugin, ISharedCache } from '../../intf'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, FilterPattern } from '../../utils/create-filter'
import { defaultCalcRequestHash } from '../../utils/calc-hash'

/** 插件参数类型 */
export interface IOfflineOptions {
    /** 自定义判断当前是否弱网环境方法 */
    isOffline?: () => Promise<boolean>

    /**
     * 发送离线请求前确认
     *
     * @description 用于
     */
}

/** 重试异常 */
class RetryError extends Error {
    type: string = 'retry'
}

/**
 * 插件: 失败重试
 *
 * @description 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常.
 *
 * 注:
 */
export const retry = (options: IRetryOptions): IPlugin => {
    // @ 定义url路径过滤器
    const filter = createUrlFilter(options.includes ?? [() => false])
    // @ 计算请求hash
    const calcRequstHash = defaultCalcRequestHash
    return {
        name: 'retry',
        enforce: 'post',
        lifecycle: {
            postResponseTransform: {
                runWhen(_, { origin }) {
                    return !!options.isExceptionRequest && filter(origin.url)
                },
                handler(response, opt) {
                    const isException = options.isExceptionRequest(response, opt)
                    if (isException) {
                        throw new RetryError()
                    }
                    return response
                }
            },
            captureException: {
                runWhen(_, { origin }) {
                    return filter(origin.url)
                },
                async handler(reason, { origin, shared, axios }) {
                    const hash: string = calcRequstHash(origin)
                    // @ 从共享内存中创建或获取缓存对象
                    const cache: IRetrySharedCache['retry'] = createOrGetCache(shared, 'retry')
                    const max: number = origin.retry ?? options.max
                    // ? 判断请求已达到最大重试次数
                    if (cache[hash] && cache[hash] >= max) {
                        // 删除重试记录
                        delete cache[hash]
                        throw reason
                    } else {
                        // 添加重试失败次数
                        if (!cache[hash]) {
                            cache[hash] = 1
                        } else {
                            cache[hash]++
                        }
                        // > 发起重试
                        return await axios.request(origin)
                    }
                }
            }
        }
    }
}

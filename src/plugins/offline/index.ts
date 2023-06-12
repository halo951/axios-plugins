import { AxiosResponse } from 'axios'
import { IHooksShareOptions, IPlugin, ISharedCache } from '../../intf'
import { createOrGetCache } from '../../utils/create-cache'
import { createUrlFilter, FilterPattern } from '../../utils/create-filter'
import { defaultCalcRequestHash } from '../../utils/calc-hash'
import { delay } from '../../utils/delay'

/** 插件参数类型 */
export interface IOfflineOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 需要根据请求体积和Storage存储空间大小合理调整 `includes` 规则.
     *
     * @default
     */
    includes?: FilterPattern
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

    /** 自定义判断当前是否弱网环境方法 */
    isOffline?: () => Promise<boolean>

    /**
     * 发送离线请求前确认
     *
     * @description 如果存储中, 存在
     */
    beforeSend?: () => Promise<boolean>

    /**
     * 离线请求存储空间
     *
     * @description 未完成的请求数据, 将序列化后存放到 Storage 中, 可以通过配置此参数, 改变离线请求存储时间.
     * @default localStorage
     */
    storage?: Storage
}

/**
 * 插件: 弱网暂存(离线请求)
 *
 * @description 提供弱网环境下, 当网络不佳或页面终止、退出场景下, 再下次进入页面时, 对未完成请求重放
 */
export const offline = (options: IOfflineOptions): IPlugin => {
    return {
        name: 'offline',
        enforce: 'post',
        beforeRegister(axios) {
            // 等待 100ms后, 检查 Storage中是否包含未完成的离线请求
            delay(100).then(() => {})
        },
        lifecycle: {
            captureException: {
                runWhen(_, { origin }) {
                    const filter = createUrlFilter(options.includes, options.excludes)
                    return filter(origin.url)
                },
                async handler(reason, { origin, shared, axios }) {
                    let storage = options.storage ?? localStorage
                }
            }
        }
    }
}

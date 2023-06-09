import { AxiosAdapter, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { FilterPattern } from '../../utils/create-filter'
/** 插件参数配置 */
export interface IMergeOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含防抖逻辑
     */
    includes?: FilterPattern

    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern

    /**
     * 延迟判定时间
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     */
    delay?: number

    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default | 默认公式: f(url, data, params) => hash
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string
}
/**
 * 适配器: 合并
 */
export const merge = (): AxiosAdapter => {
    return async (_config: InternalAxiosRequestConfig): Promise<any> => {
        return
    }
}

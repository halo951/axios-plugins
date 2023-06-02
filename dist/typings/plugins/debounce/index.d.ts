import { IPlugin } from '../../use-plugin'
import { FilterPattern } from '../../utils/create-filter'
export interface IDebounceOptions {
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
}
/**
 * 插件: 防抖
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
 */
export declare const debounce: (options?: IDebounceOptions) => IPlugin

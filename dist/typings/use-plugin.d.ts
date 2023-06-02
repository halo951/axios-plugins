import type { AxiosInstance } from 'axios';
/** 插件接口 */
export interface IPlugin {
    /** 插件名 */
    name: string;
    /** 执行顺序 */
    enforce?: 'pre' | 'post';
    /** 插件实现 */
    factory: any;
}
/**
 * 使用 axios 扩展插件
 *
 * @description 通过链式调用方式, 为 `axios` 扩展插件支持.
 */
export declare const useAxiosPlugin: (axios: AxiosInstance) => {
    /** 添加新插件 */
    plugin(plug: IPlugin): typeof this;
};

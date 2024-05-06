import { IPlugin } from './intf.mjs';
export { AxiosInstanceExtension } from './intf.mjs';
import { AxiosInstance } from 'axios';

/**
 * 使用 axios 扩展插件
 *
 * @description 通过链式调用方式, 为 `axios` 扩展插件支持.
 */
declare const useAxiosPlugin: (axios: AxiosInstance) => {
    /** 添加新插件 */
    plugin(plug: IPlugin): typeof this;
    /**
     * 包装 `axios({ ... })`
     *
     * @description 使 `axiox({ ... })` 具备插件能力
     */
    wrap(): AxiosInstance;
};

export { IPlugin, useAxiosPlugin };

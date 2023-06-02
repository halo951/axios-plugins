import type { IPlugin } from '../../use-plugin';
export interface IMockOptions {
    /**
     * 启用条件
     *
     * @description mock插件启用条件: 未显式声明时, 根据运行环境自动判断。 否则将根据当前是否处于开发环境判断插件是否生效。
     * @default | 默认情况下, 仅当处于调试模式 `!!import.meta.env.DEV` 或 `process.env.NODE_ENV === 'development'` 时生效
     */
    enable?: boolean;
    /**
     *  mock 工具地址 | mock's baseUrl
     */
    mockUrl: string;
}
declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * 指定当前接口是否为mock
         *
         * @description 当此项配置在axios实例时, 启用全局mock请求
         */
        mock?: boolean;
    }
}
/**
 * 插件: mock 请求
 */
export declare const mock: (options: IMockOptions) => IPlugin;

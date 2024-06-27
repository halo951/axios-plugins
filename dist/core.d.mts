import { c as IUseAxiosPluginResult } from './shared/axios-plugins.0db5f57e.mjs';
export { A as AxiosInstanceExtension, I as IPlugin } from './shared/axios-plugins.0db5f57e.mjs';
import { AxiosInstance } from 'axios';

/**
 * 使用 axios 扩展插件
 *
 * @description 通过链式调用方式, 为 `axios` 扩展插件支持.
 */
declare const useAxiosPlugin: (axios: AxiosInstance) => IUseAxiosPluginResult;

export { useAxiosPlugin };

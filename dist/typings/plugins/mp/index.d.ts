import { AxiosAdapter } from 'axios';
/**
 * 适配器: 小程序请求适配器
 */
export declare const mock: (platform: 'wx' | 'tt' | 'qq') => AxiosAdapter;

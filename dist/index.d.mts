import { IPlugin, IHooksShareOptions, ILifecycleHook } from './intf.mjs';
export { AxiosInstanceExtension } from './intf.mjs';
export { useAxiosPlugin } from './core.mjs';
import { AxiosRequestConfig, AxiosResponse, AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosDefaults, HeadersDefaults, AxiosHeaderValue } from 'axios';
import { GlobalLogConfig } from 'axios-logger/lib/common/types';

type FilterPatternType = string | boolean | RegExp | ((url: string) => boolean) | null | undefined;
type FilterPattern = ReadonlyArray<FilterPatternType> | FilterPatternType;

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置防抖策略 */
        debounce?: IDebounceOptions;
    }
    interface AxiosRequestConfig {
        /**
         * 配置是否触发防抖策略
         *
         * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
         *
         *  - 需要注册 `debounce()` 插件
         *  - 不建议与 `merge`, `throttle` 插件同时使用
         */
        debounce?: boolean | Pick<IDebounceOptions, 'delay'>;
    }
}
/** 插件参数类型 */
interface IDebounceOptions {
    /**
     * 指定哪些接口包含
     */
    includes?: FilterPattern;
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern;
    /**
     * 延迟判定时间
     *
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     * @default 0ms
     */
    delay?: number;
    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default ``` f(url, data, params) => hash ```
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string;
}
/**
 * 插件: 防抖
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
 */
declare const debounce: (options?: IDebounceOptions) => IPlugin;

type debounce$1_IDebounceOptions = IDebounceOptions;
declare const debounce$1_debounce: typeof debounce;
declare namespace debounce$1 {
  export { type debounce$1_IDebounceOptions as IDebounceOptions, debounce$1_debounce as debounce };
}

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置节流策略 */
        throttle?: IThrottleOptions;
    }
    interface AxiosRequestConfig {
        /**
         * 配置是否触发防抖策略
         *
         * @description 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行
         *
         *  - 需要注册 `debounce()` 插件
         *  - 不建议与 `merge`, `throttle` 插件同时使用
         */
        throttle?: boolean | Pick<IThrottleOptions, 'delay' | 'giveUp' | 'throttleErrorMessage'>;
    }
}
/** 节流异常类型 */
declare class ThrottleError extends Error {
    type: string;
}
/** 节流请求的放弃规则 */
declare enum GiveUpRule {
    /** 抛出异常 */
    throw = "throw",
    /** 中断请求, 并返回空值结果 */
    cancel = "cancel",
    /** 静默, 既不返回成功、也不抛出异常 */
    silent = "silent"
}
/** 插件参数类型 */
interface IThrottleOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含节流逻辑
     */
    includes?: FilterPattern;
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern;
    /**
     * 延迟判定时间
     *
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     * @default 0ms
     */
    delay?: number;
    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default ``` f(url, data, params) => hash ```
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string;
    /**
     * 遇到重复请求的抛弃逻辑
     *
     * @default `throw` 抛出异常
     */
    giveUp?: GiveUpRule;
    /** 自定义触发节流异常的错误消息 */
    throttleErrorMessage?: string | (<D = any>(config: AxiosRequestConfig<D>) => string);
}
/**
 * 插件: 节流
 *
 * @description 在一段时间内发起的重复请求, 后执行的请求将被抛弃.
 */
declare const throttle: (options?: IThrottleOptions) => IPlugin;

type throttle$1_GiveUpRule = GiveUpRule;
declare const throttle$1_GiveUpRule: typeof GiveUpRule;
type throttle$1_IThrottleOptions = IThrottleOptions;
type throttle$1_ThrottleError = ThrottleError;
declare const throttle$1_ThrottleError: typeof ThrottleError;
declare const throttle$1_throttle: typeof throttle;
declare namespace throttle$1 {
  export { throttle$1_GiveUpRule as GiveUpRule, type throttle$1_IThrottleOptions as IThrottleOptions, throttle$1_ThrottleError as ThrottleError, throttle$1_throttle as throttle };
}

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重复请求合并策略 */
        merge?: IMergeOptions;
    }
    interface AxiosRequestConfig {
        /**
         * 配置是否触发重复请求合并策略
         *
         * @description 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.
         *
         *  - 需要注册 `merge()` 插件
         *  - 不建议与 `debounce`, `throttle` 插件同时使用
         */
        merge?: boolean | Pick<IMergeOptions, 'delay'>;
    }
}
/** 插件参数类型 */
interface IMergeOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含重复请求合并逻辑
     */
    includes?: FilterPattern;
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern;
    /**
     * 延迟判定时间
     *
     * @description 当设置此值时, 在请求完成后 n 秒内发起的请求都属于重复请求
     * @default 200ms
     */
    delay?: number;
    /** 自定义: 计算请求 hash 值
     *
     * @description 定制重复请求检查方法, 当请求hash值相同时, 判定两个请求为重复请求.
     * @default ``` f(url, data, params) => hash ```
     */
    calcRequstHash?: <D>(config: AxiosRequestConfig<D>) => string;
}
/**
 * 插件: 合并重复请求
 *
 * @description 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.
 */
declare const merge: (options?: IMergeOptions) => IPlugin;

type merge$1_IMergeOptions = IMergeOptions;
declare const merge$1_merge: typeof merge;
declare namespace merge$1 {
  export { type merge$1_IMergeOptions as IMergeOptions, merge$1_merge as merge };
}

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重试策略 */
        retry?: IRetryOptions;
    }
    interface AxiosRequestConfig {
        /**
         * 接口请求失败重试规则
         *
         * @description
         *  - 需要注册 `retry()` 插件, 指示接口请求失败后, 重试几次
         *  - 设置为 0 时, 禁用重试功能
         */
        retry?: number | Pick<IRetryOptions, 'max' | 'isExceptionRequest'>;
    }
}
/** 插件参数类型 */
interface IRetryOptions {
    /**
     * 指定哪些接口包含
     *
     * @description 建议使用 `axios.request({ retry: 3 })` 方式对单个请求设置重试规则
     */
    includes?: FilterPattern;
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern;
    /**
     * 最大重试次数
     *
     * @description 如果请求时, 指定了失败重试次数, 那么根据请求上标识, 确认失败后重试几次
     */
    max: number;
    /**
     * 自定义异常请求检查方法
     *
     * @description 默认情况下, 仅在捕获到axios抛出异常时, 触发重试规则, 也可以通过此方法自定义重试检查
     */
    isExceptionRequest?: (response: AxiosResponse, options: IHooksShareOptions) => boolean;
}
/**
 * 插件: 失败重试
 *
 * @description 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常.
 *
 */
declare const retry: (options: IRetryOptions) => IPlugin;

type retry$1_IRetryOptions = IRetryOptions;
declare const retry$1_retry: typeof retry;
declare namespace retry$1 {
  export { type retry$1_IRetryOptions as IRetryOptions, retry$1_retry as retry };
}

/**
 * 插件: 取消请求
 *
 * @description 提供 `cancelAll()` 方法, 中止当前在进行的所有请求
 */
declare const cancel: () => IPlugin;
/** 终止所有请求过程 */
declare const cancelAll: (axios: AxiosInstance, message?: string) => void;

declare const cancel$1_cancel: typeof cancel;
declare const cancel$1_cancelAll: typeof cancelAll;
declare namespace cancel$1 {
  export { cancel$1_cancel as cancel, cancel$1_cancelAll as cancelAll };
}

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置重复请求合并策略 */
        cache?: ICacheOptions;
    }
    interface AxiosRequestConfig {
        /**
         * 配置是否触发重复请求合并策略
         *
         * @description 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.
         *
         *  - 需要注册 `merge()` 插件
         *  - 不建议与 `debounce`, `throttle` 插件同时使用
         */
        cache?: boolean | (Pick<ICacheOptions, 'expires'> & {
            key: string;
        });
    }
}
/** 插件参数类型 */
interface ICacheOptions {
    /**
     * 缓存版本号
     *
     * @description 设置此参数可以避免因数据结构差异, 导致后续逻辑错误
     */
    version?: string;
    /**
     * 过期时间
     *
     * @description 设置缓存有效期, 超过有效期将失效
     */
    expires?: number;
    /**
     * 缓存key
     *
     * @description 缓存key遵循两个规则, 可以参考 `calcRequestHash` 自定义缓存键
     * @default ``` f(url, data, params) => hash ```
     */
    key?: <D>(config: AxiosRequestConfig<D>) => string;
    /**
     * 响应缓存存储空间
     *
     * @default {sessionStorage}
     */
    storage?: Storage;
    /**
     * storage 中, 缓存cache的字段名
     * @default ``` axios-plugins.cache ```
     */
    storageKey?: string;
}
/** 删除已有缓存 */
declare const removeCache: (axios: AxiosInstance, cacheKey: string) => boolean;
/** 清除全部缓存 */
declare const clearAllCache: (axios: AxiosInstance) => boolean;
/**
 * 插件: 响应缓存
 *
 * @description 存储请求响应内容, 在下次请求时返回 (需要在缓存时效内)
 *
 * 注意: 考虑到缓存的复杂程度, 此插件仅允许对单个接口设置缓存, 且应在所有插件前注册
 */
declare const cache: (options?: ICacheOptions) => IPlugin;

type cache$1_ICacheOptions = ICacheOptions;
declare const cache$1_cache: typeof cache;
declare const cache$1_clearAllCache: typeof clearAllCache;
declare const cache$1_removeCache: typeof removeCache;
declare namespace cache$1 {
  export { type cache$1_ICacheOptions as ICacheOptions, cache$1_cache as cache, cache$1_clearAllCache as clearAllCache, cache$1_removeCache as removeCache };
}

/** 插件参数类型 */
interface ITransformOptions {
    request?: ILifecycleHook<InternalAxiosRequestConfig>;
    response?: ILifecycleHook<AxiosResponse>;
    capture?: ILifecycleHook<Error | AxiosError | any>;
}
/**
 * 插件: 转换请求/响应/异常处理
 *
 * @description 替代`axios.interceptors`的使用, 用于统一管理 axios 请求过程
 */
declare const transform: (options?: ITransformOptions) => IPlugin;

type transform$1_ITransformOptions = ITransformOptions;
declare const transform$1_transform: typeof transform;
declare namespace transform$1 {
  export { type transform$1_ITransformOptions as ITransformOptions, transform$1_transform as transform };
}

declare module 'axios' {
    interface AxiosRequestConfig {
        /**
         * 设置当前请求是否触发 loading 切换判断
         *
         * @default {true}
         */
        loading?: boolean;
    }
}
/** 插件参数类型 */
interface ILoadingOptions$1 {
    /**
     * 指定哪些接口包含
     *
     * @description 未指定情况下, 所有接口均包含重复请求合并逻辑
     */
    includes?: FilterPattern;
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern;
    /**
     * 请求发起后, 延时多少毫秒显示loading
     *
     * @default 200ms
     */
    delay?: number;
    /**
     * 是否延时关闭, 当所有请求完成后, 延迟多少毫秒关闭loading
     *
     * @default 200ms
     */
    delayClose?: number;
    /**
     * 触发全局loading的切换事件
     *
     * @description 需要自行实现 loading 显示/隐藏的管理逻辑
     */
    onTrigger: (show: boolean) => void;
}
/**
 * 插件: 全局 loading 控制
 *
 * @description 提供全局 loading 统一控制能力, 减少每个加载方法都需要独立 loading 控制的工作
 *
 * - 如果插件链或`axios.interceptors`中存在耗时逻辑, 那么应将 loading 插件添加在插件链的最前面
 */
declare const loading: (options: ILoadingOptions$1) => IPlugin;

declare const loading$1_loading: typeof loading;
declare namespace loading$1 {
  export { type ILoadingOptions$1 as ILoadingOptions, loading$1_loading as loading };
}

/** 插件参数类型 */
interface ILoggerOptions {
    /** 是否打印请求 */
    request?: boolean;
    /** 是否打印响应 */
    response?: boolean;
    /** 是否打印异常 */
    error?: boolean;
    /** 打印配置 */
    config?: GlobalLogConfig;
}
/**
 * 插件: 日志
 *
 * @description 自定义请求过程日志打印 (通过 `axios-logger` 插件实现)
 */
declare const logger: (options?: ILoggerOptions) => IPlugin;

type logger$1_ILoggerOptions = ILoggerOptions;
declare const logger$1_logger: typeof logger;
declare namespace logger$1 {
  export { type logger$1_ILoggerOptions as ILoggerOptions, logger$1_logger as logger };
}

declare module 'axios' {
    interface CreateAxiosDefaults {
        /** 配置mock请求策略 */
        mock?: boolean | Pick<IMockOptions, 'mock' | 'mockUrl'>;
    }
    interface AxiosRequestConfig {
        /**
         * 配置是否将请求映射到mock服务器
         *
         * @description 提供全局或单个接口请求 mock 能力
         *
         *  - 需要注册 `mock()` 插件
         */
        mock?: boolean | Pick<IMockOptions, 'mock' | 'mockUrl'>;
    }
}
/** 插件参数声明: mock */
interface IMockOptions {
    /**
     * 是否启用插件
     *
     * @type {boolean} 是否启用插件,
     *  - 在 `vitejs` 环境下, 建议配置为 `enable: !!import.meta.env.DEV`
     *  - 在 `webpack` 环境下, 建议配置为 `enable: process.env.NODE_ENV === 'development'`
     * @default {false}
     */
    enable: boolean;
    /**
     * 配置是否将请求映射到mock服务器
     *
     * @description 提供全局或单个接口请求 mock 能力
     *
     *  - 需要注册 `mock()` 插件
     */
    mock?: boolean;
    /**
     *  mock 工具地址 | mock's baseUrl
     */
    mockUrl?: string;
}
/**
 * 插件: mock 请求
 *
 * @description 提供全局或单个接口请求 mock 能力
 *
 * 注意: `mock` 修改的请求参数会受到 `axios.interceptors.
 */
declare const mock: (options?: IMockOptions) => IPlugin;

type mock$1_IMockOptions = IMockOptions;
declare const mock$1_mock: typeof mock;
declare namespace mock$1 {
  export { type mock$1_IMockOptions as IMockOptions, mock$1_mock as mock };
}

/** 插件参数声明 */
type IEnvsOptions = Array<{
    rule: () => boolean;
    config: Omit<AxiosDefaults, 'headers'> & {
        headers: HeadersDefaults & {
            [key: string]: AxiosHeaderValue;
        };
    };
}>;
/**
 * 插件: 多环境配置
 *
 * @description 规范化 axios 多环境配置工具
 */
declare const envs: (options?: IEnvsOptions) => IPlugin;

type FilterRule = {
    /** 过滤 null 值 */
    noNull?: boolean;
    /** 过滤 undefined 值 */
    noUndefined?: boolean;
    /** 过滤 nan */
    noNaN?: boolean;
    /** 是否对对象进行递归 */
    deep?: boolean;
} | false;
/** 插件参数声明 */
interface INormalizeOptions {
    /** 过滤url */
    url?: {
        noDuplicateSlash?: boolean;
    } | boolean;
    /**
     * 过滤 data
     *
     * @description 仅能够过滤 Object 类型参数
     */
    data?: FilterRule;
    /**
     * 过滤 params
     *
     * @description 仅能够过滤 Object 类型参数
     */
    params?: FilterRule;
}
/**
 * 插件: 规范化请求参数
 *
 * @description 过滤请求过程中产生的 undefined, null 等参数
 */
declare const normalize: (options?: INormalizeOptions) => IPlugin;

type normalize$1_INormalizeOptions = INormalizeOptions;
declare const normalize$1_normalize: typeof normalize;
declare namespace normalize$1 {
  export { type normalize$1_INormalizeOptions as INormalizeOptions, normalize$1_normalize as normalize };
}

/** 插件参数声明 */
interface IPathParamsOptions {
    /**
     * 从哪里获取 url 路径参数
     *
     * @default > 默认情况下, data, params 都会去检索.
     */
    form?: 'data' | 'params';
}
/**
 * 插件: 路由参数处理
 *
 * @description 扩展对 Restful API 规范的路由参数支持
 *
 * - url 格式需满足: `/api/${query}` 特征
 */
declare const pathParams: (options?: IPathParamsOptions) => IPlugin;

type pathParams$1_IPathParamsOptions = IPathParamsOptions;
declare const pathParams$1_pathParams: typeof pathParams;
declare namespace pathParams$1 {
  export { type pathParams$1_IPathParamsOptions as IPathParamsOptions, pathParams$1_pathParams as pathParams };
}

interface IData {
    [key: string]: any;
}
/** 插件参数声明 */
interface ISignOptions {
    /** 签名字段
     *
     * @default 'sign'
     */
    key?: 'sign' | 'signature' | string;
    /**
     * 签名算法
     *
     * @default 'md5'
     */
    algorithm?: 'md5' | ((str: string) => string);
    /**
     * 自定义参数排序规则
     *
     * @default {true}
     */
    sort?: boolean | ((key1: string, key2: string) => number);
    /**
     * 过滤空值
     *
     * @default {true}
     */
    filter?: boolean | ((key: string, value: any) => boolean);
    /** 加盐
     *
     * @description 加盐操作, 在参数排序后进行, 默认附加在参数最后一位. 如果无法满足需求, 可以在 getData 中, 自行实现加盐操作.

     * @type {string} 序列化后加盐, 格式: `params1=xxx&params2=xxx${salt}`
     * @type {{ [key: string]: any }} 排序后, 在 data 中, 添加盐值字段
     */
    salt?: string | {
        [key: string]: any;
    };
    /**
     * 参数序列化
     * @default 默认使用 `qs.stringify` 实现参数序列化
     */
    serialize?: (data: {
        [key: string]: any;
    }) => string;
}
/**
 * 插件: 请求签名
 *
 * @description 提供请求防篡改能力, 这个功能需要搭配后端逻辑实现
 *
 * 注:
 * - 需要手工添加到所有插件的末尾, 避免后续其他修改导致签名不一致.
 * - 这个插件实现为初稿, 如果无法满足需要, 可以给我提 Issue
 */
declare const sign: (options?: ISignOptions) => IPlugin;

type sign$1_IData = IData;
type sign$1_ISignOptions = ISignOptions;
declare const sign$1_sign: typeof sign;
declare namespace sign$1 {
  export { type sign$1_IData as IData, type sign$1_ISignOptions as ISignOptions, sign$1_sign as sign };
}

interface ISentryOptions {
    /** sentry 实例 */
    sentry: {
        captureException(exception: any): ReturnType<any>;
    };
}
/**
 * 插件: sentry 错误请求日志上报
 *
 * @description 提供 sentry 捕获请求异常并上报的简单实现.
 */
declare const sentryCapture: (options: ISentryOptions) => IPlugin;

/** 插件参数类型 */
interface IOnlySendOptions {
    /** 如果浏览器不支持 `navigator.sendBeacon` api, 那么应该如何操作
     *
     * @type {'lower'} (default) 降级, 使用 XHRRequest继续请求
     * @type {'error'} 抛出异常信息, 中断请求
     */
    noSupport?: 'lower' | 'error';
}
/** 仅发送插件相关异常 */
declare class OnlySendError extends Error {
    type: string;
}
/**
 * 插件: 仅发送
 *
 * @description 提供 `navigator.sendBeacon` 方法封装, 实现页面离开时的埋点数据提交, 但这个需要后端支持
 */
declare const onlySend: (options?: IOnlySendOptions) => IPlugin;

type onlySend$1_IOnlySendOptions = IOnlySendOptions;
type onlySend$1_OnlySendError = OnlySendError;
declare const onlySend$1_OnlySendError: typeof OnlySendError;
declare const onlySend$1_onlySend: typeof onlySend;
declare namespace onlySend$1 {
  export { type onlySend$1_IOnlySendOptions as IOnlySendOptions, onlySend$1_OnlySendError as OnlySendError, onlySend$1_onlySend as onlySend };
}

/** 插件参数类型 */
interface ILoadingOptions<C = {
    [key: string]: any;
}> {
    env: 'wx' | 'alipay' | 'baidu' | 'tt' | 'douyin' | 'feishu' | 'dingTalk' | 'qq' | 'uni' | 'Taro' | string;
    /**
     * 公共参数
     *
     * @description 由于不同平台差异, 通过 axios 转化的公共参数可能不够使用, 所以 这里预留了一个注入公共参数的接口.
     */
    config?: C;
}
/** 小程序请求错误 */
declare class MpRequestError extends Error {
    type: string;
    /** 错误信息 */
    errMsg: string;
    /** 需要基础库： `2.24.0`
     *
     * errno 错误码，错误码的详细说明参考 [Errno错误码](https://developers.weixin.qq.com/miniprogram/dev/framework/usability/PublicErrno.html) */
    errno: number;
    constructor(err: {
        errMsg: string;
        errno: number;
    });
}
/**
 * 适配器: 小程序请求
 *
 * @description 扩展对微信、头条、qq 等小程序请求的支持
 *
 * @support 微信/支付宝/百度/头条/飞书/QQ/快手/钉钉/淘宝/快应用/uni-app/Taro
 */
declare const mp: (options: ILoadingOptions) => IPlugin;

type mp$1_ILoadingOptions<C = {
    [key: string]: any;
}> = ILoadingOptions<C>;
type mp$1_MpRequestError = MpRequestError;
declare const mp$1_MpRequestError: typeof MpRequestError;
declare const mp$1_mp: typeof mp;
declare namespace mp$1 {
  export { type mp$1_ILoadingOptions as ILoadingOptions, mp$1_MpRequestError as MpRequestError, mp$1_mp as mp };
}

export { cache$1 as Cache, cancel$1 as Cancel, debounce$1 as Debounce, IPlugin, loading$1 as Loading, logger$1 as Logger, merge$1 as Merge, mock$1 as Mock, mp$1 as Mp, normalize$1 as Normalize, onlySend$1 as OnlySend, pathParams$1 as PathParams, retry$1 as Retry, sign$1 as Sign, throttle$1 as Throttle, transform$1 as Transform, cache, cancel, cancelAll, debounce, envs, loading, logger, merge, mock, mp, normalize, onlySend, pathParams, retry, sentryCapture, sign, throttle, transform };

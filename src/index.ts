export type { IPlugin, AxiosInstanceExtension } from './intf'

export { useAxiosPlugin } from './use-plugin'

/** 请求过程: 防抖 */
export { debounce } from './plugins/debounce'
/** 请求过程: 节流 */
export { throttle } from './plugins/throttle'
/** 请求过程: 重复请求合并 */
export { merge } from './plugins/merge'
/** 请求过程: 失败重试 */
export { retry } from './plugins/retry'
/** 请求过程: 取消(中断)请求 */
export { cancel, cancelAll } from './plugins/cancel'
/** 请求过程: 响应缓存 */
export { cache } from './plugins/cache'

/** 工具: 全局 loading 控制 */
export { loading } from './plugins/loading'
/** 工具: 请求日志 */
export { logger } from './plugins/logger'
/** 工具: mock */
export { mock } from './plugins/mock'
/** 工具: 多环境配置 */
export { envs } from './plugins/envs'
/** 工具: 参数规范化 */
export { normalize } from './plugins/normalize'
/** 工具: 路由参数处理 */
export { pathParams } from './plugins/path-params'
/** 工具: 请求签名 */
export { sign } from './plugins/sign'
/** 工具: sentry 请求错误日志上报 */
export { sentryCapture } from './plugins/sentry-capture'

/** 适配器: 仅发送 */
export { onlySend } from './plugins/only-send'
/** 适配器: 小程序、跨平台框架网络请求支持 */
export { mp } from './plugins/mp'

export * as Cache from './plugins/cache'
export * as Cancel from './plugins/cancel'
export * as Debounce from './plugins/debounce'
export * as Loading from './plugins/loading'
export * as Logger from './plugins/logger'
export * as Merge from './plugins/merge'
export * as Mock from './plugins/mock'
export * as Mp from './plugins/mp'
export * as Normalize from './plugins/normalize'
export * as OnlySend from './plugins/only-send'
export * as PathParams from './plugins/path-params'
export * as Retry from './plugins/retry'
export * as Sign from './plugins/sign'
export * as Throttle from './plugins/throttle'

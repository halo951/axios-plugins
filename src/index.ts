export type { IPlugin } from './intf'
/** 使用 axios plugin */
export { useAxiosPlugin } from './use-plugin'

/** 防抖 */
export { debounce } from './plugins/debounce'
/** 节流 */
export { throttle } from './plugins/throttle'
/** 合并 */
export { merge } from './plugins/merge'
/** 失败重试 */
export { retry } from './plugins/retry'
/** 中断 (请求终止, 离开页面或特定情况下终止所有请求) */
export { interrupt } from './plugins/interrupt'
/** 弱网暂存 (离线请求) */
export { offline } from './plugins/offline'
/** 请求队列 */
export { queue } from './plugins/queue'
/** 请求日志 */
export { logger } from './plugins/logger'
/** 按需mock */
export { mock, IMockOptions } from './plugins/mock'
/** 全局loading */
export { loading } from './plugins/loading'
/** 参数签名 */
export { sign } from './plugins/sign'
/** 通过 `navigator.sendBeacon` 发送请求 */
export { sendBeacon } from './plugins/send-beacon'

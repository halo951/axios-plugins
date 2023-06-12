# axios-plugins

## 开发中, 预计 7 月份完成

如果您有想法、建议的欢迎投稿<a href="https://github.com/halo951/axios-plugins/issues">ISSUE</a>

<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> 用最小的侵入性, 为 axios 扩展更多的插件能力 (防抖、节流 等等)

## 使用

-   安装

```bash
yarn add axios axios-plugins
# 或
npm install axios axios-plugins
```

-   使用插件

```typescript
import axios from 'axios'
import { useAxiosPlugin, mock, loading } from 'axios-plugins'

// 1. 定义axios实例 或 使用项目现有的axios实例
export const request = axios.create({
    /* ... */
})

// 2. 为 axios 注入插件能力
// TIPS: 需要注意的是, 为了从拦截器中获取原始的响应数据, `useAxiosPlugin` 将覆盖 `interceptors` 的实现.
useAxiosPlugin(request)
    // 添加插件
    .plugin(mock({}))
    .plugin(loading({}))

// 3. 为 默认实例注入插件能力
useAxiosPlugin(axios)
    // 添加插件
    .plugin(mock({}))
    .plugin(loading({}))
```

-   使用了`axios({ ... })` 调用接口

> 由于 `Object.defineProperties` 的局限性, 无法覆盖 axios 的原型链方法, 所以需要通过包装函数重新实现`axios.apply`

```typescript
import axios from 'axios'
import { useAxiosPlugin } from 'axios-plugins'
let request = axios.create({
    /* ... */
})

request = useAxiosPlugin(request)
    // 通过 wrap 方法替换包装函数, 需要注意的是, 包装函数是一个替换操作, 需要使用返回的新对象发起请求
    .wrap()
exports.request = request
```

-   创建自定义插件

```typescript
import axios from 'axios'
import { useAxiosPlugin, IPlugin } from 'axios-plugins'

export interface IPlugOptions {
    /**
     * 指定哪些接口包含
     */
    includes?: FilterPattern
    /**
     * 指定哪些接口应忽略
     */
    excludes?: FilterPattern
}

/** 定义插件 */
const plug = (options: unknown): IPlugin => {
    // @ 定义url路径过滤器
    const filter = createUrlFilter(options.includes, options.excludes)
    return {
        name: '插件名',
        lifecycle: {
            /** 通过不同的hooks的组合, 扩展更多的插件能力 */
        }
    }
}

export const request = axios.create({
    /* ... */
})

// 使用自定义插件
useAxiosPlugin(request).plugin(plug({}))
```

## 插件

| 分类     | plugin     | 中文名             | 描述                                                                                   | 完成状态 |
| -------- | ---------- | ------------------ | -------------------------------------------------------------------------------------- | -------- |
| 请求过程 | debounce   | 防抖               | 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行                     | ✔        |
| 请求过程 | throttle   | 节流               | 在一段时间内发起的重复请求, 后执行的请求将被抛弃                                       | ✔        |
| 请求过程 | merge      | 合并               | 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者             | ✔        |
| 请求过程 | retry      | 失败重试           | 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常                                | ✔        |
| 请求过程 | cancel     | 取消(中止)请求     | 取消当前实例下所有在进行的请求                                                         |          |
| 请求过程 | offline    | 弱网暂存(离线请求) | 提供弱网环境下, 当网络不佳或页面终止、退出场景下, 再下次进入页面时, 对未完成请求重放   |          |
| 请求过程 | queue      | 请求队列           | 通过一定条件限制, 针对某些接口, 通过逐条消费方式, 进行请求                             |          |
| 预处理   | pathParams | 路由参数处理       | 扩展对 Restful API 规范的路由参数支持                                                  |          |
| 预处理   | filter     | 参数过滤           | 扩展对 Restful API 规范的路由参数支持                                                  |          |
| 预处理   | sign       | 参数签名           | 提供请求防篡改能力, 这个功能需要搭配后端逻辑实现                                       |          |
| 工具     | logger     | 日志               | 自定义请求过程日志打印                                                                 |          |
| 工具     | cache      | 响应缓存           | 存储请求响应内容, 在下次请求时返回 (需要在缓存时效内)                                  | ✔        |
| 工具     | mock       | 模拟(调试用)       | 提供全局或单个接口请求 mock 能力                                                       | ✔        |
| 工具     | loading    | 全局 loading       | 提供全局 loading 统一控制能力, 减少每个加载方法都需要独立 loading 控制的工作量         |          |
| 工具     | onlySend   | 仅发送             | 对 `navigator.sendBeacon` 方法的封装, 实现页面离开时的埋点数据提交, 但这个需要后端支持 |          |
| 适配器   | mp         | 小程序请求适配器   | 扩展对微信、头条、qq 等小程序请求的支持                                                |          |

### features

-   env | 根据条件, 自动选取 baseUrl 配置
-   noNullParams | 空值过滤 | 过滤值为空的参数, 避免特定情况下参数出错 (上面的 filter 插件)
-   socket-proxy | socket 代理 | 通过 websocket 通道, 处理请求调用
-   autoEnv | 根据运行环境, 指定请求的 baseUrl
-   tokenExpiration | token 过期, 处理当登录态失效后行为

## 插件接口

### debounce | 防抖

-   描述

    在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行

-   使用场景

-   参数

```typescript
export interface IDebounceOptions {}
```

### mock | 客户端 mock

-   接口
-   参数
-   使用场景
-   使用方式

## 建议

1. 开发环境下应添加 `debug` 插件, 检查可能会出现冲突、错误的插件使用场景
2. 建议添加 `merge` 插件, 但不建议 `merge`, `debounce`, `throttle` 同时使用
3. `includes`,`excludes`策略
    - 为了方便理解, 只支持 `全局`, `单次请求` 两种模式
    - `全局`: 需要配置插件的 `include` 规则
    - `单次请求`: 需要在发起请求时, 在配置中指定插件的启用规则

## FAQ

1. 插件的生命周期

参考: [src/intf.ts](src/intf.ts#37)

2. 为什么不使用`axios`提供的拦截器机制去实现插件能力 ?

`axios` 的实现原理上是一个基于 Promise 的链式调用过程, 拦截器相当于`.then()` 函数。`Promise.then()`机制, 只能够获取到上一个`resolve`处理后的数据, 无法在链路的任意阶段获取本次请求的标识。

1. 插件实现机制

`axios-plugins` 仿照 `decorator (装饰器)` 的机制, 包裹了 `axios` 实例的 request 方法, 从而提供插件能力扩展.

也就是说, `axios-plugins` 的生命周期如下图所示:

-   `axios-plugins`

    -   (`transform.request`) 执行插件的请求预处理方法

-   `axios`

    -   (`interceptors.request`) 执行请求拦截器, 处理请求参数
    -   (`dispatchRequest`) 执行请求
    -   (`interceptors.response`) 执行响应拦截器, 处理响应数据

-   `axios-plugins`

    -   (`transform.response`) 执行插件的响应后处理方法

之所以这么设计, 主要因为

3. `防抖`, `节流`, `合并` 这 3 个并发控制方案要如何选择？

`合并(merge)` 是对 `节流(throttle)` 的优化, 如果没有特殊要求, 那么一般建议使用 `合并(merge)` 替代 `节流(throttle)` 即可. 原因上, `合并(merge)` 插件仅影响请求过程, 而对于请求发起者的(发起, 接收响应结果) 没有产生影响. 不需要添加额外的失败处理代码.

`防抖(debounce)` 则是对上面两种插件的补充, 特定于处理 `提交类型的请求 (submit request)`

## 参考及感谢

-   [axios](https://axios-http.com/)
-   [axios-extensions](https://github.com/kuitos/axios-extensions)
-   [alova](https://github.com/alovajs/alova/)
-   [ahooks](https://ahooks.gitee.io/zh-CN/hooks/use-request/index)

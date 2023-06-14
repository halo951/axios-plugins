[![npm version](https://badge.fury.io/js/axios-plugins.svg)](https://badge.fury.io/js/axios-plugins)
[![NPM downloads](https://img.shields.io/npm/dm/axios-plugins.svg?style=flat)](https://npmjs.org/package/axios-plugins)
![license](https://badgen.net/static/license/MIT/blue)

<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> 用最小的侵入性, 为 axios 扩展更多的插件能力 (防抖、节流 等等)

## 特性

-   [轻量级] 完整包体积(5.63kb/gziped), 核心包体积(1.37kb/gziped)
-   [低侵入性] 扩展插件能力通过包装方式扩展, 不影响 axios 现有配置 (包括 `interceptors`)

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

// 2. 添加插件支持

useAxiosPlugin(axios) // axios 默认实例, 添加插件支持
useAxiosPlugin(request) // axios 一般实例, 添加插件支持

// 3. 使用插件

useAxiosPlugin(axios)
    // 添加 mock 插件
    .plugin(mock())

// 4. 请求过程中, 使用插件扩展参数

request.post('/api', {}, { mock: true }) // 指定接口请求时, 向mock服务器发起请求

// 5. 如果需要支持 `request()` 方式调用, 需要通过 `wrap()` 方法覆盖原实例
const request2 = useAxiosPlugin(request)
    .plugin(mock()) // 添加插件
    .wrap() // wrap 函数包装 axios 实例
```

-   按需引用

> TIPS: 如果你正在使用 `vite` 或其他带有 TreeShaking 能力的编译器, 直接使用默认导出即可

```typescript
import axios from 'axios'
// + 将依赖导入修改成如下方式, 导入 `core` 和 需要使用的插件
import { useAxiosPlugin } from 'axios-plugins/core'
import { loading } from 'axios-plugins/plugins/loading'

// 1. 定义axios实例 或 使用项目现有的axios实例
export const request = axios.create({
    /* ... */
})

// 2. 添加插件
useAxiosPlugin(request).plugin(loading())
```

-   创建自定义插件

```typescript
import axios from 'axios'
import { useAxiosPlugin, IPlugin } from 'axios-plugins'

/**
 * 定义插件
 *
 * @param {options} 插件参数
 * @returns IPlugin
 */
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
// 使用
useAxiosPlugin(axios).plugin(plug({}))
```

## 插件

| plugin     | 名称             | 描述                                                                                   |
| ---------- | ---------------- | -------------------------------------------------------------------------------------- |
| debounce   | 防抖             | 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行                     |
| throttle   | 节流             | 在一段时间内发起的重复请求, 后执行的请求将被抛弃                                       |
| merge      | 重复请求合并     | 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者             |
| retry      | 失败重试         | 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常                                |
| cancel     | 取消(中止)请求   | 提供 `cancelAll()` 方法, 中止当前在进行的所有请求                                      |
| cache      | 响应缓存         | 存储请求响应内容, 在下次请求时返回 (需要在缓存时效内)                                  |
| envs       | 多环境配置       | 规范化 axios 多环境配置工具                                                            |
| loading    | 全局 loading     | 提供全局 loading 统一控制能力, 减少每个加载方法都需要独立 loading 控制的工作量         |
| logger     | 日志             | 自定义请求过程日志打印                                                                 |
| mock       | 模拟(调试用)     | 提供全局或单个接口请求 mock 能力                                                       |
| normalize  | 参数规范化       | 过滤请求过程中产生的 undefined, null 等参数                                            |
| pathParams | 路由参数处理     | 扩展对 Restful API 规范的路由参数支持                                                  |
| sign       | 参数签名         | 提供请求防篡改能力, 这个功能需要搭配后端逻辑实现                                       |
| onlySend   | 仅发送           | 提供 `navigator.sendBeacon` 方法封装, 实现页面离开时的埋点数据提交, 但这个需要后端支持 |
| mp         | 小程序请求适配器 | 扩展对小程序(微信、头条、qq 等)、跨平台框架(uni-app, taro)网络请求的支持               |

## API & 示例

> 暂时, 需要通过 `.d.ts` 文件, 查看参数及说明

## 按需加载

## 参考及感谢

-   [axios](https://axios-http.com/)
-   [axios-extensions](https://github.com/kuitos/axios-extensions)
-   [alova](https://github.com/alovajs/alova/)
-   [ahooks](https://ahooks.gitee.io/zh-CN/hooks/use-request/index)

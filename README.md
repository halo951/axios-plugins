[![npm version](https://badge.fury.io/js/axios-plugins.svg)](https://badge.fury.io/js/axios-plugins)
[![NPM downloads](https://img.shields.io/npm/dm/axios-plugins.svg?style=flat)](https://npmjs.org/package/axios-plugins)
![license](https://badgen.net/static/license/MIT/blue)

<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> 用最小的侵入性, 为 axios 扩展更多的插件能力 (防抖、节流 等等)

> Tips: 作者比较懒, 偶尔才会翻一下 issues ~,~  
> 一般这个库会根据我的使用情况慢慢更新, 如果有啥 bug 微信找我吧, 我尽量去改一下, 微信号: halo_951 (顺便备注说明下问题)

## 特性

-   [轻量级] 核心包体积(1.37kb/gziped), 完整包体积(5.88kb/gziped), 支持 TreeShaking 和 单插件引用
-   [多实例支持] 插件缓存变量与 axios 实例相关联, 多个 axios 实例间互不影响
-   [低侵入性] 插件通过包装方式扩展, 不对实例现有配置产生影响, 不破坏 axios 的 api.
-   [低集成成本] 相比与其他插件来说, 不需要为集成插件做大量改动, 也没有什么学习成本.
-   [丰富的插件选择] 相比于其他基于 `axios.interceptors` 实现的插件来说, 这个库提供了更加丰富的插件选择
-   [可扩展] 提供了 `IPlugin` 接口, 只需要遵循接口规范, 即可自行扩展更多的插件能力
-   [无破坏性] 不需要像其他插件一样, 集成此插件可以不破坏现有代码结构

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

| plugin                          | 名称             | 描述                                                                                   |
| ------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| [debounce](#debounce)           | 防抖             | 在一段时间内发起的重复请求, 后执行的请求将等待上次请求完成后再执行                     |
| [throttle](#throttle)           | 节流             | 在一段时间内发起的重复请求, 后执行的请求将被抛弃                                       |
| [merge](#merge)                 | 重复请求合并     | 在一段时间内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者             |
| [retry](#retry)                 | 失败重试         | 当请求失败(出错)后, 重试 n 次, 当全部失败时, 再抛出异常                                |
| [cancel](#cancel)               | 取消(中止)请求   | 提供 `cancelAll()` 方法, 中止当前在进行的所有请求                                      |
| [transform](#transform)         | 转换请求/响应    | 替代`axios.interceptors`的使用, 用于统一管理 axios 请求过程                            |
| [cache](#cache)                 | 响应缓存         | 存储请求响应内容, 在下次请求时返回 (需要在缓存时效内)                                  |
| [envs](#envs)                   | 多环境配置       | 规范化 axios 多环境配置工具                                                            |
| [mock](#mock)                   | 模拟(调试用)     | 提供全局或单个接口请求 mock 能力                                                       |
| [normalize](#normalize)         | 参数规范化       | 过滤请求过程中产生的 undefined, null 等参数                                            |
| [pathParams](#pathParams)       | 路由参数处理     | 扩展对 Restful API 规范的路由参数支持                                                  |
| [sign](#sign)                   | 参数签名         | 提供请求防篡改能力, 这个功能需要搭配后端逻辑实现                                       |
| [loading](#loading)             | 全局 loading     | 提供全局 loading 统一控制能力, 减少每个加载方法都需要独立 loading 控制的工作量         |
| [logger](#logger)               | 日志             | 自定义请求过程日志打印                                                                 |
| [sentryCapture](#sentryCapture) | sentry 错误上报  | 提供 sentry 捕获请求异常并上报的简单实现.                                              |
| [onlySend](#onlySend)           | 仅发送           | 提供 `navigator.sendBeacon` 方法封装, 实现页面离开时的埋点数据提交, 但这个需要后端支持 |
| [mp](#mp)                       | 小程序请求适配器 | 扩展对小程序(微信、头条、qq 等)、跨平台框架(uni-app, taro)网络请求的支持               |

## 插件使用示例

> TIPS: 考虑篇幅原因, README 文档仅展示一些基础使用内容

#### debounce

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { debounce } from 'axios-plugins/plugins/debounce'

const request = axios.create({})
/** 配置 */
// 基础使用
useAxiosPlugin(request).plugin(debounce())

// 设置防抖策略判定延时参数 (相同接口请求, 在第一个请求完成后 200 毫秒内再次发起, 将触发防抖规则)
debounce({ delay: 200 })

// 设置哪些请求将触发防抖策略 (按需设置 `includes`, `excludes`)
debounce({ includes: '/api/', excludes: [] })

// 自定义相同请求判定规则 (忽略参数差异时比较有用)
debounce({ calcRequstHash: (config) => config.url })

// 在请求时, 设置请求将触发防抖策略 (优先级更高)
request.post('/api/xxx', {}, { debounce: true })

// 为单个请求设置不同的触发延时
request.post('/api/xxx', {}, { debounce: { delay: 1000 } })
```

#### throttle

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { throttle, GiveUpRule } from 'axios-plugins/plugins/throttle'

const request = axios.create({})
/** 配置 */
// 基础使用
useAxiosPlugin(request).plugin(throttle())

// 设置节流策略判定延时参数 (相同接口请求, 在第一个请求完成后 200 毫秒内再次发起时, 将触发节流策略)
throttle({ delay: 200 })

// 设置哪些请求将触发节流策略 (按需设置 `includes`, `excludes`)
throttle({ includes: '/api/', excludes: [] })

// 设置节流策略处理规则
throttle({ giveUp: GiveUpRule.throw }) // 抛出异常 (默认)
throttle({ giveUp: GiveUpRule.cancel }) // 中断请求, 并返回空值结果
throttle({ giveUp: GiveUpRule.slient }) // 静默, 既不返回成功、也不抛出异常

// 自定义相同请求判定规则 (忽略参数差异时比较有用)
throttle({ calcRequstHash: (config) => config.url })

// 在请求时, 设置请求将触发防抖策略 (优先级更高)
request.post('/api/xxx', {}, { throttle: true })

// 单个请求设置不同的触发延时
request.post('/api/xxx', {}, { throttle: { delay: 1000 } })
// 单个请求设置不同的节流处理规则
request.post('/api/xxx', {}, { throttle: { giveUp: GiveUpRule.cancel } })
// 单个请求设置触发节流后抛出的异常消息
request.post('/api/xxx', {}, { throttle: { throttleErrorMessage: '/api 短时间内重复执行了' } })
```

#### merge

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { merge } from 'axios-plugins/plugins/merge'

const request = axios.create({})
/** 配置 */
// 基础使用
useAxiosPlugin(request).plugin(merge())

// 设置重复请求合并策略延时 (相同接口请求, 在200ms内发起的重复请求, 仅请求一次, 并将请求结果分别返回给不同的发起者.)
merge({ delay: 200 })

// 设置哪些请求将触发重复请求合并策略 (按需设置 `includes`, `excludes`)
merge({ includes: '/api/', excludes: [] })

// 自定义相同请求判定规则 (忽略参数差异时比较有用)
merge({ calcRequstHash: (config) => config.url })

// 在请求时, 设置请求将触发重复请求合并策略 (优先级更高)
request.post('/api/xxx', {}, { merge: true })

// 单个请求设置不同的触发延时
request.post('/api/xxx', {}, { merge: { delay: 1000 } })
```

##### retry

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { retry } from 'axios-plugins/plugins/retry'

const request = axios.create({})
/** 配置 */
// 基础使用 (必须设置重试次数)
useAxiosPlugin(request).plugin(retry({ max: 3 }))

// 设置哪些请求失败后将重试 (不建议设置这个option, 建议在请求时指定retry参数)
retry({ includes: [], excludes: [] })

// 自定义失败请求检查方法 (不建议设置这个option, 建议在添加一个 `axios.interceptors` 或 `transform()` 插件来判断响应结果)
retry({ isExceptionRequest: (config) => false })

// 在请求时, 设置请求将触发防抖策略 (优先级更高)
request.post('/api/xxx', {}, { retry: 3 })
```

##### cancel

> TIP: 如果请求指定了 cancelToken, 将会导致此插件失效.

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { cancel, cancelAll } from 'axios-plugins/plugins/cancel'

const request = axios.create({})
// 添加插件
useAxiosPlugin(request).plugin(cancel())

// > 中止所有在执行的请求
cancelAll(request)
```

#### transform

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { transform } from 'axios-plugins/plugins/transform'

const request = axios.create({})
// 添加插件
useAxiosPlugin(request).plugin(
    transform({
        // + 转换请求参数
        request: (config) => {
            // TODO
            return config
        },
        // + 转换响应参数
        response: (res) => {
            // TODO
            return res
        },
        // + 转换异常信息
        capture: (e) => {
            // TODO
            throw e
        }
    })
)
```

#### cache

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { cache } from 'axios-plugins/plugins/cache'

const request = axios.create({})
// 添加插件
useAxiosPlugin(request).plugin(cache())

// 设置全局缓存失效时间
cache({ expires: Date.now() + 24 * 60 * 60 * 1000 })
// 设置缓存存储位置 (默认: sessionStorage)
cache({ storage: localStorage })
// 设置 storage 中, 缓存cache的字段名
cache({ storageKey: 'axios.cache' })
// 设置自定义的缓存key计算方法
cache({ key: (config) => config.url })

// 请求时, 指定此接口触发响应缓存
request.post('/api', {}, { cache: true })
// 自定义此接口缓存失效时间
request.post('/api', {}, { cache: { expires: Date.now() } })
// 自定义此接口缓存key
request.post('/api', {}, { cache: { key: '/api' } })
```

#### envs

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { envs } from 'axios-plugins/plugins/envs'

const request = axios.create({})
// 添加插件
useAxiosPlugin(request).plugin(
    envs([
        {
            rule: () => process.env.NODE_ENV === 'development',
            config: {
                baseURL: 'http://dev'
            }
        },
        {
            rule: () => process.env.NODE_ENV === 'production',
            config: {
                baseURL: 'http://prod'
            }
        }
    ])
)
```

#### loading

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { loading } from 'axios-plugins/plugins/loading'
import { loading as ElLoading } from 'element-plus'

const request = axios.create({})

let loadingEl
// 添加插件
useAxiosPlugin(request).plugin(
    loading({
        onTrigger: (show) => {
            if (show) {
                loadingEl = ElLoading({
                    lock: true,
                    text: 'Loading',
                    spinner: 'el-icon-loading',
                    background: 'rgba(0, 0, 0, 0.7)'
                })
            } else {
                loadingEl.close()
            }
        }
    })
)
// 自定义显示延时和隐藏延时 (避免频繁显示或隐藏 loading 效果)
loading({ delay: 200, delayClose: 200 })

// 指定请求禁用 loading
request.post('/api', {}, { loading: false })
```

#### logger

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { logger } from 'axios-plugins/plugins/logger'

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(
    logger({
        // 开启 请求参数打印
        request: true,
        // 开启 响应参数打印
        response: true,
        // 开启异常信息打印
        error: true
    })
)

// 自定义打印配置 (参考: https://www.npmjs.com/package/axios-logger)
logger({ config: {} })
```

#### mock

> 建议借助三方工具(如: apifox, apipost 等) 实现 mock 能力

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { mock } from 'axios-plugins/plugins/mock'

const request = axios.create({})

useAxiosPlugin(request).plugin(
    // 添加插件, 并指定mock服务器地址
    mock({ mockUrl: 'http://mock' })
)
// 自定义启用条件 (如果没有使用 webpack, vite 那么此参数是必要的)
mock({ enable: () => false })

// 使用全局mock
const request1 = axios.create({
    mock: true
})

// 按需mock (单个请求mock)
request.post('/api', {}, { mock: true })

// 针对不同接口使用不同的mock服务器
request.post('/api', {}, { mock: { mock: true, mockUrl: 'http://mock1' } })
```

#### normalize

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { normalize } from 'axios-plugins/plugins/normalize'

const request = axios.create({})

useAxiosPlugin(request).plugin(
    normalize({
        // 过滤url
        url: {
            // 过滤url中, 重复的 `//`, 如: `/api/a//b` -> `/api/a/b`
            noDuplicateSlash: true
        },
        // 设置完整的过滤参数
        data: {
            /** 过滤 null 值 */
            noNull: true,
            /** 过滤 undefined 值 */
            noUndefined: true,
            /** 过滤 nan */
            noNaN: true,
            /** 是否对对象进行递归 */
            deep: true
        },
        // 设置仅过滤 undefined
        params: true
    })
)
```

### pathParams

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { pathParams } from 'axios-plugins/plugins/pathParams'

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(pathParams())

// 设置仅从 params 中获取路径参数
pathParams({ form: 'params' })
```

#### sign

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { sign } from 'axios-plugins/plugins/sign'

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(sign({}))

// 设置签名生成参数
sign({
    // 签名字段
    key: 'sign',
    // 签名算法
    algorithm: 'md5',
    // 禁用参数排序
    sort: false,
    // 禁用过滤空值
    filter: false,
    // 加盐
    salt: 'xxxxx'
})
```

#### sentryCapture

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { sign } from 'axios-plugins/plugins/sign'
import * as sentry from '@sentry/browser' // or @sentry/vue or @sentry/react ...

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(sentryCapture({ sentry }))
```

#### onlySend

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { onlySend } from 'axios-plugins/plugins/onlySend'

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(onlySend())

// 设置浏览器不支持 `navigator.sendBeacon` api时报错
onlySend({ noSupport: 'error' })
```

#### mp

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { mp } from 'axios-plugins/plugins/mp'

const request = axios.create({})

// 添加插件
useAxiosPlugin(request).plugin(mp({ env: 'wx' }))

// 指定不同的小程序平台
mp({ env: 'tt' }) // 头条、抖音等等
// 添加请求的公共配置
mp({
    config: {
        /** ... */
    }
})
```

## FAQ

1. 关于单元测试

目前, 核心方法 `useAxiosPlugin`、`utils/*` 相关方法单元测已经编写完成. `plugins/*` 相关的插件实现单元测试我会逐步补全, 这个目标可能需要一段时间去完成.

## 参考及感谢

-   [axios](https://axios-http.com/)
-   [axios-extensions](https://github.com/kuitos/axios-extensions)
-   [alova](https://github.com/alovajs/alova/)
-   [ahooks](https://ahooks.gitee.io/zh-CN/hooks/use-request/index)
-   [axios-logger](https://www.npmjs.com/package/axios-logger)

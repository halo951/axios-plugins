<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> Extend more plugin capabilities (such as debounce and throttle, etc.) for axios with minimal impact.

## Features

-   [Lightweight] The core package size is 1.37kb/gziped, complete package size is 5.88kb/gziped, supports TreeShaking and single plugin reference.
-   [Multiple instance support] Plugin cache variables are associated with axios instances, and multiple axios instances do not interfere with each other.
-   [Low intrusiveness] Plugins are extended by wrapping, without affecting the existing configuration of the instance, and without destroying the api of axios.
-   [Low integration cost] Compared with other plugins, there is no need to make a lot of changes to integrate the plugin, and there is no learning cost.
-   [Rich plugin selection] Compared with other plugins based on `axios.interceptors`, this library provides more diversified plugin options.
-   [Extendable] Provides the `IPlugin` interface, which only needs to follow the interface specification to extend more plugin capabilities on its own.

## Usage

-   install

```bash
yarn add axios axios-adapters
# or
npm install axios axios-adapters
```

-   use plugin

```typescript
import axios from 'axios'
import { useAxiosPlugin, mock, loading } from 'axios-plugins'

// 1. create axios instance
export const request = axios.create({
    /* ... */
})

// 2. append plugin support

useAxiosPlugin(axios) // default axios
// or
useAxiosPlugin(request) // new instance

// 3. use plugin

useAxiosPlugin(axios).plugin(mock())

// 4. Example: use plugin extension parameters during the request process

request.post('/api', {}, { mock: true })

// 5. If you need to use 'request()' to request, then you need to use the 'wrap()' method to overwrite the original instance
const request2 = useAxiosPlugin(request).wrap()
```

-   on need import

```typescript
import axios from 'axios'
// + Modify the dependency import to the following way
import { useAxiosPlugin } from 'axios-plugins/core'
import { loading } from 'axios-plugins/plugins/loading'

// 1. create axios instance
export const request = axios.create({
    /* ... */
})

// 2. use plugin
useAxiosPlugin(request).plugin(loading())
```

## Plugins

| Plugin                | Description                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [debounce](#debounce) | When duplicate requests are made within a certain time, the later request will wait for the last request to complete before executing          |
| [throttle](#throttle) | When duplicate requests are made within a certain time, the later request will be discarded                                                    |
| [merge](#merge)       | When duplicate requests are made within a certain time, the requests will only be made once, and each requester will receive the same response |
| retry                 | When a request fails (errors), retry n times. If all retries fail, an exception will be thrown                                                 |
| cancel                | Provides `cancelAll()` method to cancel all ongoing requests                                                                                   |
| cache                 | Stores the response content of the request and returns it for the next request (within cache expiration time)                                  |
| envs                  | Normalizes axios environment configuration tool                                                                                                |
| loading               | Provides a unified control capability for global loading to reduce the workload of independent loading control for each loading method         |
| logger                | Custom request process log printing                                                                                                            |
| mock                  | Provides global or single interface request mock capability                                                                                    |
| normalize             | Filters out undefined, null, and other parameters generated during the request process                                                         |
| pathParams            | Expands support for Restful API specification of route parameters                                                                              |
| sign                  | Provides request anti-tampering capability. This feature requires collaboration with backend logic implementation                              |
| sentryCapture         | Extension `Sentry.captureException` implementation                                                                                             |
| onlySend              | Provides a wrapper method for `navigator.sendBeacon` to submit embedded data when the page is exited. This requires backend support            |
| mp                    | Expands support for network requests from small programs (WeChat, Toutiao, QQ, etc.) and cross-platform frameworks (uni-app, taro)             |

## Example

#### debounce

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { debounce } from 'axios-plugins/plugins/debounce'

const request = axios.create({})

// add plugin
useAxiosPlugin(request).plugin(debounce())

// set delay judgment time
debounce({ delay: 200 })

// set filter pattern
debounce({ includes: '/api/', excludes: [] })

// set duplicate request determination method
debounce({ calcRequstHash: (config) => config.url })

// on execute request, set higher priority judgment criteria
request.post('/api/xxx', {}, { debounce: true })

// set different delay judgment times
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

// set delay judgment time
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

// set different delay judgment times
request.post('/api/xxx', {}, { throttle: { delay: 1000 } })
// in request, set capture throttle handle rule
request.post('/api/xxx', {}, { throttle: { giveUp: GiveUpRule.cancel } })
// 单个请求设置触发节流后抛出的异常消息
request.post('/api/xxx', {}, { throttle: { throttleErrorMessage: 'xxxxx' } })
```

#### merge

```typescript
import { useAxiosPlugin } from 'axios-plugin/core'
import { merge } from 'axios-plugins/plugins/merge'

const request = axios.create({})
/** 配置 */
// 基础使用
useAxiosPlugin(request).plugin(merge())

// set delay judgment time
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

## Thanks

-   [axios](https://axios-http.com/)
-   [axios-extensions](https://github.com/kuitos/axios-extensions)
-   [alova](https://github.com/alovajs/alova/)
-   [ahooks](https://ahooks.gitee.io/zh-CN/hooks/use-request/index)

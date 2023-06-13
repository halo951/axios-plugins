<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> Extend more plugin capabilities (such as debounce and throttle, etc.) for axios with minimal impact.

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

## Plugins

| Plugin     | Description                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| debounce   | When duplicate requests are made within a certain time, the later request will wait for the last request to complete before executing          |
| throttle   | When duplicate requests are made within a certain time, the later request will be discarded                                                    |
| merge      | When duplicate requests are made within a certain time, the requests will only be made once, and each requester will receive the same response |
| retry      | When a request fails (errors), retry n times. If all retries fail, an exception will be thrown                                                 |
| cancel     | Provides `cancelAll()` method to cancel all ongoing requests                                                                                   |
| cache      | Stores the response content of the request and returns it for the next request (within cache expiration time)                                  |
| envs       | Normalizes axios environment configuration tool                                                                                                |
| loading    | Provides a unified control capability for global loading to reduce the workload of independent loading control for each loading method         |
| logger     | Custom request process log printing                                                                                                            |
| mock       | Provides global or single interface request mock capability                                                                                    |
| normalize  | Filters out undefined, null, and other parameters generated during the request process                                                         |
| pathParams | Expands support for Restful API specification of route parameters                                                                              |
| sign       | Provides request anti-tampering capability. This feature requires collaboration with backend logic implementation                              |
| onlySend   | Provides a wrapper method for `navigator.sendBeacon` to submit embedded data when the page is exited. This requires backend support            |
| mp         | Expands support for network requests from small programs (WeChat, Toutiao, QQ, etc.) and cross-platform frameworks (uni-app, taro)             |

## Thanks

-   [axios](https://axios-http.com/)
-   [axios-extensions](https://github.com/kuitos/axios-extensions)
-   [alova](https://github.com/alovajs/alova/)
-   [ahooks](https://ahooks.gitee.io/zh-CN/hooks/use-request/index)

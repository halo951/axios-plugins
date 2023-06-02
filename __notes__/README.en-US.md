# axios-adapters

<p align="center"><a href="./README.md">中文</a> | <a href="./README.en-US.md">English</a></p>

> Extend more plugin capabilities (such as debounce and throttle, etc.) for axios with minimal impact.

## Usage

-   install

```bash
yarn add axios axios-adapters
# or
npm install axios axios-adapters
```

-   configure

```typescript
import axios from 'axios'
import { debounce, logger } from 'axios-adapters'

export const request = axios.create({
    baseURL: '',
    headers: {},
    adapter: [
        // following the axios adapter interface convention, supporting  use the combination of multiple adapters
        debounce({
            /* ... */
        }),
        logger({
            /* ... */
        })
        // ...
    ]
})
```

## adapters

| Category | Name      | Description                                                                                                                                                            |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Process  | debounce  | Debounce delays the requests sent within a period of time. The last request is executed only after the previous one is completed.                                      |
| Process  | throttle  | Throttle rejects the repeated requests sent within a period of time so that only one request can be sent at a time.                                                    |
| Process  | merge     | Merge sends only one request for multiple identical requests within a period of time, and the request results are returned to different users respectively.            |
| Process  | retry     | Retry retries n times when the request fails (errors), and throws an exception when all attempts fail.                                                                 |
| Process  | interrupt | Interrupt specifies when to terminate a request, which is generally used to terminate incomplete requests when the page is switched.                                   |
| Process  | offline   | Offline provides weak network environment. When the network is poor or the page is terminated or exited, the incomplete requests are replayed on the next page access. |
| Process  | queue     | Queue is used to limit certain interfaces. Through the consumption of requests one by one with certain conditions, the requests are made.                              |
| Tool     | logger    | Customizing the logging process of requests.                                                                                                                           |
| Tool     | mock      | Mock provides global or single interface request mocking capabilities.                                                                                                 |
| Tool     | loading   | Loading provides unified control capabilities for global loading, reducing the workload of independent loading control for each loading method.                        |
| Tool     | sign      | Sign provides request tampering prevention capabilities; this feature needs to be implemented in conjunction with backend logic.                                       |
| Tool     | onlySend  | Encapsulation of the navigator.sendBeacon method to implement the submission of buried point data when the page is left, but this requires backend support.            |

## Example

-   接口
-   参数
-   使用场景
-   使用方式

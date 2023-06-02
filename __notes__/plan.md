# 使用 axios + axios-plugins + apifox + apifox-generator 管理前端接口请求

## 优势

-   过程托管

-   自动化

-   类型提示

    常规的接口对接, 不论是在 组件内调用接口还是单独抽象出来

## 现有项目改造

1. 添加插件支持

```typescript
import axios from 'axios'
import { useAxiosPlugin, mock } from 'axios-plugins'

export const request = axios.create({}) // 原有逻辑可以保持不变

// + 添加插件
useAxiosPlugin(request).plugin(
    mock({
        /* ... */
    })
)
```

2. 完善 `apifox` 接口文档

-   目录结构
-   参数
-   响应
-   快速添加

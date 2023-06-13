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

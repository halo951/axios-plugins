import {
    type AxiosInstance,
    type AxiosResponse,
    type AxiosRequestConfig,
    type AxiosInterceptorManager,
    type InternalAxiosRequestConfig,
    Axios,
    AxiosDefaults
} from 'axios'
import type { AxiosInstanceExtension, IHooksShareOptions, IPlugin, ISharedCache } from './intf'
import { klona } from 'klona'

/** 触发钩子函数 */
const emitHooks = () => {}

/**
 * Axios 实例扩展
 *
 * @description
 *  由于 axios 实例由 `function wrap()` 包裹, 无法直接修改对象属性。
 *  所有这里想了一个hacker的方法, 通过继承的方式, 扩展 Axios 类, 然后通过 `Object.defineProperties` 映射当前axios实例到插件扩展的实例上,
 *  从而实现扩展 axios 属性的效果
 */
class AxiosExtension extends Axios {
    /** 添加的插件集合 */
    __plugins__: Array<IPlugin> = []
    /** 插件共享内存空间 */
    __shared__: ISharedCache = {}

    constructor(
        config: AxiosDefaults,
        interceptors: {
            request: AxiosInterceptorManager<InternalAxiosRequestConfig>
            response: AxiosInterceptorManager<AxiosResponse>
        }
    ) {
        super(config as AxiosRequestConfig)
        // 继承原实例的适配器
        this.interceptors = interceptors
        // 覆盖(扩展) `request` 成员方法
        const originRequest = this.request
        const vm = this

        /** 判断是否存在钩子 */
        const hasHook = <K extends keyof IPlugin['lifecycle']>(hookName: K): boolean => {
            return !!this.__plugins__.find((plug) => plug.lifecycle && plug.lifecycle[hookName])
        }

        /** 触发钩子函数 */
        const runHook = async <K extends keyof IPlugin['lifecycle'], T>(
            hookName: K,
            arg1: T,
            arg2: unknown
        ): Promise<T> => {
            for (const plug of this.__plugins__) {
                const hook = plug.lifecycle && plug.lifecycle[hookName]
                if (typeof hook === 'function') {
                    arg1 = await hook.call(hook, arg1, arg2)
                } else if (typeof hook === 'object') {
                    if (hook.runWhen.call(hook.runWhen, arg1, arg2)) {
                        arg1 = await hook.handler.call(hook, arg1, arg2)
                    }
                }
            }
            return arg1
        }
        this.request = async function (config) {
            let response: AxiosResponse
            let origin: AxiosRequestConfig
            let shareOptions: IHooksShareOptions
            try {
                // @ 备份请求参数
                origin = klona(config)
                // @ 拼接请求过程共享数据
                shareOptions = { origin: origin, shared: this.__shared__ }
                // # 添加前置钩子 (预处理请求内容)
                config = await runHook('preRequestTransform', config, shareOptions)
                // > 执行
                response = await originRequest.call(vm, config)
                // # 添加后置钩子
                response = await runHook('postResponseTransform', response, shareOptions)
                return response as any
            } catch (e) {
                // ? 如果添加了捕获异常钩子, 那么当钩子函数 `return void` 时, 将返回用户原始响应信息
                // 否则应通过 `throw error` 直接抛出异常或 `return error` 触发下一个 `captureException` 钩子
                if (hasHook('captureException')) {
                    // # 添加捕获异常钩子 (运行后直接抛出异常)
                    return await runHook('captureException', e, shareOptions)
                }
                throw e
            } finally {
                // # 添加(请求完成)后置钩子
                await runHook('completed', shareOptions, undefined)
            }
        }

        // > 添加拦截器
        // [TIPS]
        //  1. 由于 `axios` 的拦截器功能仅允许 push, 此时的 `transformRequest`, `transformResponse` 钩子可能获取到的不是原始的参数或者响应
        //  2. 如果插件需要使用原始参数、响应 信息, 需要提示用户移除现有拦截器, 并通过插件来扩展其他能力
        //  3. `axios-plugins` 中是不会去处理已有拦截器执行过程异常, 但这些异常或者插件错误可以通过 `captureException` 钩子捕获
        this.interceptors.request.use((config) => {
            return runHook('transformRequest', config, this.__shared__)
        }, null)
        this.interceptors.response.use((response) => {
            return runHook('transformResponse', response, this.__shared__)
        }, null)
    }
}

/** 定义忽略映射的类属性 */
export const IGNORE_COVERAGE: ReadonlyArray<string> = ['prototype']

/** 向 axios 实例注入插件生命周期钩子 */
const injectPluginHooks = (axios: AxiosInstance | AxiosInstanceExtension): void => {
    // ? 如果 axios 实例已经调用了 `useAxiosPlugin()`, 那么不需要重复注入
    if (axios['__plugins__']) {
        return
    }
    // @ 实例化扩展类
    const extension = new AxiosExtension(axios.defaults, axios.interceptors)
    // > 通过 `defineProperties` 将当前实例的请求映射到扩展类的方法上, 从而实现扩展的效果
    const properties = Object.getOwnPropertyNames(axios)
        .concat(['__shared__', '__plugins__'])
        .filter((prop: string) => extension[prop] && !IGNORE_COVERAGE.includes(prop))
        .reduce((properties: PropertyDescriptorMap, prop: string) => {
            properties[prop] = {
                get() {
                    return extension[prop]
                },
                set(v) {
                    extension[prop] = v
                }
            }
            return properties
        }, {})
    // 映射
    Object.defineProperties(axios, properties)
}

/** 插件能力注入 */
const injectPlugin = (axios: AxiosInstanceExtension, plug: IPlugin): void => {
    // @ 插件排序
    const soryByEnforce = (plugins: Array<IPlugin>): Array<IPlugin> => {
        return plugins.sort((a, b): number => {
            if (a.enforce === 'pre' || b.enforce === 'post') {
                return -1
            } else if (a.enforce === 'post' || b.enforce === 'pre') {
                return 1
            } else {
                return 0
            }
        })
    }
    // ? 补全插件必要属性
    if (!plug.lifecycle) plug.lifecycle = {}
    // > 挂载插件
    if (axios.__plugins__) {
        // > 添加插件
        axios.__plugins__.push(plug)
        // > 排序
        axios.__plugins__ = soryByEnforce(axios.__plugins__)
    }
}

/**
 * 使用 axios 扩展插件
 *
 * @description 通过链式调用方式, 为 `axios` 扩展插件支持.
 */
export const useAxiosPlugin = (axios: AxiosInstance) => {
    // > 注入插件钩子
    injectPluginHooks(axios)
    return {
        /** 添加新插件 */
        plugin(plug: IPlugin): typeof this {
            // > 注册插件前检查 (如果需要)
            plug.beforeRegister?.(axios as AxiosInstanceExtension)
            // > 挂载插件
            injectPlugin(axios as AxiosInstanceExtension, plug)
            return this
        },
        /**
         * 替换`axios`包装
         *
         * @description 如果使用的有 `axios({ ... })` 方式调用接口, 那么需要通过
         */
        wrap(): AxiosInstance {
            return new Proxy(axios, {
                apply(_target, _thisArg, args: Array<any>) {
                    return axios.request.call(axios, args[0])
                }
            })
        }
    }
}

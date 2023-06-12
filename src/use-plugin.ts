import {
    type AxiosInstance,
    type AxiosResponse,
    type AxiosRequestConfig,
    type AxiosInterceptorManager,
    type InternalAxiosRequestConfig,
    Axios,
    AxiosDefaults
} from 'axios'
import type { AxiosInstanceExtension, ILifecycleHookObject, IPlugin, ISharedCache } from './intf'
import { klona } from 'klona'
import { AbortChainController, createAbortChain } from './utils/create-abort-chain'

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

        /** 获取钩子函数 */
        const getHook = <K extends keyof IPlugin['lifecycle']>(hookName: K) => {
            return this.__plugins__
                .filter((plug) => !!plug.lifecycle[hookName])
                .map((plug) => {
                    const hook: IPlugin['lifecycle'][K] = plug.lifecycle[hookName]
                    if (typeof hook === 'function') {
                        return {
                            runWhen: () => true,
                            handler: hook
                        } as ILifecycleHookObject<any>
                    } else {
                        return hook as ILifecycleHookObject<any>
                    }
                })
        }

        /** 是否存在钩子 */
        const hasHook = <K extends keyof IPlugin['lifecycle']>(hookName: K): boolean => {
            return getHook(hookName).length > 0
        }

        /** 触发钩子函数 */
        const runHook = async <K extends keyof IPlugin['lifecycle'], T>(
            hookName: K,
            arg1: T,
            arg2: unknown,
            arg3: AbortChainController
        ): Promise<T> => {
            for (const hook of getHook(hookName)) {
                if (hook.runWhen.call(hook.runWhen, arg1, arg2)) {
                    arg1 = await hook.handler.call(hook, ...(arg2 ? [arg1, arg2, arg3] : [arg1, arg3]))
                }
            }
            return arg1
        }

        this.request = async function <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) {
            const origin: AxiosRequestConfig<D> = klona(config)
            const share = { origin, shared: this.__shared__ }
            return await createAbortChain(config)
                .next((config, controller) => runHook('preRequestTransform', config, share, controller))
                .next((config) => <PromiseLike<R>>originRequest.call(vm, config))
                .next((response, controller) => runHook('postResponseTransform', response, share, controller))
                .capture(async (e, controller) => {
                    // ? 如果添加了捕获异常钩子, 那么当钩子函数 `return void` 时, 将返回用户原始响应信息
                    // 否则应通过 `throw error` 直接抛出异常或 `return error` 触发下一个 `captureException` 钩子
                    if (hasHook('captureException')) {
                        // # 添加捕获异常钩子 (运行后直接抛出异常)
                        return await runHook('captureException', e, share, controller)
                    } else {
                        throw e
                    }
                })
                .completed(
                    (controller) => runHook('completed', share, undefined, controller) as unknown as Promise<void>
                )
                .done()
        }
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
         * 包装 `axios({ ... })`
         *
         * @description 使 `axiox({ ... })` 具备插件能力
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

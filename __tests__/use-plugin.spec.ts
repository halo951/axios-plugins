import * as nock from 'nock'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import { IPlugin, useAxiosPlugin } from '../src'
import { IGNORE_COVERAGE } from '../src/use-plugin'
import { ISharedCache } from '../src/intf'

describe('测试 `useAxiosPlugin()`', () => {
    const BASE_URL: string = 'http://test'

    beforeAll(() => {
        const server = nock(BASE_URL)
        server.get('/case').reply(200).persist()
        server.post('/case').reply(200).persist()
        server.put('/case').reply(200).persist()
        server.head('/case').reply(200).persist()
        server.patch('/case').reply(200).persist()
        server.merge('/case').reply(200).persist()
        server.delete('/case').reply(200).persist()
        server.options('/case').reply(200).persist()
        server.get('/success').reply(200, { result: 'success' }).persist()
        server.get('/failure').reply(500).persist()
        axios.defaults.baseURL = BASE_URL
    })

    test('case -  `useAxiosPlugin()` 返回结果应包含 `plugin()`, `wrap()` 两个方法', () => {
        const request = axios.create({})
        const plugin = useAxiosPlugin(request)
        expect(plugin).toHaveProperty('plugin')
        expect(plugin).toHaveProperty('wrap')
    })

    test('case -  调用 `useAxiosPlugin()` 后, 映射的 `AxiosException` 扩展实例应继承原有实例的配置', () => {
        const request = axios.create({
            baseURL: 'http://haha',
            method: 'post'
        })
        const requestInterceptors = (config) => config
        const responseInterceptors = (response) => response
        const captureAxiosError = (err) => err
        request.interceptors.request.use(requestInterceptors, captureAxiosError)
        request.interceptors.response.use(responseInterceptors, captureAxiosError)
        const oldInterceptors = { ...request.interceptors }
        useAxiosPlugin(request)
        expect(request.defaults.baseURL).toBe('http://haha')
        expect(request.defaults.method).toBe('post')
        expect(oldInterceptors).toEqual(request.interceptors)
    })

    test('case -  调用 `useAxiosPlugin()` 后, Axios 实例除了禁止覆盖属性外, 其他属性应映射到扩展类', () => {
        const request = axios.create({})
        useAxiosPlugin(request)
        const refer = new axios.Axios({})
        for (const key of Object.getOwnPropertyNames(refer)) {
            // 检查映射的属性是否存在
            expect(request[key]).not.toBeUndefined()
            // ? 如果忽略映射的属性, 应保持原样
            if (IGNORE_COVERAGE.includes(key)) {
                expect(Object.getOwnPropertyDescriptor(request, key)?.writable).toBeTruthy()
            } else {
                // 否则, 检查属性是否是映射过的属性
                expect(Object.getOwnPropertyDescriptor(request, key)?.writable).toBeUndefined()
                expect(Object.getOwnPropertyDescriptor(request, key)?.get).toBeTruthy()
            }
        }
    })

    test('case - `useAxiosPlugin()` 调用后, axios 扩展属性类型应当是正确的', async () => {
        const request = axios.create({})
        useAxiosPlugin(request)
        expect(request['__plugins__']).toEqual([])
        expect(request['__shared__']).toEqual({})
        // 校验 getter/setter 方法是否齐全
        const __plugins__ = Object.getOwnPropertyDescriptor(request, '__plugins__')
        const __shared__ = Object.getOwnPropertyDescriptor(request, '__shared__')
        expect(__plugins__?.get).toBeTruthy()
        expect(__plugins__?.set).toBeTruthy()
        expect(__shared__?.get).toBeTruthy()
        expect(__shared__?.set).toBeTruthy()
    })

    test('case - 调用 `useAxiosPlugin().wrap()` 后, 原有的`function wrap()` 应当被覆盖', () => {
        const request = axios.create({})
        const req2 = useAxiosPlugin(request).wrap()
        expect(typeof req2 === 'function').toBeTruthy()
        expect(request).not.toBe(req2)
    })

    test('case - 调用 `useAxiosPlugin().plug()`, 插件可以正常注册', () => {
        const request = axios.create({})
        const plug1: IPlugin = { name: 'plug1' }
        const plug2: IPlugin = { name: 'plug2' }
        useAxiosPlugin(request).plugin(plug1).plugin(plug2)
        expect(request['__plugins__']).toEqual([plug1, plug2])
    })
    test('case - 当插件注册后, `beforeRegister()` 将被触发一次', () => {
        const request = axios.create({})
        const plug: IPlugin = {
            name: 'plug',
            beforeRegister: jest.fn()
        }
        useAxiosPlugin(request).plugin(plug)
        expect(plug.beforeRegister).toHaveBeenCalled()
    })
    test('case - 如果插件指定了不允许重复注册, 那么当重复注册时抛出异常', () => {
        const request = axios.create({})
        const plug: IPlugin = {
            name: 'plug',
            beforeRegister(axios) {
                if (axios.__plugins__.includes(plug)) {
                    throw new Error('插件被重复注册了')
                }
            }
        }
        expect(() => useAxiosPlugin(request).plugin(plug).plugin(plug)).toThrowError('插件被重复注册了')
    })

    test('case - 如果指定了 `enforce`, 那么插件应该按照正确顺序排序', () => {
        const request = axios.create({})
        const plug1: IPlugin = { name: 'plug1' }
        const plug2: IPlugin = { name: 'plug2' }
        const plug3: IPlugin = { name: 'plug3', enforce: 'post' }
        const plug4: IPlugin = { name: 'plug4', enforce: 'pre' }
        const plug5: IPlugin = { name: 'plug5' }
        useAxiosPlugin(request).plugin(plug1).plugin(plug2).plugin(plug3).plugin(plug4).plugin(plug5)
        expect(request['__plugins__']).toEqual([plug4, plug1, plug2, plug5, plug3])
    })

    test('valid - 验证发起一次请求, 插件是否被触发(任意lifecycle钩子被调用)', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        const request = axios.create({})
        useAxiosPlugin(request).plugin(plug)
        expect(plug.lifecycle).toHaveProperty('completed')
        await request.request({ url: '/case' })
        expect(plug.lifecycle?.completed).toHaveBeenCalled()
    })

    test('valid - 验证发起多次请求, 插件触发次数是否正确', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        const request = axios.create({})
        useAxiosPlugin(request).plugin(plug)
        await request.request({ url: '/case' })
        await request.request({ url: '/case' })
        expect(plug.lifecycle?.completed).toBeCalledTimes(2)
    })

    test('valid - 验证请求失败情况下, 插件是否被正确触发', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        const request = axios.create({})
        useAxiosPlugin(request).plugin(plug)
        let capture: boolean = false
        try {
            await request.request({ url: '/failure' })
        } catch (error) {
            capture = true
        } finally {
            expect(capture).toBeTruthy()
            expect(plug.lifecycle?.completed).toBeCalledTimes(1)
        }
    })

    test('valid - 验证多种方式发起请求, 插件是否被正确触发', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        const request = axios.create({})
        useAxiosPlugin(request).plugin(plug)
        await request.request({ url: '/case' })
        await request.get('/case')
        await request.delete('/case')
        await request.head('/case')
        await request.options('/case')
        await request.post('/case')
        await request.put('/case')
        await request.patch('/case')
        await request.postForm('/case')
        await request.putForm('/case')
        await request.patchForm('/case')
        expect(plug.lifecycle?.completed).toBeCalledTimes(11)
    })
    test('valid - 验证 wrap() 函数包装后, 插件是否被正确触发', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        const req = axios.create({ baseURL: BASE_URL })
        const request: AxiosInstance = useAxiosPlugin(req).plugin(plug).wrap()
        await request({ url: '/case' })
        await request.request({ url: '/case' })
        await request.get('/case')
        await request.post('/case')
        expect(plug.lifecycle?.completed).toBeCalledTimes(4)
    })

    test('valid - 验证请求过程中, 插件的钩子是否被正确触发', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform: jest.fn((arg0: any) => arg0),
                postResponseTransform: jest.fn((arg0: any) => arg0),
                completed: jest.fn()
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        await request.get('/success')
        expect(plug.lifecycle?.preRequestTransform).toBeCalledTimes(1)
        expect(plug.lifecycle?.postResponseTransform).toBeCalledTimes(1)
        expect(plug.lifecycle?.completed).toBeCalledTimes(1)
    })

    test('valid - 验证请求过程中, 插件的钩子触发顺序是否正确', async () => {
        let step: number = 0
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform: (config) => {
                    step++
                    expect(step).toBe(1)
                    return config
                },
                postResponseTransform: (response) => {
                    step++
                    expect(step).toBe(2)
                    return response
                },
                completed: () => {
                    step++
                    expect(step).toBe(3)
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        await request.get('/success')
    })

    test('valid - 验证请求过程中, 插件的钩子获取到的参数是否正确', async () => {
        /** 验证原始参数 */
        const checkConfigValue = (origin: AxiosRequestConfig) => {
            expect(origin.url).toBe('/success')
            expect(origin.data).toEqual({ a: 1 })
        }
        let ss: Array<unknown> = []
        /** 验证共享内存指针唯一性 */
        const checkShared = (shared: ISharedCache): void => {
            for (const s of ss) expect(s).toBe(shared)
            ss.push(shared)
        }
        /** 验证 origin 是从 config 上复制的 */
        const originIsCopyed = (config: AxiosRequestConfig, origin: AxiosRequestConfig) => {
            // origin 为 config 的备份结果
            // config 与 origin 指针不同, 值相同
            expect(config).not.toBe(origin)
            expect(config).toEqual(origin)
        }
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform: (config, { shared, origin }) => {
                    checkConfigValue(config)
                    checkConfigValue(origin)
                    originIsCopyed(config, origin)
                    checkShared(shared)
                    return config
                },
                postResponseTransform: (response, { shared, origin }) => {
                    checkConfigValue(origin)
                    checkShared(shared)
                    expect(response.config.url).toBe('/success')
                    return response
                },
                completed: ({ shared, origin }) => {
                    checkConfigValue(origin)
                    checkShared(shared)
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        await request.get('/success', { data: { a: 1 } })
    })

    test('valid - 验证请求失败情况下, `captureException` 钩子函数是否被正确触发', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                captureException: jest.fn((e) => {
                    throw e
                }),
                completed: jest.fn()
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        // 捕获请求异常
        await expect(request.get('/failure')).rejects.toThrow(AxiosError)
        expect(plug.lifecycle?.captureException).toBeCalledTimes(1)
        expect(plug.lifecycle?.completed).toBeCalledTimes(1)
        expect(plug.lifecycle?.preRequestTransform).toBeCalledTimes(0)
        expect(plug.lifecycle?.postResponseTransform).toBeCalledTimes(0)
    })
    test('valid - 验证请求失败情况下, `captureException` 钩子异常处理行为是否符合预期', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                captureException: (e, { origin }) => {
                    const { n } = origin.params
                    switch (n) {
                        case 1:
                            return e
                        case 2:
                            throw e
                        case 3:
                            break
                    }
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        // 捕获请求异常
        await expect(request.get('/failure', { params: { n: 1 } })).resolves.toThrow(AxiosError)
        await expect(request.get('/failure', { params: { n: 2 } })).rejects.toThrow(AxiosError)
        await expect(request.get('/failure', { params: { n: 3 } })).resolves.toBeUndefined()
    })

    test('valid - 验证插件执行过程出错, `captureException` 钩子能否正确捕获异常', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                captureException: (e, { origin }) => {
                    const { n } = origin.params
                    switch (n) {
                        case 1:
                            return e
                        case 2:
                            throw e
                        case 3:
                            break
                    }
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        // 捕获请求异常
        await expect(request.get('/failure', { params: { n: 1 } })).resolves.toThrow(AxiosError)
        await expect(request.get('/failure', { params: { n: 2 } })).rejects.toThrow(AxiosError)
        await expect(request.get('/failure', { params: { n: 3 } })).resolves.toBeUndefined()
    })

    test('other - 冗余检查, 重复触发 `useAxiosPlugin()` 仅触发一次 `injectPluginHooks()`', () => {
        const request = axios.create({})
        const plug: IPlugin = { name: 'plug' }
        useAxiosPlugin(request).plugin(plug)
        expect(request['__plugins__']).toEqual([plug])
        useAxiosPlugin(request)
        expect(request['__plugins__']).toEqual([plug])
    })

    test('other - `useAxiosPlugin()` 插件扩展属性应被隔离, `axios.create()` 创建的新实例不继承插件属性', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        useAxiosPlugin(axios).plugin(plug)
        const request = axios.create({})
        // 1. 扩展属性不应存在
        expect(request['__plugins__']).toBeUndefined()
        expect(request['__shared__']).toBeUndefined()
        // 2. 类成员变量应保持原样, 而不是扩展的 getter/setter (用 request 方法实验)
        expect(Object.getOwnPropertyDescriptor(request, 'request')?.writable).toBeTruthy()
        await request.get('/case')
        // 3. 检查插件生命周期时间有没有被触发
        expect(plug.lifecycle?.completed).not.toHaveBeenCalled()
    })

    test('other - `useAxiosPlugin()` 插件扩展属性应被隔离, 不受继承影响', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                completed: jest.fn()
            }
        }
        useAxiosPlugin(axios).plugin(plug)
        const request = new axios.Axios({ baseURL: BASE_URL })
        // 1. 扩展属性不应存在
        expect(request['__plugins__']).toBeUndefined()
        expect(request['__shared__']).toBeUndefined()
        await request.get('/case')
        // 2. 检查插件生命周期时间有没有被触发
        // TIPS: 由于 function wrap() 包裹的关系, 无法通过 `Object.getOwnPropertyDescriptor` 获取新实例是否被影响
        // 这里通过插件的钩子是否被处罚, 来验证是否存在影响
        expect(plug.lifecycle?.completed).not.toHaveBeenCalled()
    })
})

describe('测试 `IPlugin` 钩子组合特性', () => {
    const BASE_URL: string = 'http://test'
    beforeAll(() => {
        const server = nock(BASE_URL)
        server.post('/case1').delay(200).reply(200, { result: 'success' }).persist()
        server.post('/case2').query({ a: 123 }).reply(200, { result: 'success' }).persist()
        server.post('/case3').reply(200, { result: 'failure', message: '请求出错' }).persist()
        axios.defaults.baseURL = BASE_URL
    })
    test('case - 组合锁机制', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform(config, { origin, shared }) {
                    if (!shared['plug']) {
                        shared.plug = {}
                    }
                    const key: string = origin.url as string
                    // ? 如果重复请求,
                    if (shared.plug[key]) {
                        throw new Error('lock')
                    }
                    shared.plug[key] = true
                    return config
                },
                completed({ origin, shared }) {
                    const key: string = origin.url as string
                    delete shared.plug[key]
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        // req 1
        request.post('/case1').then(() => {
            // req 3
            expect(() => request.post('/case1')).not.toThrowError()
        })
        // req 2
        expect(() => request.post('/case1')).rejects.toThrowError('lock')
    })

    test('case - 累加、累减', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform(config, { shared }) {
                    if (!shared['plug']) {
                        shared.plug = 0
                    }
                    shared.plug++
                    return config
                },
                completed({ shared }) {
                    shared.plug--
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        await axios.all([
            //
            request.post('/case1'),
            request.post('/case1'),
            request.post('/case1')
        ])
        expect(request['__shared__'].plug).toBe(0)
    })

    test('case - 修改请求参数', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                preRequestTransform(config) {
                    // 修改请求参数使请求成功
                    config.params = { a: 123 } as any
                    return config
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        const res = await request.post('/case2')
        expect(res).toHaveProperty('data', { result: 'success' })
    })
    test('case - 修改响应结果', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                postResponseTransform(res) {
                    return {
                        ...res,
                        data: {
                            replaced: true
                        }
                    }
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        const res = await request.post('/case1')
        expect(res.data).toEqual({ replaced: true })
    })
    test('case - 根据响应内容判断响应结果', async () => {
        const plug: IPlugin = {
            name: 'plug',
            lifecycle: {
                postResponseTransform(res) {
                    if (res.data.result === 'failure') {
                        throw new Error('请求出错')
                    }
                    return res
                }
            }
        }
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(plug)
        expect(request.post('/case3')).rejects.toThrow(new Error('请求出错'))
    })
})

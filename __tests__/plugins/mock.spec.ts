import axios from 'axios'
import * as nock from 'nock'
import { useAxiosPlugin, mock, IPlugin } from '../../src'

describe('测试插件: `mock`', () => {
    const BASE_URL: string = 'http://test1'
    const MOCK_URL: string = 'http://test2'

    beforeAll(() => {
        nock(BASE_URL).get('/case').reply(200, { mock: false }).persist()
        nock(MOCK_URL).get('/case').reply(200, { mock: true }).persist()
        nock(MOCK_URL).get('/').reply(200, { mock: true }).persist()
        axios.defaults.baseURL = BASE_URL
    })

    test('case - 未配置 `mockUrl` 时, 注册插件抛出异常', () => {
        const request = axios.create({ baseURL: BASE_URL })
        expect(() => useAxiosPlugin(request).plugin(mock({} as any))).toThrow()
    })

    test('case - 未配置或值为false时, 请求将访问 `BASE_URL`', async () => {
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(mock({ enable: true, mockUrl: MOCK_URL }))
        const res1 = await request.get('/case')
        expect(res1.data).toEqual({ mock: false })
    })

    test('case - 全局mock启用后, 所有请求将都转发到`MOCK_URL`', async () => {
        const request = axios.create({ baseURL: BASE_URL, mock: true })
        useAxiosPlugin(request).plugin(mock({ enable: true, mockUrl: MOCK_URL }))
        const res1 = await request.get('/case')
        expect(res1.data).toEqual({ mock: true })
    })

    test('case - 单个接口mock参数启用后, 这个接口的请求将转发到 `MOCK_URL`, 其他请求将访问 `BASE_URL', async () => {
        const request = axios.create({ baseURL: BASE_URL })
        useAxiosPlugin(request).plugin(mock({ enable: true, mockUrl: MOCK_URL }))
        const res1 = await request.get('/case', { mock: true })
        expect(res1.data).toEqual({ mock: true })
        const res2 = await request.get('/case', { mock: false })
        expect(res2.data).toEqual({ mock: false })
    })

    test('case - 如果指定了mock插件启用条件, 那么mock插件将按照插件配置生效', async () => {
        const request = axios.create({ baseURL: BASE_URL, mock: true })
        useAxiosPlugin(request).plugin(mock({ enable: true, mockUrl: MOCK_URL }))
        const res1 = await request.get('/case')
        expect(res1.data).toEqual({ mock: true })
    })

    test('case - 如果指定了mock插件启用条件, 那么mock插件将按照插件配置生效', async () => {
        const request = axios.create({ baseURL: BASE_URL, mock: true })
        useAxiosPlugin(request).plugin(mock({ enable: false, mockUrl: MOCK_URL }))
        const res1 = await request.get('/case')
        expect(res1.data).toEqual({ mock: false })
    })

    test('case - 未配置 `url` 发起请求时, 仅替换请求的baseUrl', async () => {
        const plug: IPlugin = {
            name: 'valid',
            lifecycle: {
                transformRequest(config) {
                    if (config.url) {
                        expect(config.baseURL).toBe(BASE_URL)
                    } else {
                        expect(config.baseURL).toBe(MOCK_URL)
                    }
                    return config
                }
            }
        }

        const request = axios.create({ baseURL: BASE_URL, mock: true })
        useAxiosPlugin(request)
            .plugin(mock({ enable: true, mockUrl: MOCK_URL }))
            .plugin(plug)
        await request.get(undefined as any)
        await request.get('/case')
    })

    test('case - 当 url 是全路径时, 替换url的origin部分', async () => {
        const plug: IPlugin = {
            name: 'valid',
            lifecycle: {
                transformRequest(config) {
                    expect(config.url).toBe(MOCK_URL + '/case')
                    return config
                }
            }
        }

        const request = axios.create({ mock: true })
        useAxiosPlugin(request)
            .plugin(mock({ enable: true, mockUrl: MOCK_URL }))
            .plugin(plug)
        await request.get('http://example.com/case')
    })
})

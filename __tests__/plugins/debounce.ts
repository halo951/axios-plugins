import * as nock from 'nock'
import axios, { AxiosInstance } from 'axios'
import { useAxiosPlugin, debounce } from '../../src'

const BASE_URL: string = 'http://test'

beforeEach(() => {
    const server = nock(BASE_URL)
    /** case 1 | 正常请求 */
    server
        .get('/case1')
        // 延时 200ms
        .delay(200)
        // 响应成功
        .reply(200, {
            result: 'success'
        })
        // 允许多次
        .persist()
    /** case 2 | 失败请求 (第一次返回失败, 第二次返回成功) */
    server.get('/case2').once().reply(500, {
        result: 'failure',
        message: '请求失败'
    })
    server.get('/case2').twice().reply(200, {
        result: 'success'
    })
    /** case 3 | 高延迟请求 */
    server
        .get('/case3')
        .delay(2000)
        .reply(200, {
            result: 'success'
        })
        .persist()
    /** case 3 | 低延迟请求 */
    server
        .get('/case4')
        // 响应成功
        .reply(200, {
            result: 'success'
        })
        // 允许多次
        .persist()
})

test('case 1 - 正常请求 (单次请求)', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce())
    // > 执行请求
    const res = await request.get('/case1')
    // > 请求成功
    expect(res.data.result).toBe('success')
})

test('case 2 - 验证防抖锁的有效性', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce())
    let completed: boolean = false
    setTimeout(() => {
        expect(completed).toBe(false)
    }, 2000) // 2s 时, 第一次请求应该完成
    setTimeout(() => {
        expect(completed).toBe(true)
    }, 5000) // 4s 时, 第二次请求应该完成
    // > 执行请求
    request.get('/case3')
    // > 等待第二次请求完成
    await request.get('/case3')
    completed = true
})

test('case 3 - 验证 delay 参数锁的有效性', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 仅对 request 添加插件
    useAxiosPlugin(request).plugin(debounce({ delay: 2000 }))
    let total: number = 0
    setTimeout(() => expect(total).toBe(0), 50)
    setTimeout(() => expect(total).toBe(1), 1000)
    setTimeout(() => expect(total).toBe(2), 2500) // delay 延迟 2000ms, 请求延时(2次) 400ms
    request.get('/case1').then(() => total++) // 模拟请求执行耗时约 200ms ~ 210ms
    request.get('/case1').then(() => total++)
})

test('case 4 - 验证多个接口, 锁是否隔离', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 仅对 request1 添加插件
    useAxiosPlugin(request).plugin(debounce({ delay: 2000 }))
    let start: number = Date.now()
    // test: 两个请求之间互不影响
    await Promise.all([request.get('/case1'), request.get('/case4')])
    expect(Date.now() - start < 300).toBe(true)
})

test('case 5 - 验证多个实例间, 锁是否隔离', async () => {
    const request1 = axios.create({ baseURL: BASE_URL })
    const request2 = axios.create({ baseURL: BASE_URL })
    // 仅对 request1 添加插件
    useAxiosPlugin(request1).plugin(debounce({ delay: 2000 }))
    const execRequest = async (request: AxiosInstance) => {
        await request.get('/case1')
        return Date.now()
    }
    const [res1, res2] = await Promise.all([execRequest(request1), execRequest(request2)])
    // ? 如果两次请求完成时间小于 100ms, 则判定隔离实验通过
    expect(Math.abs(res1 - res2) < 100).toBe(true)
    // 对 request 2 也添加插件
    useAxiosPlugin(request2).plugin(debounce({ delay: 500 }))
    // 再次执行请求
    const [res3, res4] = await Promise.all([execRequest(request1), execRequest(request2)])
    // ? 如果两次请求完成时间小于 1000ms, 则判定隔离实验通过
    expect(Math.abs(res3 - res4) < 1000).toBe(true)
})

test('case 6 - 验证请求成功后, 是否正常清理实例缓存中的锁', async () => {
    // 为了表示顺序执行是正确的, 这里增加一个请求超时时间
    const request = axios.create({ baseURL: BASE_URL, timeout: 1000 })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce())
    // > 第一次请求
    await request.get('/case1')
    // > 第二次请求
    await request.get('/case1')
})

test('case 7 - 验证请求失败后, 是否正常清理实例缓存中的锁', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce())
    let completed: boolean = false
    // > 创建一个定时器, 获取第二次请求是否正常执行
    setTimeout(() => {
        expect(completed).toBe(true)
    }, 500)
    try {
        // > 第一次, 请求失败
        await request.get('/case2')
    } catch (error) {
        // > 第二次请求成功
        await request.get('/case2')
    }
})

test('case 8 - 验证 `include` 过滤器', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce({ includes: ['case1'], delay: 2000 }))
    let total1: number = 0
    let total2: number = 0
    /** case: `include` */
    setTimeout(() => expect(total1).toBe(0), 100) // 第一次请求未完成
    setTimeout(() => expect(total1).toBe(1), 500) // 第一次请求完成, 请求等待时间(200ms)
    setTimeout(() => expect(total1).toBe(2), 2500) // 第二次请求完成, delay(2000ms) + 请求等待时间(200ms * 2)
    /** case: 未设置`includes`接口 */
    setTimeout(() => expect(total2).toBe(2), 100) // 两次请求都完成 (请求等待时间, 0ms)

    request.get('/case1').then(() => total1++)
    request.get('/case1').then(() => total1++)

    request.get('/case4').then(() => total2++)
    request.get('/case4').then(() => total2++)
})

test('case 9 - 验证 `include` 过滤器', async () => {
    const request = axios.create({ baseURL: BASE_URL })
    // 添加插件
    useAxiosPlugin(request).plugin(debounce({ excludes: ['case4'], delay: 2000 }))
    let total1: number = 0
    let total2: number = 0
    /** case: `include` */
    setTimeout(() => expect(total1).toBe(0), 100) // 第一次请求未完成
    setTimeout(() => expect(total1).toBe(1), 500) // 第一次请求完成, 请求等待时间(200ms)
    setTimeout(() => expect(total1).toBe(2), 2500) // 第二次请求完成, delay(2000ms) + 请求等待时间(200ms * 2)
    /** case: 未设置`includes`接口 */
    setTimeout(() => expect(total2).toBe(2), 100) // 两次请求都完成 (请求等待时间, 0ms)

    request.get('/case1').then(() => total1++)
    request.get('/case1').then(() => total1++)

    request.get('/case4').then(() => total2++)
    request.get('/case4').then(() => total2++)
})

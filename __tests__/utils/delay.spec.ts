import { delay, getDelayTime } from '../../src/utils/delay'

describe('测试 `delay()`', () => {
    const expectedDelayTimeSpan: number = 100 // 允许的误差范围 (jest 多任务并行时, 阻塞可能产生问题)
    test('case - 如果不传递延时时间，则默认延时时间为 0', async () => {
        const start = Date.now()
        await delay()
        const end = Date.now()
        expect(end - start).toBeLessThan(expectedDelayTimeSpan)
    })
    test('case - 测试延迟时间是否正确', async () => {
        const startTime = Date.now()
        const delayTime = 500
        await delay(delayTime)
        const endTime = Date.now()
        expect(endTime - startTime).toBeGreaterThan(delayTime - expectedDelayTimeSpan)
        expect(endTime - startTime).toBeLessThan(delayTime + expectedDelayTimeSpan)
    })

    test('case - 测试Promise是否正确resolve', async () => {
        const delayTime = 100
        const result = await delay(delayTime)
        expect(result).toBe(undefined)
    })
})

describe('测试 `getDelayTime()`', () => {
    test('case - 当没有传入任何参数时，应该返回默认的延时时间', () => {
        expect(getDelayTime(100)).toBe(100)
    })

    test('case - 当传入一个数字参数时，应该返回该数字', () => {
        expect(getDelayTime(100, 200)).toBe(200)
    })

    test('case - 当传入一个对象参数，且对象中存在 delay 属性时，应该返回 delay 属性值', () => {
        expect(getDelayTime(100, { delay: 300 })).toBe(300)
    })

    test('case - 当传入多个参数时，只返回第一个符合条件的参数值', () => {
        expect(getDelayTime(100, { foo: 'bar' }, 400, { delay: 500 })).toBe(400)
    })
})

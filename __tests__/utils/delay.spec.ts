import { delay } from '../../src/utils/delay'

describe('测试 `delay()`', () => {
    test('case - 测试延迟时间是否正确', async () => {
        const startTime = Date.now()
        const delayTime = 500
        const expectedDelayTimeSpan = 100 // 允许的误差范围 (jest 多任务并行时, 阻塞可能产生问题)
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

import { createAbortChain } from '../../src/utils/create-abort-chain'
import { delay } from '../../src/utils/delay'

describe('测试 `create-abort-chain()`', () => {
    test('case - 钩子被正确触发, 并返回了正确结果', async () => {
        const onNext = jest.fn(() => {
            return {}
        })
        const onCapture = jest.fn(() => {
            return {}
        })
        const onCompleted = jest.fn()
        const result = await createAbortChain()
            .next(onNext)
            .next(onNext)
            .next(() => 10)
            .capture(onCapture)
            .completed(onCompleted)
            .done()
        expect(result).toBe(10)
        expect(onNext).toBeCalledTimes(2)
        expect(onCompleted).toBeCalledTimes(1)
        expect(onCapture).toBeCalledTimes(0)
    })

    test('case - 应执行所有回调，并在所有回调成功时返回结果', async () => {
        const res = await createAbortChain(1)
            .next((res) => res + 1)
            .next((res) => res * 2)
            .next(async (res) => {
                await delay(100)
                return res * 10
            })
            .done()
        expect(res).toBe(40)
    })

    test('case - 未添加 `onCapture`时, 应直接抛出异常', async () => {
        expect(() =>
            createAbortChain(1)
                .next((res) => res + 1)
                .next(() => {
                    throw new Error('error')
                })
                .next(async (res) => {
                    await delay(100)
                    return res * 10
                })
                .done()
        ).rejects.toThrowError('error')
    })

    test('case - 不能重复添加 `onCapture`', async () => {
        expect(() =>
            createAbortChain(1)
                .next((res) => res + 1)
                .capture((e) => {})
                .capture((e) => {})
                .done()
        ).toThrowError('`onCapture` is registered')
    })

    test('case - 不能重复添加 `onCompleted`', async () => {
        expect(() =>
            createAbortChain(1)
                .next((res) => res + 1)
                .completed(() => {})
                .completed(() => {})
                .done()
        ).toThrowError('`onCompleted` is registered')
    })
    test('case - `capture` 钩子正确捕获到异常结果', async () => {
        expect(
            createAbortChain(1)
                .next(() => {
                    throw new Error('error')
                })
                .next(() => {
                    return 2
                })
                .capture((reason) => {
                    expect(reason).toEqual(new Error('error'))
                    return 8
                })
                .done()
        ).resolves.toEqual(8)

        expect(
            createAbortChain(1)
                .next(() => {
                    throw new Error('error')
                })
                .capture((reason) => {
                    throw reason
                })
                .done()
        ).rejects.toThrowError('error')
    })

    test('case - 在调用`abort`时, 应立即停止执行, 并返回结果', async () => {
        let fn = jest.fn()
        const result = await createAbortChain(1)
            .next((res) => {
                return res + 1
            })
            .next((_, { abort }) => {
                abort(10)
                return fn()
            })
            .next((res) => res + 1)
            .done()
        expect(result).toEqual(10)
        expect(fn).not.toBeCalled()
    })

    test('case - 在调用`abortError`时, 应立即停止执行, 并抛出异常', async () => {
        expect(() =>
            createAbortChain(1)
                .next((res) => {
                    return res + 1
                })
                .next((res, { abortError }) => {
                    abortError(new Error('error'))
                    return res + 1
                })
                .next((res) => res + 1)
                .done()
        ).rejects.toThrowError('error')
    })

    test('case - 在调用`abortError`时, 允许抛出任意类型值', async () => {
        expect(() =>
            createAbortChain(1)
                .next((res) => {
                    return res + 1
                })
                .next((res, { abortError }) => {
                    abortError('error is string')
                    return res + 1
                })
                .done()
        ).rejects.toBe('error is string')
    })

    test('case - `abort`,`abortError` 触发时, 不触发后续钩子', async () => {
        const onNext = jest.fn(() => {
            return {}
        })
        const onCapture = jest.fn(() => {
            return {}
        })
        expect(() =>
            createAbortChain(1)
                .next((res) => {
                    return res + 1
                })
                .next((res, { abortError }) => {
                    abortError('error is string')
                    return res + 1
                })
                .done()
        ).rejects.toBe('error is string')
        expect(onNext).not.toBeCalled()
        expect(onCapture).not.toBeCalled()
    })

    test('case - 在调用`slient`时, 应立即中止执行, 并返回一个未被执行的 Promise', async () => {
        const res: Promise<number> = createAbortChain(1)
            .next((res) => {
                return res + 1
            })
            .next((res, { slient }) => {
                slient()
                return res + 1
            })
            .next((res) => res + 1)
            .done()
        expect(res instanceof Promise).toBe(true)
        jest.useFakeTimers()
        jest.advanceTimersByTime(5000) // advance 5 seconds, make sure the promise is unresolved
        expect(res).resolves.toBeUndefined()
    })
})

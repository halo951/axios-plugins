import { createOrGetCache } from '../../src/utils/create-cache'
import { ISharedCache } from '../../src/intf'

describe('测试 `createOrGetCache()`', () => {
    test('case 1 - 当首次执行 createOrGetCache() 时, 返回空对象', () => {
        const shared: ISharedCache = {}
        const prop = 'test'
        expect(createOrGetCache(shared, prop)).toEqual({})
    })

    test('case 2 - 当指明 initial 值时, 返回 initial', () => {
        const shared: ISharedCache = {}
        const prop = 'test'
        const initial = { a: 123 }
        expect(createOrGetCache(shared, prop, initial)).toEqual(initial)
    })

    test('case 3 - 当第二次触发 createOrGetCache() 时, 返回已初始化后的对象', () => {
        const shared: ISharedCache = {}
        const prop = 'test'
        const initial = { a: 123 }
        expect(createOrGetCache(shared, prop, initial)).toEqual(initial)
        expect(createOrGetCache(shared, prop)).toEqual(initial)
    })
})

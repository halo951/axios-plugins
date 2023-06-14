import { FilterPattern, createUrlFilter } from '../../src/utils/create-filter'

describe('测试 `createUrlFilter()`', () => {
    const testUrl = 'https://www.example.com/api/user/100'

    test('case - 无过滤条件返回 true', () => {
        const filter1 = createUrlFilter()
        const filter2 = createUrlFilter(null, null)
        const filter3 = createUrlFilter(undefined, undefined)
        expect(filter1(testUrl)).toBeFalsy()
        expect(filter2(testUrl)).toBeFalsy()
        expect(filter3(testUrl)).toBeFalsy()
    })

    test('case - `includes` 条件匹配时, 返回true', () => {
        // 不同条件类型
        const includes1: FilterPattern = 'api'
        const includes2: FilterPattern = /api/
        const includes3: FilterPattern = ['api']
        const includes4: FilterPattern = [(path) => path.includes('api')]
        const includes5: FilterPattern = [true] // 忽略校验, 直接返回成功.
        // 多条件
        const includes6: FilterPattern = ['/api', '/xxxxxx']
        const includes7: FilterPattern = ['/xxxxxx', /api/]
        const filter1 = createUrlFilter(includes1)
        const filter2 = createUrlFilter(includes2)
        const filter3 = createUrlFilter(includes3)
        const filter4 = createUrlFilter(includes4)
        const filter5 = createUrlFilter(includes5)
        const filter6 = createUrlFilter(includes6)
        const filter7 = createUrlFilter(includes7)
        expect(filter1(testUrl)).toBeTruthy()
        expect(filter2(testUrl)).toBeTruthy()
        expect(filter3(testUrl)).toBeTruthy()
        expect(filter4(testUrl)).toBeTruthy()
        expect(filter5(testUrl)).toBeTruthy()
        expect(filter6(testUrl)).toBeTruthy()
        expect(filter7(testUrl)).toBeTruthy()
    })

    test('case - `excludes` 条件匹配时, 返回 false', () => {
        // 不同条件类型
        const excludes1: FilterPattern = 'api'
        const excludes2: FilterPattern = /api/
        const excludes3: FilterPattern = ['api']
        // 多条件
        const excludes4: FilterPattern = ['/api', '/xxxxxx']
        const excludes5: FilterPattern = ['/xxxxxx', /api/]
        const excludes6: FilterPattern = [(path) => path.includes('api')]
        const filter1 = createUrlFilter(undefined, excludes1)
        const filter2 = createUrlFilter(undefined, excludes2)
        const filter3 = createUrlFilter(undefined, excludes3)
        const filter4 = createUrlFilter(undefined, excludes4)
        const filter5 = createUrlFilter(undefined, excludes5)
        const filter6 = createUrlFilter(undefined, excludes6)
        expect(filter1(testUrl)).toBeFalsy()
        expect(filter2(testUrl)).toBeFalsy()
        expect(filter3(testUrl)).toBeFalsy()
        expect(filter4(testUrl)).toBeFalsy()
        expect(filter5(testUrl)).toBeFalsy()
        expect(filter6(testUrl)).toBeFalsy()
    })

    test('case - 当 `includes` 匹配, `excludes` 不匹配时, 返回 true', () => {
        const includes: FilterPattern = '/api'
        const excludes: FilterPattern = '/test'
        const filter = createUrlFilter(includes, excludes)
        expect(filter(testUrl)).toBeTruthy()
    })

    test('case - 当 `includes` 不匹配, `excludes` 匹配时, 返回 false', () => {
        const includes: FilterPattern = '/test'
        const excludes: FilterPattern = '/api'
        const filter = createUrlFilter(includes, excludes)
        expect(filter(testUrl)).toBeFalsy()
    })

    test('case - 当 `includes`、`excludes` 同时匹配时, 返回 false', () => {
        const includes: FilterPattern = '/api'
        const excludes: FilterPattern = '/api'
        const filter = createUrlFilter(includes, excludes)
        expect(filter(testUrl)).toBeFalsy()
    })

    test('case - 当 `includes` 存在条件时, 只要include不匹配, 就返回 false', () => {
        const includes: FilterPattern = '/test'
        const excludes: FilterPattern = '/test'
        const filter = createUrlFilter(includes, excludes)
        expect(filter(testUrl)).toBeFalsy()
    })

    test('case - 当 `includes`, `excludes` 规则不满足 FilterPattern 时, 抛出类型异常', () => {
        const includes = 123
        expect(() => createUrlFilter(includes as any)).toThrow(TypeError)
    })
})

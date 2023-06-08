import { isAbsoluteURL, combineURLs } from '../../src/utils/url'

// 以下几种异常情况将忽略
// 1. 不详细验证参数类型, 参数类型通过 typescript 类型校验
describe('测试 `isAbsoluteURL()`', () => {
    test('case - 如果url包含schema协议, 返回 true', () => {
        const url = 'https://www.example.com'
        expect(isAbsoluteURL(url)).toBeTruthy()
    })

    test('case - 如果url包含schema协议, 但没有具体声明, 返回 true', () => {
        const url = '//www.example.com'
        expect(isAbsoluteURL(url)).toBeTruthy()
    })

    test('case - 如果是相对路径, 返回 false', () => {
        const url = '/api/user'
        expect(isAbsoluteURL(url)).toBe(false)
    })
})

// 以下几种异常情况将忽略
// 1. 不详细验证参数类型, 参数类型通过 typescript 类型校验
// 2. 不校验url结构
describe('测试 `combineURLs()`', () => {
    test('case - 返回拼接后的url', () => {
        const baseURL = 'https://www.example.com'
        const relativeURL = '/api/user'
        expect(combineURLs(baseURL, relativeURL)).toBe('https://www.example.com/api/user')
    })

    test('case - 应该移除重复的 `/`', () => {
        const baseURL = 'https://www.example.com/'
        const relativeURL = '/api/user'
        expect(combineURLs(baseURL, relativeURL)).toBe('https://www.example.com/api/user')
    })

    test('case - 如果 `relativeURL` 值为空, 那么应当返回 baseURL', () => {
        const baseURL = 'https://www.example.com'
        expect(combineURLs(baseURL, null as any)).toBe(baseURL)
        expect(combineURLs(baseURL, undefined as any)).toBe(baseURL)
    })

    test('case - 如果 `baseURL` 值为空, 那么应当抛出异常', () => {
        const relativeURL = '/api/user'
        expect(() => combineURLs(null as any, relativeURL)).toThrow(TypeError)
        expect(() => combineURLs(undefined as any, relativeURL)).toThrow(TypeError)
    })
})

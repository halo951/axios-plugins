type Matcher = { test: (url: string) => boolean }

export type Filter = (url: string) => boolean

export type FilterPattern =
    | ReadonlyArray<string | RegExp | ((url: string) => boolean)>
    | string
    | RegExp
    | ((url: string) => boolean)
    | null
    | undefined

const getMatchers = (fp: FilterPattern): Array<Matcher> => {
    fp = fp instanceof Array ? fp : [fp]
    let matchers: Array<Matcher> = []
    for (const rule of fp) {
        if (typeof rule === 'function') {
            matchers.push({ test: rule })
        } else if (rule instanceof RegExp) {
            matchers.push(rule)
        } else if (typeof rule === 'string') {
            matchers.push({
                // match id in url
                test(url: string): boolean {
                    return url.includes(rule)
                }
            })
        } else if (![undefined, null].includes(rule)) {
            throw new TypeError('请检查 `includes`, `excludes` 配置')
        }
    }
    return matchers
}

/** 创建简易的url过滤器 */
export const createUrlFilter = (include?: FilterPattern, exclude?: FilterPattern): Filter => {
    const includeMatchers = getMatchers(include)
    const excludeMatchers = getMatchers(exclude)

    return (url: string): boolean => {
        // ? 判断是否排除
        for (const matcher of excludeMatchers) {
            if (matcher.test(url)) return false
        }
        // ? 判断是否包含
        for (const matcher of includeMatchers) {
            if (matcher.test(url)) return true
        }
        // 否则如果没有配置 includes 过滤器, 则通过
        return !includeMatchers.length
    }
}

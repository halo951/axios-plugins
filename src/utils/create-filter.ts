type Matcher = { test: (url: string) => boolean }

export type Filter = (url?: string) => boolean

export type FilterPatternType = string | boolean | RegExp | ((url: string) => boolean) | null | undefined
export type FilterPattern = ReadonlyArray<FilterPatternType> | FilterPatternType

const getMatchers = (fp: FilterPattern): Array<Matcher> => {
    fp = fp instanceof Array ? fp : [fp]
    return fp
        .filter((rule) => rule !== undefined && rule !== null)
        .map((rule) => {
            if (rule instanceof RegExp) {
                return rule
            } else if (typeof rule === 'function') {
                return { test: rule }
            } else if (typeof rule === 'string') {
                // match id in url
                return { test: (url: string) => url.includes(rule) }
            } else if (typeof rule === 'boolean') {
                return { test: () => rule }
            } else {
                throw new TypeError('请检查 `includes`, `excludes` 配置')
            }
        })
}

/** 创建简易的url过滤器 */
export const createUrlFilter = (include?: FilterPattern, exclude?: FilterPattern): Filter => {
    if (include === undefined && exclude === undefined) include = true
    const includeMatchers = getMatchers(include)
    const excludeMatchers = getMatchers(exclude)

    return (url?: string): boolean => {
        if (!url) return false
        // ? 判断是否排除
        for (const matcher of excludeMatchers) {
            if (matcher.test(url)) return false
        }
        // ? 判断是否包含
        for (const matcher of includeMatchers) {
            if (matcher.test(url)) {
                return true
            }
        }
        return false
    }
}

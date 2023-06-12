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
    return fp
        .filter((rule) => ![undefined, null].includes(rule))
        .map((rule) => {
            if (rule instanceof RegExp) {
                return rule
            } else if (typeof rule === 'function') {
                return { test: rule }
            } else if (typeof rule === 'string') {
                return {
                    // match id in url
                    test(url: string): boolean {
                        return url.includes(rule)
                    }
                }
            } else {
                throw new TypeError('请检查 `includes`, `excludes` 配置')
            }
        })
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
        return false
    }
}

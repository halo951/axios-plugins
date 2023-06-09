type Filter = (url: string) => boolean
type Matcher = { test: (url: string) => boolean }
type T = string | RegExp

const ensureArray = (thing: FilterPattern): readonly T[] => {
    if (thing instanceof Array) return thing
    else if (typeof thing === 'string' || thing instanceof RegExp) return [thing]
    else if (!thing) return []
    throw new TypeError('请检查插件配置的 `includes`, `excludes` 参数')
}

const getMatchers = (fp: FilterPattern): Array<Matcher> => {
    const toMatcher = (id: string | RegExp): Matcher => {
        if (id instanceof RegExp) {
            return id
        } else {
            return {
                // match id in url
                test(url: string): boolean {
                    return url.includes(id)
                }
            }
        }
    }
    return ensureArray(fp).map(toMatcher)
}

export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null | undefined

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

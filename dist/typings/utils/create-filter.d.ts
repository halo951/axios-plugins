type Filter = (url: string) => boolean;
export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;
/** 创建简易的url过滤器 */
export declare const createUrlFilter: (include?: FilterPattern, exclude?: FilterPattern) => Filter;
export {};

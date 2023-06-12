/** 延时函数 */
export const delay = (time: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time)
    })
}

/** 获取延时时间 */
export const getDelayTime = (def: number, ...args: Array<any>): number => {
    for (const o of args) {
        if (typeof o === 'number') return o
        else if (typeof o === 'object' && typeof o.delay === 'number') return o.delay
    }
    return def
}

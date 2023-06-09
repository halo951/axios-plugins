/** 延时函数 */
export const delay = (time: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time)
    })
}

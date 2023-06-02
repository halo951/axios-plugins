/* prettier config */
module.exports = {
    printWidth: 120, // 每行最大代码宽度
    tabWidth: 4, // 每个缩进级别的空格数
    useTabs: false, // 使用空格缩进行
    semi: false, // 在语句末尾打印分号
    singleQuote: true, // 使用双引号
    quoteProps: 'as-needed', // js对象是否使用引号包裹, as-needed:仅在必要时使用, preserve:保持原样
    jsxSingleQuote: true, // 在JSX中使用单引号而不是双引号。
    trailingComma: 'none', // 多行数组或对象是否结尾包含逗号 es5: 允许追加
    bracketSpacing: true, // 在对象文字中的括号之间打印空格。
    jsxBracketSameLine: false, // 将>多行JSX元素的放在最后一行的末尾，而不是一个人放在下一行（不适用于自闭元素）。
    arrowParens: 'always', //  在单独的箭头函数参数周围包括括号。例如: avoid x => void  always: (x)=>void
    proseWrap: 'preserve',
    endOfLine: 'auto'
}

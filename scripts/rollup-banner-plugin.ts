import { Plugin } from 'rollup'
import fs from 'node:fs'
import np from 'node:path'

/** 编译后置操作, 添加banner */
export const banner = (): Plugin => {
    const pkg = JSON.parse(fs.readFileSync(np.join(process.cwd(), 'package.json'), { encoding: 'utf-8' }))
    const banner: string = `
/** 
 * ${pkg.name}@${pkg.version}
 * 
 * Copyright (c) ${new Date().getFullYear()} ${pkg.author.name} <${pkg.author.url}>
 * Released under ${pkg.license} License
 * 
 * @build ${new Date()}
 * @author ${pkg.author.name}(${pkg.author.url})
 * @license ${pkg.license}
 */
`.trim()

    return {
        name: 'after',
        renderChunk(code) {
            return ['// @ts-ignore', banner, code].join('\n')
        }
    }
}

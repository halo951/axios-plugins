import { InputPluginOption, InternalModuleFormat, RollupOptions, Plugin } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import terser from '@rollup/plugin-terser'
import fs from 'node:fs'
import np from 'node:path'
import * as glob from 'glob'

const pkg = JSON.parse(fs.readFileSync('package.json', { encoding: 'utf-8' }))

const banner: string = `
/** 
 * ${pkg.name}@${pkg.version}
 * 
 * Copyright (c) ${new Date().getFullYear()} ${pkg.author.name} <${pkg.author.url}>
 * Released under ${pkg.license} License
 * 
 * @author ${pkg.author.name}(${pkg.author.url})
 * @license ${pkg.license}
 */
`.trim()

/** export rollup.config */
export default async (): Promise<RollupOptions | Array<RollupOptions>> => {
    const external = ['axios', 'crypto', 'axios-logger', 'qs', 'klona/json', 'tslib']
    const formats: Array<InternalModuleFormat> = ['cjs', 'es']
    const plugins: InputPluginOption = [
        // 编译
        typescript({
            clean: true,
            useTsconfigDeclarationDir: true,
            abortOnError: true,
            include: ['src/**/*.ts'],
            tsconfigDefaults: {
                importHelpers: true,
                strict: true,
                noImplicitAny: true,
                noImplicitThis: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                strictNullChecks: true,
                strictPropertyInitialization: true
            }
        }),
        // 压缩
        terser()
    ]

    const task: Array<RollupOptions> = []

    // build full code
    task.push({
        input: {
            index: 'src/index.ts',
            core: 'src/core.ts'
        },
        plugins,
        external,
        output: formats.map((format) => ({
            banner,
            format,
            exports: 'auto',
            dir: `dist/${format}`,
            minifyInternalExports: false,
            manualChunks: (id) => {
                if (/src\\plugins/.test(id)) {
                    // const pluginName = 
                }
            }
        }))
    })

    return task
}

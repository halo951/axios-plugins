import { sync as globSync } from 'glob'
import np from 'node:path'
import { InputPluginOption, RollupOptions } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import terser from '@rollup/plugin-terser'
import { banner } from './scripts/rollup-banner-plugin'
import size from '@atomico/rollup-plugin-sizes'

/** export rollup.config */
export default async (): Promise<RollupOptions | Array<RollupOptions>> => {
    const external = ['axios', 'crypto', 'axios-logger', 'qs', 'klona/json', 'tslib']
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
        terser(),
        // 计算打包后体积
        size()
    ]

    return [
        // 1. build full
        {
            input: 'src/index.ts',
            plugins,
            external,
            output: [
                { format: 'cjs', exports: 'auto', file: `dist/index.js`, plugins: [banner()] },
                { format: 'es', exports: 'auto', file: `dist/index.mjs`, plugins: [banner()] }
            ]
        },
        // 2. build core
        {
            input: 'src/core.ts',
            plugins,
            external,
            output: [
                { format: 'cjs', exports: 'auto', file: `dist/core.js`, plugins: [banner()] },
                { format: 'es', exports: 'auto', file: `dist/core.mjs`, plugins: [banner()] }
            ]
        },
        // 3. build plugins
        {
            input: globSync('src/plugins/*.ts').reduce((entry, path) => {
                const plug: string = np.basename(path, '.ts')
                entry[plug] = path
                return entry
            }, {}),
            plugins,
            external,
            output: [
                {
                    format: 'cjs',
                    exports: 'auto',
                    dir: 'dist/plugins/',
                    manualChunks: (id) => (id.match(/utils/) ? 'utils' : null),
                    entryFileNames: ({ name }) => name + '.js',
                    chunkFileNames: ({ name }) => name + '.js'
                },
                {
                    format: 'es',
                    exports: 'auto',
                    dir: 'dist/plugins/',
                    manualChunks: (id) => (id.match(/utils/) ? 'utils' : null),
                    entryFileNames: ({ name }) => name + '.mjs',
                    chunkFileNames: ({ name }) => name + '.mjs'
                }
            ]
        }
    ]
}

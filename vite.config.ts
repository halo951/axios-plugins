import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'
import fs from 'fs'

const pluginsDir = resolve(__dirname, 'src/plugins')

// 扫描 plugins 目录
const pluginEntries = Object.fromEntries(
    fs
        .readdirSync(pluginsDir)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => {
            const name = f.replace(/\.ts$/, '')
            return [name, resolve(pluginsDir, f)]
        })
)

export default defineConfig(() => {
    return {
        build: {
            lib: {
                entry: 'src/index.ts',
                formats: ['cjs', 'es'] as any,
                fileName(_, entryName) {
                    return `${entryName}.js`
                }
            },
            outDir: 'dist',
            minify: false,
            sourcemap: true,
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/index.ts'),
                    ...pluginEntries // 每个插件单独打包
                }
            }
        },
        plugins: [
            dts({
                entryRoot: 'src',
                outDir: 'dist/types',
                insertTypesEntry: true // 自动生成 `index.d.ts`
            })
        ]
    }
})

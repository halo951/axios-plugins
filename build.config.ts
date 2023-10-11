import { defineBuildConfig } from 'unbuild'
import pkg from './package.json'

export default defineBuildConfig({
    entries: ['src/intf', 'src/index', 'src/core'],
    clean: true,
    declaration: true,
    rollup: {
        emitCJS: true,
        output: {
            banner: `
        // @ts-nocheck
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
    `
                .trim()
                .split(/\n/g)
                .map((s) => s.trim())
                .join('\n')
        }
    }
})

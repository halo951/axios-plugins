import { defineBuildConfig } from 'unbuild'
import * as np from 'node:path'
import { glob } from 'glob'

import pkg from './package.json'

const plugins = glob.sync('./src/plugins/*.ts').map((input: string) => {
    return { name: 'plugins/' + np.basename(input, '.ts'), input: input.replace(/\.ts$/, '') }
})

export default defineBuildConfig({
    entries: [{ name: 'index', input: 'src/index' }, { name: 'core', input: 'src/core' }, ...plugins],
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

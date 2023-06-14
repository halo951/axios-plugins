import type { Config } from 'jest'
export default <Config>{
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: false,
    coverageDirectory: '.coverage',
    collectCoverageFrom: ['src/**/*.ts'],
    // 导出和接口文件跳过覆盖率检查
    coveragePathIgnorePatterns: ['src/index.ts', 'src/core.ts', 'src/intf.ts'],
    testRegex: ['__tests__/.+?.spec.ts'],
    globals: {}
}

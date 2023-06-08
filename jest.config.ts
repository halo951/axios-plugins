import type { Config } from 'jest'
export default <Config>{
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: false,
    coverageDirectory: '.coverage',
    testRegex: ['__tests__/.+?.spec.ts'],
    coveragePathIgnorePatterns: ['src/plugins/*']
}

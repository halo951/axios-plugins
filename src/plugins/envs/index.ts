import { AxiosDefaults, AxiosHeaderValue, HeadersDefaults } from 'axios'
import { IPlugin } from '../../intf'

/** 插件参数声明 */
export type IEnvsOptions = Array<{
    rule: () => boolean
    config: Omit<AxiosDefaults, 'headers'> & {
        headers: HeadersDefaults & {
            [key: string]: AxiosHeaderValue
        }
    }
}>
/**
 * 插件: 多环境配置
 *
 * @description 规范化 axios 多环境配置工具
 */
export const envs = (options: IEnvsOptions = []): IPlugin => {
    return {
        name: 'envs',
        beforeRegister(axios) {
            for (const { rule, config } of options) {
                if (rule()) {
                    Object.assign(axios.defaults, config)
                    break
                }
            }
            axios.defaults
        },
        lifecycle: {}
    }
}

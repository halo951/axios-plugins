import { AxiosRequestConfig } from 'axios'
import { calcHash, defaultCalcRequestHash } from '../../src/utils/calc-hash'

describe('`calcHash()`、`defaultCalcRequestHash()` 组合测试', () => {
    test('case - 验证包含冗余参数的hash值计算是否正确', () => {
        const config: AxiosRequestConfig = {
            url: 'https://www.example.com/api/user',
            method: 'get',
            params: { id: 1 },
            data: { name: 'John' },
            // headers 不参与 request hash 值计算
            headers: {
                'Content-Type': 'appliaction/json'
            }
        }
        expect(defaultCalcRequestHash(config)).not.toBe(calcHash(config))
    })
})

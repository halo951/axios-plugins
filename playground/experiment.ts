import axios from 'axios'
import { useAxiosPlugin, mock } from '../src'

useAxiosPlugin(axios)
    // mock
    .plugin(mock({ enable: false, mockUrl: 'http://test' }))

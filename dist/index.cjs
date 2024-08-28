// @ts-nocheck
/**
* axios-plugins@0.5.4
*
* Copyright (c) 2024 halo951 <https://github.com/halo951>
* Released under MIT License
*
* @build Wed Aug 28 2024 19:53:48 GMT+0800 (中国标准时间)
* @author halo951(https://github.com/halo951)
* @license MIT
*/
'use strict';

const core = require('./core.cjs');
const plugins_debounce = require('./shared/axios-plugins.25412762.cjs');
const plugins_throttle = require('./shared/axios-plugins.1d7c5336.cjs');
const plugins_merge = require('./shared/axios-plugins.15d3e343.cjs');
const plugins_retry = require('./shared/axios-plugins.dcd32757.cjs');
const plugins_cancel = require('./shared/axios-plugins.df986c3c.cjs');
const plugins_cache = require('./shared/axios-plugins.1b09ab51.cjs');
const plugins_transform = require('./shared/axios-plugins.68a6ca3a.cjs');
const plugins_auth = require('./shared/axios-plugins.9a53e249.cjs');
const plugins_loading = require('./shared/axios-plugins.e3a6432b.cjs');
const plugins_mock = require('./shared/axios-plugins.59164b27.cjs');
const plugins_envs = require('./plugins/envs.cjs');
const plugins_normalize = require('./shared/axios-plugins.56283e30.cjs');
const plugins_pathParams = require('./shared/axios-plugins.6b74785e.cjs');
const plugins_sign = require('./shared/axios-plugins.9456f591.cjs');
const plugins_sentryCapture = require('./plugins/sentry-capture.cjs');
const plugins_onlySend = require('./shared/axios-plugins.db6a038e.cjs');
const plugins_mp = require('./shared/axios-plugins.e3a62982.cjs');
require('axios');
require('klona/json');
require('./shared/axios-plugins.b029b3bb.cjs');
require('crypto-js');
require('./shared/axios-plugins.4b4ce731.cjs');
require('./shared/axios-plugins.41879bd5.cjs');
require('./shared/axios-plugins.ef8ba07f.cjs');
require('./shared/axios-plugins.d42d23f0.cjs');
require('qs');



exports.useAxiosPlugin = core.useAxiosPlugin;
exports.Debounce = plugins_debounce.debounce$1;
exports.debounce = plugins_debounce.debounce;
exports.Throttle = plugins_throttle.throttle$1;
exports.throttle = plugins_throttle.throttle;
exports.Merge = plugins_merge.merge$1;
exports.merge = plugins_merge.merge;
exports.Retry = plugins_retry.retry$1;
exports.retry = plugins_retry.retry;
exports.Cancel = plugins_cancel.cancel$1;
exports.cancel = plugins_cancel.cancel;
exports.cancelAll = plugins_cancel.cancelAll;
exports.Cache = plugins_cache.cache$1;
exports.cache = plugins_cache.cache;
exports.Transform = plugins_transform.transform$1;
exports.transform = plugins_transform.transform;
exports.Auth = plugins_auth.auth$1;
exports.auth = plugins_auth.auth;
exports.Loading = plugins_loading.loading$1;
exports.loading = plugins_loading.loading;
exports.Mock = plugins_mock.mock$1;
exports.mock = plugins_mock.mock;
exports.envs = plugins_envs.envs;
exports.Normalize = plugins_normalize.normalize$1;
exports.normalize = plugins_normalize.normalize;
exports.PathParams = plugins_pathParams.pathParams$1;
exports.pathParams = plugins_pathParams.pathParams;
exports.Sign = plugins_sign.sign$1;
exports.sign = plugins_sign.sign;
exports.sentryCapture = plugins_sentryCapture.sentryCapture;
exports.OnlySend = plugins_onlySend.onlySend$1;
exports.onlySend = plugins_onlySend.onlySend;
exports.Mp = plugins_mp.mp$1;
exports.mp = plugins_mp.mp;

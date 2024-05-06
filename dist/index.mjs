// @ts-nocheck
/**
* axios-plugins@0.3.4
*
* Copyright (c) 2024 halo951 <https://github.com/halo951>
* Released under MIT License
*
* @build Mon May 06 2024 17:37:15 GMT+0800 (中国标准时间)
* @author halo951(https://github.com/halo951)
* @license MIT
*/
export { useAxiosPlugin } from './core.mjs';
import { MD5 } from 'crypto-js';
import axios, { CanceledError, toFormData } from 'axios';
import * as log from 'axios-logger';
import { klona } from 'klona/json';
import { stringify } from 'qs';

const calcHash = (obj) => {
  const data = JSON.stringify(obj);
  return MD5(data).toString();
};
const defaultCalcRequestHash = (config) => {
  const { url, data, params } = config;
  return calcHash({ url, data, params });
};

const createOrGetCache = (shared, key, initial) => {
  if (!shared[key]) {
    shared[key] = initial ?? {};
  }
  return shared[key];
};

const getMatchers = (fp) => {
  fp = fp instanceof Array ? fp : [fp];
  return fp.filter((rule) => ![void 0, null].includes(rule)).map((rule) => {
    if (rule instanceof RegExp) {
      return rule;
    } else if (typeof rule === "function") {
      return { test: rule };
    } else if (typeof rule === "string") {
      return { test: (url) => url.includes(rule) };
    } else if (typeof rule === "boolean") {
      return { test: () => rule };
    } else {
      throw new TypeError("\u8BF7\u68C0\u67E5 `includes`, `excludes` \u914D\u7F6E");
    }
  });
};
const createUrlFilter = (include, exclude) => {
  if (include === void 0 && exclude === void 0)
    include = true;
  const includeMatchers = getMatchers(include);
  const excludeMatchers = getMatchers(exclude);
  return (url) => {
    for (const matcher of excludeMatchers) {
      if (matcher.test(url))
        return false;
    }
    for (const matcher of includeMatchers) {
      if (matcher.test(url)) {
        return true;
      }
    }
    return false;
  };
};

const delay = (time = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time);
  });
};
const getDelayTime = (def, ...args) => {
  for (const o of args) {
    if (typeof o === "number")
      return o;
    else if (typeof o === "object" && typeof o.delay === "number")
      return o.delay;
  }
  return def;
};

const debounce = (options = {}) => {
  const runWhen = (_, { origin }) => {
    if (origin["debounce"]) {
      return !!origin["debounce"];
    } else {
      const filter = createUrlFilter(options.includes, options.excludes);
      return filter(origin.url);
    }
  };
  return {
    name: "debounce",
    enforce: "pre",
    beforeRegister(axios) {
      Object.assign(options, { calcRequstHash: defaultCalcRequestHash }, axios.defaults["debounce"]);
    },
    lifecycle: {
      preRequestTransform: {
        runWhen,
        handler: async (config, { origin, shared }) => {
          const hash = options.calcRequstHash(origin);
          const cache = createOrGetCache(shared, "debounce");
          if (cache[hash]) {
            await new Promise((resolve) => {
              cache[hash].push({ resolve });
            });
          } else {
            cache[hash] = [];
          }
          return config;
        }
      },
      completed: {
        runWhen: (options2) => {
          return runWhen(void 0, options2);
        },
        handler: async ({ origin, shared }) => {
          const hash = options.calcRequstHash(origin);
          const cache = createOrGetCache(shared, "debounce");
          const delayTime = getDelayTime(0, origin.debounce, options.delay);
          if (cache[hash]?.length) {
            const { resolve } = cache[hash].shift();
            delay(delayTime).then(() => resolve());
          } else {
            delete cache[hash];
          }
        }
      }
    }
  };
};

const debounce$1 = {
    __proto__: null,
    debounce: debounce
};

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => {
  __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class ThrottleError extends Error {
  constructor() {
    super(...arguments);
    __publicField$3(this, "type", "throttle");
  }
}
var GiveUpRule = /* @__PURE__ */ ((GiveUpRule2) => {
  GiveUpRule2["throw"] = "throw";
  GiveUpRule2["cancel"] = "cancel";
  GiveUpRule2["silent"] = "silent";
  return GiveUpRule2;
})(GiveUpRule || {});
const throttle = (options = {}) => {
  const runWhen = (_, { origin }) => {
    if (origin["throttle"]) {
      return !!origin["throttle"];
    } else {
      const filter = createUrlFilter(options.includes, options.excludes);
      return filter(origin.url);
    }
  };
  return {
    name: "throttle",
    enforce: "pre",
    beforeRegister(axios) {
      Object.assign(options, { calcRequstHash: defaultCalcRequestHash }, axios.defaults["throttle"]);
    },
    lifecycle: {
      preRequestTransform: {
        runWhen,
        handler: async (config, { origin, shared }, { abort, abortError, slient }) => {
          const hash = options.calcRequstHash(origin);
          const cache = createOrGetCache(shared, "throttle");
          if (cache[hash]) {
            let message;
            let giveUp = config.throttle?.giveUp ?? options.giveUp;
            let throttleErrorMessage = config.throttle?.throttleErrorMessage ?? options.throttleErrorMessage;
            switch (giveUp) {
              case "silent" /* silent */:
                slient();
                break;
              case "cancel" /* cancel */:
                abort();
                break;
              case "throw" /* throw */:
              default:
                if (throttleErrorMessage) {
                  if (typeof throttleErrorMessage === "function") {
                    message = throttleErrorMessage(config);
                  } else {
                    message = throttleErrorMessage;
                  }
                } else {
                  message = `'${config.url}' \u89E6\u53D1\u4E86\u8282\u6D41\u89C4\u5219, \u8BF7\u6C42\u88AB\u4E2D\u6B62`;
                }
                abortError(new ThrottleError(message));
                break;
            }
          } else {
            cache[hash] = true;
          }
          return config;
        }
      },
      completed: {
        runWhen: (options2) => {
          return runWhen(void 0, options2);
        },
        handler: async ({ origin, shared }) => {
          const hash = options.calcRequstHash(origin);
          const cache = createOrGetCache(shared, "throttle");
          if (options.delay && options.delay > 0) {
            await delay(options.delay);
          }
          delete cache[hash];
          return void 0;
        }
      }
    }
  };
};

const throttle$1 = {
    __proto__: null,
    GiveUpRule: GiveUpRule,
    ThrottleError: ThrottleError,
    throttle: throttle
};

const merge = (options = {}) => {
  const runWhen = (_, { origin }) => {
    if (origin["merge"]) {
      return !!origin["merge"];
    } else if (origin.url) {
      const filter = createUrlFilter(options.includes, options.excludes);
      return filter(origin.url);
    } else {
      return false;
    }
  };
  const distributionMergeResponse = async ({ origin, shared }, cb) => {
    const hash = options.calcRequstHash(origin);
    const cache = createOrGetCache(shared, "merge");
    const delayTime = getDelayTime(200, origin.debounce, options.delay);
    if (cache[hash]) {
      for (const callback of cache[hash] ?? [])
        cb(callback);
      delay(delayTime).then(() => {
        for (const callback of cache[hash] ?? [])
          cb(callback);
        delete cache[hash];
      });
    }
  };
  return {
    name: "merge",
    enforce: "post",
    beforeRegister(axios) {
      Object.assign(options, { calcRequstHash: defaultCalcRequestHash }, axios.defaults["merge"]);
    },
    lifecycle: {
      preRequestTransform: {
        runWhen,
        /**
         * 请求前, 创建请求缓存, 遇到重复请求时, 将重复请求放入缓存等待最先触发的请求执行完成
         */
        handler: async (config, { origin, shared }, { abort, abortError }) => {
          const hash = options.calcRequstHash(origin);
          const cache = createOrGetCache(shared, "merge");
          if (cache[hash]) {
            const { status, response, reason } = await new Promise(
              (resolve) => {
                cache[hash].push(resolve);
              }
            );
            if (status)
              abort(response);
            else
              abortError(reason);
            return response;
          } else {
            cache[hash] = [];
            return config;
          }
        }
      },
      postResponseTransform: {
        runWhen,
        /**
         * 请求结束后, 向缓存中的请求分发结果 (分发成果结果)
         */
        handler: async (response, opt) => {
          distributionMergeResponse(opt, (resolve) => resolve({ status: true, response }));
          return response;
        }
      },
      captureException: {
        runWhen,
        /**
         * 请求结束后, 向缓存中的请求分发结果 (分发失败结果)
         */
        handler: async (reason, opt) => {
          distributionMergeResponse(opt, (resolve) => resolve({ status: false, reason }));
          return reason;
        }
      },
      aborted: {
        runWhen,
        /**
         * 如果请求被中断, 那么清理merge缓存
         */
        handler: (reason, opt) => {
          distributionMergeResponse(opt, () => {
          });
          throw reason;
        }
      }
    }
  };
};

const merge$1 = {
    __proto__: null,
    merge: merge
};

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => {
  __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class RetryError extends Error {
  constructor() {
    super(...arguments);
    __publicField$2(this, "type", "retry");
  }
}
const retry = (options) => {
  const runWhen = (_, { origin }) => {
    if (origin["retry"]) {
      return !!origin["retry"];
    } else {
      const filter = createUrlFilter(options.includes, options.excludes);
      return filter(origin.url);
    }
  };
  return {
    name: "retry",
    enforce: "pre",
    beforeRegister(axios) {
      Object.assign(options, axios.defaults["retry"]);
    },
    lifecycle: {
      postResponseTransform: {
        runWhen(_, opts) {
          if (!runWhen(_, opts))
            return false;
          if (typeof opts.origin.retry === "object") {
            return !!opts.origin.retry.isExceptionRequest;
          } else {
            return !!options.isExceptionRequest;
          }
        },
        handler(response, opts) {
          let isExceptionRequest;
          if (typeof opts.origin.retry === "object") {
            isExceptionRequest = opts.origin.retry.isExceptionRequest;
          } else {
            isExceptionRequest = options.isExceptionRequest;
          }
          if (isExceptionRequest(response, opts)) {
            throw new RetryError();
          }
          return response;
        }
      },
      captureException: {
        runWhen,
        async handler(reason, { origin, shared, axios }, { abortError }) {
          const hash = defaultCalcRequestHash(origin);
          const cache = createOrGetCache(shared, "retry");
          let max;
          if (typeof origin.retry === "object") {
            max = origin.retry.max;
          } else if (typeof origin.retry === "number") {
            max = origin.retry;
          } else {
            max = options.max;
          }
          max = max ?? 0;
          if (cache[hash] && cache[hash] >= max) {
            delete cache[hash];
            abortError(reason);
          } else {
            if (!cache[hash]) {
              cache[hash] = 1;
            } else {
              cache[hash]++;
            }
            return await axios.request(origin);
          }
        }
      }
    }
  };
};

const retry$1 = {
    __proto__: null,
    retry: retry
};

const cancel = () => {
  return {
    name: "cancel",
    lifecycle: {
      preRequestTransform: {
        runWhen: (config) => !config.cancelToken,
        handler: (config, { origin, shared }) => {
          const cache = createOrGetCache(shared, "cancel", []);
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          origin.cancelToken = source.token;
          cache.push(source);
          if (shared)
            return config;
        }
      },
      captureException: {
        runWhen: (reason) => reason instanceof CanceledError,
        handler: (reason, {}, { abortError }) => {
          if (reason instanceof CanceledError) {
            abortError(reason);
          }
          return reason;
        }
      },
      completed({ origin, shared }) {
        const cache = createOrGetCache(shared, "cancel", []);
        const index = cache.findIndex((c) => c.token === origin.cancelToken);
        if (index !== -1)
          cache[index] = null;
      }
    }
  };
};
const cancelAll = (axios2, message) => {
  const shared = axios2.__shared__;
  if (shared.cancel instanceof Array) {
    while (shared.cancel.length > 0) {
      const { cancel: cancel2 } = shared.cancel.pop();
      cancel2(message ?? "\u8BF7\u6C42\u7EC8\u6B62");
    }
  }
};

const cancel$1 = {
    __proto__: null,
    cancel: cancel,
    cancelAll: cancelAll
};

const mapping$1 = [];
const removeCache = (axios, cacheKey) => {
  for (const m of mapping$1) {
    if (m.axios === axios) {
      m.patch({ [cacheKey]: void 0 });
      return true;
    }
  }
  return false;
};
const clearAllCache = (axios) => {
  for (const m of mapping$1) {
    if (m.axios === axios) {
      m.clear();
      return true;
    }
  }
  return false;
};
const cache = (options = {}) => {
  const runWhen = (_, { origin }) => {
    return !!origin["cache"];
  };
  const storage = options.storage ?? sessionStorage;
  const storageKey = options.storageKey ?? "axios-plugins.cache";
  const getCacheKey = (origin, key) => {
    if (typeof key === "string")
      return key;
    else if (typeof key === "function")
      return key(origin);
    else if (typeof key === "object")
      return getCacheKey(origin, key.key);
    return void 0;
  };
  const getCache = () => {
    if (!storage.getItem(storageKey)) {
      return {};
    }
    const { version, cache: cache2 } = JSON.parse(storage.getItem(storageKey));
    if (version !== options.version) {
      return {};
    } else {
      return cache2;
    }
  };
  const patch = (patchCache) => {
    const cache2 = getCache();
    Object.assign(cache2, patchCache);
    for (const key of Object.keys(cache2)) {
      if (!cache2[key]?.expires || Date.now() > cache2[key].expires) {
        delete cache2[key];
      }
    }
    if (Object.keys(cache2).length > 0) {
      storage.setItem(storageKey, JSON.stringify({ version: options.version, cache: cache2 }));
    } else {
      storage.removeItem(storageKey);
    }
  };
  const clear = () => {
    storage.removeItem(storageKey);
  };
  return {
    name: "cache",
    enforce: "pre",
    beforeRegister(axios) {
      Object.assign(options, axios.defaults["cache"]);
      mapping$1.push({ axios, patch, clear });
      patch({});
    },
    lifecycle: {
      preRequestTransform: {
        runWhen,
        /**
         * 请求前, 创建请求缓存, 遇到重复请求时, 将重复请求放入缓存等待最先触发的请求执行完成
         */
        handler: async (config, { origin }, { abort }) => {
          const key = getCacheKey(origin, origin.cache) ?? getCacheKey(origin, options.key);
          const cache2 = getCache();
          if (cache2[key]) {
            if (Date.now() < cache2[key].expires) {
              abort(cache2[key]);
            } else {
              delete cache2[key];
            }
          }
          return config;
        }
      },
      postResponseTransform: {
        runWhen,
        handler: (response, { origin }) => {
          const key = getCacheKey(origin, origin.cache) ?? getCacheKey(origin, options.key);
          patch({
            [key]: {
              expires: origin.cache?.expires ?? options.expires,
              res: response
            }
          });
          return response;
        }
      }
    }
  };
};

const cache$1 = {
    __proto__: null,
    cache: cache,
    clearAllCache: clearAllCache,
    removeCache: removeCache
};

const transform = (options = {}) => {
  return {
    name: "transform",
    lifecycle: {
      transformRequest: options.request,
      postResponseTransform: options.response,
      captureException: options.capture
    }
  };
};

const transform$1 = {
    __proto__: null,
    transform: transform
};

const loading = (options) => {
  const { delay, delayClose, onTrigger } = options;
  let delayTimer;
  let delayCloseTimer;
  const runWhen = (_, { origin }) => {
    if (origin["loading"]) {
      return !!origin["loading"];
    } else {
      const filter = createUrlFilter(options.includes, options.excludes);
      return filter(origin.url);
    }
  };
  const open = (req, { shared }) => {
    const cache = createOrGetCache(shared, "loading");
    cache.pending ? cache.pending++ : cache.pending = 1;
    if (!cache.status && cache.pending > 0) {
      if (delayTimer)
        clearTimeout(delayTimer);
      delayTimer = setTimeout(() => {
        cache.status = true;
        onTrigger(true);
      }, delay ?? 0);
    }
    if (delayCloseTimer)
      clearTimeout(delayCloseTimer);
    return req;
  };
  const close = (res, { shared }) => {
    const cache = createOrGetCache(shared, "loading");
    cache.pending--;
    if (cache.status && cache.pending <= 0) {
      if (delayCloseTimer)
        clearTimeout(delayCloseTimer);
      delayCloseTimer = setTimeout(() => {
        cache.status = false;
        onTrigger(false);
      }, 200);
    }
    return res;
  };
  const closeOnError = (reason, { shared }) => {
    const cache = createOrGetCache(shared, "loading");
    cache.pending--;
    if (cache.status && cache.pending <= 0) {
      if (delayCloseTimer)
        clearTimeout(delayCloseTimer);
      delayCloseTimer = setTimeout(() => {
        cache.status = false;
        onTrigger(false);
      }, delayClose ?? 0);
    }
    return reason;
  };
  return {
    name: "loading",
    enforce: "pre",
    lifecycle: {
      preRequestTransform: { runWhen, handler: open },
      postResponseTransform: { runWhen, handler: close },
      captureException: { runWhen, handler: closeOnError },
      aborted: { runWhen, handler: closeOnError }
    }
  };
};

const loading$1 = {
    __proto__: null,
    loading: loading
};

const logger = (options = {}) => {
  if (options.config)
    log.setGlobalConfig(options.config);
  return {
    name: "logger",
    lifecycle: {
      transformRequest: {
        runWhen: () => options.request,
        handler: (config) => {
          log.requestLogger(config);
          return config;
        }
      },
      postResponseTransform: {
        runWhen: () => options.response,
        handler: (response) => {
          log.responseLogger(response);
          return response;
        }
      },
      captureException: {
        runWhen: () => options.error,
        handler: (reason) => {
          log.errorLogger(reason);
          return reason;
        }
      }
    }
  };
};

const logger$1 = {
    __proto__: null,
    logger: logger
};

const isAbsoluteURL = (url) => {
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};
const combineURLs = (baseURL, relativeURL) => {
  return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
};

const mock = (options = { enable: false }) => {
  return {
    name: "mock",
    beforeRegister(axios) {
      Object.assign(options, axios.defaults["mock"]);
      if (!options.mockUrl) {
        throw new Error(`headers \u4E2D\u4F3C\u4E4E\u5E76\u6CA1\u6709\u914D\u7F6E 'mockURL'`);
      }
    },
    lifecycle: {
      preRequestTransform: {
        runWhen(_, { origin }) {
          if (!options.enable) {
            return false;
          }
          let mock2 = origin.mock ?? options.mock;
          if (typeof mock2 === "object") {
            return !!mock2.mock;
          } else {
            return !!mock2;
          }
        },
        handler: (config) => {
          const { mockUrl } = options;
          const { url } = config;
          if (!url) {
            config.baseURL = mockUrl;
          } else {
            if (!isAbsoluteURL(url)) {
              config.url = combineURLs(mockUrl, url);
            } else {
              const u = new URL(url);
              config.url = combineURLs(mockUrl, url.replace(u.origin, ""));
            }
          }
          return config;
        }
      }
    }
  };
};

const mock$1 = {
    __proto__: null,
    mock: mock
};

const envs = (options = []) => {
  return {
    name: "envs",
    beforeRegister(axios) {
      for (const { rule, config } of options) {
        if (rule()) {
          Object.assign(axios.defaults, config);
          break;
        }
      }
      axios.defaults;
    },
    lifecycle: {}
  };
};

const normalize = (options = {}) => {
  return {
    name: "normalize",
    lifecycle: {
      async transformRequest(config) {
        const def = {
          noNull: false,
          noUndefined: true,
          noNaN: false,
          deep: false
        };
        let filterDataRule = def;
        const normal = (data) => {
          if (!filterDataRule)
            return data;
          if (typeof data === "object") {
            if (data instanceof Array || data instanceof File) {
              return;
            }
            for (const key in config.data) {
              let value = config.data[key];
              if (filterDataRule.noUndefined && value === void 0) {
                delete config.data[key];
              }
              if (filterDataRule.noNull && value === null) {
                delete config.data[key];
              }
              if (filterDataRule.noNaN && isNaN(value)) {
                delete config.data[key];
              }
            }
          }
        };
        if (config.url && (options.url === true || options.url?.noDuplicateSlash)) {
          let reg = /^([a-z][a-z\d\+\-\.]*:)?\/\//i;
          let matched = config.url.match(reg);
          let schema = matched ? matched[0] : "";
          config.url = schema + config.url.replace(schema, "").replace(/[\/]{2,}/g, "/");
        }
        if (options.data !== false) {
          filterDataRule = typeof options.data === "object" ? options.data : def;
          normal(config.data);
        }
        if (options.params !== false) {
          filterDataRule = typeof options.params === "object" ? options.params : def;
          normal(config.params);
        }
        return config;
      }
    }
  };
};

const normalize$1 = {
    __proto__: null,
    normalize: normalize
};

const pathParams = (options = {}) => {
  return {
    name: "pathParams",
    lifecycle: {
      async transformRequest(config) {
        const reg = /[\$]{0,1}\{.+?\}/g;
        const getKey = (part) => {
          return part.match(/\$\{(.+?)\}/)[0];
        };
        const getValue = (key) => {
          let ds = options.form ? config[options.form] : { ...config.data, ...config.params };
          return ds[key];
        };
        const parts = config.url.match(reg);
        if (parts.length) {
          for (const part of parts) {
            const key = getKey(part);
            const value = getValue(key);
            config.url = config.url.replace(part, value);
          }
        }
        return config;
      }
    }
  };
};

const pathParams$1 = {
    __proto__: null,
    pathParams: pathParams
};

const sign = (options = {}) => {
  return {
    name: "sign",
    enforce: "post",
    lifecycle: {
      async transformRequest(config) {
        let serializedStr;
        const data = klona(config.data);
        let entries = Object.entries(data);
        if (options.sort !== false) {
          entries = entries.sort(([a], [b]) => {
            if (options.sort)
              return options.sort(a, b);
            else
              return a.localeCompare(b);
          });
        }
        if (options.filter !== false) {
          entries = entries.filter(([key, value]) => {
            if (typeof options.filter === "function") {
              return options.filter(key, value);
            } else {
              return value !== null && value !== void 0 && `${value}`.trim() === "";
            }
          });
        }
        let obj = entries.reduce((o, [key, value]) => {
          o[key] = value;
          return o;
        }, {});
        if (typeof options.salt === "object") {
          Object.assign(obj, options.salt);
          serializedStr = stringify(data, { arrayFormat: "brackets" });
        } else if (typeof options.salt === "string") {
          serializedStr = stringify(data, { arrayFormat: "brackets" }) + options.salt;
        } else {
          serializedStr = stringify(data, { arrayFormat: "brackets" });
        }
        const sign2 = typeof options.algorithm === "function" ? options.algorithm(serializedStr) : MD5(serializedStr).toString();
        config.data[options.key ?? "sign"] = sign2;
        return config;
      }
    }
  };
};

const sign$1 = {
    __proto__: null,
    sign: sign
};

const sentryCapture = (options) => {
  return {
    name: "sentry-capture",
    lifecycle: {
      captureException: (reason) => {
        if (options?.sentry?.captureException)
          options.sentry.captureException(reason);
        return reason;
      }
    }
  };
};

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class OnlySendError extends Error {
  constructor() {
    super(...arguments);
    __publicField$1(this, "type", "onlySend");
  }
}
const onlySend = (options = {}) => {
  return {
    name: "onlySend",
    enforce: "post",
    lifecycle: {
      preRequestTransform(config) {
        if (typeof config.adapter === "function") {
          throw new Error("\u9002\u914D\u5668\u5DF2\u7ECF\u914D\u7F6E\u8FC7\u4E86, \u91CD\u590D\u6DFB\u52A0\u5C06\u4EA7\u751F\u51B2\u7A81, \u8BF7\u68C0\u67E5!");
        }
        if (!navigator.sendBeacon) {
          let message = "\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 `navigator.sendBeacon`";
          if (options.noSupport === "error") {
            throw new OnlySendError(message);
          } else {
            console.error(message);
          }
        } else {
          config.adapter = async (config2) => {
            if (!isAbsoluteURL(config2.url)) {
              config2.url = combineURLs(config2.baseURL, config2.url);
            }
            const form = new FormData();
            toFormData(Object.assign({}, config2.data, config2.params), new FormData());
            let success = navigator.sendBeacon(config2.url, form);
            return {
              config: config2,
              data: null,
              headers: {},
              status: success ? 200 : 500,
              statusText: "success"
            };
          };
        }
        return config;
      }
    }
  };
};

const onlySend$1 = {
    __proto__: null,
    OnlySendError: OnlySendError,
    onlySend: onlySend
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const mapping = {
  alipay: "my",
  baidu: "swan",
  douyin: "tt",
  feishu: "tt",
  dingTalk: "dd"
};
class MpRequestError extends Error {
  constructor(err) {
    super(err.errMsg);
    __publicField(this, "type", "MpRequestError");
    /** 错误信息 */
    __publicField(this, "errMsg");
    /** 需要基础库： `2.24.0`
     *
     * errno 错误码，错误码的详细说明参考 [Errno错误码](https://developers.weixin.qq.com/miniprogram/dev/framework/usability/PublicErrno.html) */
    __publicField(this, "errno");
    this.errMsg = err.errMsg;
    this.errno = this.errno;
  }
}
const mp = (options) => {
  return {
    name: "mp",
    enforce: "post",
    lifecycle: {
      preRequestTransform(config) {
        if (typeof config.adapter === "function") {
          throw new Error("\u9002\u914D\u5668\u5DF2\u7ECF\u914D\u7F6E\u8FC7\u4E86, \u91CD\u590D\u6DFB\u52A0\u5C06\u4EA7\u751F\u51B2\u7A81, \u8BF7\u68C0\u67E5!");
        }
        config.adapter = (config2) => {
          return new Promise((resolve, reject) => {
            let env = mapping[options.env] ?? options.env;
            let sys = globalThis[env];
            if (!sys) {
              reject(new Error(`\u63D2\u4EF6\u4E0D\u53EF\u7528, \u672A\u627E\u5230 '${env}' \u5168\u5C40\u53D8\u91CF`));
            }
            if (!isAbsoluteURL(config2.url)) {
              config2.url = combineURLs(config2.baseURL, config2.url);
            }
            sys.request({
              method: config2.method.toUpperCase(),
              url: config2.url,
              data: Object.assign({}, config2.data, config2.params),
              header: config2.headers,
              timeout: config2.timeout,
              // 合并公共参数
              ...options.config,
              success: (result) => {
                resolve({
                  data: result.data,
                  status: result.statusCode,
                  statusText: result.errMsg,
                  headers: {
                    "set-cookie": result.cookies,
                    ...result.header
                  },
                  config: config2
                });
              },
              fail: (err) => {
                reject(new MpRequestError(err));
              }
            });
          });
        };
        return config;
      }
    }
  };
};

const mp$1 = {
    __proto__: null,
    MpRequestError: MpRequestError,
    mp: mp
};

export { cache$1 as Cache, cancel$1 as Cancel, debounce$1 as Debounce, loading$1 as Loading, logger$1 as Logger, merge$1 as Merge, mock$1 as Mock, mp$1 as Mp, normalize$1 as Normalize, onlySend$1 as OnlySend, pathParams$1 as PathParams, retry$1 as Retry, sign$1 as Sign, throttle$1 as Throttle, transform$1 as Transform, cache, cancel, cancelAll, debounce, envs, loading, logger, merge, mock, mp, normalize, onlySend, pathParams, retry, sentryCapture, sign, throttle, transform };

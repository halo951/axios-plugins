// @ts-nocheck
/**
* axios-plugins@0.4.1
*
* Copyright (c) 2024 halo951 <https://github.com/halo951>
* Released under MIT License
*
* @build Thu Jun 27 2024 19:13:04 GMT+0800 (中国标准时间)
* @author halo951(https://github.com/halo951)
* @license MIT
*/
'use strict';

const axios = require('axios');
const json = require('klona/json');

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class AbortError extends Error {
  constructor(abort) {
    super();
    __publicField$1(this, "type", "abort");
    __publicField$1(this, "abort");
    this.abort = abort;
  }
}
class SlientError extends Error {
  constructor() {
    super(...arguments);
    __publicField$1(this, "type", "slient");
  }
}
const createAbortChain = (initial) => {
  const chain = [];
  const controller = {
    abort(res2) {
      throw new AbortError({ success: true, res: res2 });
    },
    abortError(reason) {
      throw new AbortError({ success: false, res: reason });
    },
    slient() {
      throw new SlientError();
    }
  };
  let onCapture;
  let onCompleted;
  let onAbort;
  let res = initial;
  return {
    /** 下一任务 */
    next(event) {
      chain.push(event);
      return this;
    },
    /** 捕获异常后触发 */
    capture(event) {
      if (onCapture) {
        throw new Error("`onCapture` is registered");
      }
      onCapture = event;
      return this;
    },
    /** 执行完成后触发 */
    completed(event) {
      if (onCompleted) {
        throw new Error("`onCompleted` is registered");
      }
      onCompleted = event;
      return this;
    },
    /**
     * 执行中断后触发
     *
     * @description 增加 `abort` 以解决触发 `Abort` 后造成的后续请求阻塞. (主要体现在: merge 插件)
     */
    abort(event) {
      if (onAbort) {
        throw new Error("`onAbort` is registered");
      }
      onAbort = event;
      return this;
    },
    /** 停止添加并执行 */
    async done() {
      const run = async () => {
        let abortRes;
        try {
          for (const task of chain) {
            res = await task(res, controller);
          }
          return res;
        } catch (reason) {
          if (reason instanceof AbortError) {
            abortRes = reason;
          }
          if (onCapture && !(reason instanceof AbortError || reason instanceof SlientError)) {
            return await onCapture(reason, controller);
          } else {
            throw reason;
          }
        } finally {
          if (onCompleted)
            await onCompleted(controller);
          if (!!abortRes && onAbort)
            await onAbort(abortRes);
        }
      };
      try {
        return await run();
      } catch (reason) {
        if (reason instanceof AbortError) {
          if (reason.abort.success) {
            return reason.abort.res;
          } else {
            throw reason.abort.res;
          }
        } else if (reason instanceof SlientError) {
          return new Promise(() => {
          });
        } else {
          throw reason;
        }
      }
    }
  };
};

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class AxiosExtension extends axios.Axios {
  constructor(config, interceptors) {
    super(config);
    /** 添加的插件集合 */
    __publicField(this, "__plugins__", []);
    /** 插件共享内存空间 */
    __publicField(this, "__shared__", {});
    this.interceptors = interceptors;
    const originRequest = this.request;
    const vm = this;
    const getHook = (hookName) => {
      return this.__plugins__.map((plug) => {
        const hook = plug.lifecycle?.[hookName];
        if (typeof hook === "function") {
          return {
            runWhen: () => true,
            handler: hook
          };
        } else if (hook) {
          return hook;
        }
      }).filter((hook) => !!hook);
    };
    const hasHook = (hookName) => {
      return getHook(hookName).length > 0;
    };
    const runHook = async (hookName, reverse, arg1, arg2, arg3) => {
      let hooks = reverse ? getHook(hookName).reverse() : getHook(hookName);
      for (const hook of hooks) {
        if (hook.runWhen.call(hook.runWhen, arg1, arg2)) {
          arg1 = await hook.handler.call(
            hook,
            ...arg2 ? [arg1, arg2, arg3] : [arg1, arg3]
          );
        }
      }
      return arg1;
    };
    this.request = async function(config2) {
      const origin = json.klona(config2);
      const share = { origin, shared: this.__shared__, axios: vm };
      return await createAbortChain(config2).next((config3, controller) => runHook("preRequestTransform", false, config3, share, controller)).next((config3) => originRequest.call(vm, config3)).next((response, controller) => runHook("postResponseTransform", true, response, share, controller)).capture(async (e, controller) => {
        if (hasHook("captureException")) {
          return await runHook("captureException", true, e, share, controller);
        } else {
          throw e;
        }
      }).completed(
        (controller) => runHook("completed", true, share, void 0, controller)
      ).abort((reason) => runHook("aborted", true, reason, share, void 0)).done();
    };
    this.interceptors.request.use((config2) => {
      return runHook("transformRequest", false, config2, this.__shared__, {
        abort(res) {
          throw new AbortError({ success: true, res });
        },
        abortError(reason) {
          throw new AbortError({ success: false, res: reason });
        },
        slient() {
          throw new SlientError();
        }
      });
    });
  }
}
const IGNORE_COVERAGE = ["prototype"];
const injectPluginHooks = (axios) => {
  if (axios["__plugins__"]) {
    return;
  }
  const extension = new AxiosExtension(axios.defaults, axios.interceptors);
  const properties = Object.getOwnPropertyNames(axios).concat(["__shared__", "__plugins__"]).filter((prop) => extension[prop] && !IGNORE_COVERAGE.includes(prop)).reduce((properties2, prop) => {
    properties2[prop] = {
      get() {
        return extension[prop];
      },
      set(v) {
        extension[prop] = v;
      }
    };
    return properties2;
  }, {});
  Object.defineProperties(axios, properties);
};
const injectPlugin = (axios, plug) => {
  const soryByEnforce = (plugins) => {
    return plugins.sort((a, b) => {
      if (a.enforce === "pre" || b.enforce === "post") {
        return -1;
      } else if (a.enforce === "post" || b.enforce === "pre") {
        return 1;
      } else {
        return 0;
      }
    });
  };
  if (!plug.lifecycle)
    plug.lifecycle = {};
  if (axios.__plugins__) {
    axios.__plugins__.push(plug);
    axios.__plugins__ = soryByEnforce(axios.__plugins__);
  }
};
const useAxiosPlugin = (axios) => {
  injectPluginHooks(axios);
  return {
    /** 添加新插件 */
    plugin(plug) {
      plug.beforeRegister?.(axios);
      injectPlugin(axios, plug);
      return this;
    },
    /**
     * 包装 `axios({ ... })`
     *
     * @description 使 `axiox({ ... })` 具备插件能力
     */
    wrap() {
      return new Proxy(axios, {
        apply(_target, _thisArg, args) {
          return axios.request.call(axios, args[0]);
        }
      });
    }
  };
};

exports.useAxiosPlugin = useAxiosPlugin;

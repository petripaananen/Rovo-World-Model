"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../../node_modules/tslib/tslib.es6.mjs
  var tslib_es6_exports = {};
  __export(tslib_es6_exports, {
    __addDisposableResource: () => __addDisposableResource,
    __assign: () => __assign,
    __asyncDelegator: () => __asyncDelegator,
    __asyncGenerator: () => __asyncGenerator,
    __asyncValues: () => __asyncValues,
    __await: () => __await,
    __awaiter: () => __awaiter,
    __classPrivateFieldGet: () => __classPrivateFieldGet,
    __classPrivateFieldIn: () => __classPrivateFieldIn,
    __classPrivateFieldSet: () => __classPrivateFieldSet,
    __createBinding: () => __createBinding,
    __decorate: () => __decorate,
    __disposeResources: () => __disposeResources,
    __esDecorate: () => __esDecorate,
    __exportStar: () => __exportStar,
    __extends: () => __extends,
    __generator: () => __generator,
    __importDefault: () => __importDefault,
    __importStar: () => __importStar,
    __makeTemplateObject: () => __makeTemplateObject,
    __metadata: () => __metadata,
    __param: () => __param,
    __propKey: () => __propKey,
    __read: () => __read,
    __rest: () => __rest,
    __rewriteRelativeImportExtension: () => __rewriteRelativeImportExtension,
    __runInitializers: () => __runInitializers,
    __setFunctionName: () => __setFunctionName,
    __spread: () => __spread,
    __spreadArray: () => __spreadArray,
    __spreadArrays: () => __spreadArrays,
    __values: () => __values,
    default: () => tslib_es6_default
  });
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }
  function __param(paramIndex, decorator) {
    return function(target, key) {
      decorator(target, key, paramIndex);
    };
  }
  function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) {
      if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function(f) {
        if (done) throw new TypeError("Cannot add initializers after decoration has completed");
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object") throw new TypeError("Object expected");
        if (_ = accept(result.get)) descriptor.get = _;
        if (_ = accept(result.set)) descriptor.set = _;
        if (_ = accept(result.init)) initializers.unshift(_);
      } else if (_ = accept(result)) {
        if (kind === "field") initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  }
  function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  }
  function __propKey(x) {
    return typeof x === "symbol" ? x : "".concat(x);
  }
  function __setFunctionName(f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
  }
  function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1) throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
  }
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
      next: function() {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
  }
  function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  }
  function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  }
  function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  }
  function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function awaitReturn(f) {
      return function(v) {
        return Promise.resolve(v).then(f, reject);
      };
    }
    function verb(n, f) {
      if (g[n]) {
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
        if (f) i[n] = f(i[n]);
      }
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
  }
  function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function(e) {
      throw e;
    }), verb("return"), i[Symbol.iterator] = function() {
      return this;
    }, i;
    function verb(n, f) {
      i[n] = o[n] ? function(v) {
        return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v;
      } : f;
    }
  }
  function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  }
  function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  }
  function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
      for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
  }
  function __importDefault(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  }
  function __classPrivateFieldGet(receiver, state2, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state2 === "function" ? receiver !== state2 || !f : !state2.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state2.get(receiver);
  }
  function __classPrivateFieldSet(receiver, state2, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state2 === "function" ? receiver !== state2 || !f : !state2.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state2.set(receiver, value), value;
  }
  function __classPrivateFieldIn(state2, receiver) {
    if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state2 === "function" ? receiver === state2 : state2.has(receiver);
  }
  function __addDisposableResource(env, value, async) {
    if (value !== null && value !== void 0) {
      if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
      var dispose, inner;
      if (async) {
        if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
        dispose = value[Symbol.asyncDispose];
      }
      if (dispose === void 0) {
        if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
        dispose = value[Symbol.dispose];
        if (async) inner = dispose;
      }
      if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
      if (inner) dispose = function() {
        try {
          inner.call(this);
        } catch (e) {
          return Promise.reject(e);
        }
      };
      env.stack.push({ value, dispose, async });
    } else if (async) {
      env.stack.push({ async: true });
    }
    return value;
  }
  function __disposeResources(env) {
    function fail(e) {
      env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) {
        try {
          if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
          if (r.dispose) {
            var result = r.dispose.call(r.value);
            if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
              fail(e);
              return next();
            });
          } else s |= 1;
        } catch (e) {
          fail(e);
        }
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  }
  function __rewriteRelativeImportExtension(path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
      return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
        return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
      });
    }
    return path;
  }
  var extendStatics, __assign, __createBinding, __setModuleDefault, ownKeys, _SuppressedError, tslib_es6_default;
  var init_tslib_es6 = __esm({
    "../../node_modules/tslib/tslib.es6.mjs"() {
      extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      __assign = function() {
        __assign = Object.assign || function __assign2(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
        };
        return __assign.apply(this, arguments);
      };
      __createBinding = Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      __setModuleDefault = Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      };
      ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
      };
      tslib_es6_default = {
        __extends,
        __assign,
        __rest,
        __decorate,
        __param,
        __esDecorate,
        __runInitializers,
        __propKey,
        __setFunctionName,
        __metadata,
        __awaiter,
        __generator,
        __createBinding,
        __exportStar,
        __values,
        __read,
        __spread,
        __spreadArrays,
        __spreadArray,
        __await,
        __asyncGenerator,
        __asyncDelegator,
        __asyncValues,
        __makeTemplateObject,
        __importStar,
        __importDefault,
        __classPrivateFieldGet,
        __classPrivateFieldSet,
        __classPrivateFieldIn,
        __addDisposableResource,
        __disposeResources,
        __rewriteRelativeImportExtension
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/router/targets.js
  var require_targets = __commonJS({
    "../../node_modules/@forge/bridge/out/router/targets.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.NavigationTarget = void 0;
      exports.NavigationTarget = {
        ContentView: "contentView",
        ContentEdit: "contentEdit",
        ContentList: "contentList",
        SpaceView: "spaceView",
        Module: "module",
        UserProfile: "userProfile",
        Dashboard: "dashboard",
        Issue: "issue",
        ProjectSettingsDetails: "projectSettingsDetails"
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/errors.js
  var require_errors = __commonJS({
    "../../node_modules/@forge/bridge/out/errors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.BridgeAPIError = void 0;
      var BridgeAPIError = class extends Error {
      };
      exports.BridgeAPIError = BridgeAPIError;
    }
  });

  // ../../node_modules/@forge/bridge/out/bridge.js
  var require_bridge = __commonJS({
    "../../node_modules/@forge/bridge/out/bridge.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getCallBridge = void 0;
      var errors_1 = require_errors();
      function isBridgeAvailable(bridge) {
        return !!(bridge === null || bridge === void 0 ? void 0 : bridge.callBridge);
      }
      var getCallBridge = () => {
        if (!isBridgeAvailable(window.__bridge)) {
          throw new errors_1.BridgeAPIError(`
      Unable to establish a connection with the Custom UI bridge.
      If you are trying to run your app locally, Forge apps only work in the context of Atlassian products. Refer to https://go.atlassian.com/forge-tunneling-with-custom-ui for how to tunnel when using a local development server.
    `);
        }
        return window.__bridge.callBridge;
      };
      exports.getCallBridge = getCallBridge;
    }
  });

  // ../../node_modules/@forge/bridge/out/utils/index.js
  var require_utils = __commonJS({
    "../../node_modules/@forge/bridge/out/utils/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.withRateLimiter = void 0;
      var errors_1 = require_errors();
      var withRateLimiter = (wrappedFn, maxOps, intervalInMs, exceededErrorMessage) => {
        let start = Date.now();
        let numOps = 0;
        return async (...args) => {
          const now = Date.now();
          const elapsed = now - start;
          if (elapsed > intervalInMs) {
            start = now;
            numOps = 0;
          }
          if (numOps >= maxOps) {
            throw new errors_1.BridgeAPIError(exceededErrorMessage || "Too many invocations.");
          }
          numOps = numOps + 1;
          return wrappedFn(...args);
        };
      };
      exports.withRateLimiter = withRateLimiter;
    }
  });

  // ../../node_modules/@forge/bridge/out/invoke/invoke.js
  var require_invoke = __commonJS({
    "../../node_modules/@forge/bridge/out/invoke/invoke.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.invoke = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var utils_1 = require_utils();
      var callBridge = (0, bridge_1.getCallBridge)();
      var validatePayload = (payload) => {
        if (!payload)
          return;
        if (Object.values(payload).some((val) => typeof val === "function")) {
          throw new errors_1.BridgeAPIError("Passing functions as part of the payload is not supported!");
        }
      };
      var _invoke = (functionKey, payload) => {
        if (typeof functionKey !== "string") {
          throw new errors_1.BridgeAPIError("functionKey must be a string!");
        }
        validatePayload(payload);
        return callBridge("invoke", { functionKey, payload });
      };
      exports.invoke = (0, utils_1.withRateLimiter)(_invoke, 500, 1e3 * 25, "Resolver calls are rate limited at 500req/25s");
    }
  });

  // ../../node_modules/@forge/bridge/out/invoke/index.js
  var require_invoke2 = __commonJS({
    "../../node_modules/@forge/bridge/out/invoke/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_invoke(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/invoke-remote/invoke-remote.js
  var require_invoke_remote = __commonJS({
    "../../node_modules/@forge/bridge/out/invoke-remote/invoke-remote.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.invokeRemote = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var utils_1 = require_utils();
      var MAX_NUM_OPERATIONS = 500;
      var OPERATION_INTERVAL_MS = 1e3 * 25;
      var callBridge = (0, bridge_1.getCallBridge)();
      var validatePayload = (payload) => {
        if (!payload)
          return;
        if (Object.values(payload).some((val) => typeof val === "function")) {
          throw new errors_1.BridgeAPIError("Passing functions as part of the payload is not supported!");
        }
      };
      var _invokeRemote = async (input) => {
        var _a;
        validatePayload(input);
        const { success, payload, error } = (_a = await callBridge("invoke", input)) !== null && _a !== void 0 ? _a : {};
        const response = { ...success ? payload : error };
        if (response && response.headers) {
          for (const header in response.headers) {
            if (Array.isArray(response.headers[header])) {
              response.headers[header] = response.headers[header].join(",");
            }
          }
        }
        return response;
      };
      exports.invokeRemote = (0, utils_1.withRateLimiter)(_invokeRemote, MAX_NUM_OPERATIONS, OPERATION_INTERVAL_MS, "Remote invocation calls are rate limited at 500req/25s");
    }
  });

  // ../../node_modules/@forge/bridge/out/invoke-remote/index.js
  var require_invoke_remote2 = __commonJS({
    "../../node_modules/@forge/bridge/out/invoke-remote/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_invoke_remote(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/view/submit.js
  var require_submit = __commonJS({
    "../../node_modules/@forge/bridge/out/view/submit.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.submit = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var submit = async (payload) => {
        const success = await callBridge("submit", payload);
        if (success === false) {
          throw new errors_1.BridgeAPIError("this resource's view is not submittable.");
        }
      };
      exports.submit = submit;
    }
  });

  // ../../node_modules/@forge/bridge/out/view/close.js
  var require_close = __commonJS({
    "../../node_modules/@forge/bridge/out/view/close.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.close = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var close = async (payload) => {
        try {
          const success = await callBridge("close", payload);
          if (success === false) {
            throw new errors_1.BridgeAPIError("this resource's view is not closable.");
          }
        } catch (e) {
          throw new errors_1.BridgeAPIError("this resource's view is not closable.");
        }
      };
      exports.close = close;
    }
  });

  // ../../node_modules/@forge/bridge/out/view/refresh.js
  var require_refresh = __commonJS({
    "../../node_modules/@forge/bridge/out/view/refresh.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.refresh = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var refresh = async (payload) => {
        const success = await callBridge("refresh", payload);
        if (success === false) {
          throw new errors_1.BridgeAPIError("this resource's view is not refreshable.");
        }
      };
      exports.refresh = refresh;
    }
  });

  // ../../node_modules/@forge/bridge/out/view/createHistory.js
  var require_createHistory = __commonJS({
    "../../node_modules/@forge/bridge/out/view/createHistory.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createHistory = void 0;
      var bridge_1 = require_bridge();
      var callBridge = (0, bridge_1.getCallBridge)();
      var createHistory = async () => {
        const history = await callBridge("createHistory");
        history.listen((location) => {
          history.location = location;
        });
        return history;
      };
      exports.createHistory = createHistory;
    }
  });

  // ../../node_modules/@forge/i18n/out/constants.js
  var require_constants = __commonJS({
    "../../node_modules/@forge/i18n/out/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FORGE_SUPPORTED_LOCALE_CODES = exports.I18N_BUNDLE_FOLDER_NAME = exports.I18N_INFO_FILE_NAME = void 0;
      exports.I18N_INFO_FILE_NAME = "i18n-info.json";
      exports.I18N_BUNDLE_FOLDER_NAME = "__LOCALES__";
      exports.FORGE_SUPPORTED_LOCALE_CODES = [
        "zh-CN",
        "zh-TW",
        "cs-CZ",
        "da-DK",
        "nl-NL",
        "en-US",
        "en-GB",
        "et-EE",
        "fi-FI",
        "fr-FR",
        "de-DE",
        "hu-HU",
        "is-IS",
        "it-IT",
        "ja-JP",
        "ko-KR",
        "no-NO",
        "pl-PL",
        "pt-BR",
        "pt-PT",
        "ro-RO",
        "ru-RU",
        "sk-SK",
        "tr-TR",
        "es-ES",
        "sv-SE"
      ];
    }
  });

  // ../../node_modules/@forge/i18n/out/translationsGetter.js
  var require_translationsGetter = __commonJS({
    "../../node_modules/@forge/i18n/out/translationsGetter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TranslationsGetter = exports.TranslationGetterError = void 0;
      var pushIfNotExists = (array, item) => {
        if (!array.includes(item)) {
          array.push(item);
        }
      };
      var TranslationGetterError = class extends Error {
        constructor(message) {
          super(message);
          this.name = "TranslationGetterError";
        }
      };
      exports.TranslationGetterError = TranslationGetterError;
      var TranslationsGetter = class {
        constructor(resourcesAccessor) {
          __publicField(this, "resourcesAccessor");
          __publicField(this, "i18nInfoConfig", null);
          __publicField(this, "translationResources", /* @__PURE__ */ new Map());
          this.resourcesAccessor = resourcesAccessor;
        }
        async getTranslations(locale, options = { fallback: true }) {
          const i18nInfoConfig = await this.getI18nInfoConfig();
          const { fallback } = options;
          if (!fallback) {
            let translationResource;
            if (i18nInfoConfig.locales.includes(locale)) {
              translationResource = await this.getTranslationResource(locale);
            }
            return {
              translations: translationResource ?? null,
              locale
            };
          }
          for (const targetLocale of this.getLocaleLookupOrder(locale, i18nInfoConfig)) {
            const translationResource = await this.getTranslationResource(targetLocale);
            if (translationResource) {
              return {
                translations: translationResource,
                locale: targetLocale
              };
            }
          }
          return {
            translations: null,
            locale
          };
        }
        async getTranslationsByLocaleLookupOrder(locale) {
          const i18nInfoConfig = await this.getI18nInfoConfig();
          const lookupOrder = this.getLocaleLookupOrder(locale, i18nInfoConfig);
          return await Promise.all(lookupOrder.map(async (targetLocale) => {
            const translationResource = await this.getTranslationResource(targetLocale);
            return {
              locale: targetLocale,
              translations: translationResource
            };
          }));
        }
        reset() {
          this.i18nInfoConfig = null;
          this.translationResources.clear();
        }
        async getTranslationResource(locale) {
          let resource = this.translationResources.get(locale);
          if (!resource) {
            try {
              resource = await this.resourcesAccessor.getTranslationResource(locale);
              this.translationResources.set(locale, resource);
            } catch (error) {
              if (error instanceof TranslationGetterError) {
                throw error;
              }
              throw new TranslationGetterError(`Failed to get translation resource for locale: ${locale}`);
            }
          }
          return resource;
        }
        async getI18nInfoConfig() {
          if (!this.i18nInfoConfig) {
            try {
              this.i18nInfoConfig = await this.resourcesAccessor.getI18nInfoConfig();
            } catch (error) {
              if (error instanceof TranslationGetterError) {
                throw error;
              }
              throw new TranslationGetterError("Failed to get i18n info config");
            }
          }
          return this.i18nInfoConfig;
        }
        getLocaleLookupOrder(locale, config) {
          const { locales, fallback } = config;
          const lookupOrder = [locale];
          const fallbackLocales = fallback[locale];
          if (fallbackLocales && Array.isArray(fallbackLocales) && fallbackLocales.length > 0) {
            lookupOrder.push(...fallbackLocales);
          }
          pushIfNotExists(lookupOrder, config.fallback.default);
          return lookupOrder.filter((locale2) => locales.includes(locale2));
        }
      };
      exports.TranslationsGetter = TranslationsGetter;
    }
  });

  // ../../node_modules/lodash/isArray.js
  var require_isArray = __commonJS({
    "../../node_modules/lodash/isArray.js"(exports, module) {
      var isArray = Array.isArray;
      module.exports = isArray;
    }
  });

  // ../../node_modules/lodash/_freeGlobal.js
  var require_freeGlobal = __commonJS({
    "../../node_modules/lodash/_freeGlobal.js"(exports, module) {
      var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
      module.exports = freeGlobal;
    }
  });

  // ../../node_modules/lodash/_root.js
  var require_root = __commonJS({
    "../../node_modules/lodash/_root.js"(exports, module) {
      var freeGlobal = require_freeGlobal();
      var freeSelf = typeof self == "object" && self && self.Object === Object && self;
      var root = freeGlobal || freeSelf || Function("return this")();
      module.exports = root;
    }
  });

  // ../../node_modules/lodash/_Symbol.js
  var require_Symbol = __commonJS({
    "../../node_modules/lodash/_Symbol.js"(exports, module) {
      var root = require_root();
      var Symbol2 = root.Symbol;
      module.exports = Symbol2;
    }
  });

  // ../../node_modules/lodash/_getRawTag.js
  var require_getRawTag = __commonJS({
    "../../node_modules/lodash/_getRawTag.js"(exports, module) {
      var Symbol2 = require_Symbol();
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var nativeObjectToString = objectProto.toString;
      var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
      function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
          value[symToStringTag] = void 0;
          var unmasked = true;
        } catch (e) {
        }
        var result = nativeObjectToString.call(value);
        if (unmasked) {
          if (isOwn) {
            value[symToStringTag] = tag;
          } else {
            delete value[symToStringTag];
          }
        }
        return result;
      }
      module.exports = getRawTag;
    }
  });

  // ../../node_modules/lodash/_objectToString.js
  var require_objectToString = __commonJS({
    "../../node_modules/lodash/_objectToString.js"(exports, module) {
      var objectProto = Object.prototype;
      var nativeObjectToString = objectProto.toString;
      function objectToString(value) {
        return nativeObjectToString.call(value);
      }
      module.exports = objectToString;
    }
  });

  // ../../node_modules/lodash/_baseGetTag.js
  var require_baseGetTag = __commonJS({
    "../../node_modules/lodash/_baseGetTag.js"(exports, module) {
      var Symbol2 = require_Symbol();
      var getRawTag = require_getRawTag();
      var objectToString = require_objectToString();
      var nullTag = "[object Null]";
      var undefinedTag = "[object Undefined]";
      var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
      function baseGetTag(value) {
        if (value == null) {
          return value === void 0 ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
      }
      module.exports = baseGetTag;
    }
  });

  // ../../node_modules/lodash/isObjectLike.js
  var require_isObjectLike = __commonJS({
    "../../node_modules/lodash/isObjectLike.js"(exports, module) {
      function isObjectLike(value) {
        return value != null && typeof value == "object";
      }
      module.exports = isObjectLike;
    }
  });

  // ../../node_modules/lodash/isSymbol.js
  var require_isSymbol = __commonJS({
    "../../node_modules/lodash/isSymbol.js"(exports, module) {
      var baseGetTag = require_baseGetTag();
      var isObjectLike = require_isObjectLike();
      var symbolTag = "[object Symbol]";
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
      }
      module.exports = isSymbol;
    }
  });

  // ../../node_modules/lodash/_isKey.js
  var require_isKey = __commonJS({
    "../../node_modules/lodash/_isKey.js"(exports, module) {
      var isArray = require_isArray();
      var isSymbol = require_isSymbol();
      var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
      var reIsPlainProp = /^\w*$/;
      function isKey(value, object) {
        if (isArray(value)) {
          return false;
        }
        var type = typeof value;
        if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
          return true;
        }
        return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
      }
      module.exports = isKey;
    }
  });

  // ../../node_modules/lodash/isObject.js
  var require_isObject = __commonJS({
    "../../node_modules/lodash/isObject.js"(exports, module) {
      function isObject(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      module.exports = isObject;
    }
  });

  // ../../node_modules/lodash/isFunction.js
  var require_isFunction = __commonJS({
    "../../node_modules/lodash/isFunction.js"(exports, module) {
      var baseGetTag = require_baseGetTag();
      var isObject = require_isObject();
      var asyncTag = "[object AsyncFunction]";
      var funcTag = "[object Function]";
      var genTag = "[object GeneratorFunction]";
      var proxyTag = "[object Proxy]";
      function isFunction(value) {
        if (!isObject(value)) {
          return false;
        }
        var tag = baseGetTag(value);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
      }
      module.exports = isFunction;
    }
  });

  // ../../node_modules/lodash/_coreJsData.js
  var require_coreJsData = __commonJS({
    "../../node_modules/lodash/_coreJsData.js"(exports, module) {
      var root = require_root();
      var coreJsData = root["__core-js_shared__"];
      module.exports = coreJsData;
    }
  });

  // ../../node_modules/lodash/_isMasked.js
  var require_isMasked = __commonJS({
    "../../node_modules/lodash/_isMasked.js"(exports, module) {
      var coreJsData = require_coreJsData();
      var maskSrcKey = (function() {
        var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      })();
      function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
      }
      module.exports = isMasked;
    }
  });

  // ../../node_modules/lodash/_toSource.js
  var require_toSource = __commonJS({
    "../../node_modules/lodash/_toSource.js"(exports, module) {
      var funcProto = Function.prototype;
      var funcToString = funcProto.toString;
      function toSource(func) {
        if (func != null) {
          try {
            return funcToString.call(func);
          } catch (e) {
          }
          try {
            return func + "";
          } catch (e) {
          }
        }
        return "";
      }
      module.exports = toSource;
    }
  });

  // ../../node_modules/lodash/_baseIsNative.js
  var require_baseIsNative = __commonJS({
    "../../node_modules/lodash/_baseIsNative.js"(exports, module) {
      var isFunction = require_isFunction();
      var isMasked = require_isMasked();
      var isObject = require_isObject();
      var toSource = require_toSource();
      var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
      var reIsHostCtor = /^\[object .+?Constructor\]$/;
      var funcProto = Function.prototype;
      var objectProto = Object.prototype;
      var funcToString = funcProto.toString;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var reIsNative = RegExp(
        "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      );
      function baseIsNative(value) {
        if (!isObject(value) || isMasked(value)) {
          return false;
        }
        var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
        return pattern.test(toSource(value));
      }
      module.exports = baseIsNative;
    }
  });

  // ../../node_modules/lodash/_getValue.js
  var require_getValue = __commonJS({
    "../../node_modules/lodash/_getValue.js"(exports, module) {
      function getValue(object, key) {
        return object == null ? void 0 : object[key];
      }
      module.exports = getValue;
    }
  });

  // ../../node_modules/lodash/_getNative.js
  var require_getNative = __commonJS({
    "../../node_modules/lodash/_getNative.js"(exports, module) {
      var baseIsNative = require_baseIsNative();
      var getValue = require_getValue();
      function getNative(object, key) {
        var value = getValue(object, key);
        return baseIsNative(value) ? value : void 0;
      }
      module.exports = getNative;
    }
  });

  // ../../node_modules/lodash/_nativeCreate.js
  var require_nativeCreate = __commonJS({
    "../../node_modules/lodash/_nativeCreate.js"(exports, module) {
      var getNative = require_getNative();
      var nativeCreate = getNative(Object, "create");
      module.exports = nativeCreate;
    }
  });

  // ../../node_modules/lodash/_hashClear.js
  var require_hashClear = __commonJS({
    "../../node_modules/lodash/_hashClear.js"(exports, module) {
      var nativeCreate = require_nativeCreate();
      function hashClear() {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
        this.size = 0;
      }
      module.exports = hashClear;
    }
  });

  // ../../node_modules/lodash/_hashDelete.js
  var require_hashDelete = __commonJS({
    "../../node_modules/lodash/_hashDelete.js"(exports, module) {
      function hashDelete(key) {
        var result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result;
      }
      module.exports = hashDelete;
    }
  });

  // ../../node_modules/lodash/_hashGet.js
  var require_hashGet = __commonJS({
    "../../node_modules/lodash/_hashGet.js"(exports, module) {
      var nativeCreate = require_nativeCreate();
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      function hashGet(key) {
        var data = this.__data__;
        if (nativeCreate) {
          var result = data[key];
          return result === HASH_UNDEFINED ? void 0 : result;
        }
        return hasOwnProperty.call(data, key) ? data[key] : void 0;
      }
      module.exports = hashGet;
    }
  });

  // ../../node_modules/lodash/_hashHas.js
  var require_hashHas = __commonJS({
    "../../node_modules/lodash/_hashHas.js"(exports, module) {
      var nativeCreate = require_nativeCreate();
      var objectProto = Object.prototype;
      var hasOwnProperty = objectProto.hasOwnProperty;
      function hashHas(key) {
        var data = this.__data__;
        return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
      }
      module.exports = hashHas;
    }
  });

  // ../../node_modules/lodash/_hashSet.js
  var require_hashSet = __commonJS({
    "../../node_modules/lodash/_hashSet.js"(exports, module) {
      var nativeCreate = require_nativeCreate();
      var HASH_UNDEFINED = "__lodash_hash_undefined__";
      function hashSet(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
        return this;
      }
      module.exports = hashSet;
    }
  });

  // ../../node_modules/lodash/_Hash.js
  var require_Hash = __commonJS({
    "../../node_modules/lodash/_Hash.js"(exports, module) {
      var hashClear = require_hashClear();
      var hashDelete = require_hashDelete();
      var hashGet = require_hashGet();
      var hashHas = require_hashHas();
      var hashSet = require_hashSet();
      function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      Hash.prototype.clear = hashClear;
      Hash.prototype["delete"] = hashDelete;
      Hash.prototype.get = hashGet;
      Hash.prototype.has = hashHas;
      Hash.prototype.set = hashSet;
      module.exports = Hash;
    }
  });

  // ../../node_modules/lodash/_listCacheClear.js
  var require_listCacheClear = __commonJS({
    "../../node_modules/lodash/_listCacheClear.js"(exports, module) {
      function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
      }
      module.exports = listCacheClear;
    }
  });

  // ../../node_modules/lodash/eq.js
  var require_eq = __commonJS({
    "../../node_modules/lodash/eq.js"(exports, module) {
      function eq(value, other) {
        return value === other || value !== value && other !== other;
      }
      module.exports = eq;
    }
  });

  // ../../node_modules/lodash/_assocIndexOf.js
  var require_assocIndexOf = __commonJS({
    "../../node_modules/lodash/_assocIndexOf.js"(exports, module) {
      var eq = require_eq();
      function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
          if (eq(array[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      module.exports = assocIndexOf;
    }
  });

  // ../../node_modules/lodash/_listCacheDelete.js
  var require_listCacheDelete = __commonJS({
    "../../node_modules/lodash/_listCacheDelete.js"(exports, module) {
      var assocIndexOf = require_assocIndexOf();
      var arrayProto = Array.prototype;
      var splice = arrayProto.splice;
      function listCacheDelete(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
          data.pop();
        } else {
          splice.call(data, index, 1);
        }
        --this.size;
        return true;
      }
      module.exports = listCacheDelete;
    }
  });

  // ../../node_modules/lodash/_listCacheGet.js
  var require_listCacheGet = __commonJS({
    "../../node_modules/lodash/_listCacheGet.js"(exports, module) {
      var assocIndexOf = require_assocIndexOf();
      function listCacheGet(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        return index < 0 ? void 0 : data[index][1];
      }
      module.exports = listCacheGet;
    }
  });

  // ../../node_modules/lodash/_listCacheHas.js
  var require_listCacheHas = __commonJS({
    "../../node_modules/lodash/_listCacheHas.js"(exports, module) {
      var assocIndexOf = require_assocIndexOf();
      function listCacheHas(key) {
        return assocIndexOf(this.__data__, key) > -1;
      }
      module.exports = listCacheHas;
    }
  });

  // ../../node_modules/lodash/_listCacheSet.js
  var require_listCacheSet = __commonJS({
    "../../node_modules/lodash/_listCacheSet.js"(exports, module) {
      var assocIndexOf = require_assocIndexOf();
      function listCacheSet(key, value) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          ++this.size;
          data.push([key, value]);
        } else {
          data[index][1] = value;
        }
        return this;
      }
      module.exports = listCacheSet;
    }
  });

  // ../../node_modules/lodash/_ListCache.js
  var require_ListCache = __commonJS({
    "../../node_modules/lodash/_ListCache.js"(exports, module) {
      var listCacheClear = require_listCacheClear();
      var listCacheDelete = require_listCacheDelete();
      var listCacheGet = require_listCacheGet();
      var listCacheHas = require_listCacheHas();
      var listCacheSet = require_listCacheSet();
      function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      ListCache.prototype.clear = listCacheClear;
      ListCache.prototype["delete"] = listCacheDelete;
      ListCache.prototype.get = listCacheGet;
      ListCache.prototype.has = listCacheHas;
      ListCache.prototype.set = listCacheSet;
      module.exports = ListCache;
    }
  });

  // ../../node_modules/lodash/_Map.js
  var require_Map = __commonJS({
    "../../node_modules/lodash/_Map.js"(exports, module) {
      var getNative = require_getNative();
      var root = require_root();
      var Map2 = getNative(root, "Map");
      module.exports = Map2;
    }
  });

  // ../../node_modules/lodash/_mapCacheClear.js
  var require_mapCacheClear = __commonJS({
    "../../node_modules/lodash/_mapCacheClear.js"(exports, module) {
      var Hash = require_Hash();
      var ListCache = require_ListCache();
      var Map2 = require_Map();
      function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
          "hash": new Hash(),
          "map": new (Map2 || ListCache)(),
          "string": new Hash()
        };
      }
      module.exports = mapCacheClear;
    }
  });

  // ../../node_modules/lodash/_isKeyable.js
  var require_isKeyable = __commonJS({
    "../../node_modules/lodash/_isKeyable.js"(exports, module) {
      function isKeyable(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
      }
      module.exports = isKeyable;
    }
  });

  // ../../node_modules/lodash/_getMapData.js
  var require_getMapData = __commonJS({
    "../../node_modules/lodash/_getMapData.js"(exports, module) {
      var isKeyable = require_isKeyable();
      function getMapData(map, key) {
        var data = map.__data__;
        return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      module.exports = getMapData;
    }
  });

  // ../../node_modules/lodash/_mapCacheDelete.js
  var require_mapCacheDelete = __commonJS({
    "../../node_modules/lodash/_mapCacheDelete.js"(exports, module) {
      var getMapData = require_getMapData();
      function mapCacheDelete(key) {
        var result = getMapData(this, key)["delete"](key);
        this.size -= result ? 1 : 0;
        return result;
      }
      module.exports = mapCacheDelete;
    }
  });

  // ../../node_modules/lodash/_mapCacheGet.js
  var require_mapCacheGet = __commonJS({
    "../../node_modules/lodash/_mapCacheGet.js"(exports, module) {
      var getMapData = require_getMapData();
      function mapCacheGet(key) {
        return getMapData(this, key).get(key);
      }
      module.exports = mapCacheGet;
    }
  });

  // ../../node_modules/lodash/_mapCacheHas.js
  var require_mapCacheHas = __commonJS({
    "../../node_modules/lodash/_mapCacheHas.js"(exports, module) {
      var getMapData = require_getMapData();
      function mapCacheHas(key) {
        return getMapData(this, key).has(key);
      }
      module.exports = mapCacheHas;
    }
  });

  // ../../node_modules/lodash/_mapCacheSet.js
  var require_mapCacheSet = __commonJS({
    "../../node_modules/lodash/_mapCacheSet.js"(exports, module) {
      var getMapData = require_getMapData();
      function mapCacheSet(key, value) {
        var data = getMapData(this, key), size = data.size;
        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this;
      }
      module.exports = mapCacheSet;
    }
  });

  // ../../node_modules/lodash/_MapCache.js
  var require_MapCache = __commonJS({
    "../../node_modules/lodash/_MapCache.js"(exports, module) {
      var mapCacheClear = require_mapCacheClear();
      var mapCacheDelete = require_mapCacheDelete();
      var mapCacheGet = require_mapCacheGet();
      var mapCacheHas = require_mapCacheHas();
      var mapCacheSet = require_mapCacheSet();
      function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      MapCache.prototype.clear = mapCacheClear;
      MapCache.prototype["delete"] = mapCacheDelete;
      MapCache.prototype.get = mapCacheGet;
      MapCache.prototype.has = mapCacheHas;
      MapCache.prototype.set = mapCacheSet;
      module.exports = MapCache;
    }
  });

  // ../../node_modules/lodash/memoize.js
  var require_memoize = __commonJS({
    "../../node_modules/lodash/memoize.js"(exports, module) {
      var MapCache = require_MapCache();
      var FUNC_ERROR_TEXT = "Expected a function";
      function memoize(func, resolver) {
        if (typeof func != "function" || resolver != null && typeof resolver != "function") {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        var memoized = function() {
          var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
          if (cache.has(key)) {
            return cache.get(key);
          }
          var result = func.apply(this, args);
          memoized.cache = cache.set(key, result) || cache;
          return result;
        };
        memoized.cache = new (memoize.Cache || MapCache)();
        return memoized;
      }
      memoize.Cache = MapCache;
      module.exports = memoize;
    }
  });

  // ../../node_modules/lodash/_memoizeCapped.js
  var require_memoizeCapped = __commonJS({
    "../../node_modules/lodash/_memoizeCapped.js"(exports, module) {
      var memoize = require_memoize();
      var MAX_MEMOIZE_SIZE = 500;
      function memoizeCapped(func) {
        var result = memoize(func, function(key) {
          if (cache.size === MAX_MEMOIZE_SIZE) {
            cache.clear();
          }
          return key;
        });
        var cache = result.cache;
        return result;
      }
      module.exports = memoizeCapped;
    }
  });

  // ../../node_modules/lodash/_stringToPath.js
  var require_stringToPath = __commonJS({
    "../../node_modules/lodash/_stringToPath.js"(exports, module) {
      var memoizeCapped = require_memoizeCapped();
      var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
      var reEscapeChar = /\\(\\)?/g;
      var stringToPath = memoizeCapped(function(string) {
        var result = [];
        if (string.charCodeAt(0) === 46) {
          result.push("");
        }
        string.replace(rePropName, function(match, number, quote, subString) {
          result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
        });
        return result;
      });
      module.exports = stringToPath;
    }
  });

  // ../../node_modules/lodash/_arrayMap.js
  var require_arrayMap = __commonJS({
    "../../node_modules/lodash/_arrayMap.js"(exports, module) {
      function arrayMap(array, iteratee) {
        var index = -1, length = array == null ? 0 : array.length, result = Array(length);
        while (++index < length) {
          result[index] = iteratee(array[index], index, array);
        }
        return result;
      }
      module.exports = arrayMap;
    }
  });

  // ../../node_modules/lodash/_baseToString.js
  var require_baseToString = __commonJS({
    "../../node_modules/lodash/_baseToString.js"(exports, module) {
      var Symbol2 = require_Symbol();
      var arrayMap = require_arrayMap();
      var isArray = require_isArray();
      var isSymbol = require_isSymbol();
      var INFINITY = 1 / 0;
      var symbolProto = Symbol2 ? Symbol2.prototype : void 0;
      var symbolToString = symbolProto ? symbolProto.toString : void 0;
      function baseToString(value) {
        if (typeof value == "string") {
          return value;
        }
        if (isArray(value)) {
          return arrayMap(value, baseToString) + "";
        }
        if (isSymbol(value)) {
          return symbolToString ? symbolToString.call(value) : "";
        }
        var result = value + "";
        return result == "0" && 1 / value == -INFINITY ? "-0" : result;
      }
      module.exports = baseToString;
    }
  });

  // ../../node_modules/lodash/toString.js
  var require_toString = __commonJS({
    "../../node_modules/lodash/toString.js"(exports, module) {
      var baseToString = require_baseToString();
      function toString(value) {
        return value == null ? "" : baseToString(value);
      }
      module.exports = toString;
    }
  });

  // ../../node_modules/lodash/_castPath.js
  var require_castPath = __commonJS({
    "../../node_modules/lodash/_castPath.js"(exports, module) {
      var isArray = require_isArray();
      var isKey = require_isKey();
      var stringToPath = require_stringToPath();
      var toString = require_toString();
      function castPath(value, object) {
        if (isArray(value)) {
          return value;
        }
        return isKey(value, object) ? [value] : stringToPath(toString(value));
      }
      module.exports = castPath;
    }
  });

  // ../../node_modules/lodash/_toKey.js
  var require_toKey = __commonJS({
    "../../node_modules/lodash/_toKey.js"(exports, module) {
      var isSymbol = require_isSymbol();
      var INFINITY = 1 / 0;
      function toKey(value) {
        if (typeof value == "string" || isSymbol(value)) {
          return value;
        }
        var result = value + "";
        return result == "0" && 1 / value == -INFINITY ? "-0" : result;
      }
      module.exports = toKey;
    }
  });

  // ../../node_modules/lodash/_baseGet.js
  var require_baseGet = __commonJS({
    "../../node_modules/lodash/_baseGet.js"(exports, module) {
      var castPath = require_castPath();
      var toKey = require_toKey();
      function baseGet(object, path) {
        path = castPath(path, object);
        var index = 0, length = path.length;
        while (object != null && index < length) {
          object = object[toKey(path[index++])];
        }
        return index && index == length ? object : void 0;
      }
      module.exports = baseGet;
    }
  });

  // ../../node_modules/lodash/get.js
  var require_get = __commonJS({
    "../../node_modules/lodash/get.js"(exports, module) {
      var baseGet = require_baseGet();
      function get(object, path, defaultValue) {
        var result = object == null ? void 0 : baseGet(object, path);
        return result === void 0 ? defaultValue : result;
      }
      module.exports = get;
    }
  });

  // ../../node_modules/@forge/i18n/out/translationValueGetter.js
  var require_translationValueGetter = __commonJS({
    "../../node_modules/@forge/i18n/out/translationValueGetter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getTranslationValueFromContent = exports.getTranslationValue = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var get_1 = tslib_1.__importDefault(require_get());
      var getTranslationValue = (translationLookup, i18nKey, locale) => {
        const translation = translationLookup[locale];
        if (!translation) {
          return null;
        }
        return (0, exports.getTranslationValueFromContent)(translation, i18nKey);
      };
      exports.getTranslationValue = getTranslationValue;
      var getTranslationValueFromContent = (translationContent, i18nKey) => {
        let translationValue = translationContent[i18nKey];
        if (!translationValue) {
          const keyTokens = i18nKey.split(".");
          if (keyTokens.length > 1) {
            translationValue = (0, get_1.default)(translationContent, keyTokens, null);
          }
        }
        return typeof translationValue === "string" ? translationValue : null;
      };
      exports.getTranslationValueFromContent = getTranslationValueFromContent;
    }
  });

  // ../../node_modules/@forge/i18n/out/translator.js
  var require_translator = __commonJS({
    "../../node_modules/@forge/i18n/out/translator.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Translator = void 0;
      var translationValueGetter_1 = require_translationValueGetter();
      var Translator = class {
        constructor(locale, translationsGetter) {
          __publicField(this, "locale");
          __publicField(this, "translationsGetter");
          __publicField(this, "localeLookupOrderedTranslations", null);
          __publicField(this, "cache", /* @__PURE__ */ new Map());
          this.locale = locale;
          this.translationsGetter = translationsGetter;
        }
        async init() {
          this.localeLookupOrderedTranslations = await this.translationsGetter.getTranslationsByLocaleLookupOrder(this.locale);
        }
        translate(i18nKey) {
          if (!this.localeLookupOrderedTranslations) {
            throw new Error("TranslationLookup not initialized");
          }
          let result = this.cache.get(i18nKey);
          if (result === void 0) {
            for (const { translations } of this.localeLookupOrderedTranslations) {
              const translationValue = (0, translationValueGetter_1.getTranslationValueFromContent)(translations, i18nKey);
              if (translationValue !== null) {
                result = translationValue;
                break;
              }
            }
            result = result ?? null;
            this.cache.set(i18nKey, result);
          }
          return result;
        }
      };
      exports.Translator = Translator;
    }
  });

  // ../../node_modules/@forge/i18n/out/ensureLocale.js
  var require_ensureLocale = __commonJS({
    "../../node_modules/@forge/i18n/out/ensureLocale.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ensureLocale = void 0;
      var constants_1 = require_constants();
      var forgeSupportedLocaleCodesSet = new Set(constants_1.FORGE_SUPPORTED_LOCALE_CODES);
      var localeFallbacks = {
        "en-UK": "en-GB",
        "nb-NO": "no-NO"
      };
      var languageToLocaleCodeMap = constants_1.FORGE_SUPPORTED_LOCALE_CODES.reduce((agg, code) => {
        const [lng] = code.split("-");
        if (!agg[lng]) {
          agg[lng] = code;
        }
        return agg;
      }, {
        nb: "no-NO",
        pt: "pt-PT"
      });
      var ensureLocale = (rawLocale) => {
        const locale = rawLocale.replace("_", "-");
        if (forgeSupportedLocaleCodesSet.has(locale)) {
          return locale;
        }
        return languageToLocaleCodeMap[locale] ?? localeFallbacks[locale] ?? null;
      };
      exports.ensureLocale = ensureLocale;
    }
  });

  // ../../node_modules/@forge/i18n/out/moduleI18nHelper.js
  var require_moduleI18nHelper = __commonJS({
    "../../node_modules/@forge/i18n/out/moduleI18nHelper.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.extractI18nPropertiesFromModules = exports.extractI18nKeysFromModules = exports.getI18nSupportedModuleEntries = void 0;
      var isObject = (value) => {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      };
      var isI18nValue = (value) => {
        return typeof value?.i18n === "string";
      };
      var isConnectModuleKey = (moduleKey) => moduleKey.startsWith("connect-");
      var isCoreModuleKey = (moduleKey) => moduleKey.startsWith("core:");
      var getI18nKeysFromObject = (obj) => {
        const visited = /* @__PURE__ */ new Set();
        const visit = (value, i18nPath) => {
          if (!isObject(value) || visited.has(value)) {
            return [];
          }
          visited.add(value);
          return Object.entries(value).flatMap(([propKey, propValue]) => {
            const currentPath = [...i18nPath, propKey];
            if (isI18nValue(propValue)) {
              return [{ propertyPath: currentPath, key: propValue.i18n }];
            } else if (Array.isArray(propValue)) {
              return propValue.flatMap((item) => visit(item, currentPath));
            }
            return visit(propValue, currentPath);
          });
        };
        return visit(obj, []);
      };
      var getI18nSupportedModuleEntries = (modules) => {
        return Object.entries(modules).flatMap(([moduleKey, moduleEntries]) => {
          if (!isConnectModuleKey(moduleKey) && !isCoreModuleKey(moduleKey) && moduleEntries && Array.isArray(moduleEntries) && moduleEntries.length > 0) {
            return moduleEntries.map((moduleEntry) => [moduleEntry, moduleKey]);
          }
          return [];
        });
      };
      exports.getI18nSupportedModuleEntries = getI18nSupportedModuleEntries;
      var extractI18nKeysFromModules = (modules) => {
        const i18nKeys = /* @__PURE__ */ new Set();
        for (const moduleEntry of (0, exports.getI18nSupportedModuleEntries)(modules)) {
          const i18nKeysForEntryValue = getI18nKeysFromObject(moduleEntry[0]);
          for (const { key } of i18nKeysForEntryValue) {
            i18nKeys.add(key);
          }
        }
        return i18nKeys.size > 0 ? Array.from(i18nKeys) : [];
      };
      exports.extractI18nKeysFromModules = extractI18nKeysFromModules;
      var extractI18nPropertiesFromModules = (modules) => {
        const moduleI18nProperties = [];
        for (const moduleEntry of (0, exports.getI18nSupportedModuleEntries)(modules)) {
          const i18nKeysForEntryValue = getI18nKeysFromObject(moduleEntry[0]);
          for (const i18nObj of i18nKeysForEntryValue) {
            moduleI18nProperties.push({ moduleName: moduleEntry[1], ...i18nObj });
          }
        }
        return moduleI18nProperties;
      };
      exports.extractI18nPropertiesFromModules = extractI18nPropertiesFromModules;
    }
  });

  // ../../node_modules/@forge/i18n/out/types.js
  var require_types = __commonJS({
    "../../node_modules/@forge/i18n/out/types.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
    }
  });

  // ../../node_modules/@forge/i18n/out/index.js
  var require_out = __commonJS({
    "../../node_modules/@forge/i18n/out/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getI18nSupportedModuleEntries = exports.extractI18nPropertiesFromModules = exports.extractI18nKeysFromModules = exports.getTranslationValue = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_constants(), exports);
      tslib_1.__exportStar(require_translationsGetter(), exports);
      tslib_1.__exportStar(require_translator(), exports);
      tslib_1.__exportStar(require_ensureLocale(), exports);
      var translationValueGetter_1 = require_translationValueGetter();
      Object.defineProperty(exports, "getTranslationValue", { enumerable: true, get: function() {
        return translationValueGetter_1.getTranslationValue;
      } });
      var moduleI18nHelper_1 = require_moduleI18nHelper();
      Object.defineProperty(exports, "extractI18nKeysFromModules", { enumerable: true, get: function() {
        return moduleI18nHelper_1.extractI18nKeysFromModules;
      } });
      Object.defineProperty(exports, "extractI18nPropertiesFromModules", { enumerable: true, get: function() {
        return moduleI18nHelper_1.extractI18nPropertiesFromModules;
      } });
      Object.defineProperty(exports, "getI18nSupportedModuleEntries", { enumerable: true, get: function() {
        return moduleI18nHelper_1.getI18nSupportedModuleEntries;
      } });
      tslib_1.__exportStar(require_types(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/view/getContext.js
  var require_getContext = __commonJS({
    "../../node_modules/@forge/bridge/out/view/getContext.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.getContext = void 0;
      var bridge_1 = require_bridge();
      var i18n_1 = require_out();
      var callBridge = (0, bridge_1.getCallBridge)();
      var getContext = async () => {
        var _a;
        const context = await callBridge("getContext");
        const locale = context === null || context === void 0 ? void 0 : context.locale;
        if (locale) {
          context.locale = (_a = (0, i18n_1.ensureLocale)(locale)) !== null && _a !== void 0 ? _a : locale;
        }
        return context;
      };
      exports.getContext = getContext;
    }
  });

  // ../../node_modules/@forge/bridge/out/view/changeWindowTitle.js
  var require_changeWindowTitle = __commonJS({
    "../../node_modules/@forge/bridge/out/view/changeWindowTitle.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.changeWindowTitle = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var changeWindowTitle = async (title) => {
        try {
          await callBridge("changeWindowTitle", title);
        } catch (e) {
          throw new errors_1.BridgeAPIError("the window title wasn't changed due to error.");
        }
      };
      exports.changeWindowTitle = changeWindowTitle;
    }
  });

  // ../../node_modules/@forge/bridge/out/view/theme.js
  var require_theme = __commonJS({
    "../../node_modules/@forge/bridge/out/view/theme.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.theme = void 0;
      var bridge_1 = require_bridge();
      var callBridge = (0, bridge_1.getCallBridge)();
      exports.theme = {
        enable: () => callBridge("enableTheming")
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/view/view.js
  var require_view = __commonJS({
    "../../node_modules/@forge/bridge/out/view/view.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.view = void 0;
      var submit_1 = require_submit();
      var close_1 = require_close();
      var refresh_1 = require_refresh();
      var createHistory_1 = require_createHistory();
      var getContext_1 = require_getContext();
      var changeWindowTitle_1 = require_changeWindowTitle();
      var theme_1 = require_theme();
      exports.view = {
        submit: submit_1.submit,
        close: close_1.close,
        refresh: refresh_1.refresh,
        createHistory: createHistory_1.createHistory,
        getContext: getContext_1.getContext,
        theme: theme_1.theme,
        changeWindowTitle: changeWindowTitle_1.changeWindowTitle
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/view/index.js
  var require_view2 = __commonJS({
    "../../node_modules/@forge/bridge/out/view/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_view(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/router/router.js
  var require_router = __commonJS({
    "../../node_modules/@forge/bridge/out/router/router.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.router = void 0;
      var bridge_1 = require_bridge();
      var callBridge = (0, bridge_1.getCallBridge)();
      var navigate = async (location) => {
        if (typeof location === "string") {
          return callBridge("navigate", { url: location, type: "same-tab" });
        } else {
          if (!(location === null || location === void 0 ? void 0 : location.target)) {
            throw new Error("target is required for navigation");
          }
          return callBridge("navigate", { ...location, type: "same-tab" });
        }
      };
      var open = async (location) => {
        if (typeof location === "string") {
          return callBridge("navigate", { url: location, type: "new-tab" });
        } else {
          if (!(location === null || location === void 0 ? void 0 : location.target)) {
            throw new Error("target is required for navigation");
          }
          return callBridge("navigate", { ...location, type: "new-tab" });
        }
      };
      var reload = async () => callBridge("reload");
      exports.router = {
        navigate,
        open,
        reload
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/router/index.js
  var require_router2 = __commonJS({
    "../../node_modules/@forge/bridge/out/router/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_router(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/modal/modal.js
  var require_modal = __commonJS({
    "../../node_modules/@forge/bridge/out/modal/modal.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Modal = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var noop = () => {
      };
      var Modal = class {
        constructor(opts) {
          var _a, _b;
          this.resource = (opts === null || opts === void 0 ? void 0 : opts.resource) || null;
          this.onClose = (opts === null || opts === void 0 ? void 0 : opts.onClose) || noop;
          this.size = (opts === null || opts === void 0 ? void 0 : opts.size) || "medium";
          this.context = (opts === null || opts === void 0 ? void 0 : opts.context) || {};
          this.closeOnEscape = (_a = opts === null || opts === void 0 ? void 0 : opts.closeOnEscape) !== null && _a !== void 0 ? _a : true;
          this.closeOnOverlayClick = (_b = opts === null || opts === void 0 ? void 0 : opts.closeOnOverlayClick) !== null && _b !== void 0 ? _b : true;
        }
        async open() {
          try {
            const success = await callBridge("openModal", {
              resource: this.resource,
              onClose: this.onClose,
              size: this.size,
              context: this.context,
              closeOnEscape: this.closeOnEscape,
              closeOnOverlayClick: this.closeOnOverlayClick
            });
            if (success === false) {
              throw new errors_1.BridgeAPIError("Unable to open modal.");
            }
          } catch (err) {
            throw new errors_1.BridgeAPIError("Unable to open modal.");
          }
        }
      };
      exports.Modal = Modal;
    }
  });

  // ../../node_modules/@forge/bridge/out/modal/index.js
  var require_modal2 = __commonJS({
    "../../node_modules/@forge/bridge/out/modal/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_modal(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/utils/blobParser.js
  var require_blobParser = __commonJS({
    "../../node_modules/@forge/bridge/out/utils/blobParser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.blobToBase64 = exports.base64ToBlob = void 0;
      var base64ToBlob = (b64string, mimeType) => {
        if (!b64string) {
          return null;
        }
        const base64Data = b64string.includes(";base64") ? b64string.split(",")[1] : b64string;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
      };
      exports.base64ToBlob = base64ToBlob;
      var blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };
      exports.blobToBase64 = blobToBase64;
    }
  });

  // ../../node_modules/@forge/bridge/out/fetch/fetch.js
  var require_fetch = __commonJS({
    "../../node_modules/@forge/bridge/out/fetch/fetch.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.productFetchApi = void 0;
      var blobParser_1 = require_blobParser();
      var parseFormData = async (form) => {
        const parsed = {};
        for (const [key, value] of form.entries()) {
          if (key === "file") {
            const fileName = value.name;
            const fileType = value.type;
            parsed["file"] = await (0, blobParser_1.blobToBase64)(value);
            parsed["__fileName"] = fileName;
            parsed["__fileType"] = fileType;
          } else {
            parsed[key] = value;
          }
        }
        return JSON.stringify(parsed);
      };
      var parseRequest = async (init) => {
        const isFormData = (init === null || init === void 0 ? void 0 : init.body) instanceof FormData ? true : false;
        const requestBody = isFormData ? await parseFormData(init === null || init === void 0 ? void 0 : init.body) : init === null || init === void 0 ? void 0 : init.body;
        const req = new Request("", { body: requestBody, method: init === null || init === void 0 ? void 0 : init.method, headers: init === null || init === void 0 ? void 0 : init.headers });
        const headers = Object.fromEntries(req.headers.entries());
        const body = req.method !== "GET" ? await req.text() : null;
        return {
          body,
          headers: new Headers(headers),
          isMultipartFormData: isFormData
        };
      };
      var productFetchApi = (callBridge) => {
        const fetch2 = async (product, restPath, init) => {
          const { body: requestBody, headers: requestHeaders, isMultipartFormData } = await parseRequest(init);
          if (!requestHeaders.has("X-Atlassian-Token")) {
            requestHeaders.set("X-Atlassian-Token", "no-check");
          }
          const fetchPayload = {
            product,
            restPath,
            fetchRequestInit: {
              ...init,
              body: requestBody,
              headers: [...requestHeaders.entries()]
            },
            isMultipartFormData
          };
          const { body, headers, statusText, status, isAttachment } = await callBridge("fetchProduct", fetchPayload);
          const responseBody = isAttachment ? (0, blobParser_1.base64ToBlob)(body, headers["content-type"]) : body;
          return new Response(responseBody || null, { headers, status, statusText });
        };
        return {
          requestConfluence: (restPath, fetchOptions) => fetch2("confluence", restPath, fetchOptions),
          requestJira: (restPath, fetchOptions) => fetch2("jira", restPath, fetchOptions),
          requestBitbucket: (restPath, fetchOptions) => fetch2("bitbucket", restPath, fetchOptions)
        };
      };
      exports.productFetchApi = productFetchApi;
    }
  });

  // ../../node_modules/@forge/bridge/out/fetch/index.js
  var require_fetch2 = __commonJS({
    "../../node_modules/@forge/bridge/out/fetch/index.js"(exports) {
      "use strict";
      var _a;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.requestBitbucket = exports.requestJira = exports.requestConfluence = void 0;
      var bridge_1 = require_bridge();
      var fetch_1 = require_fetch();
      _a = (0, fetch_1.productFetchApi)((0, bridge_1.getCallBridge)()), exports.requestConfluence = _a.requestConfluence, exports.requestJira = _a.requestJira, exports.requestBitbucket = _a.requestBitbucket;
    }
  });

  // ../../node_modules/@forge/bridge/out/flag/flag.js
  var require_flag = __commonJS({
    "../../node_modules/@forge/bridge/out/flag/flag.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.showFlag = void 0;
      var bridge_1 = require_bridge();
      var errors_1 = require_errors();
      var callBridge = (0, bridge_1.getCallBridge)();
      var showFlag = (options) => {
        var _a;
        if (!options.id) {
          throw new errors_1.BridgeAPIError('"id" must be defined in flag options');
        }
        const result = callBridge("showFlag", {
          ...options,
          type: (_a = options.type) !== null && _a !== void 0 ? _a : "info"
        });
        return {
          close: async () => {
            await result;
            return callBridge("closeFlag", { id: options.id });
          }
        };
      };
      exports.showFlag = showFlag;
    }
  });

  // ../../node_modules/@forge/bridge/out/flag/index.js
  var require_flag2 = __commonJS({
    "../../node_modules/@forge/bridge/out/flag/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.showFlag = void 0;
      var flag_1 = require_flag();
      Object.defineProperty(exports, "showFlag", { enumerable: true, get: function() {
        return flag_1.showFlag;
      } });
    }
  });

  // ../../node_modules/@forge/bridge/out/events/events.js
  var require_events = __commonJS({
    "../../node_modules/@forge/bridge/out/events/events.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.events = void 0;
      var bridge_1 = require_bridge();
      var callBridge = (0, bridge_1.getCallBridge)();
      var emit = (event, payload) => {
        return callBridge("emit", { event, payload });
      };
      var on = (event, callback) => {
        return callBridge("on", { event, callback });
      };
      exports.events = {
        emit,
        on
      };
    }
  });

  // ../../node_modules/@forge/bridge/out/events/index.js
  var require_events2 = __commonJS({
    "../../node_modules/@forge/bridge/out/events/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      tslib_1.__exportStar(require_events(), exports);
    }
  });

  // ../../node_modules/@forge/bridge/out/i18n/index.js
  var require_i18n = __commonJS({
    "../../node_modules/@forge/bridge/out/i18n/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createTranslationFunction = exports.getTranslations = exports.resetTranslationsCache = void 0;
      var i18n_1 = require_out();
      var view_1 = require_view2();
      var frontendResourcesAccessor = {
        getI18nInfoConfig: async () => {
          const resp = await fetch(`./${i18n_1.I18N_BUNDLE_FOLDER_NAME}/${i18n_1.I18N_INFO_FILE_NAME}`);
          if (!resp.ok) {
            throw new Error("Failed to get i18n info config: " + resp.statusText);
          }
          const info = await resp.json();
          return info.config;
        },
        getTranslationResource: async (locale) => {
          const resp = await fetch(`./${i18n_1.I18N_BUNDLE_FOLDER_NAME}/${locale}.json`);
          if (!resp.ok) {
            throw new Error(`Failed to get translation resource for locale: ${locale}`);
          }
          return resp.json();
        }
      };
      var translationsGetter = new i18n_1.TranslationsGetter(frontendResourcesAccessor);
      var resetTranslationsCache = () => {
        translationsGetter.reset();
      };
      exports.resetTranslationsCache = resetTranslationsCache;
      var getTranslations = async (locale = null, options = {
        fallback: true
      }) => {
        let targetLocale = locale;
        if (!targetLocale) {
          const context = await view_1.view.getContext();
          targetLocale = context.locale;
        }
        return await translationsGetter.getTranslations(targetLocale, options);
      };
      exports.getTranslations = getTranslations;
      var createTranslationFunction = async (locale = null) => {
        let targetLocale = locale;
        if (!targetLocale) {
          const context = await view_1.view.getContext();
          targetLocale = context.locale;
        }
        const translator = new i18n_1.Translator(targetLocale, translationsGetter);
        await translator.init();
        return (i18nKey, defaultValue) => {
          var _a, _b;
          return (_b = (_a = translator.translate(i18nKey)) !== null && _a !== void 0 ? _a : defaultValue) !== null && _b !== void 0 ? _b : i18nKey;
        };
      };
      exports.createTranslationFunction = createTranslationFunction;
    }
  });

  // ../../node_modules/@forge/bridge/out/index.js
  var require_out2 = __commonJS({
    "../../node_modules/@forge/bridge/out/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.i18n = exports.NavigationTarget = void 0;
      var tslib_1 = (init_tslib_es6(), __toCommonJS(tslib_es6_exports));
      var targets_1 = require_targets();
      Object.defineProperty(exports, "NavigationTarget", { enumerable: true, get: function() {
        return targets_1.NavigationTarget;
      } });
      tslib_1.__exportStar(require_invoke2(), exports);
      tslib_1.__exportStar(require_invoke_remote2(), exports);
      tslib_1.__exportStar(require_view2(), exports);
      tslib_1.__exportStar(require_router2(), exports);
      tslib_1.__exportStar(require_modal2(), exports);
      tslib_1.__exportStar(require_fetch2(), exports);
      tslib_1.__exportStar(require_flag2(), exports);
      tslib_1.__exportStar(require_events2(), exports);
      exports.i18n = tslib_1.__importStar(require_i18n());
    }
  });

  // src/cockpit.ts
  var import_bridge = __toESM(require_out2());

  // ../../src/engine/dag.ts
  function computePertParameters(node) {
    const hasPert = typeof node.optimisticDays === "number" && typeof node.mostLikelyDays === "number" && typeof node.pessimisticDays === "number" && node.pessimisticDays >= node.optimisticDays;
    if (hasPert) {
      const minD = Math.max(0.25, node.optimisticDays);
      const mlD = Math.max(minD, node.mostLikelyDays);
      const maxD = Math.max(mlD, node.pessimisticDays);
      const meanDays = Number(((minD + 4 * mlD + maxD) / 6).toFixed(2));
      const sigmaDays = Number(Math.max(0.1, (maxD - minD) / 6).toFixed(2));
      return { meanDays, sigmaDays, isPertActive: true };
    }
    return {
      meanDays: Math.max(0.5, node.baseEstimateDays),
      sigmaDays: Math.max(0.1, node.uncertaintySigma),
      isPertActive: false
    };
  }
  function resolveNodeKey(nodes, identifier, allowSuffixFallback = true) {
    const normalized = identifier.trim().toUpperCase();
    const exact = nodes.find(
      (n) => n.key.toUpperCase() === normalized || n.id.toUpperCase() === normalized
    );
    if (exact) return exact.key;
    if (allowSuffixFallback) {
      const suffixMatch = normalized.match(/-(\d+)$/);
      if (suffixMatch) {
        const suffix = `-${suffixMatch[1]}`;
        const bySuffix = nodes.find((n) => n.key.toUpperCase().endsWith(suffix));
        if (bySuffix) return bySuffix.key;
      }
    }
    return void 0;
  }
  function detectAndBreakCycles(nodes, rawEdges) {
    const exactKeyMap = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      exactKeyMap.set(node.key.trim().toUpperCase(), node.key);
      exactKeyMap.set(node.id.trim().toUpperCase(), node.key);
    }
    const cycleWarnings = [];
    const edgeMap = /* @__PURE__ */ new Map();
    for (const edge of rawEdges) {
      const fromKey = exactKeyMap.get(edge.from.trim().toUpperCase());
      const toKey = exactKeyMap.get(edge.to.trim().toUpperCase());
      if (!fromKey || !toKey) {
        continue;
      }
      if (fromKey === toKey) {
        const msg = `[PWM DAG Warning] Self-loop detected and broken on ${fromKey} (${edge.dependencyType}).`;
        console.warn(msg);
        cycleWarnings.push(msg);
        continue;
      }
      const pairKey = `${fromKey}->${toKey}`;
      const clampedWeight = Math.max(0.05, Math.min(1, edge.propagationWeight ?? 1));
      const existing = edgeMap.get(pairKey);
      if (!existing || clampedWeight > existing.propagationWeight) {
        edgeMap.set(pairKey, {
          from: fromKey,
          to: toKey,
          dependencyType: edge.dependencyType || "Blocks",
          propagationWeight: clampedWeight,
          precedenceType: edge.precedenceType ?? existing?.precedenceType ?? "FS",
          lagDays: edge.lagDays ?? existing?.lagDays ?? 0
        });
      }
    }
    const adjacency = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      adjacency.set(node.key, []);
    }
    for (const edge of edgeMap.values()) {
      adjacency.get(edge.from)?.push(edge);
    }
    const color = /* @__PURE__ */ new Map();
    const parentInStack = /* @__PURE__ */ new Map();
    const removedPairKeys = /* @__PURE__ */ new Set();
    for (const node of nodes) {
      color.set(node.key, 0);
    }
    const reconstructCyclePath = (fromKey, toKey) => {
      const chain = [toKey, fromKey];
      let cursor = fromKey;
      let safety = 0;
      while (cursor && cursor !== toKey && safety < nodes.length + 2) {
        cursor = parentInStack.get(cursor);
        if (cursor) {
          chain.push(cursor);
        }
        safety++;
      }
      return chain.reverse().join(" -> ");
    };
    const dfs = (u) => {
      color.set(u, 1);
      const outgoing = adjacency.get(u) ?? [];
      for (const edge of outgoing) {
        const v = edge.to;
        const pairKey = `${u}->${v}`;
        if (removedPairKeys.has(pairKey)) {
          continue;
        }
        const vColor = color.get(v) ?? 0;
        if (vColor === 1) {
          removedPairKeys.add(pairKey);
          const cyclePath = reconstructCyclePath(u, v);
          const warning = `[PWM DAG Warning] Circular dependency detected and broken: removed back-edge ${u} -> ${v} (${edge.dependencyType}) in cycle [${cyclePath}].`;
          console.warn(warning);
          cycleWarnings.push(warning);
        } else if (vColor === 0) {
          parentInStack.set(v, u);
          dfs(v);
        }
      }
      color.set(u, 2);
    };
    for (const node of nodes) {
      if ((color.get(node.key) ?? 0) === 0) {
        dfs(node.key);
      }
    }
    const acyclicEdges = [];
    for (const [pairKey, edge] of edgeMap.entries()) {
      if (!removedPairKeys.has(pairKey)) {
        acyclicEdges.push(edge);
      }
    }
    return { acyclicEdges, cycleWarnings };
  }
  function topologicalSort(nodes, edges) {
    const inDegree = /* @__PURE__ */ new Map();
    const adj = /* @__PURE__ */ new Map();
    const nodeIndex = /* @__PURE__ */ new Map();
    nodes.forEach((node, idx) => {
      inDegree.set(node.key, 0);
      adj.set(node.key, []);
      nodeIndex.set(node.key, idx);
    });
    for (const edge of edges) {
      if (inDegree.has(edge.from) && inDegree.has(edge.to)) {
        adj.get(edge.from).push(edge.to);
        inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      }
    }
    const queue = [];
    for (const node of nodes) {
      if ((inDegree.get(node.key) ?? 0) === 0) {
        queue.push(node.key);
      }
    }
    queue.sort((a, b) => (nodeIndex.get(a) ?? 0) - (nodeIndex.get(b) ?? 0));
    const sorted = [];
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);
      const neighbors = adj.get(current) ?? [];
      for (const next of neighbors) {
        const updated = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, updated);
        if (updated === 0) {
          queue.push(next);
          queue.sort((a, b) => (nodeIndex.get(a) ?? 0) - (nodeIndex.get(b) ?? 0));
        }
      }
    }
    if (sorted.length < nodes.length) {
      const placed = new Set(sorted);
      for (const node of nodes) {
        if (!placed.has(node.key)) {
          sorted.push(node.key);
        }
      }
    }
    return sorted;
  }
  function buildCausalDAG(params) {
    const referenceDate = params.referenceDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const { acyclicEdges, cycleWarnings } = detectAndBreakCycles(params.nodes, params.edges);
    const topologicalOrder = topologicalSort(params.nodes, acyclicEdges);
    return {
      projectKey: params.projectKey,
      projectName: params.projectName,
      referenceDate,
      source: params.source,
      isSyntheticDemo: params.isSyntheticDemo ?? params.source === "synthetic-seed",
      nodes: params.nodes,
      edges: acyclicEdges,
      goals: params.goals,
      teams: params.teams,
      cycleWarnings,
      topologicalOrder
    };
  }
  function getDownstreamBlastRadius(graph, targetNodeId) {
    const targetKey = resolveNodeKey(graph.nodes, targetNodeId, graph.isSyntheticDemo);
    if (!targetKey) {
      return { targetKey: void 0, blastRadiusKeys: [], effectiveWeights: {} };
    }
    const outgoing = /* @__PURE__ */ new Map();
    for (const node of graph.nodes) {
      outgoing.set(node.key, []);
    }
    for (const edge of graph.edges) {
      outgoing.get(edge.from)?.push(edge);
    }
    const effectiveWeights = {
      [targetKey]: 1
    };
    const topo = graph.topologicalOrder.length === graph.nodes.length ? graph.topologicalOrder : topologicalSort(graph.nodes, graph.edges);
    const startIdx = topo.indexOf(targetKey);
    if (startIdx >= 0) {
      for (let i = startIdx; i < topo.length; i++) {
        const u = topo[i];
        const uWeight = effectiveWeights[u];
        if (uWeight === void 0) {
          continue;
        }
        const edgesFromU = outgoing.get(u) ?? [];
        for (const edge of edgesFromU) {
          const candidateWeight = Number((uWeight * edge.propagationWeight).toFixed(4));
          const currentBest = effectiveWeights[edge.to] ?? 0;
          if (candidateWeight > currentBest) {
            effectiveWeights[edge.to] = candidateWeight;
          }
        }
      }
    }
    const blastRadiusKeys = topo.filter(
      (k) => k !== targetKey && (effectiveWeights[k] ?? 0) > 0
    );
    return {
      targetKey,
      blastRadiusKeys,
      effectiveWeights
    };
  }
  function computeDeterministicCriticalPath(graph, forcedTargetDays) {
    const topo = graph.topologicalOrder.length === graph.nodes.length ? graph.topologicalOrder : topologicalSort(graph.nodes, graph.edges);
    const nodeMap = new Map(graph.nodes.map((n) => [n.key, n]));
    const incoming = /* @__PURE__ */ new Map();
    const outgoing = /* @__PURE__ */ new Map();
    for (const node of graph.nodes) {
      incoming.set(node.key, []);
      outgoing.set(node.key, []);
    }
    for (const edge of graph.edges) {
      incoming.get(edge.to)?.push(edge);
      outgoing.get(edge.from)?.push(edge);
    }
    const effectiveDuration = (node) => {
      if (node.status.toLowerCase() === "done") {
        return 0;
      }
      const pert = computePertParameters(node);
      return Math.max(0.5, pert.meanDays);
    };
    const ES = /* @__PURE__ */ new Map();
    const EF = /* @__PURE__ */ new Map();
    for (const key of topo) {
      const node = nodeMap.get(key);
      const dur = effectiveDuration(node);
      const preds = incoming.get(key) ?? [];
      let maxPredStart = 0;
      for (const edge of preds) {
        const predES = ES.get(edge.from) ?? 0;
        const predEF = EF.get(edge.from) ?? 0;
        const predDur = Math.max(0, predEF - predES);
        const pType = edge.precedenceType ?? "FS";
        const lag = edge.lagDays ?? 0;
        let candidateStart = 0;
        if (pType === "SS") {
          candidateStart = predES + lag;
        } else if (pType === "FF") {
          candidateStart = Math.max(0, predEF + lag - dur);
        } else if (pType === "SF") {
          candidateStart = Math.max(0, predES + lag - dur);
        } else {
          candidateStart = predES + predDur * edge.propagationWeight + lag;
        }
        if (candidateStart > maxPredStart) {
          maxPredStart = candidateStart;
        }
      }
      const startVal = Math.max(0, maxPredStart);
      ES.set(key, startVal);
      EF.set(key, startVal + dur);
    }
    let projectDuration = 0;
    for (const ef of EF.values()) {
      if (ef > projectDuration) {
        projectDuration = ef;
      }
    }
    const goalOffsetById = /* @__PURE__ */ new Map();
    for (const g of graph.goals) {
      if (g.targetDayOffset > 0) {
        goalOffsetById.set(g.id, g.targetDayOffset);
      }
    }
    const earliestGoalOffset = graph.goals.length > 0 ? Math.min(...graph.goals.map((g) => g.targetDayOffset).filter((d) => d > 0), projectDuration) : projectDuration;
    const targetDeadlineDays = typeof forcedTargetDays === "number" && Number.isFinite(forcedTargetDays) ? forcedTargetDays : earliestGoalOffset > 0 ? earliestGoalOffset : projectDuration;
    const LS = /* @__PURE__ */ new Map();
    const LF = /* @__PURE__ */ new Map();
    const forcedLS = /* @__PURE__ */ new Map();
    const downstreamSets = /* @__PURE__ */ new Map();
    for (let i = topo.length - 1; i >= 0; i--) {
      const key = topo[i];
      const node = nodeMap.get(key);
      const dur = effectiveDuration(node);
      const succs = outgoing.get(key) ?? [];
      const ds = /* @__PURE__ */ new Set();
      const nodeGoalDeadline = typeof forcedTargetDays === "number" && Number.isFinite(forcedTargetDays) ? forcedTargetDays : goalOffsetById.get(node.goalId) ?? targetDeadlineDays;
      if (succs.length === 0) {
        LF.set(key, projectDuration);
        LS.set(key, Math.max(0, projectDuration - dur));
        forcedLS.set(key, nodeGoalDeadline - dur);
      } else {
        let minLatestStart = Math.max(0, projectDuration - dur);
        let minLatestFinish = projectDuration;
        let minForcedStart = nodeGoalDeadline - dur;
        for (const edge of succs) {
          ds.add(edge.to);
          const childDs = downstreamSets.get(edge.to);
          if (childDs) {
            for (const item of childDs) {
              ds.add(item);
            }
          }
          const pType = edge.precedenceType ?? "FS";
          const lag = edge.lagDays ?? 0;
          const succLS = LS.get(edge.to) ?? projectDuration;
          const succLF = LF.get(edge.to) ?? projectDuration;
          const succForcedLS = forcedLS.get(edge.to) ?? targetDeadlineDays;
          const succNodeDur = effectiveDuration(nodeMap.get(edge.to));
          const succForcedLF = succForcedLS + succNodeDur;
          let edgeMaxLS = minLatestStart;
          let edgeForcedMaxLS = minForcedStart;
          if (pType === "SS") {
            edgeMaxLS = Math.max(0, succLS - lag);
            edgeForcedMaxLS = succForcedLS - lag;
          } else if (pType === "FF") {
            const maxLF = Math.min(projectDuration, succLF - lag);
            edgeMaxLS = Math.max(0, maxLF - dur);
            edgeForcedMaxLS = succForcedLF - lag - dur;
          } else if (pType === "SF") {
            edgeMaxLS = Math.max(0, succLF - lag);
            edgeForcedMaxLS = succForcedLF - lag;
          } else {
            const weightedDur = dur * edge.propagationWeight;
            edgeMaxLS = Math.max(
              0,
              Math.min(projectDuration - dur, succLS - lag - weightedDur)
            );
            edgeForcedMaxLS = succForcedLS - lag - weightedDur;
          }
          if (edgeMaxLS < minLatestStart) {
            minLatestStart = edgeMaxLS;
            minLatestFinish = Math.min(projectDuration, minLatestStart + dur);
          }
          if (edgeForcedMaxLS < minForcedStart) {
            minForcedStart = edgeForcedMaxLS;
          }
        }
        LS.set(key, minLatestStart);
        LF.set(key, minLatestFinish);
        forcedLS.set(key, minForcedStart);
      }
      downstreamSets.set(key, ds);
    }
    const result = {};
    for (const key of topo) {
      const es = Number((ES.get(key) ?? 0).toFixed(2));
      const ef = Number((EF.get(key) ?? 0).toFixed(2));
      const ls = Number((LS.get(key) ?? 0).toFixed(2));
      const lf = Number((LF.get(key) ?? 0).toFixed(2));
      const slackDays = Number(Math.max(0, ls - es).toFixed(2));
      const fLS = forcedLS.get(key) ?? ls;
      const totalFloatDays = Number((fLS - es).toFixed(2));
      const node = nodeMap.get(key);
      const isDone = node.status.toLowerCase() === "done";
      const blast = getDownstreamBlastRadius(graph, key);
      let cumulativeRippleWeight = 0;
      for (const dsKey of blast.blastRadiusKeys) {
        cumulativeRippleWeight += blast.effectiveWeights[dsKey] ?? 0;
      }
      result[key] = {
        key,
        earliestStart: es,
        earliestFinish: ef,
        latestStart: ls,
        latestFinish: lf,
        slackDays,
        totalFloatDays,
        downstreamCount: downstreamSets.get(key)?.size ?? 0,
        downstreamRippleWeight: Number(cumulativeRippleWeight.toFixed(2)),
        isOnCriticalPath: !isDone && slackDays <= 0.75
      };
    }
    return result;
  }
  function buildDAGFromJiraIssues(projectKey, rawIssues, goals = [], teams = [], referenceDate) {
    const defaultTeams = teams.length > 0 ? teams : [
      {
        id: "team-core-engine",
        name: "Core Engine",
        lead: "Elena Vance",
        color: "#6366f1",
        cognitiveLoad: 78
      },
      {
        id: "team-cloud-infra",
        name: "Cloud Infra",
        lead: "Marcus Chen",
        color: "#06b6d4",
        cognitiveLoad: 74
      },
      {
        id: "team-client-ui",
        name: "Client UI",
        lead: "Aria Patel",
        color: "#10b981",
        cognitiveLoad: 66
      }
    ];
    const defaultGoals = goals.length > 0 ? goals : [
      {
        id: "GOAL-ALPHA",
        key: "TWG-GOAL-101",
        name: "Zero-Downtime Migration",
        targetDate: addCalendarDays(referenceDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), 24),
        targetDayOffset: 24,
        ownerTeam: "Core Engine",
        status: "On Track"
      },
      {
        id: "GOAL-OMEGA",
        key: "TWG-GOAL-202",
        name: "Q4 Global Launch",
        targetDate: addCalendarDays(referenceDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), 43),
        targetDayOffset: 43,
        ownerTeam: "Client UI",
        status: "On Track"
      }
    ];
    const nodes = [];
    const rawEdges = [];
    const edgeOverridesByPair = /* @__PURE__ */ new Map();
    const defaultIncomingByTarget = /* @__PURE__ */ new Map();
    const childrenByParentKey = /* @__PURE__ */ new Map();
    for (const issue of rawIssues) {
      const parentKey = issue.fields.parent?.key;
      if (parentKey) {
        const list = childrenByParentKey.get(parentKey) ?? [];
        list.push(issue);
        childrenByParentKey.set(parentKey, list);
      }
    }
    const refIso = (referenceDate ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).slice(0, 10);
    rawIssues.forEach((issue, index) => {
      const statusName = issue.fields.status?.name ?? "To Do";
      const labels = issue.fields.labels ?? [];
      const storyPoints = issue.fields.customfield_10016 ?? null;
      const estimateSeconds = issue.fields.timetracking?.remainingEstimateSeconds ?? issue.fields.timetracking?.originalEstimateSeconds ?? issue.fields.timeestimate ?? issue.fields.timeoriginalestimate ?? null;
      const estLabel = labels.find((l) => /^(?:estimate|est):\d+(?:\.\d+)?d?$/i.test(l));
      const estLabelMatch = estLabel?.match(/^(?:estimate|est):(\d+(?:\.\d+)?)d?$/i);
      let baseEstimateDays = 5;
      if (typeof estimateSeconds === "number" && estimateSeconds > 0) {
        baseEstimateDays = Math.max(1, Math.round(estimateSeconds / (8 * 3600)));
      } else if (typeof storyPoints === "number" && storyPoints > 0) {
        baseEstimateDays = Math.max(1, Math.round(storyPoints * 1.25));
      } else if (estLabelMatch) {
        baseEstimateDays = Math.max(0.5, Number(parseFloat(estLabelMatch[1]).toFixed(1)));
      } else {
        const issueType = (issue.fields.issuetype?.name ?? "Task").toLowerCase();
        baseEstimateDays = issueType === "epic" ? 8 : issueType === "bug" ? 3 : 5;
      }
      const hasKanbanFlag = Array.isArray(issue.fields.customfield_10021) && issue.fields.customfield_10021.length > 0;
      const hasBlockedLabel = labels.some(
        (l) => l.toLowerCase() === "blocked" || l.toLowerCase() === "status:blocked"
      );
      let normalizedStat = normalizeStatus(statusName);
      if (normalizedStat !== "Done" && (hasKanbanFlag || hasBlockedLabel)) {
        normalizedStat = "Blocked";
      }
      let uncertaintySigma = 1.5;
      if (normalizedStat === "Done") {
        uncertaintySigma = 0.2;
      } else if (normalizedStat === "Blocked") {
        uncertaintySigma = Math.max(2.2, Number((baseEstimateDays * 0.45).toFixed(2)));
      } else if (normalizedStat === "In Progress") {
        uncertaintySigma = Math.max(1.1, Number((baseEstimateDays * 0.28).toFixed(2)));
      } else {
        uncertaintySigma = Math.max(1.4, Number((baseEstimateDays * 0.35).toFixed(2)));
      }
      const goalLabel = labels.find((l) => l.toLowerCase().startsWith("goal:"));
      const pertLabel = labels.find((l) => l.toLowerCase().startsWith("pert:"));
      let optimisticDays;
      let mostLikelyDays;
      let pessimisticDays;
      if (pertLabel) {
        const parts = pertLabel.slice(5).split("-").map((v) => Number(v.trim()));
        if (parts.length === 3 && parts.every((n) => Number.isFinite(n) && n > 0)) {
          optimisticDays = parts[0];
          mostLikelyDays = parts[1];
          pessimisticDays = parts[2];
          baseEstimateDays = Number(
            ((optimisticDays + 4 * mostLikelyDays + pessimisticDays) / 6).toFixed(1)
          );
          uncertaintySigma = Number(
            Math.max(0.2, (pessimisticDays - optimisticDays) / 6).toFixed(2)
          );
        }
      }
      const assignedTeam = inferIssueTeam(issue, projectKey, teams, index);
      const fallbackGoalIdx = defaultGoals.length <= 1 ? 0 : index < Math.ceil(rawIssues.length * 0.55) ? 0 : Math.min(1, defaultGoals.length - 1);
      const assignedGoalId = goalLabel ? goalLabel.slice(5).toUpperCase() : defaultGoals[fallbackGoalIdx].id;
      const issueTypeName = issue.fields.issuetype?.name || "Task";
      const hasGateLabel = labels.some(
        (l) => l.toLowerCase() === "gate" || l.toLowerCase() === "stage-gate"
      );
      const isStageGate = issueTypeName.toLowerCase() === "milestone" || issueTypeName.toLowerCase() === "gate" || hasGateLabel || (issue.fields.summary ?? "").toLowerCase().includes("gate");
      const timeSpentSeconds = issue.fields.timetracking?.timeSpentSeconds ?? issue.fields.timespent ?? null;
      const spentLabel = labels.find((l) => /^spent:\d+(?:\.\d+)?d?$/i.test(l));
      const spentMatch = spentLabel?.match(/^spent:(\d+(?:\.\d+)?)d?$/i);
      const plannedEffortDays = baseEstimateDays;
      let actualEffortDays = normalizedStat === "Done" ? baseEstimateDays : normalizedStat === "In Progress" ? Number((baseEstimateDays * 0.55).toFixed(1)) : normalizedStat === "Blocked" ? Number((baseEstimateDays * 0.4).toFixed(1)) : 0;
      if (typeof timeSpentSeconds === "number" && timeSpentSeconds > 0) {
        actualEffortDays = Number((timeSpentSeconds / (8 * 3600)).toFixed(1));
      } else if (spentMatch) {
        actualEffortDays = Math.max(0, Number(parseFloat(spentMatch[1]).toFixed(1)));
      }
      const handoffPending = labels.some(
        (l) => /^handoff:(?:pending|unaccepted|blocked)$/i.test(l)
      );
      const handoffAcceptedByDownstream = handoffPending ? false : void 0;
      let completedDaysAgo;
      const doneAgoLabel = labels.find((l) => /^(?:done-ago|completed-ago):\d+d?$/i.test(l));
      const doneAgoMatch = doneAgoLabel?.match(/^(?:done-ago|completed-ago):(\d+)d?$/i);
      if (doneAgoMatch) {
        completedDaysAgo = Math.max(1, parseInt(doneAgoMatch[1], 10));
      } else if (normalizedStat === "Done" && issue.fields.resolutiondate) {
        const refMs = Date.parse(`${refIso}T00:00:00.000Z`);
        const resMs = Date.parse(`${issue.fields.resolutiondate.slice(0, 10)}T00:00:00.000Z`);
        if (Number.isFinite(refMs) && Number.isFinite(resMs)) {
          completedDaysAgo = Math.max(1, Math.round((refMs - resMs) / 864e5));
        }
      }
      const adrLabel = labels.find((l) => /^adr:[^:]+:.+$/i.test(l));
      const adrMatch = adrLabel?.match(/^adr:([^:]+):(.+)$/i);
      const confluenceDecision = adrMatch ? {
        id: adrMatch[1].trim().toUpperCase(),
        title: `${adrMatch[1].trim().toUpperCase()}: ${formatLabelValue(adrMatch[2])}`,
        spaceKey: "ARCH"
      } : void 0;
      const pureRisks = [];
      labels.forEach((lbl, rIdx) => {
        const rMatch = lbl.match(
          /^risk:(0?\.\d+|1(?:\.0+)?)-(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?$/i
        );
        if (rMatch) {
          pureRisks.push({
            id: `RISK-${issue.key}-${rIdx + 1}`,
            title: `Technical variance shock on ${issue.key}`,
            probability: Math.max(0.01, Math.min(1, parseFloat(rMatch[1]))),
            delayImpactDays: Math.max(0.5, parseFloat(rMatch[2])),
            ...rMatch[3] ? { mitigationEffortDays: Math.max(0.5, parseFloat(rMatch[3])) } : {}
          });
        }
      });
      const ownerLabel = labels.find((l) => /^owner:.+$/i.test(l));
      const ownerName = ownerLabel ? formatLabelValue(ownerLabel.slice(6)) : "";
      const resolvedAssignee = ownerName.length > 0 ? ownerName : issue.fields.assignee?.displayName || "Unassigned";
      let defaultPrec;
      let defaultLag;
      for (const lbl of labels) {
        const edgeMatch = lbl.match(/^edge:([A-Z0-9_-]+):(FS|SS|FF|SF):(-?\d+(?:\.\d+)?)d?$/i);
        if (edgeMatch) {
          const fromUpper = edgeMatch[1].toUpperCase();
          const pType = edgeMatch[2].toUpperCase();
          const lagVal = parseFloat(edgeMatch[3]);
          edgeOverridesByPair.set(`${fromUpper}->${issue.key.toUpperCase()}`, {
            precedenceType: pType,
            lagDays: Number.isFinite(lagVal) ? lagVal : 0
          });
          continue;
        }
        const precMatch = lbl.match(/^prec:(FS|SS|FF|SF)$/i);
        if (precMatch) {
          defaultPrec = precMatch[1].toUpperCase();
        }
        const lagMatch = lbl.match(/^lag:(-?\d+(?:\.\d+)?)d?$/i);
        if (lagMatch) {
          const parsedLag = parseFloat(lagMatch[1]);
          if (Number.isFinite(parsedLag)) {
            defaultLag = parsedLag;
          }
        }
      }
      if (defaultPrec !== void 0 || defaultLag !== void 0) {
        defaultIncomingByTarget.set(issue.key.toUpperCase(), {
          precedenceType: defaultPrec,
          lagDays: defaultLag
        });
      }
      const explicitSubtasks = issue.fields.subtasks ?? [];
      const epicChildren = childrenByParentKey.get(issue.key) ?? [];
      const childStatuses = explicitSubtasks.length > 0 ? explicitSubtasks.map((st) => normalizeStatus(st.fields?.status?.name ?? "To Do")) : epicChildren.map((ch) => {
        const chLabels = ch.fields.labels ?? [];
        const chBlocked = Array.isArray(ch.fields.customfield_10021) && ch.fields.customfield_10021.length > 0 || chLabels.some(
          (l) => l.toLowerCase() === "blocked" || l.toLowerCase() === "status:blocked"
        );
        const baseSt = normalizeStatus(ch.fields.status?.name ?? "To Do");
        return baseSt !== "Done" && chBlocked ? "Blocked" : baseSt;
      });
      let subtaskTotalCount = childStatuses.length;
      let subtaskDoneCount = 0;
      let subtaskProgressPct = 0;
      if (subtaskTotalCount > 0) {
        let weightedDone = 0;
        for (const st of childStatuses) {
          if (st === "Done") {
            subtaskDoneCount += 1;
            weightedDone += 1;
          } else if (st === "In Progress") {
            weightedDone += 0.6;
          } else if (st === "Blocked") {
            weightedDone += 0.35;
          }
        }
        subtaskProgressPct = Math.min(
          100,
          Math.max(10, Math.round(weightedDone / subtaskTotalCount * 100))
        );
      } else {
        subtaskTotalCount = Math.max(3, Math.min(8, Math.round(baseEstimateDays)));
        if (normalizedStat === "Done") {
          subtaskDoneCount = subtaskTotalCount;
          subtaskProgressPct = 100;
        } else if (normalizedStat === "In Progress") {
          subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.67));
          subtaskProgressPct = Math.round(subtaskDoneCount / subtaskTotalCount * 100);
        } else if (normalizedStat === "Blocked") {
          subtaskDoneCount = Math.max(1, Math.round(subtaskTotalCount * 0.4));
          subtaskProgressPct = Math.round(subtaskDoneCount / subtaskTotalCount * 100);
        } else {
          subtaskDoneCount = 0;
          subtaskProgressPct = 0;
        }
      }
      nodes.push({
        id: issue.id || issue.key,
        key: issue.key,
        summary: issue.fields.summary || `Untitled Issue ${issue.key}`,
        status: normalizedStat,
        baseEstimateDays,
        uncertaintySigma,
        optimisticDays,
        mostLikelyDays,
        pessimisticDays,
        plannedEffortDays,
        actualEffortDays,
        ...handoffAcceptedByDownstream !== void 0 ? { handoffAcceptedByDownstream } : {},
        ...completedDaysAgo !== void 0 ? { completedDaysAgo } : {},
        ...confluenceDecision ? { confluenceDecision } : {},
        ...pureRisks.length > 0 ? { pureRisks } : {},
        isStageGate,
        subtaskDoneCount,
        subtaskTotalCount,
        subtaskProgressPct,
        assignee: resolvedAssignee,
        team: assignedTeam,
        goalId: assignedGoalId,
        issueType: issueTypeName,
        storyPoints: storyPoints ?? baseEstimateDays,
        dueDate: issue.fields.duedate ?? void 0
      });
      const links = issue.fields.issuelinks ?? [];
      for (const link of links) {
        const typeName = (link.type?.name ?? "Blocks").toLowerCase();
        const outwardDesc = (link.type?.outward ?? "").toLowerCase();
        const inwardDesc = (link.type?.inward ?? "").toLowerCase();
        const isHardBlock = typeName.includes("block") || typeName.includes("depend") || outwardDesc.includes("block") || inwardDesc.includes("block") || inwardDesc.includes("depend");
        const isReverseDependsOutward = !outwardDesc.includes("block") && (outwardDesc.includes("depend") || typeName.includes("depend") && !outwardDesc.includes("is depended on"));
        const weight = isHardBlock ? 1 : 0.65;
        const depLabel = isHardBlock ? "Blocks" : "Architectural Decision";
        const inwardDepLabel = isHardBlock ? "Depends on" : "Architectural Decision";
        if (link.outwardIssue?.key) {
          if (isReverseDependsOutward) {
            rawEdges.push({
              from: link.outwardIssue.key,
              to: issue.key,
              dependencyType: "Depends on",
              propagationWeight: weight
            });
          } else {
            rawEdges.push({
              from: issue.key,
              to: link.outwardIssue.key,
              dependencyType: depLabel,
              propagationWeight: weight
            });
          }
        }
        if (link.inwardIssue?.key) {
          if (isReverseDependsOutward) {
            rawEdges.push({
              from: issue.key,
              to: link.inwardIssue.key,
              dependencyType: "Depends on",
              propagationWeight: weight
            });
          } else {
            rawEdges.push({
              from: link.inwardIssue.key,
              to: issue.key,
              dependencyType: inwardDepLabel,
              propagationWeight: weight
            });
          }
        }
      }
    });
    for (const edge of rawEdges) {
      const pairOv = edgeOverridesByPair.get(
        `${edge.from.toUpperCase()}->${edge.to.toUpperCase()}`
      );
      const targetDefault = defaultIncomingByTarget.get(edge.to.toUpperCase());
      if (pairOv?.precedenceType ?? targetDefault?.precedenceType) {
        edge.precedenceType = pairOv?.precedenceType ?? targetDefault?.precedenceType;
      }
      if (pairOv?.lagDays !== void 0 || targetDefault?.lagDays !== void 0) {
        edge.lagDays = pairOv?.lagDays ?? targetDefault?.lagDays;
      }
    }
    const nodeKeySet = new Set(nodes.map((n) => n.key));
    const internalEdgesCount = rawEdges.filter(
      (e) => nodeKeySet.has(e.from) && nodeKeySet.has(e.to) && e.from !== e.to
    ).length;
    if (internalEdgesCount === 0 && nodes.length > 1) {
      for (let i = 0; i < nodes.length - 1; i++) {
        rawEdges.push({
          from: nodes[i].key,
          to: nodes[i + 1].key,
          dependencyType: "Blocks",
          propagationWeight: 0.85
        });
      }
    }
    const teamPalette = ["#0284C7", "#059669", "#7C3AED", "#D97706"];
    const uniqueTeamNames = Array.from(new Set(nodes.map((n) => n.team)));
    const resolvedTeams = teams.length > 0 ? teams : uniqueTeamNames.length > 0 ? uniqueTeamNames.map((tName, idx) => {
      const teamNodes = nodes.filter((n) => n.team === tName);
      const assigneeCounts = /* @__PURE__ */ new Map();
      for (const n of teamNodes) {
        if (n.assignee && n.assignee !== "Unassigned") {
          assigneeCounts.set(n.assignee, (assigneeCounts.get(n.assignee) ?? 0) + 1);
        }
      }
      let topLead = "Project Lead";
      let maxCount = 0;
      for (const [person, count] of assigneeCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          topLead = person;
        }
      }
      const activeCount = teamNodes.filter((n) => n.status !== "Done").length;
      const blockedCount = teamNodes.filter((n) => n.status === "Blocked").length;
      const dynamicLoad = Math.min(
        95,
        Math.max(48, 50 + activeCount * 4 + blockedCount * 8)
      );
      return {
        id: `team-${idx + 1}`,
        name: tName,
        lead: topLead,
        color: teamPalette[idx % teamPalette.length],
        cognitiveLoad: dynamicLoad
      };
    }) : defaultTeams;
    const alignedGoals = defaultGoals.map((g, idx) => {
      const candidateTeam = teams.length === 0 && resolvedTeams.length > 0 ? resolvedTeams[idx % resolvedTeams.length] : void 0;
      const ownerLabel = candidateTeam && candidateTeam.name !== "No Team Assigned" ? candidateTeam.name : candidateTeam?.lead && candidateTeam.lead !== "Project Lead" ? `${candidateTeam.lead} (No Team Assigned)` : g.ownerTeam;
      return {
        ...g,
        ownerTeam: ownerLabel
      };
    });
    return buildCausalDAG({
      projectKey,
      projectName: `${projectKey} Live Jira + TWG Workspace`,
      referenceDate,
      source: "jira-live",
      isSyntheticDemo: false,
      nodes,
      edges: rawEdges,
      goals: alignedGoals,
      teams: resolvedTeams
    });
  }
  function formatLabelValue(raw) {
    return raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  }
  function inferIssueTeam(issue, _projectKey, explicitTeams, index) {
    const labels = issue.fields.labels ?? [];
    const teamLabel = labels.find((l) => l.toLowerCase().startsWith("team:"));
    if (teamLabel && formatLabelValue(teamLabel.slice(5)).length > 0) {
      return formatLabelValue(teamLabel.slice(5));
    }
    const rawTeamField = issue.fields.customfield_10001;
    if (typeof rawTeamField === "string" && rawTeamField.trim().length > 0) {
      return rawTeamField.trim();
    }
    if (rawTeamField && typeof rawTeamField === "object") {
      const tfName = (rawTeamField.name ?? rawTeamField.title ?? "").trim();
      if (tfName.length > 0) return tfName;
    }
    if (explicitTeams.length > 0) {
      return explicitTeams[index % explicitTeams.length].name;
    }
    return "No Team Assigned";
  }
  function normalizeStatus(raw) {
    const lower = raw.toLowerCase();
    if (lower === "done" || lower === "closed" || lower === "resolved") {
      return "Done";
    }
    if (lower.includes("block")) {
      return "Blocked";
    }
    if (lower.includes("progress") || lower.includes("review")) {
      return "In Progress";
    }
    return "To Do";
  }
  function addCalendarDays(isoDate, daysToAdd) {
    const safeIso = typeof isoDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(isoDate.trim()) ? isoDate.trim().slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const parsed = /* @__PURE__ */ new Date(`${safeIso}T00:00:00.000Z`);
    const base = Number.isNaN(parsed.getTime()) ? /* @__PURE__ */ new Date(`${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}T00:00:00.000Z`) : parsed;
    const safeDays = Number.isFinite(daysToAdd) ? Math.max(-3650, Math.min(3650, Math.round(daysToAdd))) : 0;
    base.setUTCDate(base.getUTCDate() + safeDays);
    return base.toISOString().slice(0, 10);
  }

  // ../../src/engine/types.ts
  var SIMULATION_BOUNDS = {
    MIN_DELAY_DAYS: -5,
    MAX_DELAY_DAYS: 60,
    MIN_UNAVAILABLE_DAYS: -3,
    MAX_UNAVAILABLE_DAYS: 15,
    MAX_OVERRIDE_ENTRIES: 50,
    MAX_COMPOUND_JSON_BYTES: 16384,
    MAX_MCP_BODY_BYTES: 65536
  };
  var RESERVED_OBJECT_KEYS = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
  function isReservedObjectKey(key) {
    return RESERVED_OBJECT_KEYS.has(key);
  }
  function clampDelayDays(val, fallback = 0) {
    const num = val !== void 0 && val !== null && val !== "" ? Number(val) : NaN;
    const base = Number.isFinite(num) ? num : fallback;
    return Math.max(
      SIMULATION_BOUNDS.MIN_DELAY_DAYS,
      Math.min(SIMULATION_BOUNDS.MAX_DELAY_DAYS, base)
    );
  }
  function clampUnavailableDays(val, fallback = 0) {
    const num = val !== void 0 && val !== null && val !== "" ? Number(val) : NaN;
    const base = Number.isFinite(num) ? num : fallback;
    return Math.max(
      SIMULATION_BOUNDS.MIN_UNAVAILABLE_DAYS,
      Math.min(SIMULATION_BOUNDS.MAX_UNAVAILABLE_DAYS, base)
    );
  }

  // ../../src/engine/simulator.ts
  var DEFAULT_ITERATIONS = 500;
  var DEFAULT_SEED = 3235782694;
  function createMulberry32(seed) {
    let state2 = seed >>> 0;
    return () => {
      state2 = state2 + 1831565813 >>> 0;
      let t = Math.imul(state2 ^ state2 >>> 15, 1 | state2);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function sampleStandardNormal(rng) {
    let u1 = rng();
    let u2 = rng();
    if (u1 < 1e-12) u1 = 1e-12;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
  function percentileSorted(sorted, q) {
    if (sorted.length === 0) return 0;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (base + 1 < sorted.length) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }
  function computeNodeCompletionStepPct(node, outgoingEdges, nodeByKey) {
    const statusLower = node.status.toLowerCase();
    if (statusLower === "done" || statusLower === "completed" || statusLower === "closed") {
      if (node.handoffAcceptedByDownstream === false) {
        return 75;
      }
      if (node.handoffAcceptedByDownstream === true) {
        return 100;
      }
      const hasUnacceptedCrossTeamHandoff = outgoingEdges.some((edge) => {
        const target = nodeByKey.get(edge.to);
        if (!target) return false;
        const isCrossTeam = target.team !== node.team || edge.dependencyType === "Cross-Team Handoff";
        return isCrossTeam && target.status.toLowerCase() === "to do" && edge.propagationWeight >= 0.95;
      });
      return hasUnacceptedCrossTeamHandoff ? 75 : 100;
    }
    if (statusLower.includes("review") || statusLower.includes("qa")) {
      return 75;
    }
    if (statusLower.includes("progress")) {
      return 50;
    }
    if (statusLower.includes("block")) {
      return 25;
    }
    return 0;
  }
  function computeBrooksLawMetrics(node) {
    const n = Math.max(2, node.teamSize ?? 3);
    const communicationChannelsBefore = n * (n - 1) / 2;
    const communicationChannelsAfter = (n + 1) * n / 2;
    const deltaChannels = communicationChannelsAfter - communicationChannelsBefore;
    const pert = computePertParameters(node);
    const base = Math.max(0.5, pert.meanDays);
    const onboardingPenaltyDays = Number(
      Math.min(1.2, 0.08 * base + 0.06 * deltaChannels).toFixed(2)
    );
    const parallelCompressed = base * 0.65;
    const appliedOnboarding = base <= 2 ? onboardingPenaltyDays : onboardingPenaltyDays * 0.35;
    const effectiveSwarmDurationDays = Number(
      Math.max(0.5, parallelCompressed + appliedOnboarding).toFixed(2)
    );
    const netAccelerationDays = Number((base - effectiveSwarmDurationDays).toFixed(2));
    let warning;
    if (base <= 2.5) {
      warning = `Short task (${base}d): +${onboardingPenaltyDays}d mentoring & coordination overhead (${communicationChannelsBefore} -> ${communicationChannelsAfter} channels) reduces parallel speedup.`;
    }
    return {
      communicationChannelsBefore,
      communicationChannelsAfter,
      onboardingPenaltyDays,
      netAccelerationDays,
      effectiveSwarmDurationDays,
      warning
    };
  }
  function runMonteCarloSimulation(graph, options = {}) {
    const startClock = performance.now();
    const iterations = Math.max(50, options.iterations ?? DEFAULT_ITERATIONS);
    const seed = options.seed ?? DEFAULT_SEED;
    const topoKeys = graph.topologicalOrder.length === graph.nodes.length ? graph.topologicalOrder : topologicalSort(graph.nodes, graph.edges);
    const n = topoKeys.length;
    const keyToIndex = /* @__PURE__ */ new Map();
    topoKeys.forEach((k, idx) => keyToIndex.set(k, idx));
    const nodeByKey = new Map(graph.nodes.map((node) => [node.key, node]));
    const orderedNodes = topoKeys.map((k) => nodeByKey.get(k));
    const intervenedKey = options.intervention?.targetNodeId ? resolveNodeKey(
      graph.nodes,
      options.intervention.targetNodeId,
      graph.isSyntheticDemo
    ) : void 0;
    const interventionDelta = intervenedKey && options.intervention ? clampDelayDays(options.intervention.deltaDays, 0) : 0;
    const addDeveloper = Boolean(intervenedKey && options.intervention?.addDeveloper);
    const decoupleBlockingEdges = Boolean(
      intervenedKey && options.intervention?.decoupleBlockingEdges
    );
    const trimScope = Boolean(intervenedKey && options.intervention?.trimScope);
    const effectiveNodeOverrides = /* @__PURE__ */ new Map();
    if (intervenedKey && (interventionDelta !== 0 || addDeveloper || decoupleBlockingEdges || trimScope)) {
      effectiveNodeOverrides.set(intervenedKey, {
        deltaDays: interventionDelta,
        addDeveloper,
        decoupleBlockingEdges,
        trimScope
      });
    }
    let nodeOverrideCount = 0;
    for (const [rawKey, ov] of Object.entries(options.intervention?.nodeOverrides ?? {})) {
      if (!ov || isReservedObjectKey(rawKey)) continue;
      if (++nodeOverrideCount > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
      const resolved = resolveNodeKey(graph.nodes, rawKey, graph.isSyntheticDemo);
      if (!resolved) continue;
      const d = clampDelayDays(ov.deltaDays, 0);
      const hasMod = d !== 0 || Boolean(ov.addDeveloper) || Boolean(ov.decoupleBlockingEdges) || Boolean(ov.trimScope);
      if (hasMod) {
        effectiveNodeOverrides.set(resolved, {
          deltaDays: d,
          addDeveloper: Boolean(ov.addDeveloper),
          decoupleBlockingEdges: Boolean(ov.decoupleBlockingEdges),
          trimScope: Boolean(ov.trimScope)
        });
      }
    }
    const reassignedNodeKeys = /* @__PURE__ */ new Set();
    const serializedAssignees = /* @__PURE__ */ new Set();
    let assigneeOverrideCount = 0;
    for (const [rawAssignee, aOv] of Object.entries(
      options.intervention?.assigneeOverrides ?? {}
    )) {
      if (!aOv || isReservedObjectKey(rawAssignee)) continue;
      if (++assigneeOverrideCount > SIMULATION_BOUNDS.MAX_OVERRIDE_ENTRIES) break;
      const assigneeName = (aOv.assignee || rawAssignee).trim();
      const assigneeLower = assigneeName.toLowerCase();
      if (!assigneeLower) continue;
      const activeAssigneeNodes = orderedNodes.filter(
        (node) => node.assignee.trim().toLowerCase() === assigneeLower && node.status.toLowerCase() !== "done"
      ).sort(
        (a, b) => b.baseEstimateDays * (1 + b.uncertaintySigma) - a.baseEstimateDays * (1 + a.uncertaintySigma)
      );
      if (activeAssigneeNodes.length === 0) continue;
      const ptoDays = clampUnavailableDays(aOv.unavailableDays, 0);
      if (ptoDays !== 0) {
        activeAssigneeNodes.forEach((aNode, idx) => {
          const appliedDays = idx === 0 ? ptoDays : Number((ptoDays * 0.45).toFixed(1));
          const prev = effectiveNodeOverrides.get(aNode.key) ?? { deltaDays: 0 };
          effectiveNodeOverrides.set(aNode.key, {
            ...prev,
            deltaDays: clampDelayDays(Number((prev.deltaDays + appliedDays).toFixed(1)), 0)
          });
        });
      }
      if (aOv.pairOnTopBlocker && activeAssigneeNodes[0]) {
        const topKey = activeAssigneeNodes[0].key;
        const prev = effectiveNodeOverrides.get(topKey) ?? { deltaDays: 0 };
        effectiveNodeOverrides.set(topKey, {
          ...prev,
          addDeveloper: true
        });
      }
      if (aOv.reassignBottleneck) {
        const targetParallelNode = activeAssigneeNodes[1] ?? activeAssigneeNodes[0];
        reassignedNodeKeys.add(targetParallelNode.key);
        if (!effectiveNodeOverrides.has(targetParallelNode.key)) {
          effectiveNodeOverrides.set(targetParallelNode.key, { deltaDays: 0 });
        }
      }
      if (aOv.serializeParallelWork) {
        serializedAssignees.add(assigneeLower);
        if (!effectiveNodeOverrides.has(activeAssigneeNodes[0].key)) {
          effectiveNodeOverrides.set(activeAssigneeNodes[0].key, { deltaDays: 0 });
        }
      }
    }
    const decoupledKeys = /* @__PURE__ */ new Set();
    for (const [k, ov] of effectiveNodeOverrides.entries()) {
      if (ov.decoupleBlockingEdges) {
        decoupledKeys.add(k);
      }
    }
    const anyDecoupled = decoupledKeys.size > 0;
    const anyAddDeveloper = addDeveloper || Array.from(effectiveNodeOverrides.values()).some((v) => v.addDeveloper);
    const anyTrimScope = trimScope || Array.from(effectiveNodeOverrides.values()).some((v) => v.trimScope);
    const effectiveEdges = anyDecoupled ? graph.edges.map(
      (e) => decoupledKeys.has(e.from) ? { ...e, propagationWeight: Math.min(e.propagationWeight, 0.25) } : e
    ) : graph.edges;
    const effectiveGraph = anyDecoupled ? { ...graph, edges: effectiveEdges } : graph;
    const hasExplicitOverrides = effectiveNodeOverrides.size > 0 || reassignedNodeKeys.size > 0 || serializedAssignees.size > 0;
    const blastSources = Array.from(
      /* @__PURE__ */ new Set([
        ...effectiveNodeOverrides.keys(),
        ...reassignedNodeKeys.values(),
        ...intervenedKey && (!hasExplicitOverrides || effectiveNodeOverrides.has(intervenedKey)) ? [intervenedKey] : []
      ])
    );
    const combinedBlastKeys = /* @__PURE__ */ new Set();
    const combinedEffectiveWeights = {};
    for (const srcKey of blastSources) {
      const info = getDownstreamBlastRadius(effectiveGraph, srcKey);
      for (const bk of info.blastRadiusKeys) {
        combinedBlastKeys.add(bk);
      }
      for (const [wk, wVal] of Object.entries(info.effectiveWeights)) {
        combinedEffectiveWeights[wk] = Math.max(combinedEffectiveWeights[wk] ?? 0, wVal);
      }
    }
    const blastInfo = {
      targetKey: blastSources[0],
      blastRadiusKeys: Array.from(combinedBlastKeys),
      effectiveWeights: combinedEffectiveWeights
    };
    const predIndices = Array.from({ length: n }, () => []);
    const predWeights = Array.from({ length: n }, () => []);
    const predTypes = Array.from({ length: n }, () => []);
    const predLags = Array.from({ length: n }, () => []);
    const outgoingByKey = /* @__PURE__ */ new Map();
    for (const node of orderedNodes) {
      outgoingByKey.set(node.key, []);
    }
    for (const edge of effectiveEdges) {
      outgoingByKey.get(edge.from)?.push(edge);
      const uIdx = keyToIndex.get(edge.from);
      const vIdx = keyToIndex.get(edge.to);
      if (uIdx !== void 0 && vIdx !== void 0) {
        predIndices[vIdx].push(uIdx);
        predWeights[vIdx].push(edge.propagationWeight);
        predTypes[vIdx].push(edge.precedenceType ?? "FS");
        predLags[vIdx].push(edge.lagDays ?? 0);
      }
    }
    const assigneeActiveTasks = /* @__PURE__ */ new Map();
    for (const node of orderedNodes) {
      if (node.status.toLowerCase() !== "done" && node.assignee && node.assignee.toLowerCase() !== "unassigned") {
        const effectiveAssignee = reassignedNodeKeys.has(node.key) ? `Reassigned (${node.key})` : node.assignee;
        if (serializedAssignees.has(effectiveAssignee.trim().toLowerCase())) {
          const list2 = assigneeActiveTasks.get(effectiveAssignee) ?? [];
          if (list2.length === 0) {
            list2.push(node.key);
            assigneeActiveTasks.set(effectiveAssignee, list2);
          }
          continue;
        }
        const list = assigneeActiveTasks.get(effectiveAssignee) ?? [];
        list.push(node.key);
        assigneeActiveTasks.set(effectiveAssignee, list);
      }
    }
    const cpmMetrics = computeDeterministicCriticalPath(effectiveGraph);
    const nodePert = orderedNodes.map((node) => computePertParameters(node));
    const nodeStartSamples = Array.from(
      { length: n },
      () => new Float64Array(iterations)
    );
    const nodeEndSamples = Array.from(
      { length: n },
      () => new Float64Array(iterations)
    );
    const nodeDurationSums = new Float64Array(n);
    const criticalHits = new Uint32Array(n);
    const projectTotals = new Float64Array(iterations);
    const trialStart = new Float64Array(n);
    const trialEnd = new Float64Array(n);
    const criticalPred = new Int32Array(n);
    const rng = createMulberry32(seed);
    for (let iter = 0; iter < iterations; iter++) {
      let maxProjectEnd = 0;
      let terminalNodeIdx = -1;
      for (let i = 0; i < n; i++) {
        const node = orderedNodes[i];
        const pert = nodePert[i];
        const nodeOv = effectiveNodeOverrides.get(node.key);
        const nodeDelta = nodeOv ? Number(nodeOv.deltaDays || 0) : 0;
        const nodeAddDev = Boolean(nodeOv?.addDeveloper);
        const nodeTrimScope = Boolean(nodeOv?.trimScope);
        const isNodeReassigned = reassignedNodeKeys.has(node.key);
        const isAssigneeSerialized = serializedAssignees.has(
          node.assignee.trim().toLowerCase()
        );
        const isTarget = Boolean(nodeOv) || isNodeReassigned || isAssigneeSerialized;
        const isDone = node.status.toLowerCase() === "done";
        const z = sampleStandardNormal(rng);
        const riskUniforms = node.pureRisks && node.pureRisks.length > 0 ? node.pureRisks.map(() => rng()) : void 0;
        let sampledDuration = 0;
        if (!isDone || isTarget && (nodeDelta !== 0 || nodeAddDev || nodeTrimScope)) {
          let base = isDone ? 0 : pert.meanDays;
          let sigma = isDone ? 0.25 : pert.sigmaDays;
          if (typeof node.allocationRatio === "number") {
            if (node.allocationRatio < 0.2) {
              sigma *= 1.25;
            } else if (node.allocationRatio > 1.1) {
              sigma *= 1.2;
            }
          }
          if (nodeAddDev) {
            const brooks = computeBrooksLawMetrics(node);
            base = brooks.effectiveSwarmDurationDays;
            sigma = Math.max(0.1, sigma * 0.6);
          }
          if (nodeTrimScope) {
            base = Math.max(0.5, Number((base * 0.65).toFixed(2)));
            sigma = Math.max(0.1, sigma * 0.55);
          }
          if (isNodeReassigned) {
            base = Math.max(0.5, Number((base * 0.72).toFixed(2)));
            sigma = Math.max(0.1, sigma * 0.65);
          }
          if (isAssigneeSerialized) {
            base = Math.max(0.5, Number((base * 0.88).toFixed(2)));
            sigma = Math.max(0.1, sigma * 0.7);
          }
          const skewNoise = z >= 0 ? z * sigma * 1.28 : z * sigma * 0.62;
          let rawDuration = Math.max(base * 0.35, base + skewNoise);
          if (node.pureRisks && riskUniforms) {
            for (let rIdx = 0; rIdx < node.pureRisks.length; rIdx++) {
              const risk = node.pureRisks[rIdx];
              if (riskUniforms[rIdx] < Math.max(0, Math.min(1, risk.probability))) {
                rawDuration += Math.max(0, risk.delayImpactDays);
              }
            }
          }
          const shiftedDuration = rawDuration + (isTarget ? nodeDelta : 0);
          sampledDuration = isDone && nodeDelta <= 0 ? 0 : Math.max(0.5, shiftedDuration);
        }
        const pIdxList = predIndices[i];
        const pWeightList = predWeights[i];
        const pTypeList = predTypes[i];
        const pLagList = predLags[i];
        let earliestStart = 0;
        let chosenPred = -1;
        for (let p = 0; p < pIdxList.length; p++) {
          const uIdx = pIdxList[p];
          const w = pWeightList[p];
          const pType = pTypeList[p];
          const lag = pLagList[p];
          const uStart = trialStart[uIdx];
          const uEnd = trialEnd[uIdx];
          const uDur = Math.max(0, uEnd - uStart);
          let candidateStart = 0;
          if (pType === "SS") {
            candidateStart = Math.max(0, uStart + lag);
          } else if (pType === "FF") {
            candidateStart = Math.max(0, uEnd + lag - sampledDuration);
          } else if (pType === "SF") {
            candidateStart = Math.max(0, uStart + lag - sampledDuration);
          } else {
            candidateStart = Math.max(0, uStart + uDur * w + lag);
          }
          if (candidateStart > earliestStart) {
            earliestStart = candidateStart;
            chosenPred = uIdx;
          }
        }
        const finish = earliestStart + sampledDuration;
        trialStart[i] = earliestStart;
        trialEnd[i] = finish;
        criticalPred[i] = chosenPred;
        nodeStartSamples[i][iter] = earliestStart;
        nodeEndSamples[i][iter] = finish;
        nodeDurationSums[i] += sampledDuration;
        if (finish > maxProjectEnd) {
          maxProjectEnd = finish;
          terminalNodeIdx = i;
        }
      }
      projectTotals[iter] = maxProjectEnd;
      let cursor = terminalNodeIdx;
      let safety = 0;
      while (cursor >= 0 && safety < n + 1) {
        criticalHits[cursor]++;
        cursor = criticalPred[cursor];
        safety++;
      }
    }
    const sortedProjectTotals = Float64Array.from(projectTotals).sort();
    const p50Days = Number(percentileSorted(sortedProjectTotals, 0.5).toFixed(1));
    const p85Days = Number(percentileSorted(sortedProjectTotals, 0.85).toFixed(1));
    const p95Days = Number(percentileSorted(sortedProjectTotals, 0.95).toFixed(1));
    const tailStartIdx = Math.floor(iterations * 0.95);
    let tailSum = 0;
    let tailCount = 0;
    for (let t = tailStartIdx; t < iterations; t++) {
      tailSum += sortedProjectTotals[t];
      tailCount++;
    }
    const cvar95Days = Number(
      (tailCount > 0 ? tailSum / tailCount : p95Days).toFixed(1)
    );
    const p50Date = addCalendarDays(graph.referenceDate, Math.ceil(p50Days));
    const p85Date = addCalendarDays(graph.referenceDate, Math.ceil(p85Days));
    const p95Date = addCalendarDays(graph.referenceDate, Math.ceil(p95Days));
    const cvar95Date = addCalendarDays(graph.referenceDate, Math.ceil(cvar95Days));
    const nodeStats = {};
    for (let i = 0; i < n; i++) {
      const node = orderedNodes[i];
      const pert = nodePert[i];
      const sortedStarts = Float64Array.from(nodeStartSamples[i]).sort();
      const sortedEnds = Float64Array.from(nodeEndSamples[i]).sort();
      const nodeP50Start = Number(percentileSorted(sortedStarts, 0.5).toFixed(1));
      const nodeP50End = Number(percentileSorted(sortedEnds, 0.5).toFixed(1));
      const nodeP85End = Number(percentileSorted(sortedEnds, 0.85).toFixed(1));
      const nodeP95End = Number(percentileSorted(sortedEnds, 0.95).toFixed(1));
      const criticalityIndex = Number((criticalHits[i] / iterations).toFixed(3));
      const effWeight = blastInfo.effectiveWeights[node.key] ?? 0;
      const completionStepPct = computeNodeCompletionStepPct(
        node,
        outgoingByKey.get(node.key) ?? [],
        nodeByKey
      );
      nodeStats[node.key] = {
        nodeId: node.id,
        key: node.key,
        summary: node.summary,
        team: node.team,
        goalId: node.goalId,
        status: node.status,
        baseEstimateDays: node.baseEstimateDays,
        uncertaintySigma: node.uncertaintySigma,
        p50StartDay: nodeP50Start,
        p50EndDay: nodeP50End,
        p85EndDay: nodeP85End,
        p95EndDay: nodeP95End,
        p50Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP50End)),
        p85Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP85End)),
        p95Date: addCalendarDays(graph.referenceDate, Math.ceil(nodeP95End)),
        meanDurationDays: Number((nodeDurationSums[i] / iterations).toFixed(2)),
        slackDays: cpmMetrics[node.key]?.slackDays ?? 0,
        totalFloatDays: cpmMetrics[node.key]?.totalFloatDays ?? cpmMetrics[node.key]?.slackDays ?? 0,
        completionStepPct,
        pertMeanDays: pert.meanDays,
        pertSigmaDays: pert.sigmaDays,
        criticalityIndex,
        rippleDelayDays: Number((interventionDelta * effWeight).toFixed(1)),
        effectivePropagationWeight: effWeight
      };
    }
    const criticalPathNodes = topoKeys.filter((key) => {
      const stat = nodeStats[key];
      const cpm = cpmMetrics[key];
      return stat.status.toLowerCase() !== "done" && (stat.criticalityIndex >= 0.25 || cpm && cpm.isOnCriticalPath);
    });
    if (criticalPathNodes.length === 0 && topoKeys.length > 0) {
      const sortedByEnd = [...topoKeys].sort(
        (a, b) => (nodeStats[b]?.p85EndDay ?? 0) - (nodeStats[a]?.p85EndDay ?? 0)
      );
      criticalPathNodes.push(...sortedByEnd.slice(0, Math.min(5, sortedByEnd.length)));
    }
    const superCriticalNodes = topoKeys.filter((key) => {
      const stat = nodeStats[key];
      return stat.status.toLowerCase() !== "done" && (stat.totalFloatDays ?? 0) < 0;
    });
    const topBottlenecks = orderedNodes.filter((node) => node.status.toLowerCase() !== "done").map((node) => {
      const stat = nodeStats[node.key];
      const cpm = cpmMetrics[node.key];
      const downstreamCount = cpm?.downstreamCount ?? 0;
      const downstreamRippleWeight = cpm?.downstreamRippleWeight ?? 0;
      const slackDays = cpm?.slackDays ?? 0;
      const totalFloatDays = cpm?.totalFloatDays ?? slackDays;
      const criticalityTerm = stat.criticalityIndex * 45;
      const fanoutTerm = Math.min(30, downstreamRippleWeight * 3.8);
      const uncertaintyTerm = Math.min(15, node.uncertaintySigma * 4.5);
      const zeroSlackBonus = slackDays <= 0.5 ? 10 : Math.max(0, 10 - slackDays * 1.5);
      const riskScore = Math.min(
        99,
        Math.round(criticalityTerm + fanoutTerm + uncertaintyTerm + zeroSlackBonus)
      );
      const brooks = computeBrooksLawMetrics(node);
      const expectedRiskReductionDays = Math.max(
        0.5,
        (brooks.netAccelerationDays + node.uncertaintySigma * 0.4) * Math.max(0.25, stat.criticalityIndex) * (1 + Math.min(2.5, downstreamRippleWeight * 0.25))
      );
      const mitigationCostDays = Math.max(
        1,
        node.pureRisks?.[0]?.mitigationEffortDays ?? Math.max(1, node.baseEstimateDays * 0.25)
      );
      const mitigationROI = Number((expectedRiskReductionDays / mitigationCostDays).toFixed(2));
      let recommendation = "Monitor standard sprint progress; buffer is currently sufficient.";
      if (downstreamCount >= 4 && stat.criticalityIndex >= 0.35) {
        recommendation = `High-fanout structural gate (${downstreamCount} downstream tasks, ripple weight ${downstreamRippleWeight}). Add a swarm developer or decouple interface contract early.`;
      } else if (node.uncertaintySigma >= 2) {
        recommendation = `High variance (\u03C3=${node.uncertaintySigma}d). Spike technical unknowns in the next 48h to compress worst-case buffer risk.`;
      } else if (slackDays <= 0.5) {
        recommendation = `Zero-slack critical path driver. Protect assignee focus and prevent scope creep.`;
      }
      return {
        key: node.key,
        id: node.id,
        summary: node.summary,
        team: node.team,
        assignee: node.assignee,
        status: node.status,
        goalId: node.goalId,
        baseEstimateDays: node.baseEstimateDays,
        uncertaintySigma: node.uncertaintySigma,
        criticalityIndex: stat.criticalityIndex,
        downstreamCount,
        downstreamRippleWeight,
        slackDays,
        totalFloatDays,
        mitigationROI,
        riskScore,
        recommendation
      };
    }).sort((a, b) => b.riskScore - a.riskScore || b.downstreamRippleWeight - a.downstreamRippleWeight);
    const goalImpacts = graph.goals.map((goal) => {
      const goalNodes = orderedNodes.filter((n2) => n2.goalId === goal.id);
      const activeNodes = goalNodes.length > 0 ? goalNodes : orderedNodes;
      const goalIterTotals = new Float64Array(iterations);
      for (let iter = 0; iter < iterations; iter++) {
        let maxGoalEnd = 0;
        for (const gn of activeNodes) {
          const idx = keyToIndex.get(gn.key);
          const val = nodeEndSamples[idx][iter];
          if (val > maxGoalEnd) {
            maxGoalEnd = val;
          }
        }
        goalIterTotals[iter] = maxGoalEnd;
      }
      const sortedGoalTotals = Float64Array.from(goalIterTotals).sort();
      const gP50 = Number(percentileSorted(sortedGoalTotals, 0.5).toFixed(1));
      const gP85 = Number(percentileSorted(sortedGoalTotals, 0.85).toFixed(1));
      const gP95 = Number(percentileSorted(sortedGoalTotals, 0.95).toFixed(1));
      let onTimeCount = 0;
      for (let iter = 0; iter < iterations; iter++) {
        if (goalIterTotals[iter] <= goal.targetDayOffset) {
          onTimeCount++;
        }
      }
      const probabilityOfOnTime = Number((onTimeCount / iterations).toFixed(2));
      const bufferDays = Number((goal.targetDayOffset - gP85).toFixed(1));
      let status = "On Track";
      if (bufferDays < -2 || probabilityOfOnTime < 0.45) {
        status = "Off Track";
      } else if (bufferDays < 2 || probabilityOfOnTime < 0.8) {
        status = "At Risk";
      }
      let maxGoalEffWeight = 0;
      for (const gn of activeNodes) {
        const w = blastInfo.effectiveWeights[gn.key] ?? 0;
        if (w > maxGoalEffWeight) {
          maxGoalEffWeight = w;
        }
      }
      return {
        goalId: goal.id,
        goalKey: goal.key,
        goalName: goal.name,
        ownerTeam: goal.ownerTeam,
        targetDate: goal.targetDate,
        targetDayOffset: goal.targetDayOffset,
        p50CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP50)),
        p85CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP85)),
        p95CompletionDate: addCalendarDays(graph.referenceDate, Math.ceil(gP95)),
        p85DayOffset: gP85,
        rippleDelayDays: Number((interventionDelta * maxGoalEffWeight).toFixed(1)),
        bufferDays,
        probabilityOfOnTime,
        status,
        contributingIssueKeys: activeNodes.map((n2) => n2.key)
      };
    });
    const minDay = Math.floor(sortedProjectTotals[0] ?? 0);
    const maxDay = Math.ceil(sortedProjectTotals[sortedProjectTotals.length - 1] ?? 10);
    const span = Math.max(6, maxDay - minDay + 1);
    const bucketCount = 12;
    const bucketStep = Math.max(1, Math.ceil(span / bucketCount));
    const distributionBuckets = [];
    let cumulativeCount = 0;
    for (let b = 0; b < bucketCount; b++) {
      const bucketDay = minDay + b * bucketStep;
      const nextDay = bucketDay + bucketStep;
      let countInBucket = 0;
      for (let iter = 0; iter < iterations; iter++) {
        const val = sortedProjectTotals[iter];
        if (b === 0 && val < nextDay || b === bucketCount - 1 && val >= bucketDay || val >= bucketDay && val < nextDay) {
          countInBucket++;
        }
      }
      cumulativeCount += countInBucket;
      distributionBuckets.push({
        dayOffset: bucketDay,
        date: addCalendarDays(graph.referenceDate, bucketDay),
        probability: Number((countInBucket / iterations).toFixed(3)),
        cumulativeProbability: Number(Math.min(1, cumulativeCount / iterations).toFixed(3))
      });
    }
    const doneCount = orderedNodes.filter((n2) => n2.status.toLowerCase() === "done").length;
    const inProgressCount = orderedNodes.filter(
      (n2) => n2.status.toLowerCase() === "in progress"
    ).length;
    const blockedCount = orderedNodes.filter((n2) => n2.status.toLowerCase() === "blocked").length;
    const todoCount = Math.max(0, orderedNodes.length - doneCount - inProgressCount - blockedCount);
    const timeMachineEpochs = [
      {
        epochId: "sprint-minus-2",
        label: "Sprint -2 (Architecture Kickoff)",
        dayOffset: -28,
        date: addCalendarDays(graph.referenceDate, -28),
        mode: "past",
        completedCount: Math.max(1, Math.floor(doneCount * 0.35)),
        inProgressCount: 3,
        blockedCount: 0,
        todoCount: orderedNodes.length - Math.max(1, Math.floor(doneCount * 0.35)) - 3,
        projectedP85Date: addCalendarDays(graph.referenceDate, Math.ceil(p85Days - 4)),
        confidenceScore: 88,
        narrative: "Initial DAG topology established. Foundation specs and schema contracts underway with zero cross-team blocks."
      },
      {
        epochId: "sprint-minus-1",
        label: "Sprint -1 (Core Integration)",
        dayOffset: -14,
        date: addCalendarDays(graph.referenceDate, -14),
        mode: "past",
        completedCount: Math.max(2, Math.floor(doneCount * 0.75)),
        inProgressCount: Math.max(2, inProgressCount),
        blockedCount: Math.min(1, blockedCount),
        todoCount: Math.max(
          0,
          orderedNodes.length - Math.max(2, Math.floor(doneCount * 0.75)) - Math.max(2, inProgressCount) - Math.min(1, blockedCount)
        ),
        projectedP85Date: addCalendarDays(graph.referenceDate, Math.ceil(p85Days - 2)),
        confidenceScore: 81,
        narrative: "Cross-team handoffs activated between Core Engine and Cloud Infra; variance increased on integration bridges."
      },
      {
        epochId: "present-now",
        label: "Today (State t\u2080)",
        dayOffset: 0,
        date: graph.referenceDate,
        mode: "present",
        completedCount: doneCount,
        inProgressCount,
        blockedCount,
        todoCount,
        projectedP85Date: p85Date,
        confidenceScore: blockedCount > 0 ? 72 : 84,
        narrative: intervenedKey ? `Counterfactual active: do(${intervenedKey} = ${interventionDelta >= 0 ? `+${interventionDelta}` : interventionDelta}d) propagates across ${blastInfo.blastRadiusKeys.length} downstream nodes.` : `Live DAG baseline across ${orderedNodes.length} tasks and ${graph.edges.length} causal links.`
      },
      {
        epochId: "future-p50",
        label: "Likely Finish (50% odds)",
        dayOffset: Math.ceil(p50Days),
        date: p50Date,
        mode: "future-p50",
        completedCount: orderedNodes.length,
        inProgressCount: 0,
        blockedCount: 0,
        todoCount: 0,
        projectedP85Date: p85Date,
        confidenceScore: 50,
        narrative: `Likely Finish (50% odds): 50% of simulated project runs complete all ${orderedNodes.length} issues by ${p50Date} (+${p50Days}d).`
      },
      {
        epochId: "future-p85",
        label: "Target Commit Date (85% safe)",
        dayOffset: Math.ceil(p85Days),
        date: p85Date,
        mode: "future-p85",
        completedCount: orderedNodes.length,
        inProgressCount: 0,
        blockedCount: 0,
        todoCount: 0,
        projectedP85Date: p85Date,
        confidenceScore: 85,
        narrative: `Target Commit Date (85% safe): Recommended commitment date (${p85Date}, +${p85Days}d) including Team Risk Buffer.`
      },
      {
        epochId: "future-p95",
        label: "Safe Buffer Date (95% cutoff)",
        dayOffset: Math.ceil(p95Days),
        date: p95Date,
        mode: "future-p95",
        completedCount: orderedNodes.length,
        inProgressCount: 0,
        blockedCount: 0,
        todoCount: 0,
        projectedP85Date: p85Date,
        confidenceScore: 95,
        narrative: `Safe Buffer Date (95% cutoff): 95% confidence safety horizon (${p95Date}, +${p95Days}d) protecting against unexpected blockers.`
      }
    ];
    const gammaRev = anyDecoupled ? 0.92 : 0.72;
    let quadDiffSum = 0;
    let posLockInDelta = 0;
    let totalPosInterventionDelta = 0;
    for (let i = 0; i < n; i++) {
      const baseEst = orderedNodes[i].baseEstimateDays;
      const p85Finish = nodeStats[orderedNodes[i].key]?.p85EndDay ?? baseEst;
      const diff = p85Finish - baseEst;
      const gDiag = 1 + (1 - gammaRev) * 0.5;
      quadDiffSum += diff * diff * gDiag;
      const ovDelta = effectiveNodeOverrides.get(orderedNodes[i].key)?.deltaDays ?? 0;
      if (ovDelta > 0) {
        posLockInDelta += ovDelta;
        totalPosInterventionDelta += ovDelta;
      }
    }
    const quasimetricEnergy = Number(
      (Math.sqrt(Math.max(0, quadDiffSum)) + (1 - gammaRev) * posLockInDelta).toFixed(2)
    );
    let fastTrackingReworkBonus = 0;
    for (const edge of effectiveEdges) {
      if ((edge.lagDays ?? 0) < 0) {
        fastTrackingReworkBonus += Math.abs(edge.lagDays) * 1.8;
      }
    }
    const maturityRatio = orderedNodes.length > 0 ? (doneCount + inProgressCount * 0.5) / orderedNodes.length : 0;
    const lateChangeEscalationFactor = Number(Math.exp(0.65 * maturityRatio).toFixed(2));
    const estimatedReworkHours = Number(
      Math.max(
        4,
        (blastInfo.blastRadiusKeys.length * 3.5 + totalPosInterventionDelta * 5.2 + fastTrackingReworkBonus) * (totalPosInterventionDelta > 0 ? lateChangeEscalationFactor * 0.78 : 1) * (anyAddDeveloper ? 0.65 : 1) * (anyDecoupled ? 0.5 : 1) * (anyTrimScope ? 0.7 : 1)
      ).toFixed(1)
    );
    const pmContingencyReserveDays = Number(Math.max(0.5, p85Days - p50Days).toFixed(1));
    const managementReserveDays = Number(Math.max(0.5, cvar95Days - p85Days).toFixed(1));
    let totalBac = 0;
    let committedEffort = 0;
    for (const node of orderedNodes) {
      const bac = Math.max(0.5, node.plannedEffortDays ?? node.baseEstimateDays);
      totalBac += bac;
      const sLow = node.status.toLowerCase();
      if (sLow === "done" || sLow.includes("progress") || sLow.includes("block")) {
        committedEffort += bac;
      }
    }
    const committedEffortRatio = Number(
      (totalBac > 0 ? Math.min(1, committedEffort / totalBac) : 0).toFixed(2)
    );
    const activeSlipOrBlock = totalPosInterventionDelta + blockedCount * 1.5;
    const bufferBurnRatio = Number(
      Math.min(2, activeSlipOrBlock / Math.max(1, pmContingencyReserveDays)).toFixed(2)
    );
    const reserves = {
      baseTargetDays: p50Days,
      pmContingencyReserveDays,
      managementReserveDays,
      bufferBurnRatio,
      committedEffortRatio
    };
    let totalBcws = 0;
    let totalBcwp = 0;
    let totalAcwp = 0;
    const byTeamAccum = /* @__PURE__ */ new Map();
    for (const node of orderedNodes) {
      const stat = nodeStats[node.key];
      const bac = Math.max(0.5, node.plannedEffortDays ?? node.baseEstimateDays);
      const stepPct = (stat?.completionStepPct ?? 0) / 100;
      const bcwp = bac * stepPct;
      const sLow = node.status.toLowerCase();
      const plannedPct = sLow === "done" ? 1 : sLow.includes("block") ? 0.65 : sLow.includes("progress") ? 0.55 : 0;
      const bcws = bac * plannedPct;
      let acwp = typeof node.actualEffortDays === "number" ? node.actualEffortDays : sLow === "done" ? bac : sLow.includes("block") ? bac * 0.5 : sLow.includes("progress") ? bac * 0.52 : 0;
      const ovDelta = effectiveNodeOverrides.get(node.key)?.deltaDays ?? 0;
      if (ovDelta > 0) {
        acwp += ovDelta * 0.75;
      }
      totalBcws += bcws;
      totalBcwp += bcwp;
      totalAcwp += acwp;
      const tEntry = byTeamAccum.get(node.team) ?? { bac: 0, bcws: 0, bcwp: 0, acwp: 0 };
      tEntry.bac += bac;
      tEntry.bcws += bcws;
      tEntry.bcwp += bcwp;
      tEntry.acwp += acwp;
      byTeamAccum.set(node.team, tEntry);
    }
    const safeDiv = (num, den) => den > 0.01 ? Number((num / den).toFixed(2)) : 1;
    const projectCpi = safeDiv(totalBcwp, totalAcwp);
    const projectSpi = safeDiv(totalBcwp, totalBcws);
    const cvDays = Number((totalBcwp - totalAcwp).toFixed(1));
    const svDays = Number((totalBcwp - totalBcws).toFixed(1));
    const eacOneOffDays = Number(Math.max(0.5, totalAcwp + (totalBac - totalBcwp)).toFixed(1));
    const eacTrendDays = Number(
      Math.max(0.5, totalBac / Math.max(0.25, projectCpi)).toFixed(1)
    );
    const etcDays = Number(
      Math.max(0, (totalBac - totalBcwp) / Math.max(0.25, projectSpi)).toFixed(1)
    );
    const byTeam = {};
    let hasUnderperformingTeam = false;
    let hasOutperformingTeam = false;
    for (const [teamName, acc] of byTeamAccum.entries()) {
      const tCpi = safeDiv(acc.bcwp, acc.acwp);
      const tSpi = safeDiv(acc.bcwp, acc.bcws);
      if (tCpi < 0.88 || tSpi < 0.88) hasUnderperformingTeam = true;
      if (tCpi >= 1.02 && tSpi >= 0.98) hasOutperformingTeam = true;
      byTeam[teamName] = {
        bacDays: Number(acc.bac.toFixed(1)),
        bcwsDays: Number(acc.bcws.toFixed(1)),
        bcwpDays: Number(acc.bcwp.toFixed(1)),
        acwpDays: Number(acc.acwp.toFixed(1)),
        cvDays: Number((acc.bcwp - acc.acwp).toFixed(1)),
        svDays: Number((acc.bcwp - acc.bcws).toFixed(1)),
        cpi: tCpi,
        spi: tSpi,
        maskingWarning: (tCpi < 0.88 || tSpi < 0.88) && (projectCpi >= 0.92 || projectSpi >= 0.92)
      };
    }
    const earnedValue = {
      bacDays: Number(totalBac.toFixed(1)),
      bcwsDays: Number(totalBcws.toFixed(1)),
      bcwpDays: Number(totalBcwp.toFixed(1)),
      acwpDays: Number(totalAcwp.toFixed(1)),
      cvDays,
      svDays,
      cpi: projectCpi,
      spi: projectSpi,
      eacOneOffDays,
      eacTrendDays,
      etcDays,
      maskingWarning: hasUnderperformingTeam && (hasOutperformingTeam || projectCpi >= 0.92 || projectSpi >= 0.92),
      byTeam
    };
    const inspectNode = (intervenedKey ? nodeByKey.get(intervenedKey) : void 0) ?? (topBottlenecks[0] ? nodeByKey.get(topBottlenecks[0].key) : void 0) ?? orderedNodes[0];
    const brooksLawDiagnostic = inspectNode ? computeBrooksLawMetrics(inspectNode) : void 0;
    const overallocatedAssignees = [];
    for (const [assignee, issues] of assigneeActiveTasks.entries()) {
      if (issues.length >= 2) {
        overallocatedAssignees.push({
          assignee,
          concurrentIssues: issues,
          utilizationPct: Math.min(250, issues.length * 65)
        });
      }
    }
    let blockedHandoffIdleDays = 0;
    for (const edge of effectiveEdges) {
      const uNode = nodeByKey.get(edge.from);
      const vNode = nodeByKey.get(edge.to);
      if (!uNode || !vNode) continue;
      const isCrossTeam = uNode.team !== vNode.team || edge.dependencyType === "Cross-Team Handoff" || vNode.executionMode === "cross-team-dependency" || vNode.executionMode === "external-vendor-api";
      if (isCrossTeam) {
        const uSlip = Math.max(0, nodeStats[uNode.key]?.rippleDelayDays ?? 0);
        blockedHandoffIdleDays += uSlip > 0 ? uSlip * edge.propagationWeight : 0.4;
      }
    }
    blockedHandoffIdleDays = Number(blockedHandoffIdleDays.toFixed(1));
    const stageGateNodes = orderedNodes.filter(
      (nd) => nd.isStageGate || nd.issueType?.toLowerCase() === "milestone" || nd.issueType?.toLowerCase() === "gate" || Boolean(nd.confluenceDecision)
    ).map((nd) => nd.key);
    const hypercareReserveDays = Number(
      Math.max(1, p50Days * 0.05 + estimatedReworkHours / 16).toFixed(1)
    );
    let readyNodes = 0;
    for (const nd of orderedNodes) {
      const hasAssignee = Boolean(nd.assignee && nd.assignee.toLowerCase() !== "unassigned");
      const hasEst = nd.baseEstimateDays > 0;
      const hasGoal = Boolean(nd.goalId);
      if (hasAssignee && hasEst && hasGoal) readyNodes++;
    }
    const sprintReadinessScore = orderedNodes.length > 0 ? Math.round(readyNodes / orderedNodes.length * 100) : 100;
    const completedNodes = orderedNodes.filter((nd) => nd.status.toLowerCase() === "done");
    const empiricalVelocityRatio = completedNodes.length > 0 ? Number((1 / Math.max(0.5, projectCpi)).toFixed(2)) : 1;
    const recommendedSigmaMultiplier = Number(
      Math.max(0.85, Math.min(1.45, empiricalVelocityRatio * (blockedCount > 0 ? 1.12 : 1))).toFixed(
        2
      )
    );
    const primaryGoalProb = goalImpacts[0]?.probabilityOfOnTime ?? 0.85;
    const slaBreachProbability = Number(Math.max(0, 1 - primaryGoalProb).toFixed(2));
    const costOfDelayDevDays = Number(
      (Math.max(0, p85Days - (goalImpacts[0]?.targetDayOffset ?? p85Days)) * 1.5 + blockedHandoffIdleDays).toFixed(1)
    );
    const deliveryGovernance = {
      releaseMode: "external-commit",
      slaBreachProbability,
      costOfDelayDevDays,
      brooksLawDiagnostic: brooksLawDiagnostic ? {
        communicationChannelsBefore: brooksLawDiagnostic.communicationChannelsBefore,
        communicationChannelsAfter: brooksLawDiagnostic.communicationChannelsAfter,
        onboardingPenaltyDays: brooksLawDiagnostic.onboardingPenaltyDays,
        netAccelerationDays: brooksLawDiagnostic.netAccelerationDays,
        warning: brooksLawDiagnostic.warning
      } : void 0,
      overallocatedAssignees,
      blockedHandoffIdleDays,
      lateChangeEscalationFactor,
      stageGateNodes,
      hypercareReserveDays,
      sprintReadinessScore,
      lessonsLearntCalibration: {
        completedCount: completedNodes.length,
        empiricalVelocityRatio,
        recommendedSigmaMultiplier,
        summary: completedNodes.length > 0 ? `Calibrated across ${completedNodes.length} completed tasks (velocity ratio ${empiricalVelocityRatio}x, recommended \u03C3 multiplier ${recommendedSigmaMultiplier}x).` : `Baseline prior active (0 completed tasks yet; complete sprint issues to auto-calibrate empirical \u03C3).`
      }
    };
    const executionTimeMs = Number((performance.now() - startClock).toFixed(2));
    return {
      p50Date,
      p85Date,
      p95Date,
      p50Days,
      p85Days,
      p95Days,
      cvar95Days,
      cvar95Date,
      quasimetricEnergy,
      estimatedReworkHours,
      criticalPathNodes,
      superCriticalNodes,
      blastRadiusNodes: blastInfo.blastRadiusKeys,
      rippleDelayDays: interventionDelta,
      iterations,
      executionTimeMs,
      referenceDate: graph.referenceDate,
      intervenedNodeKey: intervenedKey,
      interventionDeltaDays: interventionDelta,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
      nodeStats,
      goalImpacts,
      topBottlenecks,
      distributionBuckets,
      timeMachineEpochs,
      reserves,
      earnedValue,
      deliveryGovernance
    };
  }
  function runIntervention(graph, targetNodeId, deltaDays, iterationsOrOptions = DEFAULT_ITERATIONS) {
    const startClock = performance.now();
    const iterations = typeof iterationsOrOptions === "number" ? iterationsOrOptions : iterationsOrOptions.iterations ?? DEFAULT_ITERATIONS;
    const addDeveloper = typeof iterationsOrOptions === "object" ? Boolean(iterationsOrOptions.addDeveloper) : false;
    const decoupleBlockingEdges = typeof iterationsOrOptions === "object" ? Boolean(iterationsOrOptions.decoupleBlockingEdges) : false;
    const trimScope = typeof iterationsOrOptions === "object" ? Boolean(iterationsOrOptions.trimScope) : false;
    const nodeOverrides = typeof iterationsOrOptions === "object" ? iterationsOrOptions.nodeOverrides : void 0;
    const assigneeOverrides = typeof iterationsOrOptions === "object" ? iterationsOrOptions.assigneeOverrides : void 0;
    const sanitizedDelta = clampDelayDays(deltaDays, 0);
    const resolvedKey = resolveNodeKey(graph.nodes, targetNodeId, graph.isSyntheticDemo) ?? graph.topologicalOrder[0] ?? graph.nodes[0]?.key ?? targetNodeId;
    const targetNode = graph.nodes.find((n) => n.key === resolvedKey);
    const baselineSim = runMonteCarloSimulation(graph, {
      iterations,
      seed: DEFAULT_SEED
    });
    const intervenedSim = runMonteCarloSimulation(graph, {
      iterations,
      seed: DEFAULT_SEED,
      intervention: {
        targetNodeId: resolvedKey,
        deltaDays: sanitizedDelta,
        addDeveloper,
        decoupleBlockingEdges,
        trimScope,
        nodeOverrides,
        assigneeOverrides
      }
    });
    const blastInfo = getDownstreamBlastRadius(graph, resolvedKey);
    const nodeDeltas = [];
    let maxMagnitudeDownstreamShift = 0;
    for (const key of graph.topologicalOrder) {
      const baseStat = baselineSim.nodeStats[key];
      const intStat = intervenedSim.nodeStats[key];
      if (!baseStat || !intStat) continue;
      const shiftDays = Number((intStat.p85EndDay - baseStat.p85EndDay).toFixed(1));
      const effectiveWeight = Math.max(
        blastInfo.effectiveWeights[key] ?? 0,
        intStat.effectivePropagationWeight ?? 0
      );
      if (key !== resolvedKey && Math.abs(shiftDays) > Math.abs(maxMagnitudeDownstreamShift)) {
        maxMagnitudeDownstreamShift = shiftDays;
      }
      intStat.rippleDelayDays = shiftDays;
      if (key === resolvedKey || Boolean(nodeOverrides?.[key]) || effectiveWeight > 0 || Math.abs(shiftDays) > 0) {
        nodeDeltas.push({
          key,
          summary: intStat.summary,
          team: intStat.team,
          goalId: intStat.goalId,
          baselineP85Date: baseStat.p85Date,
          intervenedP85Date: intStat.p85Date,
          shiftDays,
          effectiveWeight
        });
      }
    }
    const p50ShiftDays = Number((intervenedSim.p50Days - baselineSim.p50Days).toFixed(1));
    const p85ShiftDays = Number((intervenedSim.p85Days - baselineSim.p85Days).toFixed(1));
    const p95ShiftDays = Number((intervenedSim.p95Days - baselineSim.p95Days).toFixed(1));
    const enrichedGoalImpacts = intervenedSim.goalImpacts.map((intGoal, idx) => {
      const baseGoal = baselineSim.goalImpacts[idx];
      const goalShift = baseGoal ? Number((intGoal.p85DayOffset - baseGoal.p85DayOffset).toFixed(1)) : intGoal.rippleDelayDays;
      return {
        ...intGoal,
        baselineP85Date: baseGoal?.p85CompletionDate ?? intGoal.p85CompletionDate,
        rippleDelayDays: goalShift
      };
    });
    const rippleDelayDays = Math.abs(p85ShiftDays) > 0 ? p85ShiftDays : Math.abs(maxMagnitudeDownstreamShift) > 0 ? maxMagnitudeDownstreamShift : sanitizedDelta;
    let updatedDeliveryGovernance = intervenedSim.deliveryGovernance;
    if (updatedDeliveryGovernance) {
      const nodeByKey = new Map(graph.nodes.map((n) => [n.key, n]));
      const decoupledSet = /* @__PURE__ */ new Set();
      if (decoupleBlockingEdges) decoupledSet.add(resolvedKey);
      for (const [k, ov] of Object.entries(nodeOverrides ?? {})) {
        if (ov?.decoupleBlockingEdges) {
          const rk = resolveNodeKey(graph.nodes, k, graph.isSyntheticDemo);
          if (rk) decoupledSet.add(rk);
        }
      }
      let crnHandoffIdleDays = 0;
      for (const edge of graph.edges) {
        const uNode = nodeByKey.get(edge.from);
        const vNode = nodeByKey.get(edge.to);
        if (!uNode || !vNode) continue;
        const isCrossTeam = uNode.team !== vNode.team || edge.dependencyType === "Cross-Team Handoff" || vNode.executionMode === "cross-team-dependency" || vNode.executionMode === "external-vendor-api";
        if (isCrossTeam) {
          const effEdgeWeight = decoupledSet.has(edge.from) ? Math.min(edge.propagationWeight, 0.25) : edge.propagationWeight;
          const uSlip = Math.max(0, intervenedSim.nodeStats[uNode.key]?.rippleDelayDays ?? 0);
          crnHandoffIdleDays += uSlip > 0 ? uSlip * effEdgeWeight : 0.4;
        }
      }
      crnHandoffIdleDays = Number(crnHandoffIdleDays.toFixed(1));
      const crnCostOfDelay = Number(
        (Math.max(
          0,
          intervenedSim.p85Days - (enrichedGoalImpacts[0]?.targetDayOffset ?? intervenedSim.p85Days)
        ) * 1.5 + crnHandoffIdleDays).toFixed(1)
      );
      updatedDeliveryGovernance = {
        ...updatedDeliveryGovernance,
        blockedHandoffIdleDays: crnHandoffIdleDays,
        costOfDelayDevDays: crnCostOfDelay
      };
    }
    const totalExecMs = Number((performance.now() - startClock).toFixed(2));
    return {
      ...intervenedSim,
      deliveryGovernance: updatedDeliveryGovernance,
      rippleDelayDays,
      goalImpacts: enrichedGoalImpacts,
      executionTimeMs: totalExecMs,
      targetNodeKey: resolvedKey,
      targetNodeSummary: targetNode?.summary ?? resolvedKey,
      deltaDays: sanitizedDelta,
      baseline: {
        p50Date: baselineSim.p50Date,
        p85Date: baselineSim.p85Date,
        p95Date: baselineSim.p95Date,
        p50Days: baselineSim.p50Days,
        p85Days: baselineSim.p85Days,
        p95Days: baselineSim.p95Days,
        distributionBuckets: baselineSim.distributionBuckets
      },
      intervened: {
        p50Date: intervenedSim.p50Date,
        p85Date: intervenedSim.p85Date,
        p95Date: intervenedSim.p95Date,
        p50Days: intervenedSim.p50Days,
        p85Days: intervenedSim.p85Days,
        p95Days: intervenedSim.p95Days,
        distributionBuckets: intervenedSim.distributionBuckets
      },
      p50ShiftDays,
      p85ShiftDays,
      p95ShiftDays,
      nodeDeltas
    };
  }

  // src/components/tooltip.ts
  function escapeHtmlText(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function sanitizeHexColor(color, fallback = "#0284C7") {
    const trimmed = String(color ?? "").trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : fallback;
  }
  function formatFriendlyDate(isoDate, includeYear = false) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return escapeHtmlText(String(isoDate ?? "N/A"));
    }
    const [y, m, d] = isoDate.split("-").map(Number);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const monthName = months[(m - 1) % 12] ?? "Nov";
    return includeYear ? `${monthName} ${d}, ${y}` : `${monthName} ${d}`;
  }
  function getInitials(name) {
    if (!name || name.toLowerCase() === "unassigned") return "UA";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  function renderJiraStatusLozenge(status) {
    const safeStatus = String(status || "To Do");
    const lower = safeStatus.toLowerCase();
    if (lower === "done" || lower === "completed") {
      return `<span class="jira-lozenge jira-lozenge-done">DONE</span>`;
    }
    if (lower.includes("risk") || lower.includes("block") || lower === "off track") {
      return `<span class="jira-lozenge jira-lozenge-danger">${escapeHtmlText(safeStatus.toUpperCase())}</span>`;
    }
    if (lower.includes("progress")) {
      return `<span class="jira-lozenge jira-lozenge-inprogress">IN PROGRESS</span>`;
    }
    return `<span class="jira-lozenge jira-lozenge-todo">TO DO</span>`;
  }
  function renderInfoTooltip(title, explanation, mathFormula) {
    return `
    <span class="info-tooltip-wrap" tabindex="0">
      <span class="info-badge" aria-label="More info">?</span>
      <span class="info-popover">
        <strong class="info-popover-title">${escapeHtmlText(title)}</strong>
        <span class="info-popover-body">${escapeHtmlText(explanation)}</span>
        ${mathFormula ? `<code class="info-popover-math">\u{1F4D0} ${escapeHtmlText(mathFormula)}</code>` : ""}
      </span>
    </span>
  `;
  }
  function renderDragHandleBadge(panelId, panelLabel, isDark = false) {
    return `
    <button
      type="button"
      class="panel-drag-handle ${isDark ? "panel-drag-handle-dark" : ""}"
      draggable="true"
      data-drag-panel="${escapeHtmlText(panelId)}"
      title="Drag &amp; Drop to move ${escapeHtmlText(panelLabel)} (or click to swap panel position)"
      aria-label="Drag and drop ${escapeHtmlText(panelLabel)}"
    >
      <svg class="drag-grip-svg" width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
        <circle cx="3.5" cy="3" r="1.35" fill="currentColor" />
        <circle cx="8.5" cy="3" r="1.35" fill="currentColor" />
        <circle cx="3.5" cy="7" r="1.35" fill="currentColor" />
        <circle cx="8.5" cy="7" r="1.35" fill="currentColor" />
        <circle cx="3.5" cy="11" r="1.35" fill="currentColor" />
        <circle cx="8.5" cy="11" r="1.35" fill="currentColor" />
      </svg>
      <span class="drag-grip-arrow">\u21C4</span>
    </button>
  `;
  }

  // src/components/TimelineScrubber.tsx
  function evaluateNodeTemporalState(node, stat, scrubberDayOffset, hasActiveIntervention) {
    const statusLower = node.status.toLowerCase();
    if (scrubberDayOffset === 0) {
      if (statusLower === "done") return "Done";
      if (statusLower === "blocked" || hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 3) {
        return "At Risk / Blocked";
      }
      if (statusLower === "in progress") return "In Progress";
      return "Scheduled";
    }
    if (scrubberDayOffset < 0) {
      const completedAgo = node.completedDaysAgo ?? 14;
      if (statusLower === "done" && scrubberDayOffset >= -completedAgo) {
        return "Done";
      }
      if (statusLower === "done" && scrubberDayOffset >= -(completedAgo + 10)) {
        return "In Progress";
      }
      if (statusLower === "in progress" && scrubberDayOffset >= -7) {
        return "In Progress";
      }
      return "Scheduled";
    }
    if (statusLower === "done") return "Done";
    const p50Start = stat?.p50StartDay ?? 0;
    const p85End = stat?.p85EndDay ?? node.baseEstimateDays;
    const p50End = stat?.p50EndDay ?? node.baseEstimateDays;
    if (scrubberDayOffset >= p85End) {
      return "Done";
    }
    if (scrubberDayOffset >= p50End && scrubberDayOffset < p85End) {
      if ((stat?.rippleDelayDays ?? 0) > 0 || node.uncertaintySigma >= 1.8 || statusLower === "blocked") {
        return "At Risk / Blocked";
      }
      return "In Progress";
    }
    if (scrubberDayOffset >= p50Start) {
      if (statusLower === "blocked" || hasActiveIntervention && (stat?.rippleDelayDays ?? 0) >= 4) {
        return "At Risk / Blocked";
      }
      return "In Progress";
    }
    return "Scheduled";
  }
  function computeFinishOddsOnDay(activeSim, dayOffset) {
    if (dayOffset <= 0) return 0;
    const p50 = Math.max(0.5, activeSim.p50Days);
    const p85 = Math.max(p50 + 0.1, activeSim.p85Days);
    const p95 = Math.max(p85 + 0.1, activeSim.p95Days);
    const cvar = Math.max(p95 + 0.5, activeSim.cvar95Days);
    const firstBucketDay = activeSim.distributionBuckets[0]?.dayOffset ?? 0;
    const startAnchor = firstBucketDay > 1 ? Math.min(p50 * 0.85, firstBucketDay - 1) : 0;
    let odds;
    if (dayOffset <= startAnchor) {
      odds = Math.max(1, dayOffset / Math.max(1, startAnchor) * 2);
    } else if (dayOffset <= p50) {
      const startOdds = startAnchor > 0 ? 2 : 0;
      const span = Math.max(0.1, p50 - startAnchor);
      odds = startOdds + (dayOffset - startAnchor) / span * (50 - startOdds);
    } else if (dayOffset <= p85) {
      odds = 50 + (dayOffset - p50) / (p85 - p50) * 35;
    } else if (dayOffset <= p95) {
      odds = 85 + (dayOffset - p85) / (p95 - p85) * 10;
    } else if (dayOffset <= cvar) {
      odds = 95 + (dayOffset - p95) / (cvar - p95) * 3;
    } else {
      odds = 99;
    }
    return Math.max(1, Math.min(99, Math.round(odds)));
  }
  var HUMAN_EPOCH_LABELS = {
    0: { title: "Sprint -2", badge: "4W AGO" },
    1: { title: "Sprint -1", badge: "2W AGO" },
    2: { title: "Today (Current)", badge: "LIVE" },
    3: { title: "Likely Finish", badge: "50% ODDS" },
    4: { title: "Target Commit Date", badge: "85% SAFE" },
    5: { title: "Safe Buffer Date", badge: "95% CUTOFF" }
  };
  function renderTimelineScrubber(props) {
    const {
      graph,
      activeSim,
      selectedEpochIndex,
      scrubberDayOffset,
      hasActiveIntervention
    } = props;
    const epochs = activeSim.timeMachineEpochs;
    const scrubbedDate = addCalendarDays(graph.referenceDate, scrubberDayOffset);
    let dynamicDone = 0;
    let dynamicInProgress = 0;
    let dynamicAtRisk = 0;
    let dynamicScheduled = 0;
    for (const node of graph.nodes) {
      const stat = activeSim.nodeStats[node.key];
      const tState = evaluateNodeTemporalState(
        node,
        stat,
        scrubberDayOffset,
        hasActiveIntervention
      );
      if (tState === "Done") dynamicDone++;
      else if (tState === "In Progress") dynamicInProgress++;
      else if (tState === "At Risk / Blocked") dynamicAtRisk++;
      else dynamicScheduled++;
    }
    const relativeOffsetLabel = scrubberDayOffset === 0 ? "Today" : scrubberDayOffset > 0 ? `+${scrubberDayOffset} Days` : `${scrubberDayOffset} Days`;
    const viewedFinishOdds = scrubberDayOffset > 0 ? computeFinishOddsOnDay(activeSim, scrubberDayOffset) : null;
    const viewedOddsClass = viewedFinishOdds === null ? "" : viewedFinishOdds >= 80 ? "jira-lozenge-done" : viewedFinishOdds >= 50 ? "jira-lozenge-inprogress" : "jira-lozenge-danger";
    const viewedOddsHtml = viewedFinishOdds !== null ? `<span class="jira-lozenge ${viewedOddsClass}" title="${escapeHtmlText(
      `Target-Date Confidence: ${viewedFinishOdds}% of the 500 simulated project runs finish all issues on or before ${formatFriendlyDate(scrubbedDate, true)}.`
    )}">${viewedFinishOdds}% FINISH ODDS</span>` : "";
    const maxBucketProb = Math.max(
      0.05,
      ...activeSim.distributionBuckets.map((b) => b.probability)
    );
    const reserves = activeSim.reserves;
    const baseTargetDays = reserves?.baseTargetDays ?? activeSim.p50Days;
    const pmBufferDays = reserves?.pmContingencyReserveDays ?? Math.max(0.5, activeSim.p85Days - activeSim.p50Days);
    const execReserveDays = reserves?.managementReserveDays ?? Math.max(0.5, activeSim.cvar95Days - activeSim.p85Days);
    const totalReserveSpan = Math.max(1, baseTargetDays + pmBufferDays + execReserveDays);
    const basePct = Math.max(20, Math.round(baseTargetDays / totalReserveSpan * 100));
    const pmPct = Math.max(10, Math.round(pmBufferDays / totalReserveSpan * 100));
    const execPct = Math.max(8, 100 - basePct - pmPct);
    const buckets = activeSim.distributionBuckets;
    const chartW = 380;
    const chartH = 128;
    const topPad = 20;
    const bottomPad = 22;
    const barAreaH = chartH - topPad - bottomPad;
    const colW = Math.floor((chartW - 16) / Math.max(1, buckets.length));
    const svgConeBars = buckets.map((b, idx, arr) => {
      const ratio = Math.max(0.08, b.probability / maxBucketProb);
      const barH = Math.max(5, Math.round(ratio * barAreaH));
      const x = 8 + idx * colW + 2;
      const y = topPad + (barAreaH - barH);
      const w = Math.max(8, colW - 5);
      const isNearP85 = Math.abs(b.dayOffset - activeSim.p85Days) <= 2.5;
      const isNearP50 = Math.abs(b.dayOffset - activeSim.p50Days) <= 2.5;
      const isNearScrub = Math.abs(b.dayOffset - scrubberDayOffset) <= 2;
      const fillCol = isNearP85 ? "#0C66E4" : b.dayOffset <= activeSim.p50Days ? "#38BDF8" : b.dayOffset <= activeSim.p85Days ? "#2563EB" : "#6366F1";
      const strokeAttr = isNearScrub ? 'stroke="#0F172A" stroke-width="2"' : isNearP85 ? 'stroke="#09326C" stroke-width="1.5"' : "";
      const pctVal = Math.round(b.probability * 100);
      const cumPctVal = Math.round(b.cumulativeProbability * 100);
      const showTopPct = pctVal >= 8 || isNearP85 || isNearP50;
      const topPctText = showTopPct ? `<text x="${x + w / 2}" y="${Math.max(12, y - 5)}" text-anchor="middle" fill="${isNearP85 ? "#0C66E4" : "#334155"}" font-size="10" font-weight="${isNearP85 ? "800" : "600"}">${pctVal}%</text>` : "";
      const showDateLabel = idx === 0 || idx === Math.floor(arr.length * 0.33) || idx === Math.floor(arr.length * 0.66) || idx === arr.length - 1;
      const labelText = showDateLabel ? `<text x="${x + w / 2}" y="${chartH - 5}" text-anchor="middle" fill="#475569" font-size="10" font-weight="600">${escapeHtmlText(formatFriendlyDate(b.date))}</text>` : "";
      const hoverExplanation = `Finish Window: ${formatFriendlyDate(b.date, true)} | Window Likelihood: ${pctVal}% of the 500 simulated runs finished in this date window | Cumulative Confidence: ${cumPctVal}% chance of finishing on or before ${formatFriendlyDate(b.date)}`;
      return `
        <g class="hist-bar-group">
          <rect x="${x}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${fillCol}" ${strokeAttr}>
            <title>${escapeHtmlText(hoverExplanation)}</title>
          </rect>
          ${topPctText}
          ${labelText}
        </g>
      `;
    }).join("");
    const baseP50Tooltip = `Core Work Estimate (${baseTargetDays.toFixed(1)} days, Likely Finish around ${formatFriendlyDate(activeSim.p50Date)}): Typical time needed to finish all planned Jira issues if work proceeds at a normal sprint pace without unexpected blockers (50% odds).`;
    const pmBufferTooltip = `Team Risk Buffer (+${pmBufferDays.toFixed(1)} days, Target Commit Date ${formatFriendlyDate(activeSim.p85Date)}): Extra schedule cushion managed by the Tech Lead / Project Manager for everyday sprint risks (code review wait times, QA bug fixes, minor scope changes). Raises on-time confidence from 50% to 85%.`;
    const execReserveTooltip = `Executive Contingency (+${execReserveDays.toFixed(1)} days, worst-case safe date ${formatFriendlyDate(activeSim.cvar95Date)}): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades, architecture rework, or key-person bottlenecks) to protect the release in the worst 5% of scenarios.`;
    return `
    <section class="time-machine-panel" data-drop-zone="scrubber">
      <!-- Top Full-Width Section: Header, 6-Milestone Stepper & Scrubber Slider -->
      <div class="tm-top-full">
        <div class="tm-header">
          <div class="tm-title">
            ${renderDragHandleBadge("scrubber", "Timeline & Sprint Forecast Scrubber")}
            <span>Timeline &amp; Sprint Forecast Scrubber</span>
            ${renderInfoTooltip(
      "Timeline & Sprint Forecast Scrubber",
      "Click any of the 6 sprint milestones below or drag the timeline slider to preview which Jira issues are expected to be Done, In Progress, or At Risk on that date.",
      `Reference Date: ${graph.referenceDate} | Viewing Offset: ${scrubberDayOffset}d (${scrubbedDate})`
    )}
          </div>

          <div class="tm-header-right">
            <span class="tm-date-pill">
              Viewing: <strong>${formatFriendlyDate(scrubbedDate, true)}</strong>
              <span class="jira-lozenge jira-lozenge-todo">${relativeOffsetLabel}</span>
              ${viewedOddsHtml}
            </span>
            <div class="tm-status-summary">
              <span class="jira-lozenge jira-lozenge-done">${dynamicDone} DONE</span>
              <span class="jira-lozenge jira-lozenge-inprogress">${dynamicInProgress} IN PROGRESS</span>
              <span class="jira-lozenge ${dynamicAtRisk > 0 ? "jira-lozenge-danger" : "jira-lozenge-neutral"}">${dynamicAtRisk} AT RISK</span>
              <span class="jira-lozenge jira-lozenge-todo">${dynamicScheduled} TO DO</span>
            </div>
          </div>
        </div>

        <!-- Full-Width 6-Column Milestone Stepper Row (Zero Overlap) -->
        <div class="epoch-track-grid">
          ${epochs.map((ep, idx) => {
      const meta = HUMAN_EPOCH_LABELS[idx] ?? {
        title: ep.label,
        badge: `${ep.dayOffset >= 0 ? `+${ep.dayOffset}d` : `${ep.dayOffset}d`}`
      };
      const lozClass = idx === 2 ? "jira-lozenge-done" : idx >= 3 ? "jira-lozenge-todo" : "jira-lozenge-neutral";
      return `
                <button
                  class="epoch-node ${idx === selectedEpochIndex ? "active" : ""}"
                  data-epoch-idx="${idx}"
                  title="${escapeHtmlText(ep.narrative)}"
                >
                  <div class="epoch-node-top-row">
                    <span class="jira-lozenge ${lozClass}">${escapeHtmlText(meta.badge)}</span>
                    <span class="epoch-date-str">${formatFriendlyDate(ep.date)}</span>
                  </div>
                  <span class="epoch-node-label">${escapeHtmlText(meta.title)}</span>
                </button>
              `;
    }).join("")}
        </div>

        <!-- Full-Width Scrubber Slider -->
        <div class="tm-slider-wrap">
          <span class="tm-slider-bound">Past (-28d)</span>
          <input
            type="range"
            min="-28"
            max="${Math.max(35, Math.ceil(activeSim.p95Days) + 6)}"
            value="${scrubberDayOffset}"
            class="tm-slider"
            id="time-machine-range"
            title="Drag to scrub across past sprints and future completion dates"
          />
          <span class="tm-slider-bound">Buffer (${formatFriendlyDate(activeSim.p95Date)})</span>
        </div>
      </div>

      <!-- Bottom 2-Column Split: Left = 3-Tier Schedule Buffer Breakdown | Right = Delivery Confidence Distribution -->
      <div class="tm-bottom-split-2col">
        <!-- Left Card: 3-Tier Schedule Buffer Breakdown -->
        <div class="buffer-breakdown-card">
          <div class="buffer-breakdown-header">
            <div class="buffer-breakdown-title">
              <span>3-Tier Schedule Buffer Breakdown</span>
              ${renderInfoTooltip(
      "What are Core Work Estimate, Team Risk Buffer, and Executive Contingency?",
      "\u2022 Core Work Estimate (Likely Finish \u2014 50% odds): Typical time to finish planned work if there are no major surprises (statistical 50th percentile). \u2022 Team Risk Buffer (Target Commit Date \u2014 85% safe): Extra days managed by the Tech Lead / PM for normal engineering risks (code review delays, bug fixes, minor scope changes) to reach a safe commitment date (85th percentile). \u2022 Executive Contingency (Safe Buffer Date \u2014 95%+ cutoff): Leadership reserve held for rare, severe disruptions (cross-team blocker cascades or architecture rework) in the worst 5% of scenarios.",
      `Core Work Estimate = ${baseTargetDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p50Date)}) | Team Risk Buffer = +${pmBufferDays.toFixed(1)}d (${formatFriendlyDate(activeSim.p85Date)}) | Executive Contingency = +${execReserveDays.toFixed(1)}d (${formatFriendlyDate(activeSim.cvar95Date)})`
    )}
            </div>
            <span class="buffer-total-label">Total Horizon: <strong>${Math.round(totalReserveSpan)}d</strong></span>
          </div>

          <svg width="100%" height="10" class="reserve-svg-bar">
            <rect x="0%" y="0" width="${basePct}%" height="10" fill="#0C66E4">
              <title>${escapeHtmlText(baseP50Tooltip)}</title>
            </rect>
            <rect x="${basePct}%" y="0" width="${pmPct}%" height="10" fill="#E2B203">
              <title>${escapeHtmlText(pmBufferTooltip)}</title>
            </rect>
            <rect x="${basePct + pmPct}%" y="0" width="${execPct}%" height="10" fill="#6E5DC6">
              <title>${escapeHtmlText(execReserveTooltip)}</title>
            </rect>
          </svg>

          <div class="buffer-pills-grid">
            <div class="buffer-pill-item" title="${escapeHtmlText(baseP50Tooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-blue"></span>
                <strong>Core Work Estimate (${Math.round(baseTargetDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(pmBufferTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-amber"></span>
                <strong>Team Risk Buffer (+${Math.round(pmBufferDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Target Commit (${formatFriendlyDate(activeSim.p85Date)})</span>
            </div>

            <div class="buffer-pill-item" title="${escapeHtmlText(execReserveTooltip)}">
              <div class="buffer-pill-top">
                <span class="reserve-dot dot-purple"></span>
                <strong>Executive Contingency (+${Math.round(execReserveDays)}d)</strong>
              </div>
              <span class="buffer-pill-desc">Safe Buffer (${formatFriendlyDate(activeSim.cvar95Date)})</span>
            </div>
          </div>
        </div>

        <!-- Right Card: Large, High-Clarity Delivery Confidence Distribution Histogram -->
        <div class="cone-box-wrap">
          <div class="cone-box-header">
            <div class="cone-box-title">
              <span>Delivery Confidence Distribution</span>
              ${renderInfoTooltip(
      "What is Delivery Confidence Distribution?",
      "Shows when your project is most likely to finish across 500 Monte Carlo simulations. \u2022 Bar Height (Window Likelihood): The % of the 500 simulated runs that finished during that specific date window (taller bars = most likely finish dates). \u2022 Cumulative Confidence: The total probability of finishing ON OR BEFORE that date (e.g., Target Commit Date on " + formatFriendlyDate(activeSim.p85Date) + " has 85% confidence).",
      `Likely Finish (50% odds): ${formatFriendlyDate(activeSim.p50Date)} | Target Commit Date (85% safe): ${formatFriendlyDate(activeSim.p85Date)} | Safe Buffer Date (95% cutoff): ${formatFriendlyDate(activeSim.p95Date)}`
    )}
            </div>
            <span class="jira-lozenge jira-lozenge-todo">TARGET: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</span>
          </div>

          <div class="cone-box-subtitle">
            Bar height = % of 500 simulations finishing in each date window \xB7 Hover bars for cumulative on-time confidence
          </div>

          <svg viewBox="0 0 ${chartW} ${chartH}" width="100%" height="${chartH}" class="cone-svg-chart">
            <line x1="8" y1="${topPad}" x2="${chartW - 8}" y2="${topPad}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + Math.round(barAreaH / 2)}" x2="${chartW - 8}" y2="${topPad + Math.round(barAreaH / 2)}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
            <line x1="8" y1="${topPad + barAreaH}" x2="${chartW - 8}" y2="${topPad + barAreaH}" stroke="#CBD5E1" stroke-width="1.2" />
            ${svgConeBars}
          </svg>

          <div class="cone-legend-footer">
            <span><i class="reserve-dot dot-sky"></i>Likely Finish (${formatFriendlyDate(activeSim.p50Date)})</span>
            <span><i class="reserve-dot dot-blue"></i>Target Commit Date (${formatFriendlyDate(activeSim.p85Date)})</span>
            <span><i class="reserve-dot dot-indigo"></i>Safe Buffer Date (${formatFriendlyDate(activeSim.p95Date)})</span>
          </div>
        </div>
      </div>
    </section>
  `;
  }

  // src/components/DagCanvas.tsx
  function resolveNodeShapeKind(node, topBlockerKey, topBlockerSet, isIntervenedOrigin, delayDays) {
    const isDiamondGate = Boolean(node.isStageGate) || Boolean(node.confluenceDecision) || node.issueType?.toLowerCase() === "milestone" || node.issueType?.toLowerCase() === "gate";
    if (isDiamondGate) return "gate";
    const isHexagonBlocker = node.key === topBlockerKey || topBlockerSet.has(node.key) || node.status.toLowerCase() === "blocked" || isIntervenedOrigin && delayDays > 0;
    return isHexagonBlocker ? "blocker" : "task";
  }
  var AVATAR_PALETTE = [
    "#0284C7",
    "#059669",
    "#7C3AED",
    "#D97706",
    "#DB2777",
    "#2563EB"
  ];
  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = hash * 31 + name.charCodeAt(i) | 0;
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  }
  function computeNodeCoordinates(graph) {
    const coords = {};
    const defaultColors = ["#0284C7", "#059669", "#7C3AED", "#D97706", "#DB2777", "#2563EB"];
    const usedTeamNames = Array.from(new Set(graph.nodes.map((n) => n.team)));
    const activeTeams = usedTeamNames.map((tName, idx) => {
      const found = graph.teams.find((t) => t.name === tName);
      return found ?? {
        id: `team-${idx}`,
        name: tName,
        lead: "Project Lead",
        color: tName === "No Team Assigned" ? "#64748B" : defaultColors[idx % defaultColors.length]
      };
    });
    if (activeTeams.length === 0) {
      activeTeams.push({
        id: "team-0",
        name: "No Team Assigned",
        lead: "Project Lead",
        color: "#64748B"
      });
    }
    const laneGroups = /* @__PURE__ */ new Map();
    for (let l = 0; l < activeTeams.length; l++) {
      laneGroups.set(l, []);
    }
    graph.topologicalOrder.forEach((key) => {
      const node = graph.nodes.find((n) => n.key === key);
      if (!node) return;
      let laneIdx = activeTeams.findIndex((t) => t.name === node.team);
      if (laneIdx < 0) {
        laneIdx = 0;
      }
      laneGroups.get(laneIdx).push(key);
    });
    const laneCount = activeTeams.length;
    const laneHeight = laneCount === 1 ? Math.max(456, graph.goals.length > 5 ? graph.goals.length * 76 : 456) : laneCount === 2 ? 228 : 152;
    const svgHeight = laneCount === 1 ? laneHeight + 16 : laneCount <= 3 ? 472 : laneCount * laneHeight + 16;
    const nodeW = 104;
    const nodeH = 104;
    const xStart = 252;
    const xGap = 188;
    let maxCols = 1;
    if (laneCount === 1) {
      const keys = laneGroups.get(0) ?? [];
      if (keys.length >= 4) {
        const subRowY = [82, 234, 386];
        maxCols = Math.ceil(keys.length / 3);
        keys.forEach((key, idx) => {
          const colIdx = Math.floor(idx / 3);
          const subRow = idx % 3;
          coords[key] = {
            x: xStart + colIdx * xGap,
            y: subRowY[subRow],
            laneIndex: 0,
            colIndex: colIdx
          };
        });
      } else {
        maxCols = Math.max(1, keys.length);
        keys.forEach((key, colIdx) => {
          coords[key] = {
            x: xStart + colIdx * xGap,
            y: 234,
            laneIndex: 0,
            colIndex: colIdx
          };
        });
      }
    } else {
      for (const [laneIdx, keys] of laneGroups.entries()) {
        if (keys.length > maxCols) maxCols = keys.length;
        const yTopBand = laneIdx * laneHeight + 6;
        const yBase = yTopBand + Math.round((laneHeight - 8) / 2);
        keys.forEach((key, colIdx) => {
          coords[key] = {
            x: xStart + colIdx * xGap,
            y: yBase,
            laneIndex: laneIdx,
            colIndex: colIdx
          };
        });
      }
    }
    const lastNodeX = xStart + Math.max(0, maxCols - 1) * xGap;
    const goalColX = lastNodeX + 196;
    const svgWidth = Math.max(880, goalColX + 116);
    return {
      coords,
      activeTeams,
      svgHeight,
      svgWidth,
      laneHeight,
      nodeW,
      nodeH,
      goalColX
    };
  }
  function renderDagCanvas(props) {
    const {
      graph,
      activeSim,
      selectedNodeKey,
      delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
      scrubberDayOffset,
      simulatorMode = "issue",
      pinnedNodeOverrides = {},
      selectedAssignee = "",
      assigneeOverrides = {}
    } = props;
    const {
      coords,
      activeTeams,
      svgHeight,
      svgWidth,
      laneHeight,
      goalColX
    } = computeNodeCoordinates(graph);
    const blastSet = new Set(activeSim.blastRadiusNodes);
    const criticalSet = new Set(activeSim.criticalPathNodes);
    const topBlockerKey = activeSim.topBottlenecks[0]?.key ?? "";
    const topBlockerSet = new Set(
      activeSim.topBottlenecks.slice(0, 3).map((b) => b.key)
    );
    const pinnedKeys = Object.keys(pinnedNodeOverrides);
    const hasAssigneeMods = Object.values(assigneeOverrides).some(
      (a) => Number(a.unavailableDays ?? 0) !== 0 || a.reassignBottleneck || a.serializeParallelWork || a.pairOnTopBlocker
    );
    const hasCurrentNodeIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
    const hasActiveIntervention = hasCurrentNodeIntervention || pinnedKeys.length > 0 || hasAssigneeMods;
    const intervenedKey = hasCurrentNodeIntervention ? selectedNodeKey : "";
    const intervenedOriginSet = new Set(pinnedKeys);
    if (intervenedKey) intervenedOriginSet.add(intervenedKey);
    const blockedByMap = /* @__PURE__ */ new Map();
    const blocksMap = /* @__PURE__ */ new Map();
    for (const edge of graph.edges) {
      const incoming = blockedByMap.get(edge.to) ?? [];
      incoming.push(edge.from);
      blockedByMap.set(edge.to, incoming);
      const outgoing = blocksMap.get(edge.from) ?? [];
      outgoing.push(edge.to);
      blocksMap.set(edge.from, outgoing);
    }
    const laneThemes = [
      {
        bandFill: "#FFFFFF",
        bandStroke: "#94A3B8",
        tabFill: "#F1F5F9",
        textFill: "#334155"
      },
      {
        bandFill: "#F8FAFC",
        bandStroke: "#94A3B8",
        tabFill: "#E2E8F0",
        textFill: "#334155"
      },
      {
        bandFill: "#FFFFFF",
        bandStroke: "#94A3B8",
        tabFill: "#F1F5F9",
        textFill: "#334155"
      }
    ];
    const laneBands = activeTeams.map((team, idx) => {
      const yTop = idx * laneHeight + 6;
      const bandH = laneHeight - 8;
      const yMid = yTop + Math.round(bandH / 2);
      const theme = laneThemes[idx % laneThemes.length];
      const teamNodes = graph.nodes.filter((n) => n.team === team.name);
      const doneCount = teamNodes.filter((n) => n.status === "Done").length;
      const activeCount = teamNodes.filter((n) => n.status !== "Done").length;
      const accentColor = sanitizeHexColor(team.color, "#0284C7");
      let nameLine1 = team.name;
      let nameLine2 = "";
      if (team.name.length > 17) {
        const words = team.name.split(/\s+/);
        let acc = "";
        const rest = [];
        for (const w of words) {
          if (rest.length === 0 && ((acc + " " + w).trim().length <= 16 || acc.length === 0)) {
            acc = (acc + " " + w).trim();
          } else {
            rest.push(w);
          }
        }
        nameLine1 = acc;
        nameLine2 = rest.join(" ");
        if (nameLine2.length > 18) {
          nameLine2 = `${nameLine2.slice(0, 17)}\u2026`;
        }
      }
      const leadDisplay = team.lead.length > 16 ? `${team.lead.slice(0, 15)}\u2026` : team.lead;
      const isUnassignedTeam = team.name === "No Team Assigned";
      const laneTooltip = isUnassignedTeam ? `No Jira Teams are configured in project "${graph.projectName}". All ${teamNodes.length} issues (${doneCount} Done, ${activeCount} Active) are shown in a single unified project swimlane. Assign the Jira 'Team' field or add a 'team:<Name>' label on issues in Jira to split into multiple team swimlanes.` : `Team Swimlane: ${team.name} | Lead: ${team.lead} | ${teamNodes.length} Jira issues (${doneCount} Done, ${activeCount} Active).`;
      if (activeTeams.length === 1 && isUnassignedTeam) {
        return `
          <g>
            <title>${escapeHtmlText(laneTooltip)}</title>
            <rect x="10" y="${yTop}" width="${svgWidth - 20}" height="${bandH}" rx="12"
              fill="${theme.bandFill}" stroke="${theme.bandStroke}" stroke-width="1.5" />
            <rect x="10" y="${yTop}" width="168" height="${bandH}" rx="10"
              fill="${theme.tabFill}" stroke="#CBD5E1" stroke-width="1.5" />
            <rect x="10" y="${yTop + 10}" width="4" height="${bandH - 20}" rx="2"
              fill="#64748B" />

            <!-- Crisp horizontal guide lines for the 3-row issue grid inside the unified lane -->
            <line x1="178" y1="158" x2="${svgWidth - 14}" y2="158" stroke="#CBD5E1" stroke-width="1.25" stroke-dasharray="6 6" />
            <line x1="178" y1="310" x2="${svgWidth - 14}" y2="310" stroke="#CBD5E1" stroke-width="1.25" stroke-dasharray="6 6" />

            <circle cx="24" cy="${yMid - 58}" r="3.5" fill="#64748B" />
            <text x="33" y="${yMid - 55}" fill="#64748B" font-size="9.5" font-weight="800" letter-spacing="0.05em">
              JIRA TEAM STATUS
            </text>

            <text x="20" y="${yMid - 32}" fill="#0F172A" font-size="13" font-weight="800">
              No Team Assigned
            </text>
            <text x="20" y="${yMid - 14}" fill="#475569" font-size="10.5" font-weight="600">
              0 teams in ${escapeHtmlText(graph.projectName.length > 14 ? `${graph.projectName.slice(0, 13)}\u2026` : graph.projectName)}
            </text>

            <text x="20" y="${yMid + 7}" fill="#334155" font-size="10.5" font-weight="600">
              Lead: ${escapeHtmlText(leadDisplay)}
            </text>

            <rect x="20" y="${yMid + 18}" width="134" height="22" rx="11"
              fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.25" />
            <text x="87" y="${yMid + 32.5}" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">
              ${teamNodes.length} Issues \xB7 ${doneCount}/${teamNodes.length} Done
            </text>

            <text x="20" y="${yMid + 58}" fill="#64748B" font-size="9.5" font-weight="600">
              Set Jira Team field or
            </text>
            <text x="20" y="${yMid + 72}" fill="#64748B" font-size="9.5" font-weight="600">
              team: label to split rows
            </text>
          </g>
        `;
      }
      return `
        <g>
          <title>${escapeHtmlText(laneTooltip)}</title>
          <rect x="10" y="${yTop}" width="${svgWidth - 20}" height="${bandH}" rx="12"
            fill="${theme.bandFill}" stroke="${theme.bandStroke}" stroke-width="1.5" />
          <rect x="10" y="${yTop}" width="168" height="${bandH}" rx="10"
            fill="${theme.tabFill}" stroke="#CBD5E1" stroke-width="1.5" />
          <rect x="10" y="${yTop + 8}" width="4" height="${bandH - 16}" rx="2"
            fill="${accentColor}" />

          <circle cx="24" cy="${yMid - 36}" r="3.5" fill="${accentColor}" />
          <text x="33" y="${yMid - 33}" fill="#64748B" font-size="9.5" font-weight="800" letter-spacing="0.05em">
            ${isUnassignedTeam ? "UNASSIGNED TEAM" : "TEAM SWIMLANE"}
          </text>

          <text x="20" y="${nameLine2 ? yMid - 15 : yMid - 8}" fill="#0F172A" font-size="12.5" font-weight="800">
            ${escapeHtmlText(nameLine1)}
          </text>
          ${nameLine2 ? `<text x="20" y="${yMid}" fill="#0F172A" font-size="12.5" font-weight="800">${escapeHtmlText(nameLine2)}</text>` : ""}

          <text x="20" y="${yMid + 18}" fill="#475569" font-size="10.5" font-weight="600">
            Lead: ${escapeHtmlText(leadDisplay)}
          </text>

          <rect x="20" y="${yMid + 26}" width="134" height="20" rx="10"
            fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.25" />
          <text x="87" y="${yMid + 39.5}" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">
            ${teamNodes.length} Issues \xB7 ${doneCount}/${teamNodes.length} Done
          </text>
        </g>
      `;
    }).join("");
    const edgeRadiusOffset = 48;
    const edgePaths = graph.edges.map((edge) => {
      const fromPos = coords[edge.from];
      const toPos = coords[edge.to];
      if (!fromPos || !toPos) return "";
      const sameCol = fromPos.colIndex === toPos.colIndex;
      const bypassMiddleRow = sameCol && Math.abs(toPos.y - fromPos.y) > 200;
      const x1 = bypassMiddleRow ? fromPos.x + 44 : sameCol ? fromPos.x : fromPos.x + edgeRadiusOffset;
      const y1 = bypassMiddleRow ? fromPos.y : sameCol ? fromPos.y + (toPos.y > fromPos.y ? edgeRadiusOffset : -edgeRadiusOffset) : fromPos.y;
      const x2 = bypassMiddleRow ? toPos.x + 44 : sameCol ? toPos.x : toPos.x - edgeRadiusOffset;
      const y2 = bypassMiddleRow ? toPos.y : sameCol ? toPos.y + (toPos.y > fromPos.y ? -edgeRadiusOffset : edgeRadiusOffset) : toPos.y;
      const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
      const pathD = bypassMiddleRow ? `M ${x1} ${y1} C ${fromPos.x + 86} ${y1}, ${toPos.x + 86} ${y2}, ${x2} ${y2}` : sameCol ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      const isDecoupledEdge = decoupleBlockingEdges && edge.from === selectedNodeKey || Boolean(pinnedNodeOverrides[edge.from]?.decoupleBlockingEdges);
      const isBlastEdge = hasActiveIntervention && !isDecoupledEdge && (intervenedOriginSet.has(edge.from) || blastSet.has(edge.from)) && blastSet.has(edge.to);
      const isCriticalEdge = criticalSet.has(edge.from) && criticalSet.has(edge.to);
      let edgeClass = "dag-edge";
      let markerId = "url(#arrow-default)";
      if (isDecoupledEdge) {
        edgeClass += " decoupled-edge";
      } else if (isBlastEdge) {
        edgeClass += " blast-edge";
        markerId = "url(#arrow-blast)";
      } else if (isCriticalEdge) {
        edgeClass += " critical-edge";
        markerId = "url(#arrow-critical)";
      }
      const precType = edge.precedenceType ?? "FS";
      const lagDays = edge.lagDays ?? 0;
      const lagSuffix = lagDays > 0 ? ` (+${lagDays}d Lag)` : lagDays < 0 ? ` (${lagDays}d Fast-Track)` : "";
      const edgeTooltip = `${edge.from} ${edge.dependencyType} (${precType}${lagSuffix}) ${edge.to}`;
      return `<g><path d="${pathD}" class="${edgeClass}" marker-end="${markerId}"><title>${escapeHtmlText(edgeTooltip)}</title></path></g>`;
    }).join("");
    const goalsToRender = activeSim.goalImpacts.length > 0 ? activeSim.goalImpacts : graph.goals.map((g) => ({
      goalId: g.id,
      goalKey: g.key,
      goalName: g.name,
      ownerTeam: g.ownerTeam,
      targetDate: g.targetDate,
      p85CompletionDate: g.targetDate,
      probabilityOfOnTime: 0.85,
      status: g.status,
      rippleDelayDays: 0
    }));
    const rightmostByLane = /* @__PURE__ */ new Map();
    for (const [key, pos] of Object.entries(coords)) {
      const prev = rightmostByLane.get(pos.laneIndex);
      if (!prev || pos.x >= prev.x) {
        rightmostByLane.set(pos.laneIndex, { key, x: pos.x, y: pos.y });
      }
    }
    const goalNodesAndEdges = goalsToRender.map((goal, gIdx) => {
      const targetLaneIdx = Math.min(activeTeams.length - 1, gIdx % activeTeams.length);
      const yTopBand = targetLaneIdx * laneHeight + 6;
      const goalY = activeTeams.length === 1 ? goalsToRender.length === 1 ? Math.round(laneHeight / 2) : Math.round((gIdx + 1) / (goalsToRender.length + 1) * laneHeight) + 2 : yTopBand + Math.round((laneHeight - 8) / 2);
      const pillW = 160;
      const pillH = 48;
      const pillLeft = goalColX - pillW / 2;
      const pillTop = goalY - pillH / 2;
      const isMint = gIdx % 2 === 0;
      const pillFill = goal.status === "Off Track" ? "#FFE4E6" : isMint ? "#6EE7B7" : "#6D28D9";
      const pillStroke = goal.status === "Off Track" ? "#E11D48" : isMint ? "#059669" : "#4C1D95";
      const pillTextFill = goal.status === "Off Track" ? "#881337" : isMint ? "#064E3B" : "#FFFFFF";
      const pillSubFill = goal.status === "Off Track" ? "#9F1239" : isMint ? "#065F46" : "#DDD6FE";
      const shortGoalName = goal.goalName.length > 18 ? `${goal.goalName.slice(0, 17)}\u2026` : goal.goalName;
      const sourceNode = rightmostByLane.get(targetLaneIdx);
      let goalEdge = "";
      if (sourceNode) {
        const x1 = sourceNode.x + edgeRadiusOffset;
        const y1 = sourceNode.y;
        const x2 = pillLeft;
        const y2 = goalY;
        const dx = Math.max(28, (x2 - x1) * 0.45);
        goalEdge = `<path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" class="dag-edge" marker-end="url(#arrow-default)" />`;
      }
      return `
        <g>
          ${goalEdge}
          <g transform="translate(${pillLeft}, ${pillTop})">
            <rect width="${pillW}" height="${pillH}" rx="24" fill="${pillFill}" stroke="${pillStroke}" stroke-width="2" />
            <text x="${pillW / 2}" y="20" text-anchor="middle" fill="${pillTextFill}" font-size="11.5" font-weight="800">
              ${escapeHtmlText(shortGoalName)}
            </text>
            <text x="${pillW / 2}" y="35" text-anchor="middle" fill="${pillSubFill}" font-size="9.5" font-weight="700">
              Target: ${formatFriendlyDate(goal.p85CompletionDate)} \xB7 ${Math.round(goal.probabilityOfOnTime * 100)}% on time
            </text>
          </g>
        </g>
      `;
    }).join("");
    const nodeElements = graph.nodes.map((node) => {
      const pos = coords[node.key];
      if (!pos) return "";
      const stat = activeSim.nodeStats[node.key];
      const isSelected = node.key === selectedNodeKey;
      const pinIndex = pinnedKeys.indexOf(node.key);
      const nodePinOv = pinnedNodeOverrides[node.key];
      const isIntervenedOrigin = intervenedKey === node.key || Boolean(nodePinOv);
      const isPersonHighlighted = simulatorMode === "person" && Boolean(selectedAssignee) && node.assignee === selectedAssignee;
      const isInBlast = hasActiveIntervention && blastSet.has(node.key);
      const isCritical = criticalSet.has(node.key);
      const temporalState = evaluateNodeTemporalState(
        node,
        stat,
        scrubberDayOffset,
        hasActiveIntervention
      );
      let groupClass = "dag-node-group";
      if (isCritical) groupClass += " critical-node";
      if (isInBlast) groupClass += " in-blast-radius";
      if (isSelected) groupClass += " selected";
      if (isIntervenedOrigin) groupClass += " intervened-origin";
      if (isPersonHighlighted) groupClass += " person-highlighted";
      const totalSub = node.subtaskTotalCount ?? Math.max(3, Math.min(8, Math.round(node.baseEstimateDays)));
      let doneSub = node.subtaskDoneCount ?? 0;
      let progPct = node.subtaskProgressPct ?? stat?.completionStepPct ?? 0;
      if (temporalState === "Done") {
        doneSub = totalSub;
        progPct = 100;
      } else if (temporalState === "In Progress" && progPct === 0) {
        doneSub = Math.max(1, Math.round(totalSub * 0.67));
        progPct = Math.round(doneSub / totalSub * 100);
      } else if (temporalState === "At Risk / Blocked" && progPct === 0) {
        doneSub = Math.max(1, Math.round(totalSub * 0.4));
        progPct = Math.round(doneSub / totalSub * 100);
      } else if (doneSub === 0 && progPct > 0 && totalSub > 1) {
        doneSub = Math.min(totalSub - 1, Math.max(1, Math.round(progPct / 100 * totalSub)));
      }
      const avatarInitials = getInitials(node.assignee);
      const avatarBg = getAvatarColor(node.assignee);
      const rippleShift = stat?.rippleDelayDays ?? 0;
      const goalObj = graph.goals.find((g) => g.id === node.goalId);
      const shapeKind = resolveNodeShapeKind(
        node,
        topBlockerKey,
        topBlockerSet,
        isIntervenedOrigin,
        delayDays
      );
      const isDiamondGate = shapeKind === "gate";
      const isHexagonBlocker = shapeKind === "blocker";
      const shapeType = isDiamondGate ? "Gate" : isHexagonBlocker ? "Blocker" : "Task";
      const hoverStateLabel = temporalState === "At Risk / Blocked" ? "Blocked" : temporalState;
      const blockedByKeys = blockedByMap.get(node.key) ?? [];
      const blocksKeys = blocksMap.get(node.key) ?? [];
      const hoverJson = JSON.stringify({
        key: node.key,
        summary: node.summary,
        team: node.team,
        assignee: node.assignee,
        status: `${hoverStateLabel} \xB7 ${shapeType}`,
        estimateDays: node.baseEstimateDays,
        sigma: node.uncertaintySigma,
        pertMean: stat?.pertMeanDays ?? node.baseEstimateDays,
        pertSigma: stat?.pertSigmaDays ?? node.uncertaintySigma,
        completionStepPct: progPct,
        subtaskLabel: `${doneSub}/${totalSub} Sub-tasks (${progPct}%)`,
        totalFloatDays: stat?.totalFloatDays ?? 0,
        isStageGate: isDiamondGate,
        goalName: goalObj?.name ?? node.goalId,
        p85Date: stat ? formatFriendlyDate(stat.p85Date, true) : "N/A",
        rippleShift,
        criticalityPct: Math.round((stat?.criticalityIndex ?? 0) * 100),
        blockedByKeys,
        blocksKeys,
        adr: node.confluenceDecision ? `${node.confluenceDecision.title} (${node.confluenceDecision.spaceKey})` : ""
      });
      const circledNums = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469"];
      const effectiveBadgeOv = isSelected && hasCurrentNodeIntervention ? { deltaDays: delayDays, addDeveloper, decoupleBlockingEdges, trimScope } : nodePinOv ?? null;
      let shiftBadge = "";
      if (effectiveBadgeOv) {
        const badgePrefix = pinIndex >= 0 ? `${circledNums[pinIndex] ?? `#${pinIndex + 1}`} ` : "";
        const labelText = effectiveBadgeOv.deltaDays > 0 ? `${badgePrefix}+${effectiveBadgeOv.deltaDays}d Delay` : effectiveBadgeOv.deltaDays < 0 ? `${badgePrefix}${effectiveBadgeOv.deltaDays}d Faster` : effectiveBadgeOv.addDeveloper ? `${badgePrefix}+1 Dev` : effectiveBadgeOv.decoupleBlockingEdges ? `${badgePrefix}Decoupled` : `${badgePrefix}Scope MVP`;
        const pillFill = pinIndex >= 0 ? "#6D28D9" : "#0C66E4";
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-38" y="0" width="76" height="16" rx="8" fill="${pillFill}" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              ${escapeHtmlText(labelText)}
            </text>
          </g>
        `;
      } else if (isPersonHighlighted) {
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-32" y="0" width="64" height="16" rx="8" fill="#0284C7" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              \u{1F464} ${escapeHtmlText(avatarInitials)}
            </text>
          </g>
        `;
      } else if (isInBlast && Math.abs(rippleShift) > 0) {
        const signText = rippleShift > 0 ? `+${rippleShift.toFixed(1)}d Slip` : `${rippleShift.toFixed(1)}d`;
        const fillCol = rippleShift > 0 ? "#E11D48" : "#059669";
        shiftBadge = `
          <g transform="translate(0, -56)">
            <rect x="-32" y="0" width="64" height="16" rx="8" fill="${fillCol}" />
            <text x="0" y="11.5" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="800">
              ${signText}
            </text>
          </g>
        `;
      }
      if (isDiamondGate) {
        const shortGateTitle = node.summary.length > 14 ? `${node.summary.slice(0, 13)}\u2026` : node.summary;
        const diamondStroke = isSelected ? "#0C66E4" : "#5B21B6";
        return `
          <g
            class="${groupClass}"
            data-node-key="${escapeHtmlText(node.key)}"
            data-node-x="${pos.x}"
            data-node-hover="${escapeHtmlText(hoverJson)}"
            transform="translate(${pos.x}, ${pos.y})"
          >
            ${isSelected || isPersonHighlighted || pinIndex >= 0 ? `<polygon points="0,-54 54,0 0,54 -54,0" fill="none" stroke="${pinIndex >= 0 ? "#6D28D9" : isPersonHighlighted ? "#0284C7" : "#0C66E4"}" stroke-width="3" stroke-dasharray="${isPersonHighlighted && !isSelected ? "5 3" : "4 3"}" />` : ""}
            <polygon points="0,-48 48,0 0,48 -48,0" fill="#7C3AED" stroke="${diamondStroke}" stroke-width="2.5" stroke-linejoin="round" />
            <!-- Top small diamond badge -->
            <polygon points="0,-34 7,-27 0,-20 -7,-27" fill="#EDE9FE" />
            <polygon points="0,-30 3.5,-27 0,-24 -3.5,-27" fill="#6D28D9" />
            <!-- Gate label -->
            <text x="0" y="-8" text-anchor="middle" fill="#FFFFFF" font-size="10.5" font-weight="800">
              Gate: ${escapeHtmlText(node.key)}
            </text>
            <text x="0" y="5" text-anchor="middle" fill="#EDE9FE" font-size="9" font-weight="600">
              ${escapeHtmlText(shortGateTitle)}
            </text>
            <!-- Responsible Lead Avatar Circle -->
            <circle cx="0" cy="21" r="11.5" fill="${avatarBg}" stroke="#FFFFFF" stroke-width="1.8" />
            <text x="0" y="25" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="800">
              ${escapeHtmlText(avatarInitials)}
            </text>
            <circle cx="8" cy="29" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />
            ${shiftBadge}
          </g>
        `;
      }
      if (isHexagonBlocker) {
        const shortHexTitle = node.summary.length > 15 ? `${node.summary.slice(0, 14)}\u2026` : node.summary;
        const hexPerim = 248;
        const hexFilled = Math.max(
          28,
          Math.round(Math.max(15, progPct) / 100 * hexPerim)
        );
        return `
          <g
            class="${groupClass}"
            data-node-key="${escapeHtmlText(node.key)}"
            data-node-x="${pos.x}"
            data-node-hover="${escapeHtmlText(hoverJson)}"
            transform="translate(${pos.x}, ${pos.y})"
          >
            ${isSelected || isPersonHighlighted || pinIndex >= 0 ? `<polygon points="0,-54 47,-27 47,27 0,54 -47,27 -47,-27" fill="none" stroke="${pinIndex >= 0 ? "#6D28D9" : isPersonHighlighted ? "#0284C7" : "#0C66E4"}" stroke-width="3" ${isPersonHighlighted && !isSelected ? 'stroke-dasharray="5 3"' : ""} />` : ""}
            <!-- Outer Coral-Red Blocker Hexagon -->
            <polygon points="0,-48 42,-24 42,24 0,48 -42,24 -42,-24" fill="#EF4444" stroke="#B91C1C" stroke-width="2.5" stroke-linejoin="round" />
            <!-- Inner Progress Shield -->
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="#DC2626" stroke="#FCA5A5" stroke-width="1.5" stroke-linejoin="round" />
            <polygon points="0,-42 36,-21 36,21 0,42 -36,21 -36,-21" fill="none" stroke="#FDE047" stroke-width="3" stroke-dasharray="${hexFilled} ${hexPerim}" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Warning Triangle Icon -->
            <polygon points="0,-35 7,-23 -7,-23" fill="#FEF08A" />
            <text x="0" y="-24.5" text-anchor="middle" fill="#991B1B" font-size="9" font-weight="900">!</text>

            <!-- Issue Key & Short Summary -->
            <text x="0" y="-10" text-anchor="middle" fill="#FFFFFF" font-size="11.5" font-weight="800">
              ${escapeHtmlText(node.key)}
            </text>
            <text x="0" y="2" text-anchor="middle" fill="#FFE4E6" font-size="9.2" font-weight="600">
              ${escapeHtmlText(shortHexTitle)}
            </text>

            <!-- Responsible Assignee Avatar Circle -->
            <circle cx="0" cy="19" r="12" fill="#FECDD3" stroke="#FFFFFF" stroke-width="1.8" />
            <text x="0" y="23" text-anchor="middle" fill="#881337" font-size="10" font-weight="800">
              ${escapeHtmlText(avatarInitials)}
            </text>
            <circle cx="9" cy="27" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />
            ${shiftBadge}
          </g>
        `;
      }
      const radius = 44;
      const circumference = Number((2 * Math.PI * radius).toFixed(1));
      const visualPct = Math.max(18, progPct);
      const arcFilled = Number((visualPct / 100 * circumference).toFixed(1));
      const isHighRiskCircle = isInBlast && rippleShift > 0;
      const innerFill = isHighRiskCircle ? "#FFF1F2" : "#FFFFFF";
      const baseRingColor = temporalState === "Done" ? "#10B981" : isSelected ? "#0C66E4" : isCritical ? "#F59E0B" : "#0284C7";
      const progressArcColor = temporalState === "Done" ? "#059669" : isHighRiskCircle ? "#E11D48" : "#10B981";
      return `
        <g
          class="${groupClass}"
          data-node-key="${escapeHtmlText(node.key)}"
          data-node-x="${pos.x}"
          data-node-hover="${escapeHtmlText(hoverJson)}"
          transform="translate(${pos.x}, ${pos.y})"
        >
          ${isSelected || isHighRiskCircle || isPersonHighlighted || pinIndex >= 0 ? `<circle r="50" fill="none" stroke="${pinIndex >= 0 ? "#6D28D9" : isPersonHighlighted ? "#0284C7" : isSelected ? "#0C66E4" : "#FB923C"}" stroke-width="${pinIndex >= 0 || isPersonHighlighted ? "3" : "2.5"}" ${isPersonHighlighted && !isSelected ? 'stroke-dasharray="5 3"' : ""} opacity="0.8" />` : ""}
          <!-- Base Circle Track -->
          <circle r="${radius}" fill="${innerFill}" stroke="${baseRingColor}" stroke-width="6" />
          <!-- Sub-task / Epic Completion Progress Arc (Rotated from Top) -->
          <circle r="${radius}" fill="none" stroke="${progressArcColor}" stroke-width="6"
            stroke-dasharray="${arcFilled} ${circumference}" stroke-linecap="round"
            transform="rotate(-90)" />

          <!-- Sub-task Fraction & Completion % -->
          <text x="0" y="-19" text-anchor="middle" fill="#0F172A" font-size="12.5" font-weight="800">
            ${doneSub}/${totalSub}
          </text>
          <text x="0" y="-7" text-anchor="middle" fill="#334155" font-size="9.5" font-weight="700">
            Sub-tasks \xB7 ${progPct}%
          </text>

          <!-- Responsible Assignee Avatar Circle -->
          <circle cx="0" cy="10" r="12" fill="${avatarBg}" stroke="#FFFFFF" stroke-width="1.8" />
          <text x="0" y="14" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="800">
            ${escapeHtmlText(avatarInitials)}
          </text>
          <circle cx="9" cy="18" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" />

          <!-- Bottom Jira Issue Key Pill -->
          <g transform="translate(-34, 24)">
            <rect width="68" height="17" rx="8.5" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.3" />
            <polygon points="10,5 14,8.5 10,12 6,8.5" fill="#0284C7" />
            <text x="38" y="12" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="800">
              ${escapeHtmlText(node.key)}
            </text>
          </g>

          ${shiftBadge}
        </g>
      `;
    }).join("");
    const nodeByKey = new Map(graph.nodes.map((n) => [n.key, n]));
    const orderedJumpNodes = [];
    const seenKeys = /* @__PURE__ */ new Set();
    for (const k of graph.topologicalOrder) {
      const found = nodeByKey.get(k);
      if (found && !seenKeys.has(found.key)) {
        orderedJumpNodes.push(found);
        seenKeys.add(found.key);
      }
    }
    for (const n of graph.nodes) {
      if (!seenKeys.has(n.key)) {
        orderedJumpNodes.push(n);
        seenKeys.add(n.key);
      }
    }
    const jumpOptionsHtml = orderedJumpNodes.map((n) => {
      const sKind = resolveNodeShapeKind(
        n,
        topBlockerKey,
        topBlockerSet,
        intervenedKey === n.key,
        delayDays
      );
      const shapeGlyph = sKind === "gate" ? "\u25C6" : sKind === "blocker" ? "\u2B22" : "\u25CF";
      const shortSum = n.summary.length > 22 ? `${n.summary.slice(0, 21)}\u2026` : n.summary;
      return `<option value="${escapeHtmlText(n.key)}" ${n.key === selectedNodeKey ? "selected" : ""}>${shapeGlyph} ${escapeHtmlText(n.key)} \xB7 ${escapeHtmlText(shortSum)}</option>`;
    }).join("");
    return `
    <div class="panel-card dag-panel-card" data-drop-zone="dag">
      <div class="panel-header">
        <div class="panel-title">
          ${renderDragHandleBadge("dag", "Issue Dependency Map")}
          <span class="stage-heading-title">Issue Dependency Map (${escapeHtmlText(graph.projectName)})</span>
          ${renderInfoTooltip(
      "Issue Dependency Map & Jira Team Swimlanes",
      'Swimlanes reflect real Jira Teams configured on your issues (via the Jira Team field or team:<Name> labels). If your Jira project has no teams configured, all issues are shown inside a single unified "No Team Assigned" swimlane without inventing fake teams. \u25CF Circle = Task / Epic | \u2B22 Hexagon = Critical Path Blocker | \u25C6 Diamond = Stage Gate | \u25AC Pill = Teamwork Graph Goal.',
      `Active Swimlanes (${activeTeams.length}): ${activeTeams.map((t) => t.name).join(" \xB7 ")}`
    )}
        </div>
        <div class="dag-header-controls">
          <div class="dag-legend">
            <span class="legend-item"><span class="shape-badge-circle">\u25CF</span> Task / Epic</span>
            <span class="legend-item"><span class="shape-badge-hex">\u2B22</span> Blocker</span>
            <span class="legend-item"><span class="shape-badge-diamond">\u25C6</span> Gate</span>
            <span class="legend-item"><span class="shape-badge-pill">\u25AC</span> Goal</span>
          </div>
          <div class="dag-pan-buttons">
            <button class="dag-pan-btn" id="btn-dag-pan-left" title="Scroll dependency map left">\u25C0</button>
            <select id="dag-issue-jump-select" class="dag-issue-jump-select" title="Jump directly to any issue in the Dependency Map (or press [ and ] keys)" aria-label="Jump to Jira issue">${jumpOptionsHtml}</select>
            <button class="dag-pan-btn" id="btn-dag-center-selected" title="Center map on selected issue (${escapeHtmlText(selectedNodeKey)})">\u{1F3AF}</button>
            <button class="dag-pan-btn" id="btn-dag-pan-right" title="Scroll dependency map right">\u25B6</button>
          </div>
        </div>
      </div>

      <!-- Floating Hover Inspector Card (Pinned in top-right of Dependency Map) -->
      <div id="dag-node-hover-card" class="dag-hover-card"></div>

      <div class="dag-viewport" id="dag-viewport-container">
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="dag-svg" id="pwm-dag-svg">
          <defs>
            <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#64748B" />
            </marker>
            <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#EA580C" />
            </marker>
            <marker id="arrow-blast" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill="#E11D48" />
            </marker>
          </defs>
          ${laneBands}
          ${edgePaths}
          ${goalNodesAndEdges}
          ${nodeElements}
        </svg>
      </div>
    </div>
  `;
  }

  // src/components/HeaderBar.tsx
  function renderArchGaugeSvg(ratio, strokeColor, trackColor = "#334155") {
    const clamped = Math.max(0.06, Math.min(1, ratio));
    const arcLen = 131.95;
    const filled = Number((clamped * arcLen).toFixed(1));
    return `
    <svg class="rail-arch-svg" width="112" height="64" viewBox="0 0 112 64" aria-hidden="true">
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${trackColor}" stroke-width="8" stroke-linecap="round" />
      <path d="M 14 56 A 42 42 0 0 1 98 56" fill="none" stroke="${strokeColor}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${filled} ${arcLen}" />
    </svg>
  `;
  }
  function renderTopAppBar(props) {
    const {
      availableProjects,
      graph,
      activeSim,
      delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      hasAnyIntervention,
      statusBanner
    } = props;
    const hasActiveIntervention = Boolean(hasAnyIntervention) || delayDays !== 0 || addDeveloper || decoupleBlockingEdges;
    const topBlocker = activeSim.topBottlenecks[0];
    const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? "N/A";
    const projectList = availableProjects.length > 0 ? [...availableProjects] : [
      {
        id: graph.projectKey,
        key: graph.projectKey,
        name: graph.projectName
      }
    ];
    const hasCurrentInList = projectList.some((p) => p.key === graph.projectKey);
    if (!hasCurrentInList) {
      projectList.unshift({
        id: graph.projectKey,
        key: graph.projectKey,
        name: graph.projectName
      });
    }
    return `
    <header class="cockpit-header">
      <div class="brand-cluster">
        <div class="jira-project-avatar" title="${escapeHtmlText(graph.projectName)} (${escapeHtmlText(graph.projectKey)})">
          ${escapeHtmlText(graph.projectKey.slice(0, 3))}
        </div>
        <div class="brand-titles">
          <div class="jira-breadcrumbs">
            <span>Spaces</span>
            <span class="crumb-sep">/</span>
            <select id="jira-project-select" class="jira-project-select" title="Switch active Jira project">
              ${projectList.map(
      (p) => `
                  <option value="${escapeHtmlText(p.key)}" ${p.key === graph.projectKey ? "selected" : ""}>
                    ${escapeHtmlText(p.name)} (${escapeHtmlText(p.key)})
                  </option>
                `
    ).join("")}
            </select>
            <span class="crumb-sep">/</span>
            <span class="crumb-current">Rovo-World-Model</span>
            <span class="jira-lozenge jira-lozenge-todo">
              ${graph.nodes.length} ${graph.nodes.length === 1 ? "ISSUE" : "ISSUES"}
            </span>
            <span class="jira-lozenge jira-lozenge-goal">TEAMWORK GRAPH</span>
            <span class="status-latency-pill" title="500 Monte Carlo futures computed in ${activeSim.executionTimeMs} ms">
              500 runs \xB7 ${activeSim.executionTimeMs} ms
            </span>
            ${renderInfoTooltip(
      "Rovo-World-Model Digital Twin",
      "Automatically loads issues, sub-tasks, and dependencies from your selected Jira project and runs 500 Monte Carlo simulations to forecast delivery dates and goal risks.",
      `Active Project: ${escapeHtmlText(graph.projectKey)} (${graph.nodes.length} nodes, ${graph.edges.length} links) | Latency: ${activeSim.executionTimeMs} ms`
    )}
            ${statusBanner ? `<span class="header-status-inline" title="${escapeHtmlText(statusBanner)}">
                     <span class="status-dot"></span>
                     <span class="header-status-text">${escapeHtmlText(statusBanner)}</span>
                   </span>` : ""}
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" id="btn-sync-jira" title="Refresh live issues and dependency links from Jira">
          \u21BB Sync Jira Project
        </button>
        ${graph.isSyntheticDemo || graph.nodes.length === 0 ? `<button class="btn" id="btn-create-jira-issues" title="Populate sample linked Jira issues into this project">
                 + Add Sample Issues
               </button>` : ""}
        <button class="btn" id="btn-jump-bottleneck" title="Select the #1 critical path blocker issue">
          \u{1F3AF} Focus Blocker (${escapeHtmlText(topBlockerKey)})
        </button>
        ${props.isCustomLayout ? `<button class="btn" id="btn-reset-layout" title="Restore default panel positions">
                 \u21C4 Reset Layout
               </button>` : ""}
        <button class="btn ${hasActiveIntervention ? "btn-danger-outline" : ""}" id="btn-reset-sim" title="Reset What-If simulation back to baseline">
          Reset
        </button>
      </div>
    </header>
  `;
  }
  function renderLeftStatusRail(props) {
    const { graph, baselineSim, activeSim, intervention } = props;
    const p85Shift = intervention ? intervention.p85ShiftDays : 0;
    const topBlocker = activeSim.topBottlenecks[0];
    const topBlockerKey = topBlocker?.key ?? graph.nodes[0]?.key ?? "N/A";
    const superCriticalCount = activeSim.superCriticalNodes?.length ?? 0;
    const evm = activeSim.earnedValue;
    const baseOnTimePct = activeSim.goalImpacts.length > 0 ? Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Math.min(
            ...activeSim.goalImpacts.map((g) => g.probabilityOfOnTime)
          ) * 100
        )
      )
    ) : p85Shift > 0 ? Math.max(20, Math.round(85 - p85Shift * 3.2)) : p85Shift < 0 ? Math.min(98, Math.round(85 + Math.abs(p85Shift) * 2.5)) : 85;
    const gauge1Color = baseOnTimePct >= 75 ? "#10B981" : baseOnTimePct >= 50 ? "#F59E0B" : "#F43F5E";
    const gauge1TextClass = baseOnTimePct >= 75 ? "text-emerald-light" : baseOnTimePct >= 50 ? "text-amber-light" : "text-coral-light";
    const slipDisplay = p85Shift > 0 ? `+${p85Shift.toFixed(1)}d` : p85Shift < 0 ? `${p85Shift.toFixed(1)}d` : `\xB1${Math.max(1, Math.round(activeSim.p85Days - activeSim.p50Days))}d`;
    const slipRatio = p85Shift > 0 ? Math.min(1, 0.35 + p85Shift / 25) : p85Shift < 0 ? 0.28 : 0.45;
    const gauge2Color = p85Shift > 0 ? "#F59E0B" : p85Shift < 0 ? "#10B981" : "#FBBF24";
    const blockerCount = activeSim.criticalPathNodes.length;
    const blockerRatio = Math.min(
      1,
      Math.max(0.2, blockerCount / Math.max(1, graph.nodes.length))
    );
    return `
    <aside class="left-status-rail" data-drop-zone="left-rail">
      <div class="rail-header">
        <div class="rail-title-row">
          <div class="rail-title-left">
            ${renderDragHandleBadge("left-rail", "Project Status", true)}
            <span class="rail-title">Project Status</span>
          </div>
          <span class="rail-subtitle-badge">${escapeHtmlText(graph.projectKey)}</span>
        </div>
        <div class="rail-caption">${escapeHtmlText(graph.projectName)} \xB7 ${graph.nodes.length} Issues</div>
      </div>

      <div class="rail-gauges-stack">
        <!-- Gauge 1: On-Time Probability -->
        <div class="rail-gauge-card" title="85% Confidence Target Commit Date: ${escapeHtmlText(activeSim.p85Date)} (Baseline: ${escapeHtmlText(baselineSim.p85Date)})">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(baseOnTimePct / 100, gauge1Color)}
            <div class="rail-gauge-value ${gauge1TextClass}">
              ${baseOnTimePct}%
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>On-Time Probability</span>
            ${renderInfoTooltip(
      "On-Time Delivery Confidence",
      "Probability of meeting your Target Commit Date across 500 simulated project runs.",
      `Target Commit Date = ${activeSim.p85Date} | Baseline Target = ${baselineSim.p85Date}`
    )}
          </div>
          <div class="rail-gauge-sub">
            CPI <strong>${(evm?.cpi ?? 1).toFixed(2)}</strong> \xB7 SPI <strong>${(evm?.spi ?? 1).toFixed(2)}</strong>
          </div>
        </div>

        <!-- Gauge 2: Schedule Slip / Spread -->
        <div class="rail-gauge-card" title="Schedule shift relative to baseline Target Commit Date">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(slipRatio, gauge2Color)}
            <div class="rail-gauge-value text-amber-light">
              ${slipDisplay}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>${p85Shift !== 0 ? "Schedule Slip" : "Forecast Spread"}</span>
            ${renderInfoTooltip(
      "Schedule Slip & Safety Buffer Spread",
      "Shows net schedule shift from active What-If changes, or the team risk buffer between Likely Finish and Target Commit Date.",
      `Likely Finish = ${activeSim.p50Date} | Target Commit = ${activeSim.p85Date} | Safe Buffer = ${activeSim.p95Date}`
    )}
          </div>
          <div class="rail-gauge-sub">
            Window: <strong>${formatFriendlyDate(activeSim.p50Date)} \u2013 ${formatFriendlyDate(activeSim.p95Date)}</strong>
          </div>
        </div>

        <!-- Gauge 3: Blocker Float -->
        <div class="rail-gauge-card" title="Critical path blockers and negative float issues">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(blockerRatio, "#F43F5E")}
            <div class="rail-gauge-value text-coral-light">
              ${blockerCount}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Blocker Float (${escapeHtmlText(topBlockerKey)})</span>
            ${renderInfoTooltip(
      "Critical Path Blockers & Float",
      "Issues on the critical path with zero or negative total float that directly gate release completion.",
      `Critical Path: ${blockerCount} issues | Negative Float: ${superCriticalCount} issues | Top: ${topBlockerKey}`
    )}
          </div>
          <div class="rail-gauge-sub">
            <strong>${escapeHtmlText(topBlockerKey)}</strong> gates <strong>${topBlocker?.downstreamCount ?? 1} issues</strong>
          </div>
        </div>

        <!-- Gauge 4: Target Commit Date -->
        <div class="rail-gauge-card" title="Target Commit Date (85% safe): ${escapeHtmlText(activeSim.p85Date)}">
          <div class="rail-gauge-visual">
            ${renderArchGaugeSvg(0.85, "#8B5CF6")}
            <div class="rail-gauge-value text-violet-light">
              ${formatFriendlyDate(activeSim.p85Date)}
            </div>
          </div>
          <div class="rail-gauge-label">
            <span>Target Commit</span>
            ${renderInfoTooltip(
      "Target Commit Date (85% Safe)",
      "Recommended release commitment date for stakeholders: 85% of the 500 simulated project runs finish on or before this date (statistical 85th percentile).",
      `Target Commit Date: ${activeSim.p85Date} (+${activeSim.p85Days}d from reference date)`
    )}
          </div>
          <div class="rail-gauge-sub">
            Base: <strong>${formatFriendlyDate(baselineSim.p85Date)}</strong>
          </div>
        </div>
      </div>

      <!-- Hierarchical Jira Teamwork Graph Goals Tree -->
      <div class="rail-goals-card">
        <div class="rail-goals-header">
          <span>Jira Teamwork Graph Goals</span>
          ${renderInfoTooltip(
      "Atlassian Teamwork Graph Goals",
      "Live release milestones and OKRs connected to your Jira issues via the Atlassian Teamwork Graph.",
      `Linked Goals: ${activeSim.goalImpacts.length} | Recovery Effort Score: ${activeSim.quasimetricEnergy}`
    )}
        </div>
        <div class="rail-goals-tree">
          ${activeSim.goalImpacts.map((goal, idx) => {
      const probPct = Math.round(goal.probabilityOfOnTime * 100);
      const dotClass = goal.status === "Off Track" ? "tree-dot-coral" : goal.status === "At Risk" ? "tree-dot-amber" : "tree-dot-green";
      const barColor = goal.status === "Off Track" ? "#F43F5E" : goal.status === "At Risk" ? "#F59E0B" : "#10B981";
      return `
                <div class="rail-goal-item" title="${escapeHtmlText(goal.goalName)} \xB7 Owner: ${escapeHtmlText(goal.ownerTeam)} | Target: ${formatFriendlyDate(goal.targetDate, true)} | Target Commit Date (85% safe): ${formatFriendlyDate(goal.p85CompletionDate, true)} (${probPct}% on time)">
                  <div class="rail-goal-top">
                    <span class="tree-dot ${dotClass}"></span>
                    <span class="rail-goal-name">${escapeHtmlText(goal.goalName)}</span>
                    <span class="jira-lozenge lozenge-violet">${probPct}%</span>
                  </div>
                  <div class="rail-goal-meta">
                    <span>Target: <strong>${formatFriendlyDate(goal.targetDate)}</strong></span>
                    <span>Commit: <strong>${formatFriendlyDate(goal.p85CompletionDate)}</strong> \xB7 ${escapeHtmlText(goal.status)}</span>
                  </div>
                  <svg class="rail-goal-bar-svg" width="100%" height="5" viewBox="0 0 100 5" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="5" rx="2.5" fill="#1E293B" />
                    <rect x="0" y="0" width="${Math.max(6, probPct)}" height="5" rx="2.5" fill="${barColor}" />
                  </svg>
                </div>
              `;
    }).join("")}
        </div>
      </div>
    </aside>
  `;
  }

  // ../../src/mcp/manifest.ts
  var PROJECT_KEY_DESCRIPTION = "Optional Jira project key (defaults to active live Jira project, or Project Chronos fallback when empty/offline)";
  var SIMULATE_INTERVENTION_INPUT_SCHEMA = {
    type: "object",
    properties: {
      issueKey: {
        type: "string",
        description: "Optional Jira issue key to intervene on (defaults to top critical-path bottleneck or assignee blocker)"
      },
      delayDays: {
        type: "number",
        description: "Signed counterfactual shift in days (-5 to +60; defaults to 0 when mitigations/overrides are set, else 7)"
      },
      addDeveloper: {
        type: "boolean",
        description: "Simulate adding a developer (+1 resource swarm)"
      },
      decoupleBlockingEdges: {
        type: "boolean",
        description: "Simulate decoupling hard blocking outgoing edges"
      },
      trimScope: {
        type: "boolean",
        description: "Simulate trimming or deferring non-essential sub-tasks to the next cycle (-35% duration, -45% uncertainty)"
      },
      assigneeName: {
        type: "string",
        description: "Optional Jira assignee display name for person-level capacity or absence simulation"
      },
      unavailableDays: {
        type: "number",
        description: "Signed unavailability or PTO shift in days (-3 to +15) across the assignee active issues"
      },
      personMitigation: {
        type: "string",
        description: "Comma-separated person mitigations (reassign, serialize, pair) for assigneeName"
      },
      reassignBottleneck: {
        type: "boolean",
        description: "Offload assignee parallel bottleneck issue to eliminate concurrent WIP contention"
      },
      serializeParallelWork: {
        type: "boolean",
        description: "Serialize assignee concurrent tasks to eliminate context-switching variance"
      },
      pairOnTopBlocker: {
        type: "boolean",
        description: "Pair an extra developer on assignee highest-impact critical blocker issue"
      },
      compoundOverridesJson: {
        type: "string",
        description: "Optional JSON string mapping additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope }"
      },
      nodeOverrides: {
        type: "object",
        description: "Optional map of additional issue keys to { deltaDays, addDeveloper, decoupleBlockingEdges, trimScope } for compound multi-task What-If simulation"
      },
      assigneeOverrides: {
        type: "object",
        description: "Optional map of assignee display names to { assignee, unavailableDays, reassignBottleneck, serializeParallelWork, pairOnTopBlocker } for person-level capacity simulation"
      },
      projectKey: {
        type: "string",
        description: PROJECT_KEY_DESCRIPTION
      },
      cloudId: {
        type: "string",
        description: "Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries"
      }
    }
  };
  var MCP_TOOLS_MANIFEST = [
    {
      name: "pwm_simulate_intervention",
      description: "Runs a 500-iteration Pearl do-calculus counterfactual Monte Carlo simulation do(issueKey = deltaDays) on the Project World Model DAG supporting recovery mitigations, person capacity, and compound overrides.",
      inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA
    },
    {
      name: "pwm_get_critical_path",
      description: "Computes cycle-safe topological sorting, critical path nodes, top 3 bottlenecks by downstream ripple weight, and P50/P85/P95 completion dates.",
      inputSchema: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
            description: PROJECT_KEY_DESCRIPTION
          },
          cloudId: {
            type: "string",
            description: "Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries"
          }
        }
      }
    },
    {
      name: "pwm_simulate_delay_impact",
      description: "Alias for pwm_simulate_intervention \u2014 runs counterfactual simulation supporting issue shifts, mitigations, person capacity, and compound overrides.",
      inputSchema: SIMULATE_INTERVENTION_INPUT_SCHEMA
    },
    {
      name: "pwm_analyze_critical_path",
      description: "Alias for pwm_get_critical_path \u2014 returns topological critical path and top bottlenecks.",
      inputSchema: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
            description: PROJECT_KEY_DESCRIPTION
          },
          cloudId: {
            type: "string",
            description: "Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries"
          }
        }
      }
    },
    {
      name: "pwm_seed_demo_scenario",
      description: "Seeds the 18-node Project Chronos: Next-Gen Platform Launch multi-team dependency graph across 3 teams and 2 Teamwork Graph Goals.",
      inputSchema: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
            description: PROJECT_KEY_DESCRIPTION
          },
          populateJiraIssues: { type: "boolean" }
        }
      }
    },
    {
      name: "pwm_get_causal_graph",
      description: "Returns the complete Project World Model DAG (nodes, causal edges, Teamwork Graph goals, teams, and topological order).",
      inputSchema: {
        type: "object",
        properties: {
          projectKey: {
            type: "string",
            description: PROJECT_KEY_DESCRIPTION
          },
          cloudId: {
            type: "string",
            description: "Optional Atlassian Cloud site ID for Teamwork Graph GraphQL queries"
          }
        }
      }
    }
  ];

  // src/components/ScenarioPanel.tsx
  function summarizeNodeOverride(ov) {
    const parts = [];
    if (ov.deltaDays > 0) parts.push(`+${ov.deltaDays}d`);
    else if (ov.deltaDays < 0) parts.push(`${ov.deltaDays}d`);
    if (ov.addDeveloper) parts.push("+Dev");
    if (ov.decoupleBlockingEdges) parts.push("Split");
    if (ov.trimScope) parts.push("MVP");
    return parts.join(" \xB7 ") || "0d";
  }
  function summarizeAssigneeOverride(aOv) {
    const parts = [];
    const uDays = Number(aOv.unavailableDays ?? 0);
    if (uDays > 0) parts.push(`+${uDays}d Away`);
    else if (uDays < 0) parts.push(`${uDays}d Focus`);
    if (aOv.reassignBottleneck) parts.push("Reassign");
    if (aOv.serializeParallelWork) parts.push("Serialize");
    if (aOv.pairOnTopBlocker) parts.push("Pair");
    return parts.join(" \xB7 ") || "Active";
  }
  function isAssigneeOverrideActive(aOv) {
    return Number(aOv.unavailableDays ?? 0) !== 0 || Boolean(aOv.reassignBottleneck) || Boolean(aOv.serializeParallelWork) || Boolean(aOv.pairOnTopBlocker);
  }
  function sanitizePromptField(raw, maxLen = 120) {
    const clean = String(raw ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/[`]/g, "").replace(/\s+/g, " ").trim();
    if (clean.length <= maxLen) return clean;
    return `${clean.slice(0, maxLen - 1)}\u2026`;
  }
  function buildRovoMitigationPrompt(props) {
    const {
      graph,
      selectedNodeKey,
      delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
      pinnedNodeOverrides,
      assigneeOverrides,
      activeSim
    } = props;
    const scenarioClauses = [];
    const mergedNodes = {
      ...pinnedNodeOverrides
    };
    if (delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope) {
      mergedNodes[selectedNodeKey] = {
        deltaDays: delayDays,
        addDeveloper,
        decoupleBlockingEdges,
        trimScope
      };
    }
    for (const [k, ov] of Object.entries(mergedNodes)) {
      const n = graph.nodes.find((item) => item.key === k);
      scenarioClauses.push(
        `issue ${sanitizePromptField(k, 32)}${n ? ` ("${sanitizePromptField(n.summary)}")` : ""} [${summarizeNodeOverride(ov)}]`
      );
    }
    const activeAssigneeEntries = Object.entries(assigneeOverrides).filter(
      ([, aOv]) => isAssigneeOverrideActive(aOv)
    );
    for (const [person, aOv] of activeAssigneeEntries) {
      scenarioClauses.push(
        `person "${sanitizePromptField(person, 60)}" [${summarizeAssigneeOverride(aOv)}]`
      );
    }
    const node = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    const goal = (node ? graph.goals.find((g) => g.id === node.goalId) : void 0) ?? graph.goals[0];
    const safeProjName = sanitizePromptField(graph.projectName, 80);
    const safeProjKey = sanitizePromptField(graph.projectKey, 24);
    const safeGoalName = sanitizePromptField(goal?.name ?? "Sprint Delivery", 80);
    if (!node) {
      return `@Rovo-World-Model Agent Project "${safeProjName}" (${safeProjKey}) currently has 0 issues. Populate sample linked Jira issues or add issues in Jira to run Monte Carlo dependency forecasting.`;
    }
    if (scenarioClauses.length > 1) {
      return `@Rovo-World-Model Agent In project "${safeProjName}" (${safeProjKey}), run a combined counterfactual simulation for: ${scenarioClauses.join(" + ")}. Projected Target Commit Date (85% safe) is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues affecting "${safeGoalName}". Recommend a concrete mitigation plan.`;
    }
    const shiftStr = delayDays >= 0 ? `delayed by ${delayDays} days` : `accelerated by ${Math.abs(delayDays)} days`;
    const modifiers = [];
    if (addDeveloper) modifiers.push("adding +1 developer");
    if (decoupleBlockingEdges) modifiers.push("decoupling outgoing blocking dependencies");
    if (trimScope) modifiers.push("trimming non-essential scope to ship an MVP");
    const modSuffix = modifiers.length > 0 ? ` while ${modifiers.join(" and ")}` : "";
    if (scenarioClauses.length === 1 && activeAssigneeEntries.length === 1) {
      return `@Rovo-World-Model Agent In project "${safeProjName}" (${safeProjKey}), simulate workload impact for ${scenarioClauses[0]} towards our "${safeGoalName}" goal. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
    }
    return `@Rovo-World-Model Agent In project "${safeProjName}" (${safeProjKey}), simulate what happens to our "${safeGoalName}" goal if issue ${sanitizePromptField(node.key, 32)} ("${sanitizePromptField(node.summary)}") is ${shiftStr}${modSuffix}. Projected release date is ${activeSim.p85Date} with ${activeSim.blastRadiusNodes.length} impacted downstream issues. Recommend a concrete mitigation plan.`;
  }
  function renderTabBody(props) {
    const {
      activeRightTab,
      activeSim,
      intervention,
      graph,
      selectedNodeKey,
      delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
      pinnedNodeOverrides,
      assigneeOverrides
    } = props;
    const hasActivePersonOverride = Object.values(assigneeOverrides).some(
      (aOv) => isAssigneeOverrideActive(aOv)
    );
    const hasActiveIntervention = delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope || Object.keys(pinnedNodeOverrides).length > 0 || hasActivePersonOverride;
    if (activeRightTab === "cascade") {
      const deltas = intervention?.nodeDeltas.filter(
        (d) => (Object.keys(pinnedNodeOverrides).length > 1 || hasActivePersonOverride || d.key !== selectedNodeKey) && Math.abs(d.shiftDays) > 0
      ) ?? [];
      if (!hasActiveIntervention || deltas.length === 0) {
        return `
        <div class="empty-tab-notice">
          Adjust the <strong>Schedule Change Slider</strong> above or toggle a mitigation to preview downstream issue shifts in <strong>${escapeHtmlText(graph.projectName)}</strong>.
        </div>
      `;
      }
      const rows = deltas.map((d) => {
        const signStr = d.shiftDays > 0 ? `+${d.shiftDays}d` : `${d.shiftDays}d`;
        const lozClass = d.shiftDays > 0 ? "jira-lozenge-danger" : "jira-lozenge-done";
        return `
          <tr data-select-node="${escapeHtmlText(d.key)}" class="clickable-row" title="Click to inspect ${escapeHtmlText(d.key)} (${escapeHtmlText(d.summary)})">
            <td><strong class="jira-issue-key">${escapeHtmlText(d.key)}</strong></td>
            <td>${escapeHtmlText(d.summary.slice(0, 30))}${d.summary.length > 30 ? "\u2026" : ""}</td>
            <td>${formatFriendlyDate(d.intervenedP85Date)}</td>
            <td><span class="jira-lozenge ${lozClass}">${signStr}</span></td>
          </tr>
        `;
      }).join("");
      return `
      <table class="cascade-table">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Summary</th>
            <th>New Finish</th>
            <th>Shift</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    }
    if (activeRightTab === "bottlenecks") {
      return activeSim.topBottlenecks.slice(0, 5).map(
        (b, idx) => `
        <div class="bottleneck-item" data-select-node="${escapeHtmlText(b.key)}" title="Click to select ${escapeHtmlText(b.key)} | Ripple Weight: ${b.downstreamRippleWeight}">
          <div class="bottleneck-row-top">
            <span>
              <strong class="text-brand">#${idx + 1} ${escapeHtmlText(b.key)}</strong>
              \u2014 <strong class="bottleneck-summary-title">${escapeHtmlText(b.summary)}</strong>
            </span>
            <span class="jira-lozenge jira-lozenge-inprogress">GATES ${b.downstreamCount}</span>
          </div>
          <div class="bottleneck-row-meta">
            <span>Assignee: <strong>${escapeHtmlText(b.assignee)}</strong> \xB7 Risk Score: <strong>${b.riskScore}/100</strong></span>
            <span>Float: <strong>${(b.totalFloatDays ?? 0).toFixed(1)}d</strong> \xB7 <span title="Schedule Leverage: ~${(b.mitigationROI ?? 1).toFixed(1)} days of release risk saved per 1 day of mitigation effort">Impact: <strong class="text-success">~${(b.mitigationROI ?? 1).toFixed(1)}d saved/d</strong></span></span>
          </div>
          <div class="bottleneck-row-rec">
            \u{1F4A1} ${escapeHtmlText(b.recommendation)}
          </div>
        </div>
      `
      ).join("");
    }
    if (activeRightTab === "governance") {
      const res = activeSim.reserves;
      const evm = activeSim.earnedValue;
      const gov = activeSim.deliveryGovernance;
      const burnPct = res ? Math.round(res.bufferBurnRatio * 100) : 0;
      const burnLozenge = burnPct >= 80 ? `<span class="jira-lozenge jira-lozenge-danger">${burnPct}% BURN</span>` : burnPct >= 50 ? `<span class="jira-lozenge jira-lozenge-inprogress">${burnPct}% BURN</span>` : `<span class="jira-lozenge jira-lozenge-done">${burnPct}% BURN</span>`;
      const cpiVal = evm?.cpi ?? 1;
      const spiVal = evm?.spi ?? 1;
      const evmLozenge = evm?.maskingWarning ? `<span class="jira-lozenge jira-lozenge-danger">SQUAD VARIANCE ALERT</span>` : cpiVal < 0.9 || spiVal < 0.9 ? `<span class="jira-lozenge jira-lozenge-inprogress">WATCH</span>` : `<span class="jira-lozenge jira-lozenge-done">HEALTHY</span>`;
      const squadRows = Object.entries(evm?.byTeam ?? {}).map(
        ([teamName, sq]) => `
          <div class="gov-squad-row">
            <span>${escapeHtmlText(teamName)}</span>
            <span>CPI <strong>${sq.cpi.toFixed(2)}</strong> \xB7 SPI <strong>${sq.spi.toFixed(2)}</strong></span>
          </div>
        `
      ).join("");
      const stageGateNodes = gov?.stageGateNodes ?? [];
      const retroCal = gov?.lessonsLearntCalibration;
      return `
      <div class="governance-grid">
        <!-- Card 1: 3-Tier Schedule Buffers & Hypercare -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>1. Schedule Buffers &amp; Hypercare</span>
            ${burnLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Core Work Estimate: <strong>${(res?.baseTargetDays ?? activeSim.p50Days).toFixed(1)}d</strong></span>
            <span>Team Risk Buffer: <strong>+${(res?.pmContingencyReserveDays ?? 0).toFixed(1)}d</strong></span>
          </div>
          <div class="gov-stat-row">
            <span>Executive Contingency: <strong>+${(res?.managementReserveDays ?? 0).toFixed(1)}d</strong></span>
            <span>Hypercare Buffer: <strong>+${(gov?.hypercareReserveDays ?? 1.5).toFixed(1)}d</strong></span>
          </div>
        </div>

        <!-- Card 2: Engineering Earned Value (Dev-Days) -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>2. Engineering Earned Value (Dev-Days)</span>
            ${evmLozenge}
          </div>
          <div class="gov-stat-row">
            <span>Effort CPI: <strong>${cpiVal.toFixed(2)}</strong></span>
            <span>Schedule SPI: <strong>${spiVal.toFixed(2)}</strong></span>
            <span>EAC: <strong>${(evm?.eacTrendDays ?? 0).toFixed(1)}d</strong> (BAC ${(evm?.bacDays ?? 0).toFixed(1)}d)</span>
          </div>
          <div class="gov-squad-list">
            ${squadRows}
          </div>
        </div>

        <!-- Card 3: Resource Contention & Handoffs -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>3. Resource Contention &amp; Handoffs</span>
            <span class="jira-lozenge ${(gov?.overallocatedAssignees.length ?? 0) > 0 ? "jira-lozenge-inprogress" : "jira-lozenge-done"}">
              ${gov?.overallocatedAssignees.length ?? 0} OVERLOADED
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Blocked Handoff Idle: <strong>${(gov?.blockedHandoffIdleDays ?? 0).toFixed(1)}d</strong></span>
            <span>SLA Breach Risk: <strong>${Math.round((gov?.slaBreachProbability ?? 0) * 100)}%</strong></span>
          </div>
          ${(gov?.overallocatedAssignees.length ?? 0) > 0 ? `<div class="gov-sub-note">Parallel Contention: ${escapeHtmlText(gov.overallocatedAssignees.map((a) => `${a.assignee} (${a.utilizationPct}%)`).join(", "))}</div>` : `<div class="gov-sub-note">No parallel critical-path assignee multi-tasking detected.</div>`}
        </div>

        <!-- Card 4: Sprint Readiness (DoR) & Retro Calibration -->
        <div class="gov-card">
          <div class="gov-card-header">
            <span>4. Sprint Readiness &amp; Stage Gates</span>
            <span class="jira-lozenge ${(gov?.sprintReadinessScore ?? 100) >= 80 ? "jira-lozenge-done" : "jira-lozenge-inprogress"}">
              DoR ${gov?.sprintReadinessScore ?? 100}%
            </span>
          </div>
          <div class="gov-stat-row">
            <span>Stage Gates: <strong>${stageGateNodes.length}</strong> (${escapeHtmlText(stageGateNodes.join(", ") || "None")})</span>
            <span>Retro Priors: <strong>${retroCal ? `${retroCal.empiricalVelocityRatio}x (${retroCal.completedCount} done)` : "1.0x"}</strong></span>
          </div>
        </div>
      </div>
    `;
    }
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    if (!selectedNode) {
      return `
      <div class="empty-tab-notice">
        No issues found in <strong>${escapeHtmlText(graph.projectName)}</strong>. Use <strong>+ Add Sample Issues</strong> in the header or create Jira issues to view AI recommendations.
      </div>
    `;
    }
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const matchedBottleneck = activeSim.topBottlenecks.find(
      (b) => b.key === selectedNode.key
    );
    const downstreamCount = matchedBottleneck?.downstreamCount ?? graph.edges.filter((e) => e.from === selectedNode.key).length;
    const critPct = Math.round((selectedStat?.criticalityIndex ?? 0) * 100);
    const primaryActionRec = selectedNode.baseEstimateDays <= 2 ? `Task is small (${selectedNode.baseEstimateDays}d) \u2014 adding another developer would add handoff overhead. Best move: split or mock the dependency so downstream issues can start early.` : critPct >= 60 ? `High-priority critical path issue (${critPct}% risk) blocking ${downstreamCount} downstream ${downstreamCount === 1 ? "issue" : "issues"}. Assign an extra developer to pair on ${selectedNode.key} and share early interface contracts.` : `Has ${Math.max(0, selectedStat?.slackDays ?? 0).toFixed(1)}d of schedule slack. Keep current owner (${selectedNode.assignee}) focused and avoid context-switching.`;
    return `
    <div class="gov-card-stack">
      <!-- Card 1: Concrete Recovery Action Plan for Selected Issue -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>1. Recommended Action Plan (${escapeHtmlText(selectedNode.key)})</span>
          <span class="jira-lozenge ${critPct >= 60 ? "jira-lozenge-inprogress" : "jira-lozenge-done"}">
            ${critPct >= 60 ? "CRITICAL PATH" : "ON TRACK"}
          </span>
        </div>
        <div class="gov-sub-note">
          \u{1F4A1} <strong>Triage Advice:</strong> ${escapeHtmlText(primaryActionRec)}
        </div>
        <div class="gov-stat-row">
          <span title="Estimated hours of downstream code/interface rework if this issue changes late">Rework Risk: <strong class="text-warning">~${activeSim.estimatedReworkHours} hrs</strong></span>
          <span title="Worst-case finish date across the 5% most delayed scenarios">Worst-Case Date: <strong class="text-danger">${formatFriendlyDate(activeSim.cvar95Date, true)}</strong></span>
        </div>
      </div>

      <!-- Card 2: Why Rovo & MCP Matter to Your Team -->
      <div class="gov-card">
        <div class="gov-card-header">
          <span>2. Connected AI Agents (Rovo &amp; IDE MCP)</span>
          <span class="jira-lozenge jira-lozenge-goal">${MCP_TOOLS_MANIFEST.length} LIVE TOOLS</span>
        </div>
        <div class="gov-sub-note">
          Allows <strong>Atlassian Rovo Chat</strong> and IDE coding agents (<strong>Cursor, Claude, VS Code</strong>) to query live Jira blockers and test schedule changes automatically:
        </div>
        <div class="gov-squad-list">
          <div class="gov-squad-row" title="MCP Tool: pwm_simulate_intervention | Rovo Action: simulate-delay-impact">
            <span><strong>Simulate Delay Impact</strong></span>
            <span class="text-brand">Tests +days, extra dev, or split links</span>
          </div>
          <div class="gov-squad-row" title="MCP Tool: pwm_get_critical_path | Rovo Action: analyze-critical-path">
            <span><strong>Find Top Blockers</strong></span>
            <span class="text-brand">Ranks #1\u2013#3 sprint bottlenecks</span>
          </div>
        </div>
      </div>
    </div>
  `;
  }
  function renderScenarioPanel(props) {
    const {
      graph,
      baselineSim,
      activeSim,
      selectedNodeKey,
      delayDays,
      addDeveloper,
      decoupleBlockingEdges,
      trimScope,
      simulatorMode,
      pinnedNodeOverrides,
      selectedAssignee,
      assigneeOverrides,
      activeRightTab,
      copiedPromptNotice
    } = props;
    const selectedNode = graph.nodes.find((n) => n.key === selectedNodeKey) ?? graph.nodes[0];
    if (!selectedNode) {
      return `
      <div class="right-column" data-drop-zone="scenario">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              ${renderDragHandleBadge("scenario", "What-If Scenario Simulator")}
              <span>What-If Scenario Simulator</span>
            </div>
            <span class="jira-lozenge jira-lozenge-todo">NO ISSUES</span>
          </div>
          <div class="intervention-box">
            <div class="empty-tab-notice">
              Project <strong>${escapeHtmlText(graph.projectName)}</strong> has 0 issues yet. Click <strong>+ Add Sample Issues</strong> in the top bar to populate linked Jira tasks and start running What-If simulations.
            </div>
          </div>
        </div>
      </div>
    `;
    }
    const selectedStat = activeSim.nodeStats[selectedNode.key];
    const blockedByKeys = graph.edges.filter((e) => e.to === selectedNode.key).map((e) => e.from);
    const blocksKeys = graph.edges.filter((e) => e.from === selectedNode.key).map((e) => e.to);
    const maxTimelineScale = Math.max(
      45,
      baselineSim.p95Days + 8,
      activeSim.p95Days + 8
    );
    const pct = (days) => Math.min(100, Math.max(8, Math.round(days / maxTimelineScale * 100)));
    const delaySignLabel = delayDays > 0 ? `+${delayDays} Days Delay` : delayDays < 0 ? `${delayDays} Days Faster` : "0 Days (Baseline)";
    const pinnedEntries = Object.entries(pinnedNodeOverrides);
    const isCurrentPinned = Boolean(pinnedNodeOverrides[selectedNode.key]);
    const pinRank = isCurrentPinned ? pinnedEntries.findIndex(([k]) => k === selectedNode.key) + 1 : 0;
    const activePersonEntries = Object.entries(assigneeOverrides).filter(
      ([, aOv]) => isAssigneeOverrideActive(aOv)
    );
    const hasCurrentNodeMod = delayDays !== 0 || addDeveloper || decoupleBlockingEdges || trimScope;
    const totalStackedCount = pinnedEntries.length + (!isCurrentPinned && hasCurrentNodeMod ? 1 : 0) + activePersonEntries.length;
    const netP85Shift = Number((activeSim.p85Days - baselineSim.p85Days).toFixed(1));
    const activeLozenge = totalStackedCount > 1 ? `<span class="jira-lozenge jira-lozenge-goal">${totalStackedCount} STACKED</span>` : activePersonEntries.length === 1 && !hasCurrentNodeMod ? `<span class="jira-lozenge jira-lozenge-inprogress">PERSON SCENARIO</span>` : delayDays > 0 ? `<span class="jira-lozenge jira-lozenge-danger">+${delayDays}D DELAY</span>` : delayDays < 0 ? `<span class="jira-lozenge jira-lozenge-done">${delayDays}D FASTER</span>` : addDeveloper || decoupleBlockingEdges || trimScope ? `<span class="jira-lozenge jira-lozenge-done">MITIGATED</span>` : `<span class="jira-lozenge jira-lozenge-todo">BASELINE</span>`;
    const uncertaintyLabel = selectedNode.uncertaintySigma >= 1.8 ? "High" : selectedNode.uncertaintySigma >= 1 ? "Medium" : "Low";
    const assigneeInitials = getInitials(selectedNode.assignee);
    const doneSub = selectedNode.subtaskDoneCount ?? 0;
    const totalSub = selectedNode.subtaskTotalCount ?? 4;
    const progPct = selectedNode.subtaskProgressPct ?? selectedStat?.completionStepPct ?? (selectedNode.status === "Done" ? 100 : selectedNode.status === "In Progress" ? 50 : 0);
    const isTopBlocker = activeSim.topBottlenecks.slice(0, 3).some((b) => b.key === selectedNode.key) || selectedNode.status.toLowerCase() === "blocked" || delayDays > 0;
    const isStageGate = Boolean(selectedNode.isStageGate) || Boolean(selectedNode.confluenceDecision);
    const shapeTaxonomyBadge = isStageGate ? `<span class="shape-badge-diamond">\u25C6 STAGE GATE</span>` : isTopBlocker ? `<span class="shape-badge-hex">\u2B22 BLOCKER</span>` : `<span class="shape-badge-circle">\u25CF TASK / EPIC</span>`;
    const progBarColor = progPct >= 100 ? "#10B981" : isTopBlocker ? "#F59E0B" : "#0C66E4";
    const baseP50X = Math.max(24, Math.min(240, Math.round(baselineSim.p50Days / maxTimelineScale * 260)));
    const simP85X = Math.max(36, Math.min(265, Math.round(activeSim.p85Days / maxTimelineScale * 260)));
    const bellStroke = netP85Shift > 0 ? "#E11D48" : netP85Shift < 0 ? "#10B981" : "#4F46E5";
    const bellFill = netP85Shift > 0 ? "#FFE4E6" : netP85Shift < 0 ? "#D1FAE5" : "#E0E7FF";
    const assigneeStatsMap = /* @__PURE__ */ new Map();
    for (const node of graph.nodes) {
      const aName = node.assignee || "Unassigned";
      const entry = assigneeStatsMap.get(aName) ?? {
        name: aName,
        totalCount: 0,
        activeCount: 0,
        totalEstimateDays: 0,
        criticalCount: 0,
        issueKeys: []
      };
      entry.totalCount += 1;
      if (node.status.toLowerCase() !== "done") {
        entry.activeCount += 1;
        entry.totalEstimateDays += node.baseEstimateDays;
      }
      if ((activeSim.nodeStats[node.key]?.criticalityIndex ?? 0) >= 0.45) {
        entry.criticalCount += 1;
      }
      entry.issueKeys.push(node.key);
      assigneeStatsMap.set(aName, entry);
    }
    const assigneeList = Array.from(assigneeStatsMap.values()).sort((a, b) => {
      if (a.name.toLowerCase() === "unassigned") return 1;
      if (b.name.toLowerCase() === "unassigned") return -1;
      return b.activeCount - a.activeCount || b.totalEstimateDays - a.totalEstimateDays;
    });
    const activeAssigneeStats = assigneeList.find((a) => a.name === selectedAssignee) ?? assigneeList[0];
    const currentPersonName = activeAssigneeStats?.name ?? "Unassigned";
    const currentPersonOv = assigneeOverrides[currentPersonName] ?? {
      assignee: currentPersonName,
      unavailableDays: 0,
      reassignBottleneck: false,
      serializeParallelWork: false,
      pairOnTopBlocker: false
    };
    const ptoDays = Number(currentPersonOv.unavailableDays ?? 0);
    const ptoSignLabel = ptoDays > 0 ? `+${ptoDays} Days Away` : ptoDays < 0 ? `${ptoDays} Days Focus Gain` : "0 Days (Normal Capacity)";
    const personLoadPct = activeAssigneeStats ? currentPersonOv.reassignBottleneck && currentPersonOv.serializeParallelWork ? Math.max(65, Math.round(activeAssigneeStats.activeCount * 38)) : currentPersonOv.reassignBottleneck ? Math.max(70, Math.round((activeAssigneeStats.activeCount - 1) * 55)) : Math.min(250, Math.max(40, activeAssigneeStats.activeCount * 65)) : 100;
    const circledNums = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469"];
    const issueChipsHtml = pinnedEntries.map(([key, ov], idx) => {
      const badgeNum = circledNums[idx] ?? `#${idx + 1}`;
      const activeCls = simulatorMode === "issue" && key === selectedNodeKey ? "active" : "";
      return `
        <div class="scenario-chip ${activeCls}" data-focus-pin="${escapeHtmlText(key)}" title="Click to edit pinned scenario for ${escapeHtmlText(key)}">
          <span class="scenario-chip-label">${badgeNum} ${escapeHtmlText(key)}: ${escapeHtmlText(summarizeNodeOverride(ov))}</span>
          <button type="button" class="scenario-chip-remove" data-unpin-node="${escapeHtmlText(key)}" title="Remove ${escapeHtmlText(key)} from scenario stack">\xD7</button>
        </div>
      `;
    }).join("");
    const personChipsHtml = activePersonEntries.map(([name, aOv]) => {
      const shortName = name.length > 14 ? `${name.split(/\s+/)[0]} ${name.split(/\s+/)[1]?.[0] ?? ""}.`.trim() : name;
      const activeCls = simulatorMode === "person" && name === currentPersonName ? "active" : "";
      return `
        <div class="scenario-chip person-chip ${activeCls}" data-focus-person="${escapeHtmlText(name)}" title="Click to edit person capacity scenario for ${escapeHtmlText(name)}">
          <span class="scenario-chip-label">\u{1F464} ${escapeHtmlText(shortName)}: ${escapeHtmlText(summarizeAssigneeOverride(aOv))}</span>
          <button type="button" class="scenario-chip-remove" data-clear-person="${escapeHtmlText(name)}" title="Remove ${escapeHtmlText(name)} from scenario stack">\xD7</button>
        </div>
      `;
    }).join("");
    const stackBarHtml = `
    <div class="scenario-stack-bar">
      <div class="scenario-stack-header">
        <span>Active Scenario Stack (${pinnedEntries.length + activePersonEntries.length})</span>
        <div class="scenario-stack-actions">
          ${simulatorMode === "issue" ? `<button
                   type="button"
                   class="btn-pin-issue ${isCurrentPinned ? "is-pinned" : ""}"
                   id="btn-pin-current-issue"
                   title="${isCurrentPinned ? "Unpin this issue from the multi-issue scenario stack" : "Lock this issue into Active Scenario Stack so you can tweak other issues simultaneously"}"
                 >
                   ${isCurrentPinned ? `\u2713 Pinned (${circledNums[pinRank - 1] ?? `#${pinRank}`})` : `\u{1F4CC} Pin ${escapeHtmlText(selectedNode.key)}`}
                 </button>` : ""}
          ${pinnedEntries.length + activePersonEntries.length > 0 ? `<button type="button" class="scenario-clear-btn" id="btn-clear-scenario-stack" title="Clear all pinned issue and person scenarios">Clear All</button>` : ""}
        </div>
      </div>
      ${pinnedEntries.length + activePersonEntries.length > 0 ? `<div class="scenario-chip-list">${issueChipsHtml}${personChipsHtml}</div>` : ""}
    </div>
  `;
    const forecastRows = [
      {
        label: "Likely Finish (50% odds)",
        tooltip: "Likely Delivery Date: 50% of simulated runs finish on or before this date (normal sprint pace without unexpected blockers).",
        baseDays: baselineSim.p50Days,
        intDays: activeSim.p50Days,
        baseDate: baselineSim.p50Date,
        intDate: activeSim.p50Date
      },
      {
        label: "Target Commit Date (85% safe)",
        tooltip: "Recommended Target Commit Date: 85% probability of finishing on or before this date (includes Team Risk Buffer).",
        baseDays: baselineSim.p85Days,
        intDays: activeSim.p85Days,
        baseDate: baselineSim.p85Date,
        intDate: activeSim.p85Date
      },
      {
        label: "Safe Buffer Date (95% cutoff)",
        tooltip: `Safe Buffer Cutoff Date (95% confidence). Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
        baseDays: baselineSim.p95Days,
        intDays: activeSim.p95Days,
        baseDate: baselineSim.p95Date,
        intDate: activeSim.p95Date
      }
    ];
    const issueModeContentHtml = `
    <!-- Selected Issue Card -->
    <div class="selected-node-banner">
      <div class="node-banner-top">
        <div class="node-banner-id-cluster">
          <span class="node-avatar-circle" title="Responsible Assignee: ${escapeHtmlText(selectedNode.assignee)}">${escapeHtmlText(assigneeInitials)}</span>
          <span class="node-key-tag">${escapeHtmlText(selectedNode.key)}</span>
          ${shapeTaxonomyBadge}
        </div>
        ${renderJiraStatusLozenge(selectedNode.status)}
      </div>
      <div class="node-summary-text">${escapeHtmlText(selectedNode.summary)}</div>
      <div class="node-subtask-bar-wrap" title="Overall Issue / Epic Sub-task Completion: ${doneSub}/${totalSub} Sub-tasks (${progPct}%)">
        <div class="node-subtask-bar-labels">
          <span>Sub-tasks / Epic Progress</span>
          <strong>${doneSub}/${totalSub} Done (${progPct}%)</strong>
        </div>
        <svg width="100%" height="6" class="subtask-bar-svg">
          <rect x="0" y="0" width="100%" height="6" rx="3" fill="#E2E8F0" />
          <rect x="0" y="0" width="${Math.max(4, progPct)}%" height="6" rx="3" fill="${progBarColor}" />
        </svg>
      </div>
      <div class="node-meta-grid">
        <div class="meta-cell">
          <span>Assignee</span>
          <strong>${escapeHtmlText(selectedNode.assignee)}</strong>
        </div>
        <div class="meta-cell">
          <span>Estimate</span>
          <strong>${selectedNode.baseEstimateDays} Days</strong>
        </div>
        <div class="meta-cell" title="Estimate Uncertainty: \xB1${selectedNode.uncertaintySigma} days of potential schedule variance">
          <span>Uncertainty \u24D8</span>
          <strong>${uncertaintyLabel}</strong>
        </div>
        <div class="meta-cell" title="Criticality Index: ${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}% of Monte Carlo runs place this issue on the critical path">
          <span>Criticality \u24D8</span>
          <strong>${Math.round((selectedStat?.criticalityIndex ?? 0) * 100)}%</strong>
        </div>
      </div>
      <div class="node-lineage-row">
        <div class="lineage-cell" title="${escapeHtmlText(blockedByKeys.length > 0 ? `Upstream blockers: ${blockedByKeys.join(", ")}` : "Entry task with no upstream blockers")}">
          <span>Blocked by:</span>
          <strong>${escapeHtmlText(blockedByKeys.length > 0 ? blockedByKeys.join(", ") : "None (Entry Task)")}</strong>
        </div>
        <div class="lineage-cell" title="${escapeHtmlText(blocksKeys.length > 0 ? `Downstream dependents: ${blocksKeys.join(", ")}` : "Terminal task with no downstream dependents")}">
          <span>Blocks:</span>
          <strong>${escapeHtmlText(blocksKeys.length > 0 ? blocksKeys.join(", ") : "None (Terminal Task)")}</strong>
        </div>
      </div>
    </div>

    <!-- Step 1: Schedule Change Slider & Mitigations -->
    <div class="delay-slider-card">
      <div class="slider-header">
        <span class="slider-title">1. Schedule Change (-5d to +30d)</span>
        <span class="slider-readout ${delayDays < 0 ? "accel-text" : delayDays === 0 ? "neutral-text" : ""}">
          ${delaySignLabel}
        </span>
      </div>
      <input
        type="range"
        min="-5"
        max="30"
        step="1"
        value="${delayDays}"
        class="delay-range-input"
        id="delay-slider-input"
      />
      <div class="preset-row">
        ${[-5, -3, 0, 5, 10, 18, 30].map(
      (val) => `
            <button class="preset-btn ${delayDays === val ? "active" : ""}" data-preset-delay="${val}">
              ${val === 0 ? "0d" : val > 0 ? `+${val}d` : `${val}d`}
            </button>
          `
    ).join("")}
      </div>

      <div class="mitigation-label">2. Recovery Mitigations</div>
      <div class="scope-toggles-row">
        <button
          class="scope-toggle-btn ${addDeveloper ? "active" : ""}"
          id="btn-toggle-add-dev"
          title="Assign 1 extra full-time developer to help finish this issue faster (automatically accounts for ramp-up and coordination time)"
        >
          ${addDeveloper ? "\u2713 Extra Dev Added" : "+ Assign Extra Developer"}
        </button>
        <button
          class="scope-toggle-btn ${decoupleBlockingEdges ? "active" : ""}"
          id="btn-toggle-decouple-edge"
          title="Split or mock the blocking interface so downstream issues can start work in parallel without waiting for this issue to finish 100%"
        >
          ${decoupleBlockingEdges ? "\u2713 Split / Mocked" : "\u2702 Decouple Dependency"}
        </button>
        <button
          class="scope-toggle-btn ${trimScope ? "active" : ""}"
          id="btn-toggle-trim-scope"
          title="Defer non-essential sub-tasks or stretch goals to the next sprint (-35% remaining work & -45% uncertainty) to protect the release date"
        >
          ${trimScope ? "\u2713 Scope Trimmed (MVP)" : "\u{1F4E6} Trim Scope (MVP)"}
        </button>
      </div>
      ${addDeveloper && activeSim.deliveryGovernance?.brooksLawDiagnostic ? `<div class="brooks-advisory-banner" title="Accounts for realistic developer onboarding and team sync time">
               <span><strong>Team Ramp-Up Note:</strong> Net <strong>${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays >= 0 ? `${activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays}d saved` : `${Math.abs(activeSim.deliveryGovernance.brooksLawDiagnostic.netAccelerationDays)}d slower`}</strong> after ${activeSim.deliveryGovernance.brooksLawDiagnostic.onboardingPenaltyDays}d of ramp-up &amp; handoff sync</span>
             </div>` : ""}
    </div>
  `;
    const personModeContentHtml = `
    <!-- Selected Person & Team Card -->
    <div class="selected-node-banner">
      <div class="node-banner-top">
        <div class="node-banner-id-cluster">
          <span class="node-avatar-circle">${escapeHtmlText(getInitials(currentPersonName))}</span>
          <span class="node-key-tag">${escapeHtmlText(currentPersonName)}</span>
        </div>
        <span class="jira-lozenge ${personLoadPct > 105 ? "jira-lozenge-danger" : "jira-lozenge-done"}">
          ${personLoadPct}% LOAD
        </span>
      </div>

      <div class="assignee-roster-grid">
        ${assigneeList.map((person) => {
      const pOv = assigneeOverrides[person.name];
      const hasOv = pOv && ((pOv.unavailableDays ?? 0) !== 0 || pOv.reassignBottleneck || pOv.serializeParallelWork || pOv.pairOnTopBlocker);
      return `
              <button
                type="button"
                class="assignee-pill-btn ${person.name === currentPersonName ? "active" : ""} ${hasOv ? "has-override" : ""}"
                data-select-assignee="${escapeHtmlText(person.name)}"
                title="${escapeHtmlText(person.name)}: ${person.activeCount} active / ${person.totalCount} total issues (${person.totalEstimateDays}d remaining)"
              >
                <span class="assignee-pill-initials">${escapeHtmlText(getInitials(person.name))}</span>
                <span class="assignee-pill-name">${escapeHtmlText(person.name)}</span>
                <span class="assignee-pill-count">${person.activeCount}/${person.totalCount}</span>
              </button>
            `;
    }).join("")}
      </div>

      <div class="node-meta-grid">
        <div class="meta-cell">
          <span>Active Tasks</span>
          <strong>${activeAssigneeStats?.activeCount ?? 0} Issues</strong>
        </div>
        <div class="meta-cell">
          <span>Remaining</span>
          <strong>${activeAssigneeStats?.totalEstimateDays ?? 0} Days</strong>
        </div>
        <div class="meta-cell">
          <span>Critical Path</span>
          <strong>${activeAssigneeStats?.criticalCount ?? 0} Issues</strong>
        </div>
        <div class="meta-cell">
          <span>Parallel WIP</span>
          <strong>${personLoadPct}%</strong>
        </div>
      </div>

      <div class="node-lineage-row">
        <div class="lineage-cell" title="Jira issues assigned to ${escapeHtmlText(currentPersonName)}">
          <span>Assigned Issues:</span>
          <strong>${escapeHtmlText(activeAssigneeStats?.issueKeys.join(", ") || "None")}</strong>
        </div>
        <div class="lineage-cell">
          <span>Focus Status:</span>
          <strong>${(activeAssigneeStats?.activeCount ?? 0) >= 2 && !currentPersonOv.serializeParallelWork ? "Parallel Overload" : "Balanced Focus"}</strong>
        </div>
      </div>
    </div>

    <!-- Step 1 (Person): Unavailability Slider & Workload Mitigations -->
    <div class="delay-slider-card">
      <div class="slider-header">
        <span class="slider-title">1. Unavailability / Absence (-3d to +15d)</span>
        <span class="slider-readout ${ptoDays < 0 ? "accel-text" : ptoDays === 0 ? "neutral-text" : ""}">
          ${ptoSignLabel}
        </span>
      </div>
      <input
        type="range"
        min="-3"
        max="15"
        step="1"
        value="${ptoDays}"
        class="delay-range-input"
        id="person-pto-slider-input"
      />
      <div class="preset-row">
        ${[-3, 0, 2, 5, 10, 15].map(
      (val) => `
            <button class="preset-btn ${ptoDays === val ? "active" : ""}" data-preset-pto="${val}">
              ${val === 0 ? "0d" : val > 0 ? `+${val}d` : `${val}d`}
            </button>
          `
    ).join("")}
      </div>

      <div class="mitigation-label">2. Workload Mitigations</div>
      <div class="scope-toggles-row">
        <button
          class="scope-toggle-btn ${currentPersonOv.reassignBottleneck ? "active" : ""}"
          id="btn-person-reassign"
          title="Offload this person's parallel bottleneck task to an available developer (-28% duration & removes concurrent contention)"
        >
          ${currentPersonOv.reassignBottleneck ? "\u2713 Bottleneck Reassigned" : "\u21C4 Reassign Bottleneck"}
        </button>
        <button
          class="scope-toggle-btn ${currentPersonOv.serializeParallelWork ? "active" : ""}"
          id="btn-person-serialize"
          title="Eliminate multi-tasking context switches so active tasks run in clean sequence"
        >
          ${currentPersonOv.serializeParallelWork ? "\u2713 Parallel Serialized" : "\u{1F9F9} Serialize Parallel Work"}
        </button>
        <button
          class="scope-toggle-btn ${currentPersonOv.pairOnTopBlocker ? "active" : ""}"
          id="btn-person-pair"
          title="Pair +1 developer on this person's highest-impact critical blocker issue"
        >
          ${currentPersonOv.pairOnTopBlocker ? "\u2713 Paired Blocker" : "\u{1F91D} Pair on Top Blocker"}
        </button>
      </div>
    </div>
  `;
    return `
    <div class="right-column" data-drop-zone="scenario">
      <!-- What-If Simulator Controls Card -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            ${renderDragHandleBadge("scenario", "What-If Scenario Simulator")}
            <span>What-If Scenario Simulator</span>
            ${renderInfoTooltip(
      "What-If Scenario Simulator",
      "Simulate schedule delays or recovery mitigations on single or multiple pinned Jira issues, or switch to By Person & Team to test absences and workload rebalancing.",
      `Active Interventions: ${totalStackedCount} | Selected: ${selectedNode.key}`
    )}
          </div>
          ${activeLozenge}
        </div>

        <div class="intervention-box">
          <!-- Dual-Mode Switcher (By Issue vs. By Person & Team) -->
          <div class="sim-mode-switcher" role="tablist" aria-label="Simulation target mode">
            <button
              type="button"
              class="sim-mode-btn ${simulatorMode === "issue" ? "active" : ""}"
              data-sim-mode="issue"
            >
              \u{1F4CB} By Issue
            </button>
            <button
              type="button"
              class="sim-mode-btn ${simulatorMode === "person" ? "active" : ""}"
              data-sim-mode="person"
            >
              \u{1F464} By Person &amp; Team
            </button>
          </div>

          ${stackBarHtml}

          ${simulatorMode === "person" ? personModeContentHtml : issueModeContentHtml}

          <!-- Step 2: Release Date Comparison Bars -->
          <div class="comparison-bars-card">
            <div class="comparison-card-header">
              <span>Projected Release Impact</span>
              ${renderInfoTooltip(
      "Baseline vs. Simulated Forecast",
      `Compares your baseline schedule (top grey bar) against the simulated What-If schedule (bottom bar: blue = unchanged, green = faster, red = delayed) across 500 paired runs. Worst-case 5% blocker scenario finishes around ${formatFriendlyDate(activeSim.cvar95Date, true)}.`,
      `Release Shift: ${(activeSim.p85Days - baselineSim.p85Days).toFixed(1)}d | Worst-Case Date: ${activeSim.cvar95Date}`
    )}
            </div>

            <div class="mc-bell-curve-wrap" title="500-Run Monte Carlo Release Probability Curve (Likely Finish / Target Commit Date / Safe Buffer Date)">
              <svg width="100%" height="52" viewBox="0 0 280 52" class="mc-bell-svg">
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48 Z" fill="${bellFill}" />
                <path d="M 8 48 C 60 48, ${Math.max(40, simP85X - 45)} 8, ${simP85X - 14} 8 C ${simP85X + 18} 8, 235 48, 272 48" fill="none" stroke="${bellStroke}" stroke-width="2" />
                <line x1="${baseP50X}" y1="8" x2="${baseP50X}" y2="48" stroke="#64748B" stroke-width="1.3" stroke-dasharray="3 2" />
                <line x1="${simP85X}" y1="5" x2="${simP85X}" y2="48" stroke="${bellStroke}" stroke-width="2" />
                <rect x="8" y="3" width="104" height="16" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.2" />
                <text x="60" y="14" text-anchor="middle" fill="${bellStroke}" font-size="9.5" font-weight="700">Target: ${escapeHtmlText(formatFriendlyDate(activeSim.p85Date))}</text>
              </svg>
            </div>

            <div class="impact-bar-legend" title="Each row compares the original Baseline (top grey bar) against the simulated What-If schedule (bottom colored bar).">
              <span class="impact-legend-item">
                <span class="impact-swatch swatch-baseline"></span>
                Baseline
              </span>
              <span class="impact-legend-item">
                Simulated:
                <span class="impact-swatch swatch-same"></span> Same
                <span class="impact-swatch swatch-faster"></span> Faster
                <span class="impact-swatch swatch-delayed"></span> Delayed
              </span>
            </div>

            ${forecastRows.map((row) => {
      const diff = Number((row.intDays - row.baseDays).toFixed(1));
      const intBarColor = diff > 0 ? "#CA3521" : diff < 0 ? "#1F845A" : "#0C66E4";
      const diffBadge = diff > 0 ? `<span class="text-danger">(+${diff}d)</span>` : diff < 0 ? `<span class="text-success">(${diff}d)</span>` : `<span class="text-muted">(0d)</span>`;
      const barTooltip = `${row.tooltip} Top grey bar = Baseline (${formatFriendlyDate(row.baseDate)}). Bottom bar = Simulated (${formatFriendlyDate(row.intDate)}, ${diff > 0 ? `+${diff}d Delayed (Red)` : diff < 0 ? `${diff}d Faster (Green)` : "0d Same as Baseline (Blue)"}).`;
      return `
                  <div class="dist-compare-group" title="${escapeHtmlText(barTooltip)}">
                    <div class="dist-compare-label">
                      <strong>${escapeHtmlText(row.label)}</strong>
                      <span>
                        ${formatFriendlyDate(row.baseDate)} \u2192 <strong>${formatFriendlyDate(row.intDate)}</strong> ${diffBadge}
                      </span>
                    </div>
                    <svg width="100%" height="14" class="dual-bar-svg">
                      <rect x="0" y="0" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="0" width="${pct(row.baseDays)}%" height="6" rx="3" fill="#8590A2" />
                      <rect x="0" y="8" width="100%" height="6" rx="3" fill="#DCDFE4" />
                      <rect x="0" y="8" width="${pct(row.intDays)}%" height="6" rx="3" fill="${intBarColor}" />
                    </svg>
                  </div>
                `;
    }).join("")}

            <button class="btn btn-primary btn-rovo-copy" id="btn-copy-rovo-prompt" title="Copy prompt for @Rovo-World-Model Agent in Rovo Chat">
              ${copiedPromptNotice ? "\u2713 Copied Prompt for @Rovo-World-Model Agent!" : "\u2728 Ask @Rovo-World-Model Agent"}
            </button>
          </div>
        </div>

        <!-- Unified Inspector Tabs Section -->
        <div class="scenario-inspector-section">
          <div class="tab-bar">
            <button class="tab-btn ${activeRightTab === "cascade" ? "active" : ""}" data-tab="cascade">
              Impacted (${activeSim.blastRadiusNodes.length})
            </button>
            <button class="tab-btn ${activeRightTab === "bottlenecks" ? "active" : ""}" data-tab="bottlenecks">
              Blockers (${activeSim.topBottlenecks.length})
            </button>
            <button class="tab-btn ${activeRightTab === "governance" ? "active" : ""}" data-tab="governance">
              Delivery Health
            </button>
            <button class="tab-btn ${activeRightTab === "rovo-mcp" ? "active" : ""}" data-tab="rovo-mcp">
              AI Action Plan
            </button>
          </div>
          <div class="tab-body">
            ${renderTabBody(props)}
          </div>
        </div>
      </div>
    </div>
  `;
  }

  // src/cockpit.ts
  var DEFAULT_COLUMN_ORDER = ["left-rail", "center-stage", "scenario"];
  var DEFAULT_CENTER_ORDER = ["dag", "scrubber"];
  var LAYOUT_STORAGE_KEY = "pwm_cockpit_layout_v1";
  function loadSavedLayout() {
    try {
      const raw = window.localStorage?.getItem(LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validCols = Array.isArray(parsed.columnOrder) && parsed.columnOrder.length === 3 && DEFAULT_COLUMN_ORDER.every((c) => parsed.columnOrder.includes(c));
        const validCenter = Array.isArray(parsed.centerOrder) && parsed.centerOrder.length === 2 && DEFAULT_CENTER_ORDER.every((c) => parsed.centerOrder.includes(c));
        if (validCols && validCenter) {
          return {
            columnOrder: [...parsed.columnOrder],
            centerOrder: [...parsed.centerOrder]
          };
        }
      }
    } catch {
    }
    return {
      columnOrder: [...DEFAULT_COLUMN_ORDER],
      centerOrder: [...DEFAULT_CENTER_ORDER]
    };
  }
  function persistSavedLayout(columnOrder, centerOrder) {
    try {
      window.localStorage?.setItem(
        LAYOUT_STORAGE_KEY,
        JSON.stringify({ columnOrder, centerOrder })
      );
    } catch {
    }
  }
  function isCustomCockpitLayout(columnOrder, centerOrder) {
    return columnOrder.join(",") !== DEFAULT_COLUMN_ORDER.join(",") || centerOrder.join(",") !== DEFAULT_CENTER_ORDER.join(",");
  }
  function getGridColsModifierClass(order) {
    switch (order.join("_")) {
      case "scenario_center-stage_left-rail":
        return "cols-right-center-left";
      case "left-rail_scenario_center-stage":
        return "cols-left-right-center";
      case "scenario_left-rail_center-stage":
        return "cols-right-left-center";
      case "center-stage_left-rail_scenario":
        return "cols-center-left-right";
      case "center-stage_scenario_left-rail":
        return "cols-center-right-left";
      default:
        return "cols-left-center-right";
    }
  }
  var initialLayout = loadSavedLayout();
  async function invokeForgeResolver(functionKey, payload = {}) {
    try {
      const win = window;
      if (win.__forgeBridge && typeof win.__forgeBridge.invoke === "function") {
        return await win.__forgeBridge.invoke(functionKey, payload);
      }
      return await (0, import_bridge.invoke)(functionKey, payload) ?? null;
    } catch {
      return null;
    }
  }
  function createInitialConnectingGraph() {
    const todayIso = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const dag = buildDAGFromJiraIssues("SYNC", [], [], [], todayIso);
    return {
      ...dag,
      projectName: "Connecting to Jira...",
      isSyntheticDemo: false
    };
  }
  function pickDefaultAssignee(graph) {
    const counts = /* @__PURE__ */ new Map();
    for (const node of graph.nodes) {
      const a = node.assignee || "Unassigned";
      counts.set(a, (counts.get(a) ?? 0) + (node.status.toLowerCase() === "done" ? 0.1 : 1));
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => {
      if (a[0].toLowerCase() === "unassigned") return 1;
      if (b[0].toLowerCase() === "unassigned") return -1;
      return b[1] - a[1];
    });
    return sorted[0]?.[0] ?? "Unassigned";
  }
  var initialGraph = createInitialConnectingGraph();
  var initialBaseline = runMonteCarloSimulation(initialGraph, { iterations: 500 });
  var state = {
    availableProjects: [],
    graph: initialGraph,
    baselineSim: initialBaseline,
    activeSim: initialBaseline,
    intervention: null,
    selectedNodeKey: initialGraph.nodes[0]?.key ?? "",
    delayDays: 0,
    addDeveloper: false,
    decoupleBlockingEdges: false,
    trimScope: false,
    simulatorMode: "issue",
    pinnedNodeOverrides: {},
    selectedAssignee: pickDefaultAssignee(initialGraph),
    assigneeOverrides: {},
    columnOrder: initialLayout.columnOrder,
    centerOrder: initialLayout.centerOrder,
    selectedEpochIndex: 2,
    // Today
    scrubberDayOffset: 0,
    activeRightTab: "cascade",
    copiedPromptNotice: false,
    statusBanner: "Connecting to Jira project via Forge Bridge \u2014 loading issues and dependency links\u2026"
  };
  function getMergedNodeOverrides() {
    const merged = {
      ...state.pinnedNodeOverrides
    };
    if (state.selectedNodeKey && (state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges || state.trimScope)) {
      merged[state.selectedNodeKey] = {
        deltaDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        trimScope: state.trimScope
      };
    }
    return merged;
  }
  function getActiveAssigneeOverrides() {
    const active = {};
    for (const [name, aOv] of Object.entries(state.assigneeOverrides)) {
      const uDays = Number(aOv.unavailableDays ?? 0);
      if (uDays !== 0 || aOv.reassignBottleneck || aOv.serializeParallelWork || aOv.pairOnTopBlocker) {
        active[name] = aOv;
      }
    }
    return active;
  }
  function syncCurrentNodeToPinIfPinned() {
    if (state.selectedNodeKey && state.pinnedNodeOverrides[state.selectedNodeKey]) {
      state.pinnedNodeOverrides[state.selectedNodeKey] = {
        deltaDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        trimScope: state.trimScope
      };
    }
  }
  function switchSelectedIssue(nextKey, autoPinPrevious = false) {
    if (!nextKey) return;
    if (autoPinPrevious && state.selectedNodeKey && state.selectedNodeKey !== nextKey && (state.delayDays !== 0 || state.addDeveloper || state.decoupleBlockingEdges || state.trimScope)) {
      state.pinnedNodeOverrides[state.selectedNodeKey] = {
        deltaDays: state.delayDays,
        addDeveloper: state.addDeveloper,
        decoupleBlockingEdges: state.decoupleBlockingEdges,
        trimScope: state.trimScope
      };
    }
    state.selectedNodeKey = nextKey;
    const existingPin = state.pinnedNodeOverrides[nextKey];
    if (existingPin) {
      state.delayDays = existingPin.deltaDays;
      state.addDeveloper = Boolean(existingPin.addDeveloper);
      state.decoupleBlockingEdges = Boolean(existingPin.decoupleBlockingEdges);
      state.trimScope = Boolean(existingPin.trimScope);
    } else {
      state.delayDays = 0;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.trimScope = false;
    }
    state.copiedPromptNotice = false;
  }
  function getOrCreateAssigneeOverride(name) {
    if (!state.assigneeOverrides[name]) {
      state.assigneeOverrides[name] = {
        assignee: name,
        unavailableDays: 0,
        reassignBottleneck: false,
        serializeParallelWork: false,
        pairOnTopBlocker: false
      };
    }
    return state.assigneeOverrides[name];
  }
  function recomputeSimulation() {
    state.baselineSim = runMonteCarloSimulation(state.graph, { iterations: 500 });
    const mergedNodes = getMergedNodeOverrides();
    const activeAssignees = getActiveAssigneeOverrides();
    const nodeKeys = Object.keys(mergedNodes);
    const assigneeKeys = Object.keys(activeAssignees);
    const hasIntervention = nodeKeys.length > 0 || assigneeKeys.length > 0;
    if (hasIntervention) {
      const primaryKey = (mergedNodes[state.selectedNodeKey] ? state.selectedNodeKey : nodeKeys[0]) || state.selectedNodeKey || state.graph.nodes[0]?.key || "";
      const primaryOv = mergedNodes[primaryKey] ?? { deltaDays: 0 };
      const intResult = runIntervention(
        state.graph,
        primaryKey,
        primaryOv.deltaDays,
        {
          iterations: 500,
          addDeveloper: Boolean(primaryOv.addDeveloper),
          decoupleBlockingEdges: Boolean(primaryOv.decoupleBlockingEdges),
          trimScope: Boolean(primaryOv.trimScope),
          nodeOverrides: mergedNodes,
          assigneeOverrides: activeAssignees
        }
      );
      state.intervention = intResult;
      state.activeSim = intResult;
    } else {
      state.intervention = null;
      state.activeSim = state.baselineSim;
    }
  }
  var activeDraggedPanel = null;
  var didDragDuringPress = false;
  function scrollDagToSelectedNode(smooth = true) {
    const viewport = document.getElementById("dag-viewport-container");
    if (!viewport || !state.selectedNodeKey) return;
    let selectedEl = null;
    viewport.querySelectorAll(".dag-node-group").forEach((el) => {
      if (!selectedEl && el.getAttribute("data-node-key") === state.selectedNodeKey) {
        selectedEl = el;
      }
    });
    if (!selectedEl) return;
    const nodeX = Number(selectedEl.getAttribute("data-node-x") ?? 0);
    const targetLeft = Math.max(0, nodeX - viewport.clientWidth / 2 + 100);
    if (typeof viewport.scrollTo === "function") {
      viewport.scrollTo({
        left: targetLeft,
        behavior: smooth ? "smooth" : "auto"
      });
    } else {
      viewport.scrollLeft = targetLeft;
    }
  }
  function toColumnSlot(panelId) {
    if (panelId === "dag" || panelId === "scrubber") return "center-stage";
    return panelId;
  }
  function swapPanels(sourcePanel, targetPanel) {
    if (sourcePanel === targetPanel) return;
    if (sourcePanel === "dag" && targetPanel === "scrubber" || sourcePanel === "scrubber" && targetPanel === "dag") {
      state.centerOrder = [state.centerOrder[1], state.centerOrder[0]];
      persistSavedLayout(state.columnOrder, state.centerOrder);
      state.statusBanner = "Swapped Issue Dependency Map and Timeline Scrubber positions (saved).";
      renderCockpit();
      return;
    }
    const srcCol = toColumnSlot(sourcePanel);
    const dstCol = toColumnSlot(targetPanel);
    if (srcCol === dstCol) return;
    const nextCols = [...state.columnOrder];
    const srcIdx = nextCols.indexOf(srcCol);
    const dstIdx = nextCols.indexOf(dstCol);
    if (srcIdx === -1 || dstIdx === -1) return;
    nextCols[srcIdx] = dstCol;
    nextCols[dstIdx] = srcCol;
    state.columnOrder = nextCols;
    persistSavedLayout(state.columnOrder, state.centerOrder);
    state.statusBanner = "Panel layout updated \u2014 drag any top-corner \u283F\u21C4 icon to move panels or click \u21C4 Reset Layout.";
    renderCockpit();
  }
  function renderCockpit(activeSliderId) {
    const root = document.getElementById("app-root");
    if (!root) return;
    const dagViewport = document.getElementById("dag-viewport-container");
    const prevDagScrollLeft = dagViewport?.scrollLeft ?? 0;
    const prevDagScrollTop = dagViewport?.scrollTop ?? 0;
    const mergedNodes = getMergedNodeOverrides();
    const activeAssignees = getActiveAssigneeOverrides();
    const hasAnyIntervention = Object.keys(mergedNodes).length > 0 || Object.keys(activeAssignees).length > 0;
    const isCustomLayout = isCustomCockpitLayout(state.columnOrder, state.centerOrder);
    const headerProps = {
      availableProjects: state.availableProjects,
      graph: state.graph,
      baselineSim: state.baselineSim,
      activeSim: state.activeSim,
      intervention: state.intervention,
      selectedNodeKey: state.selectedNodeKey,
      delayDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      hasAnyIntervention,
      isCustomLayout,
      statusBanner: state.statusBanner
    };
    const headerHtml = renderTopAppBar(headerProps);
    const leftRailHtml = renderLeftStatusRail(headerProps);
    const scrubberHtml = renderTimelineScrubber({
      graph: state.graph,
      activeSim: state.activeSim,
      selectedEpochIndex: state.selectedEpochIndex,
      scrubberDayOffset: state.scrubberDayOffset,
      hasActiveIntervention: hasAnyIntervention
    });
    const dagHtml = renderDagCanvas({
      graph: state.graph,
      activeSim: state.activeSim,
      selectedNodeKey: state.selectedNodeKey,
      delayDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      trimScope: state.trimScope,
      scrubberDayOffset: state.scrubberDayOffset,
      simulatorMode: state.simulatorMode,
      pinnedNodeOverrides: state.pinnedNodeOverrides,
      selectedAssignee: state.selectedAssignee,
      assigneeOverrides: state.assigneeOverrides
    });
    const scenarioHtml = renderScenarioPanel({
      graph: state.graph,
      baselineSim: state.baselineSim,
      activeSim: state.activeSim,
      intervention: state.intervention,
      selectedNodeKey: state.selectedNodeKey,
      delayDays: state.delayDays,
      addDeveloper: state.addDeveloper,
      decoupleBlockingEdges: state.decoupleBlockingEdges,
      trimScope: state.trimScope,
      simulatorMode: state.simulatorMode,
      pinnedNodeOverrides: state.pinnedNodeOverrides,
      selectedAssignee: state.selectedAssignee,
      assigneeOverrides: state.assigneeOverrides,
      activeRightTab: state.activeRightTab,
      copiedPromptNotice: state.copiedPromptNotice
    });
    const headerMount = document.getElementById("header-mount");
    const leftRailMount = document.getElementById("left-rail-mount");
    const scrubberMount = document.getElementById("scrubber-mount");
    const dagMount = document.getElementById("dag-mount");
    const scenarioMount = document.getElementById("scenario-mount");
    if (activeSliderId && headerMount && leftRailMount && scrubberMount && dagMount && scenarioMount) {
      headerMount.innerHTML = headerHtml;
      leftRailMount.innerHTML = leftRailHtml;
      dagMount.innerHTML = dagHtml;
      const nextViewport = document.getElementById("dag-viewport-container");
      if (nextViewport) {
        nextViewport.scrollLeft = prevDagScrollLeft;
        nextViewport.scrollTop = prevDagScrollTop;
      }
      if (activeSliderId === "delay-slider-input" || activeSliderId === "person-pto-slider-input") {
        scrubberMount.innerHTML = scrubberHtml;
        const tmp = document.createElement("div");
        tmp.innerHTML = scenarioHtml;
        const curLozenge = scenarioMount.querySelector(".panel-header .jira-lozenge");
        const nextLozenge = tmp.querySelector(".panel-header .jira-lozenge");
        if (curLozenge && nextLozenge) curLozenge.replaceWith(nextLozenge);
        const curStack = scenarioMount.querySelector(".scenario-stack-bar");
        const nextStack = tmp.querySelector(".scenario-stack-bar");
        if (curStack && nextStack) curStack.innerHTML = nextStack.innerHTML;
        const curCompare = scenarioMount.querySelector(".comparison-bars-card");
        const nextCompare = tmp.querySelector(".comparison-bars-card");
        if (curCompare && nextCompare) curCompare.innerHTML = nextCompare.innerHTML;
        const curTabs = scenarioMount.querySelector(".tab-bar");
        const nextTabs = tmp.querySelector(".tab-bar");
        if (curTabs && nextTabs) curTabs.innerHTML = nextTabs.innerHTML;
        const curTabBody = scenarioMount.querySelector(".tab-body");
        const nextTabBody = tmp.querySelector(".tab-body");
        if (curTabBody && nextTabBody) curTabBody.innerHTML = nextTabBody.innerHTML;
        if (activeSliderId === "delay-slider-input") {
          const readoutEl = scenarioMount.querySelector(".slider-readout");
          if (readoutEl) {
            readoutEl.textContent = state.delayDays > 0 ? `+${state.delayDays} Days Delay` : state.delayDays < 0 ? `${state.delayDays} Days Faster` : "0 Days (Baseline)";
            readoutEl.className = `slider-readout ${state.delayDays < 0 ? "accel-text" : state.delayDays === 0 ? "neutral-text" : ""}`;
          }
          scenarioMount.querySelectorAll("[data-preset-delay]").forEach((btn) => {
            const d = Number(btn.getAttribute("data-preset-delay") ?? 0);
            btn.classList.toggle("active", d === state.delayDays);
          });
        } else {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          const ptoDays = Number(pOv.unavailableDays ?? 0);
          const readoutEl = scenarioMount.querySelector(".slider-readout");
          if (readoutEl) {
            readoutEl.textContent = ptoDays > 0 ? `+${ptoDays} Days Away` : ptoDays < 0 ? `${ptoDays} Days Focus Gain` : "0 Days (Normal Capacity)";
            readoutEl.className = `slider-readout ${ptoDays < 0 ? "accel-text" : ptoDays === 0 ? "neutral-text" : ""}`;
          }
          scenarioMount.querySelectorAll("[data-preset-pto]").forEach((btn) => {
            const d = Number(btn.getAttribute("data-preset-pto") ?? 0);
            btn.classList.toggle("active", d === ptoDays);
          });
        }
      } else if (activeSliderId === "time-machine-range") {
        scenarioMount.innerHTML = scenarioHtml;
        scrubberMount.querySelectorAll("[data-epoch-idx]").forEach((btn) => {
          const idx = Number(btn.getAttribute("data-epoch-idx") ?? -1);
          btn.classList.toggle("active", idx === state.selectedEpochIndex);
        });
      }
      attachCockpitEventListeners(activeSliderId);
      return;
    }
    const centerSlotMarkup = {
      dag: `<div id="dag-mount" class="mount-contents">${dagHtml}</div>`,
      scrubber: `<div id="scrubber-mount" class="mount-contents">${scrubberHtml}</div>`
    };
    const centerStageHtml = `
    <div class="center-stage-column">
      ${state.centerOrder.map((slotId) => centerSlotMarkup[slotId]).join("")}
    </div>
  `;
    const colSlotMarkup = {
      "left-rail": `<div id="left-rail-mount" class="mount-contents">${leftRailHtml}</div>`,
      "center-stage": centerStageHtml,
      scenario: `<div id="scenario-mount" class="mount-contents">${scenarioHtml}</div>`
    };
    root.innerHTML = `
    <div class="cockpit-shell">
      <div id="header-mount" class="mount-contents">${headerHtml}</div>
      <section class="workspace-grid-3col ${getGridColsModifierClass(state.columnOrder)}">
        ${state.columnOrder.map((colId) => colSlotMarkup[colId]).join("")}
      </section>
    </div>
  `;
    const restoredViewport = document.getElementById("dag-viewport-container");
    if (restoredViewport) {
      if (prevDagScrollLeft > 0) restoredViewport.scrollLeft = prevDagScrollLeft;
      if (prevDagScrollTop > 0) restoredViewport.scrollTop = prevDagScrollTop;
    }
    attachCockpitEventListeners();
  }
  async function loadJiraProjectGraph(projectKey) {
    const remoteData = await invokeForgeResolver("getGraphData", projectKey ? { projectKey } : {});
    if (remoteData?.availableProjects && remoteData.availableProjects.length > 0) {
      state.availableProjects = remoteData.availableProjects;
    }
    if (remoteData?.graph && remoteData.graph.nodes) {
      state.graph = remoteData.graph;
      state.selectedNodeKey = remoteData.graph.nodes[0]?.key ?? "";
      state.delayDays = 0;
      state.addDeveloper = false;
      state.decoupleBlockingEdges = false;
      state.trimScope = false;
      state.pinnedNodeOverrides = {};
      state.assigneeOverrides = {};
      state.selectedAssignee = pickDefaultAssignee(state.graph);
      recomputeSimulation();
      state.statusBanner = state.graph.nodes.length === 0 ? `Project "${state.graph.projectName}" (${state.graph.projectKey}) has 0 issues. Click + Add Sample Issues to populate sample tasks.` : `Loaded live Jira project "${state.graph.projectName}" (${state.graph.projectKey}) with ${state.graph.nodes.length} ${state.graph.nodes.length === 1 ? "issue" : "issues"}.`;
      renderCockpit();
    } else {
      state.statusBanner = projectKey ? `Unable to load Jira project "${projectKey}" \u2014 verify Jira Browse permissions or click Sync Jira Project.` : "Unable to load Jira project via Forge Bridge \u2014 click Sync Jira Project to retry.";
      renderCockpit();
    }
  }
  function attachCockpitEventListeners(skipMountForSlider) {
    const projectSelect = document.getElementById(
      "jira-project-select"
    );
    if (projectSelect) {
      projectSelect.addEventListener("change", async () => {
        const nextKey = projectSelect.value;
        state.statusBanner = `Switching to Jira project ${nextKey}\u2026`;
        renderCockpit();
        await loadJiraProjectGraph(nextKey);
      });
    }
    const hoverCard = document.getElementById("dag-node-hover-card");
    const viewportContainer = document.getElementById("dag-viewport-container");
    const btnPanLeft = document.getElementById("btn-dag-pan-left");
    if (btnPanLeft && viewportContainer) {
      btnPanLeft.addEventListener("click", () => {
        viewportContainer.scrollBy({ left: -340, behavior: "smooth" });
      });
    }
    const btnPanRight = document.getElementById("btn-dag-pan-right");
    if (btnPanRight && viewportContainer) {
      btnPanRight.addEventListener("click", () => {
        viewportContainer.scrollBy({ left: 340, behavior: "smooth" });
      });
    }
    const btnCenterSelected = document.getElementById("btn-dag-center-selected");
    if (btnCenterSelected) {
      btnCenterSelected.addEventListener("click", () => {
        scrollDagToSelectedNode(true);
      });
    }
    const issueJumpSelect = document.getElementById(
      "dag-issue-jump-select"
    );
    if (issueJumpSelect) {
      issueJumpSelect.addEventListener("change", () => {
        const nextKey = issueJumpSelect.value;
        if (nextKey) {
          switchSelectedIssue(nextKey);
          state.simulatorMode = "issue";
          recomputeSimulation();
          renderCockpit();
          scrollDagToSelectedNode(true);
        }
      });
    }
    document.querySelectorAll(".dag-node-group").forEach((el) => {
      el.addEventListener("click", (event) => {
        const key = el.getAttribute("data-node-key");
        if (key) {
          switchSelectedIssue(key, event.shiftKey);
          state.simulatorMode = "issue";
          recomputeSimulation();
          renderCockpit();
        }
      });
      el.addEventListener("mouseenter", () => {
        if (!hoverCard) return;
        const rawHover = el.getAttribute("data-node-hover");
        if (!rawHover) return;
        try {
          const info = JSON.parse(rawHover);
          const blockedByStr = info.blockedByKeys && info.blockedByKeys.length > 0 ? info.blockedByKeys.join(", ") : "None";
          const blocksStr = info.blocksKeys && info.blocksKeys.length > 0 ? info.blocksKeys.join(", ") : "None";
          const shiftLine = info.rippleShift > 0 ? `<strong class="text-danger">+${info.rippleShift.toFixed(1)}d downstream slip</strong>` : info.rippleShift < 0 ? `<strong class="text-success">${info.rippleShift.toFixed(1)}d faster</strong>` : `<span class="text-muted">On Baseline Schedule</span>`;
          const floatDays = info.totalFloatDays ?? 0;
          const floatBadge = floatDays < 0 ? `<strong class="text-danger">${floatDays.toFixed(1)}d (Super-Critical)</strong>` : floatDays === 0 ? `<strong class="text-warning">0.0d (Critical Path)</strong>` : `<strong class="text-success">+${floatDays.toFixed(1)}d Slack</strong>`;
          const stepPct = info.completionStepPct ?? 0;
          const stepLabel = info.subtaskLabel ?? (stepPct === 75 ? "75% (Awaiting Handoff)" : stepPct === 100 ? "100% (Accepted)" : `${stepPct}%`);
          hoverCard.innerHTML = `
          <div class="hover-card-header">
            <span class="hover-card-key">${escapeHtmlText(info.key)}${info.isStageGate ? " \xB7 STAGE GATE" : ""}</span>
            <span class="jira-lozenge jira-lozenge-todo">${escapeHtmlText(info.status.toUpperCase())}</span>
          </div>
          <div class="hover-card-title">${escapeHtmlText(info.summary)}</div>
          <div class="hover-card-meta">
            <div><span>Assignee:</span> <strong>${escapeHtmlText(info.assignee)}</strong></div>
            <div><span>Overall Progress:</span> <strong>${escapeHtmlText(stepLabel)}</strong></div>
            <div><span>Projected Finish:</span> <strong>${escapeHtmlText(info.p85Date)}</strong></div>
            <div><span>Deadline Float:</span> ${floatBadge}</div>
            <div><span>Schedule Impact:</span> ${shiftLine}</div>
            <div><span>Blocked by:</span> <strong>${escapeHtmlText(blockedByStr)}</strong></div>
            <div><span>Blocks:</span> <strong>${escapeHtmlText(blocksStr)}</strong></div>
            <div><span>Linked Goal:</span> <strong>${escapeHtmlText(info.goalName)}</strong></div>
          </div>
          ${info.adr ? `<div class="hover-card-adr">\u{1F4C4} ${escapeHtmlText(info.adr)}</div>` : ""}
          <div class="hover-card-math">
            \u{1F4D0} <code>Expected: ${(info.pertMean ?? info.estimateDays).toFixed(1)}d (\xB1${(info.pertSigma ?? info.sigma).toFixed(1)}d) | Critical Path Risk: ${info.criticalityPct}%</code>
          </div>
          <div class="hover-card-tip">Click issue card to select &amp; simulate</div>
        `;
          hoverCard.classList.add("is-visible");
        } catch {
        }
      });
      el.addEventListener("mouseleave", () => {
        if (hoverCard) {
          hoverCard.classList.remove("is-visible");
        }
      });
    });
    document.querySelectorAll("[data-focus-pin]").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        const target = e.target;
        if (target?.closest("[data-unpin-node]")) return;
        const key = chip.getAttribute("data-focus-pin");
        if (key) {
          switchSelectedIssue(key);
          state.simulatorMode = "issue";
          recomputeSimulation();
          renderCockpit();
          scrollDagToSelectedNode(true);
        }
      });
    });
    document.querySelectorAll("[data-unpin-node]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.getAttribute("data-unpin-node");
        if (key && state.pinnedNodeOverrides[key]) {
          delete state.pinnedNodeOverrides[key];
          if (state.selectedNodeKey === key) {
            state.delayDays = 0;
            state.addDeveloper = false;
            state.decoupleBlockingEdges = false;
            state.trimScope = false;
          }
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        }
      });
    });
    document.querySelectorAll("[data-focus-person]").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        const target = e.target;
        if (target?.closest("[data-clear-person]")) return;
        const name = chip.getAttribute("data-focus-person");
        if (name) {
          state.selectedAssignee = name;
          state.simulatorMode = "person";
          renderCockpit();
        }
      });
    });
    document.querySelectorAll("[data-clear-person]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = btn.getAttribute("data-clear-person");
        if (name && state.assigneeOverrides[name]) {
          delete state.assigneeOverrides[name];
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        }
      });
    });
    const btnClearStack = document.getElementById("btn-clear-scenario-stack");
    if (btnClearStack) {
      btnClearStack.addEventListener("click", () => {
        state.pinnedNodeOverrides = {};
        state.assigneeOverrides = {};
        state.delayDays = 0;
        state.addDeveloper = false;
        state.decoupleBlockingEdges = false;
        state.trimScope = false;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }
    const btnCopyRovo = document.getElementById("btn-copy-rovo-prompt");
    if (btnCopyRovo) {
      btnCopyRovo.addEventListener("click", async () => {
        const promptText = buildRovoMitigationPrompt({
          graph: state.graph,
          baselineSim: state.baselineSim,
          activeSim: state.activeSim,
          intervention: state.intervention,
          selectedNodeKey: state.selectedNodeKey,
          delayDays: state.delayDays,
          addDeveloper: state.addDeveloper,
          decoupleBlockingEdges: state.decoupleBlockingEdges,
          trimScope: state.trimScope,
          simulatorMode: state.simulatorMode,
          pinnedNodeOverrides: state.pinnedNodeOverrides,
          selectedAssignee: state.selectedAssignee,
          assigneeOverrides: state.assigneeOverrides,
          activeRightTab: state.activeRightTab,
          copiedPromptNotice: state.copiedPromptNotice
        });
        let copied = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(promptText);
            copied = true;
          }
        } catch {
          copied = false;
        }
        if (!copied && typeof document.execCommand === "function") {
          try {
            const ta = document.createElement("textarea");
            ta.value = promptText;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            copied = document.execCommand("copy");
            document.body.removeChild(ta);
          } catch {
            copied = false;
          }
        }
        state.copiedPromptNotice = copied;
        state.statusBanner = copied ? `Copied Rovo Prompt \u2014 open Rovo Chat in Jira and paste to ask @Rovo-World-Model Agent!` : `Clipboard write blocked by iframe policy \u2014 prompt ready in Rovo Chat.`;
        renderCockpit();
      });
    }
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        if (tab) {
          state.activeRightTab = tab;
          renderCockpit();
        }
      });
    });
    document.querySelectorAll("[data-select-node]").forEach((row) => {
      row.addEventListener("click", () => {
        const key = row.getAttribute("data-select-node");
        if (key) {
          switchSelectedIssue(key);
          state.simulatorMode = "issue";
          recomputeSimulation();
          renderCockpit();
          scrollDagToSelectedNode(true);
        }
      });
    });
    const btnPinCurrent = document.getElementById("btn-pin-current-issue");
    if (btnPinCurrent) {
      btnPinCurrent.addEventListener("click", () => {
        if (state.pinnedNodeOverrides[state.selectedNodeKey]) {
          delete state.pinnedNodeOverrides[state.selectedNodeKey];
        } else {
          state.pinnedNodeOverrides[state.selectedNodeKey] = {
            deltaDays: state.delayDays,
            addDeveloper: state.addDeveloper,
            decoupleBlockingEdges: state.decoupleBlockingEdges,
            trimScope: state.trimScope
          };
        }
        state.copiedPromptNotice = false;
        recomputeSimulation();
        renderCockpit();
      });
    }
    if (skipMountForSlider !== "delay-slider-input" && skipMountForSlider !== "person-pto-slider-input") {
      document.querySelectorAll("[data-sim-mode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextMode = btn.getAttribute("data-sim-mode");
          if (nextMode && nextMode !== state.simulatorMode) {
            state.simulatorMode = nextMode;
            if (nextMode === "person" && !state.selectedAssignee) {
              state.selectedAssignee = pickDefaultAssignee(state.graph);
            }
            renderCockpit();
          }
        });
      });
      const delaySlider = document.getElementById(
        "delay-slider-input"
      );
      if (delaySlider) {
        delaySlider.addEventListener("input", () => {
          state.delayDays = Number(delaySlider.value);
          syncCurrentNodeToPinIfPinned();
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit("delay-slider-input");
        });
        delaySlider.addEventListener("change", () => {
          syncCurrentNodeToPinIfPinned();
          renderCockpit();
        });
      }
      document.querySelectorAll("[data-preset-delay]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.delayDays = Number(btn.getAttribute("data-preset-delay") ?? 0);
          syncCurrentNodeToPinIfPinned();
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      });
      const btnAddDev = document.getElementById("btn-toggle-add-dev");
      if (btnAddDev) {
        btnAddDev.addEventListener("click", () => {
          state.addDeveloper = !state.addDeveloper;
          syncCurrentNodeToPinIfPinned();
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
      const btnDecouple = document.getElementById("btn-toggle-decouple-edge");
      if (btnDecouple) {
        btnDecouple.addEventListener("click", () => {
          state.decoupleBlockingEdges = !state.decoupleBlockingEdges;
          syncCurrentNodeToPinIfPinned();
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
      const btnTrimScope = document.getElementById("btn-toggle-trim-scope");
      if (btnTrimScope) {
        btnTrimScope.addEventListener("click", () => {
          state.trimScope = !state.trimScope;
          syncCurrentNodeToPinIfPinned();
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
      document.querySelectorAll("[data-select-assignee]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.getAttribute("data-select-assignee");
          if (name) {
            state.selectedAssignee = name;
            state.copiedPromptNotice = false;
            renderCockpit();
          }
        });
      });
      const ptoSlider = document.getElementById(
        "person-pto-slider-input"
      );
      if (ptoSlider) {
        ptoSlider.addEventListener("input", () => {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          pOv.unavailableDays = Number(ptoSlider.value);
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit("person-pto-slider-input");
        });
        ptoSlider.addEventListener("change", () => {
          renderCockpit();
        });
      }
      document.querySelectorAll("[data-preset-pto]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          pOv.unavailableDays = Number(btn.getAttribute("data-preset-pto") ?? 0);
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      });
      const btnPersonReassign = document.getElementById("btn-person-reassign");
      if (btnPersonReassign) {
        btnPersonReassign.addEventListener("click", () => {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          pOv.reassignBottleneck = !pOv.reassignBottleneck;
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
      const btnPersonSerialize = document.getElementById("btn-person-serialize");
      if (btnPersonSerialize) {
        btnPersonSerialize.addEventListener("click", () => {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          pOv.serializeParallelWork = !pOv.serializeParallelWork;
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
      const btnPersonPair = document.getElementById("btn-person-pair");
      if (btnPersonPair) {
        btnPersonPair.addEventListener("click", () => {
          const pOv = getOrCreateAssigneeOverride(state.selectedAssignee);
          pOv.pairOnTopBlocker = !pOv.pairOnTopBlocker;
          state.copiedPromptNotice = false;
          recomputeSimulation();
          renderCockpit();
        });
      }
    }
    if (skipMountForSlider !== "time-machine-range") {
      document.querySelectorAll("[data-epoch-idx]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-epoch-idx") ?? 2);
          state.selectedEpochIndex = idx;
          const ep = state.activeSim.timeMachineEpochs[idx];
          if (ep) {
            state.scrubberDayOffset = ep.dayOffset;
          }
          renderCockpit();
        });
      });
      const tmSlider = document.getElementById(
        "time-machine-range"
      );
      if (tmSlider) {
        tmSlider.addEventListener("input", () => {
          const val = Number(tmSlider.value);
          state.scrubberDayOffset = val;
          let bestIdx = 0;
          let bestDist = Infinity;
          state.activeSim.timeMachineEpochs.forEach((ep, idx) => {
            const d = Math.abs(ep.dayOffset - val);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = idx;
            }
          });
          state.selectedEpochIndex = bestIdx;
          renderCockpit("time-machine-range");
        });
        tmSlider.addEventListener("change", () => {
          renderCockpit();
        });
      }
    }
    const btnSyncJira = document.getElementById("btn-sync-jira");
    if (btnSyncJira) {
      btnSyncJira.addEventListener("click", async () => {
        state.statusBanner = `Syncing live issues from Jira project ${state.graph.projectKey}\u2026`;
        renderCockpit();
        await loadJiraProjectGraph(state.graph.projectKey);
      });
    }
    const btnCreateIssues = document.getElementById("btn-create-jira-issues");
    if (btnCreateIssues) {
      btnCreateIssues.addEventListener("click", async () => {
        state.statusBanner = `Creating linked issues in Jira project ${state.graph.projectKey} via REST API\u2026`;
        renderCockpit();
        const res = await invokeForgeResolver("createRealJiraIssues", { projectKey: state.graph.projectKey });
        if (res?.graph && res.graph.nodes.length >= 1) {
          state.graph = res.graph;
          state.selectedNodeKey = res.graph.nodes[0].key;
          recomputeSimulation();
        }
        state.statusBanner = res?.seedReport?.message ?? `Synced issues for project ${state.graph.projectKey}.`;
        renderCockpit();
      });
    }
    const btnBottleneck = document.getElementById("btn-jump-bottleneck");
    if (btnBottleneck) {
      btnBottleneck.addEventListener("click", () => {
        const topKey = state.activeSim.topBottlenecks[0]?.key ?? state.graph.nodes[0]?.key ?? "";
        if (!topKey) return;
        switchSelectedIssue(topKey);
        state.simulatorMode = "issue";
        if (state.delayDays === 0) state.delayDays = 5;
        syncCurrentNodeToPinIfPinned();
        recomputeSimulation();
        state.statusBanner = `Focused #1 Critical Blocker (${topKey}) \u2014 simulating a +${state.delayDays} day delay.`;
        renderCockpit();
        scrollDagToSelectedNode(true);
      });
    }
    const btnReset = document.getElementById("btn-reset-sim");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        state.delayDays = 0;
        state.addDeveloper = false;
        state.decoupleBlockingEdges = false;
        state.trimScope = false;
        state.pinnedNodeOverrides = {};
        state.assigneeOverrides = {};
        state.scrubberDayOffset = 0;
        state.selectedEpochIndex = 2;
        state.copiedPromptNotice = false;
        recomputeSimulation();
        state.statusBanner = "What-If changes cleared \u2014 viewing baseline schedule for " + state.graph.projectName + ".";
        renderCockpit();
      });
    }
    const btnResetLayout = document.getElementById("btn-reset-layout");
    if (btnResetLayout) {
      btnResetLayout.addEventListener("click", () => {
        state.columnOrder = [...DEFAULT_COLUMN_ORDER];
        state.centerOrder = [...DEFAULT_CENTER_ORDER];
        persistSavedLayout(state.columnOrder, state.centerOrder);
        state.statusBanner = "Restored default 3-column cockpit layout.";
        renderCockpit();
      });
    }
    const shellEl = document.querySelector(".cockpit-shell");
    document.querySelectorAll("[data-drag-panel]").forEach((handle) => {
      if (handle.dataset.dndBound === "1") return;
      handle.dataset.dndBound = "1";
      handle.addEventListener("dragstart", (event) => {
        const panelId = handle.getAttribute("data-drag-panel");
        if (!panelId) return;
        activeDraggedPanel = panelId;
        didDragDuringPress = true;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", panelId);
          const ownerZone = handle.closest("[data-drop-zone]");
          if (ownerZone && typeof event.dataTransfer.setDragImage === "function") {
            event.dataTransfer.setDragImage(ownerZone, 40, 24);
          }
        }
        handle.closest("[data-drop-zone]")?.classList.add("is-dragging-source");
        shellEl?.classList.add("cockpit-dragging-active");
      });
      handle.addEventListener("dragend", () => {
        activeDraggedPanel = null;
        setTimeout(() => {
          didDragDuringPress = false;
        }, 60);
        shellEl?.classList.remove("cockpit-dragging-active");
        document.querySelectorAll(".is-dragging-source, .is-drop-target-hover").forEach((el) => el.classList.remove("is-dragging-source", "is-drop-target-hover"));
      });
      handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (didDragDuringPress) return;
        const panelId = handle.getAttribute("data-drag-panel");
        if (!panelId) return;
        if (panelId === "left-rail") {
          swapPanels("left-rail", "scenario");
        } else if (panelId === "scenario") {
          swapPanels("scenario", "left-rail");
        } else if (panelId === "dag") {
          swapPanels("dag", "scrubber");
        } else if (panelId === "scrubber") {
          swapPanels("scrubber", "dag");
        }
      });
    });
    document.querySelectorAll("[data-drop-zone]").forEach((zone) => {
      if (zone.dataset.dndBound === "1") return;
      zone.dataset.dndBound = "1";
      zone.addEventListener("dragover", (event) => {
        const targetPanel = zone.getAttribute("data-drop-zone");
        const sourcePanel = activeDraggedPanel || event.dataTransfer?.getData("text/plain");
        if (!targetPanel || !sourcePanel || sourcePanel === targetPanel) return;
        const isVerticalCenterPair = sourcePanel === "dag" && targetPanel === "scrubber" || sourcePanel === "scrubber" && targetPanel === "dag";
        if (!isVerticalCenterPair && toColumnSlot(sourcePanel) === toColumnSlot(targetPanel)) {
          return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }
        zone.classList.add("is-drop-target-hover");
      });
      zone.addEventListener("dragleave", (event) => {
        const related = event.relatedTarget;
        if (!related || !zone.contains(related)) {
          zone.classList.remove("is-drop-target-hover");
        }
      });
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.classList.remove("is-drop-target-hover");
        const targetPanel = zone.getAttribute("data-drop-zone");
        const sourcePanel = activeDraggedPanel || event.dataTransfer?.getData("text/plain");
        activeDraggedPanel = null;
        shellEl?.classList.remove("cockpit-dragging-active");
        if (targetPanel && sourcePanel) {
          swapPanels(sourcePanel, targetPanel);
        }
      });
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const activeEl = document.activeElement;
    const tag = activeEl?.tagName?.toUpperCase();
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || activeEl?.isContentEditable) {
      return;
    }
    if (event.key !== "[" && event.key !== "]") return;
    const order = state.graph.topologicalOrder.length > 0 ? state.graph.topologicalOrder : state.graph.nodes.map((n) => n.key);
    if (order.length === 0) return;
    const curIdx = order.indexOf(state.selectedNodeKey);
    const step = event.key === "[" ? -1 : 1;
    const nextIdx = curIdx < 0 ? 0 : (curIdx + step + order.length) % order.length;
    const nextKey = order[nextIdx];
    if (!nextKey || nextKey === state.selectedNodeKey) return;
    switchSelectedIssue(nextKey);
    state.simulatorMode = "issue";
    recomputeSimulation();
    renderCockpit();
    scrollDagToSelectedNode(true);
  });
  document.addEventListener("DOMContentLoaded", async () => {
    renderCockpit();
    await loadJiraProjectGraph();
  });
})();

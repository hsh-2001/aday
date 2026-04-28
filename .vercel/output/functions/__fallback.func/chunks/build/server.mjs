import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { hasInjectionContext, getCurrentInstance, defineComponent, createElementBlock, useSSRContext, createApp, useModel, mergeProps, mergeModels, computed, unref, isRef, provide, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, shallowReactive, reactive, effectScope, ref, inject, defineAsyncComponent, getCurrentScope, toRef, h, isReadonly, isShallow, isReactive, toRaw } from 'vue';
import { p as parseURL, m as encodePath, n as decodePath, o as hasProtocol, q as isScriptProtocol, k as joinURL, w as withQuery, s as sanitizeStatusCode, t as getContext, $ as $fetch$1, f as createError$1, v as isEqual, x as stringifyParsedURL, y as stringifyQuery, z as parseQuery, A as defu } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderList, ssrLooseContain, ssrLooseEqual, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

function flatHooks(configHooks, hooks = {}, parentName) {
	for (const key in configHooks) {
		const subHook = configHooks[key];
		const name = parentName ? `${parentName}:${key}` : key;
		if (typeof subHook === "object" && subHook !== null) flatHooks(subHook, hooks, name);
		else if (typeof subHook === "function") hooks[name] = subHook;
	}
	return hooks;
}
const createTask = /* @__PURE__ */ (() => {
	if (console.createTask) return console.createTask;
	const defaultTask = { run: (fn) => fn() };
	return () => defaultTask;
})();
function callHooks(hooks, args, startIndex, task) {
	for (let i = startIndex; i < hooks.length; i += 1) try {
		const result = task ? task.run(() => hooks[i](...args)) : hooks[i](...args);
		if (result && typeof result.then === "function") return Promise.resolve(result).then(() => callHooks(hooks, args, i + 1, task));
	} catch (error) {
		return Promise.reject(error);
	}
}
function serialTaskCaller(hooks, args, name) {
	if (hooks.length > 0) return callHooks(hooks, args, 0, createTask(name));
}
function parallelTaskCaller(hooks, args, name) {
	if (hooks.length > 0) {
		const task = createTask(name);
		return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
	}
}
function callEachWith(callbacks, arg0) {
	for (const callback of [...callbacks]) callback(arg0);
}
var Hookable = class {
	_hooks;
	_before;
	_after;
	_deprecatedHooks;
	_deprecatedMessages;
	constructor() {
		this._hooks = {};
		this._before = void 0;
		this._after = void 0;
		this._deprecatedMessages = void 0;
		this._deprecatedHooks = {};
		this.hook = this.hook.bind(this);
		this.callHook = this.callHook.bind(this);
		this.callHookWith = this.callHookWith.bind(this);
	}
	hook(name, function_, options = {}) {
		if (!name || typeof function_ !== "function") return () => {};
		const originalName = name;
		let dep;
		while (this._deprecatedHooks[name]) {
			dep = this._deprecatedHooks[name];
			name = dep.to;
		}
		if (dep && !options.allowDeprecated) {
			let message = dep.message;
			if (!message) message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
			if (!this._deprecatedMessages) this._deprecatedMessages = /* @__PURE__ */ new Set();
			if (!this._deprecatedMessages.has(message)) {
				console.warn(message);
				this._deprecatedMessages.add(message);
			}
		}
		if (!function_.name) try {
			Object.defineProperty(function_, "name", {
				get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
				configurable: true
			});
		} catch {}
		this._hooks[name] = this._hooks[name] || [];
		this._hooks[name].push(function_);
		return () => {
			if (function_) {
				this.removeHook(name, function_);
				function_ = void 0;
			}
		};
	}
	hookOnce(name, function_) {
		let _unreg;
		let _function = (...arguments_) => {
			if (typeof _unreg === "function") _unreg();
			_unreg = void 0;
			_function = void 0;
			return function_(...arguments_);
		};
		_unreg = this.hook(name, _function);
		return _unreg;
	}
	removeHook(name, function_) {
		const hooks = this._hooks[name];
		if (hooks) {
			const index = hooks.indexOf(function_);
			if (index !== -1) hooks.splice(index, 1);
			if (hooks.length === 0) this._hooks[name] = void 0;
		}
	}
	clearHook(name) {
		this._hooks[name] = void 0;
	}
	deprecateHook(name, deprecated) {
		this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
		const _hooks = this._hooks[name] || [];
		this._hooks[name] = void 0;
		for (const hook of _hooks) this.hook(name, hook);
	}
	deprecateHooks(deprecatedHooks) {
		for (const name in deprecatedHooks) this.deprecateHook(name, deprecatedHooks[name]);
	}
	addHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
		return () => {
			for (const unreg of removeFns) unreg();
			removeFns.length = 0;
		};
	}
	removeHooks(configHooks) {
		const hooks = flatHooks(configHooks);
		for (const key in hooks) this.removeHook(key, hooks[key]);
	}
	removeAllHooks() {
		this._hooks = {};
	}
	callHook(name, ...args) {
		return this.callHookWith(serialTaskCaller, name, args);
	}
	callHookParallel(name, ...args) {
		return this.callHookWith(parallelTaskCaller, name, args);
	}
	callHookWith(caller, name, args) {
		const event = this._before || this._after ? {
			name,
			args,
			context: {}
		} : void 0;
		if (this._before) callEachWith(this._before, event);
		const result = caller(this._hooks[name] ? [...this._hooks[name]] : [], args, name);
		if (result instanceof Promise) return result.finally(() => {
			if (this._after && event) callEachWith(this._after, event);
		});
		if (this._after && event) callEachWith(this._after, event);
		return result;
	}
	beforeEach(function_) {
		this._before = this._before || [];
		this._before.push(function_);
		return () => {
			if (this._before !== void 0) {
				const index = this._before.indexOf(function_);
				if (index !== -1) this._before.splice(index, 1);
			}
		};
	}
	afterEach(function_) {
		this._after = this._after || [];
		this._after.push(function_);
		return () => {
			if (this._after !== void 0) {
				const index = this._after.indexOf(function_);
				if (index !== -1) this._after.splice(index, 1);
			}
		};
	}
};
function createHooks() {
	return new Hookable();
}

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    versions: {
      get nuxt() {
        return "4.4.2";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _state: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin) {
    const unresolvedPluginsForThisPlugin = plugin.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin).then(async () => {
        if (plugin._name) {
          resolvedPlugins.add(plugin._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin._name)) {
              dependsOn.delete(plugin._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin);
  }
  for (const plugin of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  const _name = plugin._name || plugin.name;
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = /* @__PURE__ */ Symbol("route");
globalThis._importMeta_.url.replace(/\/app\/.*$/, "/");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext["~renderResponse"] = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  const encodedTo = typeof to === "string" ? encodeRoutePath(to) : to;
  return options?.replace ? router.replace(encodedTo) : router.push(encodedTo);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
function encodeRoutePath(url) {
  const parsed = parseURL(url);
  return encodePath(decodePath(parsed.pathname)) + parsed.search + parsed.hash;
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = /* @__NO_SIDE_EFFECTS__ */ () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const error2 = /* @__PURE__ */ useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  if (typeof error !== "string" && error.statusText) {
    error.message ??= error.statusText;
  }
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  Object.defineProperty(nuxtError, "status", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusCode,
    configurable: true
  });
  Object.defineProperty(nuxtError, "statusText", {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    get: () => nuxtError.statusMessage,
    configurable: true
  });
  return nuxtError;
};
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});
const matcher = (m, p) => {
  return [];
};
const _routeRulesMatcher = (path) => defu({}, ...matcher().map((r) => r.data).reverse());
const routeRulesMatcher = _routeRulesMatcher;
function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  try {
    return routeRulesMatcher(path);
  } catch (e) {
    console.error("[nuxt] Error matching route rules.", e);
    return {};
  }
}
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  const route = fullPath && typeof fullPath === "object" ? fullPath : {};
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: route.params || {},
    name: void 0,
    matched: route.matched || [],
    redirectedFrom: void 0,
    meta: route.meta || {},
    href: fullPath
  };
}
const router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return await handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          const route2 = router.resolve(props.to);
          return props.custom ? slots.default?.({ href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    const initialLayoutProps = nuxtApp.payload.state._layoutProps;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
          to.meta.layoutProps = initialLayoutProps;
        }
        nuxtApp._processingMiddleware = true;
        if (!nuxtApp.ssrContext?.islandContext) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          const routeRules = getRouteRules({ path: to.path });
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              const guard = nuxtApp._middleware.named[key];
              if (!guard) {
                continue;
              }
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(guard);
              } else {
                middlewareEntries.delete(guard);
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  status: 404,
                  statusText: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext["~payloadReducers"][name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  components_plugin_4kY4pyzJIYX99vmMAAIorFf3CnAaptHitJgf7JxiED8
];
const __nuxt_component_0 = defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "AuthPanel",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    error: {},
    loading: { type: Boolean },
    mode: {}
  }, {
    "form": { required: true },
    "formModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["submit", "toggleMode"], ["update:form"]),
  setup(__props) {
    const form = useModel(__props, "form");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "mt-4 grid gap-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm lg:grid-cols-[minmax(220px,0.7fr)_minmax(260px,1fr)] lg:p-6" }, _attrs))}><div class="self-start"><p class="text-xs font-bold uppercase text-primary">Account</p><h2 class="mt-1 text-2xl font-black">${ssrInterpolate(__props.mode === "login" ? "Log in" : "Create account")}</h2><p class="mt-3 max-w-sm text-sm leading-6 text-base-content/70"> Keep your daily expenses tied to one account so totals and entries stay private. </p></div><form class="grid gap-4"><fieldset class="fieldset"><legend class="fieldset-legend">Username</legend><input${ssrRenderAttr("value", form.value.username)} autocomplete="username" class="input w-full" required></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Password</legend><input${ssrRenderAttr("value", form.value.password)}${ssrRenderAttr("autocomplete", __props.mode === "login" ? "current-password" : "new-password")} class="input w-full" minlength="6" required type="password"></fieldset>`);
      if (__props.error) {
        _push(`<div class="alert alert-error py-3 text-sm"><span>${ssrInterpolate(__props.error)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex flex-wrap gap-3"><button type="submit" class="btn btn-primary"${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""}>`);
      if (__props.loading) {
        _push(`<span class="loading loading-spinner loading-sm"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Please wait..." : __props.mode === "login" ? "Log in" : "Register")}</button><button type="button" class="btn btn-ghost">${ssrInterpolate(__props.mode === "login" ? "Need an account?" : "Already registered?")}</button></div></form></section>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AuthPanel.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __nuxt_component_1 = Object.assign(_sfc_main$6, { __name: "AuthPanel" });
const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
};
const formatDateTime = (value) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "SummaryBand",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    entryCount: {},
    totals: {}
  }, {
    "selectedDate": { required: true },
    "selectedDateModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["refresh"], ["update:selectedDate"]),
  setup(__props) {
    const props = __props;
    const dateModel = useModel(__props, "selectedDate");
    const displayTotals = computed(() => {
      if (props.totals.length) {
        return props.totals;
      }
      return [{ currency: "USD", total: 0 }];
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "mt-4 grid gap-4 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm md:grid-cols-[minmax(180px,260px)_1fr]" }, _attrs))}><fieldset class="fieldset"><legend class="fieldset-legend">Date</legend><input${ssrRenderAttr("value", dateModel.value)} class="input w-full" type="date"></fieldset><div class="stats stats-vertical border border-base-300 shadow-none sm:stats-horizontal"><!--[-->`);
      ssrRenderList(unref(displayTotals), (total) => {
        _push(`<div class="stat"><div class="stat-title font-bold">Total spent ${ssrInterpolate(total.currency)}</div><div class="stat-value text-2xl text-primary sm:text-3xl">${ssrInterpolate(unref(formatCurrency)(total.total, total.currency))}</div></div>`);
      });
      _push(`<!--]--><div class="stat"><div class="stat-title font-bold">Entries</div><div class="stat-value">${ssrInterpolate(__props.entryCount)}</div></div></div></section>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SummaryBand.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_2 = Object.assign(_sfc_main$5, { __name: "SummaryBand" });
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "EntryForm",
  __ssrInlineRender: true,
  props: /* @__PURE__ */ mergeModels({
    categories: {},
    categoryLoading: { type: Boolean },
    currencies: {},
    error: {},
    loading: { type: Boolean }
  }, {
    "categoryName": { required: true },
    "categoryNameModifiers": {},
    "form": { required: true },
    "formModifiers": {}
  }),
  emits: /* @__PURE__ */ mergeModels(["addCategory", "submit"], ["update:categoryName", "update:form"]),
  setup(__props) {
    const categoryName = useModel(__props, "categoryName");
    const form = useModel(__props, "form");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<form${ssrRenderAttrs(mergeProps({ class: "grid gap-4 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm" }, _attrs))}><div><p class="text-xs font-bold uppercase text-primary">New Entry</p><h2 class="mt-1 text-xl font-black">Add spending</h2></div><fieldset class="fieldset"><legend class="fieldset-legend">Amount</legend><input${ssrRenderAttr("value", form.value.amount)} class="input w-full" min="0.01" required step="0.01" type="number"></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Currency</legend><select class="select w-full" required><!--[-->`);
      ssrRenderList(__props.currencies, (currency) => {
        _push(`<option${ssrRenderAttr("value", currency.code)}${ssrIncludeBooleanAttr(Array.isArray(form.value.currency) ? ssrLooseContain(form.value.currency, currency.code) : ssrLooseEqual(form.value.currency, currency.code)) ? " selected" : ""}>${ssrInterpolate(currency.label)}</option>`);
      });
      _push(`<!--]--></select></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Category</legend><input${ssrRenderAttr("value", form.value.category)} class="input w-full" list="categories" required><datalist id="categories"><!--[-->`);
      ssrRenderList(__props.categories, (category) => {
        _push(`<option${ssrRenderAttr("value", category)}></option>`);
      });
      _push(`<!--]--></datalist></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Add category</legend><div class="join w-full"><input${ssrRenderAttr("value", categoryName.value)} class="input join-item min-w-0 flex-1" maxlength="48" placeholder="New category" type="text"><button class="btn btn-outline join-item"${ssrIncludeBooleanAttr(__props.categoryLoading || !categoryName.value.trim()) ? " disabled" : ""} type="button">`);
      if (__props.categoryLoading) {
        _push(`<span class="loading loading-spinner loading-xs"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` Add </button></div></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Time</legend><input${ssrRenderAttr("value", form.value.spentAt)} class="input w-full" type="datetime-local"></fieldset><fieldset class="fieldset"><legend class="fieldset-legend">Note</legend><textarea class="textarea min-h-24 w-full resize-y" rows="3">${ssrInterpolate(form.value.note)}</textarea></fieldset>`);
      if (__props.error) {
        _push(`<div class="alert alert-error py-3 text-sm"><span>${ssrInterpolate(__props.error)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit" class="btn btn-primary"${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""}>`);
      if (__props.loading) {
        _push(`<span class="loading loading-spinner loading-sm"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Saving..." : "Save entry")}</button></form>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EntryForm.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_3 = Object.assign(_sfc_main$4, { __name: "EntryForm" });
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "EntriesPanel",
  __ssrInlineRender: true,
  props: {
    dailyUsage: {},
    loading: { type: Boolean },
    selectedDate: {}
  },
  emits: ["delete", "refresh"],
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "rounded-box border border-base-300 bg-base-100 p-5 shadow-sm" }, _attrs))}><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase text-primary">Daily Usage</p><h2 class="mt-1 text-xl font-black">${ssrInterpolate(__props.dailyUsage?.date || __props.selectedDate)}</h2></div><button type="button" class="btn btn-outline btn-sm"${ssrIncludeBooleanAttr(__props.loading) ? " disabled" : ""}>`);
      if (__props.loading) {
        _push(`<span class="loading loading-spinner loading-xs"></span>`);
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(__props.loading ? "Loading..." : "Refresh")}</button></div>`);
      if (__props.dailyUsage?.entries.length) {
        _push(`<ul class="grid gap-3"><!--[-->`);
        ssrRenderList(__props.dailyUsage.entries, (entry2) => {
          _push(`<li class="rounded-box border border-base-300 bg-base-200/45 p-4"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><strong class="text-base font-black">${ssrInterpolate(entry2.category)}</strong><span class="badge badge-ghost">${ssrInterpolate(unref(formatDateTime)(entry2.spentAt))}</span></div>`);
          if (entry2.note) {
            _push(`<p class="mt-2 text-sm leading-6 text-base-content/70">${ssrInterpolate(entry2.note)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end"><strong class="text-lg font-black text-primary">${ssrInterpolate(unref(formatCurrency)(entry2.amount, entry2.currency))}</strong><button type="button" class="btn btn-error btn-outline btn-xs">Delete</button></div></div></li>`);
        });
        _push(`<!--]--></ul>`);
      } else {
        _push(`<div class="rounded-box border border-dashed border-base-300 bg-base-200/45 p-8 text-center text-base-content/70">`);
        if (__props.loading) {
          _push(`<span class="loading loading-spinner loading-md"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="mt-2">${ssrInterpolate(__props.loading ? "Loading entries..." : "No spending recorded for this date.")}</p></div>`);
      }
      _push(`</section>`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/EntriesPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_4 = Object.assign(_sfc_main$3, { __name: "EntriesPanel" });
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (init) {
    nuxtApp._state[key] ??= { _default: init };
  }
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useGraphql = () => {
  const config = /* @__PURE__ */ useRuntimeConfig();
  const token = useState("auth-token", () => null);
  const execute = async (query, variables = {}) => {
    let response;
    try {
      response = await $fetch(config.public.graphqlEndpoint, {
        method: "POST",
        headers: {
          ...token.value ? { Authorization: `Bearer ${token.value}` } : {}
        },
        body: {
          query,
          variables
        }
      });
    } catch (error) {
      const fetchError = error;
      const graphQLError = fetchError.data?.errors?.map((item) => item.message).join(" ");
      throw new Error(graphQLError || fetchError.statusMessage || fetchError.message || "GraphQL request failed.");
    }
    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join(" "));
    }
    if (!response.data) {
      throw new Error("GraphQL response did not include data.");
    }
    return response.data;
  };
  return {
    execute,
    token
  };
};
const AUTH_TOKEN_KEY = "aday_auth_token";
const CURRENCY_OPTIONS = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "KHR", label: "KHR - Cambodian Riel" },
  { code: "THB", label: "THB - Thai Baht" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "JPY", label: "JPY - Japanese Yen" },
  { code: "CNY", label: "CNY - Chinese Yuan" }
];
const useMoneyTracker = () => {
  const { execute, token } = useGraphql();
  const user = ref(null);
  const authMode = ref("login");
  const authForm = reactive({
    username: "",
    password: ""
  });
  const entryForm = reactive({
    amount: null,
    category: "",
    currency: "USD",
    note: "",
    spentAt: ""
  });
  const categoryName = ref("");
  const categories = ref([]);
  const selectedDate = ref(toDateInputValue(/* @__PURE__ */ new Date()));
  const dailyUsage = ref(null);
  const errorMessage = ref("");
  const isAuthLoading = ref(false);
  const isCategoryLoading = ref(false);
  const isDailyLoading = ref(false);
  const isEntryLoading = ref(false);
  const setError = (error) => {
    errorMessage.value = error instanceof Error ? error.message : "Something went wrong.";
  };
  const resetEntryForm = () => {
    entryForm.amount = null;
    entryForm.category = "";
    entryForm.note = "";
    entryForm.spentAt = "";
  };
  const getTimezoneOffset = () => {
    {
      return 0;
    }
  };
  const loadCategories = async () => {
    if (!user.value) {
      return;
    }
    try {
      const data = await execute(`
        query Categories {
          categories
        }
      `);
      categories.value = data.categories;
    } catch (error) {
      setError(error);
      categories.value = ["Food", "Transport", "Coffee", "Shopping", "Bills"];
    }
  };
  const submitAuth = async () => {
    errorMessage.value = "";
    isAuthLoading.value = true;
    const mutationName = authMode.value;
    const mutation = `
      mutation Authenticate($username: String!, $password: String!) {
        ${mutationName}(username: $username, password: $password) {
          token
          user {
            id
            username
            createdAt
          }
        }
      }
    `;
    try {
      const data = await execute(mutation, {
        username: authForm.username,
        password: authForm.password
      });
      const payload = data[mutationName];
      token.value = payload.token;
      user.value = payload.user;
      localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
      authForm.password = "";
      await loadCategories();
      await loadDailyUsage();
    } catch (error) {
      setError(error);
    } finally {
      isAuthLoading.value = false;
    }
  };
  const toggleAuthMode = () => {
    authMode.value = authMode.value === "login" ? "register" : "login";
    errorMessage.value = "";
  };
  const loadDailyUsage = async () => {
    if (!user.value) {
      return;
    }
    errorMessage.value = "";
    isDailyLoading.value = true;
    try {
      const data = await execute(`
        query DailyUsage($date: String, $timezoneOffset: Int) {
          dailyUsage(date: $date, timezoneOffset: $timezoneOffset) {
            date
            total
            totals {
              currency
              total
            }
            entries {
              id
              amount
              category
              currency
              note
              spentAt
              createdAt
            }
          }
        }
      `, {
        date: selectedDate.value,
        timezoneOffset: getTimezoneOffset()
      });
      dailyUsage.value = data.dailyUsage;
    } catch (error) {
      setError(error);
    } finally {
      isDailyLoading.value = false;
    }
  };
  const createEntry = async () => {
    if (!entryForm.amount) {
      errorMessage.value = "Amount is required.";
      return;
    }
    errorMessage.value = "";
    isEntryLoading.value = true;
    try {
      await execute(`
        mutation CreateMoneyEntry($amount: Float!, $category: String!, $currency: String, $note: String, $spentAt: String) {
          createMoneyEntry(amount: $amount, category: $category, currency: $currency, note: $note, spentAt: $spentAt) {
            id
          }
        }
      `, {
        amount: entryForm.amount,
        category: entryForm.category,
        currency: entryForm.currency,
        note: entryForm.note || null,
        spentAt: entryForm.spentAt ? new Date(entryForm.spentAt).toISOString() : null
      });
      resetEntryForm();
      await loadCategories();
      await loadDailyUsage();
    } catch (error) {
      setError(error);
    } finally {
      isEntryLoading.value = false;
    }
  };
  const createCategory = async () => {
    const name = categoryName.value.trim();
    if (!name) {
      errorMessage.value = "Category name is required.";
      return;
    }
    errorMessage.value = "";
    isCategoryLoading.value = true;
    try {
      const data = await execute(`
        mutation CreateCategory($name: String!) {
          createCategory(name: $name)
        }
      `, { name });
      entryForm.category = data.createCategory;
      categoryName.value = "";
      await loadCategories();
    } catch (error) {
      setError(error);
    } finally {
      isCategoryLoading.value = false;
    }
  };
  const deleteEntry = async (id) => {
    errorMessage.value = "";
    try {
      await execute(`
        mutation DeleteMoneyEntry($id: ID!) {
          deleteMoneyEntry(id: $id)
        }
      `, { id });
      await loadDailyUsage();
    } catch (error) {
      setError(error);
    }
  };
  const logout = () => {
    token.value = null;
    user.value = null;
    categories.value = [];
    dailyUsage.value = null;
  };
  const initializeSession = async () => {
    {
      return;
    }
  };
  return {
    authForm,
    authMode,
    categories,
    categoryName,
    currencyOptions: CURRENCY_OPTIONS,
    dailyUsage,
    entryForm,
    errorMessage,
    isAuthLoading,
    isCategoryLoading,
    isDailyLoading,
    isEntryLoading,
    selectedDate,
    user,
    createCategory,
    createEntry,
    deleteEntry,
    initializeSession,
    loadDailyUsage,
    logout,
    submitAuth,
    toggleAuthMode
  };
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const {
      authForm,
      authMode,
      categories,
      categoryName,
      currencyOptions,
      dailyUsage,
      entryForm,
      errorMessage,
      isAuthLoading,
      isCategoryLoading,
      isDailyLoading,
      isEntryLoading,
      selectedDate,
      user,
      createCategory,
      createEntry,
      deleteEntry,
      loadDailyUsage,
      submitAuth,
      toggleAuthMode
    } = useMoneyTracker();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtRouteAnnouncer = __nuxt_component_0;
      const _component_AuthPanel = __nuxt_component_1;
      const _component_SummaryBand = __nuxt_component_2;
      const _component_EntryForm = __nuxt_component_3;
      const _component_EntriesPanel = __nuxt_component_4;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-base-200 text-base-content" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtRouteAnnouncer, null, null, _parent));
      _push(`<main class="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-8"><section class="navbar rounded-box border border-base-300 bg-base-100 px-4 shadow-sm sm:px-6"><div class="flex-1"><div><p class="text-xs font-bold uppercase text-primary">A Day</p><h1 class="text-2xl font-black tracking-tight sm:text-4xl">Daily Money Tracker</h1></div></div>`);
      if (unref(user)) {
        _push(`<div class="flex flex-wrap items-center justify-end gap-3"><span class="badge badge-neutral badge-lg max-w-48 truncate">${ssrInterpolate(unref(user).username)}</span><button type="button" class="btn btn-outline btn-sm">Log out</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section>`);
      if (!unref(user)) {
        _push(ssrRenderComponent(_component_AuthPanel, {
          form: unref(authForm),
          "onUpdate:form": ($event) => isRef(authForm) ? authForm.value = $event : null,
          error: unref(errorMessage),
          loading: unref(isAuthLoading),
          mode: unref(authMode),
          onSubmit: unref(submitAuth),
          onToggleMode: unref(toggleAuthMode)
        }, null, _parent));
      } else {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_SummaryBand, {
          "selected-date": unref(selectedDate),
          "onUpdate:selectedDate": ($event) => isRef(selectedDate) ? selectedDate.value = $event : null,
          "entry-count": unref(dailyUsage)?.entries.length || 0,
          totals: unref(dailyUsage)?.totals || [],
          onRefresh: unref(loadDailyUsage)
        }, null, _parent));
        _push(`<section class="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">`);
        _push(ssrRenderComponent(_component_EntryForm, {
          "category-name": unref(categoryName),
          "onUpdate:categoryName": ($event) => isRef(categoryName) ? categoryName.value = $event : null,
          form: unref(entryForm),
          "onUpdate:form": ($event) => isRef(entryForm) ? entryForm.value = $event : null,
          categories: unref(categories),
          "category-loading": unref(isCategoryLoading),
          currencies: unref(currencyOptions),
          error: unref(errorMessage),
          loading: unref(isEntryLoading),
          onAddCategory: unref(createCategory),
          onSubmit: unref(createEntry)
        }, null, _parent));
        _push(ssrRenderComponent(_component_EntriesPanel, {
          "daily-usage": unref(dailyUsage),
          loading: unref(isDailyLoading),
          "selected-date": unref(selectedDate),
          onDelete: unref(deleteEntry),
          onRefresh: unref(loadDailyUsage)
        }, null, _parent));
        _push(`</section><!--]-->`);
      }
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    const status = Number(_error.statusCode || 500);
    const is404 = status === 404;
    const statusText = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-Bcn7to_l.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-CgccA5sr.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ status: unref(status), statusText: unref(statusText), statusCode: unref(status), statusMessage: unref(statusText), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = /* @__PURE__ */ useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info)?.catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext && (ssrContext["~renderResponse"] || ssrContext._renderResponse)) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = ((ssrContext) => entry(ssrContext));

export { useNuxtApp as a, useRuntimeConfig as b, nuxtLinkDefaults as c, entry_default as default, encodeRoutePath as e, navigateTo as n, resolveRouteObject as r, useRouter as u };
//# sourceMappingURL=server.mjs.map

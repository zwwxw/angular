/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {assertDefined} from '../../util/assert';
import {global} from '../../util/global';
import {setupFrameworkInjectorProfiler} from '../debug/framework_injector_profiler';
import {setProfiler} from '../profiler';
import {isSignal} from '../reactivity/api';

import {applyChanges} from './change_detection_utils';
import {getComponent, getContext, getDirectiveMetadata, getDirectives, getHostElement, getInjector, getListeners, getOwningComponent, getRootComponents} from './discovery_utils';
import {getDependenciesFromInjectable, getInjectorMetadata, getInjectorProviders, getInjectorResolutionPath} from './injector_discovery_utils';



/**
 * This file introduces series of globally accessible debug tools
 * to allow for the Angular debugging story to function.
 *
 * To see this in action run the following command:
 *
 *   bazel run //packages/core/test/bundling/todo:devserver
 *
 *  Then load `localhost:5432` and start using the console tools.
 */

/**
 * This value reflects the property on the window where the dev
 * tools are patched (window.ng).
 * */
export const GLOBAL_PUBLISH_EXPANDO_KEY = 'ng';

const globalUtilsFunctions = {
  /**
   * Warning: functions that start with `ɵ` are considered *INTERNAL* and should not be relied upon
   * in application's code. The contract of those functions might be changed in any release and/or a
   * function can be removed completely.
   */
  'ɵgetDependenciesFromInjectable': getDependenciesFromInjectable,
  'ɵgetInjectorProviders': getInjectorProviders,
  'ɵgetInjectorResolutionPath': getInjectorResolutionPath,
  'ɵgetInjectorMetadata': getInjectorMetadata,
  'ɵsetProfiler': setProfiler,

  'getDirectiveMetadata': getDirectiveMetadata,
  'getComponent': getComponent,
  'getContext': getContext,
  'getListeners': getListeners,
  'getOwningComponent': getOwningComponent,
  'getHostElement': getHostElement,
  'getInjector': getInjector,
  'getRootComponents': getRootComponents,
  'getDirectives': getDirectives,
  'applyChanges': applyChanges,
  'isSignal': isSignal,
};
type GlobalUtilsFunctions = keyof typeof globalUtilsFunctions;

let _published = false;
/**
 * Publishes a collection of default debug tools onto`window.ng`.
 *
 * These functions are available globally when Angular is in development
 * mode and are automatically stripped away from prod mode is on.
 */
export function publishDefaultGlobalUtils() {
  if (!_published) {
    _published = true;

    if (typeof window !== 'undefined') {
      // Only configure the injector profiler when running in the browser.
      setupFrameworkInjectorProfiler();
    }

    for (const [methodName, method] of Object.entries(globalUtilsFunctions)) {
      publishGlobalUtil(methodName as GlobalUtilsFunctions, method);
    }
  }
}

/**
 * Default debug tools available under `window.ng`.
 */
export type GlobalDevModeUtils = {
  [GLOBAL_PUBLISH_EXPANDO_KEY]: typeof globalUtilsFunctions;
};

/**
 * Publishes the given function to `window.ng` so that it can be
 * used from the browser console when an application is not in production.
 */
export function publishGlobalUtil<K extends GlobalUtilsFunctions>(
    name: K, fn: typeof globalUtilsFunctions[K]): void {
  if (typeof COMPILED === 'undefined' || !COMPILED) {
    // Note: we can't export `ng` when using closure enhanced optimization as:
    // - closure declares globals itself for minified names, which sometimes clobber our `ng` global
    // - we can't declare a closure extern as the namespace `ng` is already used within Google
    //   for typings for AngularJS (via `goog.provide('ng....')`).
    const w = global as GlobalDevModeUtils;
    ngDevMode && assertDefined(fn, 'function not defined');

    w[GLOBAL_PUBLISH_EXPANDO_KEY] ??= {} as any;
    w[GLOBAL_PUBLISH_EXPANDO_KEY][name] = fn;
  }
}

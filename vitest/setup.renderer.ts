import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { Window } from 'happy-dom'
import { afterEach } from 'vitest'

// Node 25+ defines its own `localStorage` global, which reads as `undefined` unless the process
// was started with `--localstorage-file`, and it hides the one happy-dom provides. In this
// environment `window` is `globalThis`, so there is no happy-dom window to take it from; use the
// storage of a fresh one instead, so tests see a working `localStorage` on every Node version
// (a no-op on Node 24).
if (globalThis.localStorage === undefined) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new Window().localStorage,
    configurable: true,
    writable: true
  })
}

afterEach(() => {
  cleanup()
})

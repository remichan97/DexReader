# Error Handling

**Last updated**: October 2026 (v1.16.1)
**Source**: `src/renderer/src/components/ErrorBoundary/`, `components/ErrorState/`, `components/OfflineStatusBar/`, `utils/errorHandler.ts`, `src/main/ipc/`

---

## Overview

Errors are caught in three layers. Each layer assumes the one before it missed something.

```
┌───────────────────────────────────────────────────────────┐
│ 1. Error boundaries      React render errors              │
├───────────────────────────────────────────────────────────┤
│ 2. IpcResponse checks    Failed IPC calls and async work  │
│    + try/catch             (stores and hooks)             │
├───────────────────────────────────────────────────────────┤
│ 3. Global handlers       window.onerror, unhandled        │
│                            promise rejections             │
└───────────────────────────────────────────────────────────┘
```

Principles: don't crash the window, show a short human message instead of a stack trace (with the technical detail one click away), always log the real error, and let the user retry where a retry makes sense.

---

## Layer 1: Error boundaries

`ErrorBoundary` (`components/ErrorBoundary/ErrorBoundary.tsx`) is a class component. On a render error it logs through `rendererLog.error('[ErrorBoundary] Caught error:', ...)`, calls the optional `onError` prop, and renders a fallback.

| Prop       | Type                                             | Notes                                  |
| ---------- | ------------------------------------------------ | -------------------------------------- |
| `level`    | `'app' \| 'page' \| 'component'`                 | Picks the fallback wording and actions |
| `fallback` | `(error: Error, reset: () => void) => ReactNode` | Replaces the default fallback          |
| `onError`  | `(error, errorInfo) => void`                     | Extra reporting hook                   |

### Where they are

| Level       | Placement                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `app`       | Around the router and toast container in `App.tsx`, inside `FluentProvider`                          |
| `page`      | Around each of the eight routed views in `router.tsx`, so the sidebar and shell survive a view crash |
| `component` | Supported but not used anywhere yet                                                                  |

### The default fallback

`DefaultErrorFallback` shows a title and message (the **critical** wording at `app` level, the **component** wording otherwise), a collapsed "Technical details" block with the message and stack, and a **Try Again** button that clears the error state so the children render again. At `app` level it also offers **Reload App** (`location.reload()`). All text comes from the `common:error.*` translation keys.

"Try Again" only re-renders the subtree. If the cause was bad state in a store, it will fail again; nothing is refetched.

### Limits

Boundaries do not catch errors in event handlers, async code, timers or the boundary's own render. Those fall to layers 2 and 3.

---

## Layer 2: IPC and async work

Every IPC call resolves to an `IpcResponse<T>` and never rejects (see [ipc-messaging.md](./ipc-messaging.md)). The renderer checks `success`, and an unexpected throw is caught around the `await`.

```typescript
try {
  const result = await globalThis.library.getLibraryManga({})
  if (result.success && result.data) {
    set({ favourites: result.data })
  } else {
    set({ error: result.error?.message ?? 'Failed to load library' })
  }
} catch (error) {
  rendererLog.error('[LibraryStore] Error loading favourites:', error)
  set({ error: 'Failed to load library' })
}
```

How a failure is shown depends on how much of the screen it affects:

| Situation                                         | Pattern                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| A background action failed (save, toggle, import) | An error **toast** (`useToastStore.getState().show({ variant: 'error', ... })`) |
| A whole view or section couldn't load             | An inline error block with a Retry button, or `ErrorState`                      |
| A persistent condition (offline, update)          | A banner: `OfflineStatusBar`, `InfoBar`, `UpdateBanner`                         |
| A destructive confirmation                        | A native Electron dialog (see the project rules)                                |

`ErrorState` (`components/ErrorState`) is the shared full-panel version: icon, title, message, a Retry button (`onRetry`, `retrying`), an optional secondary action, and a toggle for technical details. `variant="offline"` swaps the icon for a cloud-off one. Today `DownloadsView` and `ReaderView` use it; Browse and Manga Detail render their own inline error markup. See [loading-feedback-states.md](../components/loading-feedback-states.md) for the props and for which component fits which case.

### Stores

IPC-backed stores keep an `error` field (a message string in the library, collections and presets stores; an `Error` in the progress, search and history stores) next to `loading`, so views can render the failure. `progressStore.saveProgress` is silent on success and raises an error toast on failure, and does not retry. There is no shared retry helper: retries are local to the code that needs them (the MangaDex client retries 429s, the download queue retries downloads, and `searchStore.retryLoadMore` retries a failed page).

### Main-process errors

Handlers just throw. `wrapIpcHandler` logs `[IPC] Error in "<channel>"` and returns the serialised error (absolute paths scrubbed, stack only in development). The main process has no `uncaughtException` or `unhandledRejection` handler of its own, so anything thrown outside an IPC handler or a caught promise is not logged by DexReader's logger.

---

## Layer 3: Global handlers

`globalErrorHandler.initialize()` is called in `main.tsx` before the app renders. It sets:

- `globalThis.onerror`, for uncaught exceptions, and returns `true` to suppress the browser's default handling.
- `globalThis.onunhandledrejection`, for rejected promises nobody handled, and calls `preventDefault()`.

Both go to `handleError`, which logs `[GlobalError]` with the message, stack and position through `rendererLog`, then shows an **error toast** titled "Something went wrong". The toast body is chosen by a few substring checks on the technical message (network, `ENOENT`, `EACCES`, `ENOSPC`, timeout, parse or JSON), with a generic fallback.

These toast strings are hard-coded English; they are not translated like the rest of the UI.

---

## Offline mode

`connectivityStore` tracks `online`, `offline-user` and `offline-no-internet` (see [state-management.md](./state-management.md)). `OfflineStatusBar` is mounted once in `AppShell`, renders nothing while online, and otherwise shows a warning bar:

- **`offline-user`** (the user chose offline mode): "You're offline" with a **Go Online** button.
- **`offline-no-internet`** (polling found no connection): "No internet" with a **Retry** button that re-checks.

Both messages explain that downloaded content is still available. `searchStore` refuses to run an online search while offline, and the File menu's Go Offline / Go Online item toggles the first state. `IncognitoStatusBar` is the equivalent banner for incognito mode and is mounted next to it.

---

## Logging

`rendererLog` forwards to the main process (`globalThis.logger.*`), and `mainLog` writes through the same logging service, so renderer and main errors end up in the app's log files under `<userData>/logs` (Help → Open Logs Folder). Log the original error object, not just its message, so the stack survives.

---

## Writing error messages

- Use the `common:error.*` and `common:message.*` translation keys for anything new, and add them to every locale.
- Keep the tone short and casual, say what happened and what the user can do, and leave the technical detail in a collapsible block.
- Never show a raw stack trace or an absolute path in the main UI.

---

## Practices

**Do**

- Check `result.success` before using `result.data`.
- Log with `rendererLog` / `mainLog` before showing anything.
- Wrap each routed view in a `page` boundary, and put `component` boundaries around risky isolated widgets.
- Give the user a way forward (Retry, Go Online, Back).

**Don't**

- Swallow errors with an empty `catch`.
- Use a toast for a failure that leaves the whole view empty. Show the error where the content should have been.
- Rely on a boundary for async or event-handler errors.
- Add `console.error` instead of the logger.

---

## Testing

- Store error paths are covered by the colocated store tests, with the IPC bridge mocked to return `{ success: false, error }` or to reject.
- `wrapIpcHandler` and `serializeError` have their own tests under `src/main/ipc`.
- The boundary components have no unit tests. To exercise one by hand, throw from a component in a development build and check the fallback, the log entry, and that **Try Again** recovers.
- To check the global handler, run `setTimeout(() => { throw new Error('test') })` in the renderer's DevTools console and expect a toast and a `[GlobalError]` log line.

---

## Troubleshooting

### A boundary doesn't catch my error

The error probably happened in an event handler, a promise or a timer. Boundaries only catch render and lifecycle errors. Handle it with `try/catch` and show a toast or `ErrorState`.

### Errors don't appear in the log

Check the file under `<userData>/logs` for `[GlobalError]`, `[ErrorBoundary]` or `[IPC] Error in`. An error thrown in the main process outside an IPC handler is not logged by DexReader; look at the terminal output in development.

### "Try Again" shows the same error

The fallback only re-renders. Fix or reset the state that caused the failure (reload the data, navigate away), or use a `fallback` that does it in its `reset` callback.

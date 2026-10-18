# IPC Messaging

**Last updated**: October 2026 (v1.16.1)
**Source**: `src/main/ipc/` (handlers, wrapper, errors), `src/preload/` (bridge and types), `src/shared/contracts/ipc/`

---

## Overview

The renderer is sandboxed (`sandbox: true`, `contextIsolation: true`), so it cannot reach Node, the filesystem, SQLite or the network. Everything goes through one path:

```
Renderer (React/Zustand)  ──►  Preload (contextBridge)  ──►  Main (handlers → repositories / services / API client)
   globalThis.progress.*        ipcRenderer.invoke(...)        wrapIpcHandler('progress:get-progress', ...)
```

There are three kinds of message:

| Kind                   | Direction       | Mechanism                                            | Returns                           |
| ---------------------- | --------------- | ---------------------------------------------------- | --------------------------------- |
| **Request / response** | renderer → main | `ipcRenderer.invoke` / `wrapIpcHandler`              | `IpcResponse<T>`                  |
| **Fire and forget**    | renderer → main | `ipcRenderer.send` / `ipcMain.on`                    | nothing                           |
| **Push event**         | main → renderer | `webContents.send` / `ipcRenderer.on` in the preload | a cleanup function to unsubscribe |

There are 116 request/response channels at the time of writing.

---

## Request / response

### The response shape

Every request/response channel resolves to an `IpcResponse<T>`. It never rejects and never throws into the renderer.

```typescript
// src/shared/contracts/ipc/ipc-response.contract.ts
interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ISerializeError
}

interface ISerializeError {
  name: string
  message: string
  code?: string
  details?: unknown // development only
  stack?: string // development only
}
```

`IpcResponse` and `ISerializeError` are defined in `src/shared` so main can use them without importing from the preload. `src/preload/ipc.types.ts` re-exports them for the renderer.

### `wrapIpcHandler`

Every handler is registered through `wrapIpcHandler` (`src/main/ipc/wrap-handler.ts`). It is the only place `ipcMain.handle` is called for application channels.

```typescript
wrapIpcHandler('progress:get-progress', async (_, id: unknown) => {
  if (typeof id !== 'string') {
    throw new TypeError('Invalid mangaId for getting progress')
  }

  return progressRepo.getProgressByMangaId(id)
})
```

It awaits the handler and returns `{ success: true, data: result }`. If the handler throws, it logs `[IPC] Error in "<channel>"` with `mainLog` and returns `{ success: false, error: serializeError(error) }`. A handler therefore just returns a value or throws.

### Errors

| Class             | Where                       | Code               | Use                                                            |
| ----------------- | --------------------------- | ------------------ | -------------------------------------------------------------- |
| `IpcError`        | `error/ipc.error.ts`        | any string         | An error with a machine-readable `code` and optional `details` |
| `ValidationError` | `error/validation.error.ts` | `VALIDATION_ERROR` | A bad argument; carries `field` and `reason` in `details`      |

`serializeError` (`error/error-serializer.ts`) turns anything thrown into an `ISerializeError`:

- `IpcError` keeps its `code`; a plain `Error` keeps `name` and `message`; anything else becomes `UnknownError` with `String(error)`.
- `stack` and `details` are included **only when `NODE_ENV === 'development'`**.
- **Absolute filesystem paths are scrubbed from messages.** Node's `ENOENT` and `EACCES` messages embed the full path, which would leak the OS username and folder layout to the renderer, so the path is replaced with its base name.

### Validating arguments

Arguments arrive from a process that must be treated as untrusted, so handlers declare them as `unknown` and check them before use. There are two styles in the code:

- Shared helpers in `src/main/ipc/validators.ts`: `validateString`, `validatePath` (a non-empty string) and `validateEncoding`. They log a warning and throw a `ValidationError`. The filesystem handlers use these.
- Inline checks that throw a `TypeError`, for example `storage:clear-manga-cache` rejecting a non-boolean. Domain validators live next to their handler (`validators/search-presets.validator.ts`).

Paths additionally pass through `secure-fs` and `path-validator`, which enforce the allowed roots. See [filesystem-security.md](./filesystem-security.md).

---

## Channels

### Naming

Request channels are `<category>:<action>` in kebab-case (`library:toggle-favourite`, `snapshot:restore`). Three older channels have no prefix: `get-theme`, `show-dialog` and `show-confirm-dialog`. A few use camelCase actions (`gatekeeper:getRequireForSettings`, `search-presets:getAll`); follow the kebab-case convention for new channels.

### Catalogue

| Category (count)     | Channels                                                                                                                                                                                                                                                          | Preload object    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `download` (16)      | add-to-queue, remove-from-queue, clear-queue, cancel-all-queued, retry, get-queued-items, delete-chapter, get-all-downloads, clear-completed, get-download, is-downloaded, storage-stats, delete-manga, batch-delete-manga, clear-cover-cache, get-download-stats | `downloads`       |
| `fs` (14)            | read-file, write-file, copy-file, append-file, rename, is-exists, mkdir, unlink, rmdir, stat, readdir, get-allowed-paths, select-downloads-folder, open-downloads-folder                                                                                          | `fileSystem`      |
| `settings` (9)       | load, get, update-section, reset-to-defaults, clear-all, open-settings-file, open-system-date-settings, open-system-proxy-settings, get-memory-tier-info                                                                                                          | `settings`        |
| `collections` (8)    | get-all, get-manga, get-by-manga, create, update, delete, add-manga, remove-manga                                                                                                                                                                                 | `collections`     |
| `gatekeeper` (8)     | available, enable, disable, verify, update, reset, getRequireForSettings, toggleRequireForSettings                                                                                                                                                                | `gatekeeper`      |
| `progress` (7)       | get-progress, get-all-progress, get-all-chapter-progress, save-progress, save-chapters, delete-progress, get-statistics                                                                                                                                           | `progress`        |
| `library` (6)        | get-manga, get-manga-by-id, get-cached-chapters, get-downloaded-manga, toggle-favourite, upsert-manga                                                                                                                                                             | `library`         |
| `log` (6)            | info, warn, error, debug, cleanup, open-folder                                                                                                                                                                                                                    | `logger`          |
| `mangadex` (6)       | search-manga, get-manga, get-manga-feed, get-chapter, get-chapter-images, healthcheck                                                                                                                                                                             | `mangadex`        |
| `reader` (5)         | get-manga-settings, update-manga-settings, reset-manga-settings, clear-all-overrides, get-all-manga-overrides                                                                                                                                                     | `reader`          |
| `app-update` (4)     | check, download, install, version                                                                                                                                                                                                                                 | `appUpdate`       |
| `snapshot` (4)       | list, create, restore, delete                                                                                                                                                                                                                                     | `snapshots`       |
| `search-presets` (4) | getAll, save, delete, updateLastUsedAt                                                                                                                                                                                                                            | `searchPresets`   |
| `dexreader` (3)      | export-data, import-data, cancel-import                                                                                                                                                                                                                           | `dexreader`       |
| `mihon` (3)          | import-backup, export-backup, cancel-import                                                                                                                                                                                                                       | `mihon`           |
| `history` (3)        | get-active-dates, get-events-by-date, get-recent-events                                                                                                                                                                                                           | `readHistory`     |
| `storage` (3)        | get-stats, clear-manga-cache, optimise-manga-cache                                                                                                                                                                                                                | `storage`         |
| other (7)            | `security:get-csp-nonce`, `shell:open-external`, `theme:get-system-accent-color`, `get-theme`, `show-dialog`, `show-confirm-dialog` (all on `api`), and `app:restart` (`settings.restart`)                                                                        | `api`, `settings` |

To list the channels from the source:

```bash
grep -rhE "wrapIpcHandler" src/main/ipc/handlers
```

### Fire-and-forget

| Channel             | Sender   | Purpose                                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------------------- |
| `update-menu-state` | renderer | Push app state to the native menu; see [menu-bar-structure.md](./menu-bar-structure.md) |
| `flush-complete`    | renderer | Reply in the quit handshake below                                                       |

### Push events (main → renderer)

Most are exposed in the preload as an `on...` function that returns an unsubscribe function. A few are subscribed to directly through the toolkit's `globalThis.electron.ipcRenderer.on`: `show-shortcuts` (`AppShell`), `flush-pending-saves` (`App.tsx`) and the three `download:` events other than chapter progress (`useDownloadData`). Prefer a typed preload function for new events.

| Channel                                                                                                                                                         | Sent when                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `theme-changed`                                                                                                                                                 | The OS theme changes                           |
| `accent-color-changed`                                                                                                                                          | The OS accent colour changes                   |
| `download:queue-progress`, `download:chapter-progress`                                                                                                          | Download queue and per-chapter progress        |
| `download:permanent-failure`, `download:database-error`                                                                                                         | A download fails for good or can't be recorded |
| `app-update:update-checking`, `update-available`, `update-not-available`, `update-downloading`, `update-download-progress`, `update-downloaded`, `update-error` | The auto-updater changes state                 |
| `navigate`, `show-shortcuts`, `progress:toggle-incognito`, `connectivity:toggle-offline`, `import-*`, `export-*`                                                | Menu actions (see the menu guide)              |
| `flush-pending-saves`                                                                                                                                           | The window is closing                          |

### Quit handshake

On window close, `window.ts` prevents the close and sends `flush-pending-saves`. `App.tsx` flushes the progress store and any pending settings writes, then sends `flush-complete`, and main closes the window. If the renderer doesn't answer within 3 seconds, main closes anyway.

---

## The preload bridge

`src/preload/index.ts` builds one object per area and exposes each with `contextBridge.exposeInMainWorld`: `api`, `fileSystem`, `mangadex`, `progress`, `reader`, `library`, `collections`, `mihon`, `settings`, `dexreader`, `downloads`, `storage`, `appUpdate`, `logger`, `searchPresets`, `gatekeeper`, `snapshots` and `readHistory`, plus the `electron` toolkit object. The renderer reaches them as `globalThis.<name>` (not `window.<name>`, per the project rules).

```typescript
// src/preload/index.ts
const progress = {
  getProgress: (mangaId: string) => ipcRenderer.invoke('progress:get-progress', mangaId),
  onIncognitoToggle: (callback: () => void) => {
    ipcRenderer.on('progress:toggle-incognito', callback)
    return () => ipcRenderer.removeListener('progress:toggle-incognito', callback)
  }
}
```

The preload contains no logic. It forwards arguments and returns what main returns.

### Types

The runtime object is in `index.ts`; its **types live in `src/preload/window.types.ts`**, which declares one interface per object (`Progress`, `Library`, ...) with every method typed as `Promise<IpcResponse<T>>`, augments `Window`, and redeclares the same members as ambient `var`s so that `globalThis.progress.*` is type-checked too. The two files must be kept in sync. Contract and command types are re-exported from `window.types.ts` so the renderer imports them from one place.

---

## Using a channel from the renderer

Check `success` before using `data`. Stores follow this pattern (see [state-management.md](./state-management.md)):

```typescript
const result = await globalThis.library.getLibraryManga({})
if (result.success && result.data) {
  set({ favourites: result.data })
} else {
  set({ error: result.error?.message ?? 'Failed to load library' })
}
```

For push events, subscribe in an effect and return the cleanup:

```typescript
useEffect(() => globalThis.api.onNavigate((route) => navigate(route)), [navigate])
```

---

## Adding a channel

1. **Types.** Put any new command or contract in `src/shared` (`commands/...`, `contracts/...`) so both sides share it.
2. **Handler.** Add `wrapIpcHandler('<category>:<action>', async (_, arg: unknown) => ...)` to `src/main/ipc/handlers/<category>.handler.ts`. Validate every argument (`validateString` and friends, or an inline check), call the repository or service, and return plain data. Throw to signal failure.
3. **Registration.** Export a `register...Handlers()` function and call it from `registerAllHandlers` in `src/main/ipc/registry.ts` (new handler files only).
4. **Preload runtime.** Add the method to the right object in `src/preload/index.ts` using `ipcRenderer.invoke`.
5. **Preload types.** Add the matching `Promise<IpcResponse<T>>` signature to its interface in `src/preload/window.types.ts`.
6. **Use it** from a store, hook or component through `globalThis.<object>.<method>`, checking `success`.
7. **Test it.** Handlers have colocated `*.handler.test.ts` files; `src/main` and `src/preload` are coverage-gated.

---

## Security notes

- The window is sandboxed with context isolation, and DevTools are disabled outside development.
- The renderer has no `require` or `fs`. It sees the objects the preload exposes, plus the toolkit's `electron` object, whose generic `ipcRenderer` (`send`, `invoke`, `on`, ...) can address **any** channel by name. Typed preload functions are a convenience, not a boundary, so every handler has to validate its own arguments.
- Treat every argument as untrusted: type it `unknown`, validate it, and never build a path from it without going through `secure-fs`.
- Don't put secrets, absolute paths or stack traces in an error that reaches the renderer; `serializeError` strips paths and, outside development, stacks and details.
- External URLs open through `shell:open-external` or the window-open handler (which denies in-app windows), not from the renderer.

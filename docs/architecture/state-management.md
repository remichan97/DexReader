# State Management

**Last updated**: October 2026 (v1.16.0)
**Source**: `src/renderer/src/stores/`

---

## Overview

The renderer keeps shared state in [Zustand](https://zustand.docs.pmnd.rs/) 5 stores. Stores are **ephemeral**: nothing is persisted from the renderer (no `persist` middleware, no `localStorage`). Each store is rehydrated from the main process when the app starts or when a view needs it, and anything that must survive a restart is written back through IPC:

- **Settings** (`electron-store` → `settings.json`): theme mode, sidebar display mode, language and so on.
- **SQLite** (via IPC handlers and repositories): favourites, collections, search presets, reading progress and history. See [database-architecture.md](./database-architecture.md).

Views never talk to storage directly. They call a store action, the action calls `globalThis.<api>.*` (the preload bridge), and the store updates itself from the `IpcResponse<T>` that comes back.

### Why Zustand

- No provider tree: any component can read or update a store.
- Selector subscriptions keep re-renders narrow.
- Plain TypeScript with very little boilerplate.
- Stores are easy to test by calling `getState()` and `setState()` outside React.

---

## Store inventory

| Store                | Hook                        | Holds                                                                | Backed by                                        |
| -------------------- | --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| `appStore`           | `useAppStore`               | Effective theme, system theme, theme mode, accent colour, fullscreen | Theme mode from settings; system theme from main |
| `sidebarStore`       | `useSidebarStore`           | Sidebar display mode (`full`, `compact`, `auto-hide`)                | Settings                                         |
| `toastStore`         | `useToastStore`, `useToast` | Active toasts and their auto-dismiss timers                          | Memory only                                      |
| `connectivityStore`  | `useConnectivityStore`      | Online, offline-by-choice or no-internet status; 30 s polling        | Memory only (pushes `isOffline` to the menu)     |
| `libraryStore`       | `useLibraryStore`           | Favourite manga                                                      | SQLite (`globalThis.library`)                    |
| `collectionsStore`   | `useCollectionsStore`       | Collections and membership changes                                   | SQLite (`globalThis.collections`)                |
| `searchPresetsStore` | `useSearchPresetsStore`     | Saved Browse searches                                                | SQLite (`globalThis.searchPresets`)              |
| `searchStore`        | `useSearchStore`            | Browse query, filters, results, pagination                           | MangaDex API through IPC                         |
| `progressStore`      | `useProgressStore`          | Reading progress, statistics, incognito flag                         | SQLite (`globalThis.progress`)                   |
| `historyStore`       | `useHistoryStore`           | Reading history calendar and event feed                              | SQLite (`globalThis.readHistory`)                |

`index.ts` is the barrel for everything except `historyStore`, which `HistoryView` imports directly (`@renderer/stores/historyStore`). `types.ts` holds the shared `Theme`, `ThemeMode`, `ToastVariant` and `ToastItem` types.

```typescript
import { useAppStore, useLibraryStore, type ToastItem } from '@renderer/stores'
```

---

## Conventions

- **Select narrowly.** Subscribe to the slice you need so unrelated changes don't re-render the component:

  ```typescript
  const theme = useAppStore((state) => state.theme)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)
  ```

- **IPC-backed stores follow one shape**: a `loading` flag, an `error` (a message string in the library, collections and presets stores, an `Error` in the progress, search and history stores), and async actions that call the bridge, check `result.success`, set the state, and log failures with `rendererLog`. After a write, the action usually reloads from the database (`toggleFavourite` calls `loadFavourites`) rather than patching local state, so the database stays the source of truth.
- **Timers and in-flight data live outside the state.** `toastStore` keeps its dismiss timers and `progressStore` keeps its debounce timers and pending saves in module-level `Map`s, so they never trigger re-renders and are cleared by the store's own actions.
- **Maps and Sets are replaced, not mutated.** `progressStore` copies its `Map` before `set()`, so subscribers see a new reference.
- **Actions that cross the boundary use `globalThis.*`**, not `window.*` (project rule), and the types come from the preload `Window` interface.
- **Don't persist in the renderer.** If state must survive a restart, add a setting or a database table and load it into the store at startup.

---

## Notable stores

### appStore

`theme` is derived: if `themeMode` is `system` it equals `systemTheme`, otherwise it equals the chosen mode. `setSystemTheme` and `setThemeMode` both recalculate it; `setTheme` sets an explicit theme and the mode with it. `accentColor` mirrors the `--win-accent` CSS variable so the Fluent theme (`createDexReaderThemes`) stays in sync; use `applyAccentColor` rather than `setAccentColor` directly.

### toastStore

`show({ variant, title, message?, duration? })` returns the toast id. The default duration is 5000 ms and `0` means the toast stays until dismissed. `dismiss(id)` and `dismissAll()` clear the timers. `useToast` is an alias of `useToastStore`. Toasts are rendered by one `ToastContainer` in `App.tsx`.

### connectivityStore

`status` is `online`, `offline-user` (the user chose offline mode) or `offline-no-internet`. `startPolling()` (started and stopped in `App.tsx`) re-checks every 30 seconds while online. Each status change pushes `isOffline` to the native menu with `globalThis.api.updateMenuState`. `searchStore` reads `isOnline` before searching.

### progressStore

Two maps: `progressMap` (lean, per manga, used for updates and resume) and `progressMetadataMap` (rich rows for the History view). `saveProgress` updates the cache straight away, then **debounces the write by 1 second per manga**. `flushPendingSaves()` writes everything pending immediately and runs before the window closes, so no progress is lost. A failed write shows an error toast and sets `error`; it does not retry. `autoSaveEnabled` is the inverse of incognito mode: when it is `false`, `saveProgress` does nothing. `toggleIncognito` flips it and pushes `isIncognito` to the menu.

### searchStore

Holds the Browse query, `filters` (`SearchFilters`, defaults in `DEFAULT_FILTERS`), `results`, `total`, `offset`, `limit` (default 20) and `hasMore`. `search()` starts a new search, `loadMore()` appends the next page, and `retryLoadMore()` retries a failed page without losing the results. Pagination stops at MangaDex's 10,000-result limit. The search language comes from the filter dialog's selection when there is one, otherwise from the content-language settings. The filter enums are re-exported from `@shared/enums/mangadex`, so the renderer and the search-preset contract use the same types.

### historyStore

Read-only. The renderer never writes history events: they are logged on the main process as a side effect of `progress:save-progress`. The store loads the recent events (limit 200), the active dates for the calendar's visible month, and the events for the selected date. It remembers the last requested month so `refreshActiveDates()` can update the calendar after a removal elsewhere.

### libraryStore, collectionsStore, searchPresetsStore

Thin IPC-backed lists with the shared `loading` and `error` shape. `libraryStore` exposes `isFavourite(mangaId)` for cards; `collectionsStore` has create, update, delete and add/remove-member actions; `searchPresetsStore` adds `getPresetById` and `getPresetByName` helpers.

---

## Hydration at startup

| What                                        | Where                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Theme mode, sidebar mode, language          | `useStartupTheme` and friends in `App.tsx`, from settings             |
| System theme                                | `AppShell`, from `globalThis.api.getTheme()` and `onThemeChanged`     |
| Favourites                                  | `App.tsx` calls `loadFavourites()` once on mount                      |
| Connectivity polling                        | `App.tsx` starts and stops `startPolling()`                           |
| Incognito and offline toggles from the menu | `useIncognitoListener`, `useConnectivityListener`                     |
| Collections, presets, progress, history     | Loaded by the view that needs them (Library, Browse, History, Reader) |

---

## Testing

Each store has a colocated `*.test.ts` (Vitest, `renderer` project). Tests call actions through `getState()` and reset the store between tests by restoring the initial state:

```typescript
const INITIAL_STATE = useAppStore.getState()

beforeEach(() => {
  useAppStore.setState(INITIAL_STATE, true)
})

it('recalculates theme when themeMode is "system"', () => {
  useAppStore.getState().setSystemTheme('dark')
  expect(useAppStore.getState().theme).toBe('dark')
})
```

The IPC bridge is mocked per test. `src/renderer/src/stores/**` is one of the areas with a coverage threshold in `vitest.config.ts` (75% statements and lines, 65% branches, 90% functions), enforced by `npm run test:coverage`.

---

## Troubleshooting

### A component doesn't re-render

1. Use a selector: `useStore((state) => state.value)`. Reading `getState()` inside render doesn't subscribe.
2. Make sure the selector returns a stable reference. A selector that builds a new object or array each time re-renders on every change.
3. For `Map` and `Set` state, check the action replaces the collection instead of mutating it.

### Data is stale after a write elsewhere

Stores don't know about each other's writes. After an action that changes favourites or collections from outside the owning store (an import, for example), call `loadFavourites()` or `loadCollections()` to refresh.

### Progress isn't saved

Saves are debounced by 1 second, so check `flushPendingSaves()` ran before the window closed, and that incognito mode (`autoSaveEnabled === false`) is off.

### Memory growth from timers

Toast and progress timers are cleared by `dismiss`, `dismissAll` and `flushPendingSaves`. A new store that schedules timers should keep them in a module-level `Map` and clear them the same way.

# Native Menu Bar

**Last updated**: October 2026 (v1.16.1, Library menu items removed, import/export global)
**Source**: `src/main/menu/` (one file per menu), `src/main/ipc/handlers/menu.handler.ts`

---

## Overview

DexReader uses a native Electron application menu with four menus: **File**, **View**, **Library** and **Help**. The menu is built in the main process from `MenuItemConstructorOptions` templates, with labels translated through the main-process i18next instance (the `menu` namespace, `src/locales/<language>/menu.json`).

Menu items do not call into the app directly. Most of them send an IPC event to the renderer, and the renderer reacts. The renderer in turn pushes small pieces of state back so the menu can change its labels and enabled state.

```
Menu click (main)  ──send('channel')──►  preload listener  ──►  renderer hook/component
Renderer store     ──update-menu-state──►  menu.handler.ts  ──►  menu rebuilt with new state
```

| File              | Builds                                                |
| ----------------- | ----------------------------------------------------- |
| `index.ts`        | `createMenu(state)` assembles the four menus in order |
| `file.menu.ts`    | File menu                                             |
| `view.menu.ts`    | View menu                                             |
| `library.menu.ts` | Library menu, including the import/export dialogs     |
| `help.menu.ts`    | Help menu                                             |
| `menu-state.ts`   | The `MenuState` interface the renderer can push       |

---

## Menu structure

Accelerators use `CmdOrCtrl`, so they are `Ctrl` on Windows and Linux and `Cmd` on macOS.

### File

| Item                           | Accelerator    | Action                                                             |
| ------------------------------ | -------------- | ------------------------------------------------------------------ |
| Check for Updates...           | `Ctrl+U`       | Runs a manual update check (`appUpdateService`)                    |
| Settings...                    | `Ctrl+,`       | Sends `navigate` to `/settings`                                    |
| Go Incognito / Leave Incognito | `Ctrl+Shift+N` | Sends `progress:toggle-incognito`. The label follows `isIncognito` |
| Go Offline / Go Online         | `Ctrl+Shift+O` | Sends `connectivity:toggle-offline`. The label follows `isOffline` |
| Exit                           | `Alt+F4`       | `role: 'quit'`                                                     |

### View

| Item              | Accelerator | Action                                                                  |
| ----------------- | ----------- | ----------------------------------------------------------------------- |
| Browse Manga      | `Ctrl+1`    | Sends `navigate` to `/browse`                                           |
| My Library        | `Ctrl+2`    | Sends `navigate` to `/library`                                          |
| Downloads         | `Ctrl+3`    | Sends `navigate` to `/downloads`                                        |
| Reading History   | `Ctrl+4`    | Sends `navigate` to `/history`                                          |
| Toggle Fullscreen | `F11`       | `role: 'togglefullscreen'`                                              |
| Reload            | `Ctrl+R`    | `role: 'reload'`                                                        |
| Toggle DevTools   | `F12`       | `role: 'toggleDevTools'`. Only present when `NODE_ENV` is `development` |

### Library

| Item                                            | Accelerator    | Action                                                                                               |
| ----------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| Import Library → From DexReader Backup...       | none           | Open dialog (`.dexreader`), then sends `import-library` with the path                                |
| Import Library → From Mihon/Tachiyomi Backup... | none           | Open dialog (`.proto.gz`, `.tachibk`), then sends `import-tachiyomi`                                 |
| Export Library → To DexReader Backup...         | `Ctrl+Shift+E` | Save dialog (default `dexreader-backup.dexreader`), then sends `export-library`                      |
| Export Library → To Mihon/Tachiyomi Format...   | none           | Warns that some data is not exported, then a save dialog (`.tachibk`), then sends `export-tachiyomi` |

The Library menu used to carry five more items (Add to Favourites, Create Collection, Manage Collections, Download Chapter, Download Manga). They were never wired to anything in the renderer and were removed; favourites, collections and downloads are reached through the UI (card buttons, the collection tabs and dialogs, the download controls).

The file dialogs are opened by the main process, and only the chosen path is sent to the renderer. The renderer does the import or export work in `BackupHost`, an app-level component mounted once in `App.tsx` (above the Reader/AppShell split, after the Gatekeeper gate), so these items work from every view including the Reader, not only the Library. `BackupHost` owns `useDexReaderImportExport`, `useMihonImportExport` and the four dialogs they drive, and a shared lock (`utils/backupOperationLock.ts`) lets only one backup operation run at a time. After an import, `utils/refreshAfterImport.ts` reloads the library, collections, progress and history stores.

### Help

| Item                                      | Accelerator | Action                                                     |
| ----------------------------------------- | ----------- | ---------------------------------------------------------- |
| Documentation                             | `F1`        | Opens the project wiki in the browser                      |
| Keyboard Shortcuts...                     | `Ctrl+/`    | Sends `show-shortcuts` (handled in `AppShell`)             |
| Report an Issue → View Existing Issues... | none        | Opens the GitHub issues page                               |
| Report an Issue → New Bug Report...       | none        | Opens the bug report template                              |
| Report an Issue → Request a Feature...    | none        | Opens the feature request template                         |
| Report an Issue → Other Feedback...       | none        | Opens the other-issues template                            |
| Open Logs Folder                          | none        | Opens `<userData>/logs`                                    |
| About DexReader...                        | none        | Message box with the version and a "Visit MangaDex" button |

---

## Menu state

The renderer pushes partial state with `globalThis.api.updateMenuState({...})`, a one-way `ipcRenderer.send('update-menu-state', ...)`. `menu.handler.ts` merges it into the last known state and **rebuilds the whole menu** with `Menu.setApplicationMenu`.

```typescript
interface MenuState {
  isIncognito?: boolean
  isOffline?: boolean
  // Also still declared, but unused since the Library menu items they drove were removed:
  // canAddToFavorites, isFavorited, canDownloadChapter, chapterTitle, canDownloadManga, mangaTitle
}
```

What actually pushes state today:

| Field         | Pushed by                                                    |
| ------------- | ------------------------------------------------------------ |
| `isIncognito` | `progressStore.toggleIncognito`                              |
| `isOffline`   | `connectivityStore` whenever the connectivity status changes |

The `can*`, `isFavorited`, `chapterTitle` and `mangaTitle` fields in `MenuState` belonged to the removed Library items. Nothing reads or sets them any more (see "Known gaps").

### Which events the renderer handles

| Channel                                | Listener                                           |
| -------------------------------------- | -------------------------------------------------- |
| `navigate`                             | `onNavigate` (`AppShell`, `App`, gatekeeper guard) |
| `show-shortcuts`                       | `AppShell` (raw `ipcRenderer.on`)                  |
| `progress:toggle-incognito`            | `useIncognitoListener`                             |
| `connectivity:toggle-offline`          | `useConnectivityListener`                          |
| `import-library`, `export-library`     | `useDexReaderImportExport` (via `BackupHost`)      |
| `import-tachiyomi`, `export-tachiyomi` | `useMihonImportExport` (via `BackupHost`)          |

---

## Known gaps

These are properties of the current code, not design intent:

1. **Leftovers from the removed Library items.** The menu no longer builds Add to Favourites, Create/Manage Collections or Download Chapter/Manga, but the code that supported them is still there: the `MenuState` fields above (and their copy in the preload `updateMenuState` type), the preload listeners (`onAddToFavorites`, `onCreateCollection`, `onManageCollections`, `onDownloadChapter`, `onDownloadManga`) with their types and tests, and the matching strings in `menu.json` for each locale. None of it is reachable. It can be deleted in a clean-up.
2. **No access keys.** Labels have no `&` mnemonics, so `Alt+F`, `Alt+V` and so on do not open the menus. The menus can still be used with the mouse and by their accelerators.

---

## Platform notes

- **Windows**: the menu bar is the standard window menu. `Alt+F4` quits.
- **Linux**: the same menu template is used.
- **macOS**: DMG builds exist, but the template defines only these four menus, with no application menu (so no `Cmd+Q` or Hide entries from a standard app menu). Exit uses `role: 'quit'`, and the `CmdOrCtrl` accelerators map to `Cmd`.

---

## Adding a menu item

1. Add the label to the `menu` namespace in every locale (`src/locales/en-GB`, `en-US`, `vi-VN`).
2. Add the item to the matching `*.menu.ts` file. Use `mainWindow.webContents.send('channel')` for an action the renderer performs, or a `role` for a standard Electron action.
3. For a new channel, expose a listener in `src/preload/index.ts` and `src/preload/window.types.ts`, and subscribe to it in the renderer. An item with no subscriber appears to work but does nothing.
4. If the item's label or enabled state depends on app state, add the field to `MenuState` (and the preload `updateMenuState` type), and push it from the store that owns that state.
5. Check the accelerator against the existing ones above so it isn't bound twice.

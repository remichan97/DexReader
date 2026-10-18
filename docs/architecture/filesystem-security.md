# Filesystem Security

**Last updated**: October 2026 (v1.16.1)
**Source**: `src/main/filesystem/path-validator.ts`, `src/main/filesystem/secure-fs.ts`, `src/main/settings/settings-manager.ts`

---

## Overview

The renderer cannot touch the disk. When it needs a file operation it sends an `fs:*` request over IPC, and the main process performs it through `secureFs`, which checks every path against a short list of allowed folders first. The same wrapper is used by main-process services (downloads, covers, logs, snapshots), so the rule is the same on both sides:

> A path may be read, written or deleted only if it resolves, with no symlink anywhere in it, to a location inside an allowed root.

```
Renderer ──fs:read-file──► file-systems.handler ──► secureFs.readFile ──► validatePath ──► node:fs
                              (validates arguments)        (allowed roots, symlinks, traversal)
```

---

## Allowed roots

All roots are computed lazily (`initializePaths()`), because `app.getPath()` is not available before Electron is ready.

| Root          | Location                                   | Notes                                                                                      |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `appData`     | `~/.dexreader` (the user's home directory) | Database (`dexreader.db`), caches and everything below it                                  |
| `downloads`   | `~/.dexreader/downloads` by default        | **User-configurable**: see below                                                           |
| `cachedCover` | `~/.dexreader/cache/covers`                | Cover image disk cache                                                                     |
| `snapshot`    | `~/.dexreader/snapshots`                   | Database restore points                                                                    |
| `logs`        | `<userData>/logs`                          | Electron's per-user data folder, **not** under `~/.dexreader`                              |
| `devDatabase` | `process.cwd()`                            | **Development only**, so the project-root `dexreader-dev.db` can be backed up and restored |

`~/.dexreader` is a deliberate choice: it keeps user data apart from Electron's own `userData` files. `settings.json` is the exception. It lives in Electron's `userData` folder (the `electron-store` default), outside every root, and is read and written by `settingsManager` rather than through `secureFs`.

### Changing the downloads folder

The user picks a folder in Settings (`fs:select-downloads-folder` opens the native folder dialog). The flow is:

1. `settingsManager.validateDownloadsPath(path)` strips control characters (including null bytes), rejects a short blocklist of system directories, and checks the path exists and is a directory. This runs when the folder is chosen, without saving it, so Settings can show it as an unsaved change.
2. When the user saves, the same validation runs again (`sanitizeDownloadsSection`), the setting is persisted, and `updateDownloadsPath()` replaces the in-memory `downloads` root.
3. At startup `initializeDownloadsPath()` re-validates the saved path. If it no longer validates (the folder was deleted or the drive is gone), it logs a warning, falls back to the default folder and clears the setting.

Because the chosen folder becomes an allowed root, **picking a broad folder (a whole drive, for example) widens what the sandbox permits**.

---

## How a path is validated

`validatePath(inputPath)` returns the normalised path or throws `Access to the selected path is not allowed.`

1. **Normalise**: `path.normalize(path.resolve(input))` turns relative paths and `..` segments into one absolute path, so `~/.dexreader/downloads/../../.ssh` is judged as `~/.ssh`.
2. **Resolve symlinks**: `resolveRealPath()` walks up to the deepest ancestor that exists, takes its `realpath`, and re-appends the part that doesn't exist yet. (Plain `realpath` throws on a path that doesn't exist, which would break creating any new file.)
3. **Reject any difference**: if the real path differs from the normalised path, then the target or one of its ancestors is a symlink (or junction) that could point outside the sandbox, and the path is refused. A symlink is therefore never followed, even if it happens to point inside a root.
4. **Check the root**: the path must equal an allowed root or start with that root plus a path separator. Matching on the separator matters: a plain `startsWith` would let `~/.dexreader-evil` through because it shares a prefix with `~/.dexreader`.

Every refusal is logged with `mainLog.warn`.

---

## `secureFs`

`secureFs` mirrors the parts of `node:fs/promises` the app needs, validating each path argument first:

| Method                                                               | Notes                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `readFile(path, encoding?)`, `readDir`, `stat`, `statFs`, `isExists` | Read-only                                                   |
| `writeFile(path, data, encoding?)`, `appendFile`                     | Create the parent folder first; Buffers are written as-is   |
| `mkdir`, `ensureDir`                                                 | Recursive                                                   |
| `copyFile(src, dest)`, `rename(old, new)`                            | Both paths are validated; the destination folder is created |
| `deleteFile`, `deleteDir`                                            | `deleteDir` is recursive and forced                         |

### Where `secureFs` is not used

The rule "go through `secureFs`" is a convention, and nothing enforces it: ESLint only restricts imports between `main`, `preload` and `renderer`, not `node:fs`. Six main-process files import `node:fs/promises` directly:

| File                                                     | Use                                                              |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| `dexreader-export.service.ts`, `mihon-export.service.ts` | Write a backup to a path the user chose in a native save dialog  |
| `dexreader-import.service.ts`, `mihon-backup.service.ts` | Read a backup from a path the user chose in a native open dialog |
| `dexreader-download.helper.ts`                           | `mkdir` for a download folder                                    |
| `cleanup.repo.ts`                                        | `stat` of the database file to report its size                   |

The import and export cases are intentional: the user can pick any location, which is outside the allowed roots by definition. The download `mkdir` and the database `stat` use paths main built itself.

---

## The renderer-facing API

The `fs:*` channels (14 of them) are in `src/main/ipc/handlers/file-systems.handler.ts` and exposed as `globalThis.fileSystem`:

`readFile`, `writeFile`, `appendFile`, `copyFile`, `rename`, `isExists`, `mkdir`, `unlink`, `rmdir`, `stat`, `readdir`, `getAllowedPaths`, `selectDownloadsFolder`, `openDownloadsFolder`.

Each file handler validates its arguments and then calls `secureFs`. Note that two different functions are called `validatePath`: the one in `src/main/ipc/validators.ts` only checks that an argument is a non-empty string (see [ipc-messaging.md](./ipc-messaging.md)), while the one in `path-validator.ts` is the sandbox check that `secureFs` runs. `getAllowedPaths` returns only `appData` and `downloads`. `src/renderer/src/hooks/useFileSystem.ts` wraps these calls for components.

Errors reach the renderer as `IpcResponse` errors with absolute paths scrubbed from the message.

---

## What this does and doesn't guarantee

**Prevents**

- `..` traversal out of an allowed root
- Sibling folders that merely share a root's name as a prefix
- Reaching outside a root through a symlink or junction in any part of the path
- Access to any folder that isn't one of the roots above, for every caller that uses `secureFs`

**Does not prevent**

- Direct `node:fs` use elsewhere in main (see the table above)
- A check-then-use race: validation and the operation are separate steps, so a path that changes between them isn't caught
- Hard links: the check is on the path, not the inode
- Access to a broad downloads folder the user chose themselves

---

## Known limitations

- **Symlinked downloads folders are refused.** A downloads folder that is itself a symlink or junction, or sits under one, fails step 3 of validation, so downloads into it fail even though the folder dialog accepted it.
- **The system-directory blocklist is a prefix check.** `isSystemDirectory` compares the raw string with `startsWith`: it is case-sensitive (`c:\windows` is not matched), only covers `C:` on Windows, and also matches lookalikes such as `C:\Windows.old`. It is a guard against an obvious mistake, not a security boundary; the allowed-roots check is the boundary.
- **Network (UNC) paths are allowed** if the user selects one. A disconnected share then fails with an access error.
- **Case sensitivity** follows the operating system.

---

## Testing

`path-validator.test.ts` and `secure-fs.test.ts` are colocated and run with `npm run test`; `src/main` is coverage-gated. `path-validator.test.ts` covers the allowed roots (including a custom downloads root), the separator-boundary regression, paths outside the sandbox, and symlink escape. Handler behaviour is covered by `file-systems.handler.test.ts`.

A quick manual check after changing validation: from DevTools in a development build, call `globalThis.fileSystem.readFile('C:/Windows/win.ini')` (Windows) or `readFile('/etc/passwd')`, and `readFile` with a `..` path that climbs out of `~/.dexreader`. All should return `success: false` with `Access to the selected path is not allowed.`

---

## Troubleshooting

### "Access to the selected path is not allowed"

The path is outside every root, or a symlink or junction appears somewhere in it. Check the `[PathValidator]` warning in the log: it says whether the path was "not allowed" or a "possible symlink" and shows where it resolves to.

### Snapshot or database backup is refused in development

The development database lives in the project root, which is only an allowed root when `NODE_ENV_ELECTRON_VITE` is `development`. Run through `npm run dev`.

### Downloads folder reset after a restart

`initializeDownloadsPath()` falls back to the default and clears the setting when the saved folder no longer exists or no longer validates (a removed drive, a path that became a symlink). Pick the folder again in Settings.

### Settings aren't saved

`settings.json` is managed by `electron-store` in the Electron `userData` folder, not through `secureFs`. Open it from Settings → Danger Zone (`settings:open-settings-file`) to inspect it. It is plain JSON and is not encrypted; an invalid file is cleared by `electron-store` (`clearInvalidConfig`) and rebuilt from defaults.

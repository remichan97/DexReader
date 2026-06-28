# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DexReader is a cross-platform Electron desktop app for reading manga from MangaDex. It provides offline downloads, a personal library, reading progress tracking, and backup/restore functionality.

**Language**: British English is required throughout UI text, code comments, and documentation.

## Developement Commands

```bash
npm run dev           # Start dev server with HMR (renderer hot-reloads; main/preload require Electron restart)
npm run typecheck     # Run both node and web TypeScript checks (required before committing)
npm run lint          # ESLint
npm run format        # Prettier
npm run build         # typecheck + electron-vite build (production)
npm run build:win     # Windows NSIS installer
npm run build:mac     # macOS DMG
npm run build:linux   # Linux AppImage + deb
```

There are no unit tests. Quality gates are `npm run typecheck` and `npm run lint`.

**Prettier config** (`.prettierrc.yaml`): single quotes, no semicolons, 100-char line width, no trailing commas.

## Architecture

Three-process Electron model. All cross-process communication goes through a single security bridge:

```
Renderer (React/Zustand) → Preload (contextBridge) → Main (Node.js/SQLite/MangaDex API)
```

- **Renderer**: `src/renderer/src/` — React 19, React Router v6, Zustand 5 stores, `window.api.*` calls only
- **Preload**: `src/preload/` — exposes typed `window.api.*` surface via `contextBridge`; all channels return `IpcResponse<T>` (defined in `src/preload/ipc.types.ts`)
- **Main**: `src/main/` — IPC handlers, SQLite database, MangaDex API client, filesystem security, settings

### IPC Channel Conventions

- Channel naming: `<category>:<action>` (e.g., `library:add`, `filesystem:read`)
- Every handler must use `wrapIpcHandler` from `src/main/ipc/wrap-handler.ts`
- New channels: add handler file at `src/main/ipc/<category>.handler.ts`, register in `src/main/ipc/registry.ts`, expose in `src/preload/index.ts` and type in `src/preload/index.d.ts`

### Filesystem Security

All filesystem operations must go through `src/main/filesystem/secureFs.ts`. Direct `fs` calls are not permitted — paths are validated against two allowed roots (AppData + Downloads) via `src/main/filesystem/pathValidator.ts` to prevent traversal attacks.

### Image Proxy

MangaDex blocks hotlinking. Two custom protocols in the main process handle all images:

- `mangadex://` — online images, LRU-cached, streamed from CDN
- `local-manga://` — downloaded chapters served from the local filesystem

Never use plain HTTPS image URLs in the renderer.

### Database

SQLite via Node.js built-in `node:sqlite` + Drizzle ORM 1.0.

- Connection: `src/main/database/connection.ts`
- Schemas: `src/main/database/schemas/`
- Repositories (CRUD): `src/main/database/repositories/`
- Migrations: `src/main/database/migrations/`
- DB file lives at `AppData/dexreader.db`

Adding a table: define schema → create migration → add repository → add IPC handler → expose via preload.

> Migrations are auto-generated — never write files in `src/main/database/migrations/` by hand. Run `npx drizzle-kit generate <migration_name>` after changing a schema to produce the migration file.

### State Management

Zustand 5 stores in `src/renderer/src/stores/`. Stores are ephemeral (rehydrated from main process on load); persistence is via Settings Manager (`electron-store` → `AppData/settings.json`) or SQLite via IPC.

### Settings

`src/main/settings/settings-manager.ts` — uses `electron-store` with encryption. Loaded on startup with defaults fallback.

## TypeScript Standards

- No `any` — use `unknown` and narrow instead
- No inline destructuring in function parameters — define an `interface` for params
- Explicit return types on all functions and methods
- `interface` for object shapes, `type` for aliases/unions/intersections
- `const` enums where runtime values are not needed
- Prefer `undefined` over `null`
- `async/await` over raw Promises
- Constants: `UPPER_SNAKE_CASE`; variables/functions: `camelCase`
- Avoid `!` non-null assertions and `as` casts unless unavoidable
- Assign access modifiers (`public`/`private`/`protected`) to all class members

## Process-Specific Rules

**Main process** (`src/main/**`):

- Log with `mainLog` at appropriate levels (info/warning/error)
- Never bypass `secureFs` for filesystem operations

**Renderer** (`src/renderer/**`):

- Log with `rendererLog`
- Shared interfaces/types/utils go in `src/renderer/src/interfaces`, `types`, or `utils` — not colocated in components unless self-contained
- All destructive actions (delete, reset) must trigger a native Electron dialog via IPC before proceeding

**Preload** (`src/preload/**`):

- All exposed channels must return `IpcResponse<T>`
- Keep `index.ts` (runtime) and `index.d.ts` (types) in sync

## Key File Locations

| What                  | Where                                             |
| --------------------- | ------------------------------------------------- |
| IPC registry          | `src/main/ipc/registry.ts`                        |
| IPC wrap helper       | `src/main/ipc/wrap-handler.ts`                    |
| Preload API surface   | `src/preload/index.ts` + `src/preload/index.d.ts` |
| Secure filesystem     | `src/main/filesystem/secureFs.ts`                 |
| MangaDex API client   | `src/main/api/mangadex-client.ts`                 |
| Settings manager      | `src/main/settings/settings-manager.ts`           |
| Image proxy protocols | `src/main/api/proxy/`                             |
| Zustand stores        | `src/renderer/src/stores/`                        |
| Routing               | `src/renderer/src/router.tsx`                     |
| CSS design tokens     | `src/renderer/src/assets/base.css`                |
| Translations (en-GB)  | `src/locales/`                                    |
| IPC types (preload)   | `src/preload/ipc.types.ts`                        |

## Memory Bank

The `.github/memory-bank/` directory contains living documentation that should be read for deeper context:

- `active-context.md` — current sprint state, recent changes, known issues (read this first each session)
- `system-pattern.md` — architectural patterns and coding conventions in detail
- `architecture-overview.md` — component map, data flow diagrams, extension points
- `tech-context.md` — full technology stack, versions, and configuration details

Detailed docs are in `docs/` (API reference, architecture deep-dives, component library, design system).

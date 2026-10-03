# DexReader Technical Context

**Last Updated**: 3 October 2026
**Project Version**: 1.15.0
**Type**: Desktop Application (Electron)

---

## Technology Stack

### Core Runtime

| Technology   | Version                                                                              | Purpose                       |
| ------------ | ------------------------------------------------------------------------------------ | ----------------------------- |
| **Electron** | 43.7.5                                                                               | Desktop application framework |
| **Node.js**  | bundled with Electron 43 (see Electron's release notes for the exact pinned version) | Runtime                       |
| **Chromium** | bundled with Electron 43                                                             | Embedded browser              |

### Frontend Framework

| Technology     | Version | Purpose                   |
| -------------- | ------- | ------------------------- |
| **React**      | 19.1.1  | UI library                |
| **React DOM**  | 19.1.1  | DOM rendering             |
| **TypeScript** | 5.9.2   | Type system & compilation |

### Build & Development Tools

| Technology           | Version | Purpose                              |
| -------------------- | ------- | ------------------------------------ |
| **Vite**             | 7.3.5   | Frontend build tool & dev server     |
| **electron-vite**    | 5.0.0   | Electron-specific Vite wrapper       |
| **electron-builder** | 26.15.3 | Application packaging & distribution |

### Code Quality

| Technology              | Version | Purpose                       |
| ----------------------- | ------- | ----------------------------- |
| **ESLint**              | 9.36.0  | JavaScript/TypeScript linting |
| **Prettier**            | 3.6.2   | Code formatting               |
| **TypeScript Compiler** | 5.9.2   | Type checking                 |

### Testing

| Technology                 | Version | Purpose                                                                                                        |
| -------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| **Vitest**                 | 4.1.11  | Test runner, workspace split into `main` (Node env) and `renderer` (happy-dom env) projects                    |
| **@vitest/coverage-v8**    | 4.1.10  | Coverage provider; per-area thresholds gate `src/main`, `src/preload`, `src/shared`, `src/renderer/src/stores` |
| **@testing-library/react** | 16.3.2  | Renderer hook/component testing (`renderHook`, `render`)                                                       |
| **happy-dom**              | 20.10.6 | DOM environment for the renderer test project                                                                  |

Tests are colocated with the source they cover (`foo.ts` next to `foo.test.ts`). As of the v1.15.0 test-coverage effort, the suite has ~1412 tests across the main process, preload bridge, all 10 Zustand stores, and renderer hooks. Coverage thresholds (`vitest.config.ts`):

| Area                         | Statements | Branches | Functions | Lines |
| ---------------------------- | ---------- | -------- | --------- | ----- |
| `src/main/**`                | 70%        | 70%      | 65%       | 70%   |
| `src/preload/**`             | 95%        | 95%      | 95%       | 95%   |
| `src/shared/**`              | 90%        | 90%      | 90%       | 90%   |
| `src/renderer/src/stores/**` | 75%        | 65%      | 90%       | 75%   |

The renderer views/components tier is intentionally left without unit tests or a coverage gate — see `CLAUDE.md`'s Developement Commands section (better suited to E2E testing).

---

## Key Dependencies

### Production Dependencies

**State Management**:

- `zustand@5.0.9` - Lightweight state management (~1.4kb)

**Database**:

- `node:sqlite` - Node.js built-in SQLite bindings (no native/compiled deps — `better-sqlite3` was removed in v1.11.0 specifically to drop the C++ toolchain requirement)
- `drizzle-orm@1.0.0-beta.22` - Type-safe ORM for SQLite
- `drizzle-kit@1.0.0-beta.22` - Database migrations toolkit (dev dependency)

**UI Components**:

- `@fluentui/react-icons@2.0.315` - Microsoft Fluent UI icon library
- `react-router-dom@7.18.3` - Client-side routing (migrated from v6 in September 2026)

**Internationalisation**:

- `i18next@26.0.10` - i18n framework
- `react-i18next@17.0.7` - React bindings for i18next
- `i18next-fs-backend@2.6.5` - Filesystem backend for translations
- Locales: `en-GB` (default), `en-US`, `vi-VN` (`src/locales/`)

**Binary Serialization**:

- `protobufjs@8.6.6` - Protocol Buffers for backup functionality
- `pako@2.1.0` - gzip compression for backups

**Security & Logging**:

- `bcrypt-ts@8.0.1` - Password hashing for Gatekeeper (app lock) — pure-TS, no native build step (not `bcrypt`)
- `electron-log@5.4.3` - Application logging

**Electron Utilities**:

- `@electron-toolkit/preload@3.0.2` - Preload script helpers
- `@electron-toolkit/utils@4.0.0` - Common Electron utilities
- `electron-updater@6.8.9` - Auto-update functionality
- `electron-store@11.0.2` - Settings persistence with encryption support

---

## MangaDex API Integration

This application integrates with the MangaDex API to provide content to the user. Detailed patterns can be found in `system-pattern.md`.

---

## Development Environment

### Required Software

- **Node.js**: whatever version matches Electron 43's bundled runtime (project itself has no `engines` pin in `package.json` — check Electron's release notes rather than assuming a specific minor)
- **npm**: current LTS-compatible version
- **Git**: For version control
- **VS Code**: Recommended IDE with ESLint and Prettier extensions

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server with HMR

# Quality Checks
npm run typecheck              # Type validation (node + web)
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier
npm run test                   # Run the Vitest suite once (main + renderer)
npm run test:watch             # Vitest in watch mode
npm run test:coverage          # Vitest with coverage; enforces per-area thresholds

# Building
npm run build                  # typecheck + electron-vite build (production)
npm run build:win              # Windows installer (NSIS)
npm run build:mac              # macOS DMG
npm run build:linux            # Linux packages (AppImage, deb)
```

---

## Build System

### electron-vite Configuration

**Three-Process Build Pipeline**:

- **Main Process**: Node.js environment, dependencies externalized
- **Preload Scripts**: Bridge between main and renderer, dependencies externalized
- **Renderer Process**: Browser environment, React with Fast Refresh, path aliases (`@renderer/*`)

**Current Module Format**: ES Modules (ESM)

- `package.json` includes `"type": "module"`
- Source code uses ES imports exclusively
- Uses `import.meta.url` pattern for path resolution (no `__dirname` at the top level; main-process files that need it derive it via `fileURLToPath(import.meta.url)`)
- electron-vite configured for ESM output

---

## TypeScript Configuration

**Multi-Config Strategy**: Three separate TypeScript configurations

1. `tsconfig.json` - Root coordinator (project references)
2. `tsconfig.node.json` - Main & Preload (Node.js environment)
3. `tsconfig.web.json` - Renderer (browser environment, JSX support, path aliases)

**Benefits**: Separate type checking for Node.js vs browser environments, incremental compilation, type-safe path aliases.

---

## ESLint & Prettier

**ESLint 9+ Flat Config** with:

- TypeScript recommended rules
- React best practices (including hooks validation)
- React Refresh compatibility (HMR)
- Prettier integration (no conflicting rules)

**Prettier Configuration** (`.prettierrc.yaml`):

```yaml
singleQuote: true # 'string' not "string"
semi: false # No semicolons
printWidth: 100 # Max line length
trailingComma: none # No trailing commas
```

---

## Security Configuration

### Content Security Policy

**Policy** (`src/renderer/index.html`):

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: mangadex: local-manga:;
```

- `default-src 'self'` - Only load resources from same origin
- `script-src 'self'` - No inline scripts, only bundled code
- `style-src 'self'` - No inline styles permitted
- `img-src 'self' data: mangadex: local-manga:` - Local images, data URIs, and the app's own `mangadex://`/`local-manga://` proxy protocols only — **no plain `https:`**, which is why raw MangaDex CDN URLs can never be used directly in the renderer

### Context Isolation & Sandbox

(`src/main/window.ts`)

- `sandbox: true` — the renderer runs sandboxed
- `contextIsolation: true` — renderer cannot access Node.js or Electron internals directly
- `devTools: is.dev` — DevTools disabled in production builds, available in dev
- All APIs exposed via `contextBridge` in preload scripts

---

## IPC Communication Architecture

**Documentation**: `docs/architecture/ipc-messaging.md`
**Implementation**: 21 handler files in `src/main/ipc/handlers/`, registered centrally in `src/main/ipc/registry.ts`, totalling over 100 channels (every request/response channel goes through `wrapIpcHandler`; `menu:update-menu-state` is the one plain `ipcMain.on` fire-and-forget event).

### Handler Files (by domain)

`app-settings`, `app-update`, `collections`, `database-snapshots`, `dexreader`, `dialogs`, `download`, `download-queue`, `file-systems`, `gatekeeper`, `history`, `library`, `logger`, `mangadex`, `menu`, `mihon`, `progress-tracking`, `reader-settings`, `search-presets`, `shell`, `storage`, `theme`.

### Error Handling Pattern

All IPC handlers use `wrapIpcHandler` for consistent error handling:

- Automatic error serialization for IPC transport
- Runtime validation for all IPC arguments (see `src/main/settings/validators/`)
- Type-safe responses via `IpcResponse<T>` wrapper (`src/preload/ipc.types.ts`)

---

## Filesystem Architecture

**Documentation**: `docs/architecture/filesystem-security.md`

### Core Security

**Path Validator** (`src/main/filesystem/path-validator.ts`):

- Validates all filesystem paths against 2 allowed directories: AppData + Downloads
- Prevents path traversal and symlink exploits
- Canonical path resolution for security

**Secure Filesystem** (`src/main/filesystem/secure-fs.ts`):

- Wraps Node.js `fs/promises` with automatic path validation
- Parent directories automatically created on write operations

**Settings Manager** (`src/main/settings/settings-manager.ts`):

- Persists app-wide settings to `AppData/settings.json` (electron-store v11, encrypted)
- Schema domains live in `src/shared/types/settings/*` (app, appearance, downloads, language, logs, manga overrides, reader, reader performance, search, snapshot, system, update)
- Loads on app startup with graceful fallback to defaults if corrupted

---

## State Management

**Library**: Zustand 5.0.9 (~1.4kb, minimal boilerplate, TypeScript-first)

**Current Stores** (`src/renderer/src/stores/`) — 10 stores:

1. **appStore** - Theme, UI state, fullscreen
2. **collectionsStore** - User-created library collections
3. **connectivityStore** - Online/offline state
4. **historyStore** - Read History feed state
5. **libraryStore** - Bookmarks/favourites
6. **progressStore** - Reading progress (optimistic updates, pending-save flushing)
7. **searchPresetsStore** - Saved search/filter presets
8. **searchStore** - Browse/search query state
9. **sidebarStore** - Sidebar/navigation UI state
10. **toastStore** - Global notifications (ephemeral)

> Note: a `userPreferencesStore.ts` existed pre-`electron-store` handoff and was removed as dead code on 2 September 2026 (zero real consumers) — all reader/download/UI/notification preferences now live in `src/shared/types/settings/*`, persisted via `electron-store`.

**Persistence Strategy**:

- App-wide settings: Persisted via Settings Manager (main process) to `AppData/settings.json`
- Renderer stores: Ephemeral, rehydrated from main process on load
- Library data: SQLite database via IPC

---

## Error Handling System

**Documentation**: `docs/architecture/error-handling.md`

### Components

**Error Boundaries** (`src/renderer/src/components/ErrorBoundary/`):

- React class component for catching component errors
- Fallback UI with 3 levels: app/page/component

**Error Recovery** (`src/renderer/src/components/ErrorRecovery/`):

- Inline error UI with retry button
- Casual, user-friendly error display

**Logging** (`src/main/services/logging/`, `src/renderer/src/services/logging.service.ts`):

- `mainLog` (main process) / `rendererLog` (renderer) wrap `electron-log`
- Automatic toast notifications and error logging on uncaught errors

**Connectivity Store** (`src/renderer/src/stores/connectivityStore.ts`):

- States: `online | offline-user | offline-no-internet`
- Automatic connectivity monitoring (polling, started/stopped in `App.tsx`)
- Drives `<OfflineStatusBar />` component

---

## Protobuf & Backup System

**Purpose**: Binary serialization for library backups with compression

### Schemas (`src/main/services/protobuf/schemas/`)

1. **DexReader Native** — services in `src/main/services/dexreader/` (`dexreader-export.service.ts`, `dexreader-import.service.ts`)
   - File extension: `.dexreader`
   - Includes: library data, collections, progress, reader settings
   - Excludes: reading statistics (recalculated on import), app settings (separate backup)
   - Encoding: Protobuf (binary) + gzip (`pako`) compression

2. **Mihon/Tachiyomi Compatibility** — services in `src/main/services/mihon/` (`mihon-backup.service.ts`, `mihon-export.service.ts`)
   - Import: Decode Mihon backups, filter MangaDex manga, import to library
   - Export: Export library to Mihon format with tag conversion
   - MangaDex source ID: `2499283573021220255` (matched as a `BigInt` against each backed-up manga's `source` field)

---

## Known Limitations

### Platform Differences

**Windows**:

- Native menus work differently

**macOS**:

- App signing and notarization required for distribution
- macOS-specific entitlements needed for certain permissions
- App stays active when all windows close (macOS convention)

**Linux**:

- Multiple package formats (AppImage, deb)
- Icon handling varies by desktop environment

---

## Documentation

**Primary Sources**:

- **API Reference**: `docs/api-reference.md` - Complete IPC channel listing
- **Architecture**: `docs/architecture/` - System design documents (IPC messaging, database, error handling, filesystem security, MangaDex API, menu structure, navigation flow, state management, layout specs)
- **Component Library**: `docs/components/` - UI component guides
- **Design System**: `docs/design/` - Visual design principles and wireframes

**Memory Bank**: `.ai/`

- `active-context.md` - Current project state (last 2-3 weeks)
- `project-brief.md` - High-level overview and goals
- `system-pattern.md` - Architectural patterns and conventions
- `architecture-overview.md` - Component map and data flow
- `tech-context.md` (this file) - Technology stack overview

---

_This document provides a high-level overview of DexReader's technology stack, critical architecture decisions, and essential configuration information. For detailed implementation patterns and coding standards, see `system-pattern.md`. For in-depth documentation, refer to the `docs/` directory._

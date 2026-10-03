# DexReader Architecture Overview

**Last Updated**: 3 October 2026
**Version**: 1.15.0
**Purpose**: Top-down view of the application - where things are, how they connect, and what they do

> **Companion to**: `system-pattern.md` (architectural patterns & principles), `tech-context.md` (technology stack & versions)
>
> **This document provides**: A conceptual map showing component locations, relationships, and data flow. For implementation patterns and conventions, see `system-pattern.md`. For technology details and configuration, see `tech-context.md`.

---

## 🎯 The Big Picture

DexReader uses Electron's three-process architecture where each process has distinct responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS (React)                   │
│  • UI Components & Views                                     │
│  • State Management (Zustand Stores)                         │
│  • Client-side Routing                                       │
│  • Local UI State & Interactions                             │
└─────────────────────────────────────────────────────────────┘
                              │
                    IPC (Inter-Process Communication)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    PRELOAD SCRIPT (Bridge)                   │
│  • Security Layer (contextBridge)                            │
│  • API Surface (window.api.*, window.settings.*, ...)        │
│  • Type-safe IPC Wrappers                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   MAIN PROCESS (Node.js)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Filesystem │  │   Database   │  │  MangaDex API    │  │
│  │  Operations │  │  (SQLite)    │  │  Client          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Window    │  │   Settings   │  │  Image Proxy     │  │
│  │ Management  │  │   Manager    │  │  (Protocols)     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                          │
│  • MangaDex API (api.mangadex.org)                          │
│  • MangaDex CDN (uploads.mangadex.org)                      │
│  • MangaDex At-Home Servers                                 │
│  • Local Filesystem (AppData, Downloads)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Application Layers (Top to Bottom)

### Layer 1: User Interface (Renderer Process)

**Location**: `src/renderer/src/`

This is what users see and interact with - the entire React application.

#### Views (Main Screens)

Routed in `src/renderer/src/router.tsx` (wrapped in `HashRouter` in `App.tsx`):

| View             | Path                               | Purpose                                                 |
| ---------------- | ---------------------------------- | ------------------------------------------------------- |
| **Browse**       | `/browse`                          | Discover manga — latest updates, search, filters        |
| **Manga Detail** | `/browse/:mangaId`                 | Manga information, chapters list, bookmark actions      |
| **Creator**      | `/creator/:creatorType/:creatorId` | Author/artist page — their other works                  |
| **Library**      | `/library`                         | Bookmarked manga, collections, sorting                  |
| **History**      | `/history`                         | Day-grouped reading history feed + calendar filter      |
| **Reader**       | `/reader/:mangaId/:chapterId`      | Chapter reading, page navigation, progress tracking     |
| **Settings**     | `/settings`                        | App configuration (sectioned via `SettingsSectionMenu`) |
| **Downloads**    | `/downloads`                       | Offline content, storage management                     |
| **Not Found**    | `*`                                | 404 catch-all                                           |

`GatekeeperUnlockScreen` (app-lock screen) is not a route — it's rendered directly in `App.tsx`, gating the whole app shell via `useGatekeeperGuard` before any route is shown.

#### UI Components

**Location**: `src/renderer/src/components/` (~55 components as of v1.15.0)

- **Layout/Shell**: `Sidebar`, `ViewTransition`
- **Manga Components**: `MangaCard`, `MangaStorageList`
- **Reader Components**: `ReaderSettingsModal`, `ReadingModeSelector`, `ZoomControlsModal`, `ProgressBar`, `ProgressRing`
- **Search/Filter**: `SearchBar`, `FilterPanel`, `FilterChip`, `PresetSelector`, `SavePresetDialog`
- **Backup/Import**: `DexReaderExportDialog`, `DexReaderImportDialog`, `ImportProgressDialog`, `ImportResultDialog`
- **Gatekeeper (app lock)**: `GatekeeperChangeModal`, `GatekeeperReauthModal`, `GatekeeperResetPrompt`, `GatekeeperSetupModal`
- **Shared/Primitives**: `Button`, `Input`, `Checkbox`, `Radio`, `Switch`, `Select`, `NumberSpinner`, `Modal`, `Popover`, `Tabs`, `Tooltip`, `ContextMenu`, `ListItem`, `Badge`
- **Feedback**: `Toast`, `InfoBar`, `EmptyState`, `ErrorState`, `LoadingState`, `Skeleton`, `ProgressBar`
- **Error Handling**: `ErrorBoundary`, `ErrorRecovery`, `OfflineStatusBar`
- **Updates**: `UpdateBanner`, `UpdateNotification`
- **Storage**: `StorageChart`, `DownloadStatusBadge`, `DownloadConfirmationDialog`
- **Misc**: `KeyboardShortcutsDialog`, `KeyboardShortcutsHandler`, `IncognitoStatusBar`, `StreamSourceIndicator`, `CollectionPickerDialog`, `CreateCollectionDialog`

#### State Management (Zustand Stores)

**Location**: `src/renderer/src/stores/` — 10 stores

| Store                  | Purpose                                         | Persistence                  |
| ---------------------- | ----------------------------------------------- | ---------------------------- |
| **appStore**           | Theme, fullscreen, general UI state             | Synced with Settings Manager |
| **collectionsStore**   | User-created library collections                | SQLite via IPC               |
| **connectivityStore**  | Online/offline state, polling                   | Ephemeral (system events)    |
| **historyStore**       | Read History feed/calendar state                | SQLite via IPC               |
| **libraryStore**       | Bookmarks/favourites                            | SQLite via IPC               |
| **progressStore**      | Reading progress, optimistic updates + rollback | SQLite via IPC               |
| **searchPresetsStore** | Saved search/filter presets                     | SQLite via IPC               |
| **searchStore**        | Browse/search query state                       | Ephemeral                    |
| **sidebarStore**       | Sidebar/navigation UI state                     | Ephemeral                    |
| **toastStore**         | Notifications                                   | Ephemeral (memory only)      |

> Reader/download/UI/notification preferences are settings, not a separate store — persisted via `electron-store` (`src/shared/types/settings/*`), not a Zustand store. A `userPreferencesStore` duplicating this existed as dead code and was removed 2 September 2026.

#### Services (Frontend Logic)

**Location**: `src/renderer/src/services/`

- **Logging Service** (`logging.service.ts`) — wraps `electron-log` as `rendererLog`

(Most "service"-shaped logic now lives in custom hooks under `src/renderer/src/hooks/` — e.g. `useGatekeeperGuard`, `useStartupTheme`, `useStartupLanguage`, `useStartupRoute`, `useUpdateBanner`, `useConnectivityListener`, `useIncognitoListener`, `useAccentColor` — rather than a dedicated services layer per feature.)

---

### Layer 2: Security Bridge (Preload Script)

**Location**: `src/preload/`

The preload script is the **only bridge** between renderer and main process. It exposes a carefully curated API surface via `contextBridge`, split across several globals (`window.api`, `window.settings`, `window.readHistory`, etc. — see `src/preload/index.ts` / `index.d.ts`).

#### What It Does

1. **Wraps IPC Channels**: Converts IPC calls into clean async functions
2. **Type Safety**: Provides TypeScript definitions for all exposed APIs
3. **Security**: Prevents renderer from accessing Node.js or Electron APIs directly

#### API Categories Exposed

Filesystem, database-backed library/collections/history/progress, MangaDex API (search, manga, chapters, images), settings (load/get/update-section/reset/clear), reader settings (per-manga overrides), download + download queue, Mihon/DexReader backup import-export, database snapshots, search presets, Gatekeeper (app lock), theme, dialogs, menu state, app update, logging, shell.

---

### Layer 3: Backend Logic (Main Process)

**Location**: `src/main/`

The main process is the "brain" of the application - it handles all the heavy lifting.

#### Sub-Systems

##### 1. Window Management (`src/main/window.ts`)

- Creates and manages the main application window (`sandbox: true`, `contextIsolation: true`, `autoHideMenuBar: false`)
- Anti-flicker pattern: window created with `show: false`, shown on `ready-to-show`
- Handles window lifecycle, platform-specific behaviours

##### 2. IPC Handlers (`src/main/ipc/`)

21 handler files registered centrally in `registry.ts`: `app-settings`, `app-update`, `collections`, `database-snapshots`, `dexreader`, `dialogs`, `download`, `download-queue`, `file-systems`, `gatekeeper`, `history`, `library`, `logger`, `mangadex`, `menu`, `mihon`, `progress-tracking`, `reader-settings`, `search-presets`, `shell`, `storage`, `theme` — over 100 channels in total, all wrapped by `wrapIpcHandler` for consistent error handling and validation.

##### 3. Database Layer (`src/main/database/`)

SQLite (`node:sqlite`, built-in — no native deps) with Drizzle ORM for all persistent data.

**Structure**:

- `db-connection.ts` - Database connection & initialisation (sets `PRAGMA foreign_keys = ON` once, for the connection's lifetime)
- `schemas/` - Table definitions
- `repositories/` - Data access layer (CRUD operations)
- `migrations/` - Database schema migrations (Drizzle-generated, never hand-written)
- `mappers/`, `utils/` - Row↔domain-object mapping and shared DB helpers
- `db-recovery.ts` - Startup corruption recovery

**Tables** (`schemas/`):

- `manga` - Cached manga metadata / library membership
- `chapter` - Chapter metadata
- `chapterDownloads` (`chapter-downloads.schema.ts`) - Downloaded chapter tracking
- `chapterProgress` / `mangaProgress` - Reading progress, per-chapter and per-manga
- `mangaReaderOverrides` - Per-manga reader setting overrides
- `collections` / `collectionItems` - User collections and their manga membership
- `readHistory` (`read-history.schema.ts`) - Read History feed events (redesigned 15-19 September 2026)
- `readingStatistics` - Aggregated reading stats
- `searchPresets` - Saved search/filter presets
- `relationships.schema.ts` - Cross-table Drizzle `relations()` definitions (not a table itself)

> See `system-pattern.md` for the foreign-key/transaction gotcha and the children-before-parents delete ordering used by `cleanup.repo.ts`.

##### 4. Filesystem Security (`src/main/filesystem/`)

- `path-validator.ts` - Path validation against allowed directories (AppData, Downloads)
- `secure-fs.ts` - Wrapped filesystem operations with automatic validation

> See `system-pattern.md` for security model details and validation principles

##### 5. MangaDex API Client (`src/main/api/`)

- `mangadex-client.ts` - Main API client class
- `rate-limiter.ts` - Token bucket rate limiting (global 5 req/s, `at-home/server` 40/min, `network/report` 20/min)
- `proxy/` - Image proxy protocols (`image.proxy.ts` for `mangadex://`, `local-image.proxy.ts` for `local-manga://`)
- `entities/`, `mapper/`, `responses/` - Response types and mapping
- `search-params/` - Query parameter builders
- `constants/`, `enums/`, `shared/`, `utils/` - Config and error handling/retry logic

> See `system-pattern.md` for MangaDex integration patterns, rate limiting rules, and caching strategy

##### 6. Settings Manager (`src/main/settings/settings-manager.ts`)

- Uses `electron-store` for encrypted settings persistence at `AppData/settings.json`
- Schema domains in `src/shared/types/settings/*`; updated immediately per-section via `settings:update-section` (autosave, no buffered save/discard — converted from the old buffered model 15-19 September 2026)
- `src/main/settings/validators/` - Runtime validation for IPC command payloads

##### 7. Image Proxy Protocols (`src/main/api/proxy/`)

**Two Custom Protocols**:

- **`mangadex://`** - Online image streaming with LRU memory cache
- **`local-manga://`** - Downloaded chapters from filesystem

> See `system-pattern.md` for image proxy architecture and protocol details

##### 8. Internationalization (`src/main/i18n/`)

- `i18n.config.ts` - i18next with filesystem backend
- Translations in `src/locales/` (`en-GB` default, `en-US`, `vi-VN`)

##### 9. Application Lifecycle (`src/main/app-lifecycle.ts`, `src/main/index.ts`)

- Handles app startup, shutdown, auto-updater integration
- Runs the Database Snapshot & Restore startup due-check (`src/main/services/database-snapshot.service.ts`)
- Window restoration on reactivation, platform-specific behaviours

##### 10. Menu Management (`src/main/menu/`)

- `index.ts` composes the menu from `file.menu.ts`, `view.menu.ts`, `library.menu.ts`, `help.menu.ts`
- `menu-state.ts` tracks UI-dependent menu state (e.g. incognito toggle), synced from renderer via the `menu:update-menu-state` IPC event

##### 11. Backup/Restore Services (`src/main/services/`)

- `dexreader/` - Native `.dexreader` format export/import
- `mihon/` - Mihon/Tachiyomi `.tachibk` compatibility export/import
- `protobuf/schemas/` - Shared protobuf schema definitions
- `download.service.ts`, `download-queue/` (`batch-writer.ts`, `progress-reporter.ts`, `retry-scheduler.ts`) - Chapter download orchestration
- `database-snapshot.service.ts` - "Restore Points" snapshot/restore via `node:sqlite`'s Online Backup API
- `gatekeeper.service.ts` - App-lock password hashing/verification (`bcrypt-ts`)
- `logging/` - `main-logging.service.ts` (`mainLog`), `renderer-logging.service.ts`, shared `logging.service.ts`
- `app-update.service.ts`, `search-preset.service.ts`

---

## 🔄 Data Flow Patterns

### 1. Manga Search Flow

1. User enters search query in Browse View
2. Renderer calls `window.api.*` search method
3. Preload invokes IPC channel (`mangadex:*`)
4. Main process: IPC Handler routes to MangaDex Client
5. Rate Limiter checks quota, makes HTTP request to MangaDex API
6. Response mapped to entities and returned via IPC
7. Browse View updates state and renders MangaCards

### 2. Bookmark Flow

1. User clicks "Add to Library" in Manga Detail View
2. Renderer calls a `library:*` IPC channel
3. Main process: `manga.repo.ts` upserts into SQLite
4. Success response sent back
5. Manga Detail View shows toast and updates UI (`libraryStore`)

### 3. Chapter Reading Flow

1. User opens chapter from Chapter List
2. Router navigates to `/reader/:mangaId/:chapterId`
3. Reader View requests chapter images via a `mangadex:*` IPC channel
4. Main process: MangaDex Client fetches At-Home image URLs (rate-limited)
5. URLs returned to renderer
6. Page viewer renders images using `mangadex://` protocol
7. Protocol handler fetches from CDN, caches, streams to renderer
8. As the user navigates pages, progress is tracked via a `progress-tracking:*` IPC channel (optimistic update in `progressStore`, flushed/batched to SQLite)

### 4. Download Flow

1. User clicks "Download Chapter" → `download:add-to-queue`
2. Main process: Download Service + queue (`batch-writer`, `progress-reporter`, `retry-scheduler`) orchestrate:
   - Get chapter images from MangaDex Client
   - Create chapter directory via Secure Filesystem
   - Download each image (rate-limited) with progress events
   - Save metadata to database (`chapterDownloads` table)
3. Renderer listens for queue/progress events
4. Downloads View updates UI and shows completion toast

### 5. Settings Persistence Flow (autosave, since the September 2026 migration)

1. User changes a control in Settings View
2. Renderer calls `window.settings.updateSection(section, value)` → `settings:update-section` — discrete controls write immediately, continuous inputs (e.g. accent colour) are debounced
3. Main process: Settings Manager merges and writes to `electron-store`
4. Data persisted to `AppData/settings.json` (encrypted)
5. Settings that require a restart surface a `RestartRequiredBanner` instead of blocking navigation (the old buffered save/discard banner and `isDirty` plumbing were removed)

### 6. Theme Switching Flow

1. User selects theme in Settings → Appearance
2. Renderer calls `window.settings.updateSection('appearance', { themeMode })`
3. Main process persists the appearance settings section
4. `appStore`/`useStartupTheme` apply the theme to the HTML data attribute
5. CSS custom properties update, UI re-renders with new colours

---

## 🗄️ Database Schema Overview

**Technology**: SQLite (`node:sqlite`) with Drizzle ORM
**Location**: `AppData/dexreader.db`

See **Layer 3 → Database Layer** above for the current table list (`manga`, `chapter`, `chapterDownloads`, `chapterProgress`, `mangaProgress`, `mangaReaderOverrides`, `collections`, `collectionItems`, `readHistory`, `readingStatistics`, `searchPresets`) and `relationships.schema.ts` for how they relate. Exact columns are defined in each `*.schema.ts` file — check there directly rather than relying on a hand-maintained column list here, since schemas evolve with migrations.

---

## 🌐 External Dependencies

### MangaDex API

**Base URL**: `https://api.mangadex.org`

**Key Endpoints**: Search manga, get manga details, get chapter list, get chapter images (At-Home server URLs), get cover art URLs.

> See `system-pattern.md` for MangaDex API integration details, rate limits, and error handling

### MangaDex CDN & At-Home Servers

- **CDN**: `uploads.mangadex.org` for cover images
- **At-Home**: Dynamic server URLs for chapter page images
- **Access**: All images proxied through custom protocols (`mangadex://`, `local-manga://`) — the CSP has no `https:` in `img-src`, so this is enforced, not just conventional

---

## 🔌 Extension Points

### Adding a New View

1. Create view component in `src/renderer/src/views/NewView/`
2. Add route in `src/renderer/src/router.tsx`
3. Add navigation link (`Sidebar` or relevant layout)
4. Create required IPC handlers in `src/main/ipc/handlers/`, register in `src/main/ipc/registry.ts`
5. Expose via preload in `src/preload/index.ts` + `index.d.ts`

### Adding a Database Table

1. Define schema in `src/main/database/schemas/`
2. Add repository in `src/main/database/repositories/`
3. Run `npx drizzle-kit generate <migration_name>` to produce the migration (never hand-write migration files)
4. Add IPC handlers and expose via preload

### Adding a Setting

1. Add the field to the relevant domain type in `src/shared/types/settings/`
2. Update Settings Manager defaults/validation
3. Add UI in the relevant `SettingsView/components/*Settings.tsx` section
4. Wire up via `window.settings.updateSection`

### Adding a MangaDex API Endpoint

1. Add method to `mangadex-client.ts`
2. Define response types in `src/main/api/entities/`
3. Add IPC handler and expose via preload
4. Use in renderer components

---

## 📦 Build & Distribution

### Development Build

Three parallel builds for main process, preload, and renderer (with HMR). Electron launches with dev tools.

### Production Build

TypeScript compilation → electron-vite optimisation → electron-builder packaging (with code signing, icons, installers).

> See `tech-context.md` for build commands, configuration details, and development environment setup

---

## 📚 Related Documentation

**Memory Bank** (`.ai/`):

- `active-context.md` - Current project state (last 2-3 weeks)
- `project-brief.md` - Project purpose and goals
- `system-pattern.md` - Architectural patterns, conventions, principles
- `tech-context.md` - Technology stack, versions, configuration
- `architecture-overview.md` (this file) - Component locations and connections

**Detailed Docs**:

- `docs/architecture/` - IPC messaging, database architecture, error handling, filesystem security, MangaDex API, menu structure, navigation flow, state management, layout specs
- `docs/api-reference.md` - Complete IPC channel listing with types
- `docs/components/` - UI component documentation
- `docs/design/` - Visual design principles and wireframes

---

## 🔍 Quick Navigation Guide

**"I want to..."**

- **Add a new UI screen**: `src/renderer/src/views/` + `router.tsx`
- **Add database functionality**: `src/main/database/repositories/` + schemas + migrations
- **Add a setting**: `src/shared/types/settings/` + `src/main/settings/settings-manager.ts`
- **Modify MangaDex API calls**: `src/main/api/mangadex-client.ts`
- **Change UI theme**: `src/renderer/src/assets/base.css` (custom properties)
- **Add IPC channel**: `src/main/ipc/handlers/` + `registry.ts` + `src/preload/index.ts`
- **Change menu**: `src/main/menu/`
- **Modify security**: `src/main/filesystem/path-validator.ts`
- **Add error handling**: error message catalog in `src/renderer/src/utils/`
- **Change build config**: `electron.vite.config.ts`, `electron-builder.yml`

---

_This architecture overview provides a top-down map of where components live and how they connect. For implementation patterns and conventions (how things should be done), see `system-pattern.md`. For technology versions and configuration details, see `tech-context.md`._

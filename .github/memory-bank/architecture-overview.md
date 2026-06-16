# DexReader Architecture Overview

**Last Updated**: 12 June 2026
**Version**: 1.9.1
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
│  • API Surface (window.api.*)                                │
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

| View             | Path                 | Purpose           | Key Features                                        |
| ---------------- | -------------------- | ----------------- | --------------------------------------------------- |
| **Browse**       | `/browse`            | Discover manga    | Latest updates, search, filters, pagination         |
| **Library**      | `/library`           | Bookmarked manga  | Collections, sorting, bulk actions, updates checker |
| **Manga Detail** | `/manga/:id`         | Manga information | Cover, description, chapters list, bookmark actions |
| **Reader**       | `/reader/:chapterId` | Chapter reading   | Page navigation, fullscreen, progress tracking      |
| **Downloads**    | `/downloads`         | Offline content   | Downloaded chapters, storage management             |
| **History**      | `/history`           | Reading history   | Recent chapters, statistics, calendar view          |
| **Settings**     | `/settings/*`        | App configuration | General, appearance, reading, library, advanced     |
| **Gatekeeper**   | `/unlock`            | App lock screen   | Password authentication, security                   |

#### UI Components

**Location**: `src/renderer/src/components/`

- **Layout Components**: `AppHeader`, `NavigationBar`, `Sidebar`
- **Manga Components**: `MangaCard`, `ChapterList`, `CoverImage`
- **Reader Components**: `PageViewer`, `ReaderControls`, `ProgressBar`
- **Shared Components**: `Button`, `Input`, `Modal`, `Toast`, `Dropdown`
- **Error Handling**: `ErrorBoundary`, `ErrorRecovery`, `OfflineStatusBar`

#### State Management (Zustand Stores)

**Location**: `src/renderer/src/stores/`

| Store                    | Purpose                               | Persistence                  |
| ------------------------ | ------------------------------------- | ---------------------------- |
| **appStore**             | Theme, fullscreen, UI state           | Synced with Settings Manager |
| **userPreferencesStore** | Reader preferences, download settings | Synced with Settings Manager |
| **libraryStore**         | Bookmarks, collections                | SQLite via IPC               |
| **toastStore**           | Notifications                         | Ephemeral (memory only)      |
| **connectivityStore**    | Online/offline state                  | Ephemeral (system events)    |

#### Services (Frontend Logic)

**Location**: `src/renderer/src/services/`

- **API Service**: Wraps `window.api.*` calls with error handling
- **Theme Service**: Manages theme switching and system theme detection
- **Download Service**: Orchestrates download workflows
- **Backup Service**: Handles backup/restore operations

---

### Layer 2: Security Bridge (Preload Script)

**Location**: `src/preload/`

The preload script is the **only bridge** between renderer and main process. It exposes a carefully curated API surface via `contextBridge`.

#### What It Does

1. **Wraps IPC Channels**: Converts IPC calls into clean async functions
2. **Type Safety**: Provides TypeScript definitions for all exposed APIs
3. **Security**: Prevents renderer from accessing Node.js or Electron APIs directly

#### API Categories Exposed

- **Filesystem**: Read, write, delete files/directories
- **Database**: Library, downloads, progress, statistics
- **MangaDex API**: Search, manga details, chapters, images
- **Settings**: App configuration persistence
- **Theme**: System theme and accent colour detection
- **Dialogs**: Native confirmation and choice dialogs
- **Menu**: Application menu actions
- **Navigation**: Route changes from menu clicks
- **Logging**: Application logging

---

### Layer 3: Backend Logic (Main Process)

**Location**: `src/main/`

The main process is the "brain" of the application - it handles all the heavy lifting.

#### Sub-Systems

##### 1. Window Management (`src/main/window.ts`)

- Creates and manages the main application window
- Handles window lifecycle (create, show, close, minimize)
- Platform-specific behaviors

##### 2. IPC Handlers (`src/main/ipc/`)

Routes IPC requests to appropriate handlers:

- **Filesystem**: File operations with path validation
- **Theme**: System theme and accent colour detection
- **Menu**: Application menu actions
- **Dialogue**: Native dialog prompts

##### 3. Database Layer (`src/main/database/`)

SQLite database with Drizzle ORM for all persistent data.

**Structure**:

- `connection.ts` - Database connection & initialization
- `schemas/` - Table definitions (library, downloads, progress, metadata)
- `repositories/` - Data access layer (CRUD operations)
- `queries/` - Complex query builders
- `migrations/` - Database schema migrations
- `commands/` - Seeding scripts for development

**Key Tables**:

- `library` - Bookmarked manga
- `collections` - User-created manga collections
- `downloads` - Downloaded chapters metadata
- `chapters_progress` - Reading progress per chapter
- `manga_metadata` - Cached manga details
- `cover_cache` - Cached cover images (binary data)

##### 4. Filesystem Security (`src/main/filesystem/`)

- `pathValidator.ts` - Path validation against allowed directories
- `secureFs.ts` - Wrapped filesystem operations with automatic validation
- `constants.ts` - Allowed base directories (AppData, Downloads)

**Operations**: read, write, append, copy, rename, mkdir, delete, stat, readDir, exists, getAbsolutePath

> See `system-pattern.md` for security model details and validation principles

##### 5. MangaDex API Client (`src/main/api/`)

- `mangadex-client.ts` - Main API client class
- `rate-limiter.ts` - Token bucket rate limiting
- `proxy/` - Image proxy protocols (mangadex://, local-manga://)
- `entities/` - Response types
- `search-params/` - Query parameter builders
- `utils/` - Error handling, retry logic

**Endpoints Wrapped**:

- Search manga (with filters, pagination)
- Get manga details (metadata, relationships)
- Get chapter list (with filters)
- Get chapter images (At-Home server URLs)
- Get cover art URLs

> See `system-pattern.md` for MangaDex integration patterns, rate limiting rules, and caching strategy

##### 6. Settings Manager (`src/main/settings/settings-manager.ts`)

- Uses electron-store for encrypted settings persistence
- Location: `AppData/settings.json`
- Loads on app startup with fallback to defaults

##### 7. Image Proxy Protocols (`src/main/api/proxy/`)

**Two Custom Protocols**:

- **`mangadex://`** - Online image streaming with memory cache
- **`local-manga://`** - Downloaded chapters from filesystem

> See `system-pattern.md` for image proxy architecture and protocol details

##### 8. Internationalization (`src/main/i18n/`)

- Uses i18next with filesystem backend
- Translations in `src/locales/` (en-GB default)
- Main process translations for native dialogs

##### 9. Application Lifecycle (`src/main/app-lifecycle.ts`)

- Handles app startup, shutdown, updates
- Window restoration on reactivation
- Platform-specific behaviors
- Auto-updater integration

##### 10. Menu Management (`src/main/menu/`)

- Application menu definition
- Platform-specific menu items
- Menu actions routed via IPC

---

## 🔄 Data Flow Patterns

### 1. Manga Search Flow

1. User enters search query in Browse View
2. Search component calls `window.api.searchManga(query, filters)`
3. Preload invokes IPC channel
4. Main process: IPC Handler routes to MangaDex Client
5. Rate Limiter checks quota, makes HTTP request to MangaDex API
6. Response mapped to entities and returned via IPC
7. Browse View updates state and renders MangaCards

### 2. Bookmark Flow

1. User clicks "Add to Library" in Manga Detail View
2. Renderer calls `window.api.addToLibrary({ mangaId, ... })`
3. Main process: Library Repository inserts into SQLite
4. Metadata Repository caches manga details and cover
5. Success response sent back
6. Manga Detail View shows toast and updates UI

### 3. Chapter Reading Flow

1. User opens chapter from Chapter List
2. Router navigates to `/reader/:chapterId`
3. Reader View calls `window.api.getChapterImages(chapterId)`
4. Main process: MangaDex Client fetches At-Home image URLs
5. URLs returned to renderer
6. PageViewer renders images using `mangadex://` protocol
7. Protocol handler fetches from CDN, caches, streams to renderer
8. As user navigates pages, progress tracked via `window.api.saveReadingProgress()`
9. Main process: Progress Repository updates SQLite

### 4. Download Flow

1. User clicks "Download Chapter"
2. Renderer calls `window.api.downloadChapter({ chapterId, ... })`
3. Main process: Download Service orchestrates:
   - Get chapter images from MangaDex Client
   - Create chapter directory via Secure Filesystem
   - Download each image (rate-limited) with progress events
   - Save metadata to database
4. Renderer listens for progress events via `window.api.onDownloadProgress()`
5. Downloads View updates UI and shows completion toast

### 5. Settings Persistence Flow

1. User changes setting in Settings View
2. Local state updates (userPreferencesStore)
3. Renderer calls `window.api.saveSetting(key, value)`
4. Main process: Settings Manager writes to electron-store
5. Data persisted to `AppData/settings.json` (encrypted)
6. Settings View shows save confirmation

### 6. Theme Switching Flow

1. User selects theme in Settings → Appearance
2. appStore updates theme state
3. Renderer calls `window.api.saveSetting('theme', theme)`
4. Main process persists theme setting
5. Renderer applies theme to HTML data attribute
6. CSS custom properties update
7. UI re-renders with new colours

---

## 🗄️ Database Schema Overview

**Technology**: SQLite with Drizzle ORM
**Location**: `AppData/dexreader.db`

### Core Tables

**Library & Collections**:

- `library` - Bookmarked manga (id, manga_id, title, description, cover_url, status, timestamps)
- `collections` - User-created collections (id, name, description, created_at)
- `collection_items` - Many-to-many relationship between manga and collections

**Downloads**:

- `downloads` - Downloaded chapters (id, chapter_id, manga_id, chapter_title, pages, download_path, timestamps)

**Progress & Statistics**:

- `chapters_progress` - Reading progress per chapter (id, chapter_id, manga_id, current_page, total_pages, is_completed, last_read_at)
- `reading_statistics` - Daily aggregated statistics (id, date, chapters_read, pages_read, time_spent)

**Metadata Cache**:

- `manga_metadata` - Cached manga details as JSON (id, manga_id, data, cached_at, expires_at)
- `cover_cache` - Cached cover images as binary (id, cover_id, image_data, mime_type, cached_at)

### Relationships

- library (1) ↔ (N) collection_items ↔ (N) collections
- library (1) ↔ (N) downloads
- library (1) ↔ (N) chapters_progress
- library (1) ↔ (1) manga_metadata

---

## 🌐 External Dependencies

### MangaDex API

**Base URL**: `https://api.mangadex.org`

**Key Endpoints**:

- Search manga, get manga details, get chapter list
- Get chapter images (At-Home server URLs)
- Get cover art URLs

> See `system-pattern.md` for MangaDex API integration details, rate limits, and error handling

### MangaDex CDN & At-Home Servers

- **CDN**: `uploads.mangadex.org` for cover images
- **At-Home**: Dynamic server URLs for chapter page images
- **Access**: All images proxied through custom protocols (mangadex://, local-manga://)

---

## 🔌 Extension Points

### Adding a New View

1. Create view component in `src/renderer/src/views/NewView/`
2. Add route in `src/renderer/src/router.tsx`
3. Add navigation link (AppHeader or NavigationBar)
4. Create required IPC handlers in `src/main/ipc/`
5. Expose via preload in `src/preload/index.ts`

### Adding a Database Table

1. Define schema in `src/main/database/schemas/`
2. Create migration in `src/main/database/migrations/`
3. Add repository in `src/main/database/repositories/`
4. Add IPC handlers and expose via preload
5. Run migration

### Adding a Setting

1. Update schema in Settings Manager
2. Add getter/setter and IPC handlers
3. Expose via preload
4. Add UI in Settings View
5. Connect to Zustand store if needed

### Adding a MangaDex API Endpoint

1. Add method to MangaDex Client
2. Define response types in `src/main/api/entities/`
3. Add IPC handler and expose via preload
4. Use in renderer components

---

## 📦 Build & Distribution

### Development Build

Three parallel builds for main process, preload, and renderer (with HMR). Electron launches with dev tools.

### Production Build

TypeScript compilation → electron-vite optimization → electron-builder packaging (with code signing, icons, installers). Output to `dist/` directory.

> See `tech-context.md` for build commands, configuration details, and development environment setup

---

## 🧩 Component Interactions Example: Opening a Chapter

Complete flow from click to chapter display:

1. **User Action**: Clicks chapter in Manga Detail View
2. **Navigation**: React Router navigates to `/reader/:chapterId`, ReaderView mounts
3. **Data Fetch**: ReaderView calls `window.api.getChapterImages(chapterId)`
4. **IPC Bridge**: Preload invokes IPC channel
5. **IPC Handler**: Main process validates request, calls MangaDex Client
6. **API Call**: MangaDex Client checks rate limit, fetches At-Home URLs
7. **Response**: Data mapped to entities, returned via IPC
8. **State Update**: ReaderView receives data, renders PageViewer
9. **Image Display**: PageViewer renders images with `mangadex://` protocol URLs
10. **Protocol Handler**: Main process intercepts, checks cache, fetches from CDN if needed
11. **Image Streaming**: Image data streamed from cache/CDN to renderer
12. **Progress Tracking**: User navigates pages, calls `window.api.saveReadingProgress()`
13. **Progress Save**: Main process updates SQLite via Progress Repository
14. **UI Update**: Progress bar updates, chapter marked as in-progress

---

## 🎨 UI/UX Architecture

### Design System

CSS custom properties for theming (colour, font, spacing). Light/dark/auto themes. Fluent UI icons throughout. System fonts with responsive scaling.

**Location**: `src/renderer/src/assets/base.css`

### Navigation Pattern

- **Primary**: Top header (Browse, Library, Downloads, History, Settings)
- **Secondary**: Context-dependent sidebars (Collections, Settings categories)

### Error Handling UX

Three levels: Global ErrorBoundary (app), Page ErrorBoundary (per view), Component ErrorRecovery (inline with retry). Offline mode shows persistent banner with contextual actions.

> See `tech-context.md` for error handling system details

### Loading States

Skeleton screens (manga cards, lists), spinners (async actions), progress bars (multi-step operations), toast notifications (feedback).

---

## 🔧 Development Workflow

### Making Changes

- **Frontend (Renderer)**: Edit in `src/renderer/src/`, changes hot-reload (HMR)
- **Backend (Main Process)**: Edit in `src/main/`, restart Electron to see changes
- **Preload**: Edit `src/preload/index.ts`, restart Electron to see changes

### Code Quality & Database

- Type checking, linting, formatting via npm scripts
- Database migrations for schema changes
- Visual database browser available

> See `tech-context.md` for complete command reference and development environment setup

---

## 📚 Related Documentation

**Memory Bank**:

- `active-context.md` - Current project state (last 2-3 weeks)
- `project-brief.md` - Project purpose and goals
- `system-pattern.md` - Architectural patterns, conventions, principles
- `tech-context.md` - Technology stack, versions, configuration
- `architecture-overview.md` (this file) - Component locations and connections

**Detailed Docs**:

- `docs/architecture/` - IPC messaging, error handling, filesystem security
- `docs/api-reference.md` - Complete IPC channel listing with types
- `docs/components/` - UI component documentation
- `docs/design/` - Visual design principles and wireframes

---

## 🔍 Quick Navigation Guide

**"I want to..."**

- **Add a new UI screen**: `src/renderer/src/views/` + `router.tsx`
- **Add database functionality**: `src/main/database/repositories/` + migrations
- **Add a setting**: `src/main/settings/settings-manager.ts`
- **Modify MangaDex API calls**: `src/main/api/mangadex-client.ts`
- **Change UI theme**: `src/renderer/src/assets/base.css` (custom properties)
- **Add IPC channel**: `src/main/ipc/` + `src/preload/index.ts`
- **Change menu**: `src/main/menu/`
- **Modify security**: `src/main/filesystem/pathValidator.ts`
- **Add error handling**: `src/main/ipc/error/` + error catalog
- **Change build config**: `electron.vite.config.ts`, `electron-builder.yml`

---

_This architecture overview provides a top-down map of where components live and how they connect. For implementation patterns and conventions (how things should be done), see `system-pattern.md`. For technology versions and configuration details, see `tech-context.md`._

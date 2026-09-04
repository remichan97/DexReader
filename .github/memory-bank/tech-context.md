# DexReader Technical Context

**Last Updated**: 12 June 2026
**Project Version**: 1.9.1
**Type**: Desktop Application (Electron)

---

## Technology Stack

### Core Runtime

| Technology   | Version | Purpose                         |
| ------------ | ------- | ------------------------------- |
| **Electron** | 41.1.1  | Desktop application framework   |
| **Node.js**  | v22.x   | Runtime (bundled with Electron) |
| **Chromium** | ~134.x  | Embedded browser (via Electron) |

### Frontend Framework

| Technology     | Version | Purpose                   |
| -------------- | ------- | ------------------------- |
| **React**      | 19.1.1  | UI library                |
| **React DOM**  | 19.1.1  | DOM rendering             |
| **TypeScript** | 5.9.2   | Type system & compilation |

### Build & Development Tools

| Technology           | Version | Purpose                              |
| -------------------- | ------- | ------------------------------------ |
| **Vite**             | 7.3.2   | Frontend build tool & dev server     |
| **electron-vite**    | 5.0.0   | Electron-specific Vite wrapper       |
| **electron-builder** | 26.8.1  | Application packaging & distribution |
| **npm**              | 11.3.0  | Package manager                      |

### Code Quality

| Technology              | Version | Purpose                       |
| ----------------------- | ------- | ----------------------------- |
| **ESLint**              | 9.36.0  | JavaScript/TypeScript linting |
| **Prettier**            | 3.6.2   | Code formatting               |
| **TypeScript Compiler** | 5.9.2   | Type checking                 |

---

## Key Dependencies

### Production Dependencies

**State Management**:

- `zustand@5.0.9` - Lightweight state management (~1.4kb)

**Database**:

- `better-sqlite3@12.8.0` - Native SQLite3 bindings
- `drizzle-orm@0.45.2` - Type-safe ORM for SQLite
- `drizzle-kit@0.31.10` - Database migrations toolkit (dev dependency)

**UI Components**:

- `@fluentui/react-icons@2.0.315` - Microsoft Fluent UI icon library
- `react-router-dom@7.18.3` - Client-side routing

**Internationalisation**:

- `i18next@26.0.10` - i18n framework
- `react-i18next@17.0.7` - React bindings for i18next
- `i18next-fs-backend@2.6.5` - Filesystem backend for translations

**Binary Serialization**:

- `protobufjs@8.2.0` - Protocol Buffers for backup functionality
- `pako@2.1.0` - gzip compression for backups

**Security & Logging**:

- `bcrypt@6.0.0` - Password hashing for app lock
- `electron-log@5.4.3` - Application logging

**Electron Utilities**:

- `@electron-toolkit/preload@3.0.2` - Preload script helpers
- `@electron-toolkit/utils@4.0.0` - Common Electron utilities
- `electron-updater@6.3.9` - Auto-update functionality
- `electron-store@11.0.2` - Settings persistence with encryption support

---

## MangaDex API Integration

This application integrate with MangaDex API to provide content to the user. Detailed pattern can be found in `system-pattern.md`

---

## Development Environment

### Required Software

- **Node.js**: v22.21.1 (or compatible with v22.x)
- **npm**: v11.3.0 (or compatible)
- **Git**: For version control
- **VS Code**: Recommended IDE with ESLint and Prettier extensions

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server with HMR
npm run start                  # Preview production build

# Quality Checks
npm run typecheck              # Type validation (node + web)
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier

# Building
npm run build                  # Build for production
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
- Uses `import.meta.url` pattern for path resolution (no `__dirname`)
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

**Prettier Configuration** (.prettierrc.yaml):

```yaml
singleQuote: true # 'string' not "string"
semi: false # No semicolons
printWidth: 100 # Max line length
trailingComma: none # No trailing commas
```

---

## Security Configuration

### Content Security Policy

**Policy** (src/renderer/index.html):

- `default-src 'self'` - Only load resources from same origin
- `script-src 'self'` - No inline scripts, only bundled code
- `style-src 'self' 'unsafe-inline'` - Allow inline styles (React CSS-in-JS)
- `img-src 'self' data: https:` - Local images, data URIs, and HTTPS images (MangaDex CDN)

### Context Isolation

**Enabled by default** (Electron 41):

- Sandbox disabled to allow Node.js in preload scripts
- Context isolation prevents renderer from accessing Node.js directly
- All APIs exposed via `contextBridge` in preload scripts

---

## IPC Communication Architecture

**Documentation**: `docs/architecture/ipc-messaging.md`
**Implementation**: 37 IPC channels across 6 categories

### Channel Categories

| Category       | Channels | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| **Filesystem** | 16       | File/directory operations with validation   |
| **Theme**      | 4        | System theme and accent colour detection    |
| **Menu**       | 14       | Application menu actions and state updates  |
| **Dialogue**   | 2        | Native confirmations and multi-choice       |
| **Navigation** | 1        | Route navigation events from menu           |
| **MangaDex**   | 6        | API calls (search, manga, chapters, images) |
| **Database**   | ~30      | Library, downloads, progress, statistics    |
| **Settings**   | ~8       | App settings persistence                    |

### Error Handling Pattern

All IPC handlers use `wrapIpcHandler` for consistent error handling:

- Automatic error serialization for IPC transport
- Custom error classes: `IpcError`, `FileSystemError`, `ValidationError`, `ThemeError`
- Runtime validation for all IPC arguments
- Type-safe responses via `IpcResponse<T>` wrapper

---

## Filesystem Architecture

**Documentation**: `docs/architecture/filesystem-security.md`

### Core Security

**Path Validator** (`src/main/filesystem/pathValidator.ts`):

- Validates all filesystem paths against 2 allowed directories: AppData + Downloads
- Prevents path traversal and symlink exploits
- Canonical path resolution for security

**Secure Filesystem** (`src/main/filesystem/secureFs.ts`):

- Wraps Node.js `fs/promises` with automatic path validation
- 12 operations: read, write, append, copy, rename, mkdir, delete, stat, readDir, etc.
- Parent directories automatically created on write operations

**Settings Manager** (`src/main/settings/settings-manager.ts`):

- Persists app-wide settings to `AppData/settings.json` (electron-store v11)
- Schema includes: theme, accent colour, downloads path, proxy settings, hardware acceleration, etc.
- Loads on app startup with graceful fallback to defaults if corrupted

---

## State Management

**Library**: Zustand 5.0.9 (~1.4kb, minimal boilerplate, TypeScript-first)

**Current Stores** (`src/renderer/src/stores/`):

1. **appStore.ts** - Theme, UI state, fullscreen
2. **toastStore.ts** - Global notifications (ephemeral)
3. **libraryStore.ts** - Bookmarks and collections

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

**Global Error Handler** (`src/renderer/src/utils/errorHandler.ts`):

- Catches `window.onerror` and `window.onunhandledrejection`
- Automatic toast notifications and error logging
- Initialized in `main.tsx` on app startup

**Error Message Catalog** (`src/renderer/src/utils/errorMessages.ts`):

- ~20 error patterns with user-friendly messages
- Converts technical errors to conversational language

**Connectivity Store** (`src/renderer/src/stores/connectivityStore.ts`):

- States: `online | offline-user | offline-no-internet`
- Automatic connectivity monitoring
- Drives `<OfflineStatusBar />` component

---

## Protobuf & Backup System

**Purpose**: Binary serialization for library backups with compression

### Schemas

1. **DexReader Native** (`dexreader.proto`, Proto3)
   - File extension: `.dexreader`
   - Includes: library data, collections, progress, reader settings
   - Excludes: reading statistics (recalculated on import), app settings (separate backup)
   - Encoding: Protobuf (binary) + gzip compression

2. **Mihon/Tachiyomi Compatibility** (`mihon.proto`, Proto2)
   - File extensions: `.tachibk`, `.proto.gz`
   - Import: Decode Mihon backups, filter MangaDex manga, import to library
   - Export: Export library to Mihon format with tag conversion
   - MangaDex source ID: `'2499283573021220255'`

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
- **Architecture**: `docs/architecture/` - System design documents
- **Component Library**: `docs/components/` - UI component guides
- **Design System**: `docs/design/` - Visual design principles and wireframes
- **Instructions**: `.github/instructions/` - Coding standards by file pattern

**Memory Bank**: `.github/memory-bank/`

- `active-context.md` - Current project state (last 2-3 weeks)
- `project-brief.md` - High-level overview and goals
- `system-pattern.md` - Architectural patterns and conventions
- `tech-context.md` (this file) - Technology stack overview

---

_This document provides a high-level overview of DexReader's technology stack, critical architecture decisions, and essential configuration information. For detailed implementation patterns and coding standards, see `system-pattern.md`. For in-depth documentation, refer to the `docs/` directory._

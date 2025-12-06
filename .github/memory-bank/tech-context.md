# DexReader Technical Context

**Last Updated**: 6 December 2025
**Project Version**: 1.0.0
**Type**: Desktop Application (Electron)

---

## Technology Stack

### Core Runtime

| Technology   | Version    | Purpose                         |
| ------------ | ---------- | ------------------------------- |
| **Electron** | 38.1.2     | Desktop application framework   |
| **Node.js**  | v22.21.1\* | Development environment         |
| **Chromium** | ~128.x     | Embedded browser (via Electron) |
| **V8**       | Latest     | JavaScript engine               |

_\*Note: Electron bundles its own Node.js runtime (~v20.x). Development uses system Node v22.21.1_

### Frontend Framework

| Technology     | Version | Purpose                   |
| -------------- | ------- | ------------------------- |
| **React**      | 19.1.1  | UI library                |
| **React DOM**  | 19.1.1  | DOM rendering             |
| **TypeScript** | 5.9.2   | Type system & compilation |

### Build & Development Tools

| Technology           | Version | Purpose                              |
| -------------------- | ------- | ------------------------------------ |
| **Vite**             | 7.1.6   | Frontend build tool & dev server     |
| **electron-vite**    | 4.0.1   | Electron-specific Vite wrapper       |
| **electron-builder** | 25.1.8  | Application packaging & distribution |
| **npm**              | 11.3.0  | Package manager                      |

### Code Quality

| Technology              | Version | Purpose                       |
| ----------------------- | ------- | ----------------------------- |
| **ESLint**              | 9.36.0  | JavaScript/TypeScript linting |
| **Prettier**            | 3.6.2   | Code formatting               |
| **TypeScript Compiler** | 5.9.2   | Type checking                 |

---

## MangaDex API Integration (Phase 2+)

### API Client Architecture

**Location**: `src/main/api/`

| File | Purpose | Key Exports |
|------|---------|-------------|
| **constants.ts** | API URLs, enums, rate limits | `BASE_URL`, `ContentRating`, `PublicationStatus`, `RATE_LIMITS` |
| **types.ts** | TypeScript interfaces (~40 interfaces) | `Manga`, `Chapter`, `MangaSearchParams`, `CollectionResponse<T>` |
| **rateLimiter.ts** | Token bucket rate limiter | `RateLimiter` class |
| **imageProxy.ts** | Custom protocol handler + cache | `ImageProxy` class |
| **mangadexClient.ts** | Main API client | `MangaDexClient` class |

### Image Proxy System

**Critical Architecture Decision**: Custom protocol handler for image proxying

**Why**: MangaDex blocks direct hotlinking - images must be fetched through main process

**Protocol**: `mangadex://`

- Registered via `protocol.handle('mangadex', ...)` in main process
- Replaces `https://` in all image URLs
- Transparent to renderer - works like regular image URLs

**Cache Implementation** (Phase 2 - Ephemeral):

```typescript
class ImageProxy {
  private chapterCache: Map<string, CacheEntry> = new Map()  // 30MB
  private coverCache: Map<string, CacheEntry> = new Map()    // 20MB

  // Each CacheEntry: { buffer: Buffer, timestamp: number, size: number }
  // LRU eviction when cache full
  // 15-minute expiry for chapter images
}
```

**Memory Limits**:

- Chapter images: 30MB (LRU eviction)
- Cover images: 20MB (LRU eviction)
- Per-image max: 5MB (larger images not cached)
- Total: ~50MB for streaming mode

**Caching by Phase**:

- **Phase 2**: Ephemeral memory cache (in-memory Maps)
- **Phase 3**: Persistent covers for bookmarks (AppData/metadata/)
- **Phase 4**: Full offline downloads (user downloads directory)

### API Client Methods

**Endpoints Exposed to Renderer**:

```typescript
window.mangadex.searchManga(params: MangaSearchParams): Promise<CollectionResponse<Manga>>
window.mangadex.getManga(id: string, includes?: string[]): Promise<APIResponse<Manga>>
window.mangadex.getMangaFeed(id: string, params: FeedParams): Promise<CollectionResponse<Chapter>>
window.mangadex.getChapter(id: string, includes?: string[]): Promise<APIResponse<Chapter>>
window.mangadex.getChapterImages(chapterId: string, quality?: 'data' | 'data-saver'): Promise<ImageUrl[]>
window.mangadex.getCoverUrl(mangaId: string, fileName: string, size?: CoverSize): string
```

**IPC Channels** (6 new handlers in Phase 2):

- `mangadex:search-manga`
- `mangadex:get-manga`
- `mangadex:get-manga-feed`
- `mangadex:get-chapter`
- `mangadex:get-chapter-images`
- `mangadex:get-cover-url`

### Rate Limiting

**Algorithm**: Token bucket

- Global: 5 requests/second capacity, refills at 5/sec
- At-home endpoint: 40 requests/minute (tracked separately)
- Automatic throttling via `await rateLimiter.waitForSlot()`
- Exponential backoff on HTTP 429 responses

**Integration**: Every API request waits for rate limiter before fetch

### Error Handling

**Custom Error Types**:

```typescript
class MangaDexAPIError extends Error {
  status: number
  errors: ErrorResponse
  requestId: string | null
}

class MangaDexNetworkError extends Error {
  url: string
}
```

**IPC Integration**: All handlers wrapped with `wrapHandler()` from P1-T08

### Dependencies

**External**: NONE (uses native APIs)

- Native `fetch()` for HTTP requests
- `AbortSignal.timeout()` for request timeouts
- Electron `protocol` and `net` modules for image proxy

**Internal Dependencies**:

- Error handling system (P1-T09): `wrapHandler`, `getUserFriendlyError`
- IPC architecture (P1-T08): contextBridge patterns

---

## Development Environment

### Required Software

- **Node.js**: v22.21.1 (or compatible)
- **npm**: v11.3.0 (or compatible)
- **Git**: For version control
- **VS Code**: Recommended IDE

### VS Code Configuration

**Recommended Extensions**:

- `dbaeumer.vscode-eslint` - ESLint integration
- `esbenp.prettier-vscode` - Prettier integration (default formatter)

**Workspace Settings** (`.vscode/settings.json`):

```json
{
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```

### Package Mirror Configuration

**`.npmrc`** - Using npmmirror for faster downloads in certain regions:

```properties
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

---

## Dependency Management

### Production Dependencies (5)

```json
{
  "@electron-toolkit/preload": "^3.0.2",
  "@electron-toolkit/utils": "^4.0.0",
  "@fluentui/react-icons": "^2.0.315",
  "electron-updater": "^6.3.9",
  "react-router-dom": "^6.28.0",
  "zustand": "^5.0.9"
}
```

**Purpose**:

- **@electron-toolkit/preload**: Helper utilities for secure preload scripts
- **@electron-toolkit/utils**: Common Electron utilities (is.dev, optimizer, etc.)
- **@fluentui/react-icons**: Microsoft Fluent UI icon library (2000+ icons, Regular/Filled variants)
- **electron-updater**: Auto-update functionality for deployed applications
- **react-router-dom**: Client-side routing for multi-view navigation
- **zustand**: Lightweight state management library with persistence middleware (~1.4kb)

### Development Dependencies (18)

**Electron & Build Tools**:

```json
{
  "electron": "^38.1.2",
  "electron-builder": "^25.1.8",
  "electron-vite": "^4.0.1",
  "vite": "^7.1.6"
}
```

**React Ecosystem**:

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "@vitejs/plugin-react": "^5.0.3"
}
```

**TypeScript & Types**:

```json
{
  "typescript": "^5.9.2",
  "@types/node": "^22.18.6",
  "@types/react": "^19.1.13",
  "@types/react-dom": "^19.1.9"
}
```

**Linting & Formatting**:

```json
{
  "eslint": "^9.36.0",
  "eslint-plugin-react": "^7.37.5",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.20",
  "prettier": "^3.6.2"
}
```

**Electron Toolkit Configuration**:

```json
{
  "@electron-toolkit/eslint-config-prettier": "^3.0.0",
  "@electron-toolkit/eslint-config-ts": "^3.1.0",
  "@electron-toolkit/tsconfig": "^2.0.0"
}
```

---

## Build System Architecture

### electron-vite Configuration

**Three-Process Build Pipeline**:

```typescript
// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: { '@renderer': resolve('src/renderer/src') }
    },
    plugins: [react()]
  }
})
```

**Key Features**:

- **Separate Build Contexts**: Each Electron process has isolated build configuration
- **Dependency Externalization**: Node.js modules excluded from main/preload bundles
- **React Fast Refresh**: HMR for instant UI updates
- **Path Aliases**: `@renderer/*` for cleaner imports

### Vite Plugins

1. **@vitejs/plugin-react** (Renderer)
   - Transforms JSX/TSX
   - Enables React Fast Refresh
   - Optimizes React production builds

2. **externalizeDepsPlugin** (Main & Preload)
   - Prevents bundling of node_modules
   - Keeps native Node.js modules external
   - Reduces bundle size

---

## TypeScript Configuration

### Multi-Config Strategy

**Three TypeScript Configurations**:

1. **`tsconfig.json`** (Root Coordinator)

   ```jsonc
   {
     "files": [],
     "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.web.json" }]
   }
   ```

2. **`tsconfig.node.json`** (Main & Preload)

   ```jsonc
   {
     "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
     "include": ["electron.vite.config.*", "src/main/**/*", "src/preload/**/*"],
     "compilerOptions": {
       "composite": true,
       "types": ["electron-vite/node"]
     }
   }
   ```

3. **`tsconfig.web.json`** (Renderer)

   ```jsonc
   {
     "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
     "include": [
       "src/renderer/src/env.d.ts",
       "src/renderer/src/**/*",
       "src/renderer/src/**/*.tsx",
       "src/preload/*.d.ts"
     ],
     "compilerOptions": {
       "composite": true,
       "jsx": "react-jsx",
       "baseUrl": ".",
       "paths": {
         "@renderer/*": ["src/renderer/src/*"]
       }
     }
   }
   ```

**Benefits**:

- Separate type checking for Node.js vs browser environments
- Project references for incremental compilation
- Type-safe path aliases

---

## ESLint Configuration

### Flat Config Structure (ESLint 9+)

```javascript
// eslint.config.mjs
export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended, // TypeScript rules
  eslintPluginReact.configs.flat.recommended, // React rules
  eslintPluginReact.configs.flat['jsx-runtime'], // New JSX transform
  {
    settings: { react: { version: 'detect' } }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks, // Hooks rules
      'react-refresh': eslintPluginReactRefresh // Fast Refresh validation
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  eslintConfigPrettier // Disable conflicting rules
)
```

**Rule Sets Applied**:

- `@electron-toolkit/eslint-config-ts` (TypeScript base)
- `eslint-plugin-react` (React best practices)
- `eslint-plugin-react-hooks` (Hooks validation)
- `eslint-plugin-react-refresh` (HMR compatibility)
- `@electron-toolkit/eslint-config-prettier` (Prettier integration)

---

## Prettier Configuration

**`.prettierrc.yaml`**:

```yaml
singleQuote: true # 'string' not "string"
semi: false # No semicolons
printWidth: 100 # Max line length
trailingComma: none # No trailing commas
```

**Philosophy**: Minimal configuration, relying on Prettier defaults with slight customizations for consistency.

---

## Package Scripts

### Development Workflow

```json
{
  "dev": "electron-vite dev", // Start dev server with HMR
  "start": "electron-vite preview", // Preview production build
  "build": "npm run typecheck && electron-vite build"
}
```

### Quality Assurance

```json
{
  "typecheck": "npm run typecheck:node && npm run typecheck:web",
  "typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
  "typecheck:web": "tsc --noEmit -p tsconfig.web.json --composite false",
  "lint": "eslint --cache .",
  "format": "prettier --write ."
}
```

### Distribution

```json
{
  "postinstall": "electron-builder install-app-deps",
  "build:unpack": "npm run build && electron-builder --dir",
  "build:win": "npm run build && electron-builder --win",
  "build:mac": "electron-vite build && electron-builder --mac",
  "build:linux": "electron-vite build && electron-builder --linux"
}
```

---

## Electron Builder Configuration

### Platform-Specific Packaging

**Windows (NSIS Installer)**:

```yaml
win:
  executableName: dexreader
nsis:
  artifactName: ${name}-${version}-setup.${ext}
  shortcutName: ${productName}
  createDesktopShortcut: always
```

**macOS (DMG)**:

```yaml
mac:
  entitlementsInherit: build/entitlements.mac.plist
  notarize: false
dmg:
  artifactName: ${name}-${version}.${ext}
```

**Linux (Multiple Formats)**:

```yaml
linux:
  target: [AppImage, snap, deb]
  maintainer: electronjs.org
  category: Utility
appImage:
  artifactName: ${name}-${version}.${ext}
```

### Build Optimization

```yaml
files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!electron.vite.config.{js,ts,mjs,cjs}'
  - '!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml}'
  - '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}'

asarUnpack:
  - resources/**

npmRebuild: false
```

---

## Filesystem Architecture

**Status**: ✅ Implemented (P1-T05)
**Documentation**: [filesystem-security.md](../../docs/architecture/filesystem-security.md)

### Core Modules

**Path Validator** (`src/main/filesystem/pathValidator.ts`):

- Path normalization and canonical resolution
- Validates against 2 allowed directories: AppData + Downloads
- Prevents path traversal and symlink exploits
- In-memory allowed paths cache

**Secure Filesystem** (`src/main/filesystem/secureFs.ts`):

- Wraps Node.js `fs/promises` with automatic path validation
- 12 operations: `readFile`, `writeFile`, `appendFile`, `copyFile`, `rename`, `mkdir`, `ensureDir`, `deleteFile`, `deleteDir`, `isExists`, `stat`, `readDir`
- Parent directories automatically created on write operations

**Settings Manager** (`src/main/filesystem/settingsManager.ts`):

- Persists settings to `AppData/settings.json`
- Schema: `downloadsPath` (string | null), `theme` ('light' | 'dark' | 'system'), `accentColor` (string | undefined)
- Loads on app startup, validates downloads path
- Graceful fallback to defaults if corrupted

### IPC Communication Architecture

**Status**: ✅ Complete (P1-T08)
**Documentation**: [ipc-messaging.md](../../docs/architecture/ipc-messaging.md)
**Implementation**: 37 IPC channels across 6 categories

#### Architecture Components

**Error Handling System** (`src/main/ipc/`):

- `error.ts` - Base `IpcError` class with code/details
- `fileSystemError.ts` - Filesystem-specific errors
- `validationError.ts` - Parameter validation errors
- `themeError.ts` - Theme operation errors
- `errorSerialiser.ts` - Error serialisation for IPC transport (dev/prod modes)
- `wrapHandler.ts` - `wrapIpcHandler` utility for automatic error catching

**Validation Layer** (`src/main/ipc/validators.ts`):

- `validateString()` - Type checking for string parameters
- `validatePath()` - Non-empty path validation
- `validateEncoding()` - BufferEncoding enum validation (9 valid values)

**Channel Registry** (`src/main/ipc/registry.ts`):

- Complete registry of all 37 IPC channels
- Queryable by category or channel name
- Includes: description, request/response types, error types, examples
- Categories: Filesystem (16), Theme (4), Menu (14), Dialogue (2), Navigation (1)

**Type Safety** (`src/preload/ipc.types.ts`):

- `IpcResponse<T>` - Generic wrapper for all IPC responses
- `ISerialiseError` - Error interface shared across processes
- `FileStats`, `AllowedPaths`, `FolderSelectResult` - Domain types
- Type guards in `src/renderer/src/utils/ipcTypeGuards.ts`

#### Channel Categories

| Category | Channels | Implementation | Description |
|----------|----------|----------------|-------------|
| **Filesystem** | 16 | `src/main/index.ts` | File/directory operations with path validation |
| **Theme** | 4 | `src/main/index.ts` | System theme and accent colour detection |
| **Menu** | 14 | `src/main/menu.ts` | Application menu actions and state updates |
| **Dialogue** | 2 | `src/main/index.ts` | Native confirmations and multi-choice dialogues |
| **Navigation** | 1 | `src/main/menu.ts` | Route navigation events from menu |
| **Window** | 0 | (reserved) | Future window management operations |

#### Handler Pattern

All IPC handlers use `wrapIpcHandler` for consistent error handling:

```typescript
import { wrapIpcHandler } from './ipc/wrapHandler'
import { validatePath, validateEncoding } from './ipc/validators'

wrapIpcHandler('fs:read-file', async (_event, filePath: unknown, encoding: unknown) => {
  const validPath = validatePath(filePath, 'filePath')
  const validEncoding = validateEncoding(encoding, 'encoding')
  return await secureFs.readFile(validPath, validEncoding)
})
```

#### Type-Safe Usage in Renderer

```typescript
import { isIpcSuccess, isIpcError } from '@renderer/utils/ipcTypeGuards'

const response = await window.fileSystem.readFile(path, 'utf-8')

if (isIpcSuccess(response)) {
  // TypeScript knows response.data is string | Buffer
  setContent(response.data)
} else {
  // TypeScript knows response.error is ISerialiseError
  console.error(response.error.message)
  if (response.error.code === 'FS_ERROR') {
    toast.error('Couldn\'t read the file')
  }
}
```

#### Performance Characteristics

- Simple operations (exists, stat): <5ms
- Small file reads (<1KB): <10ms
- Medium file reads (1-10KB): <50ms
- Large file operations (>10KB): <200ms
- Dialogue operations: <100ms
- Theme operations: <10ms

#### Security Features

✅ Context isolation enabled (renderer cannot access Node.js)
✅ All filesystem paths validated against allowed directories
✅ Runtime validation for all IPC arguments
✅ Error sanitisation (no sensitive info in production)
✅ Type safety prevents injection attacks
✅ Custom error classes for clear error identification

---

## React 19 Features in Use

### Modern Patterns

**New JSX Transform**:

```tsx
// No need to import React in components
function Component(): React.JSX.Element {
  return <div>Content</div>
}
```

**Concurrent Features** (Enabled by default in React 19):

- Automatic batching
- Transitions
- Suspense for data fetching (ready when needed)

**StrictMode**:

```tsx
// main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## Import Patterns

### Main Process

```typescript
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset' // Vite asset import
```

### Preload Script

```typescript
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
```

### Renderer Process

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

import './assets/main.css' // CSS imports
import electronLogo from './assets/electron.svg' // Vite handles SVG
import Component from '@renderer/components/Component' // Path alias
```

---

## Asset Management

### Static Assets

**Location**: `src/renderer/src/assets/`

**Current Assets**:

- `base.css` - Design tokens, resets, typography
- `main.css` - Component styles, layout
- `electron.svg` - Application logo
- `wavy-lines.svg` - Background pattern

**Vite Asset Handling**:

```typescript
import logo from './assets/logo.svg' // Returns URL string
import icon from '../../resources/icon.png?asset' // Electron asset
```

### Resource Files

**Location**: `resources/`

**Purpose**: Files that need to be unpacked from ASAR archive (icons, native modules, etc.)

---

## Type Definitions

### Renderer Process Globals

**`src/preload/index.d.ts`**:

```typescript
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI // Electron APIs
    api: unknown // Custom APIs (to be defined)
  }
}
```

### Vite Environment

**`src/renderer/src/env.d.ts`**:

```typescript
/// <reference types="vite/client" />
```

Enables:

- Import of CSS, images, and other assets
- Vite-specific type definitions
- Asset module declarations

---

## Security Configuration

### Content Security Policy

**`src/renderer/index.html`**:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;"
/>
```

**Policy Breakdown**:

- `default-src 'self'` - Only load resources from same origin
- `script-src 'self'` - No inline scripts, only bundled code
- `style-src 'self' 'unsafe-inline'` - Allow inline styles (React components)
- `img-src 'self' data: https:` - Allow local images, data URIs, and HTTPS images (for manga covers)

**Implementation Notes**:

- HTTPS images required for external manga cover art from MangaDex CDN
- Data URIs support base64-encoded images
- No inline scripts for XSS protection
- `'unsafe-inline'` for styles is required for React CSS-in-JS patterns

### Context Isolation

**Enabled by Default** in Electron 38:

```typescript
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  sandbox: false,          // Allows Node.js in preload
  contextIsolation: true   // Renderer cannot access Node.js
}
```

---

## Version Control

### Git Configuration

**`.gitignore`**:

```ignore
node_modules           # Dependencies
dist                   # Distribution builds
out                    # Development builds
.DS_Store              # macOS metadata
.eslintcache           # ESLint cache
*.log*                 # Log files
```

---

## Auto-Update Infrastructure

### Configuration

**`dev-app-update.yml`**:

```yaml
provider: generic
url: https://example.com/auto-updates
updaterCacheDirName: dexreader-updater
```

**`electron-builder.yml`**:

```yaml
publish:
  provider: generic
  url: https://example.com/auto-updates
```

**Status**: Configured but not yet activated. Requires:

1. Update server setup
2. UI implementation in renderer
3. Event handlers in main process

### electron-updater Integration

**Already Installed**: `electron-updater@6.3.9`

**Usage Pattern** (to be implemented):

```typescript
// In main process
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()
```

---

## Browser Compatibility

### Target Environment

**Chromium Version**: ~128.x (bundled with Electron 38)

**JavaScript Features**:

- ES2023 syntax fully supported
- All modern Web APIs available
- Private class fields, top-level await, etc.

**CSS Features**:

- CSS Grid, Flexbox
- CSS Custom Properties (variables)
- Modern selectors (`:has()`, `:is()`, etc.)
- Container queries

**No Transpilation Needed**: Since Chromium is controlled, can use latest web platform features without polyfills.

---

## Performance Characteristics

### Build Performance

**Development**:

- **Cold start**: ~3-5 seconds
- **HMR**: <100ms for most changes
- **Type checking**: Runs in parallel via tsconfig project references

**Production**:

- **Full build**: ~10-20 seconds
- **Installer creation**: ~30-60 seconds (platform-dependent)

### Runtime Performance

**Electron 38 Improvements**:

- Latest V8 engine optimizations
- Improved memory management
- Better rendering performance

**Current Bundle Sizes** (estimated):

- Main process: ~1-2 MB (with dependencies)
- Preload: ~50-100 KB
- Renderer: ~500KB-1MB (React + app code)

---

## Known Limitations & Considerations

### Platform Differences

**Windows**:

- NSIS installer requires elevation
- Native menus work differently

**macOS**:

- App signing and notarization required for distribution
- macOS-specific entitlements needed for certain permissions
- App stays active when all windows close

**Linux**:

- Multiple package formats (AppImage, snap, deb)
- Icon handling varies by desktop environment

### Electron Version

**Electron 38** includes:

- Node.js ~20.x (not v22.x from development environment)
- Chromium ~128.x
- Security features enabled by default

**Note**: Development uses Node v22.21.1, but production uses Electron's bundled Node ~20.x

---

## State Management

### Zustand Implementation

**Version**: 5.0.3

**Architecture**:

```typescript
// Store creation with persist middleware
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // State and actions
    }),
    {
      name: 'storage-key',
      partialize: (state) => ({
        /* selective persistence */
      })
    }
  )
)
```

**Current Stores**:

1. **App State Store** (`appStore.ts`)
   - Theme management (light/dark/system)
   - UI state (fullscreen)
   - System theme synchronization
   - Persists: theme mode only

2. **Toast Store** (`toastStore.ts`)
   - Global notification system
   - Auto-dismiss with timers
   - Toast variants: info, success, warning, error, loading
   - No persistence (ephemeral notifications)

3. **User Preferences Store** (`userPreferencesStore.ts`)
   - Reading preferences (page preload, zoom, reader mode)
   - Download preferences (simultaneous downloads, location, quality)
   - UI preferences (animations, sidebar state, theme, compact mode)
   - Notification preferences (download complete, chapter updates, errors)
   - Persists: all preferences to localStorage

4. **Library Store** (`libraryStore.ts`)
   - Bookmark management (Phase 3 skeleton)
   - Collection management
   - Persists: all library data

**Store Location**: `src/renderer/src/stores/`

**Import Pattern**:

```typescript
import {
  useAppStore,
  useToastStore,
  useUserPreferencesStore,
  useLibraryStore
} from '@renderer/stores'
```

**Usage Pattern**:

```typescript
// Selector pattern for performance
const theme = useAppStore((state) => state.theme)
const setTheme = useAppStore((state) => state.setTheme)

// Actions
const show = useToastStore((state) => state.show)
show({ variant: 'success', title: 'Done!', message: 'Task completed' })
```

**Persistence Strategy**:

- **localStorage** for browser-based state
- Keys: `dexreader-app`, `dexreader-preferences`, `dexreader-library`
- Selective persistence via `partialize` function
- Automatic hydration on app start

**Benefits**:

- Minimal bundle size (~1.4kb)
- No boilerplate (no actions/reducers)
- Built-in persistence middleware
- TypeScript-first design
- DevTools support
- Automatic selector optimization

### Future State Management Considerations

- **Redux Toolkit** - For highly complex state requirements
- **Jotai** - Atomic state management for granular updates

### Testing (To Be Added)

- **Vitest** - Vite-native unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing for Electron

### Additional Libraries (As Needed)

- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Headless component primitives
- **React Router** - Client-side routing (if multi-page)

---

## Development Workflow Commands

### Quick Reference

```bash
# Setup
npm install                    # Install dependencies

# Development
npm run dev                    # Start dev server with HMR
npm run start                  # Preview production build

# Quality checks
npm run typecheck              # Type validation
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier

# Building
npm run build                  # Build for production
npm run build:unpack           # Build without packaging
npm run build:win              # Windows installer
npm run build:mac              # macOS DMG
npm run build:linux            # Linux packages
```

---

## Debugging Configuration

### VS Code Launch Config

_Note: No `.vscode/launch.json` currently configured_

**Recommended Configuration** (to be added):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron-vite",
      "runtimeArgs": ["--sourcemap"]
    }
  ]
}
```

---

## Environment Variables

### Electron-Vite

**Development**:

- `ELECTRON_RENDERER_URL` - Vite dev server URL (auto-set)
- `NODE_ENV=development` - Development mode

**Production**:

- `NODE_ENV=production` - Production optimizations

### Custom Variables (Future)

To add environment variables:

1. Create `.env` file (gitignored)
2. Access via `import.meta.env.VITE_*` in renderer
3. Access via `process.env.*` in main/preload

---

## Critical Dependencies Explained

### @electron-toolkit Packages

**Purpose**: Official helper utilities from Electron Vite team

- **@electron-toolkit/preload**:
  - `electronAPI` object with common Electron APIs
  - Type-safe preload helpers

- **@electron-toolkit/utils**:
  - `is.dev` - Detect development mode
  - `optimizer` - Window shortcut management
  - `electronApp` - App utilities

- **@electron-toolkit/tsconfig**:
  - Optimized TypeScript configs for Electron
  - Separate Node.js and web configurations

- **@electron-toolkit/eslint-config-\***:
  - Pre-configured ESLint rules
  - Prettier integration

### Why electron-vite?

**Advantages over plain Vite**:

- Handles three separate build processes automatically
- Optimized for Electron's multi-process architecture
- Built-in HMR for main process (experimental)
- Simpler configuration than custom Vite setup

---

## Technology Decision Rationale

### Why React 19?

- Latest stable version with concurrent features
- Improved performance out of the box
- Better TypeScript support
- Future-proof for new features (Server Components, etc.)

### Why TypeScript?

- Type safety across all processes
- Better IDE support and autocomplete
- Catch errors at compile time
- Self-documenting code

### Why Vite over Webpack?

- Significantly faster development builds
- Native ES modules support
- Better developer experience
- Smaller configuration surface

### Why electron-vite over Electron Forge?

- More modern build tooling (Vite)
- Better performance in development
- Simpler configuration for Vite users
- Growing ecosystem

---

## Error Handling System

### Components

**Error Boundaries** (`src/renderer/src/components/ErrorBoundary/`):

- `ErrorBoundary.tsx` - React class component for catching component errors
- `ErrorFallback.tsx` - Default fallback UI with 3 levels (app/page/component)
- `ErrorBoundary.css` - Styling for all error boundary levels

**Error Recovery** (`src/renderer/src/components/ErrorRecovery/`):

- `ErrorRecovery.tsx` - Inline error UI with retry button
- `ErrorRecovery.css` - Casual, user-friendly error display

**Error Logging** (`src/renderer/src/components/ErrorLogViewer/`):

- `ErrorLogViewer.tsx` - Dev/debug tool for viewing error history
- `ErrorLogViewer.css` - Settings → Advanced → Error Log
- In-memory circular buffer (max 50 entries)
- Copy to clipboard functionality

**Offline Status** (`src/renderer/src/components/OfflineStatusBar/`):

- `OfflineStatusBar.tsx` - Persistent banner for offline states
- `OfflineStatusBar.css` - Conditional styling (blue vs yellow)
- Three states: online, offline-user, offline-no-internet

### Utilities

**Global Error Handler** (`src/renderer/src/utils/errorHandler.ts`):

- `GlobalErrorHandler` class with initialization
- Catches `window.onerror` and `window.onunhandledrejection`
- Automatic toast notifications
- Error log management
- Initialized in `main.tsx` on app startup

**Error Message Catalog** (`src/renderer/src/utils/errorMessages.ts`):

- `ERROR_CATALOG` - ~20 error patterns with user-friendly messages
- `getUserFriendlyError()` - Convert technical errors to casual language
- Covers: filesystem, network, validation, IPC, parsing errors
- All messages use conversational tone

**Retry Utility** (`src/renderer/src/utils/retry.ts`):

- `retry<T>()` - Promise-based retry with exponential backoff
- Configurable: maxAttempts, delay, backoff strategy
- Returns typed result or throws after all attempts

### Hooks

**useRetry** (`src/renderer/src/hooks/useRetry.ts`):

- React hook for retry operations
- Returns: `{ execute, isLoading, error, attemptCount, retry }`
- Used with `<ErrorRecovery>` component

### State Management

**Connectivity Store** (`src/renderer/src/stores/connectivityStore.ts`):

- Zustand store for connectivity state
- States: `online | offline-user | offline-no-internet`
- Actions: `setOnline()`, `setOfflineMode()`, `setNoInternet()`, `checkConnectivity()`
- Automatic connectivity monitoring

### Integration Points

**App.tsx**:

- App-level error boundary wraps entire application
- Last resort catch-all for uncovered errors

**router.tsx**:

- Page-level error boundaries on all routes
- Keeps sidebar functional when page crashes

**AppShell.tsx**:

- `<OfflineStatusBar />` at top of app layout
- Shows/hides based on connectivity state

**main.tsx**:

- `globalErrorHandler.initialize()` - Global handlers
- Catches uncaught exceptions and promise rejections

**SettingsView.tsx**:

- Advanced tab includes `<ErrorLogViewer />`
- View/copy/clear error logs

### Error Handling Patterns

**IPC Call Pattern**:

```typescript
import { isIpcSuccess } from '@renderer/utils/ipcTypeGuards'
import { getUserFriendlyError } from '@renderer/utils/errorMessages'

const response = await window.fileSystem.readFile(path, 'utf-8')
if (isIpcSuccess(response)) {
  // Use response.data
} else {
  const friendly = getUserFriendlyError(response.error.message)
  showToast({ variant: 'error', message: friendly.message })
}
```

**Retry Pattern**:

```typescript
import { useRetry } from '@renderer/hooks/useRetry'

const { execute, error, retry, isLoading } = useRetry(
  async () => await downloadChapter(id),
  { maxAttempts: 3 }
)

if (error) return <ErrorRecovery error={error} onRetry={retry} isRetrying={isLoading} />
```

**Component Error Boundary**:

```tsx
<ErrorBoundary level="page">
  <MyComponent />
</ErrorBoundary>
```

### Documentation

- **Comprehensive Guide**: `docs/architecture/error-handling.md` (900+ lines)
  - Architecture overview
  - Usage patterns
  - Best practices
  - Testing strategies
  - Troubleshooting

---

_This technical context provides a comprehensive view of all technologies, configurations, and patterns used in DexReader. Refer to this document when making technology choices or troubleshooting build issues._

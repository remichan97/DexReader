# DexReader System Pattern

**Last Updated**: 19 March 2026
**Version**: 1.0.2
**Architecture**: Electron Multi-Process Desktop Application

---

## Localisation & Language

### Display Language

**Default**: **British English (en-GB)**

**Spelling Conventions**:

- "Favourites" (not "Favorites")
- "Colour" (not "Color")
- "Organise" (not "Organize")
- "Realise" (not "Realize")
- "Centre" (not "Center")

**Date Format Options** (future enhancement):

- Default: DD/MM/YYYY (British format)
- Alternative: ISO 8601 (YYYY-MM-DD) for sorting
- Alternative: MM/DD/YYYY (American format)
- User-configurable in Settings

**Future Localisation**:

- Architecture should support i18n (internationalisation)
- Keep all UI strings in a centralised location for easy translation
- Consider react-i18next or similar when multi-language support is needed
- Locale settings: date format, number format, time format

**Writing Style**:

- Use British English consistently across UI, documentation, and code comments
- **Casual, friendly tone** - Drop formality and professionalism for a more relaxed, conversational UI
- Error messages should be clear, actionable, and friendly (e.g., "Oops! Couldn't load that chapter" instead of "An error occurred while loading the requested resource")
- Use contractions (can't, won't, it's) and natural language
- **Icons**: Always use Fluent UI icons from `@fluentui/react-icons` in source code - never use unicode emoji icons (rendering is inconsistent across different systems)
- Avoid corporate jargon or overly technical language in user-facing text

---

## MangaDex API Integration

### Image Proxy Architecture

**Critical Requirement**: MangaDex **blocks direct image hotlinking** - attempting to load images directly from the renderer will return wrong/incorrect images. All images MUST be proxied through the main process.

#### Network Protocol: `mangadex://`

**Implementation**: Custom protocol handler for online image streaming

- **Why Protocol Handler**: Native Chromium integration, streaming support, lowest memory overhead
- **Alternatives Rejected**:
  - Base64 IPC: 33% memory overhead, message size limits
  - Localhost HTTP server: Extra port management, server overhead
- **Registration**: `protocol.handle('mangadex', ...)` in main process on `app.whenReady()`
- **URL Format**: `mangadex://uploads.mangadex.org/covers/...` (replaces `https://`)
- **Use Case**: Online chapter pages, cover images, thumbnails
- **Implementation**: `src/main/api/imageProxy.ts`

#### Local Protocol: `local-manga://`

**Implementation**: Custom protocol handler for downloaded chapter images

- **Why Separate Protocol**: Keeps network proxy focused, avoids database queries in hot path
- **Registration**: `protocol.handle('local-manga', ...)` in main process on `app.whenReady()`
- **URL Format**: `local-manga://chapter/{chapterId}/page/{pageNum}` (e.g., `local-manga://chapter/abc123/page/5`)
- **Use Case**: Downloaded chapters stored in filesystem
- **Path Resolution**: Uses `downloadsBasePath` from database (not current settings)
- **Implementation**: `src/main/api/localImageProxy.ts`

**Frontend Integration**:

```typescript
// Reader checks download status once per chapter
const isDownloaded = await window.downloads.isDownloaded(chapterId)

// Select protocol based on availability
const imageUrls = pages.map((page, index) => {
  if (isDownloaded) {
    return `local-manga://chapter/${chapterId}/page/${index + 1}`
  } else {
    return `mangadex://${page.url}` // Online streaming
  }
})
```

**Security: Internal Protocol Only**

- **Scope**: Both protocols ONLY accessible within DexReader's renderer processes
- **Not OS-registered**: We do NOT call `app.setAsDefaultProtocolClient()`
- **No external access**: Other applications, browsers, or websites cannot trigger these URLs
- **Sandboxed**: Protocol handlers inherit app's security context
- **Future consideration**: If we need OS-level protocol handling (e.g., "Open in DexReader" from browser), use a different protocol like `dexreader://` with explicit validation

### Caching Strategy: Progressive by Phase

**IMPORTANT**: Caching is implemented progressively across phases. Each phase has different caching requirements and storage mechanisms.

#### Phase 2 (Streaming Mode): Ephemeral Memory Cache

**Scope**: Online reading only, temporary session cache

- **Chapter Images**: 30MB true LRU cache, 15-minute expiry
- **Cover Images**: 20MB true LRU cache, **no expiry**
- **Total Memory Limit**: ~50MB maximum
- **Storage**: In-memory only (`Map<string, CacheEntry>`)
- **Persistence**: NONE - cleared on app close
- **Eviction**: True LRU (tracks `lastAccessed` time) when cache full
- **Expiry**: 15 minutes for chapter images only (matches MangaDex URL validity)
- **Use Case**: Smooth page navigation during online reading
- **Clear Trigger**: Chapter switch clears chapter cache
- **Implementation**: `src/main/api/imageProxy.ts` (140 lines)

**Implementation**:

```typescript
// Implemented in src/main/api/imageProxy.ts
interface CacheEntry {
  buffer: Buffer
  timestamp: number
  size: number
  lastAccessed: number // ✅ For true LRU tracking
}

class ImageProxy {
  private chapterCache: Map<string, CacheEntry> // 30MB limit
  private coverCache: Map<string, CacheEntry> // 20MB limit

  registerProtocol() {
    protocol.handle('mangadex', async (request) => {
      // 1. Check cache (expired check only for chapter images)
      // 2. Update lastAccessed on cache hit
      // 3. Fetch from network if cache miss
      // 4. Add to appropriate cache with true LRU eviction
      // 5. Return Response with buffer
    })
  }
}
```

#### Phase 3 (Bookmarks): Persistent Metadata Cache

**Scope**: Cached metadata and covers for favourited/bookmarked manga

- **Storage Location**: SQLite database (`AppData/DexReader/dexreader.db`) + cover cache (`AppData/DexReader/cache/cover/`)
- **Cover Images**: 512x512 JPG, persistent on disk with configurable size limit
- **Metadata**: Manga details, chapter lists, tags, read history, collections
- **Trigger**: User adds manga to favourites/library
- **Invalidation**: Based on `updatedAt` timestamps from API
- **Benefit**: Instant library view, offline metadata browsing
- **Size Limit**: Configurable via `maxDiskCacheSize` setting (default: unlimited)

#### Phase 4 (Downloads): Full Offline Storage

**Scope**: Complete chapter downloads for offline reading

**Dual Protocol Architecture**:

- **`local-manga://`** - New protocol for downloaded chapters (filesystem reads)
  - Format: `local-manga://chapter/{chapterId}/page/{pageNum}`
  - Handler uses stored `downloadsBasePath` from database (not current settings)
  - Enables loading files even if user changes download directory
- **`mangadex://`** - Existing network proxy (Phase 2 implementation)
  - Continues to handle online chapter streaming
- **Frontend decides** which protocol to use based on download status

**Storage Structure**:

- **Base Path**: User-configured downloads directory (stored per-download in database)
- **Directory Layout**: `{downloadsBasePath}/manga/{mangaId}/chapters/{chapterId}/pages/`
- **Page Format**: Zero-padded filenames (`001.jpg`, `002.jpg`, `...`, `015.jpg`)
- **No metadata files**: Database is single source of truth

**Database Tracking** (`chapter_downloads` table):

- `downloadsBasePath` (text, NOT NULL): Where download was stored (e.g., `C:\Users\...\downloads`)
- `filePath` (text, NOT NULL): Relative structure (e.g., `manga\{id}\chapters\{id}`)
- `status` (enum): `queued`, `downloading`, `completed`, `failed`
- `downloadedAt`, `totalPages`, `storageSize`, `imageQuality`, `errorMessage`
- **Path Resilience**: Tracks original location, enables future migration features

**Download Flow**:

1. User triggers explicit download action
2. Backend constructs paths: base + relative structure
3. Creates directory, downloads all pages with progress events
4. Saves metadata in database with status tracking
5. Reader loads via `local-manga://` protocol when available

**Key Design Choices**:

- **Explicit only**: No automatic background downloads
- **Path tracking**: Survives user changing download directory setting
- **Clean separation**: Network proxy unchanged, local protocol added
- **Progress events**: `download:chapter-progress` emitted per-page for UI updates
- **Implementation**: `src/main/services/download.service.ts`

**Key Distinction**:

- **Streaming (Phase 2)**: Ephemeral, memory-only, automatic
- **Bookmarks (Phase 3)**: Persistent covers/metadata, automatic on bookmark
- **Downloads (Phase 4)**: Persistent full chapters, manual user action, dual protocol architecture

### Rate Limiting

**Global Limit**: 5 requests/second per IP
**At-Home Endpoint**: 40 requests/minute (image URLs)
**Penalties**: HTTP 429 → HTTP 403 (temp ban) → IP block

**Implementation**: Token bucket algorithm with endpoint-specific limits

- **Global**: Capacity 5 tokens, refill rate 5 tokens/second
- **Endpoint-Specific**: at-home/server has 40 tokens, refill rate 0.67 tokens/second (40/min)
- Per-endpoint tracking for specialized limits
- Automatic retry on 429 responses with `Retry-After` header
- **Implementation**: `src/main/api/rateLimiter.ts`

**Integration**: All API requests call `await rateLimiter.waitForToken(endpoint)` before fetch

### Error Handling

**Custom Error Types**:

- `MangaDexApiError`: HTTP errors from API (4xx, 5xx) with request ID
- `MangaDexNetworkError`: Network/timeout failures with URL

**Retry Strategy**:

- HTTP 429: Automatic retry after delay (respects `Retry-After` header)
- Other HTTP errors (4xx, 5xx): Immediate failure with error details
- Network errors: Thrown as `MangaDexNetworkError`

**Request Tracking**: Logs `X-Request-Id` header on all errors for debugging
**IPC Integration**: All errors serialized via `wrapIpcHandler` for renderer consumption

---

## Development Approach

### Backend Development Philosophy

**Hands-On Implementation**: For all backend/main process code, the developer implements directly with Copilot acting as a code reviewer and guide.

**Copilot's Role**:

- Review code for mistakes, security issues, and optimization opportunities
- Point out what's wrong and suggest what should be done
- Provide guidance, explanations, and best practices
- **Avoid direct implementation** unless explicitly requested

**Applies To**:

- Main process modules (`src/main/**`)
- Filesystem operations and security code
- IPC handler implementations
- Preload script logic
- Node.js-based backend features

**Frontend Code**: Normal collaborative implementation (Copilot can implement directly)

**Rationale**: Backend code, especially security-critical filesystem operations, benefits from hands-on learning and deep understanding by the developer.

---

## Architecture Overview

### Core Framework Stack

- **Electron** v38.1.2 - Desktop application framework
- **React** v19.1.1 - UI rendering (with new JSX runtime)
- **TypeScript** v5.9.2 - Type-safe development
- **Vite** v7.1.6 - Build tooling via electron-vite

### Multi-Process Architecture

DexReader follows Electron's security-first multi-process model:

```mermaid
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│    src/main/index.ts                    │
│  - Window lifecycle management          │
│  - Native OS integration                │
│  - IPC message routing                  │
│  - File system access                   │
└──────────────┬──────────────────────────┘
               │
               │ IPC Bridge
               │
┌──────────────▼──────────────────────────┐
│         Preload Script                  │
│    src/preload/index.ts                 │
│  - Secure context bridge                │
│  - API exposure (contextIsolated)       │
│  - Type definitions (index.d.ts)        │
└──────────────┬──────────────────────────┘
               │
               │ window.electron / window.api
               │
┌──────────────▼──────────────────────────┐
│    Renderer Process (Chromium)          │
│    src/renderer/                        │
│  - React application                    │
│  - UI components                        │
│  - Browser-based environment            │
└─────────────────────────────────────────┘
```

---

## Error Handling Architecture

### Three-Layer Defense System

DexReader implements a comprehensive error handling strategy with three layers:

1. **Error Boundaries** (React Component Errors)
   - App-level: Last resort catch-all, replaces entire app
   - Page-level: Primary handler, replaces content area (sidebar stays functional)
   - Component-level: Optional granular handling for specific widgets

2. **Try-Catch + IPC Handlers** (Async Operations)
   - All async operations wrapped in try-catch
   - IPC calls checked with type guards (`isIpcSuccess`, `isIpcError`)
   - User-friendly error messages via `getUserFriendlyError()`

3. **Global Handlers** (Uncaught Exceptions)
   - `window.onerror` - Catches uncaught exceptions
   - `window.onunhandledrejection` - Catches unhandled promise rejections
   - Automatic toast notifications and error logging

### Error Message Philosophy

**Casual, Conversational Tone** - All user-facing error messages use friendly language:

- ❌ "An error has occurred while attempting to access the specified resource"
- ✓ "Can't find that file. Maybe it was moved or deleted?"

**Error Message Catalog** (~20 patterns):

- Filesystem errors: ENOENT, EACCES, ENOSPC
- Network errors: Timeout, connection refused, no internet
- Validation errors: Invalid input, bad paths
- IPC errors: Communication failures
- Generic fallback: "Well, that's weird"

### Error Recovery

- **Retry Utility**: Exponential backoff for transient failures (3 attempts by default)
- **useRetry Hook**: React hook with loading/error/retry states
- **ErrorRecovery Component**: Inline error UI with "Try Again" button

### Offline Mode

**Three Connectivity States**:

1. `online` - Normal operation
2. `offline-user` - User manually enabled offline mode (blue banner)
3. `offline-no-internet` - System detected no internet (yellow banner)

**OfflineStatusBar**: Persistent banner at top of app when offline, with context-appropriate actions ("Go Online" vs "Retry")

### Error Logging

- In-memory circular buffer (max 50 entries)
- Viewable in Settings → Advanced → Error Log
- Copy to clipboard for bug reports
- Technical details preserved for debugging

**See**: `docs/architecture/error-handling.md` for comprehensive guide

---

## Project Structure

### Directory Organization

```tree
DexReader/
├── .github/memory-bank/          # Project documentation & patterns
├── build/                        # Build resources (icons, entitlements)
├── resources/                    # Application resources (bundled)
├── src/
│   ├── main/                     # Main process (Node.js)
│   │   └── index.ts             # Entry point, window creation
│   ├── preload/                  # Security bridge
│   │   ├── index.ts             # Context bridge implementation
│   │   └── index.d.ts           # TypeScript definitions for renderer
│   └── renderer/                 # Frontend application
│       ├── index.html           # HTML shell
│       └── src/
│           ├── main.tsx         # React entry point
│           ├── App.tsx          # Root component
│           ├── assets/          # Static assets (CSS, images)
│           └── components/      # React components
├── electron.vite.config.ts      # Build configuration
├── electron-builder.yml         # Packaging configuration
└── package.json                 # Dependencies & scripts
```

### Build Output Structure

```tree
out/
├── main/                        # Compiled main process
├── preload/                     # Compiled preload script
└── renderer/                    # Bundled React app
```

---

## Technology Patterns

### TypeScript Configuration

**Dual TSConfig Strategy** - Separate configurations for Node.js and browser contexts:

1. **`tsconfig.node.json`** - Main & Preload processes
   - Node.js environment
   - Includes: `electron.vite.config.*`, `src/main/**`, `src/preload/**`
   - Extends: `@electron-toolkit/tsconfig/tsconfig.node.json`

2. **`tsconfig.web.json`** - Renderer process
   - Browser environment with React JSX
   - Path alias: `@renderer/*` → `src/renderer/src/*`
   - Includes: `src/renderer/**`, preload type definitions

3. **`tsconfig.json`** - Project references coordinator
   - Aggregates both configurations

### Build System (electron-vite)

**Three Independent Build Targets**:

```typescript
// electron.vite.config.ts
{
  main: {
    plugins: [externalizeDepsPlugin()]  // Node.js externals
  },
  preload: {
    plugins: [externalizeDepsPlugin()]  // Security layer
  },
  renderer: {
    resolve: {
      alias: { '@renderer': resolve('src/renderer/src') }
    },
    plugins: [react()]                  // Vite + React Fast Refresh
  }
}
```

**Benefits**:

- Isolated build contexts for each process
- Hot Module Replacement (HMR) for renderer during development
- Optimized bundling with appropriate externalization

### Security Model

**Context Isolation Enabled**:

```typescript
// Main process creates isolated context
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  sandbox: false,           // Allows Node.js in preload
  contextIsolation: true    // Default, enforced separation
}

// Preload exposes selective APIs
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', customAPI)
}
```

**Content Security Policy**:

```html
<!-- Strict CSP in index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data:"
/>
```

---

## Filesystem & Security Model

### Restricted Filesystem Access

**Principle**: DexReader restricts itself to specific, user-controlled directories only.

**Allowed Directories**:

1. **AppData Directory** (Automatic, no user config needed)

   ```typescript
   app.getPath('userData')
   // Windows: C:\Users\<username>\AppData\Roaming\dexreader
   ```

   **Contains**:
   - Application database (bookmarks, reading progress, collections)
   - Manga metadata (covers, titles, descriptions, chapter lists)
   - Application settings/preferences
   - Logs

2. **Downloads Directory** (User-configurable)

   ```typescript
   // Default location
   app.getPath('downloads') + '/DexReader'
   // User can change via Settings
   ```

   **Contains**:
   - Downloaded manga chapters (images)
   - Downloaded manga metadata
   - User-initiated explicit downloads only

**Filesystem Rules**:

```typescript
// Example: Path validation in main process
import path from 'path'
import { app } from 'electron'

const ALLOWED_BASE_PATHS = {
  appData: app.getPath('userData'),
  downloads: null as string | null // Set by user preference
}

function isPathAllowed(requestedPath: string): boolean {
  const normalized = path.normalize(path.resolve(requestedPath))

  // Always allow app data
  if (normalized.startsWith(ALLOWED_BASE_PATHS.appData)) {
    return true
  }

  // Allow configured downloads directory
  if (ALLOWED_BASE_PATHS.downloads && normalized.startsWith(ALLOWED_BASE_PATHS.downloads)) {
    return true
  }

  return false
}

// All file operations MUST validate paths
ipcMain.handle('read-file', async (event, filePath) => {
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied: Path outside allowed directories')
  }
  // Safe to proceed
  return fs.promises.readFile(filePath)
})
```

**Network Access Restrictions**:

- Only connect to whitelisted domains:
  - `api.mangadex.org` (API)
  - `uploads.mangadex.org` (CDN)
  - MangaDex at-home servers (for chapter images)
- No arbitrary URL access
- All API calls go through validated client

**What DexReader CANNOT Access**:

- System directories (System32, Program Files, etc.)
- User's Documents, Pictures, Videos (unless explicitly selected via file dialog)
- Other applications' data
- Registry (except for theme detection via Electron APIs)
- Running processes
- Webcam, microphone, location (not needed)

**User Controls**:

```typescript
// Settings interface for downloads directory
interface AppSettings {
  downloadsPath: string // User can change via native folder picker
  // When changed, validate and update ALLOWED_BASE_PATHS.downloads
}

// Native folder picker for security
async function selectDownloadsFolder() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Downloads Folder',
    defaultPath: ALLOWED_BASE_PATHS.downloads || app.getPath('downloads')
  })

  if (!result.canceled && result.filePaths.length > 0) {
    // User explicitly selected this path
    ALLOWED_BASE_PATHS.downloads = result.filePaths[0]
    // Save to settings
  }
}
```

---

## Code Conventions

### Formatting (Prettier)

```yaml
singleQuote: true # Use 'string' not "string"
semi: false # No semicolons
printWidth: 100 # Max line length
trailingComma: none # Clean object literals
```

### Linting (ESLint)

- **Base**: `@electron-toolkit/eslint-config-ts`
- **React**: Flat config with recommended rules
- **Hooks**: React Hooks linting enforced
- **Refresh**: React Fast Refresh validation
- **Prettier**: Integrated via `@electron-toolkit/eslint-config-prettier`

### React Patterns

```tsx
// Modern React 19 patterns
import { StrictMode } from 'react' // Always wrap in StrictMode
import { createRoot } from 'react-dom/client'

// JSX Runtime (no need to import React in components)
function Component(): React.JSX.Element {
  return <div>...</div>
}

// Hooks-based state management
const [state, setState] = useState(initialValue)
```

### File Naming

- **Components**: PascalCase (`App.tsx`, `Versions.tsx`)
- **Utilities**: camelCase (when added)
- **Types**: PascalCase interfaces/types
- **Assets**: kebab-case (`base.css`, `main.css`)

---

## IPC Communication Architecture

**Documentation**: [ipc-messaging.md](../../docs/architecture/ipc-messaging.md)

### Overview

DexReader uses a robust IPC (Inter-Process Communication) architecture with **50+ channels** across 12 categories. All IPC operations follow consistent patterns for type safety, error handling, and validation.

### Channel Naming Convention

```
Pattern: <category>:<action>

Examples:
  fs:read-file           - Filesystem operations
  theme:get-system-accent-color  - Theme operations

Events (no prefix):
  navigate               - Navigation event
  theme-changed          - Theme change event
```

### Categories

| Category   | Channels | Description                                        |
| ---------- | -------- | -------------------------------------------------- |
| Filesystem | 16       | File and directory operations with path validation |
| Theme      | 4        | System theme and accent colour detection           |
| Menu       | 14       | Application menu actions and state updates         |
| Dialogue   | 2        | Native confirmation and multi-choice dialogues     |
| Navigation | 1        | Route navigation events from menu                  |
| Window     | 0        | (Reserved for future window management)            |

### Error Handling System

All IPC handlers use `wrapIpcHandler` for automatic error catching and serialisation:

```typescript
// Main process
import { wrapIpcHandler } from './ipc/wrapHandler'
import { validatePath, validateEncoding } from './ipc/validators'

wrapIpcHandler('fs:read-file', async (_event, filePath: unknown, encoding: unknown) => {
  const validPath = validatePath(filePath, 'filePath')
  const validEncoding = validateEncoding(encoding, 'encoding')
  return await secureFs.readFile(validPath, validEncoding)
})
```

**Custom Error Classes**:

- `IpcError` - Base error with code and details
- `FileSystemError` - Filesystem operation failures
- `ValidationError` - Invalid parameter errors
- `ThemeError` - Theme-related errors

**Error Serialisation**:

```typescript
{
  name: 'FileSystemError',
  message: 'Failed to read file',
  code: 'FS_ERROR',
  details: { operation: 'read', path: '...' },
  stack: '...'  // Development only
}
```

### Request Validation

Three core validators ensure parameter integrity:

```typescript
validateString(value, fieldName) // Type checking
validatePath(value, fieldName) // Non-empty path validation
validateEncoding(value, fieldName) // BufferEncoding enum validation
```

All 11 filesystem handlers validate inputs before processing, preventing injection attacks and type errors.

### Type Safety

**Shared Types** (`src/preload/ipc.types.ts`):

```typescript
export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ISerialiseError
}

export interface FileStats {
  isFile: boolean
  isDirectory: boolean
  size: number
  created: string
  modified: string
}
```

**Type Guards** (`src/renderer/src/utils/ipcTypeGuards.ts`):

```typescript
function isIpcSuccess<T>(response: IpcResponse<T>): response is { success: true; data: T }
function isIpcError<T>(
  response: IpcResponse<T>
): response is { success: false; error: ISerialiseError }
```

**Usage in Renderer**:

```typescript
const response = await window.fileSystem.readFile(path, 'utf-8')

if (isIpcSuccess(response)) {
  // TypeScript knows response.data is string | Buffer
  setContent(response.data)
} else {
  // TypeScript knows response.error is ISerialiseError
  console.error(response.error.message)
  if (response.error.code === 'FS_ERROR') {
    toast.error("Couldn't read the file")
  }
}
```

### Adding New IPC Handlers

1. **Define types** in `src/preload/ipc.types.ts`
2. **Create validators** in `src/main/ipc/validators.ts` (if needed)
3. **Implement handler** with `wrapIpcHandler` in main process
4. **Expose in preload** via `contextBridge.exposeInMainWorld`
5. **Update types** in `src/preload/index.d.ts`
6. **Register in registry** at `src/main/ipc/registry.ts`
7. **Use in renderer** with type guards

See [ipc-messaging.md](../../docs/architecture/ipc-messaging.md) for complete guide.

---

## Styling Architecture

### CSS Structure

```tree
assets/
├── base.css              # Design tokens, resets, typography
└── main.css              # Layout, component styles
```

### Design System (CSS Variables)

```css
/* Dark theme with Electron Vite branding */
--ev-c-black: #1b1b1f /* Primary background */ --ev-c-text-1: rgba(255, 255, 245, 0.86)
  /* Primary text */ --ev-c-gray- *: ... /* Component backgrounds */;
```

### Responsive Breakpoints

- `720px` - Font size adjustments
- `620px` - Hide version display
- `350px` - Hide secondary UI elements

---

## Build & Distribution

### Development Workflow

```bash
npm run dev              # Start with HMR (Vite dev server)
npm run build            # Type check + production build
npm run typecheck        # Type validation only
```

### Platform Distribution

```bash
npm run build:win        # Windows NSIS installer
npm run build:mac        # macOS DMG
npm run build:linux      # AppImage + snap + deb
```

### Electron Builder Configuration

**Packaging Strategy**:

- **App ID**: `com.electron.app`
- **Product Name**: `dexreader`
- **Executable**: `dexreader.exe` (Windows)
- **ASAR**: Enabled with `resources/` unpack
- **Auto-Updates**: Configured (generic provider)

**Excluded from Build**:

```yaml
# Source files, configs, and dev tools excluded
- .vscode, src/, electron.vite.config.*
- tsconfig.*, eslint.*, .prettier*
- README.md, CHANGELOG.md
```

---

## Dependencies Strategy

### Production Dependencies

- `@electron-toolkit/preload` - Preload utilities
- `@electron-toolkit/utils` - Helper functions
- `electron-updater` - Auto-update mechanism

### Development Dependencies

- **Build**: electron, electron-builder, electron-vite, vite
- **Frontend**: react, react-dom, @vitejs/plugin-react
- **TypeScript**: typescript, @types/\* packages
- **Quality**: eslint, prettier, + associated plugins

**Philosophy**: Minimal production deps, comprehensive dev tooling

---

## Window Management

### Main Window Configuration

```typescript
{
  width: 900,
  height: 670,
  show: false,              // Prevent flicker
  autoHideMenuBar: true,    // Clean interface
}

mainWindow.on('ready-to-show', () => {
  mainWindow.show()         // Show when fully loaded
})
```

### Platform-Specific Behaviors

- **Linux**: Custom icon required
- **macOS**: App stays active when all windows close
- **Windows**: Standard window close behavior

---

## Database Performance & Benchmarking

**Documentation**: `src/main/scripts/database-performance/README.md`

### Overview

DexReader maintains a database benchmark suite to validate query performance at scale (1000+ manga, 10,000+ chapters). Benchmarks are **one-off validation tools**, not continuous CI/CD checks, due to the high maintenance burden of keeping them synchronized with evolving repository code.

### When to Run Benchmarks

**Required**:

- ✅ **Before major releases** - Quarterly validation to ensure no regressions
- ✅ **After major database refactoring** - Schema redesigns, ORM upgrades, or migration changes
- ✅ **When adding complex queries** - New repository methods with JOINs, aggregations, or GROUP BY
- ✅ **Performance issue debugging** - Compare with baseline to identify slowdowns

**Not Required**:

- ❌ Minor bug fixes in application logic
- ❌ UI changes without database impact
- ❌ Adding simple CRUD operations

### Benchmark Accuracy Requirement

**CRITICAL**: Benchmark queries must match repository implementation exactly (100% accuracy).

**Why This Matters**:

- Our initial benchmarks used simplified `SELECT *` queries missing 80% of production complexity
- Missing JOINs, aggregations, GROUP BY led to unrealistic performance numbers
- User identified this accuracy flaw: "Does the benchmark code simulate how the repository code would query the database? or are we making stuff up for the numbers?"

**Accuracy Checklist** for Benchmark Queries:

- ✅ Matches repository method query structure exactly
- ✅ Includes all JOINs (LEFT, INNER, etc.)
- ✅ Includes all aggregations (COUNT, MAX, MIN, etc.)
- ✅ Includes all GROUP BY clauses
- ✅ Uses explicit column selection (not SELECT *)
- ✅ Includes all WHERE conditions
- ✅ Matches ORDER BY clauses

### Benchmark Maintenance Guidelines

When database code changes, update benchmarks accordingly:

1. **New Repository Method**: Add corresponding benchmark query to `benchmark-suite.ts` that mirrors exact query structure (JOINs, aggregations, GROUP BY, ORDER BY)
2. **Modified Repository Method**: Update benchmark to match new query structure
3. **Schema Changes**: Update `seed-database.ts` and affected benchmark queries, then re-seed
4. **ORM Upgrades**: Update all benchmark queries to match new ORM syntax

**Key Principle**: Benchmark queries must match repository implementation exactly (100% accuracy) including all JOINs, aggregations, WHERE conditions, and column selections.

### Running Benchmarks

**Complete Validation Workflow**:

```bash
# 1. Seed benchmark database (1000 manga, 10k chapters)
npm run seed:benchmark                                              # ~17 seconds

# 2. Run performance benchmarks (save to git-ignored folder)
npm run benchmark:db -- --output benchmark-results/baseline.json    # ~0.4 seconds

# 3. Analyze query plans (validate index usage)
npm run analyze:plans                                                # ~1 second
```

**Expected Results**:

- All queries <10ms average
- 100% index usage (no table scans)
- 0 warnings or failures

**Output Location**: `benchmark-results/` (git-ignored, local reference only)

### Benchmark Infrastructure

**Location**: `src/main/scripts/database-performance/`

```
database-performance/
├── seeding/              # Test data generation
│   ├── seed-database.ts  # DatabaseSeeder class (1000 manga, 10k chapters)
│   └── seed-cli.ts       # CLI runner
├── benchmarking/         # Performance measurement
│   ├── benchmark-suite.ts # DatabaseBenchmark class (7 queries)
│   └── benchmark-cli.ts   # CLI runner
├── analysis/             # Query plan analysis
│   └── analyze-query-plans.ts # EXPLAIN QUERY PLAN tool
├── shared/               # Common utilities
│   └── database-helpers.ts    # DatabaseTestHelper class
└── README.md             # Complete usage guide
```

**Electron Wrappers**: `scripts/` (run-seed.js, run-benchmark.js, run-analyze-plans.js)

### Maintenance Philosophy

**One-off Validation, Not CI/CD**:

- Benchmarks must be manually updated when repository code changes
- High maintenance burden vs ROI for automated pipelines
- Better alternatives: Integration tests with query counting (N+1 detection), migration reviews, production monitoring
- Tools remain available for on-demand validation when needed

**Integration with Testing**:

- `DatabaseSeeder` can be imported by integration tests
- `DatabaseBenchmark` can be integrated into test suites
- Focus testing effort on integration tests that detect N+1 query patterns

---

## Development Principles

1. **Security First**: Context isolation, CSP, sandboxing
2. **Type Safety**: Strict TypeScript across all processes
3. **Modern React**: Hooks, functional components, StrictMode
4. **Fast Feedback**: HMR for instant development updates
5. **Code Quality**: ESLint + Prettier automation
6. **Cross-Platform**: Consistent experience across OS

---

## State Management Architecture

### Zustand Integration

**Version**: 5.0.3
**Store Location**: `src/renderer/src/stores/`
**Import Alias**: `@renderer/stores`

### Store Structure

```tree
stores/
├── index.ts                    # Barrel export
├── types.ts                    # Shared TypeScript interfaces
├── appStore.ts                 # Theme & UI state
├── toastStore.ts               # Global notifications
├── userPreferencesStore.ts     # User settings
└── libraryStore.ts             # Bookmarks & collections (Phase 3)
```

### Store Pattern

```typescript
// 1. Define types in stores/types.ts
export interface AppState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// 2. Create store with persist middleware
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme })
    }),
    {
      name: 'dexreader-app',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)

// 3. Use in components with selectors
const theme = useAppStore((state) => state.theme)
const setTheme = useAppStore((state) => state.setTheme)
```

### Current Stores

#### 1. App State Store (`appStore.ts`)

**Purpose**: Global UI state and theme management

**State**:

- `theme: 'light' | 'dark' | 'system'` - Computed theme
- `themeMode: 'light' | 'dark' | 'system'` - User preference
- `systemTheme: 'light' | 'dark'` - OS theme detection
- `isFullscreen: boolean` - Window state

**Actions**:

- `setSystemTheme(theme)` - Update OS theme
- `setThemeMode(mode)` - Set user preference (persisted via Settings Manager IPC)
- `setTheme(theme)` - Direct theme override
- `setFullscreen(isFullscreen)` - Fullscreen toggle

**Persistence**: Theme and accent color via Settings Manager IPC to `settings.json`

#### 2. Toast Store (`toastStore.ts`)

**Purpose**: Global notification system

**State**:

- `toasts: ToastItem[]` - Active notifications

**Actions**:

- `show(props)` - Add toast (returns unique ID)
- `dismiss(id)` - Remove specific toast
- `dismissAll()` - Clear all toasts

**Toast Variants**: `info`, `success`, `warning`, `error`, `loading`

**Persistence**: None (ephemeral)

**Integration**: Global `ToastContainer` in `App.tsx`

#### 3. User Preferences Store (`userPreferencesStore.ts`)

**Purpose**: User settings and preferences (deprecated in favor of Settings Manager)

**Categories**: Reading, Downloads, UI, Notifications

**Actions**: Individual setters, bulk updates, reset to defaults

**Persistence**: Critical settings via Settings Manager IPC (downloads, reader preferences)

**Extensibility**: Designed for future expansion

#### 4. Library Store (`libraryStore.ts`)

**Purpose**: Library management for bookmarks and collections

### Store Guidelines

**✅ Do**:

- Use selector pattern: `const value = useStore((state) => state.value)`
- Keep stores focused and single-purpose
- Validate input in setters
- Use `partialize` for selective persistence
- Clean up timers/subscriptions

**❌ Don't**:

- Access entire store: `const store = useStore()` (causes re-renders)
- Store derived state
- Mutate state directly
- Forget to clean up timers

---

## Extension Guidelines

### Adding New Features

**Main Process Features** (File I/O, Native APIs):

1. Add handler in `src/main/index.ts`
2. Expose via preload bridge
3. Update TypeScript definitions

**Renderer Features** (UI Components):

1. Create component in `src/renderer/src/components/`
2. Use path alias: `@renderer/...`
3. Follow React 19 patterns
4. Use Zustand for state management

**Shared Types**:

- Define in `src/preload/index.d.ts` for cross-process types
- Use TypeScript interfaces for data contracts
- Export store types from `stores/types.ts`

---

## Testing Strategy (Future)

**Recommended Tools**:

- **Unit**: Vitest (Vite-native)
- **E2E**: Playwright for Electron
- **Component**: React Testing Library

**Coverage Goals**:

- Main process: IPC handlers, window lifecycle
- Renderer: Component logic, user interactions
- Integration: Full IPC workflows

---

## Performance Considerations

### Current Optimizations

- React 19 concurrent features enabled
- Vite's optimized dependency pre-bundling
- CSS-in-JS avoided (using native CSS)
- Asset optimization via Vite

### Future Optimizations

- Code splitting for large components
- Lazy loading for heavy features
- Web Workers for CPU-intensive tasks
- Native modules for performance-critical operations

---

## Known Patterns & Anti-Patterns

### ✅ Do

- Use `ipcRenderer.invoke`/`ipcMain.handle` for async operations
- Keep preload script minimal and focused
- Use TypeScript strict mode
- Follow React 19 best practices
- Externalize Node.js dependencies in main/preload

### ❌ Don't

- Access Node.js APIs directly in renderer
- Disable context isolation without good reason
- Use `remote` module (deprecated)
- Mix CommonJS and ESM (stick to ESM)
- Bundle native Node modules in renderer

---

## Native Dialog Best Practices

### Message vs Detail Structure

Native Electron dialogs have **fixed-width message titles** that truncate long text. Dynamic content should be placed in the `detail` body instead.

**Pattern**: Short static message + dynamic content in detail

```typescript
// ✅ Good: Short message, full content in detail
const result = await window.api.showDialog({
  message: 'Remove from library?',
  detail: `${mangaTitle}\n\nThis manga has 50 chapters...`,
  buttons: ['Remove', 'Cancel'],
  type: 'warning'
})

// ❌ Bad: Long dynamic content in message gets truncated
const result = await window.api.showDialog({
  message: `Remove "${veryLongMangaTitle}" from library?`,
  detail: 'Additional info...',
  buttons: ['Remove', 'Cancel']
})
```

**Why**: Message field has OS width constraints, detail field expands naturally. Manga titles can be very long.

**Applications**: Confirmation dialogs (item name in detail), error dialogs (specifics in detail), multi-choice dialogs (context in detail)

---

## Auto-Update Configuration

### Update Strategy

```yaml
provider: generic
url: https://example.com/auto-updates
updaterCacheDirName: dexreader-updater
```

**Implementation Requirements**:

- Set up update server
- Implement update UI in renderer
- Handle update events in main process

---

## Environment Configuration

### Process-Specific Environments

**Main Process** (Node.js):

- Full Node.js APIs available
- Electron native modules
- System-level permissions

**Preload Script** (Limited Node.js):

- Node.js APIs + Electron APIs
- Runs before renderer loads
- Trusted environment

**Renderer Process** (Browser):

- Chromium APIs only
- No direct Node.js access
- Sandboxed execution

---

## Path Aliasing

### Configured Aliases

- `@renderer/*` → `src/renderer/src/*`

**Usage Example**:

```typescript
// Instead of: import Component from '../../components/Component'
import Component from '@renderer/components/Component'
```

**Future Aliases to Consider**:

- `@main/*` for main process utilities
- `@shared/*` for cross-process types

---

## Maintenance Notes

### Version Compatibility

- Node.js: Embedded in Electron (v20.x)
- Chromium: Embedded in Electron (v128.x)
- React: v19 (latest stable)

### Update Strategy

- Electron: Review breaking changes carefully
- React: Follow React 19 migration guides
- Dependencies: Keep electron-toolkit packages synchronized

### Build Artifacts

- `out/` - Development builds (gitignored)
- `dist/` - Production installers (gitignored)
- `node_modules/` - Dependencies (gitignored)

---

## Quick Reference

### Key Commands

```bash
npm run dev              # Development mode with HMR
npm run build            # Production build
npm run typecheck        # Validate TypeScript
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

### Key Files

- `src/main/index.ts` - Main process entry
- `src/preload/index.ts` - Security bridge
- `src/renderer/src/App.tsx` - UI entry
- `electron.vite.config.ts` - Build config
- `electron-builder.yml` - Package config

### Documentation References

- Electron: <https://www.electronjs.org/docs>
- electron-vite: <https://electron-vite.org>
- React 19: <https://react.dev>
- Vite: <https://vite.dev>

---

_This system pattern reflects the current state of DexReader as a foundational Electron-React-TypeScript application. Update this document as architectural decisions are made and patterns evolve._

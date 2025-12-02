# DexReader System Pattern

**Last Updated**: 2 December 2025
**Version**: 1.0.0
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

**Date Format Options** (Good-to-have feature for Phase 3):

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
- Emoji usage is acceptable where it adds clarity or warmth
- Avoid corporate jargon or overly technical language in user-facing text

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
   - Cover image cache
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

## IPC Communication Pattern

### Current Implementation

```typescript
// Main Process (src/main/index.ts)
ipcMain.on('ping', () => console.log('pong'))

// Renderer Process (App.tsx)
window.electron.ipcRenderer.send('ping')
```

### Recommended Pattern for Extension

```typescript
// 1. Define in preload/index.ts
const api = {
  doSomething: (data) => ipcRenderer.invoke('do-something', data)
}

// 2. Handle in main/index.ts
ipcMain.handle('do-something', async (event, data) => {
  // Process and return result
  return result
})

// 3. Use in renderer
const result = await window.api.doSomething(data)
```

**Types**: Always update `preload/index.d.ts` for TypeScript support

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
- `setThemeMode(mode)` - Set user preference
- `setTheme(theme)` - Direct theme override
- `setFullscreen(isFullscreen)` - Fullscreen toggle

**Persistence**: `themeMode` only (via localStorage)

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

**Purpose**: Persistent user settings

**Categories**: Reading, Downloads, UI, Notifications

**Actions**: Individual setters, bulk updates, reset to defaults

**Persistence**: All preferences to localStorage

**Extensibility**: Designed for future expansion

#### 4. Library Store (`libraryStore.ts`)

**Purpose**: Phase 3 skeleton for bookmarks and collections

**Status**: Implemented but not yet integrated

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

## Auto-Update Configuration

### Update Strategy

```yaml
provider: generic
url: https://example.com/auto-updates
updaterCacheDirName: dexreader-updater
```

**Status**: Configured but not yet implemented
**Next Steps**:

1. Set up update server
2. Implement update UI in renderer
3. Handle update events in main process

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

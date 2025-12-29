# State Management Architecture

**Framework**: Zustand v5.0.3
**Last Updated**: 2 December 2025
**Status**: ✅ Implemented (Phase 1)

---

## Overview

DexReader uses **Zustand** for global state management across the renderer process. Zustand provides a lightweight (~1.4kb), TypeScript-first solution with built-in persistence middleware, eliminating the need for boilerplate code typically associated with Redux or Context API patterns.

### Why Zustand?

- **Minimal Bundle Size**: ~1.4kb (vs Redux ~10kb)
- **Zero Boilerplate**: No actions, reducers, or providers required
- **TypeScript-First**: Excellent type inference and safety
- **Built-in Persistence**: localStorage integration out-of-the-box
- **Selective Subscriptions**: Component-level optimisation with selectors
- **DevTools Support**: Chrome extension for debugging

---

## Architecture

### Store Directory Structure

```tree
src/renderer/src/stores/
├── index.ts                    # Barrel export for all stores
├── types.ts                    # Shared TypeScript interfaces
├── appStore.ts                 # Theme & global UI state
├── toastStore.ts               # Notification system
├── userPreferencesStore.ts     # User settings & preferences
├── progressStore.ts            # Reading progress (SQLite-backed)
└── libraryStore.ts             # Bookmarks & collections (Phase 3)
```

### Import Pattern

```typescript
// Centralised imports via barrel export
import {
  useAppStore,
  useToastStore,
  useUserPreferencesStore,
  useLibraryStore,
  type ToastItem,
  type Theme
} from '@renderer/stores'
```

---

## Core Stores

### 1. App State Store

**File**: `src/renderer/src/stores/appStore.ts`
**Purpose**: Manage global UI state and theme synchronisation with the Electron main process

#### State Schema

```typescript
interface AppState {
  // Computed theme based on user preference and system theme
  theme: 'light' | 'dark' | 'system'

  // User's theme preference
  themeMode: 'light' | 'dark' | 'system'

  // Operating system theme (synced from main process)
  systemTheme: 'light' | 'dark'

  // Fullscreen state
  isFullscreen: boolean

  // Actions
  setSystemTheme: (theme: 'light' | 'dark') => void
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setFullscreen: (isFullscreen: boolean) => void
}
```

#### Theme Calculation Logic

```typescript
function calculateTheme(
  themeMode: 'light' | 'dark' | 'system',
  systemTheme: 'light' | 'dark'
): 'light' | 'dark' | 'system' {
  if (themeMode === 'system') return 'system'
  return themeMode
}
```

#### Persistence Strategy

```typescript
persist(
  // Store implementation
  {
    name: 'dexreader-app',
    partialize: (state) => ({ themeMode: state.themeMode }) // Only persist user preference
  }
)
```

**Persisted**: `themeMode` only
**Ephemeral**: `systemTheme`, `theme`, `isFullscreen` (recalculated on app start)

#### Usage Example

```typescript
// AppShell.tsx - Main layout wrapper
function AppShell() {
  const theme = useAppStore((state) => state.theme)
  const setSystemTheme = useAppStore((state) => state.setSystemTheme)

  useEffect(() => {
    // Sync with main process on mount
    window.api.getTheme().then(setSystemTheme)

    // Listen for OS theme changes
    const cleanup = window.api.onThemeChanged(setSystemTheme)
    return cleanup
  }, [setSystemTheme])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <>{/* Layout content */}</>
}
```

---

### 2. Toast Store

**File**: `src/renderer/src/stores/toastStore.ts`
**Purpose**: Global notification system with auto-dismiss functionality

#### State Schema

```typescript
interface ToastState {
  // Active notifications
  toasts: ToastItem[]

  // Actions
  show: (props: Omit<ToastItem, 'id'>) => string // Returns toast ID
  dismiss: (id: string) => void
  dismissAll: () => void
}

interface ToastItem {
  id: string
  variant: 'info' | 'success' | 'warning' | 'error' | 'loading'
  title: string
  message?: string
  duration?: number // Auto-dismiss delay (ms), 0 = persistent
  action?: {
    label: string
    onClick: () => void
  }
}
```

#### Auto-Dismiss Implementation

```typescript
// Internal timer management
const activeTimers = new Map<string, NodeJS.Timeout>()

show: (props) => {
  const id = `toast-${Date.now()}-${Math.random()}`
  const toast: ToastItem = { id, ...props }

  set((state) => ({ toasts: [...state.toasts, toast] }))

  // Auto-dismiss if duration specified
  if (props.duration && props.duration > 0) {
    const timer = setTimeout(() => {
      get().dismiss(id)
    }, props.duration)
    activeTimers.set(id, timer)
  }

  return id
}

dismiss: (id) => {
  // Clean up timer
  const timer = activeTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    activeTimers.delete(id)
  }

  set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  }))
}
```

#### Persistence Strategy

**No persistence** - Toasts are ephemeral and should not persist across sessions.

#### Usage Example

```typescript
// Any component
function SettingsView() {
  const show = useToastStore((state) => state.show)

  const handleSave = async () => {
    try {
      await saveSettings()
      show({
        variant: 'success',
        title: 'Settings Saved',
        message: 'Your preferences have been updated',
        duration: 3000 // Auto-dismiss after 3 seconds
      })
    } catch (error) {
      show({
        variant: 'error',
        title: 'Save Failed',
        message: error.message,
        duration: 0, // Persistent until manually dismissed
        action: {
          label: 'Retry',
          onClick: handleSave
        }
      })
    }
  }

  return <Button onClick={handleSave}>Save Settings</Button>
}
```

#### Global Integration

```typescript
// App.tsx - Root component
function App() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>

      {/* Global toast container */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
```

---

### 3. User Preferences Store

**File**: `src/renderer/src/stores/userPreferencesStore.ts`
**Purpose**: Persistent user settings across all application features

#### State Schema

```typescript
interface UserPreferencesState {
  // Reading Preferences
  preloadPages: number // 1-5, number of chapters to preload
  zoomLevel: number // 50-200, percentage
  readerMode: 'single' | 'double' | 'webtoon'
  readingDirection: 'ltr' | 'rtl'

  // Download Preferences
  simultaneousDownloads: number // 1-5, concurrent downloads
  downloadLocation: string // File path
  imageQuality: 'original' | 'high' | 'medium'
  saveMangaMetadata: boolean

  // UI Preferences
  enableAnimations: boolean
  sidebarCollapsed: boolean
  defaultTheme: 'light' | 'dark' | 'system'
  compactMode: boolean

  // Notification Preferences
  notifyDownloadComplete: boolean
  notifyChapterUpdates: boolean
  notifyErrors: boolean

  // Actions (individual setters)
  setPreloadPages: (pages: number) => void
  setZoomLevel: (level: number) => void
  setReaderMode: (mode: 'single' | 'double' | 'webtoon') => void
  setReadingDirection: (direction: 'ltr' | 'rtl') => void

  setSimultaneousDownloads: (count: number) => void
  setDownloadLocation: (location: string) => void
  setImageQuality: (quality: 'original' | 'high' | 'medium') => void
  setSaveMangaMetadata: (save: boolean) => void

  setEnableAnimations: (enable: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDefaultTheme: (theme: 'light' | 'dark' | 'system') => void
  setCompactMode: (compact: boolean) => void

  setNotifyDownloadComplete: (notify: boolean) => void
  setNotifyChapterUpdates: (notify: boolean) => void
  setNotifyErrors: (notify: boolean) => void

  // Actions (bulk updates)
  updateReadingPreferences: (preferences: Partial<ReadingPreferences>) => void
  updateDownloadPreferences: (preferences: Partial<DownloadPreferences>) => void
  updateUIPreferences: (preferences: Partial<UIPreferences>) => void
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void

  // Reset to defaults
  resetToDefaults: () => void
}
```

#### Default Values

```typescript
const defaultPreferences = {
  // Reading
  preloadPages: 2,
  zoomLevel: 100,
  readerMode: 'single' as const,
  readingDirection: 'ltr' as const,

  // Downloads
  simultaneousDownloads: 3,
  downloadLocation: '', // Set to Downloads folder on first run
  imageQuality: 'high' as const,
  saveMangaMetadata: true,

  // UI
  enableAnimations: true,
  sidebarCollapsed: false,
  defaultTheme: 'system' as const,
  compactMode: false,

  // Notifications
  notifyDownloadComplete: true,
  notifyChapterUpdates: true,
  notifyErrors: true
}
```

#### Validation Example

```typescript
setPreloadPages: (pages) =>
  set((state) => ({
    ...state,
    preloadPages: Math.max(1, Math.min(5, pages)) // Clamp to 1-5
  }))

setSimultaneousDownloads: (count) =>
  set((state) => ({
    ...state,
    simultaneousDownloads: Math.max(1, Math.min(5, count)) // Clamp to 1-5
  }))
```

#### Persistence Strategy

```typescript
persist(
  // Store implementation
  {
    name: 'dexreader-preferences'
    // Persist ALL preferences (no partialize needed)
  }
)
```

**Persisted**: All preferences
**Hydration**: Automatic on app start

#### Usage Example

```typescript
// SettingsView.tsx
function SettingsView() {
  const preloadPages = useUserPreferencesStore((state) => state.preloadPages)
  const setPreloadPages = useUserPreferencesStore((state) => state.setPreloadPages)

  const handlePreloadChange = (value: number) => {
    setPreloadPages(value)
    // Changes are automatically persisted to localStorage
  }

  return <Slider value={preloadPages} onChange={handlePreloadChange} min={1} max={5} />
}
```

#### Extensibility

This store is designed for easy expansion in future phases. When adding new settings:

1. Add properties to the relevant category in `types.ts`
2. Add default values to `defaultPreferences`
3. Add individual setter and/or bulk update support
4. Document new settings in this file

Example for future Phase 2 feature:

```typescript
// Add to ReadingPreferences
interface ReadingPreferences {
  // ...existing properties
  autoBookmark: boolean // NEW: Auto-bookmark on exit
}

// Add to defaults
const defaultPreferences = {
  // ...
  autoBookmark: true
}

// Add setter
setAutoBookmark: (enable) => set((state) => ({ ...state, autoBookmark: enable }))
```

---

### 4. Library Store

**File**: `src/renderer/src/stores/libraryStore.ts`
**Purpose**: Manage bookmarks and collections (Phase 3 implementation)

#### State Schema

```typescript
interface LibraryState {
  // Bookmarked manga IDs
  bookmarks: string[]

  // User-created collections
  collections: Collection[]

  // Bookmark actions
  addBookmark: (mangaId: string) => void
  removeBookmark: (mangaId: string) => void
  isBookmarked: (mangaId: string) => boolean

  // Collection actions
  addCollection: (name: string, description?: string) => void
  removeCollection: (collectionId: string) => void
  addToCollection: (collectionId: string, mangaId: string) => void
  removeFromCollection: (collectionId: string, mangaId: string) => void
}

interface Collection {
  id: string
  name: string
  description?: string
  mangaIds: string[]
  createdAt: number
}
```

#### Implementation Highlights

```typescript
// Duplicate prevention
addBookmark: (mangaId) =>
  set((state) => {
    if (state.bookmarks.includes(mangaId)) return state
    return { bookmarks: [...state.bookmarks, mangaId] }
  })

// Helper method
isBookmarked: (mangaId) => get().bookmarks.includes(mangaId)

// Collection ID generation
addCollection: (name, description) => {
  const collection: Collection = {
    id: `collection-${Date.now()}`,
    name,
    description,
    mangaIds: [],
    createdAt: Date.now()
  }
  set((state) => ({ collections: [...state.collections, collection] }))
}
```

#### Persistence Strategy

```typescript
persist(
  // Store implementation
  {
    name: 'dexreader-library'
    // Persist ALL library data
  }
)
```

**Status**: Implemented but not yet integrated into UI (awaiting Phase 3).

---

## Best Practices

### ✅ Do

#### 1. Use Selector Pattern

```typescript
// ✅ Good - Only re-renders when theme changes
const theme = useAppStore((state) => state.theme)
const setTheme = useAppStore((state) => state.setTheme)

// ❌ Bad - Re-renders on ANY store change
const store = useAppStore()
```

#### 2. Validate Input in Setters

```typescript
// ✅ Good - Clamped to valid range
setPreloadPages: (pages) =>
  set((state) => ({
    preloadPages: Math.max(1, Math.min(5, pages))
  }))

// ❌ Bad - No validation
setPreloadPages: (pages) => set({ preloadPages: pages })
```

#### 3. Clean Up Side Effects

```typescript
// ✅ Good - Timers cleaned up
dismiss: (id) => {
  const timer = activeTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    activeTimers.delete(id)
  }
  // ...
}

// ❌ Bad - Memory leak
dismiss: (id) => {
  // Timer keeps running
  set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}
```

#### 4. Use Partialize for Selective Persistence

```typescript
// ✅ Good - Only persist user preference
persist(
  // ...
  {
    name: 'dexreader-app',
    partialize: (state) => ({ themeMode: state.themeMode })
  }
)

// ❌ Bad - Persisting derived/ephemeral state
persist(
  // ...
  {
    name: 'dexreader-app'
    // Persists everything including computed `theme` and `systemTheme`
  }
)
```

#### 5. Keep Stores Focused

```typescript
// ✅ Good - Single responsibility
useAppStore // UI state only
useToastStore // Notifications only
useUserPreferencesStore // Settings only

// ❌ Bad - Mixed concerns
useAppStore // UI, toasts, settings, library all in one
```

### ❌ Don't

#### 1. Store Derived State

```typescript
// ❌ Bad - Storing computed value
interface AppState {
  themeMode: 'light' | 'dark' | 'system'
  systemTheme: 'light' | 'dark'
  computedTheme: 'light' | 'dark' // Don't store this!
}

// ✅ Good - Compute in selector or component
const theme = useAppStore((state) =>
  state.themeMode === 'system' ? state.systemTheme : state.themeMode
)
```

#### 2. Mutate State Directly

```typescript
// ❌ Bad - Direct mutation
addToast: (toast) => {
  get().toasts.push(toast) // Mutation!
  return get().toasts.length - 1
}

// ✅ Good - Immutable update
addToast: (toast) =>
  set((state) => ({
    toasts: [...state.toasts, toast]
  }))
```

#### 3. Forget Error Handling

```typescript
// ❌ Bad - No error handling
setDownloadLocation: (location) => set({ downloadLocation: location })

// ✅ Good - Validate before setting
setDownloadLocation: (location) => {
  if (!fs.existsSync(location)) {
    throw new Error('Invalid directory path')
  }
  set({ downloadLocation: location })
}
```

---

## Integration Patterns

### React Component Integration

```typescript
function Component() {
  // 1. Select only what you need
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  // 2. Use in JSX
  return (
    <div data-theme={theme}>
      <Button onClick={() => setTheme('dark')}>Dark Mode</Button>
    </div>
  )
}
```

### IPC Bridge Integration (Main Process Communication)

```typescript
function AppShell() {
  const setSystemTheme = useAppStore((state) => state.setSystemTheme)

  useEffect(() => {
    // Get initial theme from main process
    window.api.getTheme().then(setSystemTheme)

    // Subscribe to theme changes
    const unsubscribe = window.api.onThemeChanged(setSystemTheme)
    return unsubscribe
  }, [setSystemTheme])
}
```

### Bulk Updates Pattern

```typescript
function SettingsPanel() {
  const updateReadingPreferences = useUserPreferencesStore(
    (state) => state.updateReadingPreferences
  )

  const handleSubmit = (formData) => {
    // Update multiple settings at once
    updateReadingPreferences({
      preloadPages: formData.preload,
      zoomLevel: formData.zoom,
      readerMode: formData.mode
    })
  }
}
```

---

## Testing Strategy

### Unit Testing Stores

```typescript
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '@renderer/stores'

describe('appStore', () => {
  it('should calculate theme based on mode and system theme', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setSystemTheme('dark')
      result.current.setThemeMode('system')
    })

    expect(result.current.theme).toBe('dark')
  })
})
```

### Integration Testing with Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'

test('theme toggle updates store', async () => {
  render(<AppShell />)

  const button = screen.getByRole('button', { name: /dark mode/i })
  await userEvent.click(button)

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
})
```

---

## Performance Considerations

### Selector Optimization

Zustand automatically optimises selectors using shallow equality checks:

```typescript
// ✅ Efficient - Only re-renders when specific value changes
const theme = useAppStore((state) => state.theme)

// ✅ Also efficient - Zustand compares return value
const preferences = useUserPreferencesStore((state) => ({
  preload: state.preloadPages,
  zoom: state.zoomLevel
}))
```

### Avoiding Unnecessary Re-renders

```typescript
// ❌ Creates new object every render
const actions = useAppStore((state) => ({
  setTheme: state.setTheme,
  setFullscreen: state.setFullscreen
}))

// ✅ Select actions individually (they're stable references)
const setTheme = useAppStore((state) => state.setTheme)
const setFullscreen = useAppStore((state) => state.setFullscreen)
```

### Bundle Size Impact

- **Zustand**: ~1.4kb gzipped
- **All 4 stores**: ~3-4kb total (including types)
- **localStorage overhead**: Negligible (<1ms serialization)

---

## DevTools Integration

### Chrome DevTools Support

Install the **Zustand DevTools** extension:

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      // Store implementation
      {
        name: 'dexreader-app' // Shows up in DevTools
      }
    )
  )
)
```

**Note**: DevTools middleware should only be enabled in development builds.

---

## Migration Guide

### From useState to Zustand

**Before**:

```typescript
function Component() {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    setToasts((prev) => [...prev, toast])
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <>
      <Button onClick={() => addToast({ title: 'Hello' })}>Show Toast</Button>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}
```

**After**:

```typescript
// No local state needed!
function Component() {
  const show = useToastStore((state) => state.show)

  return <Button onClick={() => show({ title: 'Hello' })}>Show Toast</Button>
}

// Toast container in App.tsx (once, globally)
function App() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return <ToastContainer toasts={toasts} onDismiss={dismiss} />
}
```

**Benefits**:

- Global access (no prop drilling)
- Automatic persistence
- Reduced component complexity
- Testable in isolation

---

## Database Integration (Post-Migration)

### Progress Store

**File**: `src/renderer/src/stores/progressStore.ts`
**Purpose**: Frontend state management for manga/chapter progress
**Backend**: SQLite database via IPC handlers (see [database-architecture.md](./database-architecture.md))

#### State Schema

```typescript
interface ProgressState {
  // Lean progress map (for updates)
  progressMap: Map<string, MangaProgress>

  // Rich metadata map (for history view)
  progressMetadataMap: Map<string, MangaProgressMetadata>

  // Loading states
  isLoading: boolean
  lastFetched: Date | null

  // Actions
  loadAllProgress: () => Promise<void>
  saveProgress: (data: {
    mangaId: string
    chapterId: string
    currentPage: number
    completed: boolean
  }) => Promise<void>
  deleteProgress: (mangaId: string) => Promise<void>
  clearAllProgress: () => Promise<void>
}
```

**Architecture**: Dual-map pattern

- `progressMap`: Lean entities for mutations
- `progressMetadataMap`: Rich entities with JOINs for display

#### Database Types

```typescript
// Extracted from Window interface
type MangaProgress = Window['api']['Progress']['MangaProgress']
type MangaProgressMetadata = Window['api']['Progress']['MangaProgressMetadata']
type SaveProgressCommand = Parameters<Window['api']['progress']['saveProgress']>[0][0]
```

#### IPC Bridge

```typescript
// Preload types
interface ProgressAPI {
  getAllProgress: () => Promise<MangaProgress[]>
  getAllProgressWithMetadata: () => Promise<MangaProgressMetadata[]>
  saveProgress: (commands: SaveProgressCommand[]) => Promise<void>
  deleteProgress: (mangaId: string) => Promise<void>
  clearAllProgress: () => Promise<void>
}
```

**Backend**: Main process `MangaProgressRepository` (CQRS pattern)

### No Zustand Persistence for Progress

**Rationale**: Progress is stored in SQLite database (main process), not localStorage
**Pattern**: Always fetch from database on app start via `loadAllProgress()`
**Benefit**: Single source of truth, no synchronization issues

---

## Future Enhancements

### Planned for Phase 2

- **Download Queue Store**: Manage download jobs, progress tracking
- **Search Store**: Cache search results, recent searches

### Planned for Phase 3

- **Library Store**: Collections, bookmarks (backed by SQLite)
- **Sync Store**: Cloud synchronisation of bookmarks/progress
- **Offline Store**: Manage offline-available chapters
- **Statistics Store**: Reading stats, time tracking (backed by SQLite)

### Potential Optimisations

- **Worker Threads**: Move IPC-heavy operations to background thread
- **Partial Hydration**: Lazy-load non-critical stores
- **Optimistic Updates**: Update UI immediately, sync to DB in background

---

## Troubleshooting

### Store Not Persisting

**Symptom**: Changes don't persist across app restarts

**Solution**:

1. Check localStorage quota (5-10MB limit)
2. Verify `persist` middleware is applied
3. Check browser console for serialization errors
4. Ensure `name` property is unique

### Component Not Re-rendering

**Symptom**: UI doesn't update when store changes

**Solution**:

1. Use selector pattern: `useStore((state) => state.value)`
2. Check if selector returns stable reference
3. Verify action is calling `set()` correctly
4. Check React DevTools for component updates

### Memory Leaks

**Symptom**: Performance degrades over time

**Solution**:

1. Clean up timers in dismiss actions (toast store)
2. Remove event listeners in components
3. Check for circular references in store state
4. Profile with Chrome Memory Profiler

---

## References

- **Zustand Docs**: <https://docs.pmnd.rs/zustand>
- **Persist Middleware**: <https://docs.pmnd.rs/zustand/integrations/persisting-store-data>
- **TypeScript Guide**: <https://docs.pmnd.rs/zustand/guides/typescript>
- **DevTools**: <https://github.com/pmndrs/zustand-devtools>

---

_This document reflects the current state management architecture in DexReader Phase 1. Update as stores evolve and new patterns emerge._

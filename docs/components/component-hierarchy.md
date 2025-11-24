# DexReader Component Hierarchy

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document defines the complete React component hierarchy for DexReader's UI, including layout components, view components, and reusable UI primitives. All components use TypeScript and follow React 19 patterns.

---

## Component Tree

```
App (root)
└── ThemeProvider
    └── Router (React Router)
        └── AppShell
            ├── MenuBar (native Electron menu)
            ├── Sidebar
            │   ├── SidebarItem
            │   └── SidebarCollapseTrigger
            └── ViewContainer
                ├── BrowseView
                │   ├── SearchBar
                │   ├── FiltersPanel
                │   │   ├── TagFilter
                │   │   └── StatusFilter
                │   └── MangaGrid
                │       └── MangaCard
                │
                ├── LibraryView
                │   ├── LibraryToolbar
                │   │   ├── SortDropdown
                │   │   ├── FilterDropdown
                │   │   └── ViewModeToggle
                │   ├── CollectionsSidebar
                │   │   └── CollectionItem
                │   └── MangaGrid | MangaList
                │       └── MangaCard | MangaListItem
                │
                ├── MangaDetailView
                │   ├── MangaHeader
                │   │   ├── CoverImage
                │   │   ├── MangaInfo
                │   │   └── ActionButtons
                │   ├── MangaDescription
                │   ├── TagsList
                │   └── ChapterList
                │       └── ChapterItem
                │
                ├── ReaderView
                │   ├── ReaderTopBar (auto-hide)
                │   │   ├── BackButton
                │   │   ├── MangaTitle
                │   │   ├── ChapterDropdown
                │   │   └── MenuButton
                │   ├── ReaderCanvas
                │   │   └── PageRenderer
                │   ├── ReaderBottomBar (auto-hide)
                │   │   ├── PrevButton
                │   │   ├── PageIndicator
                │   │   ├── SettingsButton
                │   │   ├── ZoomButton
                │   │   └── NextButton
                │   └── ChapterListOverlay (on-demand)
                │       └── ChapterItem
                │
                ├── DownloadsView
                │   ├── DownloadsToolbar
                │   │   ├── PauseAllButton
                │   │   ├── ResumeAllButton
                │   │   └── ClearCompletedButton
                │   └── DownloadsList
                │       └── DownloadItem
                │           └── ProgressBar
                │
                └── SettingsView
                    ├── SettingsSidebar
                    │   └── SettingsSection
                    └── SettingsPanels
                        ├── GeneralSettings
                        ├── ReadingSettings
                        ├── DownloadSettings
                        ├── StorageSettings
                        └── AboutPanel
```

---

## Layout Components

### App

**Purpose**: Root component, provides global context

```typescript
interface AppProps {}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  )
}
```

**Responsibilities**:
- Initialize application
- Provide global contexts
- Set up router

---

### ThemeProvider

**Purpose**: Manages Windows 11 light/dark theme

```typescript
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Listen for system theme changes via IPC
    window.electron.ipcRenderer.on('theme-changed', (newTheme) => {
      setTheme(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**Responsibilities**:
- Sync with Windows system theme
- Provide theme context to children
- Apply theme to root element

---

### AppShell

**Purpose**: Main application layout wrapper

```typescript
interface AppShellProps {}

function AppShell(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Listen for sidebar toggle from menu bar
    window.electron.ipcRenderer.on('toggle-sidebar', () => {
      setSidebarCollapsed(prev => !prev)
    })
  }, [])

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <ViewContainer />
    </div>
  )
}
```

**CSS Classes**:
- `.app-shell` - Flexbox container
- `.app-shell--sidebar-collapsed` - When sidebar is collapsed

**Responsibilities**:
- Provide persistent layout structure
- Manage sidebar collapse state
- Render navigation and main content

---

### Sidebar

**Purpose**: Primary navigation sidebar

```typescript
interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

interface SidebarItemData {
  id: string
  label: string
  icon: string
  route: string
  shortcut?: string
}

const SIDEBAR_ITEMS: SidebarItemData[] = [
  { id: 'browse', label: 'Browse', icon: 'search', route: '/browse', shortcut: 'Ctrl+1' },
  { id: 'library', label: 'Library', icon: 'bookmarks', route: '/library', shortcut: 'Ctrl+2' },
  { id: 'downloads', label: 'Downloads', icon: 'download', route: '/downloads', shortcut: 'Ctrl+3' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings', shortcut: 'Ctrl+,' }
]

function Sidebar({ collapsed, onToggle }: SidebarProps): React.JSX.Element {
  const location = useLocation()

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {SIDEBAR_ITEMS.map(item => (
        <SidebarItem
          key={item.id}
          {...item}
          active={location.pathname.startsWith(item.route)}
          collapsed={collapsed}
        />
      ))}
    </nav>
  )
}
```

**CSS Classes**:
- `.sidebar` - Base styles with Acrylic blur
- `.sidebar--collapsed` - Collapsed state (48px width)

**Responsibilities**:
- Render navigation items
- Highlight active view
- Handle collapse/expand

---

### SidebarItem

**Purpose**: Individual navigation item

```typescript
interface SidebarItemProps {
  id: string
  label: string
  icon: string
  route: string
  shortcut?: string
  active: boolean
  collapsed: boolean
}

function SidebarItem({ label, icon, route, active, collapsed }: SidebarItemProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <button
      className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
      onClick={() => navigate(route)}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-item__icon">{icon}</span>
      {!collapsed && <span className="sidebar-item__label">{label}</span>}
    </button>
  )
}
```

**CSS Classes**:
- `.sidebar-item` - Base button styles
- `.sidebar-item--active` - Active state (accent color background)
- `.sidebar-item__icon` - Icon container
- `.sidebar-item__label` - Text label (hidden when collapsed)

**Responsibilities**:
- Navigate to route on click
- Show active state
- Show tooltip when collapsed

---

### ViewContainer

**Purpose**: Container for routed views

```typescript
interface ViewContainerProps {}

function ViewContainer(): React.JSX.Element {
  return (
    <main className="view-container">
      <Routes>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowseView />} />
        <Route path="/browse/:mangaId" element={<MangaDetailView />} />
        <Route path="/library" element={<LibraryView />} />
        <Route path="/library/:collection" element={<LibraryView />} />
        <Route path="/reader/:mangaId/:chapterId" element={<ReaderView />} />
        <Route path="/downloads" element={<DownloadsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/settings/:section" element={<SettingsView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </main>
  )
}
```

**CSS Classes**:
- `.view-container` - Flex grow, scrollable

**Responsibilities**:
- Render current route
- Provide scrollable container
- Handle 404 routes

---

## View Components

### BrowseView

**Purpose**: Manga search and discovery

```typescript
interface BrowseViewProps {}

function BrowseView(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<MangaFilters>({})
  const [mangaList, setMangaList] = useState<Manga[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch manga on mount and when search/filters change
  useEffect(() => {
    fetchManga(searchQuery, filters).then(setMangaList).finally(() => setLoading(false))
  }, [searchQuery, filters])

  return (
    <div className="browse-view">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FiltersPanel filters={filters} onChange={setFilters} />
      {loading ? <MangaGridSkeleton /> : <MangaGrid manga={mangaList} />}
    </div>
  )
}
```

**CSS Classes**:
- `.browse-view` - View container with padding

**Responsibilities**:
- Manage search query and filters
- Fetch manga from API
- Render search UI and results grid

---

### LibraryView

**Purpose**: User's personal manga library

```typescript
interface LibraryViewProps {}

function LibraryView(): React.JSX.Element {
  const { collection } = useParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'lastRead' | 'title' | 'dateAdded'>('lastRead')
  const [library, setLibrary] = useState<LibraryManga[]>([])

  // Fetch library data filtered by collection
  useEffect(() => {
    fetchLibrary(collection).then(setLibrary)
  }, [collection])

  const sortedLibrary = useMemo(() => sortLibrary(library, sortBy), [library, sortBy])

  return (
    <div className="library-view">
      <LibraryToolbar
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <div className="library-view__content">
        <CollectionsSidebar activeCollection={collection} />
        {viewMode === 'grid' ? (
          <MangaGrid manga={sortedLibrary} />
        ) : (
          <MangaList manga={sortedLibrary} />
        )}
      </div>
    </div>
  )
}
```

**CSS Classes**:
- `.library-view` - View container
- `.library-view__content` - Flexbox for collections sidebar + manga grid/list

**Responsibilities**:
- Manage library state (sorting, view mode)
- Filter by collection
- Render library UI

---

### MangaDetailView

**Purpose**: Detailed manga information and chapter list

```typescript
interface MangaDetailViewProps {}

function MangaDetailView(): React.JSX.Element {
  const { mangaId } = useParams()
  const [manga, setManga] = useState<MangaDetail | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMangaDetail(mangaId!),
      fetchMangaChapters(mangaId!)
    ]).then(([mangaData, chaptersData]) => {
      setManga(mangaData)
      setChapters(chaptersData)
    }).finally(() => setLoading(false))
  }, [mangaId])

  if (loading) return <MangaDetailSkeleton />
  if (!manga) return <NotFoundView />

  return (
    <div className="manga-detail-view">
      <MangaHeader manga={manga} />
      <MangaDescription text={manga.description} />
      <TagsList tags={manga.tags} />
      <ChapterList chapters={chapters} mangaId={mangaId!} />
    </div>
  )
}
```

**CSS Classes**:
- `.manga-detail-view` - Scrollable container

**Responsibilities**:
- Fetch manga details and chapters
- Render manga information
- Provide chapter navigation

---

### ReaderView

**Purpose**: Fullscreen manga reading experience

```typescript
interface ReaderViewProps {}

function ReaderView(): React.JSX.Element {
  const { mangaId, chapterId } = useParams()
  const [pages, setPages] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [readingMode, setReadingMode] = useState<'single' | 'double' | 'vertical'>('single')
  const [controlsVisible, setControlsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  // Fetch chapter images
  useEffect(() => {
    fetchChapterPages(chapterId!).then(setPages).finally(() => setLoading(false))
  }, [chapterId])

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => setControlsVisible(false), 3000)
    const showControls = () => {
      setControlsVisible(true)
      clearTimeout(timer)
    }
    window.addEventListener('mousemove', showControls)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', showControls)
    }
  }, [controlsVisible])

  if (loading) return <LoadingSpinner />

  return (
    <div className="reader-view">
      {controlsVisible && (
        <ReaderTopBar mangaId={mangaId!} chapterId={chapterId!} />
      )}
      <ReaderCanvas
        pages={pages}
        currentPage={currentPage}
        readingMode={readingMode}
        onPageChange={setCurrentPage}
      />
      {controlsVisible && (
        <ReaderBottomBar
          currentPage={currentPage}
          totalPages={pages.length}
          readingMode={readingMode}
          onReadingModeChange={setReadingMode}
          onPrevPage={() => setCurrentPage(p => Math.max(0, p - 1))}
          onNextPage={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
        />
      )}
    </div>
  )
}
```

**CSS Classes**:
- `.reader-view` - Fullscreen black background

**Responsibilities**:
- Fetch and display manga pages
- Manage reading mode and page navigation
- Handle control bar auto-hide

---

### DownloadsView

**Purpose**: Manage download queue and completed downloads

```typescript
interface DownloadsViewProps {}

function DownloadsView(): React.JSX.Element {
  const [downloads, setDownloads] = useState<Download[]>([])

  useEffect(() => {
    // Subscribe to download updates via IPC
    window.electron.ipcRenderer.on('download-updated', (download) => {
      setDownloads(prev => updateDownload(prev, download))
    })
  }, [])

  const activeDownloads = downloads.filter(d => d.status === 'downloading')
  const completedDownloads = downloads.filter(d => d.status === 'completed')

  return (
    <div className="downloads-view">
      <DownloadsToolbar
        onPauseAll={() => window.electron.ipcRenderer.send('pause-all-downloads')}
        onResumeAll={() => window.electron.ipcRenderer.send('resume-all-downloads')}
        onClearCompleted={() => setDownloads(activeDownloads)}
      />
      <div className="downloads-view__list">
        <h2>Active Downloads ({activeDownloads.length})</h2>
        <DownloadsList downloads={activeDownloads} />

        <h2>Completed ({completedDownloads.length})</h2>
        <DownloadsList downloads={completedDownloads} />
      </div>
    </div>
  )
}
```

**CSS Classes**:
- `.downloads-view` - View container
- `.downloads-view__list` - Download list sections

**Responsibilities**:
- Display download queue
- Show progress for each download
- Provide download controls

---

### SettingsView

**Purpose**: Application configuration

```typescript
interface SettingsViewProps {}

function SettingsView(): React.JSX.Element {
  const { section = 'general' } = useParams()
  const [settings, setSettings] = useState<AppSettings>({})

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveSettings(newSettings) // Auto-save
  }

  return (
    <div className="settings-view">
      <SettingsSidebar activeSection={section} />
      <div className="settings-view__panels">
        {section === 'general' && <GeneralSettings settings={settings} onChange={updateSetting} />}
        {section === 'reading' && <ReadingSettings settings={settings} onChange={updateSetting} />}
        {section === 'download' && <DownloadSettings settings={settings} onChange={updateSetting} />}
        {section === 'storage' && <StorageSettings settings={settings} onChange={updateSetting} />}
        {section === 'about' && <AboutPanel />}
      </div>
    </div>
  )
}
```

**CSS Classes**:
- `.settings-view` - Flex container
- `.settings-view__panels` - Panels area

**Responsibilities**:
- Load and save settings
- Render settings panels
- Auto-save on change

---

## Reusable UI Components

### MangaCard

**Purpose**: Display manga cover and info in grids

```typescript
interface MangaCardProps {
  manga: Manga
  onClick?: () => void
  showProgress?: boolean
}

function MangaCard({ manga, onClick, showProgress }: MangaCardProps): React.JSX.Element {
  return (
    <div className="manga-card" onClick={onClick}>
      <div className="manga-card__cover">
        <img src={manga.coverUrl} alt={manga.title} />
        {showProgress && <ProgressBadge progress={manga.readProgress} />}
      </div>
      <div className="manga-card__info">
        <h3 className="manga-card__title">{manga.title}</h3>
        <p className="manga-card__subtitle">{manga.latestChapter}</p>
      </div>
    </div>
  )
}
```

**CSS Classes**:
- `.manga-card` - Card container with hover effect
- `.manga-card__cover` - Cover image container (2:3 aspect ratio)
- `.manga-card__info` - Text info below cover

**Responsibilities**:
- Display manga cover image
- Show title and latest chapter
- Handle click events

---

### SearchBar

**Purpose**: Search input with icon

```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function SearchBar({ value, onChange, placeholder = 'Search manga...' }: SearchBarProps): React.JSX.Element {
  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-bar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button className="search-bar__icon">
        <SearchIcon />
      </button>
    </div>
  )
}
```

**CSS Classes**:
- `.search-bar` - Container with border
- `.search-bar__input` - Text input
- `.search-bar__icon` - Search icon button

**Responsibilities**:
- Controlled input
- Trigger search on change

---

### ProgressBar

**Purpose**: Horizontal progress indicator

```typescript
interface ProgressBarProps {
  progress: number // 0-100
  height?: 'compact' | 'normal'
  showLabel?: boolean
}

function ProgressBar({ progress, height = 'normal', showLabel }: ProgressBarProps): React.JSX.Element {
  return (
    <div className={`progress-bar progress-bar--${height}`}>
      <div
        className="progress-bar__fill"
        style={{ width: `${progress}%` }}
      />
      {showLabel && <span className="progress-bar__label">{progress}%</span>}
    </div>
  )
}
```

**CSS Classes**:
- `.progress-bar` - Container
- `.progress-bar--compact` - 4px height
- `.progress-bar--normal` - 6px height
- `.progress-bar__fill` - Accent color fill

**Responsibilities**:
- Display progress visually
- Optionally show percentage

---

### ProgressRing

**Purpose**: Circular progress indicator

```typescript
interface ProgressRingProps {
  progress?: number // 0-100, undefined for indeterminate
  size?: 'sm' | 'md' | 'lg'
}

function ProgressRing({ progress, size = 'md' }: ProgressRingProps): React.JSX.Element {
  const radius = size === 'sm' ? 12 : size === 'md' ? 24 : 32
  const circumference = 2 * Math.PI * radius
  const offset = progress !== undefined
    ? circumference - (progress / 100) * circumference
    : 0

  return (
    <svg className={`progress-ring progress-ring--${size}`} viewBox="0 0 64 64">
      <circle
        className="progress-ring__track"
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--win-bg-elevated)"
        strokeWidth="3"
      />
      <circle
        className={`progress-ring__fill ${progress === undefined ? 'progress-ring__fill--indeterminate' : ''}`}
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--win-accent)"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}
```

**CSS Classes**:
- `.progress-ring` - SVG container
- `.progress-ring__fill--indeterminate` - Spinning animation

**Responsibilities**:
- Display circular progress
- Support indeterminate mode (spinning)

---

### LoadingSkeleton

**Purpose**: Placeholder for loading content

```typescript
interface LoadingSkeletonProps {
  width?: string
  height?: string
  variant?: 'text' | 'rect' | 'circle'
}

function LoadingSkeleton({ width = '100%', height = '20px', variant = 'rect' }: LoadingSkeletonProps): React.JSX.Element {
  return (
    <div
      className={`skeleton skeleton--${variant}`}
      style={{ width, height }}
    />
  )
}
```

**CSS Classes**:
- `.skeleton` - Base with shimmer animation
- `.skeleton--rect` - Rectangle (8px border radius)
- `.skeleton--circle` - Circle (50% border radius)

**Responsibilities**:
- Show loading placeholder
- Animate shimmer effect

---

### Toast

**Purpose**: Temporary notification overlay

```typescript
interface ToastProps {
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss: () => void
  duration?: number // Auto-dismiss in ms
}

function Toast({ type, message, action, onDismiss, duration = 5000 }: ToastProps): React.JSX.Element {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast__message">{message}</span>
      {action && (
        <button className="toast__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <button className="toast__close" onClick={onDismiss}>×</button>
    </div>
  )
}
```

**CSS Classes**:
- `.toast` - Acrylic blur container
- `.toast--error` - Red border
- `.toast--warning` - Orange border
- `.toast--success` - Green border
- `.toast--info` - Blue border

**Responsibilities**:
- Display notification
- Auto-dismiss after duration
- Provide action button

---

## Component File Structure

```
src/renderer/src/
├── App.tsx
├── main.tsx
├── layouts/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── SidebarItem.tsx
│   └── ViewContainer.tsx
├── views/
│   ├── BrowseView.tsx
│   ├── LibraryView.tsx
│   ├── MangaDetailView.tsx
│   ├── ReaderView.tsx
│   ├── DownloadsView.tsx
│   ├── SettingsView.tsx
│   └── NotFoundView.tsx
├── components/
│   ├── common/
│   │   ├── SearchBar.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── Toast.tsx
│   ├── manga/
│   │   ├── MangaCard.tsx
│   │   ├── MangaGrid.tsx
│   │   ├── MangaList.tsx
│   │   ├── MangaListItem.tsx
│   │   ├── MangaHeader.tsx
│   │   └── ChapterList.tsx
│   ├── reader/
│   │   ├── ReaderCanvas.tsx
│   │   ├── ReaderTopBar.tsx
│   │   ├── ReaderBottomBar.tsx
│   │   └── PageRenderer.tsx
│   ├── library/
│   │   ├── LibraryToolbar.tsx
│   │   ├── CollectionsSidebar.tsx
│   │   └── CollectionItem.tsx
│   ├── downloads/
│   │   ├── DownloadsList.tsx
│   │   ├── DownloadItem.tsx
│   │   └── DownloadsToolbar.tsx
│   └── settings/
│       ├── SettingsSidebar.tsx
│       ├── GeneralSettings.tsx
│       ├── ReadingSettings.tsx
│       ├── DownloadSettings.tsx
│       ├── StorageSettings.tsx
│       └── AboutPanel.tsx
├── contexts/
│   └── ThemeContext.tsx
├── hooks/
│   ├── useTheme.ts
│   ├── useSettings.ts
│   └── useLibrary.ts
└── types/
    ├── manga.ts
    ├── library.ts
    ├── download.ts
    └── settings.ts
```

---

## Component Communication Patterns

### Props Down, Events Up

**Pattern**: Parent components pass data down as props, children emit events up via callbacks

```typescript
// Parent
function BrowseView() {
  const [searchQuery, setSearchQuery] = useState('')
  return <SearchBar value={searchQuery} onChange={setSearchQuery} />
}

// Child
function SearchBar({ value, onChange }: SearchBarProps) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />
}
```

### Context for Global State

**Pattern**: Use React Context for theme, settings, library

```typescript
// Provider
<ThemeContext.Provider value={{ theme, toggleTheme }}>
  {children}
</ThemeContext.Provider>

// Consumer
const { theme } = useContext(ThemeContext)
```

### IPC for Main Process Communication

**Pattern**: Use Electron IPC for native operations

```typescript
// Renderer → Main
window.electron.ipcRenderer.send('download-chapter', { mangaId, chapterId })

// Main → Renderer
window.electron.ipcRenderer.on('download-updated', (download) => {
  updateDownload(download)
})
```

---

## TypeScript Interfaces

### Core Types

```typescript
// types/manga.ts
interface Manga {
  id: string
  title: string
  coverUrl: string
  latestChapter: string
  tags: string[]
}

interface MangaDetail extends Manga {
  description: string
  author: string
  artist: string
  status: 'ongoing' | 'completed' | 'hiatus'
  chapters: Chapter[]
}

interface Chapter {
  id: string
  title: string
  number: string
  publishedAt: Date
  pages: number
}

// types/library.ts
interface LibraryManga extends Manga {
  readProgress: number // 0-100
  lastRead: Date
  collections: string[]
}

interface Collection {
  id: string
  name: string
  icon?: string
  mangaCount: number
}

// types/download.ts
interface Download {
  id: string
  mangaId: string
  chapterId: string
  title: string
  status: 'downloading' | 'paused' | 'completed' | 'error'
  progress: number
  speed?: string
  eta?: string
  totalSize?: string
}

// types/settings.ts
interface AppSettings {
  theme: 'system' | 'light' | 'dark'
  language: string
  checkUpdatesOnStartup: boolean
  readingMode: 'single' | 'double' | 'vertical'
  readingDirection: 'rtl' | 'ltr'
  imageFit: 'height' | 'width' | 'original'
  preloadPages: number
  downloadsPath: string
  imageQuality: 'original' | 'high' | 'medium' | 'low'
  simultaneousDownloads: number
}
```

---

## Performance Optimizations

### Lazy Loading

```typescript
// Lazy load heavy components
const ReaderView = lazy(() => import('./views/ReaderView'))
const MangaDetailView = lazy(() => import('./views/MangaDetailView'))

// Wrap in Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <ReaderView />
</Suspense>
```

### Memoization

```typescript
// Memoize expensive computations
const sortedManga = useMemo(() => {
  return sortManga(library, sortBy)
}, [library, sortBy])

// Memoize callbacks to prevent re-renders
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### Virtual Scrolling (Future)

When library exceeds 500+ items, implement virtualization:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function MangaGrid({ manga }: MangaGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: manga.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5
  })

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <MangaCard key={virtualRow.index} manga={manga[virtualRow.index]} />
        ))}
      </div>
    </div>
  )
}
```

---

## Summary

DexReader's component hierarchy provides:

✅ **Clear Structure**: Organized by layout, views, and reusable components
✅ **Type Safety**: Full TypeScript interfaces for props and data
✅ **Separation of Concerns**: Layout, business logic, and UI separated
✅ **Reusability**: Common components (MangaCard, ProgressBar) used across views
✅ **Scalability**: Easy to add new views and components
✅ **Performance**: Lazy loading, memoization, virtualization ready

**Review Status**: ✅ Ready for routing implementation (Step 3)

---

*Component hierarchy created: 24 November 2025*
*Part of P1-T01 deliverables*

# DexReader Routing Decision

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Decision Summary

**Selected**: React Router v6.28.0
**Rationale**: Industry standard, excellent TypeScript support, comprehensive features, active maintenance, perfect fit for DexReader's needs

---

## Evaluation Criteria

| Criterion          | Weight | Importance                          |
| ------------------ | ------ | ----------------------------------- |
| TypeScript Support | High   | Type safety across routing          |
| Bundle Size        | Medium | Desktop app, less critical than web |
| Feature Set        | High   | Nested routes, guards, params       |
| Learning Curve     | Medium | Team familiarity, documentation     |
| Maintenance        | High   | Active development, security        |
| Community          | Medium | Support, examples, ecosystem        |

---

## Evaluated Options

### Option 1: React Router v6 ✅ **SELECTED**

**Version**: 6.28.0
**Bundle Size**: ~11KB (gzipped)
**TypeScript**: ⭐⭐⭐⭐⭐ Excellent (first-class support)

**Pros**:

- Industry standard with massive adoption
- Comprehensive TypeScript definitions
- Nested routes support
- Route guards and loaders
- Excellent documentation
- Active maintenance
- Future-proof (v6 stable)
- Works seamlessly with Electron

**Cons**:

- Slightly larger bundle than alternatives
- Some v5→v6 breaking changes (not relevant for new project)

**Code Example**:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowseView />} />
        <Route path="/browse/:mangaId" element={<MangaDetailView />} />
        <Route path="/reader/:mangaId/:chapterId" element={<ReaderView />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**Score**: 9/10

---

### Option 2: TanStack Router

**Version**: Latest (4.x)
**Bundle Size**: ~15KB (gzipped)
**TypeScript**: ⭐⭐⭐⭐⭐ Excellent (type-safe by design)

**Pros**:

- Type-safe routing (autocomplete for paths)
- Built-in data loading
- Modern API design
- Excellent performance

**Cons**:

- Newer library (less battle-tested)
- Smaller community
- More complex setup
- Overkill for DexReader's needs

**Score**: 7/10

---

### Option 3: Wouter

**Version**: Latest (3.x)
**Bundle Size**: ~2KB (gzipped)
**TypeScript**: ⭐⭐⭐⭐ Good (TypeScript support)

**Pros**:

- Extremely lightweight
- Simple API
- Minimalist approach
- Fast performance

**Cons**:

- Limited features (no nested routes)
- No route guards
- Small community
- Missing advanced features needed for DexReader

**Score**: 5/10

---

### Option 4: Custom Solution (Hash-based)

**Bundle Size**: 0KB (no dependency)
**TypeScript**: ⭐⭐⭐ Moderate (manual typing)

**Pros**:

- No dependencies
- Full control
- Can be tailored exactly to needs

**Cons**:

- Significant development time
- Need to maintain routing code
- Reinventing the wheel
- Missing ecosystem benefits

**Score**: 3/10

---

## Selected Solution: React Router v6

### Installation

```bash
npm install react-router-dom@6.28.0
npm install --save-dev @types/react-router-dom@5.3.3
```

### Route Configuration

```typescript
// src/renderer/src/App.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import './assets/windows11-tokens.css'
import './assets/base.css'
import './assets/main.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </StrictMode>
)
```

```typescript
// src/renderer/src/layouts/ViewContainer.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import BrowseView from '../views/BrowseView'
import LibraryView from '../views/LibraryView'
import MangaDetailView from '../views/MangaDetailView'
import ReaderView from '../views/ReaderView'
import DownloadsView from '../views/DownloadsView'
import SettingsView from '../views/SettingsView'
import NotFoundView from '../views/NotFoundView'

function ViewContainer(): React.JSX.Element {
  return (
    <main className="view-container">
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/browse" replace />} />

        {/* Browse & Manga Detail */}
        <Route path="/browse" element={<BrowseView />} />
        <Route path="/browse/:mangaId" element={<MangaDetailView />} />

        {/* Library */}
        <Route path="/library" element={<LibraryView />} />
        <Route path="/library/:collection" element={<LibraryView />} />

        {/* Reader */}
        <Route path="/reader/:mangaId/:chapterId" element={<ReaderView />} />

        {/* Downloads */}
        <Route path="/downloads" element={<DownloadsView />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsView />}>
          <Route path=":section" element={<SettingsView />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </main>
  )
}

export default ViewContainer
```

---

## Route Structure

### Primary Routes

| Path                          | Component            | Params                 | Description                 |
| ----------------------------- | -------------------- | ---------------------- | --------------------------- |
| `/`                           | Navigate → `/browse` | -                      | Default landing (redirects) |
| `/browse`                     | BrowseView           | -                      | Manga search and browse     |
| `/browse/:mangaId`            | MangaDetailView      | `mangaId`              | Manga detail page           |
| `/library`                    | LibraryView          | -                      | User library (all manga)    |
| `/library/:collection`        | LibraryView          | `collection`           | Filtered library view       |
| `/reader/:mangaId/:chapterId` | ReaderView           | `mangaId`, `chapterId` | Reading view                |
| `/downloads`                  | DownloadsView        | -                      | Download queue              |
| `/settings`                   | SettingsView         | -                      | General settings            |
| `/settings/:section`          | SettingsView         | `section`              | Specific settings section   |
| `*`                           | NotFoundView         | -                      | 404 page                    |

### Query Parameters

**Browse View**:

- `?q=search+term` - Search query
- `?tags=action,adventure` - Tag filters
- `?status=ongoing` - Status filter

**Example**:

```ui
/browse?q=one+piece&tags=action,adventure&status=ongoing
```

---

## Navigation Patterns

### Programmatic Navigation

```typescript
import { useNavigate } from 'react-router-dom'

function MangaCard({ manga }: MangaCardProps) {
  const navigate = useNavigate()

  return (
    <div onClick={() => navigate(`/browse/${manga.id}`)}>
      {/* Card content */}
    </div>
  )
}
```

### Link Navigation

```typescript
import { Link } from 'react-router-dom'

function ChapterList({ chapters, mangaId }: ChapterListProps) {
  return (
    <ul>
      {chapters.map(chapter => (
        <li key={chapter.id}>
          <Link to={`/reader/${mangaId}/${chapter.id}`}>
            {chapter.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}
```

### Back Navigation

```typescript
import { useNavigate } from 'react-router-dom'

function ReaderTopBar() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(-1)}>
      ← Back
    </button>
  )
}
```

---

## Route Parameters & Hooks

### useParams

**Get route parameters**:

```typescript
import { useParams } from 'react-router-dom'

function MangaDetailView() {
  const { mangaId } = useParams()

  useEffect(() => {
    fetchMangaDetail(mangaId!)
  }, [mangaId])
}
```

### useLocation

**Access current location**:

```typescript
import { useLocation } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()

  return (
    <nav>
      <SidebarItem active={location.pathname === '/browse'} />
    </nav>
  )
}
```

### useSearchParams

**Query string management**:

```typescript
import { useSearchParams } from 'react-router-dom'

function BrowseView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const updateSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery })
  }
}
```

### useNavigate

**Programmatic navigation**:

```typescript
import { useNavigate } from 'react-router-dom'

function LoginButton() {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate('/library')}>
      Go to Library
    </button>
  )
}
```

---

## Route Guards (Future)

For protected routes (if authentication added later):

```typescript
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Usage
<Route
  path="/library"
  element={
    <ProtectedRoute>
      <LibraryView />
    </ProtectedRoute>
  }
/>
```

---

## Scroll Restoration

**Automatic scroll restoration**:

```typescript
import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  )
}
```

**Custom scroll behavior** (preserve scroll for specific views):

```typescript
const scrollPositions = new Map<string, number>()

function useScrollRestoration() {
  const location = useLocation()
  const viewContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Restore scroll position
    const savedPosition = scrollPositions.get(location.pathname)
    if (savedPosition && viewContainer.current) {
      viewContainer.current.scrollTop = savedPosition
    }

    // Save scroll position on unmount
    return () => {
      if (viewContainer.current) {
        scrollPositions.set(location.pathname, viewContainer.current.scrollTop)
      }
    }
  }, [location.pathname])

  return viewContainer
}
```

---

## Error Handling

### 404 Not Found

```typescript
function NotFoundView(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="not-found-view">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/browse')}>
        Go to Browse
      </button>
    </div>
  )
}
```

### Invalid Manga ID

```typescript
function MangaDetailView(): React.JSX.Element {
  const { mangaId } = useParams()
  const [manga, setManga] = useState<MangaDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMangaDetail(mangaId!)
      .then(setManga)
      .catch(err => setError('Manga not found'))
  }, [mangaId])

  if (error) {
    return (
      <div className="manga-detail-error">
        <h2>Manga Not Found</h2>
        <p>This manga doesn't exist or has been removed.</p>
        <Link to="/browse">Back to Browse</Link>
      </div>
    )
  }

  // Rest of component...
}
```

---

## IPC Integration

**Menu bar navigation via IPC**:

```typescript
// Main process (src/main/index.ts)
Menu.buildFromTemplate([
  {
    label: 'View',
    submenu: [
      {
        label: 'Browse Manga',
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          mainWindow.webContents.send('navigate', '/browse')
        }
      }
    ]
  }
])

// Renderer (src/renderer/src/App.tsx)
import { useNavigate } from 'react-router-dom'

function useMenuNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (route: string) => {
      navigate(route)
    }

    window.electron.ipcRenderer.on('navigate', handler)

    return () => {
      window.electron.ipcRenderer.off('navigate', handler)
    }
  }, [navigate])
}
```

---

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

// Lazy load heavy views
const ReaderView = lazy(() => import('../views/ReaderView'))
const MangaDetailView = lazy(() => import('../views/MangaDetailView'))

function ViewContainer() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/reader/:mangaId/:chapterId" element={<ReaderView />} />
        <Route path="/browse/:mangaId" element={<MangaDetailView />} />
      </Routes>
    </Suspense>
  )
}
```

---

## TypeScript Types

```typescript
// Route parameter types
type RouteParams = {
  '/browse/:mangaId': { mangaId: string }
  '/library/:collection': { collection: string }
  '/reader/:mangaId/:chapterId': { mangaId: string; chapterId: string }
  '/settings/:section': { section: SettingsSection }
}

type SettingsSection = 'general' | 'reading' | 'download' | 'storage' | 'about'

// Typed navigation helper
function useTypedNavigate() {
  const navigate = useNavigate()

  return <Path extends keyof RouteParams>(path: Path, params: RouteParams[Path]) => {
    let url = path as string
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, value as string)
    }
    navigate(url)
  }
}

// Usage
const typedNavigate = useTypedNavigate()
typedNavigate('/reader/:mangaId/:chapterId', {
  mangaId: 'abc123',
  chapterId: 'xyz789'
})
```

---

## Migration Notes (Future)

If we need to switch routing libraries later:

**React Router → TanStack Router**:

- Similar API structure
- Need to rewrite route definitions
- Add type generation setup
- Migration guide available

**React Router → Custom**:

- Preserve URL structure
- Rewrite navigation hooks
- Add history management
- More work, but feasible

---

## Summary

React Router v6 selected because:

✅ **Industry Standard**: Proven reliability in production
✅ **TypeScript First-Class**: Excellent type definitions
✅ **Feature Complete**: All needed features (nested routes, params, guards)
✅ **Well Documented**: Extensive docs and examples
✅ **Active Maintenance**: Regular updates and security patches
✅ **Electron Compatible**: Works seamlessly in Electron renderer
✅ **Future Proof**: v6 is stable, long-term support expected

**Review Status**: ✅ Ready for implementation

---

_Routing decision made: 24 November 2025_
_Part of P1-T01 deliverables_

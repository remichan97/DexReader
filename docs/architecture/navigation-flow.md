# DexReader Navigation Flow

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document defines how users navigate between different views in DexReader, including route transitions, back navigation behavior, and state preservation.

---

## Primary Navigation Routes

### Route Hierarchy

```ui
/                       → Browse View (default)
/browse                 → Browse View (explicit)
/browse/:mangaId        → Manga Detail View
/library                → Library View
/library/:collection    → Filtered Library View (specific collection)
/reader/:mangaId/:chapterId  → Reader View
/downloads              → Downloads View
/settings               → Settings View
/settings/:section      → Settings View (specific section)
```

### Navigation Graph

```ui
                    ┌──────────────┐
                    │ Browse View  │ ← Default landing page
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌──────────────┐  ┌─────────┐  ┌──────────────┐
    │Manga Detail  │  │ Library │  │  Downloads   │
    │     View     │  │  View   │  │     View     │
    └──────┬───────┘  └────┬────┘  └──────────────┘
           │               │
           └───────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │ Reader View  │ ← Fullscreen
            └──────────────┘

         ┌──────────────┐
         │Settings View │ ← Accessible from anywhere
         └──────────────┘
```

---

## Navigation Mechanisms

### 1. Sidebar Navigation

**Primary Views**:

- Browse (Ctrl+1)
- Library (Ctrl+2)
- Downloads (Ctrl+3)
- Settings (Ctrl+,)

**Behavior**:

- Single click navigates to view
- Active view highlighted with accent color background
- State preserved when switching views (scroll position, filters, etc.)

### 2. Menu Bar Navigation

**Complete menu structure** (see navigation-specification.md for full details):

- **File**: Settings, Exit
- **View**: Browse (Ctrl+1), Library (Ctrl+2), Downloads (Ctrl+3), Toggle Sidebar (Ctrl+B)
- **Library**: Add to Favorites, Create Collection, Import/Export
- **Tools**: Download operations, Clear cache
- **Help**: Documentation, About

**Behavior**:

- Keyboard accessible (Alt+F, Alt+V, etc.)
- Context-aware items enabled/disabled based on current view

### 3. In-Content Navigation

**Browse View**:

- Click manga card → Manga Detail View
- Search input → Updates Browse View (same route, query param)

**Library View**:

- Click collection → Filtered Library View
- Click manga card → Manga Detail View

**Manga Detail View**:

- Click chapter → Reader View
- "Add to Library" button → Adds to favorites, stays on detail
- "Download" button → Opens Downloads view (or shows modal)

**Reader View**:

- Previous/Next buttons → Navigate chapters (same manga)
- Back button (top-left) → Returns to previous view
- Chapter dropdown → Jumps to different chapter (same manga)

---

## State Management During Navigation

### Preserved State

**Browse View**:

- Search query
- Active filters
- Scroll position
- Grid layout mode

**Library View**:

- Selected collection
- Sort order
- View mode (grid/list)
- Scroll position

**Reader View**:

- Current page within chapter
- Zoom level
- Reading mode (single/double/vertical)
- Control bar visibility state

**Settings View**:

- Active settings section

### Cleared State

- Reader view state clears when exiting to Browse/Library
- Search results clear when navigating away from Browse (unless bookmarked)
- Temporary modal states (dialogs, overlays)

---

## Back Navigation Behavior

### Browser-Style History

DexReader maintains navigation history similar to web browsers:

```ui
User Flow Example:
Browse → Manga Detail (A) → Reader (A, Ch.1) → [Back] → Manga Detail (A) → [Back] → Browse
```

**Implementation**:

- React Router's `useNavigate()` with `navigate(-1)` for back
- Electron's window back button (optional)
- Keyboard shortcut: Alt+Left (back), Alt+Right (forward)

### Context-Specific Back Behavior

**From Reader View**:

- Back button → Returns to the view that opened the reader
  - If opened from Browse → Returns to Manga Detail
  - If opened from Library → Returns to Library
  - If opened from "Continue Reading" → Returns to Library

**From Manga Detail**:

- Back button → Returns to previous view (Browse or Library)

**From Settings**:

- Back navigation not applicable (use sidebar/menu to leave)

---

## Deep Linking

### URL Structure

All views are URL-addressable for:

- Bookmarking
- Sharing (future)
- Direct navigation

**Examples**:

```ui
dexreader://browse
dexreader://browse?q=one+piece&tags=action,adventure
dexreader://browse/abc123-manga-id
dexreader://library
dexreader://library/favorites
dexreader://reader/abc123-manga-id/xyz789-chapter-id
dexreader://downloads
dexreader://settings
dexreader://settings/reading
```

### State Restoration from URL

- Browse with search query → Executes search on load
- Reader with chapter ID → Loads chapter, resumes from last page (if available)
- Library with collection → Opens collection view

---

## Navigation Keyboard Shortcuts

### Global Shortcuts (Work from Any View)

| Shortcut  | Action                |
| --------- | --------------------- |
| Ctrl+1    | Navigate to Browse    |
| Ctrl+2    | Navigate to Library   |
| Ctrl+3    | Navigate to Downloads |
| Ctrl+,    | Navigate to Settings  |
| Ctrl+B    | Toggle Sidebar        |
| F11       | Toggle Fullscreen     |
| Alt+Left  | Back in history       |
| Alt+Right | Forward in history    |
| Ctrl+R    | Reload current view   |

### View-Specific Shortcuts

**Reader View**:

| Shortcut        | Action                              |
| --------------- | ----------------------------------- |
| Left Arrow / A  | Previous page/chapter               |
| Right Arrow / D | Next page/chapter                   |
| Space           | Next page                           |
| Shift+Space     | Previous page                       |
| Escape          | Exit reader (back to previous view) |
| F               | Toggle fullscreen                   |
| M               | Show chapter menu overlay           |

**Browse/Library Views**:

| Shortcut | Action                             |
| -------- | ---------------------------------- |
| Ctrl+F   | Focus search input                 |
| Ctrl+D   | Add current manga to favorites     |
| Enter    | Open selected manga (when focused) |

---

## Navigation Transitions

### Route Change Animations

**Standard View Transitions**:

- **Fade**: 150ms for view switches (Browse ↔ Library ↔ Downloads ↔ Settings)
- **Slide**: Reader enters from right, exits to left (300ms)
- **Instant**: No animation for same-view updates (filter changes, collection switches)

### Loading States During Navigation

**Immediate Navigation**:

- Browse → Library: Instant (all local data)
- Library → Settings: Instant (all local data)
- Settings → Downloads: Instant (all local data)

**Network-Dependent Navigation**:

- Browse → Manga Detail: Show skeleton screen while loading details
- Manga Detail → Reader: Show progress ring while loading chapter images
- Browse with search: Show skeleton cards while API responds

---

## Navigation State Persistence

### Session Persistence (In-Memory)

**Preserved During App Session**:

- Navigation history stack
- View-specific scroll positions
- Active filters and search queries
- Temporary selections (multi-select, etc.)

### Disk Persistence (Across App Restarts)

**Saved to Database**:

- Last viewed route (restore on app launch)
- Reading progress (reader position, chapter)
- User preferences (settings)
- Library state (bookmarks, collections)

**Not Saved**:

- Browse view search queries
- Temporary filter states
- Download progress (resets on restart)

---

## Edge Cases & Error Handling

### Invalid Routes

**Scenario**: User navigates to non-existent manga ID
**Behavior**:

- Show error page with "Manga not found"
- Provide "Back to Browse" button
- Log error for debugging

**Example**:

```ui
/browse/invalid-id-12345  → Error View
                            "This manga could not be found."
                            [Back to Browse]
```

### Network Errors During Navigation

**Scenario**: Manga detail page fails to load
**Behavior**:

- Show error banner with retry button
- Keep user on current view (don't navigate away)
- Allow offline navigation if data cached

### Reader Exit Without Saving

**Scenario**: User exits reader before page loads
**Behavior**:

- Save last known page position
- No warning dialog (auto-save)

---

## Navigation Patterns by User Intent

### Discovery Flow (New User)

```ui
Launch App → Browse View → Search/Filter → Manga Detail → Reader
                                              ↓
                                         [Add to Library]
                                              ↓
                                         Library View
```

### Reading Flow (Returning User)

```ui
Launch App → Library View → "Continue Reading" → Reader
                 ↓
            Collection View → Manga Detail → Reader
```

### Download Flow

```ui
Browse/Library → Manga Detail → [Download Button] → Downloads View
                                                         ↓
                                                    [Monitor Progress]
                                                         ↓
                                                    [Read Offline]
                                                         ↓
                                                    Offline Reader
```

### Settings Flow

```ui
Any View → Settings (Ctrl+,) → Adjust preferences → [Auto-save] → Back to original view
```

---

## Multi-Window Navigation (Future Consideration)

**Current**: Single window application
**Future**: Multiple reader windows for comparing chapters

**Proposed Behavior**:

- Ctrl+N: Open new window (Browse view)
- Each window has independent navigation history
- Shared state: Library, settings, downloads
- Independent state: Reading progress per window

---

## Navigation Accessibility

### Screen Reader Announcements

- Route changes announce new view name
- Focus moves to main content on navigation
- Skip links provided for keyboard users

### Keyboard Focus Management

**On Navigation**:

1. Focus moves to first interactive element in new view
2. Or, focus moves to main heading (H1)
3. User can Tab through content naturally

**Example**:

```ui
Browse → Library:
  Focus moves to "Sort by" dropdown (first interactive element)

Library → Reader:
  Focus moves to "Previous Page" button
```

---

## Navigation Analytics (Future)

**Metrics to Track** (when analytics added):

- Most common navigation paths
- Average time in each view
- Back button usage frequency
- Dead ends (routes user abandons)

**Use Cases**:

- Optimize default view based on usage
- Identify confusing navigation patterns
- Improve UX based on data

---

## Implementation Notes

### React Router Configuration

**Recommended Router Setup**:

```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<BrowseView />} />
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
</BrowserRouter>
```

### State Management for Navigation

**Local Component State**:

- View-specific UI state (scroll, filters)
- Managed via `useState` or `useReducer`

**Global Application State** (when state library added):

- User library (bookmarks, collections)
- Reading progress
- Application settings
- Download queue

**URL State**:

- Search queries (query params)
- Selected collections (route params)
- Current manga/chapter (route params)

---

## Summary

DexReader's navigation system provides:

✅ **Clear Primary Navigation**: Sidebar + menu bar for all primary views
✅ **Intuitive Back Behavior**: Browser-style history with context awareness
✅ **Keyboard Accessible**: Comprehensive shortcuts for power users
✅ **State Preservation**: Views remember their state across navigation
✅ **Deep Linkable**: All views addressable via URL
✅ **Error Resilient**: Graceful handling of invalid routes and network errors
✅ **Accessible**: Screen reader friendly with proper focus management

**Review Status**: ✅ Ready for routing implementation (Step 3)

---

_Navigation flow created: 24 November 2025_
_Part of P1-T01 deliverables_

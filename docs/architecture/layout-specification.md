# DexReader Layout Specification

**Created**: 24 November 2025
**Updated**: 14 October 2026 (rewritten to describe the implemented layout, as of v1.16.0)

---

## Overview

This document describes the structural layout of DexReader: the application shell, the sidebar, the main content area and how each view uses it. The first version of this document was a design-phase wireframe (a 240px sidebar, a "Tools" menu, a Library collections sidebar, a 5-column grid); the app that shipped differs in several places, so this version reflects the code. For breakpoints and window-resize behaviour see [`design/responsive-behavior-guide.md`](../design/responsive-behavior-guide.md). The reader has its own document: [`reader-layout-specification.md`](./reader-layout-specification.md).

---

## Application Shell

### Structure

Every view except the Reader is rendered inside `AppShell` (`src/renderer/src/layouts/AppShell.tsx`):

```ui
┌──────────────────────────────────────────────────────────────┐
│ Native menu bar (File, View, Library, Help)                  │  ← Electron, OS-drawn
├──────────────────────────────────────────────────────────────┤
│ Update notification / update banner (when relevant)          │
│ Offline status bar (when offline)                            │  ← AppShell, full width
│ Incognito status bar (when incognito)                        │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                     │
│Sidebar │  <main id="main-content">                           │
│ 80px   │  Active view (scrolls vertically)                   │
│        │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

`AppShell` is a full-height column (`.app-shell`, `height: 100vh`, `overflow: hidden`). The status bars are stacked above a row (`.app-shell__body`) that holds the sidebar and the main content. Only one scroll container exists: `.app-shell__content` (`overflow-y: auto`, `overflow-x: hidden`, `--win-bg-base` background).

The Reader route (`/reader/:mangaId/:chapterId`) is rendered **outside** `AppShell` (see `App.tsx`), so it has no sidebar, no status bars and uses the full window.

### Layout Zones

**Native menu bar**

- Menus: **File, View, Library, Help** (built in `src/main/menu/`; there is no Tools menu)
- Drawn by the OS; there is no custom title bar. See [`menu-bar-structure.md`](./menu-bar-structure.md)
- `autoHideMenuBar` is `false`, so it is always visible

**Status bars (top of the shell)**

- `UpdateNotification` and `UpdateBanner`: app update progress and the "new version" banner
- `OfflineStatusBar`: shown for `offline-user` and `offline-no-internet` connectivity states
- `IncognitoStatusBar`: shown while incognito mode is on
- All are Fluent 2 `MessageBar`-based banners; they render nothing when not applicable, so the sidebar and content simply move up

**Navigation sidebar** - see [Sidebar](#sidebar)

**Main content area**

- Fills the remaining space and scrolls vertically
- Each view supplies its own padding and maximum width (see the table below)
- A "Skip to main content" link (`.skip-link`, targets `#main-content`) is the first focusable element

---

## Window

- **Initial size**: 900 × 670 px
- **Minimum size**: none is set in `createWindow()`, so the OS limits apply. The earlier 400 × 300 minimum was never implemented; the layout is designed for roughly 700px and wider and has no sidebar-collapse breakpoint
- **Resizable / maximisable**: yes

### Layout calculation

```ui
Main content width = window width - sidebar width
                   = 900px - 80px     (full sidebar)
                   = 820px

Grid columns at 820px, 24px padding each side, 180px minimum card, 16px gap:
  floor((772 + 16) / (180 + 16)) = 4 columns
```

---

## Sidebar

`src/renderer/src/components/Sidebar/` - a DexReader component (not a Fluent wrapper).

### Items

| Order | Item      | Route        | Icon (Regular inactive / Filled active) |
| ----- | --------- | ------------ | --------------------------------------- |
| 1     | Browse    | `/browse`    | Search                                  |
| 2     | Library   | `/library`   | Library                                 |
| 3     | History   | `/history`   | History                                 |
| 4     | Downloads | `/downloads` | Arrow download                          |
| 5     | Settings  | `/settings`  | Settings                                |

An item is active when the path equals its route or starts with `route + '/'`, so `/browse/:mangaId` keeps Browse active.

### Display modes

The user chooses the mode in Settings → Appearance (`appearance.sidebarSize`: `full`, `compact` or `auto-hide`). It is applied through `useSidebarStore`.

| Mode        | Width                          | Item height | Labels                        | Behaviour                                                                          |
| ----------- | ------------------------------ | ----------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `full`      | 80px                           | 72px        | Shown under the icon          | Default. The active item hides its label and shows the filled icon                 |
| `compact`   | 60px                           | 60px        | Hidden (tooltip on hover)     | Icons only                                                                         |
| `auto-hide` | 8px strip, 80px on hover/focus | 72px        | Fade in with the expanded bar | Collapses to a thin strip with an accent hint; expands on hover or `:focus-within` |

The width is fixed per mode; the sidebar does **not** collapse automatically when the window is resized.

### Properties

- **Background**: `--win-bg-card`, with a 1px right border (`--win-border-default`); no acrylic
- **Active indicator**: a 3px accent bar at the left edge that slides between items (0.4s, spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`); it is repositioned when the route or display mode changes
- **Active item**: `--win-accent-subtle` background and accent text/icon
- **Hover / pressed**: `--win-bg-hover` / `--win-bg-active`, with a small scale-down on press
- **Tooltips**: each item shows a right-hand Fluent tooltip (300ms delay, `relationship="label"`)
- **Landmark**: `<nav>` labelled "Main navigation"; items are `role="button"` and respond to Enter and Space

---

## Routes and Views

| Route                              | View              | In AppShell | Notes                                         |
| ---------------------------------- | ----------------- | ----------- | --------------------------------------------- |
| `/`                                | -                 | -           | Redirects to the configured startup route     |
| `/browse`                          | `BrowseView`      | Yes         | Search, filters (dialog), infinite grid       |
| `/browse/:mangaId`                 | `MangaDetailView` | Yes         | Keeps Browse highlighted in the sidebar       |
| `/creator/:creatorType/:creatorId` | `CreatorView`     | Yes         | Works by an author or artist                  |
| `/library`                         | `LibraryView`     | Yes         | Search plus collection tabs                   |
| `/history`                         | `HistoryView`     | Yes         | Chronological reading history with a calendar |
| `/downloads`                       | `DownloadsView`   | Yes         | Downloads grouped by manga                    |
| `/settings`                        | `SettingsView`    | Yes         | One scrolling page of sections                |
| `/reader/:mangaId/:chapterId`      | `ReaderView`      | **No**      | Full-window reader                            |
| `*`                                | `NotFoundView`    | Yes         |                                               |

Every route is wrapped in an `ErrorBoundary level="page"`, and `AppRoutes` wraps the routes in `ViewTransition`, keyed by pathname (and by a single `reader` key for reader routes), so views remount with a short fade/slide on navigation.

Every view includes a visually hidden `<h1>` (`.sr-only`) for screen readers, and views that load results announce them through an `aria-live` status region.

---

## View Layouts

All views use the 4px spacing scale (`--space-*`). Typical view padding is `--space-6` (24px).

### Browse (`/browse`)

```ui
┌──────────────────────────────────────────────┐
│ SearchBar (with filter button)               │
│ Active-filter InfoBar (sticky once the       │
│   search bar has scrolled out of view)       │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│ │card│ │card│ │card│ │card│   MangaCard grid │
│ └────┘ └────┘ └────┘ └────┘                  │
│ … infinite scroll sentinel / load-more state │
└──────────────────────────────────────────────┘
```

- Padding: 24px
- The search bar scrolls with the page. Once it leaves the viewport (`useStickyFilterBar`, an `IntersectionObserver`), the active-filter `InfoBar` appears and sticks to the top (the bar is `position: sticky`), so applied filters stay visible and editable
- Filters open in a **Modal** containing `FilterPanel` (draft values with an Apply button), not an inline panel; an `InfoBar` summarises applied filters with Edit and Reset actions
- Grid: `repeat(auto-fill, minmax(180px, 1fr))`, 16px gap
- Loading: `SkeletonGrid` (20 cards); more results load automatically through an `IntersectionObserver` sentinel (`useInfiniteScroll`); there is a retry state when loading more fails
- Empty and error states use `EmptyState` and a retryable error block

### Library (`/library`)

- Padding: 24px
- A row with the `SearchBar` (supports `status:`, `tag:`, `author:`, `year:` style queries, with an expandable syntax-help box) and a "create collection" button
- Active-filter chips beneath the search row
- **Collections are tabs** (`Tabs`): "All" plus one tab per collection, each with a count badge and a hover menu (`CollectionContextMenu`) for edit and delete. This replaces the originally planned 200px collections sidebar
- Grid: same `auto-fill` / 180px / 16px grid as Browse; loading shows `LoadingState variant="skeleton"`; empty states are per context (empty library, empty collection, no search results)

### History (`/history`)

- A flex column: a **stats strip** (manga, chapters, pages and estimated minutes read), a **schedule header** (date label, calendar popover and search), then the content
- Content is grouped into dated sections; each section has a sticky date header and a list of `HistoryEventCard`s (12px gap)
- A calendar (7-column grid, shown in a `Popover` so it floats over the feed) lets the user jump to a day, and the search field toggles open from the same header; the content area scrolls to the top when the date changes
- Loading and empty states use `LoadingState` / `EmptyState`

### Downloads (`/downloads`)

- Padding 24px, centred, `max-width: 1200px`
- A controls row (search, filter and sort selects), a stats row (badges and bulk actions), then **groups per manga**
- Each group is a collapsible card (chevron, manga title link, counts) containing `DownloadCard`s with the chapter, size/queue info and a `ProgressBar`; failed items show their error inline
- Loading: `LoadingState`; error: `ErrorState` with retry; empty: `EmptyState`

### Settings (`/settings`)

- **One scrolling page**, not a sidebar of panels. A sticky `SettingsHeader` (`z-index: 100`) holds a section menu: a Fluent `Menu` that jumps to a section and highlights the one in view (`useScrollSpy`); deep links use search params
- Content is centred with `max-width: 800px` and 24px side padding
- Sections are stacked with a top border and 24px vertical padding: Appearance, Language, Reader, Downloads, Performance (with Cache management), Storage, Restore points, Security, Advanced (with Logging and the Danger zone)
- Settings autosave; some changes show a restart-required banner

### Manga Detail (`/browse/:mangaId`)

- A column with a **sticky back bar** (`z-index: 10`) that also shows the manga title once the hero scrolls out of view (`useStickyTitle`)
- Hero: cover (200px column) beside the title, creators, status/demographic/rating metadata, actions and tags; stacks on narrow widths
- Below: description, alternative titles, external links, then the chapter list with its controls

### Creator (`/creator/...`)

- Header with a back button and the creator name, then a `MangaCard` grid
- Grid: `minmax(160px, 1fr)`, reducing to 140px (≤768px) and 120px (≤480px)

### Reader (`/reader/...`)

Rendered full window without the shell. See [`reader-layout-specification.md`](./reader-layout-specification.md) for the header, page areas, reading modes and chapter sidebar.

---

## Sizing and Spacing

### Spacing

Tokens are defined in `src/renderer/src/assets/tokens.css`:

| Token       | Value | Typical use                         |
| ----------- | ----- | ----------------------------------- |
| `--space-1` | 4px   | Icon-to-text gaps                   |
| `--space-2` | 8px   | Small gaps, compact padding         |
| `--space-3` | 12px  | Component internal spacing          |
| `--space-4` | 16px  | Grid gap, section gaps              |
| `--space-6` | 24px  | View padding, major section spacing |
| `--space-8` | 32px  | Large separations                   |

Layouts mostly use the utility classes (`p-6`, `mb-4`, `gap-3`, `flex`) documented in [`utility-classes.md`](../components/utility-classes.md).

### Content widths

- Settings content: `max-width: 800px`, centred
- Downloads: `max-width: 1200px`, centred
- Browse, Library and Creator fill the available width
- Error blocks: `max-width: 500-600px`

### Cover aspect ratio

Covers use a 2:3 `aspect-ratio` with `object-fit: cover`, so cards reserve their space before the image loads.

---

## Layering (z-index)

`tokens.css` defines a z-index scale (`--z-sidebar: 10`, `--z-dropdown: 100`, `--z-modal: 1000`, `--z-toast: 2000`), but most components use literal values, and Fluent manages the stacking of its own dialogs, popovers and menus. The layers in use:

| Layer                                                                        | z-index            |
| ---------------------------------------------------------------------------- | ------------------ |
| MangaCard badges and overlays, sidebar indicator, history sticky date header | 1                  |
| Manga Detail sticky back bar, reader page navigation indicator               | 10                 |
| Settings header, reader header, zoom indicator and end-of-chapter overlay    | 100                |
| Reader chapter list overlay and sidebar                                      | 200-201            |
| Toast container, app-level error fallback                                    | 9999               |
| Gatekeeper unlock screen                                                     | 10000              |
| Skip link (when focused)                                                     | `--z-toast` (2000) |
| Native menu bar                                                              | OS-controlled      |

---

## Scrolling

- **One scroll container** for the shell: `.app-shell__content`. Browse, Library, History, Downloads, Settings and Manga Detail all scroll inside it (History scrolls its own content element for the date jump)
- **Sticky elements** are the Browse filter `InfoBar`, the Settings header, the Manga Detail back bar and the history date headers
- **No scroll restoration.** Views remount on navigation, so returning to a view starts at the top; Library and History expose scroll-to-top controls
- **Reader**: single and double page modes have no document scroll (navigation by page); vertical mode scrolls continuously

---

## Accessibility Layout Features

- **Skip link**: "Skip to main content" targets `#main-content`; it is hidden until focused. (The text is currently hard-coded in English; there is no separate "skip to navigation" link.)
- **Landmarks**: `<nav aria-label="Main navigation">` for the sidebar, `<main id="main-content">` for the view, a `<header>` for the Settings header
- **Headings**: each view has a visually hidden `<h1>`
- **Live regions**: Browse and Library announce result changes through an `aria-live="polite"` status element; the toast container is `aria-live="polite"`
- **Focus**: Fluent components provide their own focus indicators; DexReader's own components (sidebar items, manga cards) draw a 2px `:focus-visible` outline

---

## Implementation Notes

### Manga grids

```css
.browse-view__manga-grid,
.library__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
}
```

The column count is a function of the width, not a breakpoint, so the grid reflows continuously as the window is resized.

### Shell

```tsx
<div className="app-shell flex flex-col">
  {/* skip link, update/offline/incognito bars */}
  <div className="app-shell__body flex flex-1">
    <Sidebar />
    <main className="app-shell__content" id="main-content">
      {children}
    </main>
  </div>
</div>
```

### Performance

- **No list virtualisation.** Browse loads pages on demand through an infinite-scroll sentinel and Library renders its collection directly; virtualisation (for example `@tanstack/react-virtual`) would be the next step if very large libraries become slow
- **Layout shift**: skeleton placeholders (`SkeletonGrid`) and the 2:3 cover ratio keep the grid stable while images load

---

## Summary

- **One shell, one scroll container**: status bars, an 80px-wide (configurable) sidebar and a scrolling main area; the Reader opts out
- **Fluid grids** rather than fixed column counts
- **Modal filters, tabbed collections, a single scrolling settings page**: the shapes that replaced the wireframe's inline panels and sidebars
- **Semantic structure**: skip link, `nav`, `main`, hidden headings and live regions

# DexReader Navigation Flow

**Created**: 24 November 2025
**Updated**: 14 October 2026 (rewritten to describe the implemented navigation, as of v1.16.1)

---

## Overview

This document describes how users move between views in DexReader: the routes, the ways of triggering navigation, how Back works, what state survives a navigation and what happens on invalid routes. The original version of this document was a design-phase plan; parts of it (deep links, a forward/back shortcut, a Tools menu, a multi-window mode, analytics) were never built and are no longer described. The layout of each view is covered in [`layout-specification.md`](./layout-specification.md).

---

## Routes

The renderer uses React Router's `HashRouter` (the app is loaded from a file, so URLs look like `#/browse`). Routes are declared in `src/renderer/src/router.tsx`:

| Route                              | View              | Notes                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------- |
| `/`                                | -                 | Redirects to the startup route (see below)                    |
| `/browse`                          | `BrowseView`      | Search and discovery. Accepts `?tag=<tagId>`                  |
| `/browse/:mangaId`                 | `MangaDetailView` | Manga detail. Sidebar keeps Browse highlighted                |
| `/creator/:creatorType/:creatorId` | `CreatorView`     | Works by an author or artist                                  |
| `/library`                         | `LibraryView`     | Favourites and collections (collections are tabs, not routes) |
| `/history`                         | `HistoryView`     | Chronological reading history                                 |
| `/downloads`                       | `DownloadsView`   | Downloaded chapters grouped by manga                          |
| `/settings`                        | `SettingsView`    | One scrolling page. Accepts `?section=<sectionId>`            |
| `/reader/:mangaId/:chapterId`      | `ReaderView`      | Full window, no sidebar                                       |
| `*`                                | `NotFoundView`    | Shows a native dialog, then redirects to Browse               |

There are no `/library/:collection` or `/settings/:section` routes; the selected collection is tab state, and the settings section is the `section` query parameter.

### Startup route

The first route comes from Settings → Appearance → Startup page (`appearance.startupPage`): `browse` (default), `library` or `downloads`. It is read by `useStartupRoute`. The app does **not** restore the last viewed route. If the app lock (Gatekeeper) is enabled, the unlock screen is shown first.

### Navigation graph

```ui
                 ┌────────────┐
 startup page ──▶│   Browse   │◀────────────────────────────┐
                 └─────┬──────┘                             │
                       │ card                               │ Back (default)
   ┌───────────┬───────┼─────────┬────────────┐             │
   ▼           ▼       ▼         ▼            ▼             │
Library     History  Downloads  Creator ──▶ Manga Detail ───┘
   │           │         │                    │  ▲
   └──card─────┴─────────┴──────── card ──────┘  │ Back
                                    │            │
                                    ▼            │
                             ┌────────────┐      │
        chapter / Continue ─▶│   Reader   │──────┘
                             └────────────┘

Settings is reachable from anywhere (sidebar, File menu, Ctrl+,).
```

Manga Detail can be entered from Browse, Library, History, Downloads and Creator, and the Reader from Manga Detail, History and Downloads (resuming from the saved page where there is one).

---

## Ways to Navigate

### Sidebar

Browse, Library, History, Downloads and Settings (see the sidebar section of the layout specification). A click or Enter/Space navigates; the active item is the one whose route matches the current path or is its parent.

### Menu bar and shortcuts

The native menu (File, View, Library, Help) sends a `navigate` message to the renderer for the View items, and the renderer also listens for the same navigation shortcuts in `useKeyboardShortcuts`. The full structure is in [`menu-bar-structure.md`](./menu-bar-structure.md); the navigation-related accelerators are:

| Shortcut | Action                      | Handled by                       |
| -------- | --------------------------- | -------------------------------- |
| Ctrl+1   | Browse                      | Menu accelerator and key handler |
| Ctrl+2   | Library                     | Menu accelerator and key handler |
| Ctrl+3   | Downloads                   | Menu accelerator and key handler |
| Ctrl+4   | Reading History             | Menu accelerator                 |
| Ctrl+,   | Settings                    | Menu accelerator and key handler |
| Ctrl+/   | Show the keyboard shortcuts | Key handler (opens the dialog)   |
| F11      | Toggle fullscreen           | Menu accelerator                 |
| Ctrl+R   | Reload                      | Menu accelerator                 |

The in-app shortcuts dialog (`KeyboardShortcutsDialog`) lists every shortcut, including the library and reader ones, and is the user-facing source of truth. There is no Alt+Left / Alt+Right history shortcut.

### Secure navigation (Settings)

Navigating to `/settings` goes through `useSecureNavigate`. When the app lock is enabled and "require passphrase for settings" is on, the user is asked to re-authenticate first (`GatekeeperReauthModal`); otherwise navigation proceeds normally. The sidebar, the Ctrl+, shortcut and the menu all use this path.

### In-content links

- **Browse**: a card opens Manga Detail; applying filters stays on the route. `?tag=<tagId>` (used by tag chips on the detail page) resets the filters, applies only that tag and runs the search
- **Library**: a card opens Manga Detail; collection tabs switch in place
- **History**: an event opens the Reader for that chapter (resuming at the stored page); the empty state links to Browse
- **Downloads**: a chapter opens the Reader (offline, with the stored start page); a group's manga title opens Manga Detail. Both record the origin
- **Manga Detail**: a chapter or the hero's Continue button opens the Reader; author and artist links open the Creator view; tag chips open Browse filtered by that tag
- **Reader**: previous/next chapter, the chapter list and Back (see below)

---

## Back Navigation

Back is **origin-aware** rather than browser-history based. `src/renderer/src/utils/navigationOrigin.ts` records where the user came from in React Router `location.state` (`{ from: '/library' }`):

1. A view that links to a manga's detail page attaches the origin (`originFrom(location)`)
2. Manga Detail reads it with `getOrigin(location.state)`; **Back goes to the origin, or to `/browse` if there is none**
3. Manga Detail forwards the origin to the Reader when opening a chapter
4. The Reader's Back returns to `/browse/:mangaId` and hands the origin back, so Back from the detail page again lands on the original view

Example: Library → Manga Detail → Reader → Back → Manga Detail → Back → **Library** (not Browse).

Other cases:

- **Reader**: Back button or Escape. Escape closes the chapter list if it is open, otherwise acts as Back. With no manga ID the reader falls back to `navigate(-1)`
- **Creator**: Back uses `navigate(-1)`
- **Settings, Library, History, Downloads, Browse**: top-level views with no Back button; use the sidebar or menu

---

## State During Navigation

Views are unmounted when you leave them (`ViewTransition` is keyed by pathname), so component state is lost; what survives lives in stores, the database or the settings file.

| Area     | Survives navigation                                                                     | Does not                                                 |
| -------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Browse   | Query, filters, results and pagination (they live in the in-memory `searchStore`)       | Scroll position; the filter dialog's unapplied draft     |
| Library  | Favourites and collections (database); the "include downloaded" toggle (`localStorage`) | Selected collection tab (resets to All); scroll position |
| History  | Reading events (database); the selected calendar date (in `historyStore`)               | Search text, viewed month and scroll position            |
| Settings | Every setting (autosaved to `settings.json`)                                            | Scroll position; the section is re-read from `?section=` |
| Reader   | Reading progress and per-chapter resume page (database); reader preferences (settings)  | Transient UI such as open overlays and the zoom level    |

There is **no scroll restoration** anywhere. Across app restarts the app restores settings, the library, history, progress and downloads, but not the last viewed route or any search.

---

## Deep Linking

There are no external deep links: DexReader does not register a custom protocol, and there is no way to open it at a specific manga from outside. Hash URLs are used only internally. Two query parameters are meaningful:

- `/browse?tag=<tagId>`: apply a single tag filter and search
- `/settings?section=<sectionId>`: scroll to a settings section on load. While the user scrolls, the settings page keeps the parameter in sync with the section in view (scroll spy)

---

## Transitions and Loading

- **Route change**: `ViewTransition` plays a 300ms fade-in with an 8px upward slide on the incoming view; reader routes share one key so moving between chapters does not replay it. `prefers-reduced-motion` disables it. The earlier plan for a directional reader slide and a 150ms fade was not implemented
- **Local data views** (Library, History, Downloads, Settings) render as soon as their store data is available, with `LoadingState` while it loads
- **Network views**: Browse shows a `SkeletonGrid`, Manga Detail shows skeleton placeholders, and the Reader shows a `ProgressRing`-based loading state while the chapter loads. See [`loading-feedback-states.md`](../components/loading-feedback-states.md)
- **Window title**: `AppShell` sets the document title for the main views (for example "Library - DexReader"); Manga Detail and the Reader set their own

---

## Invalid Routes and Errors

| Situation                                   | Behaviour                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Unknown route (`*`)                         | `NotFoundView` shows a blocking native dialog (once), then navigates to `/browse` whatever the answer   |
| Manga cannot be loaded (network or offline) | Manga Detail shows an in-view error panel (with Back); the user is not navigated away                   |
| Manga not found                             | Manga Detail shows a "Manga Not Found" panel with Back and a "Back to Browse" button                    |
| Chapter fails to load                       | The Reader shows an `ErrorState` with retry                                                             |
| Render error in a view                      | The route's `ErrorBoundary level="page"` shows a fallback inside the shell, so the sidebar stays usable |
| Leaving the Reader early                    | Progress is saved as the user reads; there is no "unsaved" prompt                                       |

---

## Common Flows

```ui
Discovery:   Startup page → Browse → search/filter → Manga Detail → favourite ─▶ Library
Reading:     Library / History / Downloads → Manga Detail or Reader (Continue) → Back to origin
Offline:     Offline mode (File menu) → Library / Downloads → Reader using local chapters
Settings:    Any view → Settings (Ctrl+,, may require passphrase) → autosave → sidebar to leave
```

---

## Accessibility

- Every view has a visually hidden `<h1>`, and the shell provides a "Skip to main content" link and a labelled `<nav>`
- Result updates in Browse and Library are announced through an `aria-live` region
- The app does not move focus programmatically on route change; focus stays where the activation happened until the new view takes it

---

## Implementation Notes

- **Router**: `HashRouter` in `App.tsx`; `AppRoutes` in `router.tsx` wraps the routes in `ViewTransition` and each in `ErrorBoundary level="page"`
- **Shell**: the Reader route renders outside `AppShell`
- **Origin helpers**: `utils/navigationOrigin.ts` (`originFrom`, `forwardOrigin`, `getOrigin`)
- **Gatekeeper-aware navigation**: `useSecureNavigate` / `useSecureNavigation` and `SecureNavigationProvider`
- **Shortcuts**: `hooks/useKeyboardShortcuts.ts` for the renderer, `src/main/menu/*.menu.ts` for menu accelerators

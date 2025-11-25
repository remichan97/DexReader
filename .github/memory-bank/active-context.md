# DexReader Active Context

**Last Updated**: 25 November 2025
**Current Phase**: Phase 1 - Core Architecture (In Progress)
**Session**: P1-T02 Complete

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 1 - Core Architecture ✅
**Progress**: P1-T02 Implementation Complete - Navigation System Active
**Current Date**: 25 November 2025

### ✅ Completed This Session (25 Nov 2025)

**P1-T02 EXECUTION COMPLETE** - Menu bar and navigation system implemented:

1. **Native Electron Menu Bar**: 5 menus (File, View, Library, Tools, Help) with 30+ menu items, keyboard accelerators (Ctrl+1/2/3, F11, F12, etc.)
2. **System Theme Detection**: Automatic light/dark theme switching based on Windows theme using `nativeTheme` API
3. **Windows 11 Design Tokens**: Complete CSS design system with 200+ tokens for colors, typography, spacing, shadows, transitions
4. **AppShell Layout**: Main application shell with sidebar and content area (removed redundant title bar - native menu handles window dragging)
5. **Sidebar Navigation**: Collapsible sidebar (240px ↔ 48px) with Browse, Library, Downloads, Settings navigation items
6. **React Router v6**: Complete routing setup with placeholder views for all primary routes
7. **IPC Communication**: Menu commands trigger navigation via IPC, theme updates sent to renderer
8. **Keyboard Shortcuts**: Global shortcuts (Ctrl+1/2/3, Ctrl+B, Ctrl+,) for quick navigation
9. **Navigation Hook**: `useNavigationListener` to handle menu-triggered navigation
10. **TypeScript Type Safety**: All IPC APIs properly typed with TypeScript definitions
11. **Bug Fixes Applied**:
    - Fixed sidebar toggle state management (consolidated to single source of truth in App component)
    - Removed redundant 32px title bar (native menu bar handles dragging)
    - Improved Windows 11 design (added 3px accent bar on active sidebar items)
    - Fixed menu toggle IPC handler (now correctly uses current sidebarCollapsed state)
    - All toggle methods now work correctly (keyboard shortcut, sidebar button, menu item)
12. **Sidebar Toggle Button**: Added Windows 11-style hamburger menu button (≡) at top of sidebar
    - Icon-only design (no label) matching Windows 11 patterns
    - 40×40px clickable area with proper hover/active states
    - Aligned with sidebar navigation icons using padding and negative margin technique
    - Positioned at top before navigation items

**Files Created**:

- `src/main/menu.ts` - Menu bar template with all 5 menus
- `src/main/theme.ts` - Theme detection and IPC bridge
- `src/renderer/src/assets/tokens.css` - Design tokens (300+ lines)
- `src/renderer/src/layouts/AppShell.tsx` - Main layout component
- `src/renderer/src/components/Sidebar/` - Sidebar navigation component
- `src/renderer/src/router.tsx` - Route configuration
- `src/renderer/src/views/` - 6 placeholder view components
- `src/renderer/src/hooks/useNavigationListener.ts` - Navigation IPC listener
- `src/renderer/src/hooks/useKeyboardShortcuts.ts` - Global keyboard shortcuts

**Application Running**: Development server started successfully, Electron app running with full navigation

### ✅ Previously Completed (24 Nov 2025)

### 🔄 Active Work

- **P1-T01**: ✅ COMPLETE - All 11 deliverables created and saved to docs/ folder
- **P1-T02**: ✅ COMPLETE - Menu bar and navigation system fully implemented
- **P1-T03**: ⏳ PLANNED - UI component library implementation plan ready for execution

11. **loading-feedback-states.md**: Skeleton screens (shimmer animation), progress rings (reader 0-100%), progress bars (downloads with speed/ETA), spinners (modal ops), error states (network/API/filesystem), empty states (library/search/downloads), modal strategy (native vs custom), TypeScript interfaces

**All 9 P1-T01 Steps Executed**:

- ✅ Step 1: Layout Wireframes (wireframes.md, navigation-flow.md, layout-specification.md, windows11-design-tokens.md, menu-bar-structure.md)
- ✅ Step 2: Component Hierarchy (component-hierarchy.md)
- ✅ Step 3: Routing Solution (routing-decision.md - React Router v6 selected)
- ✅ Step 4: Navigation UI (covered in Step 1's menu-bar-structure.md)
- ✅ Step 5: Reader Layout (reader-layout-specification.md - 3 modes detailed)

### ⏳ Next Actions

1. **P1-T03**: Execute UI component library implementation (plan ready in `.github/copilot-plans/`)
2. **P1-T04**: Set up state management (Zustand recommended for lightweight state)
3. **P1-T05**: Implement restricted filesystem access model (AppData + user-configured downloads)
4. **P1-T06**: Create path validation system (security layer for file operations)
5. **P1-T07**: Implement file system handlers with path restrictions
6. Continue Phase 1 implementation tasks

### 💡 Good-to-Have (Future Enhancements)

1. **Replace Emoji Icons with Windows 11 Icon Library**: Currently using emoji placeholders (🔍, 📚, ⬇️, ⚙️) in sidebar. Future enhancement: implement proper Windows 11 Fluent UI icons (SVG or icon font) for better visual consistency and scalability
2. **Date Format Preferences**: Allow users to choose between DD/MM/YYYY (British), YYYY-MM-DD (ISO), MM/DD/YYYY (American) - planned for Phase 3
3. **Keyboard Shortcuts Dialog**: Menu item exists (Help → Keyboard Shortcuts, Ctrl+/) but no dialog implemented yet. Defer until all shortcuts are finalized to show complete list in custom modal overlay (Windows 11-styled, not native dialog - per hybrid modal strategy)

---

## Recent Decisions

### 25 November 2025

**Sidebar Toggle Button**:

- ✅ Added Windows 11-style hamburger menu button (≡) at top of sidebar
- ✅ Icon-only design (no label text) matching Windows 11 Settings app pattern
- ✅ 40×40px hover/active area aligned with navigation icons
- ✅ Uses `padding: 0 var(--space-5)` on container with negative margin on icon for proper alignment
- ✅ Positioned before navigation items for easy access
- ✅ Keyboard accessible with proper ARIA labels

**P1-T03 Planning Completed**:

- ✅ Created comprehensive 12-step implementation plan for UI component library
- ✅ Defined 9 must-have components: Button (4 variants, 3 sizes), Input (validation states), MangaCard (grid/list), SearchBar (debouncing), Skeleton (shimmer), Toast (notification system), ProgressBar (linear downloads), ProgressRing (circular reader), Modal (custom overlays)
- ✅ Complete TypeScript interfaces for all components
- ✅ BEM CSS naming convention specifications
- ✅ Windows 11 design patterns and styling guidelines
- ✅ Accessibility requirements (ARIA labels, keyboard nav, screen reader support, WCAG AA)
- ✅ Animation guidelines (60fps target, GPU-accelerated transforms, prefers-reduced-motion support)
- ✅ Testing strategy (manual testing checklist, accessibility testing with screen readers)
- ✅ Component file structure and organization
- ✅ No new dependencies required (pure React + CSS + existing design tokens)
- ✅ Estimated duration: 3-4 days (24-32 hours total)
- ✅ Plan saved to `.github/copilot-plans/P1-T03-create-base-ui-component-library.md`
- ✅ Ready for execution

### 🔄 Active Work

- **P1-T01**: ✅ COMPLETE - All 11 deliverables created and saved to docs/ folder
- **P1-T02**: ⏳ PLANNED - Complete implementation plan created, ready to start

### ⏳ Next Actions

1. **Begin P1-T02 execution**: Start with Step 1 (install React Router v6)
2. **P1-T03**: Create base UI component library (implement components from specs)
3. **P1-T04**: Set up state management (Zustand/Redux)
4. **P1-T05**: Implement restricted filesystem access model
5. **P1-T06**: Create path validation system
6. Continue Phase 1 implementation tasks

---

## Recent Decisions

### 24 November 2025

**Documentation Organisation**:

- ✅ Reorganised `docs/` folder into logical subfolders
- ✅ Created 3 categories: `design/` (wireframes, tokens, responsive), `architecture/` (navigation, layout, routing, reader, menu), `components/` (hierarchy, specs, loading states)
- ✅ Added `docs/README.md` with folder structure guide and quick reference

**P1-T02 Planning**:

- ✅ Created comprehensive implementation plan for menu bar and navigation
- ✅ Defined 10 detailed implementation steps with time estimates
- ✅ Specified all deliverables, acceptance criteria, and file structure
- ✅ Documented technical decisions (native Menu API, inline SVG icons, CSS variables for theme)
- ✅ Estimated effort: 2-3 days (16-24 hours)
- ✅ Implementation completed successfully

**Display Language**:

- ✅ British English (en-GB) as default display language
- ✅ British spelling conventions: "Favourites", "Colour", "Organise", "Centre"
- ✅ Date format options: DD/MM/YYYY (default British), YYYY-MM-DD (ISO), MM/DD/YYYY (American) - good-to-have feature for Phase 3
- ✅ Future localisation support planned (i18n architecture)

**Loading States Strategy**:

- ✅ Skeleton screens for content-heavy grids (Browse, Library, Manga Detail)
- ✅ Two-phase reader loading: Online (indeterminate → deterministic), Offline (instant)
- ✅ Linear progress bars for download operations (Downloads view)
- ✅ No percentage text in circular progress rings (clean design)
- ✅ Horizontal progress bars show: title, %, speed, ETA, total size
- ✅ Support multiple simultaneous downloads (stacked list UI)
- ✅ No indicators for instant local operations (favorites, collections, settings, navigation)
- ✅ Indeterminate spinners only for modal operations (app load, import/export)
- ✅ 100ms threshold for offline reader (fallback spinner for rare slow filesystem reads)

**Progress Indicator Patterns**:

- ✅ Circular rings: Reader view (online image streaming)
- ✅ Linear bars: Downloads view (file operations)
- ✅ Skeleton screens: Content grids (perceived performance)
- ✅ Spinners: Modal/blocking operations (unknown duration)
- ✅ None: Local instant operations (immediate feedback)

**Windows 11 Design**:

- ✅ All loading patterns use accent colors (light: #0078d4, dark: #60cdff)
- ✅ Smooth transitions (150ms quick, 300ms smooth)
- ✅ Subtle effects (4-6px progress bars, 8px skeleton radius, shimmer animation)
- ✅ Native feel (follows Windows file operation conventions)

### 23 November 2025

**Content & API**:

- ✅ MangaDex public API only (no authentication needed)
- ✅ Image files only: JPG, PNG, WebP (no PDF support)
- ✅ Public read-only endpoints for all features

**Development Priority**:

- ✅ Online functionality FIRST (Phase 2)
- ✅ Offline downloads LATER (Phase 4)

**Caching Strategy**:

- ✅ Cover images: Auto-cache when manga bookmarked
- ✅ Chapter images: User-initiated downloads only
- ✅ Online reading: Stream only, no disk caching (memory preload for smooth transitions)

**Tech Stack**:

- ✅ Electron 38 + React 19 + TypeScript 5.9
- ✅ electron-vite for build system
- ✅ Three-process architecture (main/preload/renderer)

**UI/UX Design**:

- ✅ Windows 11 native design system (Mica, Acrylic effects)
- ✅ System theme detection (auto light/dark based on Windows)
- ✅ Native OS title bar with menu bar (File, View, Library, Tools, Help)
- ✅ Collapsible sidebar navigation (secondary to menu bar)
- ✅ Custom components (no UI library for performance)
- ✅ Segoe UI Variable font

**Security Model**:

- ✅ Restricted filesystem access (2 directories only)
- ✅ AppData: Database, cache, settings (automatic)
- ✅ Downloads: User-configurable via native folder picker
- ✅ Path validation enforced on all file operations
- ✅ Network restricted to MangaDex domains only

**Features**:

- ✅ Library import/export (native DexReader + Tachiyomi formats)
- ✅ Downloads directory configuration in Settings
- ✅ Backup/restore for app data

---

## Current Work Focus

### Today's Goals (24 Nov 2025)

- [✅] Define comprehensive loading state strategy for all views
- [✅] Specify reader loading states (online two-phase, offline instant)
- [✅] Design download progress indicators (linear bars with detailed info)
- [✅] Document loading pattern decision matrix
- [✅] Update P1-T01 plan with complete loading specifications
- [✅] Define modal dialog strategy (hybrid: native OS + custom overlays)
- [✅] Complete P1-T01 planning phase (all 9 steps fully specified)
- [✅] P1-T01 ready for execution (16 tasks, 10 deliverables documented)

### Current Blockers

None

### Open Questions

None at this time

---

## Quick Command Reference

```bash
npm run dev         # Start development with HMR
npm run build       # Type check + build
npm run typecheck   # Validate types only
```

---

## Session Notes

### 24 November 2025 - P1-T01 Loading States Design

**Accomplished**:

- Refined P1-T01 plan with comprehensive loading state strategy
- Defined five loading pattern categories:
  1. Skeleton screens (Browse, Library, Manga Detail grids)
  2. Reader loading (online: two-phase, offline: instant)
  3. Linear progress bars (Downloads view with detailed info)
  4. Indeterminate spinners (modal operations)
  5. No indicators (instant local operations)
- Specified circular progress ring for online reader:
  - Phase 1: Indeterminate spinner (querying at-home endpoint)
  - Phase 2: Deterministic ring 0-100% (streaming images)
  - Clean design: No percentage text in center
- Designed linear progress bars for Downloads view:
  - Horizontal bars (4-6px height, 2px rounded ends)
  - Display: Chapter title, progress %, download speed, ETA, total size
  - Support multiple simultaneous downloads (stacked list)
  - Status states: downloading, paused, completed, error
- Specified offline reader instant loading:
  - No indicator when loading from downloads directory
  - Fallback spinner only if filesystem read >100ms (rare)
- Created TypeScript interfaces:
  - `LoadingSpinnerProps` (indeterminate, with optional message)
  - `ProgressRingProps` (deterministic 0-100%, size variants)
  - `DownloadProgressProps` (title, progress, speed, ETA, size, status)
- Documented when NOT to show loading indicators:
  - Favorites (instant icon change)
  - Collections (local-only)
  - Settings (instant)
  - Navigation (instant route change)
- Updated P1-T01 deliverables and acceptance criteria
- Increased estimated effort to 5-6 days (from 4-5 days)
- All patterns follow Windows 11 design language

**Key Decisions**:

- Skeleton screens provide better UX than spinners for content grids
- Two-phase loading needed for MangaDex API flow (at-home query → image URLs)
- Offline reading should feel instant (no loading indicators unless filesystem slow)
- Linear progress bars superior to circular spinners for file downloads
- Detailed download info (speed, ETA, size) improves user experience
- Progress rings without percentage text maintain clean visual design
- Local operations don't need loading indicators (instant feedback preferred)

**Design Specifications Created**:

- Skeleton card CSS with shimmer animation
- Circular progress ring (48-64px, accent color, smooth transitions)
- Linear progress bar (4-6px height, rounded ends, stacked layout)
- Indeterminate spinner (Windows 11 style, modal overlays)
- Error states (network banner/toast, API details, filesystem dialog)
- Empty states (clear CTAs for empty library, no results, no downloads)

**Session Completion Summary**:

- ✅ **P1-T01 Planning Phase: COMPLETE**
- ✅ All 9 steps fully specified with tasks, deliverables, and acceptance criteria
- ✅ Total: 16 tasks, 10 major deliverables, 5-6 days estimated effort
- ✅ Comprehensive design coverage: wireframes, components, routing, navigation, reader layout, responsive behavior, Windows 11 design system, loading/error/empty states, modal dialogs
- ✅ Ready for execution: Can proceed with Step 1 (wireframe creation) at any time

**Next Session**:

1. Execute **P1-T01 Step 1**: Create wireframes for all 4 primary views
2. **P1-T01 Step 2**: Design React component hierarchy
3. **P1-T01 Step 3**: Evaluate and select routing library (React Router v6 recommended)
4. **P1-T01 Step 4**: Design dual navigation (menu bar + sidebar)
5. **P1-T01 Step 5**: Design reader layout (single/double/vertical modes)
6. **P1-T01 Step 6-9**: Responsive behavior, Windows 11 tokens, component specs, loading/error/empty states

### 25 November 2025 - P1-T02 Navigation Implementation

**Accomplished**:

- Installed React Router v6 for client-side routing
- Created native Electron menu bar (src/main/menu.ts):
  - 5 menus: File, View, Library, Tools, Help
  - 30+ menu items with keyboard accelerators
  - Context-aware items (Download Chapter, Add to Favourites)
  - IPC integration for all menu actions
- Implemented system theme detection (src/main/theme.ts):
  - Uses Electron's `nativeTheme` API
  - Detects Windows 11 light/dark theme
  - Sends theme updates to renderer via IPC
- Created Windows 11 design tokens CSS (src/renderer/src/assets/tokens.css):
  - 200+ CSS variables for colors, typography, spacing, shadows
  - Complete light and dark theme support
  - Fluent Design principles (Mica backgrounds, Acrylic blur, rounded corners)
- Built AppShell layout component (src/renderer/src/layouts/AppShell.tsx):
  - Sidebar integration
  - Theme switching
  - Skip navigation link for accessibility
  - IPC handler for menu-triggered sidebar toggle
- Implemented Sidebar navigation component (src/renderer/src/components/Sidebar/):
  - Collapsible states: 240px (expanded) ↔ 48px (collapsed)
  - 4 navigation items: Browse, Library, Downloads, Settings
  - Active route highlighting with Windows 11 accent bar (3px blue left border)
  - Keyboard navigation support
  - Responsive design (auto-collapses below 620px)
- Set up React Router v6 configuration:
  - 6 routes: /, /browse, /library, /reader/:mangaId/:chapterId, /settings, /downloads
  - Placeholder view components for all routes
  - 404 Not Found page
- Created IPC handlers for navigation:
  - Menu-triggered navigation
  - Sidebar toggle via IPC
  - Theme synchronisation
  - Menu state updates
- Implemented global keyboard shortcuts:
  - Ctrl+1: Browse, Ctrl+2: Library, Ctrl+3: Downloads
  - Ctrl+,: Settings, Ctrl+B: Toggle Sidebar
- Updated preload API with TypeScript definitions:
  - Theme API: `getTheme()`, `onThemeChanged()`
  - Navigation API: `onNavigate()`
  - Menu action handlers for all menu items
- Fixed TypeScript errors and verified type safety
- Application successfully running in development mode

**Bug Fixes & Iterations**:

1. **Removed redundant title bar**: Native menu bar already provides window dragging, removed custom 32px title bar from AppShell
2. **Fixed sidebar state management**:
   - Issue: Keyboard shortcut toggled AppContent's local state while menu toggled App's state
   - Solution: Consolidated to single `sidebarCollapsed` state in App component, passed toggle callback down to AppContent
3. **Improved Windows 11 design**: Added 3px blue accent bar on active sidebar items using `::before` pseudo-element
4. **Fixed menu toggle IPC handler**:
   - Issue: Menu toggle captured stale `sidebarCollapsed` value from initial render
   - Solution: Changed to reference current state via dependency array: `onSidebarToggle(!sidebarCollapsed)` with `[onSidebarToggle, sidebarCollapsed]` deps
5. **Verified all toggle methods**: Keyboard shortcut (Ctrl+B), sidebar button, and menu item (View → Toggle Sidebar) all working correctly

**Key Decisions**:

- Used native Electron Menu API for menu bar (not custom HTML)
- Emoji icons as placeholders for sidebar (can upgrade to icon library later)
- React `useState` for sidebar collapse state (no global state needed yet)
- CSS variables with `data-theme` attribute for theme switching
- British English throughout ("Favourites" not "Favorites")

**Technical Implementation**:

- 10 new files created across main, preload, and renderer processes
- IPC communication layer properly typed with TypeScript
- Separation of concerns: menu creation, theme detection, routing
- Hooks for clean separation: `useNavigationListener`, `useKeyboardShortcuts`

**Next Session**:

1. **P1-T03**: Create base UI component library (MangaCard, SearchBar, Toast, ProgressBar)
2. **P1-T04**: Set up state management (Zustand)
3. Address linting warnings (ESLint prefers `globalThis` over `window`, etc.)

### 23 November 2025 - Initial Setup & Planning

**Accomplished**:

- Created project structure with electron-vite
- Set up complete memory bank documentation system (5 files)
- Wrote comprehensive project brief with requirements
- Defined MangaDex integration approach (public API only)
- Clarified technical decisions:
  - Images only, no PDFs
  - Explicit downloads only (no auto-caching)
  - Online functionality first, offline later
  - Public API endpoints only (no authentication)
- Implemented task coding system (P1-T01 through P7-T12)
- Documented complete 7-month timeline with 8 phases
- Established architecture patterns and tech context
- Set up Git repository with initial commit
- Pushed to GitHub (remichan97/DexReader)
- Verified coding standards already configured (Prettier + ESLint)
- Designed Windows 11 native UI system:
  - System theme detection (light/dark auto-switching)
  - Native menu bar + collapsible sidebar navigation
  - Mica/Acrylic effects for modern Windows look
  - Custom components (no UI library)
- Established security model:
  - Restricted filesystem (AppData + user-configured downloads only)
  - Path validation on all file operations
  - Network restricted to MangaDex domains
- Added library import/export feature (native + Tachiyomi formats)
- Created detailed P1-T01 plan (main application layout)

**Key Insights**:

- MangaDex has public endpoints for all read operations
- No authentication simplifies architecture significantly
- User-controlled downloads prevent unwanted disk usage
- Personal app focus allows tailored UX decisions

**Features Defined**:

- Manga search, browse, and bookmarking
- Book-like reading interface with progress tracking
- Quick jump to last read page
- Personal library with collections
- Explicit chapter/manga downloads
- Check for updates on demand or startup
- Library import from Tachiyomi backups
- Library export (native DexReader + Tachiyomi formats)
- User-configurable downloads directory
- Windows 11 native design with system theme sync

**Next Session**:

1. Execute **P1-T03**: Create base UI component library
2. **P1-T04**: Set up state management (Zustand)
3. **P1-T05**: Implement restricted filesystem access model
4. **P1-T06**: Create path validation system
5. Continue Phase 1 implementation (**P1-T04** to **P1-T09**)

> **Task Reference**: See `project-progress.md` for technical task codes (P1-T01 through P7-T12)

---

## Memory Bank Structure

- **active-context.md** (this file) - Current session state, recent decisions, immediate work
- **project-progress.md** - Full timeline, all phases, milestones, risks
- **system-pattern.md** - Architecture patterns, code conventions, design principles
- **tech-context.md** - Technology stack details, configurations, dependencies

> **When to Update**: End of each session, when making decisions, when completing milestones

---

*Last session: 24 Nov 2025 | Next session: TBD*

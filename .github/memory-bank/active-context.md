# DexReader Active Context

**Last Updated**: 24 November 2025
**Current Phase**: Phase 1 - Core Architecture (Planning)
**Session**: P1-T01 Loading States Design

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 1 - Core Architecture 🔵
**Progress**: P1-T01 Planning (loading states defined)
**Current Date**: 24 November 2025

### ✅ Completed This Session (24 Nov 2025) (24 Nov 2025)

1. **P1-T01 Loading States Strategy**: Comprehensive loading pattern system designed
2. **Skeleton Screens**: Defined for Browse, Library, and Manga Detail views (8px radius, shimmer animation)
3. **Reader Loading States**:
   - Online mode: Two-phase loading (indeterminate → deterministic)
   - Offline mode: Instant loading from downloads directory (100ms threshold)
4. **Progress Indicators**:
   - Circular progress ring for reader (no percentage text, Windows 11 accent color)
   - Linear progress bars for Downloads view (horizontal, with speed/ETA/size)
5. **Download Progress UI**: Specified horizontal bars with chapter title, %, speed, ETA, total size
6. **Indeterminate Spinners**: Defined for modal operations (app load, import/export)
7. **Loading Decision Matrix**: Documented when to use each pattern (skeleton vs ring vs bar vs spinner vs none)
8. **Error States**: Designed for network, API, and file system failures
9. **Empty States**: Designed with clear CTAs for empty library, no search results, no downloads
10. **TypeScript Interfaces**: Specified LoadingSpinner, ProgressRing, DownloadProgress props
11. **Windows 11 Design**: All patterns follow Fluent Design language (accent colors, smooth transitions)
12. Updated P1-T01 plan: 12 tasks, updated deliverables and acceptance criteria, 5-6 days effort

### 🔄 Active Work

- **P1-T01**: Main application layout design (loading states defined, ready for wireframes execution)

### ⏳ Next Actions

1. Execute **P1-T01**: Create wireframes for Browse, Library, Reader, Settings views
2. **P1-T01**: Design component hierarchy and routing plan
3. **P1-T01**: Document Windows 11 design tokens (complete CSS variables)
4. **P1-T01**: Write component specifications for all layout components
5. **P1-T02**: Implement menu bar and navigation (after P1-T01 design complete)

---

## Recent Decisions

### 24 November 2025

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

**Next Session**:

1. Execute **P1-T01 Step 1**: Create wireframes for all 4 primary views
2. **P1-T01 Step 2**: Design React component hierarchy
3. **P1-T01 Step 3**: Evaluate and select routing library (React Router v6 recommended)
4. **P1-T01 Step 4**: Design dual navigation (menu bar + sidebar)
5. **P1-T01 Step 5**: Design reader layout (single/double/vertical modes)
6. **P1-T01 Step 6-9**: Responsive behavior, Windows 11 tokens, component specs, loading/error/empty states

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

1. Execute **P1-T01**: Design main application layout (wireframes, component hierarchy, Windows 11 design tokens)
2. **P1-T02**: Implement menu bar and navigation
3. **P1-T05**: Implement restricted filesystem access model
4. **P1-T06**: Create path validation system
5. Continue Phase 1 implementation (**P1-T03** to **P1-T09**)

> **Task Reference**: See `project-progress.md` for technical task codes (P1-T01 through P7-T12)
> **Design Plan**: See `.github/copilot-plans/P1-T01-main-application-layout-plan.md` for layout design details

---

## Memory Bank Structure

- **active-context.md** (this file) - Current session state, recent decisions, immediate work
- **project-progress.md** - Full timeline, all phases, milestones, risks
- **system-pattern.md** - Architecture patterns, code conventions, design principles
- **tech-context.md** - Technology stack details, configurations, dependencies

> **When to Update**: End of each session, when making decisions, when completing milestones

---

*Last session: 24 Nov 2025 | Next session: TBD*

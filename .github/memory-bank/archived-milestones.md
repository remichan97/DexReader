# DexReader Archived Milestones

**Purpose**: This file contains detailed implementation notes from completed milestones in chronological order. These are historical records that provide context for past decisions and serve as essential reference material.

**Last Updated**: 25 January 2026

---

## P1-T03 UI Component Library (25 November - 1 December 2025)

### Implementation Waves

**Steps 1-6 (25-26 November 2025)**:

- ✅ Component structure established (~3,100 lines total)
- ✅ Button, Input, MangaCard, SearchBar, Skeleton components fully implemented
- ✅ All 9 must-have components complete: Button, Input, MangaCard, SearchBar, Skeleton, Toast, ProgressBar, ProgressRing

**Steps 7-9 (26 November 2025)**:

- ✅ **Toast Component**: Notification system with 4 variants (info, success, warning, error), ToastContainer with 4 position options, useToast hook for state management, auto-dismiss (configurable 0-∞ms), slide-in animations, close button, stacking support
- ✅ **ProgressBar Component**: Linear progress with determinate/indeterminate modes, 3 sizes, 3 color variants (default/success/error), optional labels with percentage, metadata support (speed, ETA), auto-success color at 100%, smooth transitions, moving gradient animation for indeterminate
- ✅ **ProgressRing Component**: Circular SVG-based progress indicator, determinate/indeterminate modes, 3 sizes (24px/40px/64px), 3 color variants, customizable stroke width, rotation + arc animations for indeterminate, rounded stroke caps
- ~2,800 lines of TypeScript + CSS + documentation created
- Updated SettingsView with Toast/ProgressBar/ProgressRing showcase
- Fixed ProgressVariant type definition (changed from determinate/indeterminate to default/success/error)

**Steps 10-12 (1 December 2025 - Afternoon)**:

- ✅ **Modal Component**: Overlay dialog system with focus trap, keyboard navigation (Escape to close, Tab navigation), body scroll lock, click-outside-to-close, 3 sizes (small/medium/large), Windows 11 Acrylic backdrop blur, smooth fade/scale animations, header/content/footer structure
- ✅ **Select Component**: Custom dropdown with keyboard navigation (Arrow keys, Enter, Escape, Home, End), searchable mode with filtering, multi-select support with checkboxes, click-outside-to-close, disabled options support, smooth animations, Windows 11 styling
- ✅ **Checkbox Component**: Three states (checked/unchecked/indeterminate), checkmark animation with scale/fade, Windows 11 rounded style with accent color, label support, keyboard navigation (Space/Enter), group functionality with select-all pattern
- ~4,500 lines of additional TypeScript + CSS + documentation created
- SettingsView updated with Modal (3 variants), Select (basic/searchable/multi-select), Checkbox (individual + group with indeterminate) demos

**Steps 13-15 (1 December 2025 - Afternoon)**:

- ✅ **Switch Component**: Toggle switch with sliding knob animation (40×20px, 12px knob), full-width layout with right-aligned toggle, label + description support, keyboard navigation (Space/Enter), Windows 11 styling with accent colors, vertically centered knob using transform translateY(-50%)
- ✅ **Badge Component**: 5 variants (default/success/warning/error/info), 2 sizes (small 11px/medium 12px), optional icon, dot variant (6px/8px circles), pill-shaped design, high contrast support
- ✅ **Tabs Component**: Context-based architecture (Tabs/TabList/Tab/TabPanel), animated accent indicator that slides under active tab, keyboard navigation (Arrow keys/Home/End), controlled/uncontrolled modes, disabled tab support, content fade-in animation, proper ARIA attributes
- ~2,000 lines of TypeScript + CSS + documentation added
- SettingsView updated with comprehensive demos (Switch settings panel, Badge variants/sizes/dots, Tabs with 4 panels)

**Steps 16-18 (1 December 2025 - Evening)**:

- ✅ **Tooltip Component**: Hover-based information tooltips with 4 position variants (top/right/bottom/left), auto-flip near viewport edges, portal rendering to document.body, configurable delay (default 500ms), arrow pointer, fade/scale animation, Windows 11 card styling
- ✅ **Popover Component**: Contextual menus and overlays with 4 position variants, dual triggers (click/hover), click-outside-to-close, Escape key support, portal rendering, controlled/uncontrolled modes, direction-aware slide animations (200ms), focus management returns to trigger on close
- ✅ **ViewTransition Component**: Route transition animations with fade + 8px vertical slide (300ms cubic-bezier), monitors location changes via useLocation hook, two-stage animation (fade-out old, fade-in new), respects prefers-reduced-motion
- ✅ **Router Integration**: Wrapped all main routes (Browse, Library, Settings, Downloads, NotFound) with ViewTransition for seamless page transitions
- ~1,800 lines of TypeScript + CSS + documentation created
- SettingsView updated with Tooltip demos (4 positions, complex content), Popover demos (click/hover triggers, menu example)

### UI Polish Pass (1 December 2025 - Evening)

**9 Comprehensive Refinements**:

1. **SearchBar Styling Consistency**: Matched SearchBar to Input component (32px height, 2px bottom border, identical focus behavior)
2. P2-T11 Reading Modes (20 December 2025)

### Implementation Summary

- ✅ **P2-T11 COMPLETE**: Reading modes fully implemented (~6 hours, 20 Dec 2025)
- ✅ **Phase 2 COMPLETE**: All 11 tasks finished (100%) 🎉
- **Three Reading Modes Working**:
  - Single page (existing, enhanced)
  - Double page (side-by-side with RTL support)
  - Vertical scroll (webtoon style with IntersectionObserver)
- **Per-Manga Settings Override**: Each manga can save its preferred reading mode
- **Keyboard Shortcut**: Press `M` to cycle through modes
- **Responsive Design**: Double page falls back to single column on narrow screens

### Critical Bug Fixes

1. **IPC Response Wrapper Extraction**
   - **Issue**: Not accessing `.data` property from IpcResponse wrapper
   - **Fix**: Extract data from IPC responses properly

2. **RTL Page Display**
   - **Issue**: Double reversal causing wrong order
   - **Fix**: Removed double reversal logic

3. **Page Counter in RTL Mode**
   - **Issue**: Showing incorrect order
   - **Fix**: Display correct page order in RTL mode

4. **Settings Loading Race Condition**
   - **Issue**: Settings loading after images causing incorrect mode display
   - **Fix**: Settings now load BEFORE images

### Phase 2 Achievement

- Duration: 14 days (6 Dec - 20 Dec 2025)
- Tasks: 11/11 complete (100%)
- Key deliverables: MangaDex API client, search interface, detail view, online reader with streaming, zoom/pan controls, progress tracking with per-chapter data, three reading modes
- Documentation: Complete API docs, architecture docs, memory bank updates
- Production ready: Zero compilation errors, full TypeScript type safety

---

## **Focus/Hover Conflict Fix**: Added `:not(:focus-within)` to SearchBar hover state to prevent overriding focus accent border

1. **Global Focus Glow Removal**: Removed `box-shadow` and `border-color` from global `input:focus` in main.css, added `!important` rules to component styles to prevent browser defaults
2. **ViewTransition Flash Fix**: Changed from per-route wrapping to single wrapper with `key={location.pathname}`, React key-based remounting eliminates content flash
3. **Sidebar Animated Indicator**: Added sliding blue accent bar with spring animation `cubic-bezier(0.34, 1.56, 0.64, 1)`, 400ms duration, position calculated via `offsetTop/offsetHeight`
4. **Input Focus Animation Evolution**: Started with Material Design expanding line → scale(1.01) → final: simple border-bottom-color transition (200ms cubic-bezier), removed all pseudo-elements
5. **Fluent Design Over Material**: Removed Material ripple effects, adopted clean Windows 11 patterns with minimal transitions
6. **@fluentui/react-icons Integration**: Installed official Microsoft Fluent UI icon library (67 packages, ~5-6 KB for 8 icons), tree-shakeable
7. **Icon Variant Pattern**: Implemented Regular icons for inactive state, Filled icons for active navigation items (Windows 11 pattern)

**Icons Used**: Search24Regular/Filled, Library24Regular/Filled, ArrowDownload24Regular/Filled, Settings24Regular/Filled

**Additional Fixes Applied**:

- **Tabs Active Indicator**: Fixed indicator not updating on tab change by adding `activeValue` to useEffect dependency array in TabList
- **Switch Vertical Alignment**: Changed `.switch__control` from `align-items: flex-start` to `align-items: center`, removed `padding-top: 1px` from content
- **Switch Layout**: Reordered elements (content first, toggle second), added full-width layout with `justify-content: space-between` for right-aligned toggle
- **Switch Knob Centering**: Changed from `top: 2px` to `top: 50%; transform: translateY(-50%)` for perfect vertical centering
- **Select Font Weight**: Removed `font-weight: 600` from selected options to show normal weight
- **Select Arrow Positioning**: Made icon absolutely positioned for all variants (not just searchable), consistent `padding-right: 32px` on all triggers, fixed vertical centering with `top: 50%; transform: translateY(-50%)`
- **Input Focus Glow**: Added `box-shadow: none` and explicit `:focus/:focus-visible` rules to remove default browser glow, keeping only bottom border highlight

### Steps 19-20 (2 December 2025)

- ✅ **P1-T03 Step 20 completed**: Final integration, testing, and fixes
  - Added `productName: "DexReader"` to package.json for native dialog titles
  - Fixed CSP to allow HTTPS images: `img-src 'self' data: https:`
  - All components rendering correctly with no errors
  - Native dialogs showing proper app name
- ✅ **Documentation Updates**: Corrected design docs to remove sidebar collapse functionality
  - Sidebar is fixed 240px (no hamburger menu, no Ctrl+B toggle)
  - Updated wireframes.md, layout-specification.md, menu-bar-structure.md, responsive-behavior-guide.md
  - Removed "Toggle Sidebar" menu item and keyboard shortcut from docs
  - All documentation now matches actual implementation
- ✅ **P1-T03 COMPLETE**: All 17 components + 20 steps done, ~8,500 lines of code

**Total Impact**: 17 production-ready components with Windows 11 Fluent Design, comprehensive accessibility, smooth animations, full TypeScript type safety

---

## P1-T04 State Management with Zustand (2 December 2025)

- ✅ **P1-T04 COMPLETE**: Zustand state management fully implemented
  - **Duration**: 1 day (all 12 steps executed successfully)
  - **Zustand v5.0.3 installed**: Lightweight state management (~1.4kb)
  - **4 Stores Created**:
    - `appStore.ts`: Theme management with system sync, fullscreen state
    - `toastStore.ts`: Global notification system with auto-dismiss timers
    - `userPreferencesStore.ts`: All user settings with validation and persistence
    - `libraryStore.ts`: Bookmarks and collections (Phase 3 skeleton)
  - **Component Migrations**: AppShell, SettingsView, LibraryView all using Zustand
  - **Global Toast System**: Single ToastContainer in App.tsx, accessible from any view
  - **Type System Fixed**: Added 'loading' variant to ToastVariant for ProgressRing integration
  - **Documentation Created**: 900+ line state-management.md guide in docs/architecture/
  - **Memory Bank Updated**: tech-context.md and system-pattern.md include state management sections
  - **TypeScript Compilation**: All checks passing, dev server running without errors

---

## P1-T05 Filesystem Security (2-3 December 2025)

- ✅ **P1-T05 COMPLETE**: Filesystem Security fully implemented (all 9 steps + documentation)
  - **Path Validator** (`src/main/filesystem/pathValidator.ts`): Path normalization, validation against AppData + Downloads, path traversal prevention, symlink resolution
  - **Secure Filesystem** (`src/main/filesystem/secureFs.ts`): 12 operations with automatic path validation (readFile, writeFile, appendFile, copyFile, rename, mkdir, ensureDir, deleteFile, deleteDir, isExists, stat, readDir)
  - **Settings Manager** (`src/main/filesystem/settingsManager.ts`): Persists to AppData/settings.json, schema includes downloadsPath/theme/accentColor, graceful fallback to defaults
  - **IPC Handlers** (13 handlers in `src/main/index.ts`): All filesystem operations + fs:get-allowed-paths + fs:select-downloads-folder + theme:get-system-accent-color
  - **Preload API** (`src/preload/index.ts` + `index.d.ts`): window.fileSystem namespace exposed via contextBridge with full TypeScript definitions
  - **Filesystem Initialization** (`initFileSystem()` in main/index.ts): Creates AppData structure (metadata/, logs/, downloads/), loads settings, runs before window creation
  - **Settings UI** (`SettingsView.tsx`): 2 tabs (Appearance + Storage), theme selector, accent color picker (system + custom), downloads path selector with native folder picker, responsive layout for 2K monitors
  - **Accent Color System** (bonus): System color detection (Windows BGR→RGB, macOS RGB), custom hex color input, real-time system color change listener, CSS variable injection (--win-accent/-hover/-active), useAccentColor hook for app-wide initialization
  - **UI Polish**: Removed toast spam from settings, removed duplicate header, responsive layout, Fluent UI icons (replaced unicode emoji with Lightbulb16Regular), fixed accent color not applying on launch
  - **Documentation Created**: `docs/architecture/filesystem-security.md` (600+ lines with architecture diagrams, usage examples, security guarantees, troubleshooting)
  - **Memory Bank Updated**: Added Filesystem Security sections to system-pattern.md and tech-context.md with implementation details
  - All TypeScript compilation passing, manual testing complete, automated tests deferred to Phase 5
- ✅ **System Pattern Updated**: Added guideline "Always use Fluent UI icons, never unicode emoji" (rendering inconsistent across systems)
- ✅ **Bug Fixes**: Windows accent color BGR→RGB conversion, API namespace fix (electron → api), accent color initialization on app startup via useAccentColor hook
- ✅ **Phase 1 Progress**: 7 of 9 tasks complete (78%), P1-T06 and P1-T07 merged into P1-T05

---

## P2-T10 Progress Tracking: Complete Refactor (December 2025)

### Major Refactor (18 December 2025)

**Problem**: Original approach couldn't distinguish "reading last page" vs "fully complete", couldn't track multiple in-progress chapters

**Solution**: Per-chapter progress with explicit completion flag

**New Data Structure**:

```typescript
chapters: Record<string, ChapterProgress>
// with currentPage, totalPages, lastReadAt, completed flag
```

**Backend Changes**:

- ChapterProgress entity created
- MangaProgress updated to use chapters object
- Statistics calculation from per-chapter data

**Frontend Changes**:

- progressStore saveProgress rewrite
- ReaderView auto-save updates
- MangaDetailView reads from chapters object

### Bug Fixes (18 December 2025)

1. **Infinite Loop in ReaderView**
   - **Cause**: progressMap reference changes causing effect re-triggers
   - **Fix**: Proper dependency management in useEffect

2. **Menu Label Not Updating**
   - **Cause**: Menu built once on startup
   - **Fix**: "Go Incognito" / "Leave Incognito" now builds menu with correct label dynamically

3. **Missing Cover Images in HistoryView**
   - **Fix**: Added cover images with placeholder fallback

4. **Wrong Document Title**
   - **Fix**: HistoryView was showing "DexReader - DexReader"

5. **Incognito Toggle in Settings**
   - **Fix**: Removed (mode is temporary, menu-controlled only)

### UI Polish (18 December 2025)

- Incognito status bar: "**You've gone Incognito** — Progress tracking is disabled"
- Menu integration: File menu "Go Incognito" / "Leave Incognito" with Ctrl+Shift+N
- All debug logs removed from production code

---

## Guerilla Refactoring: Detailed Implementation (December 2025)

### Backend Refactoring (Before 22 December 2025)

**Phase 0: Settings IPC Integration**

- Created app-settings.handler.ts
- Handlers: settings:load, settings:save with validation
- Validation: Field-level (accentColor, theme) and section-level (appearance, downloads, reader)
- Impact: Frontend can no longer bypass SettingsManager

**Phase 1: main/index.ts Refactoring**

- Result: 357 lines → 78 lines (78% reduction, -279 lines)
- Files Created:
  - window.ts (46 lines) - createWindow, getMainWindow, window management
  - app-lifecycle.ts (20 lines) - setupAppLifecycle with app events
- Pattern: Extract window and lifecycle logic, keep main as orchestrator

**Phase 2: IPC Handler Organization**

- Result: 347 lines → 32 lines registry (91% reduction, -315 lines)
- Files Created (7 domain handlers):
  - app-settings.handler.ts - settings operations
  - dialogs.handler.ts - dialog operations
  - file-systems.handler.ts - filesystem operations
  - mangadex.handler.ts - MangaDex API operations
  - progress-tracking.handler.ts - progress tracking
  - reader-settings.handler.ts - per-manga settings
  - theme.handler.ts - theme operations
- Pattern: Split by domain, registry.ts becomes orchestrator calling registration functions

**Phase 3: menu.ts Refactoring**

- Files Created:
  - file.menu.ts (41 lines) - File menu
  - help.menu.ts (42 lines) - Help menu
  - library.menu.ts (130 lines) - Library menu
  - tools.menu.ts (38 lines) - Tools menu
  - view.menu.ts (57 lines) - View menu
  - menu-state.ts (9 lines) - MenuState interface
  - index.ts (21 lines) - Menu orchestrator
- Pattern: Extract by menu section, support state-based building

**Phase 4: Settings Validation**

- Created types.validator.ts (201 lines)
- Validation Types:
  - Field-level: accentColor (hex format), theme (enum)
  - Section-level: appearance, downloads, reader settings
  - Type guards: isAppearanceSettings, isDownloadsSettings, isReaderSettings
  - Enum validation: AppTheme, ReadingMode, ImageQuality
- Pattern: Comprehensive validation before any settings write

### Frontend Refactoring (22 December 2025)

**Phase 1: ReaderView Refactoring**

- Result: 2,189 lines → 753 lines (68.6% reduction, -1,436 lines)
- Components Created:
  - 8 custom hooks: useReaderSettings, usePagePairs, useReaderNavigation, useReaderKeyboard, useReaderZoom, useImagePreload, useChapterData, useProgressTracking
  - 4 display components: PageDisplay, DoublePageDisplay, VerticalScrollDisplay, EndOfChapterOverlay
- Pattern: Extract logic into hooks, extract UI into components, main file orchestrates

**Phase 2: MangaDetailView Refactoring**

- Result: 1,104 lines → 439 lines (60.2% reduction, -665 lines)
- Components Created:
  - MangaHeroSection.tsx (193 lines) - cover image, metadata, action buttons, StatusBadge, DemographicBadge
  - DescriptionSection.tsx (45 lines) - description with expand/collapse
  - ExternalLinksSection.tsx (88 lines) - external service links with confirmation
  - TagsSection.tsx (55 lines) - genre tags with navigation
  - ChapterList.tsx (288 lines) - language filter, sorting, progress tracking, ChapterItem
- Pattern: Extract sections into focused components, maintain cache and state in main file

**Phase 3: SettingsView Refactoring**

- Result: 803 lines → 448 lines (44.2% reduction, -355 lines)
- Components Created:
  - AppearanceSettings.tsx (92 lines) - theme mode, accent color picker, system color
  - ReaderSettingsSection.tsx (275 lines) - force dark mode, image quality, reading mode, per-manga overrides
  - StorageSettings.tsx (77 lines) - downloads folder location
  - AdvancedSettings.tsx (9 lines) - error log viewer wrapper
- Pattern: Extract settings sections, keep state management and handlers in main file

---

## Database Migration: Detailed Implementation (December 2025)

### Phase 1: Database Infrastructure (27 December 2025)

**Duration**: ~4 hours

**What Was Done**:

- ✅ Installed Drizzle ORM + better-sqlite3
- ✅ Created database schema definitions (9 tables)
- ✅ Database connection manager with performance pragmas (WAL mode, 64MB cache, mmap)
- ✅ Migration system using Drizzle's built-in migrator
- ✅ Fixed migration SQL syntax errors (CHECK constraint, triggers)
- ✅ Configured build system to bundle migrations (Vite plugin, asarUnpack)

**Files Created**:

- `src/main/database/connection.ts` - Database manager
- `src/main/database/schema/*.schema.ts` - 9 table schemas
- `src/main/database/migrations/migrations.ts` - Migration runner
- `src/main/database/migrations/0000_first-migration.sql` - Initial schema
- `electron.vite.config.ts` - Updated with migration copy plugin

**Database Configuration**:

- Location: `AppData/dexreader.db` (dev: `./dexreader-dev.db`)
- WAL mode enabled (concurrent reads/writes)
- 64MB cache, 256MB memory-mapped I/O
- Foreign keys enforced
- Automatic statistics triggers

### Phase 2: Testing the Waters (27 December 2025)

**Duration**: ~1.5 hours

**What Was Done**:

- ✅ Added database methods to settingsManager.ts
- ✅ Verified database connection works
- ✅ Confirmed method calls reach database layer

**Current Status**:

- ⚠️ Reader override saves fail due to empty manga table (FK constraint)
- ✅ **Decision Made**: Option A - Minimal manga caching in Phase 3 (+1-2 hours)
- Rationale: Development build, get functionality working now, expand in main Phase 3

### Phase 3: Progress Migration with Lean Entities (27-28 December 2025)

**Duration**: ~8 hours

**Major Refactor Decision**:

- **Decision**: Refactor bloated `MangaProgress` entity during migration
- **Rationale**: Current entity duplicates data (title, cover, reader settings, chapter metadata). Database schema is already normalized. Better to fix now than require another refactoring pass.

**New Entity Structure**:

```typescript
// Lean (matches manga_progress table)
interface MangaProgress {
  mangaId
  lastChapterId
  firstReadAt
  lastReadAt
}

// Rich (for history view - uses JOINs)
interface MangaProgressWithMetadata {
  // Progress + metadata from manga/chapter tables
}
```

**What Was Implemented**:

- Created lean MangaProgress and ChapterProgress entities
- Created MangaProgressWithMetadata for rich queries
- Implemented MangaProgressRepository with CRUD + JOINs + statistics
- Minimal manga caching (inserts minimal records for FK constraints)
- Updated all frontend views (Store, HistoryView, MangaDetailView, ReaderView)
- Switched IPC handlers from ProgressManager to repository
- Removed old ProgressManager and progress/ folder

**CQRS-Inspired Folder Structure**:

- `database/queries/` - Query result types (read models)
- `database/commands/` - Command types (write models)
- Repository pattern for data access layer

---

## P3-T01 Library Features: Detailed Implementation (3-5 January 2026)

### Progress Tracking Fixes = P3-T01 Foundation

**Context**: What started as "regression fixes" actually implemented significant portions of P3-T01's data layer. We completed repository expansions, IPC handlers, type definitions, and opportunistic caching.

**Issues Resolved** (9 total):

1. **Progress Display Not Refreshing** - Detail view showing stale data after returning from reader
   - **Root Cause**: React Router component caching, no dependency on navigation changes
   - **Fix**: Added useEffect watching `location.pathname` to reload progress
   - **Files**: MangaDetailView.tsx

2. **Reader Ignoring Saved Progress** - Always starting at page 0 despite saved currentPage
   - **Root Cause**: useState initialization not checking locationState
   - **Fix**: Changed to `locationState?.startPage ?? 0`, added chapter change detection with startPage/startAtLastPage handling
   - **Files**: ReaderView.tsx

3. **Chapter List Missing Progress Indicators** - No per-chapter progress display in detail view
   - **Root Cause**: Database schema incomplete (MangaProgress missing currentPage/completed), no IPC endpoint for chapter queries
   - **Fix**: Extended MangaProgress interface, created `getAllChapterProgress` IPC handler, updated ChapterList component
   - **Files**: manga-progress.query.ts, manga-progress.repo.ts, progress-tracking.handler.ts, ChapterList.tsx, MangaDetailView.tsx

4. **Network Retry Resetting Completion Status** - Completed chapters marked incomplete after retry
   - **Root Cause**: useProgressTracking re-initializing on loading/error state changes
   - **Fix**: Removed loading/error from effect dependencies, added conditional check before initial save
   - **Files**: useProgressTracking.ts

5. **History View Missing Chapter Metadata** - Showing "Ch. ?" instead of chapter numbers/titles
   - **Root Cause**: Chapter metadata not cached in database during reading
   - **Fix**: Implemented chapter caching system - saves chapter metadata when reading starts
   - **Files**: chapter.schema.ts, manga-progress.repo.ts, progress-tracking.handler.ts, ReaderView.tsx, preload files

6. **Statistics Showing Zero** - All reading stats displaying 0 despite active reading
   - **Root Cause**: Query filtering only completed chapters, incorrect page count formula
   - **Fix**: Removed `.where(eq(completed, true))` filter, changed to `SUM(currentPage + 1)`
   - **Files**: reading-stats.repo.ts

7. **History Missing Language Information** - No indication which translation was read
   - **Root Cause**: Language data not exposed in metadata, no UI component for display
   - **Fix**: Added `language?: string` to MangaProgressMetadata, created language badge with localized names
   - **Files**: manga-progress-metadata.query.ts, HistoryView.tsx, HistoryView.css

8. **TypeScript Import Error** - "Module 'src/preload' has no exported member 'ChapterProgress'"
   - **Root Cause**: Incorrect module path resolution in renderer
   - **Fix**: Changed import from 'src/preload' to relative path '../../../preload/index.d'
   - **Files**: MangaDetailView.tsx

9. **Empty State Icons Too Small** - 24px variants not visually prominent
   - **Root Cause**: Using smaller icon variants, some icon families lacking 48px versions
   - **Fix**: Upgraded to 48px variants (BookOpen48Regular, Search48Regular, Warning48Regular)
   - **Files**: LibraryView.tsx

---

## P3-T12 Mihon Import: Implementation Details (14 January 2026)

### Backend Service Complete

- Protobuf decoding with proper BigInt/Long handling
- Tag name→ID conversion (76 tag mappings)
- Favorite field detection (isFavourite vs favorite)
- Timestamp conversion (Unix seconds to Date objects)
- Double-import prevention (checks existing manga/collections)
- Batch operations for performance
- Progress tracking with chapter metadata caching

### Frontend UI Complete

- ImportProgressDialog with ProgressRing
- ImportResultDialog with stats breakdown
- Toast notifications for errors
- Menu integration (Library → Import → From Mihon/Tachiyomi Backup)
- File dialog with .proto.gz and .tachibk extensions
- Loading states and error recovery

### Key Technical Challenges Solved

1. **BigInt Serialization**: Protobuf uses Long objects, needed toString() conversion
2. **Tag Mapping**: Created comprehensive tag name→ID lookup table
3. **Field Naming**: Mihon uses 'favorite' (boolean), DexReader uses 'isFavourite'
4. **Duplicate Prevention**: Query existing manga/collections before insert
5. **Chapter Metadata**: Cache minimal chapter data for history view

---

## P3-T14 Mihon Export: Implementation Details (22 January 2026)

### Backend Implementation

- Protobuf encoding with mihon.proto schema
- Tag ID→name reverse mapping
- Unix timestamp format (seconds since epoch)
- Collection mapping (DexReader collections → Mihon categories)
- BigInt serialization fix (protobuf.js requires string for int64)
- Gzip compression for file size reduction

### Frontend Integration

- Toast notifications for success/failure
- Menu integration (Library → Export → To Mihon/Tachiyomi Backup)
- File save dialog with .proto.gz extension
- Duplicate toast bug fix (IPC listener cleanup)

### Technical Challenges Solved

1. **BigInt Serialization**: Changed from Number() to toString() for int64 fields
2. **Duplicate Toast Bug**: Added IPC listener cleanup on unmount
3. **Type Definitions**: Corrected MangaDemographic and PublicationStatus types
4. **Collection Mapping**: DexReader collections → Mihon categories with order field

---

## P3-T16 Danger Zone: Implementation Details (22 January 2026)

### Backend Service

- DestructionRepository with transaction safety
- FK constraint handling (disable → clear → enable)
- sqlite_sequence reset for auto-increment
- VACUUM for database optimization
- Dev mode handling (exit vs relaunch)

### Frontend Implementation

- Three operations: Open Settings, Reset to Default, Clear All Data
- Native Electron dialogs for confirmation
- Separate loading indicators per button
- Button variants: accent (orange) for reset, danger (red) for clear

### Post-Implementation Improvements

1. **IPC Wrapper Consistency**: Added settings.load() and settings.save() to preload
2. **IpcResponse Handling**: Fixed 10 calls to check .success and extract .data
3. **Theme Persistence Migration**: Moved from localStorage to settings.json
4. **Zustand Store Cleanup**: Removed persist middleware (redundant layer)

**Architectural Pattern Established**: All IPC calls use wrapped handlers returning IpcResponse<T>

---

## P3-T13 Native DexReader Export (25 January 2026)

### Backend Audit & Fixes (10 Critical Issues)

During implementation, discovered and fixed 10 issues in export service:

1. **Typo**: `inlcludeProgress` → `includeProgress`
2. **Duplicate Block**: Removed duplicate reader settings export logic
3. **App Version**: Now reads from package.json (was hardcoded)
4. **Helper Performance**: Use raw database rows instead of mapped objects
5. **Missing Field**: Added `position` field to CollectionItemQuery
6. **New Methods**: `getLibraryMangaForExport()`, `getChaptersByMangaIds()`
7. **Query Fix**: Chapter query uses Drizzle's `inArray()` (was causing SQL errors)

### Reader Settings Consolidation (Major Architectural Fix)

**Problem Discovered**: Reader settings stored in TWO places (settings.json + database) → inconsistency risk

**Solution**:

- Database is now single source of truth for reader overrides
- Created `MangaOverride` query type with full metadata (title, coverUrl, readerSettings)
- New method: `getAllOverridesWithMetadata()` (joins manga + manga_reader_overrides)
- Settings page loads from database via IPC (replaced JSON parsing)
- Export service reads from database with complete metadata

**Impact**: Eliminated dual-source data problem preventing settings conflicts

### Protobuf Schema Renaming

- All 8 types: `Backup*` → `DexReader*` prefix
- Prevents naming conflicts with Mihon format (also uses Backup\* prefix)
- Types: DexReaderBackup, DexReaderManga, DexReaderChapter, DexReaderCollection, DexReaderCollectionItem, DexReaderMangaProgress, DexReaderChapterProgress, DexReaderMangaReaderOverride

### Export Features

- **File Format**: Protobuf proto3 + gzip → `.dexreader` extension
- **Always Included**: Library (manga + cached chapters)
- **Optional Sections**: Collections, Progress, Reader Settings (user checkboxes)
- **Dialog**: Modal with Fluent UI icons, Windows 11 styling
- **Menu**: Library → Export DexReader Backup (Ctrl+Shift+E)
- **Notifications**: Toast for success/error states

### Technical Details

**Files Created**:

- Backend: Export service, export helper, query types, repository methods
- Frontend: DexReaderExportDialog component + CSS

**Files Modified**:

- `dexreader-export.service.ts` - Fixed all 10 issues
- `reader-settings.repo.ts` - Added `getAllOverridesWithMetadata()`
- `manga.repo.ts` - Added `getLibraryMangaForExport()`
- `chapter.repo.ts` - Added `getChaptersByMangaIds()` with inArray fix
- `manga-override.query.ts` - Extended with metadata
- `manga.mapper.ts` - Added `toMangaOverrideQuery()` mapper
- `LibraryView.tsx` - Export dialog integration
- `SettingsView.tsx` - Database queries replace JSON parsing
- All protobuf type files - Renamed Backup*→ DexReader*

**Result**: Complete native export system. Database is single source of truth for settings. Import (P3-T15) ready for implementation.

---

This file serves as essential reference material for understanding past implementations. Entries are in chronological order for easy navigation. Refer to `active-context.md` for current session information and `project-progress.md` for milestone summaries.

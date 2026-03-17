# DexReader Active Context

**Last Updated**: 17 March 2026
**Current Phase**: Phase 5 - Production Readiness (IN PROGRESS)
**Current Task**: P5-T21 Frontend Refactoring (Phase 6 Accessibility COMPLETE ✅)
**Next**: Phase 7 - Final Cleanup & Documentation or other P5 tasks

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase 4 Status**: COMPLETE - 13/13 tasks (100%) ✅
**Phase 5 Planning**: COMPLETE - Timeline finalized (11 Mar 2026) ✅
**P5-T21 Audits**: COMPLETE - Backend + Frontend audits done (11 Mar 2026) ✅
**Electron Upgrade**: COMPLETE - Upgraded to 41.0.2 (15 Mar 2026) ✅
**Phase 5 Execution**: IN PROGRESS - P5-T21 Frontend Refactoring (Phases 1-6 complete ✅)
**P5-T21 Frontend**: IN PROGRESS - 6/7 phases complete (Phases 1-6 done)
**P5-T21 Phase 6**: COMPLETE - Accessibility improvements finished (17 Mar 2026) ✅
**Timeline**: 6-8 weeks (11 March - 5 May 2026)
**Target**: v1.0 Release Early May 2026 🚀
**Next Steps**: Phase 7 - Final Cleanup & Documentation or continue with other P5 tasks

---

## P5-T21 Frontend Refactoring - Current Progress

**Status**: IN PROGRESS - Phase 2 Complete (12 Mar 2026)
**Plan**: `.github/copilot-plans/p5-t21-frontend-refactoring-plan.md`
**Total Duration**: 20-26 hours across 7 phases

### ✅ Phase 1: Component Extraction (12 Mar 2026) - COMPLETE

**Duration**: ~5 hours (actual)
**Impact**: -230-300 lines of duplicate code

**Components Created**:

1. **EmptyState Component** (3 files)
   - Props: icon, title, message, action, variant ('search' | 'default')
   - Integrated in: LibraryView, HistoryView, DownloadsView, ChapterList, ReaderView, BrowseView (6 files)

2. **LoadingState Component** (3 files)
   - Props: message, size, variant ('spinner' | 'skeleton'), skeletonCount
   - Integrated in: LibraryView, HistoryView, DownloadsView, ReaderView, VerticalScrollDisplay (5 files)
   - Variants: ProgressRing spinner or SkeletonGrid

3. **ErrorState Component** (3 files)
   - Props: title, message, error, variant ('default' | 'offline' | 'critical'), onRetry, retrying, secondaryAction, showTechnicalDetails
   - Integrated in: DownloadsView, ReaderView, BrowseView (offline variant) (3 files)
   - Features: Collapsible technical details, flexible action configuration

**Achievements**:

- 3 new reusable components created (9 files total)
- 16 files updated with component integrations
- Consistent accessibility (ARIA labels, roles, live regions)
- **Bug Fix**: Restored vertical centering in ReaderView error/loading states

**Design Decision**: ErrorState variant="offline" handles offline states (no separate OfflineMessage component)

### ✅ Phase 2: Utility Class System (12 Mar 2026) - COMPLETE

**Duration**: ~2 hours (actual)
**Impact**: Foundation for Phase 3-5, theme-compatible styling

**Deliverables**:

1. **utilities.css Created** (100+ utility classes organized by category)
   - Flexbox utilities (display, direction, wrap, justify, align, sizing)
   - Gap utilities (gap-1 through gap-12 using --space-\* tokens)
   - Spacing utilities (padding & margin, all directions)
   - Text utilities (alignment, color, size, weight)
   - Layout utilities (display, width, height, position, overflow)
   - Background, border, opacity, cursor utilities
   - Accessibility utilities (sr-only for screen readers)

2. **Import Structure Updated**
   - main.tsx: tokens.css → utilities.css → main.css
   - All utilities use design tokens for theme compatibility

3. **Documentation Created**
   - `docs/components/utility-classes.md` (~500 lines)
   - Complete reference with examples, design token mapping, usage guidelines
   - Migration patterns from inline styles to utility classes

**Validation**:

- ✅ All design tokens verified in tokens.css (--space-_, --win-_, --radius-\*)
- ✅ Theme compatibility confirmed (light + dark mode)
- ✅ No CSS specificity conflicts detected
- ✅ No TypeScript compilation errors

**Metrics**:

- 100+ utility classes created
- ~500 lines of documentation
- Phase 3 inline styles migration: 81% complete (192 → 37 instances)

### ✅ Phase 6: Accessibility Improvements (17 Mar 2026) - COMPLETE

**Duration**: ~1 hour (actual - many components already had good accessibility)
**Impact**: Enhanced WCAG 2.1 Level AA compliance across all interactive elements

**Scope**:

1. **Tag Filters Enhanced** (2 files):
   - MangaHeroSection: Added `aria-label` to tag buttons (`Filter by ${tag.name}`)
   - FilterPanel: Added `aria-label` to include/exclude buttons and advanced filters toggle

2. **Chapter Components Enhanced** (1 file):
   - ChapterListHeader: Added `aria-label` to Download All button with chapter count

3. **Manga Cards Enhanced** (1 file):
   - MangaCard: Improved aria-label to include status and progress information
   - Now provides: "{title} by {author} - {status} - {progress}"

**Already Had Good Accessibility** (verified):

- ✅ ChapterListItem: Already had descriptive aria-labels
- ✅ DownloadStatusBadge: Already had contextual aria-labels
- ✅ ReaderView buttons: Settings and zoom buttons already labeled
- ✅ ZoomControlsModal: All zoom controls properly labeled
- ✅ SearchBar: Filter button and clear button already labeled
- ✅ Modal: Close button already labeled
- ✅ Toast: Close button already labeled
- ✅ ContextMenu: All menu items already labeled
- ✅ Sidebar: Navigation items already labeled
- ✅ Button component: Supports aria-label prop throughout

**Results**:

- 4 files updated with new aria-labels
- Comprehensive audit confirms strong accessibility foundation
- All interactive elements now have descriptive labels for screen readers
- FilterPanel toggle now has proper aria-expanded state

**Next Phase**: Phase 7 - Final Cleanup & Documentation (remaining work in P5-T21)

### ✅ Phase 3: Inline Styles Migration (16 Mar 2026) - SUBSTANTIALLY COMPLETE

**Goal**: Replace 192 inline `style={{}}` instances with CSS classes

**Status**: 81% complete (155 of 192 migrated, 37 remaining)

**Files Migrated**:

- ✅ MangaStorageList.tsx (15 instances → MangaStorageList.css)
- ✅ StorageChart.tsx (14 instances → StorageChart.css, 8 dynamic kept)
- ✅ AppearanceSettings.tsx (9 instances → AppearanceSettings.css)
- ✅ ReaderSettingsModal.tsx (8 instances → ReaderSettingsModal.css)
- ✅ ZoomControlsModal.tsx (5 instances → ZoomControlsModal.css)
- ✅ LibraryView.tsx (2 instances → utility classes)
- ✅ StorageManagementSettings.tsx (2 instances → utility classes)
- ✅ Earlier sessions: ~100 instances migrated

**Remaining 37 Inline Styles (Acceptable)**:

- Dynamic positioning (CollectionContextMenu, Popover, Tooltip: ~8 instances)
- Conditional display logic (Reader components: 3 instances)
- Dynamic calculations (StorageChart colors/widths: 8 instances)
- Technical formatting (error pre elements: 2 instances)
- Component-specific measurements (aspectRatio, minWidth: ~5 instances)
- App.tsx modal/overlay styles: 3 instances
- Other positioning/dynamic: ~8 instances

**Decision**: Remaining styles are dynamic/conditional and appropriate to keep inline.

---

### ✅ Phase 4: Component Splitting (16 Mar 2026) - COMPLETE

**Goal**: Break down oversized components (952, 749, 715, 631, 526 lines) into maintainable units
**Pattern**: Subfolder organization with barrel exports (following ChapterList/LibraryView pattern)

#### ✅ Phase 4A: ChapterList Split (12 Mar 2026) - COMPLETE

**Location**: `src/renderer/src/views/MangaDetailView/components/ChapterList/`
**Before**: 526 lines (single file)
**After**: Organized subfolder with 6 files

**Files Created**:

- ChapterList.tsx (main container)
- ChapterListHeader.tsx (header controls)
- ChapterListItem.tsx (individual chapter rendering)
- hooks/useChapterDownloads.ts (download logic)
- hooks/useChapterFilters.ts (filtering logic)
- index.ts (barrel exports)

**User Validation**: "great, no issues found with the splited chapterlist list" ✅

#### ✅ Phase 4B: LibraryView Split (12 Mar 2026) - COMPLETE

**Location**: `src/renderer/src/views/LibraryView/`
**Before**: 952 lines (single file)
**After**: Organized subfolder with components and hooks

**Files Created**:

- components/MangaGrid/
- components/CollectionContextMenu/
- components/EditCollectionModal/
- hooks/useLibraryFilters.ts
- hooks/useCollectionManager.ts
- hooks/useMihonImportExport.ts
- hooks/useDexReaderImportExport.ts

**Status**: Fully functional, all features working ✅

#### ✅ Phase 4C: DownloadsView Split (13 Mar 2026) - COMPLETE

**Location**: `src/renderer/src/views/DownloadsView/`
**Before**: 706 lines (single file)
**After**: **104 lines** in main component (85% reduction!)

**New Structure** (12 files total):

**Components**:

- components/DownloadCard/ (117 lines) - Individual chapter download card with progress bar and actions
- components/DownloadGroup/ (85 lines) - Grouped downloads by manga with expand/collapse
- components/DownloadsHeader/ (139 lines) - Search/filter/sort controls + stats badges + action buttons

**Hooks**:

- hooks/useDownloadData.ts (180 lines) - Data loading, real-time event listeners, auto-refresh
- hooks/useDownloadActions.ts (165 lines) - Action handlers (cancel, retry, remove, bulk operations)
- hooks/useDownloadGroups.ts (98 lines) - Filtering, grouping, sorting logic

**Types**:

- types.ts (37 lines) - FilterOption, SortOption, event interfaces, select options

**Benefits**:

- Main component reduced from 706 → 104 lines (85% reduction)
- Clear separation of concerns (UI, data, actions, grouping)
- Reusable components with well-typed props
- Easier testing and maintenance

### ✅ Phase 5: CSS Deduplication (17 Mar 2026) - COMPLETE

**Goal**: Remove duplicate flexbox patterns from CSS files and replace with utility classes
**Duration**: ~3-4 hours (actual)
**Impact**: ~135 flex patterns removed across 40+ files

**Completion**: All 9 batches processed systematically

**Batches Completed**:

1. ✅ **Batch 1**: Settings Components (11 flex) - GeneralSettings, AppearanceSettings, DownloadSettings, etc.
2. ✅ **Batch 2**: Dialog Components (42 flex) - All modal/dialog components
3. ✅ **Batch 3**: HistoryView (11 flex) - Full view deduplication
4. ✅ **Batch 4**: Form Components (20 flex) - Input, Select, SearchBar, Checkbox
5. ✅ **Batch 6**: UI Components (22 flex) - Toast, Tabs, Switch, Badge, Button, ProgressBar, Sidebar
6. ✅ **Batch 7**: Status/Indicator Components (8 flex) - Various status indicators
7. ✅ **Batch 8**: Storage/Layout Components (10 flex) - StorageChart, MangaStorageList, AppShell, DownloadsView
8. ✅ **Batch 9**: Context Menu + Remaining (11 flex) - ContextMenu, ReaderView, MangaDetailView, Checkbox label, DangerZoneSettings

**Process**:

- CSS: Removed display, flex properties, alignment, gap from selectors
- TSX: Added utility classes (flex, flex-col, items-center, justify-between, gap-*, etc.)
- Build validation after each batch: 100% success rate

**Results**:

- ~135 flex patterns removed from 40+ CSS files
- 40+ TSX files updated with utility classes
- 0 new build errors introduced
- All visual layouts preserved
- Consistent use of utility class system from Phase 2

**Remaining Work (P5-T21)**:

- Phase 6: Accessibility improvements (aria-labels for 100+ clickable elements)
- Phase 7: Code organization cleanup (optional)

**Status**: Fully refactored, dev server running ✅

#### ✅ Phase 4D: ReaderView Split (16 Mar 2026) - COMPLETE

**Location**: `src/renderer/src/views/ReaderView/`
**Before**: 708 lines (single file)
**After**: **521 lines** in main component (26% reduction!)

**New Structure** (6 new files):

**Components Extracted**:

- components/ReaderHeader/ (102 lines) - Title bar with chapter info, navigation, and reading controls
- components/ChapterListSidebar/ (120 lines) - Sidebar with chapter list for quick navigation

**Existing Structure** (already organized):

- components/PageDisplay/ - Single page display mode
- components/DoublePageDisplay/ - Double page spread mode
- components/VerticalScrollDisplay/ - Vertical scrolling mode
- components/EndOfChapterOverlay/ - End of chapter navigation overlay
- hooks/useChapterData.ts - Chapter data loading and management
- hooks/useReaderSettings.ts - Reading mode settings
- hooks/usePagePairs.ts - Page pair generation for double-page mode
- hooks/useReaderNavigation.ts - Navigation handlers
- hooks/useReaderKeyboard.ts - Keyboard shortcuts
- hooks/useReaderZoom.ts - Zoom and pan controls
- hooks/useImagePreload.ts - Image preloading
- hooks/useProgressTracking.ts - Reading progress tracking

**Benefits**:

- Main component reduced from 708 → 521 lines (26% reduction)
- Clear separation: header, sidebar, and display logic
- Reusable header component with well-typed props
- Easier testing and maintenance

**Status**: Fully refactored, dev server running ✅

#### ✅ Phase 4E: View Evaluation (16 Mar 2026) - COMPLETE

**BrowseView** (390 lines): Already lean, uses reusable components throughout (SearchBar, FilterPanel, MangaCard, etc.). No splitting needed ✅

**SettingsView** (520 lines): Already well-organized with 6 section components. Acts as state orchestrator - appropriate pattern ✅

**Decision**: Both views properly structured, no further refactoring needed.

**Phase 4 Summary**:

- ✅ ChapterList: 526 → ~200 lines (62% reduction)
- ✅ LibraryView: 952 → 410 lines (57% reduction)
- ✅ DownloadsView: 706 → 104 lines (85% reduction)
- ✅ ReaderView: 708 → 521 lines (26% reduction)
- ✅ BrowseView & SettingsView: Evaluated and confirmed already optimal

**Total Impact**: ~2,892 lines → ~1,235 lines (57% reduction across 4 major components)

---

### ⏭️ NEXT: Phase 5 - CSS Deduplication (4-5 hours estimated)

**Goal**: Remove duplicate CSS patterns across 36+ CSS files, replace with utility classes
**Status**: PENDING (Phase 3 at 81%, Phase 4 at 100%)

**Target Patterns**:

1. `display: flex` - appears in 36+ CSS files
2. `gap: 8px`, `gap: 16px` - repeated spacing patterns
3. `padding: 16px`, `padding: 12px` - inconsistent container padding
4. `margin: 16px`, `margin: 24px` - scattered margin usage
5. Flexbox combinations: `display: flex; flex-direction: column; gap: X`

**Priority Files** (from audit):

- FilterPanel.css (15+ flex declarations)
- ReaderView.css (20+ flex declarations)
- DownloadsView.css (12+ duplicate patterns)
- Modal.css (repeated flex patterns)
- InfoBar.css (duplicate layouts)
- ChapterList.css (flex combinations)
- MangaDetailView.css (repeated patterns)

**Approach**:

1. **Audit Phase** (1 hour): grep search for patterns, count frequency, document locations
2. **Pattern Replacement** (2-3 hours): Replace with utility classes (.flex, .gap-4, .p-4, etc.)
3. **Testing & Verification** (1 hour): Visual regression, responsive, theme switching
4. **Bundle Size Measurement** (30 min): Compare before/after CSS file sizes

**Success Metrics**:

- 30-40% reduction in CSS line count
- No visual regressions
- 5-10KB CSS size reduction
- Consistent spacing/layout patterns

---

### Remaining Phases (Estimated)

- **Phase 5**: CSS Deduplication (4-5 hours) - NEXT
- **Phase 6**: Accessibility Improvements (3-4 hours) - aria-labels for tags, chapters, cards, icon buttons
- **Phase 7**: Final Cleanup & Documentation (2-3 hours) - Code quality pass, documentation updates

---

## Recent Work: Electron 41 Upgrade (15 March 2026) ✅

**Status**: Successfully upgraded from Electron 38.1.2 → 41.0.2
**Priority**: Security vulnerability mitigation (Dependabot alert)
**Duration**: ~6 hours

**Upgrades**:

- Electron: 38.1.2 → 41.0.2 (3 major versions)
- electron-vite: 4.0.1 → 5.0.0
- better-sqlite3: 12.5.0 → 12.8.0 (rebuilt for new Node.js)
- @types/node: 22.18.6 → 25.5.0

**Issues Encountered & Fixed**:

- **Accent color API change**: Electron 41 changed `systemPreferences.getAccentColor()` from BGR format to RGBA format on Windows
- **Triple invocation**: Added caching to `getSystemAccentColor()` to avoid redundant system calls during startup
- **Node.js version bump**: better-sqlite3 auto-rebuilt successfully for Electron 41's Node.js v22.x

**Testing**: All features tested and verified working (search, read, download, library, settings)

See [archived-milestones.md](./archived-milestones.md#electron-41-upgrade) for detailed implementation notes.

---

## P5-T21 Code Refactoring & Technical Debt Cleanup

**Status**: Frontend IN PROGRESS (Phase 2/7 complete), Backend ready to begin ✅

### Backend Audit Complete (11 Mar 2026)

Audited 207 TypeScript files in `src/main/**/*.ts`:

**Findings**:

- **Dead Code**: 4 files/exports (safe to delete, verified no frontend usage)
  - common-language.enum.ts
  - relationship-types.constant.ts
  - manga-relation-types.constant.ts
  - DEFAULT_CHAPTER_INCLUDES export
- **Naming Inconsistencies**: 30+ instances (mixed -Repo/-Repository, Service patterns)
- **Convention Violations**: 13 camelCase files should be kebab-case
- **Directory Naming**: 5 singular directories → plural (~90 imports affected)
  - repository/ → repositories/
  - schema/ → schemas/
  - entity/ → entities/
  - enum/ → enums/
  - searchparams/ → search-params/

**Execution Plan**:

- **7 Phases**: Dead code → Repository naming → Service naming → File naming → Cleanup repo rename → Directory renaming → Documentation
- **Duration**: 18-24 hours (2-3 days)
- **Plan**: `.github/copilot-plans/p5-t21-code-refactoring-plan.md` (~1400 lines)

### Frontend Audit Complete (11 Mar 2026)

Audited 166 TypeScript/TSX files in `src/renderer/src/`:

**Findings**:

- **Inline Styling**: 192 `style={{}}` instances across 15+ files (needs CSS migration)
- **Oversized Components**: 5 components too large
  - LibraryView: 952 lines → target ~400 lines
  - ReaderView: 749 lines → target ~350 lines
  - DownloadsView: 715 lines → target ~350 lines
  - MangaDetailView: 631 lines → target ~350 lines
  - ChapterList: 526 lines → target ~200 lines
- **Accessibility**: 100+ clickable elements missing descriptive aria-labels
- **CSS Duplication**: 36+ files with repeated `display: flex` patterns (utility class system needed)

**Execution Plan**:

- **6 Phases**: Utility classes → Inline styles migration → Component splitting → CSS deduplication → Accessibility → Final cleanup
- **Duration**: 20-26 hours (3-4 days)
- **Plan**: `.github/copilot-plans/p5-t21-frontend-refactoring-plan.md` (~800 lines)

**Next Decision**: Choose backend OR frontend refactoring first (both independent, can be done in either order)

---

## Phase 4 Complete - Quick Reference

All offline functionality is now production-ready:

1. **P4-T01** (12 Feb) - Download backend foundation (database, service, local-manga:// protocol)
2. **P4-T02** (18 Feb) - Queue manager (concurrent downloads, retry logic, batch operations)
3. **P4-T03** (Discovered) - Downloads directory configuration and path validation
4. **P4-T04** (27-28 Dec) - SQLite database migration (AppData storage)
5. **P4-T05** (Discovered) - Progress tracking with real-time events
6. **P4-T06** (21 Feb) - Download UI (badges, dialogs, status indicators)
7. **P4-T07** (Discovered) - Batch download support (queue multiple chapters)
8. **P4-T08** (Discovered) - Offline mode detection (connectivity store + status bar)
9. **P4-T09** (Discovered) - Storage cleanup (delete chapters with file removal)
10. **P4-T10** (3-5 Jan) - Reading statistics and history tracking
11. **P4-T11** (27 Feb) - Storage management UI (visualization, bulk deletion)
12. **P4-T13** (4 Mar) - Unfavourite dialog with download handling
13. **P4-T15** (10 Mar) - Cache management UI (cover + metadata cleanup)

**See**: [archived-milestones.md](./archived-milestones.md) for detailed implementation notes on all tasks.

---

## Next Steps - Phase 5 Planning

**Recommended Focus Areas**:

1. **Testing & QA**:
   - Comprehensive E2E testing (download flows, offline reading, storage management)
   - Performance profiling (download concurrency, database queries, UI responsiveness)
   - Cross-platform testing (Windows/macOS behavior validation)
   - Accessibility audit (WCAG 2.1 compliance verification)

2. **Performance Optimization**:
   - Database query optimization for large libraries (1000+ manga)
   - Memory leak detection and prevention
   - Download queue performance tuning
   - Image loading optimization

3. **Polish & Refinements**:
   - UI/UX improvements based on Phase 4 learnings
   - Error message refinement
   - Loading state consistency
   - Keyboard shortcut completion

4. **Stability Improvements**:
   - Bug fixing from Phase 4 usage
   - Edge case handling
   - Network error recovery
   - Crash reporting setup

**See**: [project-progress.md](./project-progress.md) Phase 5 section for full planning details.

---

## Recent Work - Last 2 Weeks

### P4-T15: Cache Management UI (10 Mar 2026) ✅

**Summary**: Comprehensive cache management in Settings > Storage tab with cover cache controls and two-tier metadata cleanup system.

**Key Features**:

- **Cover Cache Management**: Size limit dropdown (10MB-500MB or Unlimited), real-time usage display with percentage bar, clear all function
- **Metadata Cache**: Statistics breakdown (total/library/downloaded/browsing/old), two cleanup options (gentle 90-day vs aggressive immediate)
- **Backend**: 4 new IPC handlers (get-stats, clear-cache, optimize-db, set-limit), single optimized query for statistics
- **Bug Fix**: Fixed EPERM error in cover cache deletion (added directory check before unlink)

**Files Modified** (9 files):

- Backend: storage.handler.ts, manga.repo.ts, destruction-repo.ts, disk-cache.util.ts, registry.ts
- Preload: index.d.ts, index.ts (Storage interface)
- Frontend: CacheManagementSettings.tsx (NEW ~320 lines), SettingsView.tsx

**Design Decisions**:

- **Two-tier cleanup**: Gentle (90 days, respects history) vs Aggressive (immediate, maximum space)
- **Cover limit exposed**: Previously hidden, now user-facing with dropdown (default 100MB)
- **Protected data**: Library and downloaded manga never deleted, clearly labeled with icons (📚/⬇️)
- **No VACUUM UI**: Can't reliably estimate space savings beforehand, deferred to automatic background task

**Result**: Production-ready cache management. Users control cover allocation, view metadata stats, and clean browsing cache with granular control.

---

### P4-T13: Unfavourite Dialog (4 Mar 2026) ✅

**Summary**: Smart unfavourite workflow that detects downloads and offers granular cleanup options.

**Key Features**:

- Context-aware: Simple confirmation if no downloads, 4-choice dialog if downloads exist
- Options: (1) Remove library only, (2) Delete downloads only, (3) Remove everything, (4) Cancel
- Centralized handler utility (unfavouriteHandler.ts) for consistent behavior across views
- Download stats API (getDownloadStats) returns chapter count and storage size
- Shared formatBytes utility (replaced 3 duplicates)

**Integration**: LibraryView, MangaDetailView, BrowseView all use centralized handler with refresh on success

**Discovery**: Native Electron dialogs have fixed-width titles - place long manga titles in `detail` field, not `message`

**Result**: Users can unfavourite with clear understanding of download impact. See [archived-milestones.md](./archived-milestones.md#p4-t13) for details.

---

### P4-T11: Storage Management UI (27 Feb 2026) ✅

**Summary**: Complete storage visualization and bulk cleanup interface in Settings > Storage tab.

**Key Features**:

- Dual-level bar chart (disk context + manga breakdown)
- Sortable manga list with bulk selection (4 sort modes)
- Safe deletion workflow with native confirmation dialogs
- Menu integration (Tools → Manage Storage, Ctrl+Shift+M)
- Deep linking via URL params (?tab=storage)

**Components** (5 files, ~740 lines): StorageChart, MangaStorageList, StorageManagementSettings

**Design**: Windows 11 style, borderless Steam-inspired list, smart labeling (>8% segments only)

**Result**: Users visualize storage usage, sort by size/title, bulk-delete with confirmation. See [archived-milestones.md](./archived-milestones.md#p4-t11) for details.

---

## Phase 5 Planning Complete ✅

**Planning Completed**: 11 March 2026
**Timeline**: 6-8 weeks (11 March - 5 May 2026)
**Total Tasks**: 21 tasks (192-236 hours estimated)
**v1.0 Release Target**: Early May 2026

**Key Decisions**:

- ✅ Code signing DEFERRED ($500-600/year saved, not needed for small user base)
- ✅ Testing philosophy: Mock MangaDex API, test our application logic only
- ✅ Task order: Refactor → Optimize → Build → Test → Document (clean code first!)

**Phase 5 Structure**:

- **Week 1**: Code Refactoring (P5-T21) - Clean foundation before optimization
- **Week 2-3**: Performance Optimization (P5-T01 to P5-T05) - Database, memory, download, UI
- **Week 3-4**: Build Pipeline (P5-T06 to P5-T10, P5-T08) - CI/CD, releases, auto-updates
- **Week 5-6**: Testing & QA (P5-T11 to P5-T18) - Unit, integration, accessibility, logging
- **Week 7-8**: Documentation & Release (P5-T19, P5-T20) - User guide, dev docs, v1.0 launch

**Planning Documents**:

- [phase5-optimization-deployment-plan.md](../../copilot-plans/phase5-optimization-deployment-plan.md) - Detailed task specifications
- [phase5-timeline-summary.md](../../copilot-plans/phase5-timeline-summary.md) - Week-by-week timeline with milestones
- [phase5-task-checklist.md](../../copilot-plans/phase5-task-checklist.md) - Progress tracking checklist

**Next Action**: Begin P5-T21 (Code Refactoring & Technical Debt Cleanup, 12-16 hours)

---

## ⚠️ Known Issues & Strategic Decisions

### drizzle-kit esbuild Vulnerability (Moderate Severity)

**Issue**: drizzle-kit@0.31.8 has transitive dependency on vulnerable esbuild@0.18.20 via @esbuild-kit/core-utils

- **CVE**: GHSA-67mh-4wv8-2f99 (esbuild dev server vulnerability)
- **Severity**: Moderate (CVSS 5.3)
- **Scope**: Development dependency only (not shipped to users)
- **Attack Vector**: Requires malicious website to exploit local dev server while drizzle-kit is running

**Decision**: **Accept risk, await drizzle-kit v1.0 stable release**

**Rationale**:

1. **Dev-only**: drizzle-kit is devDependency, never bundled into production app
2. **Low exploitability**: Requires active attack on local dev machine during drizzle-kit execution
3. **Strategic timing**: v1.0 is in beta, will likely fix this + introduce breaking changes
4. **Efficiency**: Bundling vulnerability fix with v1.0 migration work (avoid double work)

**Mitigation**:

- Created `.npmrc` with `audit-level=high` to suppress moderate warnings
- Documented decision for future reference
- Not running public-facing esbuild dev servers

**Action Plan**:

- Monitor: [Drizzle ORM Issues page](https://github.com/drizzle-team/drizzle-orm/issues)
- Upgrade to v1.0.0 when stable (TBD)
- Address breaking changes and vulnerability in single migration
- Re-test all migration workflows post-upgrade

**Date Logged**: 6 January 2026

---

## Technical Context

### Architecture Summary

**Stack**: Electron 38.1.2 + React 19 + TypeScript 5.9.2 + Drizzle ORM + SQLite
**IPC Pattern**: All handlers return `IpcResponse<T>` with success/data/error structure
**Persistence**: Settings.json (single source of truth), SQLite database (user data)
**Theme System**: Data-theme attribute + CSS custom properties, respects OS preference
**State Management**: Zustand stores (runtime only), no localStorage

### Critical Patterns Established

**IPC Handlers**:

1. Wrapped in preload bridge with type-safe methods
2. Always return `IpcResponse<T>` objects
3. Consumed with `.success` check and `.data` extraction

**Settings Persistence**:

- Single source: `settings.json` in AppData
- All preferences stored/loaded via IPC: `settings.load()`, `settings.save()`
- Theme synced with OS via `nativeTheme.themeSource`

**Database**:

- 9 tables: manga, chapter, collections, collection_items, manga_progress, chapter_progress, chapter_downloads, reader_overrides, read_history
- Drizzle ORM with type-safe queries
- Foreign key constraints enabled
- Migrations in `src/main/database/migrations/`
- Latest migration: 0002_add_newcolumntochapterdownload.sql (adds downloads_base_path + file_path for path resilience)

### Recent Architectural Decisions

**Backup/Restore Strategy**:

- Native format: `.dexreader` (protobuf + gzip)
- Mihon compatibility: `.tachibk` (protobuf + gzip)
- Selective backup: Library (always) + optional sections (collections, progress, settings)
- Import strategies: UPSERT for manga/chapters, SKIP+MERGE for collections

**Accessibility Standards**:

- WCAG 2.1 Level AA compliance achieved
- Sr-only headings for screen reader navigation
- Live regions for dynamic content announcements
- Honest alt text approach for visual content

**See**: [system-patterns.md](./system-patterns.md) for detailed architectural patterns, [tech-context.md](./tech-context.md) for technology stack details

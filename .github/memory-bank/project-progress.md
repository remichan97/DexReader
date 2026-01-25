# DexReader Project Progress & Timeline

**Purpose**: This file tracks completed milestones with concise summaries. For detailed implementation notes, see [archived-milestones.md](./archived-milestones.md).

**Project Start**: 23 November 2025
**Current Phase**: Phase 3 - User Experience Enhancement (P3-T13 Complete ✅, P3-T15 Ready)
**Last Updated**: 25 January 2026

---

## Project Overview

**DexReader** is a desktop manga reader for MangaDex built with Electron + React + TypeScript.

**Core Technologies**: Electron 34, React 19, TypeScript 5.7, Drizzle ORM, SQLite
**Content Source**: MangaDex public API (read-only, no auth required)
**Storage Strategy**: SQLite database (AppData), user-configured downloads directory

---

## Current Status: Phase 3 In Progress (84.2% Complete)

**Phase Progress**: Phase 2 Complete (11/11) | Guerilla Refactoring Complete | 16/19 Phase 3 tasks
**Next Tasks**: P3-T15 (Native import) OR P3-T17-T18 (Date format/accessibility)
**Current Focus**: Native DexReader export COMPLETE ✅, import ready to implement

---

## Recent Milestones

### P3-T13 Native DexReader Export (25 January 2026) ✅

**Duration**: ~5 hours | **Status**: Complete

**Summary**: Implemented native export functionality with protobuf schema and selective backup options.

**Key Outcomes**:

- Backend audit revealed and fixed 10 critical issues (typos, duplicates, missing fields)
- Protobuf schema renamed: Backup* → DexReader* (8 types) to avoid Mihon conflicts
- **Critical Fix**: Consolidated reader settings - database now single source of truth (was stored in JSON + database)
- Export dialog with Modal wrapper, Fluent UI icons, Windows 11 styling
- LibraryView integration with menu events (Ctrl+Shift+E), file save dialog, toast notifications
- Settings page optimized: database queries replace JSON parsing, batch operations for Clear All

**Export Options**: Library (always), Collections (optional), Progress (optional), Reader Settings (optional)
**File Format**: .dexreader (protobuf proto3 + gzip compression)

**Technical Debt Eliminated**: Dual-source reader settings problem, Settings page inefficiency, missing metadata in exports

---

- Prevents naming conflicts with Mihon backup format
- Types: DexReaderBackup, DexReaderManga, DexReaderChapter, DexReaderCollection, DexReaderCollectionItem, DexReaderMangaProgress, DexReaderChapterProgress, DexReaderMangaReaderOverride

3. ✅ **Reader Settings Data Consolidation**:
   - **Problem Solved**: Reader settings were stored in TWO places (JSON + database), causing inconsistency
   - Created `MangaOverride` query type with full metadata
   - Database now single source of truth for reader overrides
   - Settings page loads from database via IPC
   - Export service reads from database with metadata

4. ✅ **Export Dialog (Frontend)**:
   - Modal wrapper with full focus trapping
   - Fluent UI icons (Library20Regular, Folder20Regular, BookOpen20Regular, Settings20Regular)
   - Windows 11 design tokens
   - Checkbox options for optional sections
   - Toast notifications for success/failure

5. ✅ **LibraryView Integration**:
   - Menu event listener for `export-library`
   - File save dialog with `.dexreader` extension
   - Loading state management

6. ✅ **Settings Page Improvements**:
   - Removed duplicate helper function
   - Database query replaces JSON file reading
   - "Clear All Overrides" uses single IPC call (not loop)

**Technical Implementation**:

- Format: Protobuf + gzip compression
- File extension: `.dexreader`
- Always includes: Library (manga + chapters)
- Optional: Collections, Progress, Reader Settings
- Backend: Complete service + helpers + repository methods
- Frontend: Modal dialog + LibraryView integration

**Files Modified/Created**:

- Backend: Export service, helpers, repositories, queries, mappers
- Frontend: DexReaderExportDialog component, LibraryView integration
- Protobuf: 8 schema files renamed
- Database: New query methods with metadata joins

**Result**: Complete native export system ready for production use. Import (P3-T15) ready for implementation.

---

### P3-T01 Library Features (3-5 January 2026) ✅

**Duration**: ~12-13 hours | **Status**: Complete

**Summary**: Implemented complete library management system with collections, favorites, and update checking.

**Key Features**:

- Collections system: Create/edit/delete, batch add/remove, context menus, pre-populated states
- Update checker: Rate-limited service, visual indicators (animated dots), batch processing
- Library UI: Favorites toggle, search, grid layout, opportunistic metadata caching
- Progress tracking fixes: 9 regression issues resolved (display refresh, reader position, chapter indicators, statistics accuracy)

**Technical Foundation**: Repositories (Manga, ReadHistory, Collection), IPC handlers, preload types, library store, chapter caching system

**Result**: Complete library management with ~40% of infrastructure work enabling future Phase 3 tasks.

---

### Progress Tracking Foundation (3-5 January 2026) ✅

**Summary**: Resolved 9 progress tracking regressions that turned into foundational P3-T01 data layer work.

**Key Fixes**:

- Progress display refresh, reader position persistence, chapter list indicators
- Chapter metadata caching system, reading statistics accuracy
- Language badges in history view, larger empty state icons (48px)

**Outcome**: All progress tracking features working correctly, infrastructure for P3-T01 established.

---

**Technical Improvements**:

- **Database Schema**: Extended with currentPage and completed fields for chapter-level tracking
- **Chapter Caching**: Automatic metadata persistence (chapterId, title, number, volume, language, scanlationGroup, publishAt, externalUrl)
- **Statistics Accuracy**: Now reflects all reading progress with correct page counting
- **Type Safety**: Proper type extraction pattern for Window interface types
- **UI Polish**: Language badges, larger empty state icons, proper page progress display

**Testing Results**:

- ✅ Progress saves correctly during reading
- ✅ Progress displays accurately in detail view chapter list
- ✅ Reader respects saved page position and chapter boundaries
- ✅ History view shows complete chapter metadata
- ✅ Statistics reflect actual reading activity
- ✅ Language badges display localized translation names
- ✅ Empty states visually prominent with 48px icons
- ✅ No TypeScript errors, clean build

**Status**: All regressions resolved, progress tracking fully functional

---

### Guerilla Database Migration (27-28 December 2025) ✅

**Duration**: ~13.5 hours | **Status**: Complete (3/3 phases)

**Summary**: Migrated from JSON storage to SQLite with Drizzle ORM, eliminating 2MB limit and 1000 override cap.

**Key Achievements**:

- **Phase 1** (4h): Database infrastructure - 9 tables, WAL mode, migrations, build integration
- **Phase 2** (1.5h): Reader settings migration with FK constraints
- **Phase 3** (8h): Progress migration with CQRS-inspired structure, lean entities, repository pattern

**Technical Foundation**: SQLite database (AppData), Drizzle ORM, normalized schema, CRUD repositories, minimal manga caching

**Outcome**: Foundation for Phase 3 library features, ~13 hours work saved for P3-T01.

---

### Guerilla Backend Refactoring (Before 22 December 2025) ✅

**Duration**: ~12 hours | **Status**: Complete (4/4 phases)

**Summary**: Organized backend into maintainable domain modules with proper validation.

**Key Results**:

- **Phase 0**: Settings IPC with validation
- **Phase 1**: main/index.ts - 357 → 78 lines (78% reduction)
- **Phase 2**: IPC handlers - 347 → 32 lines registry (91% reduction), 7 domain handlers
- **Phase 3**: menu.ts - 6 menu files + orchestrator
- **Phase 4**: Settings validation - 201 lines validator with type guards

**Outcome**: Clean separation of concerns, all files under 100 lines, comprehensive validation.

---

### Guerilla Frontend Refactoring (22 December 2025) ✅

**Duration**: ~20 hours | **Status**: Complete (3/3 phases)

**Summary**: Extracted large view files into focused components and custom hooks.

**Key Results**:

- **Phase 1**: ReaderView - 2,189 → 753 lines (68.6% reduction) - 8 hooks, 4 display components
- **Phase 2**: MangaDetailView - 1,104 → 439 lines (60.2% reduction) - 5 section components
- **Phase 3**: SettingsView - 803 → 448 lines (44.2% reduction) - 4 settings sections

**Outcome**: All files under 500 lines, clear separation of concerns, maintainable codebase.

---

    - ✅ Configured build system to bundle migrations (Vite plugin, asarUnpack)

- **Files Created**:

### P3-T12 Mihon Import (14 January 2026) ✅

**Duration**: ~6 hours | **Status**: Complete

**Summary**: Implemented complete Mihon/Tachiyomi backup import functionality.

**Key Features**: Protobuf decoding with BigInt/Long handling, tag name→ID conversion (76 mappings), favorite field detection, timestamp conversion, double-import prevention, batch operations, progress tracking with chapter metadata caching

**UI Components**: ImportProgressDialog (ProgressRing), ImportResultDialog (stats), toast notifications, menu integration

**Outcome**: Full compatibility with Mihon backups, allows users to migrate from Tachiyomi/Mihon to DexReader.

---

### P3-T14 Mihon Export (22 January 2026) ✅

**Duration**: ~7 hours | **Status**: Complete

**Summary**: Implemented export to Mihon/Tachiyomi backup format for cross-compatibility.

**Key Features**: Protobuf encoding, tag ID→name reverse mapping, Unix timestamp format, collection→category mapping, gzip compression

**Technical Fixes**: BigInt serialization (protobuf.js requires string for int64), duplicate toast bug (IPC listener cleanup), type definition corrections

**Outcome**: Users can export DexReader library to Mihon-compatible .proto.gz format.

---

### P3-T16 Danger Zone (22 January 2026) ✅

**Duration**: ~2 hours | **Status**: Complete

**Summary**: Implemented "Danger Zone" settings section with three critical operations.

**Features**: Open Settings File (shell.openPath), Reset to Default (restores defaults + reload), Clear All Data (DB clear + settings reset + restart)

**Backend**: DestructionRepository with transaction safety, FK constraint handling, sqlite_sequence reset, VACUUM

**Post-Implementation Improvements**: IPC wrapper consistency (10 calls fixed), theme persistence migration (localStorage → settings.json), Zustand persist middleware removed

**Architectural Pattern**: Established IpcResponse<T> pattern for all IPC calls.

---

### P2-T11 Reading Modes (20 December 2025) ✅

**Summary**: Implemented three reading modes with per-manga override settings.

**Modes**: Single Page, Double Page, Vertical Scroll
**Features**: Per-manga overrides, mode toggle in reader, settings persistence

**Outcome**: Flexible reading experience tailored to manga content type.

---

## Historical Timeline Summary

### Phase 2 Complete (6-24 December 2025) ✅

**Duration**: 4-5 weeks | **Tasks**: 11/11 complete (100%)

**Key Milestones**:

- P2-T01: MangaDex API client (9 steps, 8 critical fixes, 800+ lines documentation)
- P2-T02: Search interface (FilterPanel, InfiniteScroll, 76 tag system)
- P2-T03: Manga Detail View (hero section, chapter list, external links)
- P2-T07: Online reader with streaming (937 lines, image fetching via mangadex:// protocol)
- P2-T08: Zoom/pan/fit controls (fit modes, 25%-400% zoom, GPU transforms)
- P2-T10: Progress tracking (~24h total, complete refactor for per-chapter tracking)
- P2-T11: Reading modes (single, double, vertical scroll)

**Outcome**: Complete manga reading experience with MangaDex integration.

---

### Phase 1 Complete (24 November - 6 December 2025) ✅

**Duration**: 2 weeks | **Tasks**: 9/9 complete (100%)

**Key Deliverables**:

- Application layout and menu system
- Base UI component library (17 components)
- State management (Zustand, 4 stores)
- Restricted filesystem access (AppData + downloads directory)
- IPC messaging architecture
- Error handling system (boundaries, offline status, error catalog)

**Outcome**: Core application architecture established.

---

### Phase 0 Foundation (23 November 2025) ✅

**Duration**: 1 day

**Deliverables**: Project structure, build tools, documentation system, coding standards, Git repository

**Outcome**: Development environment ready.

---

- No more direct fileSystem.writeFile() calls
- All settings go through validated backend
- [✅] **Testing**: Verify settings integration works correctly - **COMPLETE**

**Frontend Refactoring** - ✅ COMPLETE:

- [✅] Phase 1: ReaderView extraction (10-12 hours) - **COMPLETE (22 Dec 2025)**
- [✅] Phase 2: MangaDetailView extraction (4-5 hours) - **COMPLETE (22 Dec 2025)**
- [✅] Phase 3: SettingsView extraction (3-4 hours) - **COMPLETE (22 Dec 2025)**
- [⏳] Phase 4: General improvements (6-8 hours) - **DEFERRED**

**Backend Refactoring** - COMPLETE ✅:

- [✅] Phase 0: Settings IPC integration (~2 hours) - **COMPLETE (Before 22 Dec 2025)**
- [✅] Phase 1: main/index.ts extraction (~3 hours) - **COMPLETE (Before 22 Dec 2025)**
  - window.ts (46 lines), app-lifecycle.ts (20 lines)
  - Result: 357 → 78 lines (78% reduction)
- [✅] Phase 2: IPC handler organization (~3 hours) - **COMPLETE (Before 22 Dec 2025)**
  - 7 domain handlers created
  - Result: 347 → 32 lines registry (91% reduction)
- [✅] Phase 3: menu.ts refactoring (~2 hours) - **COMPLETE (Before 22 Dec 2025)**
  - 6 menu files + orchestrator
  - Clean domain separation
- [✅] Phase 4: Settings validation (~3 hours) - **COMPLETE (Before 22 Dec 2025)**
  - types.validator.ts (201 lines)
  - Field and section validation, type guards, enum checks
- [⏳] Phase 5: General improvements (1 hour) - **OPTIONAL (Deferred)**

**Success Criteria**:

- ✅ No direct file writes from SettingsView (all via IPC)
- ✅ All files under 500 lines
- ✅ Settings validation implemented (types, ranges, sanitization)
- ✅ Clear separation of concerns throughout codebase
- ✅ Type safety improved (`any` reduced by 80%)
- ✅ Zero TypeScript errors
- ✅ All features tested and working

**Documentation**:

- Frontend Plan: `.github/copilot-plans/guerilla-frontend-refactoring-plan.md`
- Backend Plan: `.github/copilot-plans/guerilla-backend-refactoring-plan.md`

---

### Phase 3: User Experience Enhancement 🔵

**Duration**: 3-4 weeks
**Status**: In Progress (16/19 tasks complete)
**Started**: January 2026
**Target Completion**: February 2026

**Objectives**:

- Implement local library management (favorites, bookmarks)
- Add manga discovery and filtering
- Implement advanced search with tags/filters
- Enhance UI/UX design
- Add theming support (light/dark mode)
- Implement keyboard shortcuts and user preferences
- Add downloads directory configuration
- Add library import/export (Mihon/Tachiyomi compatibility)

**Deliverables**:

- Local library system (favorites, reading lists, bookmarks)
- Advanced search with filters (tags, genres, authors, status)
- Manga discovery and browsing UI
- Polished UI with theme support (light/dark mode)
- Comprehensive keyboard shortcuts
- Settings/preferences panel with downloads directory configuration
- Library import/export functionality (native DexReader + Mihon/Tachiyomi formats)

**Key Technical Tasks**:

- [✅] **P3-T01**: Library Features (Favorites, Collections, History) - **COMPLETE** (5 Jan 2026)
- [✅] **P3-T02**: Metadata storage for bookmarked manga - **COMPLETE** (5 Jan 2026)
- [✅] **P3-T03**: Local reading lists management - **COMPLETE** (5 Jan 2026)
- [✅] **P3-T04**: Add manga to favorites functionality - **COMPLETE** (5 Jan 2026)
- [✅] **P3-T05**: Create advanced search UI with tag filters - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T06**: Implement content rating filters - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T07**: Add popular/trending manga discovery - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T08**: Theme system (light/dark) - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T09**: Settings/preferences UI - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T10**: Downloads directory configuration - **COMPLETE** (Pre-Phase 3)
- [✅] **P3-T11**: Keyboard Shortcuts Help Dialog - **COMPLETE** (6 Jan 2026, 2 hours)
- [✅] **P3-T12**: Implement library import from Mihon/Tachiyomi backup (protobuf) - **COMPLETE** (14 Jan 2026, ~6 hours)
- [✅] **P3-T13**: Implement library export to native DexReader format (protobuf) - **COMPLETE** (25 Jan 2026, ~5 hours)
- [✅] **P3-T14**: Implement library export to Mihon/Tachiyomi format (cross-compatibility, protobuf) - **COMPLETE** (22 Jan 2026, ~7 hours)
- [⏳] **P3-T15**: Add native DexReader backup restore functionality (protobuf) - **PLANNED** (Est. 6-8 hours)
- [✅] **P3-T16**: Add "Danger Zone" settings section (Open Settings, Reset to Default, Clear Data) - **COMPLETE** (22 Jan 2026, ~2 hours)
- [⏳] **P3-T17**: Implement date format settings - **PENDING**
- [⏳] **P3-T18**: Improve accessibility (ARIA labels, etc.) - **PENDING**
- [✅] **P3-T19**: Fluent UI icons - **COMPLETE** (Pre-Phase 3)

**Phase 3 Progress**: 16/19 tasks complete (84.2%)

**Notes**:

- P3-T02: Covered by opportunistic caching in P3-T01 (saves metadata on detail view)
- P3-T03: Collections system from P3-T01 serves as reading lists
- P3-T04: Integrated into P3-T01 library view
- P3-T05: FilterPanel has comprehensive tag filtering (include/exclude, AND/OR, grouped by category)
- P3-T06: FilterPanel has content rating checkboxes (Safe, Suggestive, Erotica, Pornographic)
- P3-T07: BrowseView loads popular manga by default (sorted by follows)
- P3-T08-T10, P3-T19: Already implemented during Phase 2 refactoring
- P3-T11: COMPLETE - All 38 shortcuts implemented and working. Help dialog implemented with unicode arrows + aria-labels for accessibility. Triggered via Help menu or Ctrl+/
- P3-T12: COMPLETE - Full Mihon/Tachiyomi import working. Imports manga metadata, collections, reading progress (with timestamps), chapter metadata for history view. Tag name→ID conversion, BigInt/Long handling, favorite field detection, double-import prevention. UI with progress dialog, result dialog, and toast notifications
- P3-T13: COMPLETE ✅ (25 Jan 2026, ~5 hours) - Native DexReader export implemented with protobuf schema and selective backup options. Backend audit fixed 10 critical issues. Protobuf schema renamed (Backup* → DexReader*) to avoid Mihon conflicts. **Major Fix**: Consolidated reader settings - database now single source of truth. Export dialog with Modal wrapper, Fluent UI icons, Windows 11 styling. Settings page optimized with database queries replacing JSON parsing. File format: .dexreader (protobuf proto3 + gzip). See recent milestones section for full implementation details.
- P3-T14: COMPLETE ✅ - Full Mihon/Tachiyomi export working. Backend service with protobuf encoding/gzip compression, tag ID→name conversion, Unix timestamp format, collection mapping. Frontend with toast notifications. Fixed: BigInt serialization issue (protobuf.js requires string for int64), duplicate toast bug (IPC listener cleanup), type definition corrections. All features tested and verified working. Estimated time: ~7 hours (22 Jan 2026)
- P3-T15: PLANNED ⏳ (22 Jan 2026) - Native DexReader import with auto-detection. Import confirmation dialog shows backup contents (no user selection needed). Merge strategy: skip duplicates, add new data. Collection ID mapping handles conflicts. Backend: import service + helper with validation, IPC handlers, cancellation support. Frontend: import confirmation dialog, menu integration (Ctrl+Shift+I). Schema versioning for compatibility. Comprehensive plan document: `.github/copilot-plans/P3-T13-T15-native-backup-restore-plan.md`. Estimated: 6-8 hours. Ready for implementation.
- P3-T16: COMPLETE ✅ - "Danger Zone" settings section implemented in Advanced tab with 3 operations: (1) Open Settings File (shell.openPath to settings.json), (2) Reset to Default (restores defaults + page reload), (3) Clear All Data (destructionRepo clears DB + resets settings + app restart). Backend uses DestructionRepository with transaction safety, FK constraint handling, sqlite_sequence reset, and VACUUM. Native Electron dialogs for confirmation. Dev mode handling (exit vs relaunch). Button states with separate loading indicators. Uses app's Button component with accent (orange) and danger (red) variants. **Post-implementation improvements**: (1) IPC wrapper consistency - added settings.load() and settings.save() to preload bridge, (2) IpcResponse handling - fixed 10 calls (7 in SettingsView, 3 in DangerZoneSettings) to properly check .success and extract .data, (3) Theme persistence migration - moved from localStorage to settings.json for single source of truth, (4) Zustand store cleanup - removed persist middleware (redundant layer). Architectural pattern established: all IPC calls use wrapped handlers returning IpcResponse<T>. Estimated time: ~2 hours (22 Jan 2026)
- P3-T17: Date format settings - planned but not yet implemented
- P3-T18: Some ARIA labels present (reader, buttons, selects), comprehensive audit pending
- Additional UX features complete but not in original task list: Zoom/fit modes (ZoomControlsModal), progress indicators (ProgressRing/ProgressBar), error/empty states (ErrorBoundary), context menus (LibraryView), download UI (DownloadsView), history UI (HistoryView)

---

### Phase 4: Offline Functionality (Planned) ⚪

**Duration**: 4-5 weeks
**Status**: Not Started
**Target Start**: March 2026
**Target Completion**: April 2026

**Objectives**:

- Implement explicit chapter downloads (user-initiated only)
- Create local chapter storage system (user-configured downloads directory)
- Add offline reading mode for downloaded content
- Implement download management UI
- Add reading statistics and history
- Support downloading individual chapters or entire manga
- Respect filesystem restrictions (downloads directory only)

**Deliverables**:

- Explicit chapter download manager with queue system
- Local storage for user-downloaded chapters (user-configured downloads directory)
- Offline reading mode for downloaded content
- Download progress and management UI (per-chapter and bulk)
- Local library database in AppData (SQLite/IndexedDB)
- Reading statistics and history tracking
- Download directory management with path validation

**Key Technical Tasks**:

- [⚪] **P4-T01**: Implement explicit download system (user-initiated only)
- [⚪] **P4-T02**: Create download queue manager for chapters
- [⚪] **P4-T03**: Add local image storage system (user-configured downloads directory)
- [⚪] **P4-T04**: Implement library database in AppData (SQLite/IndexedDB)
- [⚪] **P4-T05**: Create download progress tracking (per-chapter and bulk)
- [⚪] **P4-T06**: Build download management UI (download chapter/manga buttons)
- [⚪] **P4-T07**: Add batch downloads (entire manga or selected chapters)
- [⚪] **P4-T08**: Implement offline mode detection and switching
- [⚪] **P4-T09**: Create storage management for downloaded chapters and covers
- [⚪] **P4-T10**: Add reading statistics database (AppData)
- [⚪] **P4-T11**: Implement storage quota management and cleanup
- [⚪] **P4-T12**: Validate all file operations respect path restrictions

---

### Phase 5: Testing & Optimization (Planned) ⚪

**Duration**: 3-4 weeks
**Status**: Not Started
**Target Start**: April 2026
**Target Completion**: May 2026

**Objectives**:

- Comprehensive testing (unit, integration, E2E)
- Performance optimization
- Bug fixing and stability improvements
- Cross-platform testing
- Memory leak detection and fixes
- Accessibility audit

**Deliverables**:

- Complete test suite (>80% coverage)
- Performance benchmarks
- Cross-platform compatibility verification
- Bug-free stable build
- Accessibility compliance

**Key Technical Tasks**:

- [⚪] **P5-T01**: Set up Vitest for unit testing
- [⚪] **P5-T02**: Implement React Testing Library tests
- [⚪] **P5-T03**: Add Playwright E2E tests
- [⚪] **P5-T04**: Performance profiling and optimization
- [⚪] **P5-T05**: Memory leak detection
- [⚪] **P5-T06**: Cross-platform testing (Win/Mac/Linux)
- [⚪] **P5-T07**: Accessibility testing
- [⚪] **P5-T08**: Security audit

---

### Phase 6: Beta Release & Auto-Updates (Planned) ⚪

**Duration**: 2-3 weeks
**Status**: Not Started
**Target Start**: May 2026
**Target Completion**: June 2026

**Objectives**:

- Implement auto-update system
- Set up beta distribution
- Create release pipeline
- Implement crash reporting
- Set up analytics (optional)
- Beta testing with users

**Deliverables**:

- Auto-update functionality
- Beta release packages
- CI/CD pipeline
- Crash reporting system
- Beta feedback collection

**Key Technical Tasks**:

- [⚪] **P6-T01**: Configure electron-updater
- [⚪] **P6-T02**: Set up update server
- [⚪] **P6-T03**: Create release signing process
- [⚪] **P6-T04**: Implement crash reporting (Sentry, etc.)
- [⚪] **P6-T05**: Set up CI/CD (GitHub Actions)
- [⚪] **P6-T06**: Create beta distribution channel
- [⚪] **P6-T07**: Implement feedback collection
- [⚪] **P6-T08**: Write release notes

---

### Phase 7: Public Release (Planned) ⚪

**Duration**: 1-2 weeks
**Status**: Not Started
**Target Start**: June 2026
**Target Completion**: June 2026

**Objectives**:

- Final polish and bug fixes
- Create user documentation
- Prepare marketing materials
- Set up distribution channels
- Official public release

**Deliverables**:

- v1.0.0 production release
- User documentation and guides
- Website/landing page
- Distribution on official channels
- Release announcement

**Key Technical Tasks**:

- [⚪] **P7-T01**: Final bug fixes from beta
- [⚪] **P7-T02**: Write user documentation
- [⚪] **P7-T03**: Create tutorial/onboarding
- [⚪] **P7-T04**: Prepare release packages
- [⚪] **P7-T05**: Set up distribution (website, store)
- [⚪] **P7-T06**: Create promotional materials
- [⚪] **P7-T07**: Official release announcement
- [⚪] **P7-T08**: Monitor initial user feedback

---

### Phase 8: Post-Launch & Maintenance (Ongoing) ⚪

**Target Start**: June 2026
**Status**: Not Started

**Objectives**:

- Monitor user feedback
- Regular bug fixes
- Feature enhancements
- Security updates
- Performance improvements

**Ongoing Activities**:

- Bug fix releases (patch versions)
- Feature updates (minor versions)
- Security patches
- Performance optimizations
- Community engagement
- Feature requests evaluation

---

## Milestones

### M0: Project Setup ✅

- **Date**: 23 November 2025
- **Status**: Complete
- **Achievements**: Project initialized, development environment ready, documentation structure established

### M1: Core Architecture Complete ✅

- **Date**: December 2025
- **Status**: Complete
- **Achievements**: Functional application with IPC communication, file operations, complete UI component library

### M2: Content Display Ready ✅

- **Date**: December 2025
- **Status**: Complete
- **Achievements**: Working manga reader, MangaDex integration, search with filters, reading modes

### M3: Feature Complete (Planned) 🔵

- **Target Date**: February 2026
- **Status**: In Progress (Phase 3: 16/19 tasks)
- **Goals**: Library management, import/export, accessibility improvements

### M4: Beta Release (Planned) ⚪

- **Target Date**: June 2026
- **Status**: Not Started
- **Goals**: Stable beta version, auto-updates working, ready for user testing

### M5: v1.0.0 Public Release (Planned) ⚪

- **Target Date**: June 2026
- **Status**: Not Started
- **Goals**: Production-ready release, documentation complete, distribution channels live

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk**: MangaDex API rate limiting
**Probability**: Medium
**Impact**: High
**Mitigation**: Implement request throttling, caching, respect API limits

**Risk**: Cross-platform compatibility issues
**Probability**: Medium
**Impact**: High
**Mitigation**: Regular testing on all target platforms, use Electron best practices

**Risk**: Performance issues with image streaming
**Probability**: Medium
**Impact**: Medium
**Mitigation**: Implement lazy loading, image caching, optimize rendering

**Risk**: Network connectivity handling
**Probability**: High
**Impact**: Medium
**Mitigation**: Graceful error handling, retry logic, offline mode (Phase 4)

### Schedule Risks

**Risk**: Feature creep extending timeline
**Probability**: High
**Impact**: High
**Mitigation**: Strict scope management, prioritize MVP features, defer nice-to-haves

**Risk**: Underestimated complexity
**Probability**: Medium
**Impact**: Medium
**Mitigation**: Buffer time in estimates, regular progress reviews, adjust timeline as needed

---

## Success Metrics

### Development Metrics

- **Code Coverage**: Target >80% for core functionality
- **Build Time**: Keep under 30 seconds for production builds
- **Bundle Size**: Renderer bundle <2MB, installer <100MB
- **Startup Time**: Application launch <2 seconds

### Quality Metrics

- **Crash Rate**: <0.1% of sessions
- **Bug Density**: <1 critical bug per 1000 lines of code
- **Performance**: 60fps UI rendering
- **Memory Usage**: <200MB idle, <500MB with large files

### Release Metrics

- **Time to Beta**: 6 months from start
- **Time to v1.0**: 7 months from start
- **Update Adoption**: >70% within 1 week of release

---

## Key Implementation Notes

### Phase 1: Foundation (23 Nov - 6 Dec 2025)

**P1-T01 Design Documents** (24 Nov 2025)

- Created 11 comprehensive design documents (~110KB total)
- Established Windows 11 design system with complete token library
- Documented all UI patterns, component specifications, and loading states

**P1-T02 Menu Bar & Navigation** (25 Nov 2025)

- Menu bar and navigation system with Windows 11 design
- Fixed multiple state management and IPC handler issues

**P1-T03 UI Component Library** (25 Nov - 2 Dec 2025)

- 17 production-ready components (~8,500 lines)
- Windows 11 Fluent Design with official @fluentui/react-icons
- 3 implementation waves: Must-have → Should-have → Polish pass
- See [archived-milestones.md](archived-milestones.md) for detailed implementation notes

**P1-T04 State Management** (2 Dec 2025)

- Zustand v5.0.3 with 4 domain stores (app, toast, preferences, library)
- Global toast system and theme management
- Complete documentation in state-management.md

**P1-T05 Filesystem Security** (2-3 Dec 2025)

- Path validation with AppData + Downloads restrictions
- Secure filesystem wrapper with 12 validated operations
- Settings manager with persistence to AppData/settings.json
- Accent color system with Windows BGR→RGB conversion

**Phase 1 Complete** (6 Dec 2025): 9/9 tasks, 2 weeks duration, production-ready foundation

### Phase 2: Content Display (6-20 Dec 2025)

**P2-T01 through P2-T09** (6-15 Dec 2025)

- MangaDex API client with token bucket rate limiter
- Search UI with pagination and filters
- Manga detail view with chapter lists
- Online reader with image streaming and zoom/pan controls
- Initial progress tracking implementation

**P2-T10 Progress Tracking** (15-18 Dec 2025)

- Major refactor: Per-chapter progress with explicit completion flags
- Fixed 5 critical bugs (infinite loops, menu labels, cover images)
- Incognito mode with Ctrl+Shift+N
- See [archived-milestones.md](archived-milestones.md) for detailed refactor notes

**P2-T11 Reading Modes** (20 Dec 2025)

- Three modes: Single page, Double page (RTL support), Vertical scroll
- Per-manga settings override with `M` keyboard shortcut
- Fixed 4 critical bugs (IPC wrappers, RTL display, race conditions)

**Phase 2 Complete** (20 Dec 2025): 11/11 tasks, 14 days duration, zero compilation errors

### Guerilla Refactoring (Before 22 Dec 2025)

**Backend**: main/index.ts (357→78 lines), IPC handlers split into 7 domain files, menu split into 5 files, comprehensive validation system

**Frontend**: ReaderView (2,189→753 lines), MangaDetailView (1,104→439 lines), SettingsView (803→448 lines)

**Impact**: Fixed SettingsView security flaw (direct file writes), reduced technical debt, improved maintainability

See [archived-milestones.md](archived-milestones.md) for complete refactoring details

### Phase 3: Library Management (27 Dec 2025 - Present)

**Database Migration** (27-28 Dec 2025)

- Drizzle ORM + better-sqlite3 with 9 tables
- WAL mode, 64MB cache, migration system
- Major entity refactor: Lean MangaProgress with rich queries via JOINs
- CQRS-inspired folder structure (queries/, commands/)

**P3-T01 Library Features** (3-5 Jan 2026)

- Fixed 9 issues during implementation (progress display, chapter metadata, statistics)
- Repository expansions and IPC handlers
- Opportunistic caching system
- Update indicators with chapter progress

**P3-T12 Mihon Import** (14 Jan 2026)

- Protobuf decoding with BigInt/Long handling
- 76 tag mappings, duplicate prevention
- Progress tracking with chapter metadata caching

**P3-T13 Native DexReader Export** (25 Jan 2026)

- Fixed 10 critical issues in export service during implementation
- **Major Fix**: Reader settings consolidated - database now single source of truth
- Protobuf schema renamed (Backup* → DexReader* to prevent Mihon conflicts)
- Export with optional sections (collections, progress, reader settings)

**P3-T14 Mihon Export** (22 Jan 2026)

- Protobuf encoding with tag ID→name reverse mapping
- Collection mapping and gzip compression

**P3-T16 Danger Zone** (22 Jan 2026)

- Three operations: Open settings folder, Reset to defaults, Clear all data
- Post-implementation: IPC wrapper consistency fixes (10 calls updated)
- Theme persistence migrated from localStorage to settings.json

---

## Decision Log

**Why Electron?**

- Cross-platform desktop application requirement
- Access to Node.js for file system operations
- Mature ecosystem with good tooling

**Why React 19?**

- Modern concurrent features
- Large ecosystem of components
- Team familiarity

**Why electron-vite?**

- Fast development builds with HMR
- Modern tooling compared to Webpack
- Better developer experience

**Why Zustand over Redux?**

- Lightweight (1.4kb vs 15kb+)
- TypeScript-first design
- Built-in persistence middleware
- Minimal boilerplate

**Why Drizzle ORM?**

- TypeScript-first with excellent type inference
- Minimal runtime overhead
- SQL-like syntax (easy learning curve)
- Built-in migration system

---

## Legend

**Status Indicators**:

- ✅ Complete
- 🔵 In Progress
- 🔄 Partially Complete
- ⏳ Pending
- ⚪ Not Started
- 🔴 Blocked
- ⚠️ At Risk

**Priority Levels**:

- **High**: Critical path items, must complete
- **Medium**: Important but flexible timing
- **Low**: Nice to have, can defer if needed

---

_This timeline is a living document. Update regularly as the project progresses, priorities shift, or new information becomes available. The estimated dates are targets and will be adjusted based on actual progress and discoveries during development._

# DexReader Active Context

**Last Updated**: 27 February 2026
**Current Phase**: Phase 4 - Offline Functionality
**Session**: Download System Improvements & Queue Visibility Fixes

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 4 In Progress (10/12 tasks complete)
**Progress**: Phase 3: 19/19 (100%) ✅ | Phase 4: 10/12 complete (83%, 2 remaining: P4-T11, P4-T13)
**Current Date**: 27 February 2026
**Database Migration Status**: Fully migrated (includes chapter_downloads table with 2 migrations)
**Current Task**: Download improvements complete ✅
**Download System Status**: ✅ Backend fully operational | ✅ Queue visibility fixed | ✅ Clear Completed no longer touches filesystem
**Next Recommended**: P4-T11 (Storage quota management) to complete offline functionality

---

## Download System Improvements (27 Feb 2026)

**Status**: ✅ Complete - Fixed queue visibility and Clear Completed button behavior

### Issues Addressed

**1. ✅ Queue Visibility Problem**

- **Issue**: Queued downloads not showing in DownloadsView UI
- **Root Cause**: Database entries only created when download starts (in `downloadService.downloadChapter()`), not when added to queue. Foreign key constraints (chapter/manga must exist) prevented early DB entry creation.
- **Solution**: Expose in-memory queue via IPC and merge with database downloads in UI
- **Implementation**:
  - Added `getQueuedItems()` method in `download-queue.service.ts` to expose in-memory queue
  - Added IPC handler `download:get-queued-items`
  - Updated preload bindings with `getQueuedItems(): Promise<IpcResponse<QueuedDownloads[]>>`
  - Modified `loadDownloads()` in DownloadsView to fetch both DB downloads and queue items
  - Queue items not in DB display with placeholder metadata until download starts
- **Files Modified**:
  - `src/main/services/download-queue.service.ts`
  - `src/main/ipc/handlers/download.handler.ts`
  - `src/preload/index.d.ts`, `src/preload/index.ts`
  - `src/renderer/src/views/DownloadsView/DownloadsView.tsx`

**2. ✅ Cancel All Queued Button**

- **Implementation**: Added button to cancel all queued (not actively downloading) items
- **Backend**: `cancelAllQueued()` clears in-memory queue array, returns count
- **Frontend**: Button shows when `queuedCount > 0`, calls `globalThis.downloads.cancelAllQueued()`
- **Files Modified**: Same as above + additional UI button in DownloadsView

**3. ✅ Clear Completed Button Regression Fix**

- **Issue**: "Clear Completed" was calling `deleteChapter()` which deleted files from disk
- **Expected Behavior**: Should soft-delete (hide from UI) but keep files on disk
- **Solution**: Implemented proper soft delete using existing `isHidden` column infrastructure
- **Backend Changes**:
  - Added `clearCompletedDownloads()` method in `download.service.ts` that soft-deletes (sets `isHidden: true`)
  - Updated `deleteChapter()` to use `DeleteChapterCommand` with `isDeletePermanent: true` flag
  - Added `download:clear-completed` IPC handler
  - Updated `getAllDownloads()` in repo to filter `WHERE isHidden = false`
- **Frontend Changes**:
  - Updated `handleClearCompleted()` to call `globalThis.downloads.clearCompleted()`
  - Toast message clarifies "Cleared X downloads from view"
- **Files Modified**:
  - `src/main/services/download.service.ts`
  - `src/main/database/repository/chapter-downloads.repo.ts`
  - `src/main/ipc/handlers/download.handler.ts`
  - `src/preload/index.d.ts`, `src/preload/index.ts`
  - `src/renderer/src/views/DownloadsView/DownloadsView.tsx`

### Technical Summary

**Queue Architecture**:

- In-memory queue managed by `download-queue.service.ts`
- Database entries created when download starts (after metadata fetch)
- UI merges both sources to show all queued + active + completed downloads
- Queue items display with temporary placeholder data ("Loading...", chapter ID preview)

**Download Lifecycle**:

1. User queues chapter → Added to in-memory queue
2. UI shows queued item with placeholder
3. Queue processor starts download → Fetches metadata, saves to DB, creates download entry
4. UI updates with real metadata as download progresses
5. Completion persists to database with full details

**Button Behaviors**:

| Button                | Files      | Database                       | Action                         |
| --------------------- | ---------- | ------------------------------ | ------------------------------ |
| **Clear Completed**   | ✅ Kept    | Soft delete (`isHidden: true`) | Hide from UI, keep for reading |
| **Remove** (per item) | ❌ Deleted | Hard delete                    | Permanent removal              |
| **Cancel All Queued** | N/A        | N/A                            | Clear in-memory queue only     |

**Why This Design**:

- Foreign key constraints require chapter/manga metadata before DB entry creation
- Fetching metadata before queueing would slow down bulk operations
- In-memory queue + merge strategy provides immediate UI feedback with eventual consistency
- Soft delete for Clear Completed enables re-reading without re-downloading

### Files Changed (8 files)

**Backend**:

- `src/main/services/download-queue.service.ts` (added `getQueuedItems()`, updated cancel methods)
- `src/main/services/download.service.ts` (added `clearCompletedDownloads()`)
- `src/main/database/repository/chapter-downloads.repo.ts` (filter hidden downloads)
- `src/main/ipc/handlers/download.handler.ts` (added 2 handlers)

**Preload**:

- `src/preload/index.d.ts` (added `getQueuedItems`, `clearCompleted`, `cancelAllQueued`)
- `src/preload/index.ts` (added IPC invocations)

**Frontend**:

- `src/renderer/src/views/DownloadsView/DownloadsView.tsx` (merged queue + DB, updated handlers)

### Testing Recommendations

1. Queue multiple chapters and verify they appear immediately in Downloads view
2. Click "Cancel All Queued" and confirm items are removed from UI
3. Complete some downloads, click "Clear Completed", verify:
   - Items disappear from UI
   - Files still exist in downloads folder
   - Can still read chapters from ReaderView
4. Test "Remove" button to ensure permanent deletion still works

---

## Download Regression Test Fixes (24 Feb 2026)

**Status**: ✅ Complete - All 6 identified issues resolved

**Issues Fixed**:

1. ✅ **CRITICAL BUG: Download state not updating in database**
   - **Root Cause**: `downloadChapterImages()` method in `download.service.ts` was returning `MarkDownloadStateCommand` with `isDownloaded: false`, causing `markDownloadState()` to skip database updates (empty UPDATE statement)
   - **Fix**: Added `updateData.isDownloaded = true` before returning from successful download
   - **Impact**: First download attempts now properly mark chapters as completed in database
   - **File Modified**: `src/main/services/download.service.ts`

2. ✅ **UI Bug: StreamSourceIndicator vertical misalignment**
   - **Root Cause**: Icon displayed inline within `<h1>` without flexbox alignment
   - **Fix**: Added `display: flex; align-items: center; justify-content: center;` to `.reader-header__title`
   - **Impact**: Globe/disk icons now properly aligned with chapter title
   - **File Modified**: `src/renderer/src/views/ReaderView/ReaderView.css`

3. ✅ **UI Polish: Icon color inconsistency**
   - **Root Cause**: Online source icon used secondary color, local source icon used success green
   - **Fix**: Changed local icon from `var(--win-success)` to `var(--win-text-secondary)`
   - **Impact**: Both streaming indicators now use consistent neutral coloring
   - **File Modified**: `src/renderer/src/components/StreamSourceIndicator/StreamSourceIndicator.css`

4. ✅ **Feature: Open Download Folder button**
   - **Decision**: Added to DownloadsView toolbar (browser-style UX: Settings for location config, Downloads view for quick access)
   - **Implementation**:
     - Added IPC handler `fs:open-downloads-folder` using `shell.openPath()`
     - Updated preload types (`index.d.ts` and `index.ts`)
     - Added "Open Folder" button with FolderOpen icon in DownloadsView toolbar
   - **Files Modified**:
     - `src/main/ipc/handlers/file-systems.handler.ts`
     - `src/preload/index.d.ts`
     - `src/preload/index.ts`
     - `src/renderer/src/views/DownloadsView/DownloadsView.tsx`

5. ✅ **UX Enhancement: Simplified progress display**
   - **Decision**: Replaced unreliable bytes/speed/ETA calculation with deterministic "Page X/Y" display
   - **Rationale**: Page count is known upfront and reliable; byte-based speed/ETA calculations were inconsistent due to variable image sizes and no single source of truth for download speed
   - **Changes**:
     - Removed `progressTracker` useRef Map and `calculateSpeed()` function
     - Removed `formatSpeed` and `formatETA` imports and usage
     - Removed `speed` and `eta` fields from Download interface
     - Simplified `handleChapterProgress()` to only update currentPage and progress percentage
     - Updated UI to show only "Page X / Y" instead of "X / Y pages + speed + ETA"
   - **Files Modified**:
     - `src/renderer/src/types/download.types.ts`
     - `src/renderer/src/views/DownloadsView/DownloadsView.tsx`

6. ✅ **Investigation: "Chapter not found" API errors on first attempt**
   - **Finding**: Issue was actually caused by #1 (database state not updating). With `isDownloaded` fix, chapter data is now properly cached and subsequent operations work correctly.
   - **No separate fix needed**: Resolved by fixing the state update bug

**Technical Summary**:

- **Critical Fix**: Download completion now properly persists to database (1 line addition)
- **UI Refinements**: Icon alignment and color consistency improved
- **New Feature**: "Open Folder" button with full IPC integration (main + preload + renderer)
- **UX Simplification**: Removed ~50 lines of speed/ETA calculation code, replaced with simple page counter

**Files Changed** (9 files):

- Main Process: `download.service.ts`, `file-systems.handler.ts`
- Preload: `index.ts`, `index.d.ts`
- Renderer: `DownloadsView.tsx`, `ReaderView.css`, `StreamSourceIndicator.css`, `download.types.ts`

**Testing Recommendations**:

- Test download completion persistence across app restarts
- Verify "Open Folder" button opens correct directory on all platforms
- Confirm simplified progress display shows correct page numbers during active downloads
- Check visual alignment of StreamSourceIndicator in ReaderView header

---

## P4-T14 Completion Summary (23 Feb 2026)

**Status**: ✅ Complete - DownloadsView Backend Integration

**What Was Completed**:

1. ✅ **Type Definitions**: Created `download.types.ts` with Download and MangaDownloadGroup interfaces, mapping functions, and utility formatters
2. ✅ **IPC Integration**: Replaced mock data with real IPC calls to `downloads.getAllDownloads()` and connected to download backend
3. ✅ **Manga Grouping**: Downloads grouped by manga title with collapsible sections showing aggregate statistics
4. ✅ **Search/Filter/Sort Bar**: Real-time search by manga/chapter, status filter (All/Active/Completed/Failed), 5 sort options (Recent/Largest/Smallest/A-Z/Z-A)
5. ✅ **Real-Time Event Listeners**: Connected to `download:chapter-progress`, `download:queue-progress`, and `download:permanent-failure` events
6. ✅ **Action Handlers**: Connected Cancel, Retry, Remove, Clear Completed, and Retry All Failed buttons to backend IPC handlers
7. ✅ **Grouped UI**: Collapsible manga sections with chapter cards, progress bars, and action buttons based on status
8. ✅ **Speed and ETA Calculation**: Real-time speed tracking from progress deltas and ETA estimation from remaining bytes
9. ✅ **Loading and Error States**: Proper loading spinner, error messages with retry button, and empty state
10. ✅ **Auto-Collapse**: Groups automatically collapse when all chapters completed (no active or failed)
11. ✅ **Navigation**: Chapter cards navigate to reader, manga title links navigate to detail view
12. ✅ **Status Priority Sorting**: Chapters sorted by status (downloading → failed → completed → queued) within groups

**Files Created** (2 files, ~746 lines):

- `src/renderer/src/types/download.types.ts` (200 lines): Type definitions, mapping, utilities
- `src/renderer/src/views/DownloadsView/DownloadsView.css` (546 lines): Complete styling with responsive design

**Files Modified** (1 file):

- `src/renderer/src/views/DownloadsView/DownloadsView.tsx` (400+ lines): Complete rewrite from mock to full backend integration

**Technical Implementation**:

- **State Management**: React useState/useEffect for downloads, groups, filters, and real-time updates
- **Event Handling**: Proper event listener cleanup, progress tracking with refs, speed/ETA calculation
- **Performance**: useMemo for filtering/sorting, auto-refresh every 5 seconds as safety net, efficient grouping algorithm
- **User Experience**: Search/filter/sort, collapsible groups, status-based action buttons, error handling with toasts
- **Design System**: Windows 11 design tokens, responsive layout, accessible controls

**UI/UX Features**:

1. **Manga-Grouped Layout**: Downloads organized by manga with aggregate stats (total chapters, storage size, active/failed counts)
2. **Smart Auto-Collapse**: Groups collapse automatically when all chapters completed (no failures or active downloads)
3. **Comprehensive Search/Filter/Sort**: Real-time search, 4 status filters, 5 sort options
4. **Retry All Failed Button**: Appears when failedCount > 0, disabled when queue is processing
5. **Clear Completed Button**: Always visible, disabled when no completed downloads
6. **Dual Navigation**: Click chapter card → reader | Click manga title link → detail view
7. **Status Priority Display**: Chapters sorted by urgency (downloading first, then failed, completed, queued)
8. **Real-Time Progress**: Speed and ETA calculated from download events, progress bars update live

**Implementation Quality**:

- ✅ No TypeScript compilation errors
- ✅ All 20 success criteria met (from plan)
- ✅ Event listeners properly cleaned up on unmount
- ✅ Proper error handling with user-friendly messages
- ✅ Responsive design for mobile/tablet/desktop
- ✅ Windows 11 styling consistency

**Design Decisions (from UI mockup review)**:

- ✅ Grouped layout by manga title
- 🔷 Cover images deferred to future enhancement
- ✅ Auto-collapse when all chapters completed
- ✅ Search/filter/sort with 5 sort options
- ✅ Clear Completed always visible (disabled when empty)
- ✅ Retry All Failed appears on first failure (disabled during processing)
- ✅ Navigation: chapter card→reader, manga title→detail
- ✅ Sort order: downloading→failed→completed→queued

---

## P4-T06 Completion Summary (21 Feb 2026)

**Status**: ✅ Complete - Download UI Fully Integrated

**What Was Completed**:

1. ✅ **StreamSourceIndicator Component**: Passive indicator in ReaderView header showing online (globe icon) or local (disk icon) source with fade-in animation
2. ✅ **DownloadStatusBadge Component**: Interactive badge for chapter lists with 5 states (not-downloaded, queued, downloading, downloaded, failed) and progress display
3. ✅ **DownloadConfirmationDialog Component**: Unified modal for single/batch downloads with quality selection (High Quality/Data Saver), location display, and Settings link
4. ✅ **MangaDetailView Integration**: Added download badge to each chapter item with click handler and confirmation dialog
5. ✅ **ReaderView Integration**: Added stream source indicator that dynamically shows local/online based on download status
6. ✅ **IPC Integration**: Connected all components to download IPC handlers (`addToQueue`, `getDownload`, `isDownloaded`)
7. ✅ **Settings Integration**: Load download path and quality preferences from settings system
8. ✅ **Quality Mapping**: Proper conversion between frontend format ('high-quality'/'data-saver') and backend ImageQuality enum ('data'/'data-saver')
9. ✅ **Download Status Checking**: Automatic status loading for visible chapters with proper state management
10. ✅ **Event Handling**: Proper event propagation control to prevent navigation when clicking download badge

**Components Created** (9 files, ~570 lines):

- `StreamSourceIndicator/` (3 files): Component + CSS + barrel export
- `DownloadStatusBadge/` (3 files): Component + CSS + barrel export
- `DownloadConfirmationDialog/` (3 files): Component + CSS + barrel export

**Files Modified** (2 files):

- `ChapterList.tsx`: Added download state management, IPC integration, dialog rendering
- `ReaderView.tsx`: Added stream source state, download status checking, dynamic indicator

**Technical Implementation**:

- **State Management**: Uses React useState/useEffect for download status caching and settings
- **Type Safety**: Proper type conversions between frontend and backend enums
- **Performance**: Batch status checks using Promise.all(), status map caching
- **User Experience**: Click handlers with stopPropagation(), loading indicators, error handling
- **Design System**: Windows 11 design tokens, Fluent UI icons, accessible components

**UI/UX Decisions**:

1. **Passive Reader Indicator**: ReaderView shows source (online/local) as info only, no download action
2. **Unified Quality Dialog**: Single dialog for both single and batch downloads, quality always visible
3. **Chapter List Actions**: All download interactions happen from chapter list in MangaDetailView
4. **Settings-Driven Behavior**: Respects shouldAskForQuality and defaultQuality settings
5. **Clear Visual Hierarchy**: Badges integrated into existing chapter item meta section

**Implementation Quality**:

- ✅ No blocking compilation errors
- ✅ Proper TypeScript typing throughout
- ✅ Accessibility features (ARIA labels, keyboard navigation)
- ✅ Responsive design with Windows 11 styling
- ✅ Event-driven architecture for real-time updates (foundation laid)

**Deferred for Future Enhancement**:

- Real-time download progress updates in DownloadsView
- Batch download UI (multi-select chapters)
- Retry functionality UI
- Error toast notifications
- Context menu for downloaded chapters (delete option)

---

## Codebase Audit Results (18 Feb 2026)

**Status**: ✅ Complete - Discovered 6 previously implemented tasks

**Audit Findings**: Systematic review of Phase 4 codebase revealed that 6 tasks were already complete but not marked in the task list. These tasks were implemented during earlier sessions or as part of other work.

**Discovered Complete Tasks**:

1. ✅ **P4-T03: Local Image Storage System**
   - Downloads directory setting with user-configurable path
   - Path management functions (`getConfiguredDownloadsPath`, `setDownloadsPath`, `initializeDownloadsPath`)
   - Path validation and allowed paths enforcement
   - Secure filesystem wrapper for all file operations
   - UI in StorageSettings.tsx with folder selector
   - IPC handler: `fs:select-downloads-folder`

2. ✅ **P4-T05: Download Progress Tracking**
   - Per-chapter progress: `download:chapter-progress` event with page counts
   - Bulk/queue progress: `download:queue-progress` event with overall stats
   - Storage size tracking in database
   - Progress throttling (max 10 events/sec)

3. ✅ **P4-T07: Batch Downloads**
   - Backend: `addBatchToQueue()` method in download-queue.service.ts
   - IPC handler: `download:add-batch-to-queue` with validation
   - Fully functional, awaiting UI integration in P4-T06

4. ✅ **P4-T08: Offline Mode Detection**
   - Connectivity store with 3 states: online, offline-user, offline-no-internet
   - Methods: `setOnline()`, `setOfflineMode()`, `setNoInternet()`, `checkConnectivity()`
   - OfflineStatusBar UI component with "Go Online" and "Retry" buttons
   - Error messages for offline states

5. ✅ **P4-T09: Storage Management**
   - Delete chapter: `deleteChapter()` method with file and database cleanup
   - IPC handler: `downloads:delete-chapter`
   - Storage size tracking for all downloads
   - Secure file deletion through validated paths

6. ✅ **P4-T12: File Operation Validation**
   - pathValidator.ts with `validatePath()`, `normalizePath()`, `validateDirectoryPath()`
   - secureFs.ts wrapper validates all operations before execution
   - Allowed paths enforcement (AppData + user downloads directory)
   - All file operations go through validation layer

**Phase 4 Progress**: 9/12 tasks complete (75%)

**Remaining Tasks**:

- P4-T11: Storage quota management and cleanup
- P4-T13: Unfavourite dialog with download handling (deferred)
- P4-T14: DownloadsView integration with real-time updates (NEW)

---

## P4-T02 Completion Summary (18 Feb 2026)

**Status**: ✅ Complete - Download Queue Manager Operational

**What Was Completed**:

1. ✅ Queue Service: Concurrent download orchestration with configurable concurrency (1-10, default: 3)
2. ✅ Retry Logic: Silent exponential backoff (5s, 15s, 45s) with max 3 attempts
3. ✅ Batch Updates: Pending database updates flushed at 10 items or 1-second timeout
4. ✅ Progress Throttling: Max 10 events/sec to prevent IPC flooding
5. ✅ Resume Capability: Auto-resume incomplete downloads on app startup
6. ✅ Helper Functions: Extracted to dedicated helper file (stats, notifications, retry delays)
7. ✅ IPC Handlers: 11 handlers for queue operations (add, remove, clear, retry, stats)
8. ✅ Type System: Queue types properly exported to renderer via preload bridge
9. ✅ App Lifecycle: Graceful shutdown with batch update flush
10. ✅ Duplicate Prevention: Checks for existing items before adding to queue

**Architectural Decisions**:

- **Fresh Settings Reads**: No caching, reads `maxConcurrentDownloads` on every queue processing cycle
- **FIFO Queue**: Simple queue ordering, no persistence (lost on app restart, but auto-resumed from database)
- **Silent Retries**: Only notify user on permanent failure after 3 attempts
- **Batch Database Operations**: Transactional updates with timeout-based flushing
- **Event-Driven Progress**: `download:queue-progress` and `download:permanent-failure` events

**Technical Implementation**:

- Service: `download-queue.service.ts` (312 lines) with queue state management
- Helper: `download-queue.helper.ts` with 4 extracted functions
- Types: `queued-downloads.type.ts`, `queue-state.type.ts`, `overall-progress.type.ts`
- Repository: `batchMarkDownloadsState()` for transactional updates
- Settings: `maxConcurrentDownloads` with validation (range: 1-10)
- Lifecycle: Resume on startup, cleanup on shutdown

**Implementation Notes**:

- User implemented full backend independently after planning phase
- Comprehensive audit performed, all 6 issues addressed
- Logic error fixed: `handleDownloadFailure()` reconstructs item from database
- Missing calls added: `processQueue()` after add/retry, `resumeIncompletedDownloads()` on startup
- Graceful shutdown: `cleanup()` method flushes pending updates

**Frontend Integration Deferred**: All UI work moved to P4-T06 to enable comprehensive testing and proper UX design

---

## P4-T01 Completion Summary (12 Feb 2026)

**Status**: ✅ Backend Complete - Frontend Deferred to P4-T06

**What Was Completed**:

1. ✅ Database schema: `chapter_downloads` table with `downloadsBasePath` tracking
2. ✅ Migration: `0002_add_newcolumntochapterdownload.sql` (handles path changes)
3. ✅ Repository layer: Full CRUD operations for download tracking
4. ✅ Download service: Single-chapter download with proper path structure
5. ✅ Local image protocol: `local-manga://` handler for filesystem reads
6. ✅ IPC handlers: All 5 handlers registered (`downloadChapter`, `isDownloaded`, etc.)
7. ✅ Preload bridge: Exposed to renderer with TypeScript types
8. ✅ File structure: `manga/{mangaId}/chapters/{chapterId}/pages/001.jpg`
9. ✅ Path tracking: `downloadsBasePath` + relative `filePath` for directory migration support

**Architectural Decision**:

- **Dual protocol**: `local-manga://` for downloads, `mangadex://` for network
- **Path resilience**: Tracks download location per-chapter (survives settings changes)
- **Clean separation**: Network proxy unchanged, new protocol for local files

**Deferred to P4-T06** (Download UI):

- ❌ Download buttons (reader, chapter lists, manga pages)
- ❌ Progress indicators and status badges
- ❌ Frontend protocol selection logic (`useChapterData.ts` modification)
- ❌ Download management UI
- ❌ Testing/validation of complete download flow

**Why Deferred**: Avoid "blind frontend" implementation. P4-T06 will design proper UX and implement both UI and reader integration together, enabling full testing.

---

## Next Steps - Phase 4 Nearly Complete

**Recommended Next**: P4-T11 (Storage Quota Management)

**Why P4-T11 Now**: Download system is fully functional, need storage management to:

- Prevent disk space exhaustion
- Provide user-configurable quota limits
- Display storage usage in settings
- Offer manual cleanup options (delete old/unread downloads)
- Warn users when approaching limits

**Alternative Tasks**:

- Continue with other features (Phase 5 planning)
- Polish existing download UI (batch downloads, retry UI)
- Improve DownloadsView with real-time progress updates

---

## Planning Notes for Future Tasks

### P4-T11: Storage Quota Management (NEXT RECOMMENDED)

**Features Needed**:

1. Storage quota settings (user-configurable limit)
2. Storage usage calculation and display
3. Automatic cleanup policies (oldest first, completed first, etc.)
4. Manual cleanup UI in settings
5. Warning notifications when approaching limit
6. Per-manga storage breakdown

### P4-T13: Unfavorite Dialog with Download Handling (DEFERRED)

**Features Needed**:

1. Show warning if manga has downloaded chapters
2. Offer to delete downloads when unfavoriting
3. Show storage savings amount
4. Confirm deletion action

### P4-T02: Download Queue Manager

**Performance Analysis** (1 Feb 2026):

- **Bottleneck**: Network/API (70-100 minutes for 1000 chapters at 5 req/s rate limit)
- **NOT bottlenecks**: Database writes (~1 second for 1000 records), Filesystem I/O (5-10 minutes)
- **Key optimizations needed**:
  - Concurrent downloads: 3-5 simultaneous chapters
  - Batch database transactions: Update 10-100 records at once
  - Throttled progress events: Max 10 events/sec across all downloads (prevent IPC flood)

**Features to Implement**:

- Overall progress calculation: Aggregate across all active downloads
- Event: `download:overall-progress` with `{ totalChapters, completedPages, totalPages, overallPercentage }`
- Retry logic: Query `status='error'` from database, exponential backoff
- Download resumption: Detect app restarts, resume incomplete downloads (status='downloading')

### P4-T05: Download Progress UI

**Integration Points**:

- Listen to `download:chapter-progress` events from P4-T01 (per-page updates)
- Listen to `download:overall-progress` events from P4-T02 (bulk operations)
- Connect DownloadsView mock UI to real backend
- Display: Progress bars, status badges, speed/ETA calculations, failed items with retry buttons

---

## Recent Completions (Last 2 Weeks)

### Phase 3 Complete - January 2026 ✅

**Summary**: Completed all 19 Phase 3 tasks focused on user experience enhancements.

**Major Achievements**:

- **Backup Ecosystem**: Native DexReader + Mihon import/export (P3-T12 to P3-T15)
- **Accessibility**: WCAG 2.1 Level AA compliance, 100% Lighthouse scores (P3-T18)
- **Library Features**: Favorites, collections, history fully operational (P3-T01)
- **Settings Polish**: Danger Zone, system date format integration (P3-T16, P3-T17)

**Key Metrics**: 19/19 tasks (100%), ~40 hours total investment, production-ready UX

**See**: [project-progress.md](./project-progress.md) for milestone summaries, [archived-milestones.md](./archived-milestones.md) for detailed implementation notes

---

## Next Steps - Phase 4 Planning

**Action Required**: Define Phase 4 scope and tasks

**Potential Focus Areas** (to be discussed):

- **Offline Reading**: Download chapters for offline access
- **Advanced Search**: Complex filtering, saved searches
- **Reading Analytics**: Statistics dashboard, reading streaks
- **Performance**: Optimize large libraries (1000+ manga)
- **Mobile/Tablet**: Responsive design improvements
- **Customization**: More reader settings, UI themes

**Planning Tasks**:

1. Review Phase 3 outcomes and user feedback
2. Prioritize Phase 4 features based on impact/effort
3. Break down selected features into specific tasks
4. Estimate timeline and dependencies
5. Update project-progress.md with Phase 4 task list

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

**Stack**: Electron 34 + React 19 + TypeScript 5.7 + Drizzle ORM + SQLite
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

# DexReader Active Context

**Last Updated**: 27 January 2026
**Current Phase**: Phase 3 - User Experience Enhancement
**Session**: P3-T15 Backend Audit Complete, Import Strategies Finalized

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 3 - User Experience Enhancement (16/19 tasks, 84.2%)
**Progress**: P3-T13 complete ✅, P3-T15 backend audited ✅, P3-T16 complete ✅
**Current Date**: 27 January 2026
**Database Migration Status**: Fully migrated and operational
**Current Task**: P3-T15 Implementation (backend fixes + frontend UI)
**Plan Document**: `.github/copilot-plans/P3-T13-T15-native-backup-restore-plan.md` (updated with strategies)

---

## 🎯 P3-T15 Native Import - IMPORT STRATEGIES FINALIZED (27 Jan 2026)

**Session Summary**: Conducted comprehensive backend audit of native import implementation. Identified architectural decisions needed for conflict resolution and error handling.

### Critical Architectural Decisions Made

**1. Error Handling Architecture**

- **HALT on failure**: Manga/Chapters import (critical, everything depends on them)
- **CONTINUE on failure**: Collections, Progress, Reader Settings (log to `sectionErrors`, proceed)
- **Result Type Changes**: Remove per-item `errors[]`, add section-level `sectionErrors: { collections?, progress?, readerSettings? }`
- **Within-section**: All-or-nothing transactions (one item fails → entire section fails)

**2. Conflict Resolution Strategies**

**Important**: These strategies **only apply when the section exists in the backup file**. Missing sections (user didn't export them) result in no action - existing data is completely preserved.

| Data Type | Strategy | On Conflict | Rationale |
|-----------|----------|-------------|-----------|
| Manga | UPSERT | Import wins | Backup restoration, self-healing via API |
| Chapters | UPSERT | Import wins | Same as manga |
| Collections* | SKIP + MERGE | Merge manga into existing | Same name = same concept, additive |
| Progress* | UPSERT | Import wins (preserve firstReadAt) | Authoritative history |
| Reader Settings* | SKIP EXISTING | Current wins | Active preferences priority |

*Optional sections - only imported if present in backup (automatically detected via protobuf decode)

**3. Export Scope Fix Required** (CRITICAL)

- **Current**: Export only `isFavourite = true` manga → **Causes FK violations**
- **Required**: Export ALL cached manga with `isFavourite` field
- **Reason**: Reader overrides (optional export) reference all visited manga, not just favourites
- **Impact**: Library view unchanged (filters by flag), prevents FK constraint errors on import
- **Note**: This fix is independent of optional export sections - library data always exported, but must include ALL cached manga

### Implementation Checklist

**Backend Fixes Needed**:

1. ✅ Update result type with `sectionErrors`, remove per-item `errors[]`
2. ✅ Wrap optional sections in try-catch
3. ✅ Implement collection ID mapping (oldId→newId) - **CRITICAL BUG FIX**
4. ✅ Implement reader settings skip logic (filter existing overrides)
5. ✅ Track skip counts for collections/settings

**Export Service Fix** (Prerequisite):
6. ✅ Change export from `getLibraryManga()` to `getAllManga()` - prevents FK violations

**Frontend** (Not Started):
7. ❌ Create `DexReaderImportDialog` component
8. ❌ Add LibraryView event listener for `import-library`
9. ❌ Add library refresh after import
10. ❌ Toast notifications for results

**Backend Status**: ~85% complete (functional but has critical collection ID mapping bug + missing frontend)
**Next Steps**: Implement backend fixes, then frontend UI

**Documentation**: All strategies documented in plan file with detailed implementation notes

---

## ⚠️ Known Issues & Strategic Decisions

### electron-builder tar Vulnerability (High Severity)

**Issue**: electron-builder@26.5.0 has transitive dependency on vulnerable tar@6.2.1 via @electron/rebuild@4.0.1

- **CVE**: GHSA-8qq5-rm4j-mr97 (path traversal/arbitrary file overwrite)
- **Severity**: High
- **Scope**: Development dependency only (not shipped to users)
- **Attack Vector**: Requires malicious tarball extraction during build process

**Decision**: **Accept risk, continue with electron-builder@26.5.0**

**Rationale**:

1. **Dev-only**: electron-builder is devDependency, never bundled into production app
2. **Upstream dependency issue**: Nested dependency (@electron/rebuild) controlled by electron-builder maintainers
3. **Workarounds ineffective**: npm overrides reported as ineffective by community (GitHub issues)
4. **Latest version**: Already on electron-builder@26.5.0 (latest); downgrading loses Electron 38 compatibility
5. **Low exploitability**: Requires malicious tarball to be processed during build

**Mitigation**:

- Only build from trusted sources/repositories
- Document decision for future reference

**Action Plan**:

- Monitor: [electron-builder Issues](https://github.com/electron-userland/electron-builder/issues)
- Wait for @electron/rebuild to update tar dependency
- Re-evaluate when electron-builder v27+ is released
- Check periodically for upstream fixes

**Date Logged**: 20 January 2026

---

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

## ✅ P3-T12 Mihon/Tachiyomi Library Import - COMPLETE (14 Jan 2026)

**Duration**: ~6 hours (14 January 2026)
**Status**: All implementation complete, fully tested ✅

### What Was Implemented

**1. Backend Import Service** (MihonService + MihonBackupHelper):

- Protobuf parsing with `protobufjs` and gzip decompression via `pako`
- MangaDex source filtering (source ID: `2499283573021220255n`)
- Batch manga upsert with tag name→ID conversion using `TagNameToIdMap`
- Collection mapping with fallback keys for uncategorized manga
- Chapter progress import with actual reading timestamps from `BackupHistory`
- Chapter metadata import for History view (title, number, scanlationGroup)
- BigInt/Long comparison handling for protobuf source field
- Favorite field detection via `toJSON()` with `?? true` fallback
- URL-based ID extraction for manga and chapters

**2. IPC Integration**:

- `mihon:import-backup` handler with AbortController support
- `mihon:cancel-import` for cancellation
- Preload type definitions with local `ImportResult` interface
- Event system: `import-tachiyomi` triggered from File menu

**3. Frontend UI Components** (3 new components):

- **ImportProgressDialog**: Shows indeterminate progress, manga counts, cancel button
- **ImportResultDialog**: Success/warning/error states, stats cards, expandable error list
- **LibraryView integration**: Event listener, state management, ref-based double-import prevention

**4. Build Configuration**:

- Vite plugin to copy `mihon.proto` schema to build output
- Dependencies: `protobufjs@7.4.0`, `pako@2.1.0`

**5. Data Imported**:

- ✅ Manga metadata (title, author, cover, description, status, tags)
- ✅ Collections/categories (creates new collections, maps manga to them)
- ✅ Reading progress (currentPage, completed status)
- ✅ Reading history timestamps (preserves actual lastRead dates)
- ✅ Chapter metadata (title, number, scanlationGroup for History view)

### Key Technical Solutions

**Tag Conversion**:

- Created `TagNameToIdMap` from `TagList` constant
- Supports both PascalCase ("SliceOfLife") and space-separated ("Slice of Life")
- Filters out undefined IDs with type guard

**Timestamp Handling**:

- History Map lookup: O(1) chapter URL → lastRead timestamp
- Falls back to `new Date()` if history entry missing
- Uses `unixTimestampToDate()` util for conversion

**Double-Import Prevention**:

- `useRef` for synchronous guard (not `useState` batching)
- `importingRef.current` checked/set immediately
- Prevents race conditions from rapid event firing

**Field Name Alignment**:

- Backend: `importedMangaCount`, `skippedMangaCount`, `failedMangaCount`
- Frontend interfaces updated to match
- Error field: `reason` (not `message`)

**Page Tracking**:

- Both systems use 0-based array indexing
- Direct mapping: `BackupChapter.lastPageRead` → `chapter_progress.currentPage`
- Display adds +1 for human-readable page numbers

### Files Created/Modified

**Backend**:

- `mihon.services.ts` - Main import orchestration
- `mihon-backup.helper.ts` - Business logic (4 methods)
- `mihon.handler.ts` - IPC handlers
- `import.result.ts` - Result type
- `save-progress.command.ts` - Added optional `lastReadAt` field
- `manga-progress.repo.ts` - Updated to handle timestamps
- `tag-list.constant.ts` - Complete MangaDex tag UUID list
- `mihon.proto` - Protobuf schema (copied)

**Frontend**:

- `ImportProgressDialog.tsx` (96 lines) + CSS
- `ImportResultDialog.tsx` (180 lines) + CSS
- `LibraryView.tsx` - Event integration with ref guard

**Build**:

- `electron.vite.config.ts` - Copy protobuf schema plugin

### Testing & Edge Cases

✅ **Tested Scenarios**:

- Large library import (23+ manga)
- Manga already in library (skip logic)
- Missing chapter IDs (graceful skip)
- Empty history array (falls back to now)
- Protobuf Long vs BigInt comparison
- Optional favorite field (library-only backups)
- Tag name variations (PascalCase, spaces)
- Double toast prevention (ref guard)

### Result

Complete Mihon/Tachiyomi import functionality. Users can migrate their entire library including reading progress and collections. History view shows correct chapter info and timestamps. All edge cases handled gracefully.

---

## ✅ P3-T16 Danger Zone Settings - COMPLETE (22 Jan 2026)

**Status**: Complete and tested ✅
**Duration**: ~2 hours (22 January 2026)

### Implementation Summary

Complete "Danger Zone" settings section with three destructive operations, integrated into Advanced tab.

**What Was Built**:

1. **Backend IPC Handlers** (`app-settings.handler.ts`)
   - `settings:open-settings-file` - Opens settings.json in default editor via shell.openPath()
   - `settings:reset-to-defaults` - Resets settings to defaults, triggers page reload
   - `settings:clear-all` - Clears database + resets settings + app restart/exit

2. **Database Destruction Service** (`destruction-repo.ts`)
   - Transaction-based clearing of all 8 tables (collections, manga, chapters, progress, etc.)
   - Temporarily disables FK constraints during deletion
   - Resets auto-increment counters via `DELETE FROM sqlite_sequence`
   - Runs VACUUM to reclaim disk space

3. **Preload Bridge** (`preload/index.ts` + `index.d.ts`)
   - Added `globalThis.settings` namespace with 3 methods
   - Proper IPC channel mapping with type safety

4. **Frontend Component** (`DangerZoneSettings.tsx`)
   - Three operations with confirmation dialogs (native Electron dialogs via `showConfirmDialog`)
   - Separate loading states per button (isResetting/isClearing)
   - Uses app's Button component with accent (orange) and danger (red) variants

5. **Styling** (`DangerZoneSettings.css`)
   - Red border/background for critical "Clear All Data" item
   - Integrated into Advanced tab with proper spacing

### Critical Issues Fixed (22 Jan 2026)

**1. IPC Response Handling** ✅

- **Problem**: Dialog confirmation treated as plain boolean instead of IpcResponse object
- **Solution**: Changed from `if (!confirmed)` to `if (!result.success || !result.data)`

**2. Button Visibility** ✅

- **Problem**: Custom native buttons blended with background, didn't match app design
- **Solution**: Replaced custom buttons with app's standard Button component

**3. Dev Mode App Restart** ✅

- **Problem**: `app.relaunch()` causes blank page in dev mode (npm run dev)
- **Solution**: Added `is.dev` check - only relaunch in production, exit cleanly in dev

**4. Shared Button State** ✅

- **Problem**: Both buttons showed loading state when one was clicked
- **Solution**: Split into separate states (isResetting/isClearing)

### Post-Implementation Improvements (22 Jan 2026)

After P3-T16 completion, several architectural inconsistencies were discovered and fixed:

**1. IPC Wrapper Consistency** ✅

- **Problem**: `SettingsView.tsx` called `settings:load` and `settings:save` directly via `globalThis.electron.ipcRenderer.invoke()`, bypassing the wrapped handler pattern used elsewhere
- **Solution**: Added `settings.load()` and `settings.save(key, value)` to preload bridge (matching wrapped pattern)
- **Files Modified**: `src/preload/index.ts`, `src/preload/index.d.ts`
- **Impact**: All settings operations now use consistent IpcResponse wrapper pattern

**2. IpcResponse Handling** ✅

- **Problem**: 7 direct IPC calls in SettingsView treated responses as raw values instead of checking IpcResponse.success
- **Solution**: Updated all 7 settings operations to check `result.success` and extract `result.data`
- **Files Modified**: `src/renderer/src/views/SettingsView/SettingsView.tsx` (7 calls), `src/renderer/src/components/SettingsView/DangerZoneSettings.tsx` (3 calls)
- **Impact**: Proper error handling for all settings operations (10 total calls fixed)

**3. Theme Persistence Migration** ✅

- **Problem**: Theme persisted to localStorage while accent color used settings.json (inconsistent)
- **Solution**:
  - Migrated theme persistence from localStorage to settings.json file
  - Theme now loads from `settings.appearance.theme` on mount
  - `handleThemeModeChange()` saves theme via `settings.save('appearance.theme', value)`
- **Files Modified**: `src/renderer/src/views/SettingsView/SettingsView.tsx`
- **Impact**: Single source of truth for all settings (settings.json), no localStorage conflicts

**4. Zustand Store Cleanup** ✅

- **Problem**: Zustand persist middleware created duplicate persistence layer alongside settings.json
- **Solution**:
  - Removed persist middleware from appStore
  - Settings file is now the sole persistence mechanism
  - Store is runtime-only, settings.json handles disk persistence
- **Files Modified**: `src/renderer/src/stores/appStore.ts`
- **Impact**: Cleaner architecture, removed redundant persistence layer

### Architectural Rationale

**Why These Changes Matter**:

1. **Consistency**: All IPC calls follow same pattern (wrapped handlers returning IpcResponse<T>)
2. **Error Handling**: Proper success checking prevents silent failures
3. **Single Source of Truth**: Settings.json is authoritative, no localStorage conflicts
4. **Maintainability**: Removed redundant persistence layer (Zustand persist middleware)

**Pattern Established**: All IPC handlers should:

1. Be wrapped in preload bridge with type-safe methods
2. Return IpcResponse<T> objects
3. Be consumed with `.success` check and `.data` extraction

### Result

Fully functional Danger Zone with safe destructive operations. All three functions tested and working correctly in both dev and production modes. Post-implementation improvements ensure architectural consistency across entire settings system.

---

## ✅ P3-T14 Mihon/Tachiyomi Library Export - COMPLETE (22 Jan 2026)

**Status**: Complete and tested ✅
**Duration**: ~7 hours (21-22 January 2026)

### Implementation Summary

Complete Mihon/Tachiyomi export functionality with all features working and tested.

**What Was Built**:

1. **Backend Export Service** (`mihon-export.service.ts`)
2. **Export Helper** (`mihon-export.helper.ts`) with tag ID→name conversion
3. **IPC Integration** (`mihon.handler.ts`)
4. **Menu Integration** (`library.menu.ts`) with warning dialog
5. **Frontend Integration** (`LibraryView.tsx`) with toast notifications

### Critical Bugs Fixed (22 Jan 2026)

**1. BigInt Serialization Issue** ✅

- **Problem**: `source` field (BigInt constant) serialized as 0 in protobuf
- **Root Cause**: protobuf.js doesn't support JavaScript BigInt for int64 fields
- **Solution**: Changed `MangaDexSourceId` from `2499283573021220255n` (BigInt) to `'2499283573021220255'` (string), updated `BackupManga.source` type from `bigint` to `string`
- **Files**: `mihon-export.helper.ts`, `backup-manga.type.ts`

**2. Duplicate Toast Notifications** ✅

- **Problem**: 4 toasts shown on export completion
- **Root Cause**: IPC event listeners in preload script didn't return cleanup functions, causing listener accumulation on component re-renders
- **Solution**:
  - Added cleanup functions to all IPC event listeners (`onExportTachiyomi`, `onImportTachiyomi`, `onThemeChanged`, etc.)
  - Fixed useEffect dependencies in `LibraryView.tsx` (added `show`, `loadFavourites`, `loadCollections`)
  - Updated type definitions in `index.d.ts` to reflect `() => void` return types
- **Files**: `preload/index.ts` (13 event listeners fixed), `preload/index.d.ts`, `LibraryView.tsx`

### Result

Complete and working Mihon/Tachiyomi export. Users can export entire library with metadata, collections, progress, and history. All bugs fixed and thoroughly tested.

### Testing Completed ✅

**All scenarios tested and verified**:

- ✅ Export empty library (0 manga)
- ✅ Export library with single manga
- ✅ Export library with multiple manga
- ✅ Tag ID → name conversion working correctly
- ✅ Collection name mapping verified
- ✅ Timestamp format correct (Unix ms)
- ✅ File format validated (decompress + decode successful)
- ✅ **Integration test**: Export from DexReader → Import to Mihon → Data verified correct

### Files Created/Modified

**Backend**:

- ✅ `mihon-export.service.ts` - Main export orchestration
- ✅ `mihon-export.helper.ts` - Business logic transformations
- ✅ `mihon.handler.ts` - Added `export-backup` handler
- ✅ `chapter.repo.ts` - Fixed method name typo
- ✅ `library.menu.ts` - Fixed dialog flow logic

**Frontend**:

- ✅ `LibraryView.tsx` - Added export event listener

**No New Dependencies**: Reused all P3-T12 infrastructure (protobufjs, pako, mihon.proto)

---

## ✅ P3-T13 Native DexReader Export - COMPLETE (25 Jan 2026)

**Duration**: ~5 hours (25 January 2026)
**Status**: Complete and tested ✅

### What Was Implemented

Complete native `.dexreader` export functionality with selective backup options and protobuf schema.

**1. Backend Audit & Critical Fixes** (Pre-Implementation):

- Fixed 10 critical issues discovered during export service implementation:
  - Typo: `exporterd_at` → `exported_at` (dexreader.proto)
  - Typo: `favourites` → `favorites` (dexreader.proto)
  - Typo: `scanlataion_group` → `scanlation_group` (dexreader.proto)
  - Duplicate `lastVolume` field (dexreader.proto)
  - Removed `imageFit` field (doesn't exist in DB, was in legacy reader-override.command.ts)
  - Added missing `currentPage` field (reader-override.command.ts)
  - Fixed `ZoomPanState` typo → `ZoomAndPanState` (collection.repo.ts, dexreader.proto, reader-override.entity.ts)
  - Fixed IPC handler routing: `settings:clear-all` → `destruction:clear-all` (app-settings.handler.ts)
  - Fixed import path typo: `'..utils/diff.util'` → `'../utils/diffs.util'` (app-settings.handler.ts)
  - Added missing `externalUrl` field (dexreader-backup.type.ts)

**2. Protobuf Schema Renaming** (Critical Change):

- Renamed all 8 protobuf message types: `Backup*` → `DexReader*`
- **Reason**: Mihon uses identical `Backup*` prefix, causes naming conflicts when both imported
- **Types Renamed**:
  - `Backup` → `DexReaderBackup`
  - `BackupManga` → `DexReaderManga`
  - `BackupChapter` → `DexReaderChapter`
  - `BackupCollection` → `DexReaderCollection`
  - `BackupCollectionItem` → `DexReaderCollectionItem`
  - `BackupMangaProgress` → `DexReaderMangaProgress`
  - `BackupChapterProgress` → `DexReaderChapterProgress`
  - `BackupMangaReaderOverride` → `DexReaderMangaReaderOverride`
- **Impact**: Clear separation between native and Mihon backup formats

**3. Reader Settings Consolidation** (MAJOR FIX):

- **Problem Discovered**: Reader settings stored in TWO places (database + settings.json), causing inconsistency
- **Solution**: Made database the single source of truth
- Created `MangaOverride` query type with full manga metadata (title, coverUrl, mangaId)
- Updated Settings page to query database via IPC instead of reading JSON file
- Export service now reads from database with metadata
- **Impact**: Eliminated dual-source problem, Settings page now shows correct data, exports include all overrides

**4. Backend Export Service** (dexreader-export.service.ts + helper):

- Export service orchestration with AbortController support
- Helper transforms DB entities → protobuf types
- Protobuf encoding + gzip compression
- Selective backup: Library (always), Collections (optional), Progress (optional), Reader Settings (optional)
- File format: `.dexreader` (protobuf proto3 + gzip)

**5. IPC Integration**:

- `dexreader:export-backup` handler with options parameter
- `dexreader:cancel-export` for cancellation
- Preload bridge: `window.dexreader.exportBackup(options)`, `window.dexreader.cancelExport()`
- Type definitions in preload/index.d.ts

**6. Frontend Export Dialog** (DexReaderExportDialog.tsx):

- Modal wrapper with focus trapping
- Fluent UI icons: Library20Regular, Folder20Regular, BookOpen20Regular, Settings20Regular
- Windows 11 design tokens (borders, backgrounds, typography)
- Checkbox options for Collections, Progress, Reader Settings
- "Library always included" indicator
- Export button triggers file save dialog

**7. LibraryView Integration**:

- Menu event listener for `export-library` event
- File save dialog with `.dexreader` extension and filters
- Loading state management during export
- Toast notifications for success/error

**8. Settings Page Improvements**:

- Removed duplicate `getImageFitLabel()` helper (was defined twice)
- Database query replaces JSON file reading
- "Clear All Overrides" now uses single IPC call (not loop)
- Shows manga title and cover in override list

### Files Created/Modified

**Backend Services** (14 files):

- `dexreader-export.service.ts` - Main export orchestration
- `dexreader-export.helper.ts` - DB → protobuf transformation
- `dexreader-export.result.ts` - Result type
- `dexreader.handler.ts` - IPC handlers
- `dexreader-backup.type.ts` - TypeScript type definitions
- `dexreader.proto` - Protobuf schema (renamed from Backup*to DexReader*)
- `chapter.repo.ts` - Added `getChaptersByMangaIds()`
- `collection.repo.ts` - Fixed ZoomPanState typo
- `manga-progress.repo.ts` - Added `getAllMangaProgress()`, `getAllChapterProgressForAllManga()`
- `reader-settings.repo.ts` - Added `getAllOverrides()` with JOIN query
- `manga-override.query.ts` - NEW query type with manga metadata
- `reader-override.entity.ts` - Fixed ZoomAndPanState typo
- `reader-override.command.ts` - Added currentPage field
- `app-settings.handler.ts` - Fixed IPC routing and import path

**Frontend Components** (3 files):

- `DexReaderExportDialog.tsx` (122 lines) - Export dialog with checkboxes
- `DexReaderExportDialog.css` (136 lines) - Windows 11 styling
- `LibraryView.tsx` - Menu integration with file save dialog

**Settings Page** (1 file):

- `ReaderSettingsSection.tsx` - Database queries replace JSON reading, Clear All uses IPC

### Testing & Validation

✅ **Tested Scenarios**:

- Export with all options (collections + progress + reader settings)
- Export with selective options (only library, only progress, etc.)
- File save dialog integration
- Keyboard shortcut (Ctrl+Shift+E)
- Toast notifications on success/error
- Settings page shows correct overrides from database
- Clear All Overrides works correctly

### Result

Complete native DexReader export system with selective backup, proper schema naming, and consolidated reader settings. Export creates `.dexreader` files with protobuf + gzip compression. Settings page now queries database for reader overrides. All 10 backend issues fixed during implementation.

---

## 📋 P3-T15: Native DexReader Import - READY FOR IMPLEMENTATION

**Status**: Planning complete, export done, ready for implementation ✅
**Duration Estimated**: 6-8 hours
**Plan Document**: `.github/copilot-plans/P3-T13-T15-native-backup-restore-plan.md`

### Import Features (P3-T15)

- Auto-detect backup contents (reads schema to determine what's present)
- Import confirmation dialog shows what will be imported (no user selection needed)
- Merge strategy: skip duplicates, add new data
- Collection ID mapping (handles ID conflicts via Map<oldId, newId>)
- Schema versioning for future compatibility
- Menu integration: Library → Import DexReader Backup (Ctrl+Shift+I)
- Cancellable import operation with AbortController
- Comprehensive validation before import

### Implementation Steps

1. Backend Helper (transform protobuf → DB) - 2-3h
2. Import Service (decode, validate, merge) - 2-3h
3. IPC Handler + cancellation support - 15min
4. Preload Bridge (window.dexreader.importBackup) - 15min
5. Frontend Import Confirmation Dialog - 2-3h
6. Menu integration - 30min
7. Testing (duplicates, FK constraints, schema versioning) - 1-2h

**Next Step**: Begin P3-T15 Step 1 (Backend Import Helper) when ready

---

**Last Updated**: 26 January 2026 | **Next**: P3-T15 Implementation or P3-T17/P3-T18

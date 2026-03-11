# DexReader Active Context

**Last Updated**: 11 March 2026
**Current Phase**: Phase 5 - Production Readiness (PLANNING COMPLETE ✅)
**Next**: Begin P5-T21 Code Refactoring (Week 1)

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase 4 Status**: COMPLETE - 13/13 tasks (100%) ✅
**Phase 5 Planning**: COMPLETE - Timeline finalized (11 Mar 2026) ✅
**Phase 5 Execution**: Ready to begin Week 1 (P5-T21 Code Refactoring)
**Timeline**: 6-8 weeks (11 March - 5 May 2026)
**Target**: v1.0 Release Early May 2026 🚀
**Next Steps**: Start P5-T21 (Code Refactoring & Technical Debt Cleanup)

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

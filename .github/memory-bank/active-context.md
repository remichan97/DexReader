# DexReader Active Context

**Last Updated**: 31 January 2026
**Current Phase**: Transition - Phase 3 Complete, Phase 4 Planning
**Session**: Ready for Phase 4

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 3 Complete ✅ → Phase 4 Planning
**Progress**: Phase 3: 19/19 tasks (100%) | Phase 4: Not yet defined
**Current Date**: 31 January 2026
**Database Migration Status**: Fully migrated and operational
**Current Task**: Phase 4 planning and task definition
**Plan Document**: None

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

- 8 tables: manga, chapters, collections, collection_items, manga_progress, chapter_progress, reader_overrides, manga_tags
- Drizzle ORM with type-safe queries
- Foreign key constraints enabled
- Migrations in `src/main/database/migrations/`

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

# DexReader Active Context

**Last Updated**: 3 May 2026
**Version**: v1.1.0
**Mode**: Post-Release Maintenance & Feature Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.1.0 Released**: 29 April 2026 🎉

**Active Development**: Library enhancements

- ✅ Implemented "Include Downloaded Titles" toggle in Library view
- ✅ Reorganized Library header UI - converted checkbox to icon toggle button
- Next: Testing and user feedback
- Focus: Improving library management and download visibility
- Revamped DownloadView with soft delete for chapters

**Plans:**

- No active plans

---

## Known Issues

### esbuild Vulnerability (Transitive Dependency)

- **Severity**: Low
- **Source**: `drizzle-kit` → `esbuild` transitive dependency
- **Status**: GitHub Dependabot alert active, not yet resolved
- **Impact**: Development-time only (not runtime), not blocking v1.0
- **Action**: Monitor for `drizzle-kit` update that addresses this

<!-- Template for future issues:
### [Issue Title]
- **Severity**: Critical / High / Medium / Low
- **Affects**: Windows / macOS / Linux / All
- **Status**: Investigating / Fix in progress / Testing
- **Workaround**: [if available]
- **Tracked**: [GitHub issue link]
-->

---

## Recent Changes (Last 1-2 Weeks)

### 3 May 2026 - Library Header UI Reorganization

- **Type**: UI Enhancement
- **Summary**: Reorganized Library header layout by converting "Include Downloaded Titles" checkbox to an icon-only toggle button. Groups search-related controls (search bar + download toggle + info button) together with small gaps for visual distinction, separating the Collection action button. Uses ArrowDownload20 icons (Regular/Filled) with tooltip showing download count on hover.
- **Files**:
  - `src/renderer/src/views/LibraryView/LibraryView.tsx` - Icon imports, JSX restructure with search group
  - `src/renderer/src/views/LibraryView/LibraryView.css` - Removed checkbox styles, added toggle button active states
- **Impact**: Cleaner, more consistent UI following Windows 11 command bar patterns. Download count in tooltip only (no inline badge)
- **Status**: ✅ Implemented, ready for testing
- **Design**: Small gap (0.25rem) between buttons, ghost variant for toggle, subtle accent background when active

### 3 May 2026 - Library Downloaded Titles Toggle

- **Type**: Feature Enhancement
- **Summary**: Added "Include Downloaded Titles" toggle to Library view that shows both favorited manga AND non-favorited downloads. Backend handles merging via `includeDownloaded` flag in `getLibraryManga()`. Visual distinction with dual-badge system: heart badge for favorited, download badge for temporary downloads, download overlay for offline availability.
- **Files**:
  - `src/main/database/repositories/manga.repo.ts` - Added OR logic for favorited/downloaded filtering
  - `src/renderer/src/views/LibraryView/LibraryView.tsx` - Single query with flag, simplified state
  - `src/renderer/src/components/MangaCard/MangaCard.tsx` - Download badge and overlay rendering
  - CSS files - Badge and toggle styling
- **Impact**: Users can now see downloaded manga in Library without favoriting them first
- **Status**: ✅ Implemented, ready for testing
- **Note**: `isHidden` flag is exclusively for DownloadView (browser-style download manager), NOT filtered in library queries

### 29 April 2026 - v1.1.0 Release

- **Type**: Release
- **Summary**: Quality-of-life release adding post-update banner, configurable startup page, settings migration system, and removal of unused manga update checking features.
- **Key Features**:
  - Post-update "What's New" banner with GitHub release notes link
  - Startup page selection (Browse/Library/Downloads)
  - Automatic settings migration infrastructure
  - Cleaner codebase with unused features removed
- **Impact**: Improved user experience and maintainability
- **Status**: ✅ Released

<!-- Template for future updates:
### [Date] - [Brief Title]
- **Type**: Bug fix / Performance / Security / Dependency update / Feature
- **Summary**: [1-2 sentence description]
- **Files**: [key files changed]
- **Impact**: [user-facing changes if any]
-->

---

## Quick Reference

- **Documentation**: `docs/` directory
- **API Reference**: `docs/api-reference.md`
- **Architecture**: `docs/architecture/`
- **Coding Standards**: `.github/memory-bank/system-pattern.md`
- **Technology Stack**: `.github/memory-bank/tech-context.md`
- **v1.0 Development History**: `.github/memory-bank/historical/`
  - `archived-milestones.md` - All 29 milestones with architectural decisions
  - `v1.0-release-snapshot.md` - Complete v1.0 release state capture
  - `project-progress.md` - Development timeline

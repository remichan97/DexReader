# DexReader Active Context

**Last Updated**: 9 May 2026
**Version**: v1.3.0
**Mode**: Post-Release Maintenance & Feature Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.3.0 Released**: 9 May 2026 🎉

**Focus**: Post-release monitoring and next feature planning

- Search preset functionality completed (save, load, delete, set as default)
- Database schema and full CRUD operations implemented
- UI components for preset management integrated into Browse view
- Dependency updates applied (fast-uri, ip-address, drizzle-kit)
- Ready for user feedback and next development cycle

**Plans:**

- i18n Implementation: Phase 2 (Extraction) completed. 40 locale files created (13 en-GB, 13 en-US, 13 vi-VN, 1 README). Ready for Phase 3 (Component Updates).

---

## Known Issues

### esbuild Vulnerability (Transitive Dependency)

- **Severity**: Low
- **Source**: `drizzle-kit` → `esbuild` transitive dependency
- **Status**: GitHub Dependabot alert active, not yet resolved
- **Impact**: Development-time only (not runtime), not blocking releases
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

### 9 May 2026 - i18n Locale Extraction Completed

- **Type**: Feature Development
- **Summary**: Completed extraction and organization of all UI strings for internationalization support. Created comprehensive locale files for British English (en-GB) and American English (en-US).
- **Key Deliverables**:
  - 13 locale JSON files per language (~1,500+ translation keys total)
  - Namespaces: common, menu, errors, dialogs, validation, shortcuts, browse, library, downloads, reader, settings, history, mangaDetail
  - British → American spelling conversions applied systematically
  - Comprehensive README documentation for translation guidelines
  - TypeScript index files for both locales
- **Implementation Plan**: `.github/copilot-plans/i18n-implementation-plan.md`
- **Status**: Phase 2 (Extraction) ✅ Complete | Phase 3 (Component Updates) pending

### 9 May 2026 - v1.3.0 Release

- **Type**: Release
- **Summary**: Search preset feature release enabling users to save, load, and reuse search configurations in Browse view with full database persistence.
- **Key Features**:
  - Save search query + filters as named presets (up to 50 characters)
  - Load presets from dropdown with integrated delete button
  - Set default preset for automatic application on startup
  - Complete CRUD operations with IPC handlers and database schema
  - SavePresetDialog and PresetSelector UI components
  - Improved Select/Option component styling with hover states
  - Security updates: fast-uri 3.0.3 → 3.0.5
- **Impact**: Enhanced user experience with reusable search configurations
- **Status**: ✅ Released

### 6 May 2026 - v1.2.0 Release

- **Type**: Release
- **Summary**: Library enhancements release adding downloaded titles toggle, soft delete for chapters, improved search UI, and performance optimizations.
- **Key Features**:
  - Include Downloaded Titles toggle in Library view
  - Soft delete for downloaded chapters with confirmation dialog
  - Reorganized Library search header matching BrowseView pattern
  - Download and favorite status badges on manga cards
  - Settings performance improvement (5 writes → 1 write)
  - Optimized database queries

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

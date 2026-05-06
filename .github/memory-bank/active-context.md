# DexReader Active Context

**Last Updated**: 6 May 2026
**Version**: v1.2.0
**Mode**: Post-Release Maintenance & Feature Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.2.0 Released**: 6 May 2026 🎉

**Focus**: Post-release monitoring and next feature planning

- Library enhancements completed (download toggle, soft delete, UI reorganization)
- Database and settings performance optimizations shipped
- Ready for user feedback and next development cycle

**Plans:**

- No active plans

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

### 6 May 2026 - v1.2.0 Release

- **Type**: Release
- **Summary**: Library enhancements release adding downloaded titles toggle, soft delete for chapters, improved search UI, and performance optimizations for settings and database queries.
- **Key Features**:
  - Include Downloaded Titles toggle in Library view
  - Soft delete for downloaded chapters with confirmation dialog
  - Reorganized Library search header matching BrowseView pattern
  - Download and favorite status badges on manga cards
  - Settings performance improvement (5 writes → 1 write)
  - Optimized database queries
- **Impact**: Better library management and improved performance
- **Status**: ✅ Released
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

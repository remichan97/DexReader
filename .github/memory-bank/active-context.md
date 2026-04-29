# DexReader Active Context

**Last Updated**: 29 April 2026
**Version**: v1.1.0
**Mode**: Post-Release Maintenance & Feature Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.1.0 Released**: 29 April 2026 🎉

**Active Development**: Ready for next feature cycle

- All planned features for v1.1.0 completed
- Clean slate for new feature development
- Focus areas: User feedback, bug fixes, performance optimizations

**Plans:**

- No active plans - awaiting next feature cycle

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

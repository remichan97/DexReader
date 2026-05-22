# DexReader Active Context

**Last Updated**: 22 May 2026
**Version**: v1.5.0
**Mode**: Release Preparation

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.5.0 Released**: 22 May 2026 🌍

**Key Features in v1.5.0:**

- Content Language Settings - Configure up to 3 priority languages for manga content
- Settings infrastructure migrated to electron-store for improved reliability
- SettingsView reorganized with cleaner separation of concerns
- Translation improvements (Vietnamese and general)
- App lock feature deferred to future release

**Next Steps:**

- Monitor release workflow for successful builds
- Post-release: monitor user feedback and plan next cycle

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

### 22 May 2026 - v1.5.0 Release Preparation

- **Type**: Release
- **Summary**: Content Language Settings and enhanced settings management
- **Key Features**:
  - Content Language Settings with priority language selection (up to 3 languages)
  - PriorityLanguages component for language management
  - Settings infrastructure migrated from JSON to electron-store
  - SettingsView reorganization for better UX
  - Translation improvements across all locales
  - Dependency update: protobufjs 8.0.2 → 8.2.0
  - CI automation for release tagging
- **Impact**: Users can now filter manga content by preferred languages, improved settings reliability
- **Status**: 🔄 Ready for Release

### 18 May 2026 - v1.4.1 Hotfix Release

- **Type**: Hotfix
- **Summary**: Critical bug fixes for i18n initialization issues introduced in v1.4.0
- **Key Changes**:
  - Fixed settings version not being bumped in v1.4.0, preventing migrations
  - Fixed missing settings key during app init for i18n preferences
  - Ensured migrated settings are properly written to settings file
- **Impact**: Users upgrading from pre-v1.4.0 versions now properly migrate i18n settings
- **Status**: ✅ Released

<!-- Template for future entries:
### [Date] - [Title]
- **Type**: Feature / Bugfix / Release / Refactor
- **Summary**: Brief description
- **Key Changes**: Bulleted list
- **Impact**: User-facing impact or technical improvement
- **Status**: In Progress / Testing / Complete / Released
-->

---

## Quick Reference

- **Documentation**: `docs/` directory
- **API Reference**: `docs/api-reference.md`
- **Architecture**: `docs/architecture/`
- **Coding Standards**: `.github/memory-bank/system-pattern.md`
- **Technology Stack**: `.github/memory-bank/tech-context.md`

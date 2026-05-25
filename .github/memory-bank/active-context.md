# DexReader Active Context

**Last Updated**: 25 May 2026
**Version**: v1.6.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.6.0 Released**: 25 May 2026 ✅

**Monitoring Period**: Now through ~8 June 2026

- Monitor for user-reported issues or bugs in sandboxing implementation
- Watch for any regression in functionality
- Collect feedback on stability and performance

**Next Planned Work:**

- P2-T02: ESM Migration (v1.7.0) - Planned to start after monitoring period
- Monitor for `drizzle-kit` updates to resolve transitive esbuild vulnerability

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

### 25 May 2026 - v1.6.0 Release ✅

- **Type**: Security Enhancement
- **Summary**: Enabled Electron renderer sandboxing for improved security posture
- **Key Changes**:
  - Enabled sandbox mode in BrowserWindow webPreferences
  - Fixed preload bundling: changed `externalizeDeps: false` in electron.vite.config
  - Sandboxed preload now bundles dependencies (cannot access node_modules at runtime)
  - Localized unsaved changes dialogs (window close & navigation blocking)
  - Comprehensive testing: all features verified working
- **Impact**: Improved security against malicious content, better Electron compliance
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.6.0 section

### 22 May 2026 - v1.5.0 Release

- **Type**: Release
- **Summary**: Content Language Settings and enhanced settings management
- **Key Features**:
  - Content Language Settings with priority language selection (up to 3 languages)
  - Settings infrastructure migrated from JSON to electron-store
  - Translation improvements across all locales
- **Impact**: Users can filter manga content by preferred languages
- **Status**: ✅ Released

<!-- Archived entries moved to historical/archived-milestones.md -->

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

# DexReader Active Context

**Last Updated**: 25 May 2026
**Version**: v1.7.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.7.0 Released**: 25 May 2026 ✅

**Monitoring Period**: Now through ~8 June 2026

- Monitor for any issues with ESM migration
- Watch for compatibility issues with dependencies
- Collect feedback on stability and performance

**Next Planned Work:**

- Monitor for `drizzle-kit` updates to resolve transitive esbuild vulnerability
- Plan next feature development cycle

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

### 25 May 2026 - v1.7.0 Release ✅

- **Type**: Technical Enhancement
- **Summary**: Migrated entire codebase to ECMAScript Modules (ESM)
- **Key Changes**:
  - Updated package.json to specify `"type": "module"` for native ESM support
  - Refactored main process for full ESM compatibility
  - Implemented CommonJS compatibility workaround for electron-updater
  - Fixed IPC response handling in DownloadsView and dialog components
  - Fixed filesystem deleteDir recursive flag handling
  - Enhanced translation coverage for Downloads and favorite actions
- **Impact**: Modernized codebase with better Node.js ecosystem alignment, improved module loading
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.7.0 section

### 25 May 2026 - Previous Releases Summary

- **v1.6.0**: Renderer sandboxing for enhanced security
- **v1.5.0**: Content Language Settings with priority language selection

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

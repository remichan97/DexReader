# DexReader Active Context

**Last Updated**: 24 June 2026
**Version**: v1.11.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.11.0 Released**: 24 June 2026 ✅

**Monitoring Period**: Now through ~14 July 2026

- Monitor for any issues with native dependency elimination (node:sqlite, bcrypt-ts)
- Watch for potential database performance impacts with node:sqlite
- Collect feedback on build times and installation experience
- Monitor for any platform-specific issues with new dependencies

**Next Planned Work:**

- Plan next feature development cycle
- Consider additional enhancements based on user feedback
- Continue monitoring for dependency updates

---

## Known Issues

_No known critical issues at this time._

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

### 24 June 2026 - v1.11.0 Release ✅

- **Type**: Feature Release - Native Dependency Elimination
- **Summary**: Removed all native dependencies to eliminate build-time compilation requirements
- **Key Changes**:
  - Replaced `better-sqlite3` with Node.js built-in `node:sqlite` module
  - Replaced `bcrypt` with `bcrypt-ts` (pure TypeScript implementation)
  - Disabled native module rebuilding in electron-builder configuration (`npmRebuild: false`)
  - Significantly reduced build complexity and time
  - Eliminated requirement for native compilation toolchains
- **Impact**: Faster builds, simpler deployment, no C++ compiler required for development or packaging
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.11.0 section

### 24 June 2026 - v1.10.0 Release ✅

- **Type**: Feature Release - Drizzle ORM Upgrade
- **Summary**: Upgraded Drizzle ORM to Release Candidate 1.0 and updated multiple dependencies
- **Key Changes**:
  - Upgraded Drizzle ORM from v0.45.2 to v1.0.0-beta.22 (RC 1.0)
  - Updated 7 dependencies including protobufjs, react-router-dom, js-yaml
  - Revamped project memory bank system
- **Impact**: Enhanced ORM capabilities, improved security with dependency updates
- **Status**: ✅ Released

### 1 June 2026 - v1.9.0 & v1.9.1 Summary

- **v1.9.1**: Hotfix for CI workflow tag creation
- **v1.9.0**: Added Proxy Settings and Hardware Acceleration control

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
- **Wiki**: DexReader.wiki folder (user-facing documentation)
- **API Reference**: `docs/api-reference.md`
- **Architecture**: `docs/architecture/`
- **Coding Standards**: `.github/memory-bank/system-pattern.md`
- **Technology Stack**: `.github/memory-bank/tech-context.md`

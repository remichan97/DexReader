# DexReader Active Context

**Last Updated**: 27 May 2026
**Version**: v1.8.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.8.0 Released**: 27 May 2026 ✅

**Monitoring Period**: Now through ~17 June 2026

- Monitor for any issues with App Lock/Gatekeeper functionality
- Watch for user feedback on new Settings View navigation
- Collect feedback on stability and performance
- Monitor for any edge cases in passphrase handling

**Next Planned Work:**

- Monitor for `drizzle-kit` updates to resolve transitive esbuild vulnerability
- Plan next feature development cycle
- Consider additional security enhancements based on user feedback

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

### 27 May 2026 - v1.8.0 Release ✅

- **Type**: Feature Release
- **Summary**: Introduced App Lock (Gatekeeper) functionality for privacy protection and revamped Settings View
- **Key Changes**:
  - Added passphrase-based authentication with bcrypt for secure credential storage
  - Implemented unlock screen interface with exponential delay for failed attempts
  - Added comprehensive translation support for App Lock across all locales
  - Revamped Settings View with infinite scroll and quick jump navigation
  - Enhanced UnsavedChangesBanner to display specific settings changes
  - Integration of App Lock reset with settings reset operations
  - Fixed Settings quick jump dropdown width issue
  - Fixed high memory warning translation function wiring
  - CI workflow improvements for release automation
- **Impact**: Privacy protection for shared computers, improved Settings navigation and usability
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.8.0 section

### 25 May 2026 - v1.7.0 Release Summary

- **Type**: Technical Enhancement - ESM Migration
- **Summary**: Migrated entire codebase to ECMAScript Modules (ESM)
- **Impact**: Modernized codebase with better Node.js ecosystem alignment

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

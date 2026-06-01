# DexReader Active Context

**Last Updated**: 1 June 2026
**Version**: v1.9.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.9.0 Released**: 1 June 2026 ✅

**Monitoring Period**: Now through ~21 June 2026

- Monitor for any issues with Proxy Settings functionality
- Watch for feedback on Hardware Acceleration control
- Collect feedback on stability and performance
- Monitor for any edge cases in proxy configuration

**Next Planned Work:**

- Monitor for `drizzle-kit` updates to resolve transitive esbuild vulnerability
- Plan next feature development cycle
- Consider additional networking enhancements based on user feedback

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

### 1 June 2026 - v1.9.0 Release ✅

- **Type**: Feature Release
- **Summary**: Added Proxy Settings for network configuration and Hardware Acceleration control
- **Key Changes**:
  - Added HTTP/HTTPS proxy configuration with host and port settings
  - Implemented Hardware Acceleration toggle in Settings → Appearance
  - Condensed metadata layout for better space utilization
  - Fixed Download Path selection bypassing dirty tracking
  - Fixed Gatekeeper re-authentication issues during Settings navigation
  - Fixed incorrect Settings keys and preload method signatures
  - Improved command link dialogue consistency
  - Updated CI to checkout action v6
- **Impact**: Network proxy support for corporate environments, performance tuning via HW acceleration control
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.9.0 section

### 27 May 2026 - v1.8.0 Release Summary

- **Type**: Feature Release - App Lock & Settings Revamp
- **Summary**: Introduced App Lock (Gatekeeper) functionality and revamped Settings View
- **Impact**: Privacy protection for shared computers, improved Settings navigation

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

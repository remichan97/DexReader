# DexReader Active Context

**Last Updated**: 17 May 2026
**Version**: v1.4.0
**Mode**: Post-Release Maintenance & Feature Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.4.0 Released**: 17 May 2026 🌐

**Focus**: Post-release monitoring and next feature planning

- Full internationalization (i18n) support completed and released
  - 3 locales supported: British English (en-GB), American English (en-US), Vietnamese (vi-VN)
  - 40 locale files with 1,500+ translation keys
  - Language selection in Settings → Appearance
  - Automatic restart prompt for language changes
- Complete translation coverage across all views and components
- i18next + react-i18next infrastructure in place for future locale additions
- Ready for user feedback and next development cycle

**Plans:**

- Monitor user feedback on i18n implementation
- Consider additional language support based on community requests
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

### 17 May 2026 - v1.4.0 Release

- **Type**: Release
- **Summary**: Full internationalization support enabling multi-language UI across the entire application.
- **Key Features**:
  - 3 locales: British English (en-GB), American English (en-US), Vietnamese (vi-VN)
  - Display language selection in Settings → Appearance
  - Automatic restart prompt when language changes affect backend
  - Complete translation coverage across all views and components
  - i18next infrastructure with file system backend
  - Dependency update: protobufjs 8.0.1 → 8.0.2
- **Impact**: Enhanced accessibility for non-English speakers and users preferring American English spellings
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

# DexReader Active Context

**Last Updated**: 25 July 2026
**Version**: v1.12.1
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.12.1 Released**: 25 July 2026 ✅

**Monitoring Period**: Now through ~8 August 2026

- Monitor for any filesystem-operation regressions from the path-validator symlink/boundary fix (sandbox denies should only ever affect genuinely out-of-bounds or symlinked paths)
- Confirm the MangaDex@Home report POST is firing reliably for real chapter-image fetches (compliance requirement, not just a functional one)
- Watch for reports of the downloads path resetting unexpectedly (should be fixed by the nested-settings-backfill fix, but was silent before)
- Verify collection delete and downloads-delete confirm dialogs behave correctly across platforms

**Next Planned Work:**

- Continue the full-codebase refactor plan (`claude-plans/full-codebase-refactor-plan.md`) — Phase 1 (critical security fixes) is complete as of this release; Phase 2 (`src/shared` package scaffold) is next
- Once the refactor/cleanup effort finishes: plan and execute the react-router v6 → v7 migration (see Known Issues — CVE-2026-53669, no 6.x fix exists)
- Plan next feature development cycle
- Continue monitoring for dependency updates

---

## Known Issues

### react-router 6.x has no patch for CVE-2026-53669 (GHSA-wrjc-x8rr-h8h6)

- **Severity**: Medium (backslash-based open redirect via `useNavigate`/`<Link>`, e.g. `\\evil.com` misread as cross-origin by the browser)
- **Affects**: All platforms, in principle — but every `navigate()` call site in this codebase (18 call sites across 8 files, audited 2026-07-25) interpolates a MangaDex-API-sourced UUID (`manga.id`, `chapter.id`, `tagId`, `creatorId`), never raw user-typed text, so real exploitability today is low. Fix requires the app to pass an attacker-controlled string into a nav API, which would need a compromised/MITM'd MangaDex API response or a new injection point.
- **Status**: Deferred — no 6.x backport exists (Dependabot range `>=6.4.0, <7.18.0`, fixed only in 7.18.0). Not urgent enough to interrupt the current refactor/cleanup effort, but the only real fix is the react-router v7 major upgrade (`react-router-dom` folds into `react-router`; import/config changes throughout `App.tsx`/`router.tsx` and anywhere else importing `react-router-dom`).
- **Workaround**: None available short of the major upgrade; current low exploitability accepted as interim risk.
- **Tracked**: Plan the v7 migration as its own deliberate piece of work once the current refactor/cleanup effort (`claude-plans/full-codebase-refactor-plan.md`) finishes — use the Vitest renderer harness for regression coverage across all routes when it happens.

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

### 25 July 2026 - v1.12.1 Release ✅

- **Type**: Patch Release - Critical Security Fixes (Phase 1 of the full-codebase refactor plan)
- **Summary**: Closed the filesystem sandbox boundary/symlink bypass, the settings save-all system-directory blocklist bypass, added an image proxy domain allowlist, and implemented the required MangaDex@Home report-back. Also picked up a few pre-existing fixes already on the branch (nested-settings backfill, discard-changes field restoration, library list refresh).
- **Key Changes**:
  - `path-validator.ts`: exact-match-or-child-boundary check instead of raw `startsWith`; symlinks resolved via `fs.realpath` on the deepest existing ancestor (works even for not-yet-created paths)
  - `settings-manager.ts`/`app-settings.handler.ts`: `settings:save-all` now validates `downloadPath` (blocklist + sanitize + existence) before persisting, not after
  - `image.proxy.ts`: domain allowlist (`AtHomeGuardsUtil`) gates every fetch; MangaDex@Home report POST fires for every chapter-image fetch attempt, success or failure
  - `useCollectionManager.ts` / `MangaHeroSection.tsx`: confirm-dialog guards fixed so a declined or failed dialog can never proceed with delete
  - Fixed nested settings fields (e.g. custom downloads path) being silently dropped on load due to `deepMergeDefaults` only walking keys present in the static defaults object
  - Vitest tooling stood up for both `main` and `renderer` projects; all 6 fixes above ship with regression tests (44 tests total across 7 files)
- **Impact**: Closes 4 of the 7 critical issues from the 2026-07-04 security audit. No user-facing behavior change for the legitimate path (valid downloads paths, allowlisted image hosts, confirmed deletes all continue to work as before).
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.12.1 section

### 29 June 2026 - v1.12.0 Release ✅

- **Type**: Feature Release - Detail View Enhancements
- **Summary**: Clickable author/artist links, multiple authors/artists display, Sidebar mode, and Canvas/Sidebar settings
- **Key Changes**:
  - Clickable author/artist names in manga detail view for quick search
  - Multiple authors/artists now displayed (was single entry)
  - New Sidebar display mode for manga detail view
  - Canvas and Sidebar sizing settings added
  - Hero Backdrop feature dropped (to be revisited)
  - Fixed IPC bridge typing imports and manga shape typing issues
- **Impact**: Improved discoverability of authors/artists and more flexible detail view layout
- **Status**: ✅ Released
- **CHANGELOG**: All changes documented in CHANGELOG.md v1.12.0 section

### 24 June 2026 - v1.11.1 Release ✅

- **Type**: Patch Release - Build Fixes
- **Summary**: Fixed electron-builder configuration issue and updated Electron
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
- **Wiki**: DexReader.wiki folder (user-facing documentation)
- **API Reference**: `docs/api-reference.md`
- **Architecture**: `docs/architecture/`
- **Coding Standards**: `.github/memory-bank/system-pattern.md`
- **Technology Stack**: `.github/memory-bank/tech-context.md`

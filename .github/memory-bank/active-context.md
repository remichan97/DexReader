# DexReader Active Context

**Last Updated**: 4 September 2026
**Version**: v1.13.1 (release prepared, not yet merged/tagged) — was v1.13.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.13.0 shipped** — the full-codebase refactor plan (shared DTO/contract layer, preload contract migration, MangaDex DTO mapping, main-process integrity fixes, renderer god-component decomposition, cleanup/polish) merged to `main` and released. No full manual click-through regression pass was run across the whole refactor, only spot-checks per phase — worth keeping an eye out for stray regressions.

**Release v1.13.1 prepared, not yet shipped**: react-router v6 → v7 migration (see Recent Changes below) on `fix/react-router-dom-vuln`, version bumped (`package.json`/`package-lock.json`), `CHANGELOG.md` updated. Awaiting: PR opened against `main`, merged, and the `chore: v1.13.1 release`-style tip commit landing on `main` so `ci.yaml`'s `create-release-tag` job fires. This release is a single-purpose security patch — keep the PR scoped to the router fix and its supporting test/docs commits, not bundled with unrelated feature work.

**Next Planned Work:**

- Once v1.13.1 ships: confirm the Dependabot Security-tab alert for react-router auto-closes
- Start building out real unit test coverage beyond the ~9 files that exist today — was explicitly deferred out of v1.13.0 as ongoing/opportunistic backlog, not a blocker
- Plan next feature development cycle

---

## Known Issues

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

### 4 September 2026 - react-router v6 → v7 migration ✅

- **Type**: Security fix
- **Summary**: Resolved the Dependabot alert for CVE-2026-53669 / GHSA-wrjc-x8rr-h8h6 (backslash-based open-redirect in declarative-mode `useNavigate`/`<Link>`, no 6.x backport) by bumping `react-router-dom` from `^6.30.4` to `^7.18.3` and removing the stale `@types/react-router-dom` devDependency. Codebase audit beforehand confirmed no data-router APIs, nested splat routes, relative `navigate()` paths, or `React.lazy` routes were in use, so the migration was a straight version bump plus manual regression pass — no call-site changes needed. Added `src/renderer/src/router.test.tsx`, a Vitest smoke test asserting all 9 routes plus the 404 catch-all resolve to the expected view.
- **Status**: 🔄 Complete, on `fix/react-router-dom-vuln`, shipping as v1.13.1, awaiting PR merge to `main`

### 2 September 2026 - v1.13.0 release prepared ✅

- **Type**: Release prep
- **Summary**: Closed out the full-codebase refactor plan (Phases 7–8) and prepared the release: version bump to 1.13.0 (minor — the DB crash-recovery flow from Phase 5 is a genuine new capability, not just internal cleanup), `CHANGELOG.md` entry covering all user/security-facing changes since v1.12.1, stale `secureFs.ts`/`pathValidator.ts`/`index.d.ts`/`filesystemHandlers.ts` file-path references fixed in `docs/architecture/`, and CI/PR checks wired to actually run the unit test suite before build/tag creation.
- **Status**: ✅ Shipped

### 25 July – 2 September 2026 - Full-codebase refactor plan, Phases 2–8 ✅

- **Type**: Refactor, shipping as part of v1.13.0
- **Summary**: `src/shared/` package (contracts/DTOs/commands/enums shared between main and renderer); preload contract surface and MangaDex API entities migrated onto renderer-safe DTOs; main-process integrity fixes (transactional imports, typed settings getters, cache-age SQL bug, `chapter_downloads` uniqueness, DB-init crash recovery); renderer god-component decomposition (`SettingsView`, `MangaDetailView`, `App.tsx`, `MangaHeroSection`, `BrowseView`, `DownloadQueueService`, IPC handler file splits, narrow Zustand selectors); medium-priority cleanup sweep (CSP tightening, `assertNonNullObject<T>()`, re-enabled `no-non-null-assertion`, closed a `globalThis.*` typing gap that surfaced 112 latent type errors and 2 live bugs); low-priority polish (redundant DB indexes, computed-wait rate limiter, i18n'd dialog strings, scrubbed file paths from error messages, dead-code removal).
- **Full detail**: `claude-plans/full-codebase-refactor-plan.md` (all 8 phases marked ✅ COMPLETE with commit lists)
- **Status**: ✅ Complete, shipping in v1.13.0

<!-- Older entries (Phase-by-phase breakdown, v1.12.1 release) pruned per the 2-3 week retention rule — see claude-plans/full-codebase-refactor-plan.md and CHANGELOG.md for full history. -->

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

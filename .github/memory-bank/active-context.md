# DexReader Active Context

**Last Updated**: 2 September 2026
**Version**: v1.13.0 (release prepared, not yet merged/tagged) — was v1.12.1
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**Full-codebase refactor plan (`claude-plans/full-codebase-refactor-plan.md`) is complete** — all 8 phases done on `refactor/code-cleanup` (77 commits ahead of `main`): shared DTO/contract layer, preload contract migration, MangaDex DTO mapping, main-process integrity fixes, renderer god-component decomposition, medium-priority cleanup sweep, and low-priority polish.

**Release v1.13.0 prepared, not yet shipped**: version bumped (`package.json`/`package-lock.json`), `CHANGELOG.md` updated, a handful of stale file-path references in `docs/architecture/` fixed. Awaiting: PR opened against `main` (user is doing this manually), merged, and the `chore: v1.13.0 release` commit landing as the tip commit on `main` so `ci.yaml`'s `create-release-tag` job fires automatically. **Do not squash-merge this PR** — it collapses all 77 scoped commits into one; use "Rebase and merge" so the release-bump commit stays the last one and CI's tag automation still reads it correctly.

CI/PR checks were also updated this cycle to actually run the unit test suite (previously only lint+typecheck+build ran) — see `.github/workflows/ci.yaml` and `pr-checks.yaml`.

**Next Planned Work:**

- Once v1.13.0 ships: monitor for regressions (no full manual click-through regression pass was run across the whole refactor — only spot-checks per phase)
- Plan and execute the react-router v6 → v7 migration (see Known Issues — CVE-2026-53669, no 6.x fix exists)
- Start building out real unit test coverage beyond the ~8 files that exist today — was explicitly deferred out of this release as ongoing/opportunistic backlog, not a blocker
- Plan next feature development cycle

---

## Known Issues

### react-router 6.x has no patch for CVE-2026-53669 (GHSA-wrjc-x8rr-h8h6)

- **Severity**: Medium (backslash-based open redirect via `useNavigate`/`<Link>`, e.g. `\\evil.com` misread as cross-origin by the browser)
- **Affects**: All platforms, in principle — but every `navigate()` call site in this codebase (18 call sites across 8 files, audited 2026-07-25) interpolates a MangaDex-API-sourced UUID (`manga.id`, `chapter.id`, `tagId`, `creatorId`), never raw user-typed text, so real exploitability today is low. Fix requires the app to pass an attacker-controlled string into a nav API, which would need a compromised/MITM'd MangaDex API response or a new injection point.
- **Status**: Deferred — no 6.x backport exists (Dependabot range `>=6.4.0, <7.18.0`, fixed only in 7.18.0). Was deprioritised behind the refactor/cleanup effort; now that v1.13.0 is prepared, this is next in line.
- **Workaround**: None available short of the major upgrade; current low exploitability accepted as interim risk.
- **Tracked**: Plan the v7 migration as its own deliberate piece of work — use the Vitest renderer harness for regression coverage across all routes when it happens.

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

### 2 September 2026 - v1.13.0 release prepared ✅

- **Type**: Release prep
- **Summary**: Closed out the full-codebase refactor plan (Phases 7–8) and prepared the release: version bump to 1.13.0 (minor — the DB crash-recovery flow from Phase 5 is a genuine new capability, not just internal cleanup), `CHANGELOG.md` entry covering all user/security-facing changes since v1.12.1, stale `secureFs.ts`/`pathValidator.ts`/`index.d.ts`/`filesystemHandlers.ts` file-path references fixed in `docs/architecture/`, and CI/PR checks wired to actually run the unit test suite before build/tag creation.
- **Status**: 🔄 Prepared, awaiting PR merge to `main` (see Current Status for the rebase-merge caveat)

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

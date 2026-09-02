# DexReader Active Context

**Last Updated**: 2 September 2026
**Version**: v1.12.1 (released) — unreleased refactor work in progress on `refactor/code-cleanup`
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.12.1 Released**: 25 July 2026 ✅ — its monitoring period (through ~8 August) closed with no reported regressions from the path-validator/settings/image-proxy fixes.

**Now in progress**: `claude-plans/full-codebase-refactor-plan.md`, on branch `refactor/code-cleanup`, unreleased:

- Phases 2–5 (shared package foundation, preload contract migration, MangaDex DTO mapping layer, main-process integrity fixes) — complete, 1–22 August 2026
- **Phase 6** (renderer god-component decomposition) — ✅ complete 1 September 2026 (all 8 deliverables: `SettingsView`, `MangaDetailView`, `App.tsx`, `MangaHeroSection`, `BrowseView`, `DownloadQueueService`, Zustand selector adoption, IPC handler file splits)
- **Phase 7** (medium-priority cleanup sweep) — in progress, started 2 September 2026. Re-audited all 12 original findings against current code first (2 were already fixed by earlier phases: migration-runner driver import, and — same day — the `clearAllData()` FK/table-list bug). Then fixed 2 more same-day: removed the dead `userPreferencesStore.ts` (superseded by `electron-store`, zero real consumers) and fully removed the never-finished collections-reorder feature (command/handler/repo-method/preload binding) per an explicit decision that it's no longer wanted. **8 items remain** — see the plan file for the current list.

**Next Planned Work:**

- Finish Phase 7's remaining 8 items, then Phase 8 (low-priority polish backlog)
- Once the refactor/cleanup effort finishes: plan and execute the react-router v6 → v7 migration (see Known Issues — CVE-2026-53669, no 6.x fix exists)
- Cut a release once Phase 7 (and ideally 8) land — nothing has shipped since v1.12.1
- Plan next feature development cycle

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

### 2 September 2026 - Phase 7 cleanup sweep (in progress)

- **Type**: Refactor/cleanup, unreleased
- **Summary**: Started the medium-priority cleanup sweep from the full-codebase refactor plan. Audited all 12 original findings against the current codebase (several had drifted since the audit — code had moved during Phase 6, or been fixed incidentally); fixed 3 items same-day.
- **Key Changes**:
  - `cleanup.repo.ts`: `clearAllData()` no longer relies on a `PRAGMA foreign_keys` toggle that's a documented SQLite no-op inside a transaction — all 10 tables are now deleted explicitly in dependency order, closing a gap where `chapterDownloads`/`readHistory` weren't in the explicit clear list
  - Removed dead `userPreferencesStore.ts` (a pre-`electron-store` leftover with zero real consumers) and its now-orphaned types from `stores/types.ts`
  - Removed the never-finished collections-reorder feature end-to-end (shared command type, repo method, IPC handler, validator, preload binding) — was planned but is no longer wanted, per explicit decision
- **Status**: 🔄 In progress — 8 of the original 12 Phase 7 items remain (CSP `img-src` tightening, ID validation in `mangadex-client.ts`, `assertObject<T>()` helper, re-enabling `no-non-null-assertion`, `download:`/`downloads:` channel prefix consistency, `BrowseView` filter-enum double-casts, `globalThis.*` typing gap, missing `@shared` alias in `vitest.main.config.ts`)

### 1 September 2026 - Phase 6 complete: renderer god-component decomposition ✅

- **Type**: Refactor, unreleased
- **Summary**: Decomposed every "god component" flagged by the original audit into focused hooks/collaborators — `SettingsView`, `MangaDetailView`, `App.tsx`'s `AppContent`, `MangaHeroSection`, `BrowseView`, and the main-process `DownloadQueueService`; adopted narrow Zustand selectors in hot-path views; split oversized IPC handler files by domain (`library`/`collections`/`history`, `download`/`download-queue`).
- **Impact**: No component in the decomposed set exceeds ~300 lines now. `npm run typecheck`/`npm run lint` clean throughout; `npm run test:renderer` passes. App boot-smoke-tested after every commit; full manual click-through regression was not run (no UI-driving harness in the agent's environment) — only `MangaDetailView` got a human spot-check.
- **Status**: ✅ Complete, unreleased (see `claude-plans/full-codebase-refactor-plan.md` Phase 6 for the full commit list)

### 1–22 August 2026 - Phases 2–5: shared package, DTO mapping, main-process integrity ✅

- **Type**: Refactor, unreleased
- **Summary**: Built the `src/shared/` package (contracts/constants/utils, wired into all three TS configs + electron-vite + an ESLint guard against reaching into `src/main` from preload/renderer); migrated the preload contract surface and MangaDex API entities onto it as renderer-safe DTOs; fixed main-process integrity issues (transactional imports, typed settings getters, cache-age SQL bug, `chapter_downloads` uniqueness constraint, DB-init crash recovery).
- **Status**: ✅ Complete, unreleased — see the plan file for the detailed deliverable list per phase

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

<!-- Older entries (v1.12.0, v1.11.1 releases) pruned per the 2-3 week retention rule — see CHANGELOG.md for full release history. -->

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

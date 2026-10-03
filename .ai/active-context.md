# DexReader Active Context

**Last Updated**: 3 October 2026
**Version**: v1.15.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.14.0 shipped** (8 September 2026) — Database Snapshot & Restore ("Restore Points") feature, settings-merge and localisation fixes, ~700 unused translation keys pruned, dead `readHistory` subsystem removed.

**v1.15.0 shipped** (3 October 2026) - Bundles two feature branches of work plus a large test-coverage effort that accumulated on this branch:

- Settings page converted to autosave (immediate-apply) — see Recent Changes
- Read History feature: chronological day-grouped feed + calendar, replacing the old deduplicated "Continue Reading" list (unrelated to the `readHistory` subsystem removed in 1.14.0 — this is a new `read_history` table)
- A substantial unit test suite added across main process, preload, Zustand stores, and renderer hooks (0 → 1412 tests), with per-area coverage thresholds now enforced in `vitest.config.ts`. 7 real bugs were found and fixed while writing it (see Recent Changes) — none were previously reported, all caught by the tests themselves.

**Next Planned Work:**

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

### 3 October 2026 - Memory bank content audit & refresh ✅

- **Type**: Chore / docs
- **Summary**: `tech-context.md` and `architecture-overview.md` were both frozen at 12 June 2026 (v1.9.1) and had drifted badly out of sync with the codebase — fully rewritten against the current source tree (v1.15.0). Fixed, among others: CSP claim (`style-src 'self' 'unsafe-inline'`, `img-src ... https:`) was wrong — actual policy has no `unsafe-inline` and no `https:` in `img-src` at all (`src/renderer/index.html`); sandbox claim ("disabled") was backwards — `src/main/window.ts` sets `sandbox: true`; dependency list referenced `better-sqlite3`/`bcrypt`, which don't exist anymore (`node:sqlite` / `bcrypt-ts`); stores list was missing 6 of the 10 real Zustand stores; database schema section listed tables (`library`, `manga_metadata`, `cover_cache`) that don't exist — real tables are `manga`, `chapter`, `chapterDownloads`, etc.; IPC section claimed "37 channels/6 categories" vs. the real ~108 channels across 21 handler files; filesystem filenames were camelCase (`secureFs.ts`, `pathValidator.ts`) instead of the actual kebab-case (`secure-fs.ts`, `path-validator.ts`). Also fixed two smaller errors in `system-pattern.md` (`connection.ts` → `db-connection.ts`; `autoHideMenuBar: true` → the actual `false`) and a matching inconsistency in `CLAUDE.md` itself (its prose used the old camelCase/`connection.ts` names while its own Key File Locations table already had the right ones).
- **Status**: ✅ Complete

### 3 October 2026 - Memory bank relocated to `.ai/` ✅

- **Type**: Chore
- **Summary**: Moved the memory bank from `.github/memory-bank/` to `.ai/` (via `git mv`, history preserved) since this documentation system is no longer GitHub Copilot-specific. Updated every tracked reference to the old path: `CLAUDE.md`, `CHANGELOG.md`, `docs/api-reference.md`, the three `.claude/skills/*` skill files, and the memory bank's own internal cross-links. Also fixed two pre-existing stale references found along the way: `docs/architecture/filesystem-security.md` had a broken relative path to the memory bank (wrong number of `../`, predates this move) and `.claude/skills/memory-update/SKILL.md` referred to a non-existent `system-patterns.md` (should be singular, matching the real filename).
- **Status**: ✅ Complete

### 30 September – 3 October 2026 - Test-coverage effort + 7 bug fixes ✅

- **Type**: Testing + bugfixes
- **Summary**: Systematically filled unit-test gaps across the whole main process, the preload bridge, all 10 Zustand stores, the backup/restore services (DexReader + Mihon/Tachiyomi), the image/disk caching layer, and the renderer hooks directory — 0 to 1412 tests. Added vitest coverage reporting with per-area thresholds (`src/main`, `src/preload`, `src/shared`, `src/renderer/src/stores`); the renderer views/components tier was deliberately left out of both testing and the coverage gate (large surface, low value per file, better suited to E2E). Writing the tests surfaced 7 real, previously-unreported bugs, each fixed in its own commit before the accompanying test commit: (1) image proxy served responses built from `buffer.buffer` instead of the `Buffer` itself — small/medium buffers are allocated from Node's shared pool, so this appended up to ~64KB of garbage onto real image bytes; (2) `progressStore.deleteProgress` read its rollback value from the already-mutated map, making the optimistic-delete rollback a silent no-op; (3) Mihon/Tachiyomi backup export always lowercased genre tags due to a dead-code overwrite in a tag-name map; (4) Mihon backup import's cancellation was defeated by reading the abort signal through a mutable field after two `await`s, so a second import never actually stopped a stale first one; (5)-(7) three separate instances of the same missing-`useEffect`-cleanup bug (`appUpdate` listeners, `useGatekeeperGuard`'s menu-navigation listener, `useAccentColor`'s system-color-change listener), all double-registering under StrictMode's dev-mode double-invoke. Also removed `useNavigationListener.ts`, a dead hook with the same leak bug and zero callers.
- **Status**: ✅ Complete, on `feat/settings-autosave`, shipping in v1.15.0

### 15-19 September 2026 - Settings autosave + Read History feature ✅

- **Type**: Feature
- **Summary**: Converted the Settings page from buffered save/discard to per-field autosave across all six domains, via a new `settings:update-section` IPC channel (discrete controls write immediately, continuous inputs like accent colour debounce). Removed the dead buffered-save shell (`UnsavedChangesContext`, `useNavigationBlocker`, `settings:save-all`'s renderer-facing wrapper, per-domain `isDirty` plumbing) and repurposed the old unsaved-changes banner into a `RestartRequiredBanner` for the two settings that still need a restart. Separately, redesigned the `read_history` table and rebuilt the History page around it: a chronological, day-grouped event feed (not deduplicated by manga, unlike the old list) with a popover calendar to filter by day. Also fixed the MangaDex@Home User-Agent (was a frozen `1.0.0` literal) and added a proper MangaDex attribution/non-affiliation disclaimer to the About dialog.
- **Status**: ✅ Complete, on `feat/settings-autosave`, shipping in v1.15.0

<!-- Older entries (v1.13.0/v1.13.1 release prep, DB Snapshot & Restore feature build-out, react-router v6→v7 migration, full-codebase refactor phases 2-8) pruned per the 2-3 week retention rule - all shipped in v1.13.0/v1.13.1/v1.14.0. See CHANGELOG.md for full history. -->

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
- **Coding Standards**: `.ai/system-pattern.md`
- **Technology Stack**: `.ai/tech-context.md`

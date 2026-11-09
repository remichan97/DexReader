# DexReader Active Context

**Last Updated**: 9 November 2026
**Version**: v1.17.0 (prepared, not yet tagged)
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.17.0 prepared** (9 November 2026, minor; branch `feat/menu-integration`, 66 commits since `v1.16.1`, `main` has nothing the branch lacks) — the version bump (`package.json` and the lockfile), the `CHANGELOG.md` entry, the README and the headers of the docs revised this cycle are done; **commit, merge and the `v1.17.0` tag are next**. **Contents**: the in-app What's New window (Help menu and the update banner, `[YANKED]` markers on the seven never-published versions), Mihon/Tachiyomi import hardening with the other-language title list, the Mihon timestamp fix and its repair migration (`20261028155803_fix_mihon_millisecond_timestamp`, runs on first start), the export deprecation, import/export from any view, the five inert Library menu items removed, and the Manga Detail chapter list (newest first, every page loaded, order remembered per manga). **Left out on purpose**: Refresh Library and New Chapters, moved to the next release because the whole plan had grown to about 22 – 28 working days (the user's call on 9 November). **Checked**: typecheck, lint and 1,936 tests (145 files) pass on Node 26.13.0 (the Node 24 path CI pins was not run locally); a Windows build was run and the changelog window checked by hand (the user's word). **Not recorded as done**: macOS and Linux builds, and the `v1.17.0-beta.1` pre-release tag that `claude-plans/release-1-17-plan.md` §3 suggests (check how `electron-updater` treats a GitHub pre-release before relying on it). `1.17.0` is the **last release that can export to `.tachibk`**; see `docs/architecture/backup-import-export.md`.

**Shipped**: v1.16.1 (18 October 2026, PR #92) Fluent migration clean-up; v1.16.0 (12 October) the renderer's shared components moved to **Fluent 2** (`@fluentui/react-components`) behind stable public props, plus Browse filters in a dialog, language flags, Back returning to the originating view, chapter resume and a content-language guard (settings version 8); v1.15.0 (3 October) settings autosave, chronological Read History and the unit-test suite; v1.14.0 (8 September) Restore Points. Details: `CHANGELOG.md`.

**Next Planned Work:**

- **Finish 1.17.0**: commit the release prep (Conventional Commits, with the `Co-Authored-By` trailer), merge `feat/menu-integration`, tag `v1.17.0`
- **Next release (Refresh Library, New Chapters)**: build from the plans in `claude-plans/` (local, git-ignored; revised 9 November, see Recent Changes), starting with `refresh-library-plan.md` Step 1 (shared API client, `latestUploadedChapter` in the contract, the migration). **Decide first**: the 1.17.0 changelog and the export warning dialog both say "the next release removes the `.tachibk` exporter". If Refresh Library and New Chapters are the next release, either that release also removes the exporter (it is a small change, but loses the last export path to Tachiyomi-format apps) or the wording has to change before the next release ships
- **Mihon new-format support** (`claude-plans/mihon-backup-format-plan.md`, Package C): blocked until Mihon publishes its format
- **Wiki** (`DexReader.wiki`, a separate repo): `Import-and-Export.md` has an uncommitted edit about the deprecation and the other-language list; no page yet covers the newest-first chapter list, What's New or the changelog format (`Release-Process.md` could link to the Changelog Format section)
- Decide on the Known Issues below, starting with cache cleanup deleting read history

---

## Known Issues

### Settings file at the current version that fails validation throws instead of resetting

- **Severity**: Low
- **Affects**: All
- **Status**: Not fixed (pre-existing)
- **Detail**: `migrateSettings` has a "revert to defaults" branch for an invalid current-version file, but `validateSettings` throws a `TypeError` instead of returning `false`, so the branch can't run and `settingsManager.load()` throws. Only reachable by hand-editing or corrupting `settings.json`.

### Imported Mihon chapters have a placeholder `externalUrl` and a fixed language

- **Severity**: Low to Medium (matters for the planned New Chapters view)
- **Affects**: All
- **Status**: Fix planned (9 November, option A in `claude-plans/new-chapters-view-plan.md`): the importer stops writing the placeholder, the DexReader export stops writing `''`, and a custom data-fix migration clears existing placeholders and empty strings. The fixed `en` language stays
- **Detail**: The Mihon importer saves each chapter with `externalUrl: '/chapter/<uuid>'` (not a real URL) and `language: 'en'`, because a backup has neither. Code that treats `externalUrl` as "official external chapter, can't be read in the app" (the New Chapters plan hides those) would hide imported chapters. The timestamp half of this import was fixed in 1.17.0 (milliseconds are now read as milliseconds, and migration `20261028155803_fix_mihon_millisecond_timestamp` repairs rows imported before).

### The Restore Points snapshot is taken after migrations, not before

- **Severity**: Low to Medium (matters for any release with a data-fix migration, such as 1.17.0's)
- **Affects**: All
- **Status**: Not fixed
- **Detail**: `src/main/index.ts` runs `runMigrations()` first and `databaseSnapshotService.createSnapshotOnAppStartup()` after it, so the automatic snapshot of a freshly updated app already includes the migrated data. The newest snapshot from before the update is the only safety net, and only if it was recent. A "snapshot before pending migrations" step would close the gap.

### Cache cleanup also deletes read history

- **Severity**: Low to Medium (data loss, needs a decision on intent)
- **Affects**: All
- **Status**: Not fixed (documented in `docs/architecture/database-architecture.md`)
- **Detail**: `read_history.manga_id` references `manga` with `ON DELETE CASCADE`, and `mangaRepo.cleanupMangaCache()` deletes any non-favourite, non-downloaded `manga` row not accessed for 90 days. It runs after every progress save, and Settings → Cache Management can run it immediately for all such rows. So the calendar history of those manga is removed with their cache row, and they drop out of the History list (inner join on `manga`), although `manga_progress`/`chapter_progress` stay. If history should outlive the cache, exempt manga that have `read_history` rows from the cleanup condition (or drop the cascade).

### Cover disk-cache limit is probably not enforced

- **Severity**: Low (unbounded disk growth)
- **Affects**: All
- **Status**: Not fixed (documented in `docs/architecture/mangadex-api.md`)
- **Detail**: `DiskCacheUtil.enforceDiskCacheLimit` lists only the top level of `cache/covers`, whose entries are per-manga folders (`{mangaId}/{file}`). It sums those folders' own `stat().size` (0 on Windows) and tries to `deleteFile` them (`EPERM`, caught and logged), so the default 50 MB limit never trims anything. The unit test passes only because it mocks `readDir` with flat paths (`manga-old/cover.jpg`). `getDiskCacheSize` already recurses one level; eviction should do the same and delete files.

### MangaDex rate limits are per client, not shared

- **Severity**: Low
- **Status**: Fix planned (Step 1 of `claude-plans/refresh-library-plan.md`: one shared client and limiter for the main process, because Refresh Library would otherwise add a fourth client)
- **Detail**: The IPC handlers, `DownloadService` and the `ImageProxy` each create their own `MangaDexClient`, and each client has its own `RateLimiter`, so UI requests and download requests don't share the 5 req/s budget. The 429 retry handling absorbs overruns. Sharing one limiter would remove the risk.

### Smaller robustness gaps found while auditing the docs

- **Severity**: Low
- **Detail**: (1) The Downloads folder validator accepts a symlinked or junctioned folder, but `secureFs` then refuses every path under it, so downloads fail. (2) `isSystemDirectory` is a case-sensitive prefix check covering only `C:` on Windows. (3) `GlobalErrorHandler`'s toast text is hard-coded English, not translated. (4) The main process has no `uncaughtException`/`unhandledRejection` handler, so a throw outside an IPC handler isn't logged. (5) Six main-process files use `node:fs` directly; backup import/export is intentional (user-chosen paths) but nothing enforces the `secureFs` rule. Details are in `filesystem-security.md` and `error-handling.md`.

### Large renderer chunks

- **Severity**: Low
- **Detail**: `npm run build` warns about `ui-vendor` (~1.17 MB) and `index` (~1.0 MB) chunks after adding Fluent. No code-splitting yet.

### Dev server can miss file changes (Windows)

- **Severity**: Low (dev only)
- **Detail**: Vite's watcher occasionally kept serving a stale module (after `sed -i` on a file, and after adding a new export), which shows as `does not provide an export named …` and a blank window. `touch`-ing the files and reloading fixes it.

### `npm audit` reports 12 moderate advisories, all from `minimatch` (dev tooling only)

- **Severity**: Low (dev only)
- **Detail**: GHSA-g3hv-75wg-m249 (denial of service via globparts amplification) affects `minimatch >=7.0.0 <11.0.1`. The 12 entries are one finding repeated up the chain: `minimatch@9.0.9` under `@typescript-eslint/typescript-estree` and `@electron/universal`, and `minimatch@10.2.5` under `app-builder-lib`. All of it is build and lint tooling (`electron-builder`, `typescript-eslint`), so nothing ships in the packaged app, and a hostile glob would have to come from our own config.
- **Checked on 5 November 2026**: `typescript-eslint@8.72.1` still depends on `minimatch ^10.2.2`, and `electron-builder@26.18.1` (the newest 26.x; `26.28.1` doesn't exist) still pins `minimatch ^10.2.5` and `@electron/universal 2.0.3`. Neither clears the audit.
- **Do not**: run `npm audit fix --force` (it downgrades `electron-builder` to 25.1.0), or add a global `minimatch` override (`eslint`, `eslint-plugin-react`, `@electron/asar` and `dir-compare` use 3.x, and `filelist` uses 5.x, which export the function directly and would break on 11).
- **Revisit**: when `electron-builder` and `typescript-eslint` release versions depending on `minimatch >=11.0.1`, a plain upgrade should fix it. Until then, add scoped `overrides` in `package.json` for `@typescript-eslint/typescript-estree`, `@electron/universal` and `app-builder-lib` pointing at `minimatch@^11.0.4` (needs Node `20 || >=22`, so confirm CI's Node version), then run `npm audit`, `typecheck`, `lint`, `test` and `build:win`. Also check whether CI gates on `npm audit`, which would make this block a release.

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

### 9 November 2026 - v1.17.0 release prep ✅

- **Type**: Release (minor)
- **Summary**: Branch prepared for 1.17.0 from the finished pieces. At the release checkpoint the user chose to ship now and move Refresh Library and New Chapters to the next release, since they had grown the plan by about 5 days
- **Key Changes**: version 1.17.0 in `package.json` and `package-lock.json`; a `CHANGELOG.md` entry with seven sections (Added, Changed, Deprecated, Removed, Fixed, Dependencies, Build), checked against the in-app parser; README (version, Electron 43.8.3, a Backup & Restore feature line); the headers of the docs revised this cycle (database, IPC, MangaDex API, state management, menu bar, backup docs, API reference); the tech-context version table and test count
- **Dependencies**: Electron 43.7.5 → 43.8.3, Vite 7.3.5 → 7.3.7, Vitest and its coverage provider 4.1.11 → 4.1.12, happy-dom 20.10.6 → 21.0.4, fast-uri 3.1.8 → 3.1.9, undici 7.30.0 → 7.30.1 (and 6.29.0 → 6.29.1 inside node-gyp)
- **Impact**: Settings stay at version 8; one data-fix migration runs on first start (it repairs dates stored by earlier Mihon imports). Note the automatic Restore Points snapshot is created **after** `runMigrations()` at startup, so it is no safety net for a migration (see Known Issues)
- **Status**: ✅ Prepared, not committed or tagged. Gates: typecheck, lint, 1,936 tests, Prettier on the changed files

### 9 November 2026 - Refresh Library and New Chapters planned (for the next release) 📝

- **Type**: Planning (nothing built)
- **Summary**: `claude-plans/refresh-library-plan.md` revised and `claude-plans/new-chapters-view-plan.md` recreated (it had gone missing), both checked against the code and the live MangaDex API, with the decisions settled with the user. `release-1-17-plan.md` still lists them as part of 1.17.0 and needs updating to say they moved on
- **Key Decisions**:
  - **Scope**: favourites plus manga with completed downloads. Refresh leaves `updatedAt` alone (nothing sorts on it)
  - **API etiquette**: one shared `MangaDexClient` and limiter for the main process; metadata in batches of 100 with `limit=100` (the default is 10 even with `ids[]`); an id MangaDex no longer returns is simply absent, so "not found" is a set difference and never a deletion; chapter phase paced to about 2 requests per second
  - **Cooldown**: 15 minutes after a **successful** run. Inside it Refresh stays clickable, holds a "checking" state for 3 seconds with the button disabled, then says "Everything is up to date. Last checked N minutes ago", making no request except for titles never refreshed. Partial updates are kept, a partial or failed run starts no cooldown, and 3 consecutive failed requests end a run
  - **Startup refresh**: a new Settings toggle, **on by default**, about 10 – 15 s after launch like the update check, a progress strip while it runs and a toast only for new chapters or failures
  - **New Chapters**: last 7 days (a base point to revisit later), only the user's content languages requested and re-queried at the next refresh when the list changes, external-URL chapters skipped (`includeExternalUrl=0`), every upload shown, grouped by day then manga, read chapters dimmed (no toggle), single-select collection filter, no sidebar badge, `BookExclamationMark` icon after Library, `Ctrl+5`; offline shows stored data with downloaded chapters still openable
  - **Data**: one generated migration (four new `manga` columns and a single-row refresh-state table) and one custom data-fix migration for imported chapters' placeholder `externalUrl`. The effective content-language calculation, now duplicated in `searchStore.ts` and `useMangaDetailData.ts`, moves to one function in `src/shared`
- **Impact**: About 13 – 15 working days of build for the next release, which also adds a setting (1.17.0 adds none)
- **Status**: Planned. Still open: the startup delay, whether the settings version moves for the new field, and the "snapshot before pending migrations" question

### 26 October – 9 November 2026 - What went into 1.17.0 (all in the release) ✅

- **Type**: Features, fixes and refactors on `feat/menu-integration`
- **Summary**: Short pointers, since each piece is in the changelog and its doc:
  - **Import/export from any view**: `BackupHost` plus a shared lock, mounted once in `App.tsx` (pattern in `system-pattern.md`, "App-level owners for menu-driven flows")
  - **Mihon/Tachiyomi**: the import, the millisecond fix and the deprecation are described in `docs/architecture/backup-import-export.md`
  - **Chapter list**: state is always oldest first and only the display reverses; the per-manga order lives in `localStorage` (`docs/architecture/state-management.md`); MangaDex's real names are `publishAt` and `publishAtSince`
  - **Changelog window**: bundled `CHANGELOG.md`, second preload and page, menu re-removal after rebuilds (`system-pattern.md`, "Secondary windows" and "The changelog is bundled, not fetched"; format contract in `docs/RELEASE_PROCESS.md`)
  - **Node 26 test fix**: recorded in `tech-context.md` (Testing)
- **Status**: ✅ Committed on `feat/menu-integration`, checked by hand

<!-- Older entries (the individual 1.17.0 work entries, v1.16.1 prep, Fluent 2 migration, test-coverage effort, settings autosave + Read History, v1.13.x/v1.14.0 work, react-router v7, refactor phases) pruned or folded per the 2-3 week retention rule - all shipped. See CHANGELOG.md for full history. -->

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

# DexReader Active Context

**Last Updated**: 28 October 2026
**Version**: v1.16.1
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.17.0 in progress** (branch `feat/menu-integration`, nothing released yet) — one combined release, planned in `claude-plans/release-1-17-plan.md` (local and git-ignored, one plan file per piece sits beside it). **Done**: import/export from any view (`BackupHost`), the inert Library menu items and the dead code behind them removed, Mihon import hardening with the other-language title list, the Mihon timestamp fix and its data-repair migration, the export deprecation notice, and the Manga Detail chapter list newest first with every page of a long series loaded (done and checked by hand; it stayed on this branch, as will the rest). **To build, in this order**: the in-app changelog window (plus `[YANKED]` markers on the seven never-published versions in `CHANGELOG.md`), Refresh Library phase 1 (one migration for all the new `manga` columns), the New Chapters view, then Refresh Library's chapter phase, then release prep (version bump, changelog, `v1.17.0-beta.1` tag first). Checkpoint after the changelog window: if the data-layer pieces slip, ship the rest as 1.17.0. `1.17.0` is the **last release that can export to `.tachibk`**; the release after it removes the exporter and adds Mihon's new backup format once Mihon publishes it (see `docs/architecture/backup-import-export.md`).

**v1.16.1 prepared** (18 October 2026, patch; awaiting merge and the `v1.16.1` tag) — the Fluent migration clean-up: dead styles, components, tokens and dependencies removed, undefined-variable styling fixed, download badge colours restored, docs rewritten against the code.

**v1.16.0 shipped** (12 October 2026) — The renderer's shared components moved from hand-rolled to **Fluent 2** (`@fluentui/react-components`), one component at a time behind stable public props, plus the UX work that fell out of it: Browse filters in a dialog with draft/Apply semantics and searchable tag/language pickers (the Languages filter now actually applies to search), language flags (`LanguageBadge`), Back returning to the originating view, chapter resume from the chapter list/History/Downloads, and a content-language guard (settings version 8). Details: `CHANGELOG.md`.

Earlier: v1.15.0 (3 October) settings autosave + chronological Read History + the unit-test suite; v1.14.0 (8 September) Restore Points.

**Next Planned Work:**

- The rest of 1.17.0 (see Current Status), then the Mihon removal release and new-format support (plan: `claude-plans/mihon-backup-format-plan.md`, Package C, blocked until Mihon publishes its format)
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
- **Status**: Not fixed
- **Detail**: The Mihon importer saves each chapter with `externalUrl: '/chapter/<uuid>'` (not a real URL) and `language: 'en'`, because a backup has neither. Code that treats `externalUrl` as "official external chapter, can't be read in the app" (the New Chapters plan hides those) would hide imported chapters. Decide whether to stop writing `externalUrl` for imports and what language to record. The timestamp half of this import was fixed in 1.17.0 (milliseconds are now read as milliseconds, and migration `20261028155803_fix_mihon_millisecond_timestamp` repairs rows imported before).

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

### 28 October 2026 - Manga Detail chapter list newest first, every page loaded (v1.17.0 work) ✅

- **Type**: Bugfix / feature
- **Summary**: The detail page fetched one page of 100 chapters, oldest first, so a series with more could never show its newest chapters and the sort selector only reordered those 100. Newest first is now the default, remembered per manga, and long series load in full (first page at once, the rest in the background)
- **Key Changes**:
  - **State is always oldest first** (`useMangaDetailData` `chapters`); only the display reverses (`useChapterFilters`, which also returns `readingOrderChapters`). The Reader's previous/next, Start Reading and Download all depend on that order, and Download all queues oldest first
  - `utils/chapterOrder.ts` (one comparator: chapter number, then volume, publish date, id; no number sorts first), `utils/chapterFeedLoader.ts` (500 per page, the first page from the end the list is sorted towards, reports the merged list after each page, all four content ratings, cancellable, `partial` result when a later page fails), `utils/chapterSortPreference.ts` (`localStorage` key `dexreader:mangaDetail:chapterSort`, only manga flipped to oldest first, 300 most recent)
  - While incomplete: a placeholder row at the missing end ("Loading older chapters… 500 of 1,240", retry if a page failed), heading shows "n of total", and Start Reading, Continue (unless the chapter being read is loaded) and Download all are disabled. Offline cached lists count as complete. Every load is cancellable (language switch, retry, unmount)
  - The Reader finishes a list handed over incomplete (`chaptersComplete: false`, `chapterLanguage` in the navigation state) and loads the whole list itself when opened from History or Downloads (no longer capped at 500 English chapters); a longer list is never replaced by a shorter one handed over by navigation
  - **API names fixed**: the order key and date filter are `publishAt` / `publishAtSince`; the enum value `PUBLISHED_AT` and `FeedParams.publishedAtSince` said `publishedAt…`, which the API rejects (400). Relevant to the New Chapters plan
  - Spike (live API): 500-row pages honoured, `total` exact, ids unique across pages, about 0.4 - 0.65 s per page; 617 English chapters (the longest among the 40 most-followed series) load in about 1 s; 102 of 617 chapter numbers repeat (several groups)
  - Docs: `mangadex-api.md`, `state-management.md` (the `localStorage` exception)
- **Impact**: Long series show their newest chapters and every chapter, in the order the user picked and last used for that manga
- **Status**: ✅ Committed on `feat/menu-integration`; gates (typecheck, lint, 1,720 tests, coverage, build) pass and checked by hand (long series, language switch and sort flip mid-load, short series, offline, order kept after restart, light and dark). For the `1.17.0` changelog: Fixed - long series now show all their chapters in the detail page and Reader (previously only the first 100 and 500); Changed - the chapter list is newest first by default and the order is remembered per manga

### 28 October 2026 - Mihon timestamp fix, backup model types, menu wording (v1.17.0 work) ✅

- **Type**: Bugfix / cleanup
- **Summary**: Follow-ups to the Mihon work. A real Mihon backup showed that Mihon writes times in milliseconds while DexReader read and wrote seconds, and that the backup model's `number` types did not match what protobufjs returns (strings for every int64)
- **Key Changes**:
  - `mihon-backup.decoder.ts` converts the int64 fields to numbers once (`normaliseBackup`); the two source ids stay strings. The model types are now true. Helper code needs no `Number()` wrapping
  - Importer builds publish dates straight from milliseconds and converts history read times to seconds; the exporter writes milliseconds and sends the publish date as `dateUpload` (it used the cache date for both)
  - Migration `20261028155803_fix_mihon_millisecond_timestamp` (custom, generated with `drizzle-kit generate --custom`) divides the chapter and progress timestamps above 1e10 by 1000 and rebuilds the History day strings that read like `57589-10-12`. Custom migrations need `--> statement-breakpoint` between statements or only the first one runs; checked on a throwaway database
  - The export menu item is now "To Tachiyomi Format (.tachibk)..." with a matching save dialog (the deprecation wording says it is the Tachiyomi format being retired, never "Mihon/Tachiyomi"); the five dead Library menu items and their `MenuState` fields, preload listeners and strings were removed
  - New doc `docs/architecture/backup-import-export.md`; wiki page `DexReader.wiki/Import-and-Export.md` edited for the deprecation and the other-language list, **uncommitted in the wiki repo**
- **Impact**: Imported chapters and History get correct dates; rows from earlier imports are repaired at startup
- **Status**: ✅ Committed on `feat/menu-integration`, checked by hand. For the `1.17.0` changelog: Fixed - Mihon/Tachiyomi imports read chapter dates and read times as milliseconds (earlier imports are repaired automatically); Added - list of skipped other-language titles after a Mihon/Tachiyomi import; Changed - the import accepts uncompressed backups and reports specific errors, the export item is named "To Tachiyomi Format (.tachibk)..."; Deprecated - exporting to the Tachiyomi backup format (removed in the next release); Removed - menu items that never did anything.

### 27 October 2026 - Mihon/Tachiyomi import hardening, other-language titles, export deprecation (v1.17.0 work) ✅

- **Type**: Feature / refactor
- **Summary**: Mihon announced that `0.21.x` is the last version that can restore Tachiyomi-format `.tachibk` backups (its replacement format isn't public yet). DexReader keeps reading `.tachibk` indefinitely; this work makes that import robust, explains what it leaves out, and announces the end of the `.tachibk` export. Plan: `claude-plans/mihon-backup-format-plan.md` (Package A and B done; the export removal and the new-format support are later releases)
- **Key Changes**:
  - `mihon.proto` cut down to the fields DexReader uses, all optional, so upstream schema drift (extension stores, preferences, trackers, memo, ...) can no longer fail a decode. New `mihon-backup.decoder.ts` accepts gzip or plain protobuf, rejects JSON/empty/damaged files with codes (`MIHON_BACKUP_*`, carried as `IpcError` and translated in the renderer), turns the 64-bit fields into numbers (protobufjs returns them as strings; the two source ids stay strings because they exceed 2^53), and fills in the empty lists protobufjs omits. Unused `Backup*` type files removed
  - English MangaDex stays the only imported source. Other-language MangaDex sources are recognised by a source named "MangaDex" in the backup's own source list, left out, and returned as `skippedOtherLanguage`; the result dialog lists them with checkboxes and "Add selected", which re-runs the import on the same file with `includeMangaIds` (handler-validated UUIDs, max 5000; only other-language entries can be picked). Entries from other sites are counted in `ignoredOtherSourceCount`
  - The exporter now writes an empty chapter name instead of omitting it (the schema no longer enforces what Mihon requires)
  - The Mihon/Tachiyomi export warning dialog says exporting to the Tachiyomi backup format (`.tachibk`) is being retired (importing `.tachibk` files and Mihon support are not affected) and what that means for restoring in Mihon (`menu:library.dialogs.exportMihonTachiyomiWarning.deprecation`, three locales)
  - Tests: real-protobuf decoder tests against an upstream-shaped schema, service, handler, preload, hook, dialog and library-menu tests
- **Impact**: A Mihon import no longer fails on unknown upstream fields, uncompressed files work, errors say what is wrong, and users with non-English MangaDex libraries can see and add back what was skipped. Decode of a 300,000-chapter synthetic library took about 0.6 s and 360 MB of heap, so no streaming was needed
- **Status**: ✅ Committed and checked by hand. Gates: typecheck, lint, tests, coverage, production build. For the `1.17.0` changelog: Added - list of skipped other-language titles after a Mihon/Tachiyomi import; Changed - the import accepts uncompressed backups and reports specific errors; Deprecated - exporting to the Tachiyomi backup format (`.tachibk`), removed in the next release

### 27 October 2026 - Global Import/Export (v1.17.0 work) ✅

- **Type**: Bugfix / refactor
- **Summary**: The Library menu's import and export items now work from every view, including the Reader. Before, the listeners and dialogs lived inside `LibraryView`, so a menu pick from any other view opened the native file dialog and then silently dropped the chosen path.
- **Key Changes**:
  - New `BackupHost` component (`components/BackupHost/`) owns `useDexReaderImportExport`, `useMihonImportExport` (moved to `src/renderer/src/hooks/`, no longer take store callbacks) and the four dialogs. Mounted once in `App.tsx` at the same position in both the Reader and AppShell layouts, after the Gatekeeper gate, so it survives Reader/AppShell navigation
  - Shared backup lock (`utils/backupOperationLock.ts`): one backup operation or dialog at a time; a second menu pick shows a toast (`common:backup.busy*`, three locales)
  - `utils/refreshAfterImport.ts` reloads library, collections, cached progress (new `progressStore.reloadCachedProgress`), progress metadata and the history feed after either import
  - `LibraryView` no longer owns any of this, and now silently refreshes its grid when the favourites store changes (an import while the view is open used to leave the grid stale until remount)
  - Mihon result dialog's "View library" now navigates to `/library`; `ImportResult` type now has one home (exported from `ImportResultDialog`)
- **Impact**: Menu import/export usable anywhere. Existing English toast strings in the hooks were left as they were (i18n of those is a follow-up)
- **Status**: ✅ Committed on `feat/menu-integration` and checked by hand from the views. For the `1.17.0` changelog: Fixed - "Library import/export from the menu now works from any view"

### 18 October 2026 - v1.16.1 release prep ✅

- **Type**: Release (patch)
- **Summary**: Version 1.16.1 prepared on `chore/fluent-migration-cleanup`: package version, `CHANGELOG.md`, README and the doc headers. Patch because the branch has no features and no data or settings change. The branch finished the Fluent 2 migration clean-up: removed the orphaned stylesheets, components, tokens, utility classes (190 → 51), props and dependencies it left behind; fixed ~140 references to CSS variables that were never defined (unlock screen background, reader animations and shadows, failed-download badge, settings header, typography sizes); styled the MangaCard cover-error state and the Input error icon; restored the chapter download badge status colours; removed the global `button`/`input` rules from `main.css` (each control now carries its own font, weight, hover border and transition). Rewrote the architecture, design and component docs against the code. Net visible side effects, listed in the changelog: no faint hover tint on borderless link-style buttons, and focus rings on checkboxes and the colour picker.
- **Status**: ✅ Prepared; awaiting merge, then the `v1.16.1` tag. Gates: typecheck, lint, 1486 tests, production build

### 7 – 12 October 2026 - Fluent 2 migration (v1.16.0) ✅

- **Type**: Refactor + features + bugfixes
- **Summary**: Migrated tier by tier, verifying each in the running app with real input. Decisions worth remembering: wrappers keep public props and drop only props with zero call sites; `ContextMenu` was decommissioned (card hover overlay + tab kebab button); Fluent popups carry size caps that must be overridden per layout (see `system-pattern.md`); the reader nests its own `FluentProvider` (so `ReaderSettingsModal.css` deliberately uses Fluent's CSS variables); flags are bundled SVGs because Windows can't draw emoji flags.
- **Status**: ✅ Shipped in v1.16.0

### 30 September – 3 October 2026 - Test-coverage effort, memory bank refresh ✅

- **Type**: Testing + docs
- **Summary**: 0 → 1412 tests with per-area coverage thresholds (7 real bugs found and fixed while writing them); memory bank moved to `.ai/` and rewritten against the real source tree. Shipped in v1.15.0.
- **Status**: ✅ Complete

<!-- Older entries (settings autosave + Read History, v1.13.x/v1.14.0 work, react-router v7, refactor phases) pruned per the 2-3 week retention rule - all shipped. See CHANGELOG.md for full history. -->

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

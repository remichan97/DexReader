# DexReader Active Context

**Last Updated**: 18 October 2026
**Version**: v1.16.1
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.16.1 prepared** (18 October 2026, patch; awaiting merge and the `v1.16.1` tag) — the Fluent migration clean-up: dead styles, components, tokens and dependencies removed, undefined-variable styling fixed, download badge colours restored, docs rewritten against the code.

**v1.16.0 shipped** (12 October 2026) — The renderer's shared components moved from hand-rolled to **Fluent 2** (`@fluentui/react-components`), one component at a time behind stable public props, plus the UX work that fell out of it: Browse filters in a dialog with draft/Apply semantics and searchable tag/language pickers (the Languages filter now actually applies to search), language flags (`LanguageBadge`), Back returning to the originating view, chapter resume from the chapter list/History/Downloads, and a content-language guard (settings version 8). Details: `CHANGELOG.md`.

Earlier: v1.15.0 (3 October) settings autosave + chronological Read History + the unit-test suite; v1.14.0 (8 September) Restore Points.

**Next Planned Work:**

- Manga Detail chapter list: default to newest first. Needs the feed loaded in full (it fetches one page of 100 today, so long series can't reach their other end) and the list kept ascending in state, because the reader's Previous/Next and "Start Reading" assume that order. Planned on its own branch (`fix(detail)`)
- Menu bar integration (wire or remove the five Library menu items, see Known Issues)
- Decide on the Known Issues below, starting with cache cleanup deleting read history

---

## Known Issues

### Settings file at the current version that fails validation throws instead of resetting

- **Severity**: Low
- **Affects**: All
- **Status**: Not fixed (pre-existing)
- **Detail**: `migrateSettings` has a "revert to defaults" branch for an invalid current-version file, but `validateSettings` throws a `TypeError` instead of returning `false`, so the branch can't run and `settingsManager.load()` throws. Only reachable by hand-editing or corrupting `settings.json`.

### Five Library menu items do nothing

- **Severity**: Low
- **Affects**: All
- **Status**: Not fixed (never wired; documented in `docs/architecture/menu-bar-structure.md`)
- **Detail**: The Library menu sends `add-to-favorites`, `create-collection`, `manage-collections`, `download-chapter` and `download-manga`, but no renderer code subscribes to them (none ever has). Nothing sets `canAddToFavorites`, `canDownloadChapter` or `canDownloadManga`, so Add to Favourites and the two Download items are always disabled, and Create/Manage Collections are enabled but inert. `Ctrl+Shift+N` is also bound to both Go Incognito and Create Collection. Either wire the items to the existing UI actions or remove them from the menu, the preload listeners and `MenuState`.

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

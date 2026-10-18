# DexReader Active Context

**Last Updated**: 18 October 2026
**Version**: v1.16.0
**Mode**: Active Development

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next. Keep all entries as short, concise as possible

---

## Current Status

**v1.16.0 shipped** (12 October 2026) — The renderer's shared components moved from hand-rolled to **Fluent 2** (`@fluentui/react-components`), one component at a time behind stable public props, plus the UX work that fell out of it: Browse filters in a dialog with draft/Apply semantics and searchable tag/language pickers (the Languages filter now actually applies to search), language flags (`LanguageBadge`), Back returning to the originating view, chapter resume from the chapter list/History/Downloads, and a content-language guard (settings version 8). Details: `CHANGELOG.md`.

Earlier: v1.15.0 (3 October) settings autosave + chronological Read History + the unit-test suite; v1.14.0 (8 September) Restore Points.

**Next Planned Work:**

- Plan next feature development cycle

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

### Download status badges render muted, not in their status colours

- **Severity**: Low (visual)
- **Detail**: `DownloadStatusBadge` sets `disabled` for the downloading, queued and downloaded states. The global `button:disabled` rule used to override their variant colours (accent, accent, success green) with the muted disabled look, and the stylesheet now states that look explicitly so nothing changed when the global rule went. If the coloured badges were the intent, drop the colour declarations from `.download-badge:disabled` (and revisit `.download-badge:disabled:hover`, which clears the background on hover).

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

### 12 October 2026 - v1.16.0 release prep ✅

- **Type**: Release
- **Summary**: Bumped to 1.16.0 (minor: new features, backward compatible for user data; the Fluent migration was treated as a component switch, not a major UI overhaul). Changelog written from the net change since v1.15.0, leaving out regressions that were introduced and fixed inside the branch. Updated `README.md`, `docs/README.md`, the component library doc, `Select`/`SearchBar` READMEs (new `TagPicker`/`LanguageBadge` READMEs), `CLAUDE.md`, `tech-context.md` and `system-pattern.md`. Gates: typecheck, lint, 1486 tests with coverage thresholds, production build.
- **Status**: ✅ Complete, awaiting merge and tag

### 18 October 2026 - Architecture docs audited against the code ✅

- **Type**: Docs + small chores
- **Summary**: Rewrote all six remaining architecture guides from the source: `state-management` (all 10 stores), `database-architecture` (`node:sqlite` + Drizzle 1.0, 11 tables, startup and recovery, repositories, migrations, restore points), `ipc-messaging` (116 channels, `IpcResponse`, error serialisation, push events, bridge), `filesystem-security` (real allowed roots, symlink rule, downloads-folder flow, intentional exceptions), `mangadex-api` (client, rate limiter, `mangadex://` proxy and caches, `local-manga://`) and `error-handling` (three layers as built). Removed the unused `errorMessages.ts` and the unread error buffer in `errorHandler.ts`, and corrected `CLAUDE.md` and the `.ai` docs: the preload types live in `window.types.ts` (there is no `index.d.ts`), handlers are in `src/main/ipc/handlers/`, `settings.json` is not encrypted, and there are more than two filesystem roots. New Known Issues: cache cleanup deletes read history, the cover disk-cache limit isn't enforced, MangaDex rate limits are per client, and the Library menu items with no listener.
- **Status**: ✅ Complete; typecheck, lint, 1486 tests and the production build pass

### 18 October 2026 - Post-migration clean-up, second pass ✅

- **Type**: Chore + docs
- **Summary**: Removed the unused `ErrorRecovery` and `Versions.tsx` components, the dead `.error-recovery*` rules in `ReaderView.css` (`MangaDetailView`'s borrowed names became `manga-detail-error__*`), the unused `i18next-fs-backend` and `@types/bcrypt` packages, the props the Fluent wrappers ignored (`Radio` `checked`/`onChange`/`name`, `Skeleton` `noAnimation`, `ProgressBar` `animated`), 38 unreferenced design tokens (and the `--win-accent-active` computation), and `main.css`'s dead `button.primary`/`select`/`textarea` rules and duplicated utilities. `index.html` now has the real title. Then removed `main.css`'s global `button` and `input` rules: each raw button/input now carries its own font, weight and hover border (the five Griffel icon buttons got an explicit `transition`, the accent colour picker its padding and background), and the orphaned `--padding-input`/`--padding-button` tokens went with them. Finally pruned `utilities.css` to the 51 classes something uses (from 190; 847 → 261 lines, built CSS 133.0 → 126.6 kB) and rewrote `utility-classes.md` to match, with the rule that utility class names are never built dynamically so unused ones stay findable by plain search. Rewrote `menu-bar-structure.md` against the real menu code (four menus, the IPC event and menu-state flow, and the gaps above); it previously described a five-menu design with a Tools menu that was never built. Rewrote the design token doc from `tokens.css` and dropped the Mica/acrylic and hand-rolled overlay claims from the component docs. Replaced `claude-plans/` references (gitignored) and "hand-rolled" history in comments.
- **Status**: ✅ Complete; typecheck, lint, 1486 tests and the production build pass

### 13 October 2026 - Post-migration orphan clean-up ✅

- **Type**: Docs + chore
- **Summary**: Audited for leftovers after the Fluent migration. Removed 21 unimported stylesheets plus the unused electron-vite `base.css` and its SVGs; removed ~130 dead selectors, 22 empty rules and unused keyframes from still-imported stylesheets; removed unused component tokens (`--progress-*`, `--ring-*`, `--toast-*`, `--sidebar-*`). Fixed ~140 `var(--…)` references to tokens that were never defined (the Gatekeeper unlock overlay was transparent; the failed-download badge, app-level error fallback, settings header and reader focus ring had no styling), mapped the undefined typography names to `--win-font-size-*`, added `--ease-spring` so the reader fade-in and end-of-chapter slide-up now run, mapped missing shadows, added the utility classes TSX already used (`grid`, `grid-cols-2`, `pt-3`, `h-screen`, `bg-error-tint`, `border-error`) and styled the MangaCard cover-error state. Rewrote the stale READMEs, `loading-feedback-states.md`, the polish history, the token doc and the layout docs (`layout-specification.md`, `responsive-behavior-guide.md`, `navigation-flow.md`, `reader-layout-specification.md`: 80px user-selectable sidebar, fluid grids, origin-aware Back, single reader header); `utility-classes.md` is checked against `utilities.css` (190/190).
- **Status**: ✅ Complete; visual changes need a click-through (see CHANGELOG-worthy list in the commits)

### 7 – 12 October 2026 - Fluent 2 migration + follow-ups ✅

- **Type**: Refactor + features + bugfixes (63 commits on `feat/fluent-migration`)
- **Summary**: Migrated tier by tier (foundation + theme → Button/Input/Toast/NumberSpinner/banners → Tabs/Modal → Tooltip/Popover/Select/SearchBar/Accordion/Menu), verifying each in the running app with real input. Decisions worth remembering: wrappers keep public props and drop only props with zero call sites; `ContextMenu` was decommissioned (card hover overlay + tab kebab button); Fluent popups carry size caps that must be overridden per layout (see `system-pattern.md`); the reader nests its own `FluentProvider`; flags are bundled SVGs because Windows can't draw emoji flags. Found and fixed along the way: the Browse Languages filter never reached search, the content-language list could be emptied (validator + settings v8 migration + `PriorityList` `minItems`), chapter reopen ignored saved progress, Back always went to Browse, and the Not Found dialog opened once per `t` change.
- **Status**: ✅ Complete, shipping in v1.16.0

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

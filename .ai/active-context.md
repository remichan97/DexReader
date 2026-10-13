# DexReader Active Context

**Last Updated**: 13 October 2026
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

### History/Downloads resume: Downloads path untested in the running app

- **Severity**: Low
- **Affects**: All
- **Status**: Needs a manual check
- **Detail**: `loadResumePage` is unit-tested and History's Continue was verified live, but the Downloads view was empty in the test session so opening a chapter from it wasn't exercised.

### Resume behaviour differs by entry point

- **Severity**: Low
- **Detail**: The hero's Continue button opens the last-read page even for a finished chapter; the chapter list, History and Downloads restart a finished chapter from page 1. History events don't store a page, so History looks the page up from chapter progress.

### Layout docs and global form styles still describe pre-Fluent assumptions

- **Severity**: Low
- **Detail**: `docs/architecture/layout-specification.md` and `docs/design/responsive-behavior-guide.md` still describe a 240px sidebar (it is 80px, with full/compact/auto-hide modes). `main.css` still has global `input, textarea, select` and `button` styles that also reach Fluent's inner elements; they appear harmless but are worth reviewing. About 90 of `utilities.css`'s utility classes are unused (kept as a documented library), and a few general tokens (`--z-*`, `--gap-*`, `--focus-outline-*`, acrylic) are unreferenced.

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

### 13 October 2026 - Post-migration orphan clean-up ✅

- **Type**: Docs + chore
- **Summary**: Audited for leftovers after the Fluent migration. Removed 21 unimported stylesheets plus the unused electron-vite `base.css` and its SVGs; removed ~130 dead selectors, 22 empty rules and unused keyframes from still-imported stylesheets; removed unused component tokens (`--progress-*`, `--ring-*`, `--toast-*`, `--sidebar-*`). Fixed ~140 `var(--…)` references to tokens that were never defined (the Gatekeeper unlock overlay was transparent; the failed-download badge, app-level error fallback, settings header and reader focus ring had no styling), mapped the undefined typography names to `--win-font-size-*`, added `--ease-spring` so the reader fade-in and end-of-chapter slide-up now run, mapped missing shadows, added the utility classes TSX already used (`grid`, `grid-cols-2`, `pt-3`, `h-screen`, `bg-error-tint`, `border-error`) and styled the MangaCard cover-error state. Rewrote the stale READMEs, `loading-feedback-states.md`, the polish history and the token doc; `utility-classes.md` is checked against `utilities.css` (190/190).
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

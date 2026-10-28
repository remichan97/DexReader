# Backup, Import and Export

**Last updated**: October 2026 (v1.17.0 in progress)
**Source**: `src/main/services/dexreader/`, `src/main/services/mihon/`, `src/main/services/helpers/`, `src/main/services/protobuf/schemas/`, `src/main/ipc/handlers/{dexreader,mihon}.handler.ts`, `src/main/menu/library.menu.ts`, `src/renderer/src/components/BackupHost/`, `src/renderer/src/hooks/use{DexReader,Mihon}ImportExport.ts`

---

## Overview

Two file formats, both reached from the **Library** menu (Import Library / Export Library):

| Format            | Extension                   | What it is                                                                                    | Direction                                    |
| ----------------- | --------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| DexReader         | `.dexreader`                | gzip-compressed protobuf (`dexreader.proto`): library, collections, progress, reader settings | import and export                            |
| Tachiyomi / Mihon | `.tachibk` (or `.proto.gz`) | gzip-compressed protobuf in Mihon's own backup model (`mihon.proto`, a subset)                | **import**; export is deprecated (see below) |

The native file dialogs are opened by the main process (`library.menu.ts`), which sends only the chosen path to the renderer. The renderer side lives in `BackupHost`, an app-level component (see `menu-bar-structure.md`), so import and export work from every view including the Reader.

## Renderer side

- **`BackupHost`** is mounted once in `App.tsx`, at the same position in the Reader and AppShell layouts, after the Gatekeeper gate. It owns `useDexReaderImportExport`, `useMihonImportExport` and the four dialogs they drive (`DexReaderExportDialog`, `DexReaderImportDialog`, `ImportProgressDialog`, `ImportResultDialog`).
- **One operation at a time**: `utils/backupOperationLock.ts` is a module-level lock. A flow takes it when the menu event arrives and releases it when its dialog closes or its operation ends; a second menu pick shows a "backup already in progress" toast (`common:backup.busy*`).
- **After an import**, `utils/refreshAfterImport.ts` reloads the library, collections, cached progress (`progressStore.reloadCachedProgress`), progress metadata and the history feed. `LibraryView` also refreshes its grid when the favourites store changes.
- Toast strings in the two hooks are still hard-coded English (a known follow-up); the new strings are translated.

## Mihon / Tachiyomi import

`mihon-backup.service.ts` → `mihon-backup.decoder.ts` → `mihon-backup.helper.ts`.

1. **Container** (`unwrapBackupBytes`): gzip is detected by its magic bytes and decompressed; plain protobuf is accepted as Mihon's own reader does; JSON (TachiyomiAZ) is rejected. Failures are `MihonBackupFormatError`s, which extend `IpcError` so the code survives IPC: `MIHON_BACKUP_JSON`, `_EMPTY`, `_UNRECOGNISED`, `_FILE_MISSING`. The renderer maps them to `dialogs:mihonImport.errors.*`.
2. **Schema** (`mihon.proto`): only the fields DexReader uses, **all optional**. protobufjs skips unknown fields, so upstream additions, renames and removals (extension stores, preferences, trackers, memo, ...) can't break a decode, and a `required` field upstream drops can't fail it either. Field numbers match Mihon's `data/backup/models`.
3. **int64 fields**: protobufjs's `toJSON()` returns them as **strings**, which is not what the model types say. `normaliseBackup` converts the timestamps, page numbers, category ids and so on to numbers once. The two **source ids stay strings** (`2499283573021220255` exceeds 2^53; compare them as `BigInt`). Empty lists, which `toJSON()` omits, are filled in.
4. **Classification** (`classifyEntries`): favourite entries (a missing `favorite` means true) from the English MangaDex source (`2499283573021220255`) are imported. A source named "MangaDex" in the backup's own `backupSources` with a different id is another language: its entries are left out and returned as `skippedOtherLanguage`. Everything else is counted in `ignoredOtherSourceCount`. A MangaDex entry's manga id comes from its url (`/manga/<uuid>`).
5. **Add back**: the result dialog lists `skippedOtherLanguage` with checkboxes; "Add selected" calls `mihon:import-backup` again with the same file and `includeMangaIds` (validated as UUIDs, max 5000). That pass imports only those entries from the other-language list and returns what is still left out. The renderer keeps the file path while the result is shown.

### Units

**Mihon writes every time in epoch milliseconds** (`dateUpload`, `dateFetch`, history `lastRead`). DexReader's progress commands carry **seconds**, and its Drizzle `timestamp` columns store seconds. The import converts (`new Date(ms)` for a chapter's publish date, `Math.floor(ms / 1000)` for `lastReadAt`) and the export writes milliseconds. Imports before 1.17.0 stored the raw milliseconds in those columns; migration `20261028155803_fix_mihon_millisecond_timestamp` repairs the rows (see `database-architecture.md`).

### Known gaps in imported data

Imported chapters carry `externalUrl: '/chapter/<uuid>'` (not a real URL) and `language: 'en'`, because the backup has neither. Anything that treats `externalUrl` as "official external chapter" will misread them.

## Mihon / Tachiyomi export (deprecated)

`mihon-export.service.ts` writes a `Backup` with `backupManga` and `backupCategories` only, every entry under the English MangaDex source id, chapter dates in milliseconds (`dateUpload` = publish date, `dateFetch` = cache date) and an empty chapter name when there is none (Mihon requires one).

**Timeline** (decided 26 October 2026): `1.17.0` is the last release that can export to `.tachibk`. Its export warning says it is the _Tachiyomi_ backup format that is being retired (importing `.tachibk` and Mihon support are unaffected). The next release turns the menu item into a message box that links to the last `1.17.x` release page and deletes the exporter; the release after that removes the item. Wording rule: say "Tachiyomi format" or "Tachiyomi backup format (.tachibk)", never "Mihon/Tachiyomi is being retired".

## What Mihon announced (and what is not known)

Mihon's changelog says `0.21.x` is the last version that can restore Tachiyomi-format `.tachibk` backups and the last to support Tachiyomi extensions; later versions won't (first stated in `v0.21.0`, 11 October 2026, still current in `v0.21.3`, 25 October). Its replacement format is **not public**: `main` at `v0.21.3` still writes gzip protobuf `.tachibk`. Mihon is one Tachiyomi fork that stopped restoring the format; others may keep it.

Before building support for the new format: read the release notes and Mihon's backups guide, watch `app/src/main/java/eu/kanade/tachiyomi/data/backup/` (`BackupCreator.kt` decides the container and extension, `models/` the schema), and get a real sample file. Plan: `claude-plans/mihon-backup-format-plan.md` (local), Package C. The importer and decoder were built so a second format can sit beside the first behind one channel, chosen by file content, not by the menu item clicked.

A real Mihon backup from January 2026 (25 manga, all English MangaDex, 1,314 chapters) decodes in about 15 ms; a synthetic 300,000-chapter backup took about 0.6 s and 360 MB of heap, so streaming isn't needed.

## Tests

- Decoder: real protobufjs against an upstream-shaped schema (preferences, extension stores, trackers, memo, required fields), covering containers, int64 conversion and malformed input.
- Service, helpers, handler, preload: classification, skipped list and add-back, validation of `includeMangaIds`, millisecond handling.
- Renderer: both hooks, `BackupHost`, `ImportResultDialog`, the lock and `refreshAfterImport`.
- The Library menu's flows, including the export warning text, in `library.menu.test.ts`.

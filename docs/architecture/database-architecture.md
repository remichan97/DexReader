# Database Architecture

**Last updated**: October 2026 (v1.16.1)
**Source**: `src/main/database/` (connection, schemas, repositories, mappers, migrations)

---

## Overview

DexReader keeps its persistent data in a single SQLite file, owned by the main process. It uses Node's built-in `node:sqlite` (`DatabaseSync`) with [Drizzle ORM](https://orm.drizzle.team/) 1.0 (`drizzle-orm/node-sqlite`). There is no native module to rebuild: the driver ships with the runtime.

The `node:sqlite` API is **synchronous**, so every repository method is synchronous too. The renderer never touches the database. It calls an IPC handler, the handler calls a repository, and the result is returned as an `IpcResponse<T>`.

```
Renderer store ──► preload (window.api.*) ──► IPC handler ──► repository ──► Drizzle ──► SQLite
```

| Concern                           | Where                                               |
| --------------------------------- | --------------------------------------------------- |
| Connection, pragmas, backup       | `src/main/database/db-connection.ts`                |
| Table definitions                 | `src/main/database/schemas/`                        |
| Relations (for `with:` queries)   | `src/main/database/schemas/relationships.schema.ts` |
| Data access                       | `src/main/database/repositories/*.repo.ts`          |
| Row → contract mapping            | `src/main/database/mappers/`                        |
| Commands (write inputs)           | `src/shared/commands/repositories/`                 |
| Contracts (read outputs)          | `src/shared/contracts/database/`                    |
| Migrations                        | `src/main/database/migrations/`                     |
| Corruption and migration recovery | `src/main/database/db-recovery.ts`                  |
| Restore points                    | `src/main/services/database-snapshot.service.ts`    |

---

## Connection

**Location**

- **Development**: `dexreader-dev.db` in the project root (easy to inspect and reset)
- **Production**: `dexreader.db` in the app data directory (`getAppDataPath()`)

**Pragmas** set in `DatabaseConnection.init()`:

| Pragma         | Value                | Why                               |
| -------------- | -------------------- | --------------------------------- |
| `journal_mode` | `WAL`                | Readers don't block the writer    |
| `cache_size`   | `-65536` (64 MB)     | Fewer disk reads                  |
| `mmap_size`    | `268435456` (256 MB) | Faster reads through the OS cache |
| `foreign_keys` | `ON`                 | Enforce references and cascades   |
| `synchronous`  | `NORMAL`             | Safe with WAL, faster commits     |
| `temp_store`   | `MEMORY`             | Temporary tables stay in memory   |

`close()` runs `PRAGMA wal_checkpoint = TRUNCATE` before closing so the `-wal` file is folded back into the database. `backupDatabase(path)` copies the live database with SQLite's backup API (`node:sqlite`'s `backup`), which is how restore points are made.

### Startup sequence (`src/main/index.ts`)

1. `databaseConnection.init()`. If opening fails (typically file corruption), `recoverFromDatabaseOpenFailure` offers to move the database and its `-wal` and `-shm` files aside as `*.corrupt-<timestamp>`, then start with a fresh one. Declining quits the app.
2. `runMigrations()`. If a migration fails, `handleMigrationFailure` explains what happened and the app exits.
3. `historyRepo.migrateHistoryFromMangaProgress()`, a one-time backfill of `read_history` from `manga_progress` that does nothing once `read_history` has rows. A failure here is logged and startup continues.

---

## Schema

### Relationships

```
manga ──< chapter ──< chapter_downloads >── manga
  │         (cached)        (one row per downloaded chapter)
  │
  ├──< manga_reader_overrides      (per-manga reader settings, 1:1)
  ├──< read_history                (one row per manga/chapter/day)
  └──< collection_items >── collections

manga_progress ──< chapter_progress     (reading position)
reading_statistics                      (single aggregate row)
search_presets                          (saved Browse searches)
```

`manga_progress` and `chapter_progress` are **not** linked to `manga`: progress is keyed by the MangaDex id alone, so it can exist without a cached manga row.

### Tables

| Table                    | Key                                              | References                       | Purpose                                                    |
| ------------------------ | ------------------------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| `manga`                  | `manga_id` (MangaDex UUID)                       | none                             | Cached metadata and the library (`is_favourite`)           |
| `chapter`                | `chapter_id`                                     | `manga` (cascade)                | Cached chapter metadata                                    |
| `chapter_downloads`      | `(chapter_id, manga_id)`, `chapter_id` unique    | `chapter`, `manga` (cascade)     | Download state, path, size, quality, errors                |
| `manga_reader_overrides` | `manga_id`                                       | `manga` (cascade)                | Per-manga reader settings as JSON                          |
| `manga_progress`         | `manga_id`                                       | none                             | Last chapter read and first/last read time per manga       |
| `chapter_progress`       | `id`, unique `(manga_id, chapter_id)`            | `manga_progress` (cascade)       | Page and completion per chapter                            |
| `read_history`           | `id`, unique `(manga_id, chapter_id, read_date)` | `manga` (cascade)                | One row per chapter read per day, for the History calendar |
| `reading_statistics`     | `id` = 1 (CHECK)                                 | none                             | Aggregate totals, recalculated from `chapter_progress`     |
| `collections`            | `id`, unique `name`                              | none                             | User-created collections                                   |
| `collection_items`       | `id`, unique `(collection_id, manga_id)`         | `collections`, `manga` (cascade) | Manga in a collection, with a `position`                   |
| `search_presets`         | `id`, unique `name`                              | none                             | Saved Browse searches (name limited to 50 characters)      |

Notes on individual tables:

- **`manga`** has a CHECK that `status` is one of `ongoing`, `completed`, `hiatus`, `cancelled`. `tags`, `authors`, `artists`, `external_links` and `alternative_titles` are JSON columns. `last_volume` and `last_chapter` are the official publication info and must not be used for progress. A partial index (`idx_manga_library`) serves the library query (favourites ordered by added and last-accessed date).
- **`chapter_downloads`** has indexes on `manga_id` and `status`. `is_hidden` lets the Downloads view hide cleared rows without deleting the record.
- **`read_history`** stores `read_date` as a local `YYYY-MM-DD` string, validated by a CHECK, next to the `read_at` timestamp. This is what the calendar queries.
- **`reading_statistics`** is always a single row. It is rebuilt by `readingRepo.calculateStatistics()`: distinct manga, distinct chapters, total pages (`current_page + 1` per chapter) and an estimate of 20 seconds per page. There are no database triggers anywhere in the schema; every derived value is computed by repository code.
- **`manga_progress` has no page number.** The page lives in `chapter_progress.current_page`.

### Cascades

Foreign keys are enforced (`PRAGMA foreign_keys = ON`), so:

- Deleting a `manga` row deletes its chapters (and their download rows), reader overrides, **read history** and collection memberships.
- Deleting a `collections` row deletes its items.
- Deleting a `manga_progress` row deletes its `chapter_progress` rows.

---

## Data access

### Repositories

Each repository is a class exported as a singleton, takes the connection lazily (`databaseConnection.getDb()`), and is synchronous.

| Singleton              | File                        | Responsibility                                                       |
| ---------------------- | --------------------------- | -------------------------------------------------------------------- |
| `mangaRepo`            | `manga.repo.ts`             | Upsert, favourites, library queries, search, cache stats and cleanup |
| `chapterRepo`          | `chapter.repo.ts`           | Save and read chapter metadata                                       |
| `chapterDownloadsRepo` | `chapter-downloads.repo.ts` | Download records, state changes, storage by manga                    |
| `progressRepo`         | `manga-progress.repo.ts`    | Save and read manga and chapter progress                             |
| `historyRepo`          | `history.repo.ts`           | Log read events, calendar dates, recent events, one-time backfill    |
| `readingRepo`          | `reading-stats.repo.ts`     | Recalculate and read the statistics row                              |
| `collectionRepo`       | `collection.repo.ts`        | Collections and membership                                           |
| `readerSettingsRepo`   | `reader-settings.repo.ts`   | Per-manga reader overrides                                           |
| `searchPresetsRepo`    | `search-presets.repo.ts`    | Saved searches                                                       |
| `cleanupRepo`          | `cleanup.repo.ts`           | Clear all data, reclaim storage                                      |

### Commands, contracts and mappers

The read/write split is by shape, not by folder inside the database module:

- **Commands** are the inputs to a write, for example `SaveProgressCommand`, `UpsertMangaCommand`, `CreateCollectionCommand`. They live in `src/shared/commands/repositories/<area>/` so the renderer and main process agree on them.
- **Contracts** are what reads return (`MangaProgressContract`, `MangaWithMetadataContract`, `ChapterDownloadContract`, ...). They live in `src/shared/contracts/database/`.
- **Mappers** (`src/main/database/mappers/`) convert Drizzle rows into contracts (dates become Unix timestamps, for example).

Reads often come in a **lean** and a **rich** form. `progressRepo.getAllMangaProgress()` returns progress rows only; `getAllProgressWithMetadata()` joins `manga` and `chapter` for the History view.

### Transactions and batches

Methods that may run inside someone else's transaction take an optional `executor: DbExecutor = this.db` (`src/main/database/utils/batch-operations.util.ts`), which is either the connection or an open transaction. `executeBatchOperations` runs a list of commands as one operation (a single command takes the cheaper single path). Multi-step writes use `this.db.transaction(...)`.

### How progress is saved

`progressRepo.saveProgress(commands)` runs in one transaction. For each command it upserts `manga_progress` (last chapter and read time), upserts `chapter_progress` (page and completion), and logs a `read_history` event for that day. After all commands it recalculates `reading_statistics` and runs `mangaRepo.cleanupMangaCache()`.

### The manga cache

`manga` doubles as a cache of what the user has looked at and as the library. A row is **kept** if it is a favourite, or has a completed download. Anything else is cache:

- `cleanupMangaCache()` (the default, run after every progress save) deletes cache rows whose `last_accessed_at` is more than 90 days old.
- `cleanupMangaCache(true)` deletes all cache rows regardless of age. Settings → Cache Management calls both modes through `globalThis.storage.clearMangaCache(false | true)`.
- `last_accessed_at` is refreshed by `upsertManga`.

**Be aware**: because `read_history`, `chapter` and the other child tables cascade from `manga`, removing a stale cache row also removes that manga's history entries, and `getAllProgressWithMetadata()` (an inner join on `manga`) stops listing it, although its `manga_progress` and `chapter_progress` rows remain so reading position is kept. In practice, a non-favourite, non-downloaded manga that has not been opened for 90 days loses its calendar history the next time progress is saved anywhere, and Cache Management's immediate clear removes the history of every such manga straight away. Whether history should be exempt from cache cleanup is an open question.

---

## Migrations

Migrations are generated by Drizzle Kit and applied automatically at startup. **Never write or edit files in `src/main/database/migrations/` by hand** (the only hand-written part is the SQL body of a `--custom` data-fix migration, below).

```bash
npx drizzle-kit generate <migration_name>   # after changing a schema file
```

Each migration is a timestamped folder (`20260919091323_redesign_read_history_table/`) containing `migration.sql` and a `snapshot.json` that Drizzle Kit uses to diff the next schema change. `migrations.ts` applies them with `drizzle-orm/node-sqlite/migrator`.

**Data-fix migrations** (repairing rows, no schema change) are the one case where only the SQL is written by hand: `npx drizzle-kit generate --custom --name=<name>` creates the folder. Separate the statements with `--> statement-breakpoint`, because the migrator otherwise runs only the first one; keep the SQL idempotent with a `WHERE` that matches only bad rows; remember `timestamp` columns hold integer seconds. Example: `20261028155803_fix_mihon_millisecond_timestamp`, which divides chapter and progress times that an older Mihon import stored in milliseconds and rebuilds the History day strings it broke.

**Foreign keys are switched off around the migrator.** Drizzle wraps all pending migrations in one transaction, and SQLite ignores `PRAGMA foreign_keys` changes inside a transaction, so a `PRAGMA foreign_keys=OFF` in a migration's own SQL has no effect. Without the outer toggle, rebuilding a table (`DROP TABLE` after copying) would cascade-delete rows in tables that reference it. `runMigrations()` turns enforcement off before `migrate()` and back on in a `finally`.

SQLite cannot add CHECK constraints or change a column type in place, so Drizzle generates a table rebuild (`CREATE TABLE __new_x`, copy, `DROP`, `RENAME`) for those changes.

**Packaging**: the migration files are unpacked from the asar (`asarUnpack: out/main/database/migrations/**` in `electron-builder.yml`) so the migrator can read them in a packaged build.

---

## Backups and recovery

- **Restore points** (`database-snapshot.service.ts`): `createSnapshot(trigger)` uses `backupDatabase` to write `dexreader-<unix-timestamp>_<manual|auto>.db` into the `snapshots` folder under the app data directory. The newest `snapshot.maxSnapshotsCount` (default 5) are kept and older ones are pruned. Listing, creating, deleting and restoring are all gated by the snapshot setting, and file names are checked so they cannot escape the folder.
- **Corruption and failed migrations**: see the startup sequence above.
- **Library backups** (`.dexreader`, Mihon/Tachiyomi) are separate from the database file. They export and import library data through the services in `src/main/services/dexreader` and `src/main/services/mihon`.

---

## Testing

Repository tests run against the **real schema**. `createTestDb()` (`vitest/create-test-db.ts`) opens an in-memory `DatabaseSync`, applies the production migrations (with the same foreign-key toggle as `runMigrations`), and returns a Drizzle instance. A test mocks the connection module to hand that instance to the repositories:

```typescript
let testDb: TestDb

vi.mock('../db-connection', () => ({
  databaseConnection: { getDb: () => testDb }
}))

import { progressRepo } from './manga-progress.repo'

beforeEach(() => {
  testDb = createTestDb()
})
```

Two things to remember when writing these tests: insert the parent `manga` row before anything that references it, and use real UUIDs where the repository validates them (`historyRepo.logReadEvent` does).

---

## Troubleshooting

### `FOREIGN KEY constraint failed`

A child row was inserted before its parent. `read_history`, `chapter`, `chapter_downloads`, `collection_items` and `manga_reader_overrides` all need the `manga` row first. Progress rows do not.

### `UNIQUE constraint failed`

Most unique keys are `(manga_id, chapter_id)` style pairs or names (`collections.name`, `search_presets.name`). Use `onConflictDoUpdate` for upserts, as `saveProgress` does.

### `database is locked`

Only the main process opens the file, and WAL lets readers proceed during a write, so this normally means a long transaction or a second process (for example a database viewer) holding the file. No `busy_timeout` is set.

### A migration fails in a packaged build

Check that `out/main/database/migrations/**` is unpacked (`asarUnpack`) and that the folder contains each migration's `migration.sql`.

### Resetting the development database

Stop the app and delete `dexreader-dev.db` (and its `-wal` and `-shm` files) from the project root.

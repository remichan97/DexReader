# Database Architecture

**Framework**: Drizzle ORM v0.x + better-sqlite3
**Migration Date**: 27-28 December 2025 (Guerilla Migration)
**Last Updated**: 28 December 2025
**Status**: ✅ Production-Ready

---

## Overview

DexReader uses **SQLite** with **Drizzle ORM** for persistent data storage in the main process. This architecture replaced the previous JSON-based filesystem storage during the "Guerilla Database Migration" (27-28 December 2025) to eliminate limitations (2MB cap, 1000 override limit) and enable advanced library features.

### Why SQLite + Drizzle?

- **Zero Configuration**: Embedded database, no server required
- **Type Safety**: Drizzle provides full TypeScript inference
- **Performance**: WAL mode, memory-mapped I/O, optimized indexes
- **Migrations**: Type-safe schema evolution with SQL generation
- **Reliability**: ACID transactions, foreign key constraints
- **Portable**: Single file database, easy backup/restore

---

## Database Configuration

### Connection Settings

**Location**:

- **Development**: `./dexreader-dev.db` (project root)
- **Production**: `%APPDATA%/dexreader/dexreader.db`

**Optimizations**:

```typescript
// src/main/database/connection.ts
db.pragma('journal_mode = WAL') // Write-Ahead Logging
db.pragma('cache_size = -64000') // 64MB cache
db.pragma('mmap_size = 268435456') // 256MB memory-mapped I/O
db.pragma('foreign_keys = ON') // Enforce FK constraints
db.pragma('busy_timeout = 5000') // 5s lock timeout
```

**Build Configuration**:

```typescript
// electron.vite.config.ts
asarUnpack: ['**/node_modules/better-sqlite3/**', '**/drizzle/**']
```

Migration files bundled via Vite plugin, automatically applied on startup.

---

## Schema Overview

### Entity Relationship Diagram

```
┌─────────────────┐     ┌────────────────────────┐
│      manga      │────<│ manga_reader_overrides │
│  (cached info)  │     │   (per-manga settings) │
└─────────────────┘     └────────────────────────┘
        │
        │ 1:1
        ↓
┌─────────────────┐     ┌──────────────────┐
│ manga_progress  │────<│ chapter_progress │
│ (last read)     │     │ (per-chapter)    │
└─────────────────┘     └──────────────────┘
        │ 1:1
        ↓
┌─────────────────┐
│reading_statistics│
│  (aggregates)   │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   collections   │────<│ collection_items │>────│   chapter   │
│  (bookmarks)    │     │   (many-to-many) │     │  (cached)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

### Table Summary

| Table                    | Purpose                       | Records | Indexes | Triggers              |
| ------------------------ | ----------------------------- | ------- | ------- | --------------------- |
| `manga`                  | Cached manga metadata         | ~100s   | 1       | 1 (cleanup stale)     |
| `manga_reader_overrides` | Per-manga reader settings     | ~10s    | 1       | -                     |
| `manga_progress`         | Last read chapter per manga   | ~100s   | 1       | -                     |
| `chapter_progress`       | Reading progress per chapter  | ~1000s  | 2       | 1 (update statistics) |
| `reading_statistics`     | Aggregated reading stats      | ~100s   | 1       | 1 (cleanup orphans)   |
| `collections`            | User-created bookmark folders | ~10s    | -       | -                     |
| `collection_items`       | Manga in collections          | ~100s   | 3       | -                     |
| `chapter`                | Cached chapter metadata       | ~1000s  | 2       | -                     |

---

## Core Tables

### 1. Manga (Cached Metadata)

**Table**: `manga`
**Purpose**: Minimal caching to satisfy foreign key constraints

```typescript
// src/main/database/schema/manga.schema.ts
export const manga = sqliteTable(
  'manga',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    coverUrl: text('cover_url'),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    updatedAtIdx: index('manga_updated_at_idx').on(table.updatedAt)
  })
)
```

**Indexes**:

- `manga_updated_at_idx`: For stale cache cleanup

**Triggers**:

```sql
CREATE TRIGGER cleanup_stale_manga_cache
AFTER DELETE ON manga_progress
BEGIN
  DELETE FROM manga
  WHERE id = OLD.manga_id
    AND id NOT IN (SELECT manga_id FROM collection_items);
END;
```

**Caching Strategy**: Insert minimal records (title="Unknown") when saving progress, delete when no longer referenced.

---

### 2. Manga Reader Overrides

**Table**: `manga_reader_overrides`
**Purpose**: Per-manga reader settings (override global settings)

```typescript
// src/main/database/schema/settings.schema.ts
export const mangaReaderOverrides = sqliteTable(
  'manga_reader_overrides',
  {
    mangaId: text('manga_id')
      .primaryKey()
      .references(() => manga.id, { onDelete: 'cascade' }),
    readerMode: text('reader_mode', { enum: ['single', 'double', 'webtoon'] }),
    readingDirection: text('reading_direction', { enum: ['ltr', 'rtl'] }),
    preloadPages: integer('preload_pages'),
    zoomLevel: integer('zoom_level'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    mangaIdIdx: index('manga_reader_overrides_manga_id_idx').on(table.mangaId)
  })
)
```

**Constraints**:

- CHECK: `preload_pages BETWEEN 1 AND 5`
- CHECK: `zoom_level BETWEEN 50 AND 200`
- FK: `manga_id → manga.id` (CASCADE DELETE)

**Usage Pattern**:

```typescript
// Query with fallback to global settings
const settings =
  (await db
    .select()
    .from(mangaReaderOverrides)
    .where(eq(mangaReaderOverrides.mangaId, mangaId))
    .get()) ?? globalSettings
```

---

### 3. Manga Progress (CQRS Read Model)

**Table**: `manga_progress`
**Purpose**: Track last read chapter per manga (lean entity)

```typescript
// src/main/database/schema/progress.schema.ts
export const mangaProgress = sqliteTable(
  'manga_progress',
  {
    mangaId: text('manga_id')
      .primaryKey()
      .references(() => manga.id, { onDelete: 'cascade' }),
    lastChapterId: text('last_chapter_id').notNull(),
    firstReadAt: integer('first_read_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    lastReadAt: integer('last_read_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    lastReadAtIdx: index('manga_progress_last_read_at_idx').on(table.lastReadAt)
  })
)
```

**Indexes**:

- `manga_progress_last_read_at_idx`: For history queries (ORDER BY)

**CQRS Pattern**: This is a **read model** (query result). Write operations use `SaveProgressCommand`.

---

### 4. Chapter Progress (CQRS Read Model)

**Table**: `chapter_progress`
**Purpose**: Track reading progress per chapter

```typescript
// src/main/database/schema/progress.schema.ts
export const chapterProgress = sqliteTable(
  'chapter_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.id, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    currentPage: integer('current_page').notNull().default(0),
    totalPages: integer('total_pages'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    firstReadAt: integer('first_read_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    lastReadAt: integer('last_read_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    mangaChapterUnique: unique().on(table.mangaId, table.chapterId),
    mangaIdIdx: index('chapter_progress_manga_id_idx').on(table.mangaId),
    lastReadAtIdx: index('chapter_progress_last_read_at_idx').on(table.lastReadAt)
  })
)
```

**Constraints**:

- UNIQUE: `(manga_id, chapter_id)` - One record per chapter
- CHECK: `current_page >= 0`
- CHECK: `total_pages IS NULL OR total_pages > 0`
- FK: `manga_id → manga.id` (CASCADE DELETE)

**Indexes**:

- `chapter_progress_manga_id_idx`: For per-manga queries
- `chapter_progress_last_read_at_idx`: For history timeline

**Triggers**:

```sql
CREATE TRIGGER update_manga_progress_on_chapter_update
AFTER INSERT OR UPDATE ON chapter_progress
BEGIN
  INSERT INTO manga_progress (manga_id, last_chapter_id, first_read_at, last_read_at)
  VALUES (NEW.manga_id, NEW.chapter_id, NEW.first_read_at, NEW.last_read_at)
  ON CONFLICT (manga_id) DO UPDATE SET
    last_chapter_id = NEW.chapter_id,
    last_read_at = NEW.last_read_at;
END;
```

---

### 5. Reading Statistics (Aggregate Data)

**Table**: `reading_statistics`
**Purpose**: Aggregated reading metrics per manga

```typescript
// src/main/database/schema/progress.schema.ts
export const readingStatistics = sqliteTable(
  'reading_statistics',
  {
    mangaId: text('manga_id')
      .primaryKey()
      .references(() => manga.id, { onDelete: 'cascade' }),
    totalChaptersRead: integer('total_chapters_read').notNull().default(0),
    totalPagesRead: integer('total_pages_read').notNull().default(0),
    totalReadingTime: integer('total_reading_time').notNull().default(0), // seconds
    lastUpdated: integer('last_updated', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    lastUpdatedIdx: index('reading_statistics_last_updated_idx').on(table.lastUpdated)
  })
)
```

**Updates**: Via trigger on `chapter_progress` changes

**Triggers**:

```sql
CREATE TRIGGER cleanup_orphaned_reading_statistics
AFTER DELETE ON manga_progress
BEGIN
  DELETE FROM reading_statistics WHERE manga_id = OLD.manga_id;
END;
```

---

### 6. Collections (Bookmarks)

**Table**: `collections`
**Purpose**: User-created folders for organizing manga

```typescript
// src/main/database/schema/collections.schema.ts
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date())
})
```

**Constraints**: UNIQUE `name`

---

### 7. Collection Items (Many-to-Many)

**Table**: `collection_items`
**Purpose**: Link manga to collections (bookmarks)

```typescript
// src/main/database/schema/collections.schema.ts
export const collectionItems = sqliteTable(
  'collection_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.id, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    collectionMangaUnique: unique().on(table.collectionId, table.mangaId),
    collectionIdIdx: index('collection_items_collection_id_idx').on(table.collectionId),
    mangaIdIdx: index('collection_items_manga_id_idx').on(table.mangaId),
    addedAtIdx: index('collection_items_added_at_idx').on(table.addedAt)
  })
)
```

**Constraints**:

- UNIQUE: `(collection_id, manga_id)` - No duplicates
- FK: `collection_id → collections.id` (CASCADE DELETE)
- FK: `manga_id → manga.id` (CASCADE DELETE)

**Indexes**:

- `collection_items_collection_id_idx`: For collection listings
- `collection_items_manga_id_idx`: For manga → collections lookup
- `collection_items_added_at_idx`: For recent additions

---

### 8. Chapter (Cached Metadata)

**Table**: `chapter`
**Purpose**: Cache chapter details for offline/downloaded content

```typescript
// src/main/database/schema/chapter.schema.ts
export const chapter = sqliteTable(
  'chapter',
  {
    id: text('id').primaryKey(),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.id, { onDelete: 'cascade' }),
    title: text('title'),
    chapterNumber: text('chapter_number'),
    volumeNumber: text('volume_number'),
    pages: integer('pages'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => ({
    mangaIdIdx: index('chapter_manga_id_idx').on(table.mangaId),
    chapterNumberIdx: index('chapter_number_idx').on(table.mangaId, table.chapterNumber)
  })
)
```

**Indexes**:

- `chapter_manga_id_idx`: For manga → chapters lookup
- `chapter_number_idx`: For sorting by chapter number

---

## CQRS Pattern (Command-Query Separation)

### Folder Structure

```
src/main/database/
├── connection.ts               # Database setup
├── schema/                     # Table definitions
│   ├── settings.schema.ts
│   ├── progress.schema.ts
│   ├── collections.schema.ts
│   ├── manga.schema.ts
│   └── chapter.schema.ts
├── queries/                    # READ models (entities)
│   ├── manga-progress.query.ts
│   ├── manga-progress-metadata.query.ts
│   ├── chapter-progress.query.ts
│   ├── reading-stats.query.ts
│   ├── progress-database.query.ts
│   └── progress-settings.query.ts
├── commands/                   # WRITE models (inputs)
│   └── save-progress.command.ts
└── repository/                 # Data access layer
    └── manga-progress.repo.ts
```

### Query Models (Read)

**Lean Query** (matches schema 1:1):

```typescript
// src/main/database/queries/manga-progress.query.ts
export interface MangaProgress {
  mangaId: string
  lastChapterId: string
  firstReadAt: Date
  lastReadAt: Date
}
```

**Rich Metadata** (with JOINs):

```typescript
// src/main/database/queries/manga-progress-metadata.query.ts
export interface MangaProgressMetadata extends MangaProgress {
  title: string
  coverUrl: string | null
  status: string | null
  lastChapterNumber: string | null
  lastChapterTitle: string | null
  lastChapterVolume: string | null
}
```

### Command Models (Write)

```typescript
// src/main/database/commands/save-progress.command.ts
export interface SaveProgressCommand {
  mangaId: string
  chapterId: string
  currentPage: number
  completed: boolean
}
```

### Repository Pattern

```typescript
// src/main/database/repository/manga-progress.repo.ts
export class MangaProgressRepository {
  // QUERIES (returns entities)
  async getProgressByMangaId(mangaId: string): Promise<MangaProgress | null>
  async getAllProgress(): Promise<MangaProgress[]>
  async getAllProgressWithMetadata(): Promise<MangaProgressMetadata[]>

  // COMMANDS (accepts primitive inputs)
  async saveProgress(commands: SaveProgressCommand[]): Promise<void>
  async deleteProgress(mangaId: string): Promise<void>
  async clearAllProgress(): Promise<void>

  // AGGREGATES
  async getChapterProgressByMangaId(mangaId: string): Promise<ChapterProgress[]>
  async getReadingStatsByMangaId(mangaId: string): Promise<ReadingStats | null>
  async getAllReadingStats(): Promise<ReadingStats[]>
}
```

---

## Key Design Patterns

### 1. Minimal Manga Caching

**Problem**: Progress tables reference `manga.id` (FK constraint), but manga data comes from API.

**Solution**: Insert minimal manga records when saving progress:

```typescript
async saveProgress(commands: SaveProgressCommand[]): Promise<void> {
  await this.db.transaction(async (tx) => {
    // Step 1: Satisfy FK constraint (minimal cache)
    for (const cmd of commands) {
      await tx
        .insert(manga)
        .values({
          id: cmd.mangaId,
          title: 'Unknown',
          isRead: true
        })
        .onConflictDoNothing()
    }

    // Step 2: Insert/update progress
    // Step 3: Insert/update chapter progress
  })
}
```

**Cleanup**: Triggers delete manga records when no longer referenced.

### 2. Lean vs Rich Queries

**Lean** (for mutations):

```typescript
const progress = await repo.getProgressByMangaId(mangaId)
// { mangaId, lastChapterId, firstReadAt, lastReadAt }
```

**Rich** (for display):

```typescript
const metadata = await repo.getAllProgressWithMetadata()
// Includes: title, coverUrl, status, chapterNumber, chapterTitle
```

**Why?**: Frontend needs rich data for HistoryView, but lean data for updates.

### 3. Foreign Key Constraint Satisfaction

**Pattern**:

1. Insert parent record (manga) if not exists
2. Insert child record (progress, chapter_progress)
3. Triggers maintain referential integrity

**Cascading Deletes**:

- Delete manga → deletes all progress, overrides, statistics
- Delete collection → deletes all collection items

---

## Migration Strategy

### Migration Files

**Location**: `src/main/database/migrations/`
**Format**: SQL files with timestamps (e.g., `0000_init.sql`, `0001_add_progress.sql`)
**Generation**: `npm run db:generate`
**Application**: Automatic on app startup via `connection.ts`

### Migration Process

```typescript
// src/main/database/connection.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const db = drizzle(sqlite, { schema: allSchemas })
migrate(db, { migrationsFolder: './drizzle' })
```

**Bundle Config**:

```typescript
// electron.vite.config.ts
{
  plugins: [
    {
      name: 'drizzle-migrations',
      transform(code, id) {
        if (id.endsWith('connection.ts')) {
          // Bundle SQL files as strings
        }
      }
    }
  ]
}
```

### SQLite Limitations

**ALTER TABLE Restrictions**:

- Cannot add CHECK constraints → Requires table recreation
- Cannot modify column types → Requires table recreation
- Cannot drop columns (pre-3.35.0) → Requires table recreation

**Drizzle Behavior**: Generates `CREATE TABLE temp → COPY DATA → DROP OLD → RENAME` sequence.

---

## Performance Optimizations

### 1. Indexes

All foreign keys have indexes:

- `manga_reader_overrides`: `manga_id`
- `manga_progress`: `last_read_at`
- `chapter_progress`: `manga_id`, `last_read_at`
- `collection_items`: `collection_id`, `manga_id`, `added_at`
- `chapter`: `manga_id`, `(manga_id, chapter_number)`

### 2. WAL Mode

**Benefit**: Writers don't block readers, better concurrency
**Trade-off**: 2-3x disk space usage (WAL + SHM files)

### 3. Memory-Mapped I/O

**Setting**: `PRAGMA mmap_size = 268435456` (256MB)
**Benefit**: OS-level caching, faster reads

### 4. Cache Size

**Setting**: `PRAGMA cache_size = -64000` (64MB)
**Benefit**: More pages in memory, fewer disk I/O

---

## Testing

### Integration Tests

```typescript
// __tests__/database/manga-progress.repo.test.ts
describe('MangaProgressRepository', () => {
  let repo: MangaProgressRepository

  beforeEach(async () => {
    // Use in-memory database
    repo = new MangaProgressRepository(':memory:')
  })

  it('should save progress with minimal manga caching', async () => {
    await repo.saveProgress([
      {
        mangaId: 'manga-1',
        chapterId: 'chapter-1',
        currentPage: 5,
        completed: false
      }
    ])

    const progress = await repo.getProgressByMangaId('manga-1')
    expect(progress).toMatchObject({
      mangaId: 'manga-1',
      lastChapterId: 'chapter-1'
    })
  })
})
```

---

## Troubleshooting

### "FOREIGN KEY constraint failed"

**Cause**: Attempting to insert child record without parent
**Solution**: Ensure manga record exists before inserting progress

### "UNIQUE constraint failed"

**Cause**: Duplicate `(manga_id, chapter_id)` in `chapter_progress`
**Solution**: Use `ON CONFLICT DO UPDATE` for upserts

### "database is locked"

**Cause**: Write transaction blocking read
**Solution**: Check `busy_timeout` pragma, reduce transaction duration

### Migrations Not Applied

**Cause**: Migration files not bundled in production
**Solution**: Verify `asarUnpack` in electron-builder.yml

---

## References

- **Drizzle ORM**: <https://orm.drizzle.team/>
- **better-sqlite3**: <https://github.com/WiseLibs/better-sqlite3>
- **SQLite WAL Mode**: <https://www.sqlite.org/wal.html>
- **SQLite Pragma**: <https://www.sqlite.org/pragma.html>

---

_This document reflects the database architecture after the Guerilla Database Migration (27-28 December 2025). Update as schema evolves and new patterns emerge._

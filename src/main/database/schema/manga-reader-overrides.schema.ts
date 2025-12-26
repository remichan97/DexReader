import { desc } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { MangaReadingSettings } from '../../settings/entity/reading-settings.entity'
import { manga } from './manga.schema'

export const mangaReaderOverrides = sqliteTable(
  'manga_reader_overrides',
  {
    mangaId: text('manga_id')
      .primaryKey()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    settings: text('settings', { mode: 'json' }).notNull().$type<MangaReadingSettings>(), // JSON string of reader settings overrides (includes readingMode, double-page settings, etc.)
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [index('idx_manga_override_updated').on(desc(table.updatedAt))]
)

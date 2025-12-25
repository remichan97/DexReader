import { desc } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const mangaReaderOverrides = sqliteTable(
  'manga_reader_overrides',
  {
    mangaId: text('manga_id').primaryKey(),
    readingMode: text('reading_mode').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [index('idx_manga_override_updated').on(desc(table.updatedAt))]
)

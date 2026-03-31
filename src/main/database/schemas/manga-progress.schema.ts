import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { desc } from 'drizzle-orm'

export const mangaProgress = sqliteTable(
  'manga_progress',
  {
    mangaId: text('manga_id').primaryKey(),
    lastChapterId: text('last_chapter_id').notNull(),
    firstReadAt: integer('first_read_at', { mode: 'timestamp' }).notNull(),
    lastReadAt: integer('last_read_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [index('idx_manga_progress_last_read').on(desc(table.lastReadAt))]
)

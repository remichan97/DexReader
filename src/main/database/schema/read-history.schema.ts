import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { manga } from './manga.schema'
import { desc } from 'drizzle-orm'

export const readHistory = sqliteTable(
  'read_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    readAt: integer('read_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    index('idx_read_history_manga').on(table.mangaId),
    index('idx_read_history_timestamp').on(desc(table.readAt)),
    index('idx_read_history_manga_chapter').on(table.mangaId, desc(table.chapterId))
  ]
)

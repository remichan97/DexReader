import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { desc } from 'drizzle-orm'
import { mangaProgress } from './manga-progress.schema'

export const chapterProgress = sqliteTable(
  'chapter_progress',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => mangaProgress.mangaId, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    currentPage: integer('current_page').notNull().default(0),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    lastReadAt: integer('last_read_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    unique('un_manga_chapter').on(table.mangaId, table.chapterId),
    index('idx_chapter_progress_manga').on(table.mangaId),
    index('idx_chapter_progress_last_read').on(desc(table.lastReadAt)),
    index('idx_chapter_progress_manga_completed').on(table.mangaId, table.completed)
  ]
)

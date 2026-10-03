import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { manga } from './manga.schema'
import { desc, sql } from 'drizzle-orm'

export const readHistory = sqliteTable(
  'read_history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    readDate: text('read_date').notNull(),
    readAt: integer('read_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    check('chk_read_history_read_date', sql`date(${table.readDate}) = ${table.readDate}`),
    unique('uq_read_history_manga_chapter_readdate').on(
      table.mangaId,
      table.chapterId,
      table.readDate
    ),
    index('idx_read_history_manga').on(table.mangaId),
    index('idx_read_history_timestamp').on(desc(table.readAt)),
    index('idx_read_history_read_date').on(table.readDate),
    index('isx_read_history_manga_read_date').on(table.mangaId, table.readDate),
    index('idx_read_history_manga_chapter').on(table.mangaId, desc(table.chapterId))
  ]
)

import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const readingStatistics = sqliteTable(
  'reading_statistics',
  {
    id: integer('id').primaryKey().default(1),
    totalMangasRead: integer('total_mangas_read').notNull().default(0),
    totalChaptersRead: integer('total_chapters_read').notNull().default(0),
    totalPagesRead: integer('total_pages_read').notNull().default(0),
    totalEstimatedMinutes: integer('total_estimated_minutes').notNull().default(0),
    lastCalculatedAt: integer('last_calculated_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [check('chk_reading_statistics_id', sql`"${table.id}" = 1`)]
)

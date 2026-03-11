import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { manga } from './manga.schema'
import { desc } from 'drizzle-orm'

export const chapter = sqliteTable(
  'chapter',
  {
    chapterId: text('chapter_id').primaryKey(),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    title: text('title'),
    chapterNumber: text('chapter_number'),
    volume: text('volume'),
    language: text('language').notNull(),
    publishAt: integer('publish_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    scanlationGroup: text('scanlation_group'),
    externalUrl: text('external_url')
  },
  (table) => [
    index('idx_chapter_manga').on(table.mangaId),
    index('idx_chapter_published').on(desc(table.publishAt)),
    index('idx_chapter_number').on(table.mangaId, table.chapterNumber)
  ]
)

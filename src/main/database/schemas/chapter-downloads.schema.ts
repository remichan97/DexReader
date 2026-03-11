import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { chapter } from './chapter.schema'
import { manga } from './manga.schema'
import { DownloadStatus } from '../enums/download-status.enum'
import { ImageQuality } from '../../api/enums'
import { sql } from 'drizzle-orm/sql'

export const chapterDownloads = sqliteTable(
  'chapter_downloads',
  {
    chapterId: text('chapter_id')
      .notNull()
      .references(() => chapter.chapterId, { onDelete: 'cascade' }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    status: text('status').notNull().$type<DownloadStatus>().default(DownloadStatus.Queued),
    downloadedAt: integer('downloaded_at', { mode: 'timestamp' }),
    downloadsBasePath: text('downloads_base_path').notNull(),
    filePath: text('file_path').notNull(),
    totalPages: integer('total_pages').notNull(),
    storageSize: integer('storage_size'),
    imageQuality: text('image_quality').notNull().$type<ImageQuality>().default(ImageQuality.High),
    imageFormat: text('image_format').notNull().default('.jpg'),
    errorMessage: text('error_message'),
    lastAttemptedAt: integer('last_attempted_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    // 0 = false (not hidden), 1 = true (hidden). This is used to "hide" completed downloads from the UI when users clear them (most likely by using the "Clear Completed Downloads" option), but still keep the files on disk and the entry in the database in case they want to read the chapter again without needing to redownload
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(false)
  },
  (table) => [
    primaryKey({ name: 'pk_chapter_downloads', columns: [table.chapterId, table.mangaId] }),
    index('idx_chapter_manga_downloads').on(table.mangaId),
    index('idx_chapter_status_downloads').on(table.status)
  ]
)

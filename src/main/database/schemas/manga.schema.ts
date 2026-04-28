import { desc, sql } from 'drizzle-orm'
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { PublicationStatus } from '../../api/enums'

export const manga = sqliteTable(
  'manga',
  {
    mangaId: text('manga_id').primaryKey(), // UUID from MangaDex API
    title: text('title').notNull(), // Main title
    description: text('description'), // Full description
    status: text('status').$type<PublicationStatus>(), // ongoing, completed, hiatus, cancelled
    coverUrl: text('cover_url'), // URL to cover image
    coverCachedAt: integer('cover_cached_at', { mode: 'timestamp' }), // When the cover image was last cached locally
    year: integer('year'), // Year of publication
    isFavourite: integer('is_favourite', { mode: 'boolean' }).notNull().default(false), // Whether user has marked this manga as a favorite in their library, will be the candidate for erasure if false
    addedAt: integer('added_at', { mode: 'timestamp' }).notNull(), // When manga was added to the database
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(), // When manga was last updated
    lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }).notNull(), // When manga was last accessed
    externalLinks: text('external_links', { mode: 'json' }).$type<Record<string, string>>(), // JSON object of external links from MangaDex API (optional: {"al": "30416", "ap": "sidooh", ...})
    tags: text('tags', { mode: 'json' }).$type<string[]>(), // JSON array of tags/genres
    authors: text('authors', { mode: 'json' }).$type<string[]>(), // JSON array of authors
    artists: text('artists', { mode: 'json' }).$type<string[]>(), // JSON array of artists
    alternativeTitles: text('alternative_titles', { mode: 'json' }).$type<Record<string, string>>(), // Alternative name(s) for the manga

    // Official publication info only. Do NOT use for any progress calculations.
    lastVolume: text('last_volume'),
    lastChapter: text('last_chapter')
  },
  (table) => [
    index('idx_manga_favourite').on(table.isFavourite),
    index('idx_manga_added').on(desc(table.addedAt)),
    index('idx_manga_status').on(table.status),
    index('idx_last_accessed').on(desc(table.lastAccessedAt)),
    index('idx_manga_library')
      .on(desc(table.addedAt), desc(table.lastAccessedAt))
      .where(sql`${table.isFavourite} = 1`),
    check(
      'chk_manga_status',
      sql`${table.status} IN ('ongoing', 'completed', 'hiatus', 'cancelled')`
    )
  ]
)

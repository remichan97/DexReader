import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { manga } from './manga.schema'
import { collections } from './collections.schema'

export const collectionItems = sqliteTable(
  'collection_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    mangaId: text('manga_id')
      .notNull()
      .references(() => manga.mangaId, { onDelete: 'cascade' }),
    addedAt: integer('added_at', { mode: 'timestamp' }).notNull(),
    position: integer('position').default(0)
  },
  (table) => [
    unique('uq_collection_manga').on(table.collectionId, table.mangaId),
    index('idx_collection_items_collection').on(table.collectionId),
    index('idx_collection_items_manga').on(table.mangaId)
  ]
)

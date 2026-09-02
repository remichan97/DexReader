import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

// name's .unique() below already creates an implicit unique index - no separate
// index('idx_collections_name') is needed on top of it.
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

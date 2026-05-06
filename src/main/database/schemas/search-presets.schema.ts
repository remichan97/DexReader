import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { SearchFiltersData } from '../types/search-preset.type'
import { sql } from 'drizzle-orm'

export const searchPresets = sqliteTable(
  'search_presets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),

    seachQuery: text('search_query').default(''),
    filters: text('filters', { mode: 'json' }).notNull().$type<SearchFiltersData>(),
    limit: integer('limit').notNull().default(20),

    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date()),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' })
      .notNull()
      .$default(() => new Date())
  },
  (table) => [
    index('idx_search_presets_name').on(table.name),
    index('idx_search_presets_last_used_at').on(table.lastUsedAt),
    check('chk_search_presets_char_limit', sql`length(name) <= 50`)
  ]
)

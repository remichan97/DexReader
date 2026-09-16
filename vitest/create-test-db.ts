import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import { relations } from '../src/main/database/schemas/relationships.schema'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export type TestDb = ReturnType<typeof drizzle>

/**
 * A fresh in-memory SQLite database with the real production migrations applied, so
 * repository tests run against the actual schema instead of a hand-maintained copy of
 * it. Mirrors runMigrations() in src/main/database/migrations/migrations.ts, including
 * its foreign_keys OFF/ON toggle around the migrator's transaction - see that file for
 * why the toggle is needed (PRAGMA changes no-op inside an open transaction).
 */
export function createTestDb(): TestDb {
  const sqlite = new DatabaseSync(':memory:')
  const db = drizzle({ client: sqlite, relations })

  db.run(sql`PRAGMA foreign_keys = OFF`)
  try {
    migrate(db, {
      migrationsFolder: path.join(__dirname, '../src/main/database/migrations')
    })
  } finally {
    db.run(sql`PRAGMA foreign_keys = ON`)
  }

  return db
}

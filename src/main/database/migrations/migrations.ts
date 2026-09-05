import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { databaseConnection } from '../db-connection'
import { mainLog } from '../../services/logging/main-logging.service'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function runMigrations(): void {
  try {
    const db = databaseConnection.getDb()

    // drizzle's migrator wraps all pending migrations in one BEGIN...COMMIT, and SQLite
    // no-ops PRAGMA foreign_keys changes made inside an open transaction - so any
    // PRAGMA foreign_keys=OFF/ON a migration's own SQL contains around a table rebuild
    // never actually takes effect there. Toggling it here, outside the migrator's
    // transaction, is what actually disables enforcement for the run - otherwise a
    // rebuilt table's DROP TABLE step performs an implicit cascading DELETE against
    // anything referencing it via ON DELETE CASCADE.
    db.run(sql`PRAGMA foreign_keys = OFF`)
    try {
      migrate(db, {
        migrationsFolder: path.join(__dirname, 'database', 'migrations')
      })
    } finally {
      db.run(sql`PRAGMA foreign_keys = ON`)
    }

    mainLog.info('[Migration] Migrations completed successfully')
  } catch (error) {
    mainLog.error('[Migration] Error running migrations:', error)
    throw error
  }
}

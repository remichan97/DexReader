import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { databaseConnection } from '../connection'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mainLog } from '../../services/logging/main-logging.service'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function runMigrations(): void {
  try {
    const db = databaseConnection.getDb()

    // Run migrations
    migrate(db, {
      migrationsFolder: path.join(__dirname, 'database', 'migrations')
    })

    mainLog.info('[Migration] Migrations completed successfully')
  } catch (error) {
    mainLog.error('[Migration] Error running migrations:', error)
    throw error
  }
}

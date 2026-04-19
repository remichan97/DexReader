import path from 'node:path'
import { databaseConnection } from '../connection'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mainLog } from '../../services/logging/main-logging.service'

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

import path from 'node:path'
import { databaseConnection } from '../connection'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export function runMigrations(): void {
  try {
    const db = databaseConnection.getDb()
    migrate(db, {
      migrationsFolder: path.join(__dirname, 'database', 'migrations')
    })
  } catch (error) {
    console.error('Error running migrations:', error)
  }
}

import path from 'node:path'
import fs from 'node:fs'
import { sql } from 'drizzle-orm'
import { databaseConnection } from '../connection'

export function runMigrations(): void {
  const db = databaseConnection.getDb()

  // Create schema_version table if not exists
  // This is basically Drizzle's version of EF Core MigrationsHistory table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      migration_id TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `)

  // Okay, we now grab the current migration version
  const currentVersion: { version: number | undefined } = db.get(
    sql`SELECT MAX(version) as version FROM schema_version`
  )

  const currentVersionNumber = currentVersion?.version ?? 0
  console.log('Current DB schema version:', currentVersionNumber)

  // Grab all migration files
  const migrationDir = __dirname
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))

  // Apply pending migrations
  for (const file of files) {
    // Skip the file if its not something that conforms to Drizzle's migration naming
    // convention (e.g., 001_initial.sql, 002_add_users_table.sql, etc)
    if (!/^\d+_.+\.sql$/.test(file)) {
      continue
    }

    const version = Number.parseInt(file.split('_')[0], 10)
    if (version > currentVersionNumber) {
      try {
        const filePath = path.join(migrationDir, file)
        const migrationId = file.replace('.sql', '')
        const migrationSql = fs.readFileSync(filePath, 'utf-8')

        console.log('Applying migration:', file)

        db.transaction(() => {
          // Execute migration SQL
          db.$client.exec(migrationSql)

          // Insert new version record
          db.run(
            sql`
              INSERT INTO schema_version (version, migration_id, applied_at)
              VALUES (${version}, ${migrationId}, ${Math.floor(Date.now() / 1000)})
            `
          )
        })
        console.log('Successfully applied migration:', file)
      } catch (error) {
        console.error(`Failed to apply migration ${file}:`, error)
        console.error(
          'This means the database may be in an inconsistent state. Aborting further migrations.'
        )
        throw error
      }
    }
  }
  console.log('Finished applying migrations.')
}

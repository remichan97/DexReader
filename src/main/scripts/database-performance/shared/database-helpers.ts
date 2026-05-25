/**
 * Database Test Helpers
 *
 * Utilities for setting up and managing separate test/benchmark databases.
 * This ensures test data doesn't interfere with development databases.
 */

import Database from 'better-sqlite3'
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import * as schema from '../../../database/schemas'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface DatabaseTestOptions {
  dbPath?: string // Custom database path (defaults to dexreader-benchmark.db)
  cleanStart?: boolean // Delete existing database before creating
  runMigrations?: boolean // Run migrations after creating (default: true)
}

export class DatabaseTestHelper {
  private db: Database.Database | undefined = undefined
  private drizzle: BetterSQLite3Database<typeof schema> | undefined = undefined
  private readonly dbPath: string

  constructor(options: DatabaseTestOptions = {}) {
    // Default to benchmark database in project root
    this.dbPath = options.dbPath || path.join(process.cwd(), 'dexreader-benchmark.db')

    // Clean start if requested
    if (options.cleanStart && fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath)
      console.log(`Deleted existing database: ${this.dbPath}`)
    }
  }

  /**
   * Initialize the test database with optimal settings for seeding/benchmarking
   */
  init(options: DatabaseTestOptions = {}): void {
    const runMigrations = options.runMigrations !== false // Default to true

    console.log(`Initializing benchmark database: ${this.dbPath}`)

    this.db = new Database(this.dbPath)

    // Same pragmas as production for realistic performance testing
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('cache_size = -64000') // 64MB cache
    this.db.pragma('temp_store = MEMORY')
    this.db.pragma('mmap_size = 268435456') // 256MB mmap

    this.drizzle = drizzle(this.db, { schema: schema })

    // Run migrations to create tables
    if (runMigrations) {
      this.runMigrations()
    }

    console.log(`Database initialized successfully`)
  }

  /**
   * Run migrations to create/update schema
   */
  private runMigrations(): void {
    if (!this.drizzle) {
      throw new Error('Database not initialized. Call init() first.')
    }

    try {
      const migrationsFolder = path.join(__dirname, '../../../database/migrations')
      console.log(`Running migrations from: ${migrationsFolder}`)

      migrate(this.drizzle, { migrationsFolder })

      console.log('Migrations completed successfully')
    } catch (error) {
      console.error('Error running migrations:', error)
      throw error
    }
  }

  /**
   * Get the Drizzle database instance
   */
  getDb(): BetterSQLite3Database<typeof schema> {
    if (!this.drizzle) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.drizzle
  }

  /**
   * Clear all data from the database (preserves schema)
   */
  clearData(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }

    console.log('Clearing all data from database...')

    // Disable foreign keys temporarily to avoid constraint violations
    this.db.pragma('foreign_keys = OFF')

    // Get all tables
    const tables = this.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
      )
      .all() as { name: string }[]

    // Delete all data from each table
    for (const table of tables) {
      this.db.prepare(`DELETE FROM ${table.name}`).run()
      console.log(`Cleared table: ${table.name}`)
    }

    // Re-enable foreign keys
    this.db.pragma('foreign_keys = ON')

    console.log('All data cleared successfully')
  }

  /**
   * Get record counts for all tables
   */
  getRecordCounts(): Record<string, number> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }

    const tables = this.db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
      )
      .all() as { name: string }[]

    const counts: Record<string, number> = {}

    for (const table of tables) {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as {
        count: number
      }
      counts[table.name] = result.count
    }

    return counts
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      try {
        // Ensure WAL checkpoint completes before closing
        this.db.pragma('wal_checkpoint(TRUNCATE)')
      } catch (error) {
        console.error('Error during WAL checkpoint:', error)
      }

      this.db.close()
      this.db = undefined
      this.drizzle = undefined

      console.log('Database connection closed')
    }
  }

  /**
   * Delete the database file
   */
  delete(): void {
    this.close()

    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath)
      console.log(`Deleted database file: ${this.dbPath}`)
    }
  }

  /**
   * Get the database file path
   */
  getDbPath(): string {
    return this.dbPath
  }
}

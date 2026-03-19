import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { getAppDataPath } from '../filesystem/path-validator'
import path from 'node:path'
import * as schema from './schemas'

class DatabaseConnection {
  private db: Database.Database | undefined = undefined
  private drizzle: ReturnType<typeof drizzle> | undefined = undefined
  private dbPath: string | undefined = undefined

  private getDbPath(): string {
    if (!this.dbPath) {
      // Lazy-load the path only when needed (after Electron app is ready)
      this.dbPath =
        process.env.NODE_ENV_ELECTRON_VITE === 'development'
          ? path.join(process.cwd(), 'dexreader-dev.db') // Project root: .\dexreader-dev.db
          : path.join(getAppDataPath(), 'dexreader.db') // AppData: %APPDATA%\DexReader\dexreader.db
    }
    return this.dbPath
  }

  init(): void {
    // Development: Use project root (easy to find, reset, inspect with DataGrip)
    // Production: Use AppData (proper user data storage location)

    this.db = new Database(this.getDbPath())

    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('foreign_keys = ON')
    this.db.pragma('cache_size = -64000') // 64MB cache
    this.db.pragma('temp_store = MEMORY')
    this.db.pragma('mmap_size = 268435456') // 256MB mmap

    this.drizzle = drizzle(this.db, { schema: schema })
  }

  getDb(): ReturnType<typeof drizzle> {
    if (!this.drizzle) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.drizzle
  }

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
    }
  }
}

export const databaseConnection = new DatabaseConnection()

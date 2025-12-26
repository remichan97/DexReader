import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { getAppDataPath } from '../filesystem/pathValidator'
import path from 'node:path'
import * as schema from './schema'

class DatabaseConnection {
  private db: Database.Database | undefined = undefined
  private drizzle: ReturnType<typeof drizzle> | undefined = undefined

  init(): void {
    // Development: Use project root (easy to find, reset, inspect with DataGrip)
    // Production: Use AppData (proper user data storage location)
    const dbPath =
      process.env.NODE_ENV_ELECTRON_VITE === 'development'
        ? path.join(process.cwd(), 'dexreader-dev.db') // Project root: D:\Projects\DexReader\dexreader-dev.db
        : path.join(getAppDataPath(), 'dexreader.db') // AppData: %APPDATA%\DexReader\dexreader.db

    this.db = new Database(dbPath)

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
      this.db.close()
      this.db = undefined
      this.drizzle = undefined
    }
  }
}

export const databaseConnection = new DatabaseConnection()

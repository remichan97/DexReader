import { drizzle } from 'drizzle-orm/node-sqlite'
import { getAppDataPath } from '../filesystem/path-validator'
import path from 'node:path'
import { relations } from './schemas/relationships.schema'
import { mainLog } from '../services/logging/main-logging.service'
import { backup, DatabaseSync } from 'node:sqlite'

class DatabaseConnection {
  private db: DatabaseSync | undefined = undefined
  private drizzle: ReturnType<typeof drizzle> | undefined = undefined
  private dbPath: string | undefined = undefined

  getDbFilePath(): string {
    return this.getDbPath()
  }

  private getDbPath(): string {
    if (!this.dbPath) {
      // Lazy-load the path only when needed (after Electron app is ready)
      this.dbPath =
        process.env.NODE_ENV_ELECTRON_VITE === 'development'
          ? path.join(process.cwd(), 'dexreader-dev.db') // Project root: .\dexreader-dev.db
          : path.join(getAppDataPath(), 'dexreader.db') // Production: ~/.dexreader/dexreader.db
    }
    return this.dbPath
  }

  init(): void {
    // Development: Use project root (easy to find, reset, inspect with DataGrip)
    // Production: Use home directory ~/.dexreader/ (follows VS Code pattern)
    const dbPath = this.getDbPath()
    mainLog.info(`[Database] Initializing database at: ${dbPath}`)

    this.db = new DatabaseSync(dbPath)
    this.db.exec('PRAGMA journal_mode = WAL') // Enable Write-Ahead Logging for better concurrency
    this.db.exec('PRAGMA cache_size = -65536') // Set cache size to 64MB (negative value means KB)
    this.db.exec('PRAGMA mmap_size = 268435456') // Set memory-mapped I/O size to 256MB
    this.db.exec('PRAGMA foreign_keys = ON') // Enable foreign key constraints
    this.db.exec('PRAGMA synchronous = NORMAL') // Set synchronous mode to NORMAL for better performance
    this.db.exec('PRAGMA temp_store = MEMORY') // Store temporary tables in memory for faster access

    mainLog.debug('[Database] SQLite pragmas configured (WAL, 64MB cache, 256MB mmap)')
    this.drizzle = drizzle({ client: this.db, relations })
    mainLog.info('[Database] Drizzle ORM initialized')
  }

  getDb(): ReturnType<typeof drizzle> {
    if (!this.drizzle) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.drizzle
  }

  close(): void {
    if (this.db) {
      mainLog.info('[Database] Closing database connection...')
      try {
        // Ensure WAL checkpoint completes before closing
        this.db.exec('PRAGMA wal_checkpoint = TRUNCATE')
        mainLog.debug('[Database] WAL checkpoint completed')
      } catch (error) {
        mainLog.error('[Database] Error during WAL checkpoint:', error)
      }

      this.db.close()
      this.db = undefined
      this.drizzle = undefined
      mainLog.info('[Database] Database connection closed successfully')
    }
  }

  // Given a backup file path, create a backup of the current database to said path
  async backupDatabase(backupFilePath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }

    mainLog.info(`[Database] Creating backup at: ${backupFilePath}`)
    try {
      // Use the Node.js SQLite backup API to create a backup of the current database
      await backup(this.db, backupFilePath, {
        progress: (info) => {
          mainLog.debug(
            `[Database] Backup progress: ${info.remainingPages} pages remaining, ${info.totalPages - info.remainingPages} pages copied`
          )
        }
      })
      mainLog.info('[Database] Finished database backup successfully')
    } catch (error) {
      mainLog.error('[Database] Error during database backup:', error)
      throw error
    }
  }
}

export const databaseConnection = new DatabaseConnection()

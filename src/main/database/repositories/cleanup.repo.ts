import { sql } from 'drizzle-orm/sql'
import { databaseConnection } from '../db-connection'
import {
  chapter,
  chapterDownloads,
  chapterProgress,
  collectionItems,
  collections,
  manga,
  mangaProgress,
  mangaReaderOverrides,
  readHistory,
  readingStatistics,
  searchPresets
} from '../schemas'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getAppDataPath } from '../../filesystem/path-validator'
import { mainLog } from '../../services/logging/main-logging.service'

class CleanUpRepository {
  private db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  private dbPath: string | undefined = undefined

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

  clearAllData(): void {
    this.db().transaction((tx) => {
      // Clear all tables, one by one
      tx.delete(chapterDownloads).run()
      tx.delete(chapterProgress).run()
      tx.delete(collectionItems).run()
      tx.delete(readHistory).run()
      tx.delete(mangaReaderOverrides).run()
      tx.delete(chapter).run()
      tx.delete(mangaProgress).run()
      tx.delete(collections).run()
      tx.delete(manga).run()
      tx.delete(readingStatistics).run()
      tx.delete(searchPresets).run()

      //Reset identity counters for autoincrement primary keys
      tx.run(sql`DELETE FROM sqlite_sequence`)
    })
    // Vacuum the database to reclaim space after deletions
    this.db().run(sql`VACUUM`)
  }

  async reclaimStorage(): Promise<number> {
    // This method will run the VACUUM command to optimize the database file and return the amount of space reclaimed
    const beforeSize = await this.getDatabaseFileSize()
    this.db().run(sql`VACUUM`)
    const afterSize = await this.getDatabaseFileSize()
    return beforeSize - afterSize // in bytes, can convert to MB in the caller if needed
  }

  private async getDatabaseFileSize(): Promise<number> {
    const dbPath = path.resolve(this.getDbPath())
    try {
      const stats = await fs.stat(dbPath)
      return stats.size
    } catch (error) {
      mainLog.error('[Database] Error getting database file size:', error)
      return 0
    }
  }
}

export const cleanupRepo = new CleanUpRepository()

import { sql } from 'drizzle-orm/sql'
import { databaseConnection } from '../connection'
import {
  chapter,
  chapterProgress,
  collectionItems,
  collections,
  manga,
  mangaProgress,
  mangaReaderOverrides,
  readingStatistics
} from '../schema'

export class DestructionRepository {
  private db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  clearAllData(): void {
    this.db().transaction((tx) => {
      // Temporarily disable foreign key checks
      tx.run(sql`PRAGMA foreign_keys = OFF`)

      // Now clear all tables, one by one
      tx.delete(collectionItems).run()
      tx.delete(collections).run()
      tx.delete(chapterProgress).run()
      tx.delete(mangaProgress).run()
      tx.delete(chapter).run()
      tx.delete(manga).run()
      tx.delete(readingStatistics).run()
      tx.delete(mangaReaderOverrides).run()

      //Reset identity counters for autoincrement primary keys
      tx.run(sql`DELETE FROM sqlite_sequence`)

      // Re-enable foreign key checks
      tx.run(sql`PRAGMA foreign_keys = ON`)
    })
    // Vacuum the database to reclaim space after deletions
    this.db().run(sql`VACUUM`)
  }
}

export const destructionRepo = new DestructionRepository()

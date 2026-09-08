import { eq } from 'drizzle-orm'
import { databaseConnection } from '../db-connection'
import { manga, mangaReaderOverrides } from '../schemas'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
import { MangaMapper } from '../mappers/manga.mapper'
import { executeBatchOperations } from '../utils/batch-operations.util'
import { UpdateMangaOverrideCommand } from '@shared/commands/repositories/manga/update-manga-override.command'
import { MangaOverrideContract } from '@shared/contracts/database/manga/manga-override.contract'

class ReaderSettingsRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  clearAllOverrides(): void {
    this.db.delete(mangaReaderOverrides).run()
  }

  clearMangaOverride(mangaId: string): void {
    this.db.delete(mangaReaderOverrides).where(eq(mangaReaderOverrides.mangaId, mangaId)).run()
  }

  getMangaOverride(mangaId: string): MangaReadingSettings | undefined {
    const result = this.db
      .select()
      .from(mangaReaderOverrides)
      .where(eq(mangaReaderOverrides.mangaId, mangaId))
      .get()

    if (result) {
      return result.settings
    }

    return undefined
  }

  /**
   * Get all manga reader overrides with manga metadata (title, coverUrl)
   * Used for Settings page display and export functionality
   */
  getAllOverridesWithMetadata(): MangaOverrideContract[] {
    const results = this.db
      .select({
        mangaId: mangaReaderOverrides.mangaId,
        title: manga.title,
        coverUrl: manga.coverUrl,
        readerSettings: mangaReaderOverrides.settings,
        createdAt: mangaReaderOverrides.createdAt,
        updatedAt: mangaReaderOverrides.updatedAt
      })
      .from(mangaReaderOverrides)
      .innerJoin(manga, eq(mangaReaderOverrides.mangaId, manga.mangaId))
      .all()

    return results.map(MangaMapper.toMangaOverrideQuery)
  }

  updateMangaOverride(command: UpdateMangaOverrideCommand): void {
    const now = new Date()

    this.db
      .insert(mangaReaderOverrides)
      .values({
        mangaId: command.mangaId,
        settings: command.overrideData,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: mangaReaderOverrides.mangaId,
        set: {
          settings: command.overrideData,
          updatedAt: now
        }
      })
      .run()
  }

  batchUpdateOverrides(commands: UpdateMangaOverrideCommand[]): void {
    const now = new Date()

    executeBatchOperations({
      commands,
      db: this.db,
      singleOperation: (command) => this.updateMangaOverride(command),
      batchOperation: (tx, command) => {
        tx.insert(mangaReaderOverrides)
          .values({
            mangaId: command.mangaId,
            settings: command.overrideData,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: mangaReaderOverrides.mangaId,
            set: {
              settings: command.overrideData,
              updatedAt: now
            }
          })
          .run()
      }
    })
  }
}
export const readerSettingsRepo = new ReaderSettingsRepository()

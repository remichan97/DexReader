import { eq } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { mangaReaderOverrides } from '../schema'
import { MangaReadingSettings } from '../../settings/entity/reading-settings.entity'
import { UpdateMangaOverrideCommand } from '../commands/manga/update-manga-override.command'

export class ReaderSettingsRepository {
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

    if (commands.length === 0) {
      return
    }

    if (commands.length === 1) {
      this.updateMangaOverride(commands[0])
      return
    }

    this.db.transaction((tx) => {
      for (const command of commands) {
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

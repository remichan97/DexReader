import { ChapterOrderOptions } from './../../api/enums/chapter-order-options.enum'
import { and, eq, like, sql, SQL } from 'drizzle-orm'
import { UpsertMangaCommand } from '../commands/upsert-manga.command'
import { databaseConnection } from '../connection'
import { collections, manga } from '../schema'
import { GetLibraryMangaCommand } from '../commands/get-library-manga.command'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { MangaMapper } from '../mappers/manga.mapper'
import { MangaDexClient } from '../../api/mangadexClient'
import { OrderDirection } from '../../api/enums'

export class MangaRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }
  private readonly mangadexClient = new MangaDexClient()

  upsertManga(mangaData: UpsertMangaCommand): void {
    const now: Date = new Date()

    this.db
      .insert(manga)
      .values({
        ...mangaData,
        addedAt: now,
        updatedAt: now,
        lastAccessedAt: now
      })
      .onConflictDoUpdate({
        target: manga.mangaId,
        set: {
          ...mangaData,
          updatedAt: now,
          lastAccessedAt: now
        }
      })
      .run()
  }

  toggleFavourite(mangaId: string): boolean {
    const existing = this.db.select().from(manga).where(eq(manga.mangaId, mangaId)).get()

    if (!existing) {
      throw new Error(`Manga with ID ${mangaId} not found`)
    }

    const newStatus = !existing.isFavourite

    this.db
      .update(manga)
      .set({
        isFavourite: newStatus,
        updatedAt: new Date()
      })
      .where(eq(manga.mangaId, mangaId))
      .run()

    return newStatus
  }

  getLibraryManga(options?: GetLibraryMangaCommand): MangaWithMetadata[] {
    // If no filters provided, return everything that is favourited
    if (!options) {
      const result = this.db.select().from(manga).where(eq(manga.isFavourite, true)).all()
      return result.map(MangaMapper.toMangaWithMetadata)
    }

    // Now build query based on provided filters
    const condition: SQL[] = []

    if (options.collectionId) {
      condition.push(
        eq(
          manga.mangaId,
          this.db
            .select({
              collectionName: collections.name
            })
            .from(collections)
            .where(eq(collections.id, options.collectionId))
        )
      )
    }

    if (options.search) {
      condition.push(like(manga.title, `%${options.search}%`))
    }

    if (options.limit) {
      condition.push(sql`LIMIT ${options.limit}`)
    }

    if (options.offset) {
      condition.push(sql`OFFSET ${options.offset}`)
    }

    const results = this.db
      .select()
      .from(manga)
      .where(and(...condition))
      .all()

    return results.map(MangaMapper.toMangaWithMetadata)
  }

  // Query the API for new chapter of a manga and see if there is an update available
  // If there is, update tracking info in the database and return true, else note down the last check time and return false
  async checkForUpdate(mangaId: string): Promise<boolean> {
    const existing = this.db.select().from(manga).where(eq(manga.mangaId, mangaId)).get()

    if (!existing) return false

    const chapterList = await this.mangadexClient.getMangaFeed(mangaId, {
      limit: 1,
      order: { [ChapterOrderOptions.CHAPTER]: OrderDirection.Desc }
    })

    const hasNewChapter =
      chapterList.data && chapterList.data.length > 0
        ? chapterList.data[0].attributes.chapter !== existing.lastChapter
        : false

    if (hasNewChapter) {
      this.db
        .update(manga)
        .set({
          lastKnownChapterId: chapterList.data[0].attributes.chapter || '',
          lastKnownChapterNumber: chapterList.data[0].attributes.chapter || '',
          hasNewChapters: true,
          updatedAt: new Date(),
          lastCheckForUpdates: new Date()
        })
        .where(eq(manga.mangaId, mangaId))
        .run()
    } else {
      this.db
        .update(manga)
        .set({
          lastCheckForUpdates: new Date()
        })
        .where(eq(manga.mangaId, mangaId))
        .run()
    }

    return hasNewChapter
  }

  // We already have a database level trigger that deletes non-favourite and non-read manga that does the same as what this method does.
  // This is for those who wants an immediate cleanup without waiting for that.
  cleanupMangaCache(): number {
    const result = this.db
      .delete(manga)
      .where(and(eq(manga.isFavourite, false), eq(manga.isRead, false)))
      .run()

    return result.changes
  }
}

export const mangaRepository = new MangaRepository()

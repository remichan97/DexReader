import { and, eq, like, lt, SQL } from 'drizzle-orm'
import { UpsertMangaCommand } from '../commands/collections/upsert-manga.command'
import { databaseConnection } from '../connection'
import { collectionItems, manga } from '../schema'
import { GetLibraryMangaCommand } from '../commands/manga/get-library-manga.command'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { MangaMapper } from '../mappers/manga.mapper'
import { MarkMangaNewChapterCommand } from '../commands/manga/mark-new-chapter.command'
import { SearchMangaCommand } from '../commands/manga/search-manga.command'

export class MangaRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  batchUpsertManga(mangaData: UpsertMangaCommand[]): void {
    const now: Date = new Date()

    // If no data, skip
    if (mangaData.length === 0) {
      return
    }

    // If only one item, might as well use the single upsert method
    if (mangaData.length === 1) {
      this.upsertManga(mangaData[0])
      return
    }

    this.db.transaction((tx) => {
      for (const data of mangaData) {
        tx.insert(manga)
          .values({
            ...data,
            addedAt: now,
            updatedAt: now,
            lastAccessedAt: now
          })
          .onConflictDoUpdate({
            target: manga.mangaId,
            set: {
              ...data,
              updatedAt: now,
              lastAccessedAt: now
            }
          })
          .run()
      }
    })
  }

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

  markHasNewChapter(command: MarkMangaNewChapterCommand): void {
    this.db
      .update(manga)
      .set({
        hasNewChapters: command.hasNew ?? true,
        updatedAt: new Date(),
        lastCheckForUpdates: new Date()
      })
      .where(eq(manga.mangaId, command.mangaId))
      .run()
  }

  getLibraryManga(options?: GetLibraryMangaCommand): MangaWithMetadata[] {
    // If no filters provided, return everything that is favourited
    if (!options) {
      const result = this.db.select().from(manga).where(eq(manga.isFavourite, true)).all()
      return result.map(MangaMapper.toMangaWithMetadata)
    }

    // Now build query based on provided filters
    const condition: SQL[] = []

    // Always return favourited manga regardless of other filters
    condition.push(eq(manga.isFavourite, true))

    if (options.collectionId) {
      condition.push(
        eq(
          manga.mangaId,
          this.db
            .select({
              mangaId: collectionItems.mangaId
            })
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, options.collectionId))
        )
      )
    }

    if (options.search) {
      condition.push(like(manga.title, `%${options.search}%`))
    }

    const query = this.db
      .select()
      .from(manga)
      .where(and(...condition))
      .$dynamic()
      .limit(options.limit ?? 100)
      .offset(options.offset ?? 0)
      .all()

    return query.map(MangaMapper.toMangaWithMetadata)
  }

  getMangaByCustomCondition(command: SearchMangaCommand): MangaWithMetadata[] {
    const condition: SQL[] = []

    if (command.title) {
      condition.push(like(manga.title, `%${command.title}%`))
    }

    if (command.author) {
      condition.push(like(manga.authors, `%${command.author}%`))
    }

    if (command.artist) {
      condition.push(like(manga.artists, `%${command.artist}%`))
    }

    if (command.tag) {
      condition.push(like(manga.tags, `%${command.tag}%`))
    }

    const query = this.db
      .select()
      .from(manga)
      .where(and(...condition))
      .$dynamic()
      .limit(command.limit ?? 100)
      .offset(command.offset ?? 0)
      .all()

    return query.map(MangaMapper.toMangaWithMetadata)
  }

  getMangaById(mangaId: string): MangaWithMetadata | undefined {
    const result = this.db.select().from(manga).where(eq(manga.mangaId, mangaId)).get()

    if (!result) {
      return undefined
    }

    return MangaMapper.toMangaWithMetadata(result)
  }

  getLibraryMangaWithNewChapters(): MangaWithMetadata[] {
    const results = this.db
      .select()
      .from(manga)
      .where(and(eq(manga.isFavourite, true), eq(manga.hasNewChapters, true)))
      .all()
    return results.map(MangaMapper.toMangaWithMetadata)
  }

  // Cleanup the manga table, can be explicitly or on a schedule
  cleanupMangaCache(immediate?: boolean): number {
    const now = new Date()

    // Build delete condition
    // If immediate is true, delete all non-favourite regardless of last accessed time
    // Else, only delete non-favourite manga that hasn't been accessed in the last 90 days
    const condition: SQL[] = []

    condition.push(eq(manga.isFavourite, false))

    if (!immediate) {
      const thresholdDate = new Date()
      thresholdDate.setDate(now.getDate() - 90)
      condition.push(lt(manga.lastAccessedAt, thresholdDate))
    }

    const deleteQuery = this.db.delete(manga).where(and(...condition))

    const result = deleteQuery.run()

    return result.changes || 0
  }
}

export const mangaRepository = new MangaRepository()

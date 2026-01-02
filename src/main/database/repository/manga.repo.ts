import { and, eq, like, lt, sql, SQL } from 'drizzle-orm'
import { UpsertMangaCommand } from '../commands/collections/upsert-manga.command'
import { databaseConnection } from '../connection'
import { collections, manga } from '../schema'
import { GetLibraryMangaCommand } from '../commands/manga/get-library-manga.command'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { MangaMapper } from '../mappers/manga.mapper'
import { MarkMangaNewChapterCommand } from '../commands/manga/mark-new-chapter.command'

export class MangaRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
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

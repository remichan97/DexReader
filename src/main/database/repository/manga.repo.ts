import { and, eq, like, lt, SQL, or, sql } from 'drizzle-orm'
import { UpsertMangaCommand } from '../commands/manga/upsert-manga.command'
import { databaseConnection } from '../connection'
import { chapterDownloads, collectionItems, manga } from '../schema'
import { GetLibraryMangaCommand } from '../commands/manga/get-library-manga.command'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { MangaMapper } from '../mappers/manga.mapper'
import { MarkMangaNewChapterCommand } from '../commands/manga/mark-new-chapter.command'
import { SearchMangaCommand } from '../commands/manga/search-manga.command'
import { DownloadStatus } from '../enums/download-status.enum'

type MangaRow = typeof manga.$inferSelect

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

  updateCoverCachedDate(mangaId: string[]): void {
    const now = new Date()

    this.db.transaction((tx) => {
      for (const id of mangaId) {
        tx.update(manga)
          .set({
            coverCachedAt: now,
            updatedAt: now
          })
          .where(eq(manga.mangaId, id))
          .run()
      }
    })
  }

  // Given an optional array of manga IDs, clear the cached cover date for the specified manga or all manga if no IDs are provided
  clearCachedCoverDate(mangaId?: string[]): void {
    const now = new Date()

    if (mangaId) {
      this.db.transaction((tx) => {
        for (const id of mangaId) {
          tx.update(manga)
            .set({
              coverCachedAt: undefined,
              updatedAt: now
            })
            .where(eq(manga.mangaId, id))
            .run()
        }
      })
    } else {
      this.db.update(manga).set({ coverCachedAt: undefined, updatedAt: now }).run()
    }
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
    // If no filters provided, return everything that is favourited, or has downloaded chapters (even if not favourited)
    if (!options) {
      const result = this.db
        .select({
          manga: manga,
          downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
        })
        .from(manga)
        .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
        .where(
          or(
            eq(manga.isFavourite, true), // Favourited manga
            eq(chapterDownloads.status, DownloadStatus.Completed) // Manga with completed downloads
          ) as SQL
        )
        .groupBy(manga.mangaId) // Get unique manga (one manga can have multiple downloaded chapters)
        .all()
      return result.map((row) => ({
        ...MangaMapper.toMangaWithMetadata(row.manga),
        hasDownloads: row.downloadCount > 0,
        downloadedChapterCount: row.downloadCount
      }))
    }

    // Now build query based on provided filters
    const condition: (SQL | undefined)[] = []

    // Build optional filters first
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

    // Always return favourited manga, or downloaded manga regardless of other filters
    condition.push(
      or(eq(manga.isFavourite, true), eq(chapterDownloads.status, DownloadStatus.Completed))
    )

    const query = this.db
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(and(...condition))
      .groupBy(manga.mangaId)
      .$dynamic()
      .limit(options.limit ?? 100)
      .offset(options.offset ?? 0)
      .all()

    return query.map((row) => ({
      ...MangaMapper.toMangaWithMetadata(row.manga),
      hasDownloads: row.downloadCount > 0,
      downloadedChapterCount: row.downloadCount
    }))
  }

  getDownloadedManga(): MangaWithMetadata[] {
    const results = this.db
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .innerJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(
        eq(chapterDownloads.status, DownloadStatus.Completed) // Only completed downloads
      )
      .groupBy(manga.mangaId) // Get unique manga (one manga can have multiple downloaded chapters)
      .all()

    // All results have downloads by definition (innerJoin + where clause)
    return results.map((row) => ({
      ...MangaMapper.toMangaWithMetadata(row.manga),
      hasDownloads: true,
      downloadedChapterCount: row.downloadCount
    }))
  }

  getLibraryMangaByCustomCondition(command: SearchMangaCommand): MangaWithMetadata[] {
    const condition: (SQL | undefined)[] = []
    // Always return favourited manga, or downloaded manga regardless of other filters
    condition.push(
      or(eq(manga.isFavourite, true), eq(chapterDownloads.status, DownloadStatus.Completed))
    )

    if (command.mangaId) {
      condition.push(eq(manga.mangaId, command.mangaId))
    }

    if (command.title) {
      condition.push(eq(manga.title, command.title))
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
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(and(...condition))
      .groupBy(manga.mangaId)
      .$dynamic()
      .limit(command.limit ?? 100)
      .offset(command.offset ?? 0)
      .all()

    return query.map((row) => ({
      ...MangaMapper.toMangaWithMetadata(row.manga),
      hasDownloads: row.downloadCount > 0,
      downloadedChapterCount: row.downloadCount
    }))
  }

  getMangaById(mangaId: string): MangaWithMetadata | undefined {
    const result = this.db
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(eq(manga.mangaId, mangaId))
      .groupBy(manga.mangaId)
      .get()

    if (!result) {
      return undefined
    }

    return {
      ...MangaMapper.toMangaWithMetadata(result.manga),
      hasDownloads: result.downloadCount > 0,
      downloadedChapterCount: result.downloadCount
    }
  }

  getLibraryMangaWithNewChapters(): MangaWithMetadata[] {
    const results = this.db
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(and(eq(manga.isFavourite, true), eq(manga.hasNewChapters, true)))
      .groupBy(manga.mangaId)
      .all()
    return results.map((row) => ({
      ...MangaMapper.toMangaWithMetadata(row.manga),
      hasDownloads: row.downloadCount > 0,
      downloadedChapterCount: row.downloadCount
    }))
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

  // For native export functionality, return raw data from the manga table
  getLibraryMangaForExport(): MangaRow[] {
    return this.db.select().from(manga).where(eq(manga.isFavourite, true)).all()
  }

  // Unconditionally get all manga rows for when we need to export reader settings and progress
  getAllManga(): MangaRow[] {
    return this.db.select().from(manga).all()
  }
}

export const mangaRepository = new MangaRepository()

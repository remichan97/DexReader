import { and, eq, inArray, like, lt, SQL, sql, notExists, or, isNotNull } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { chapterDownloads, collectionItems, manga } from '../schemas'
import { MangaMapper } from '../mappers/manga.mapper'
import { DbExecutor, executeBatchOperations } from '../utils/batch-operations.util'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { GetLibraryMangaCommand } from '@shared/commands/repositories/manga/get-library-manga.command'
import { SearchMangaCommand } from '@shared/commands/repositories/manga/search-manga.command'
import { MangaWithMetadataContract } from '@shared/contracts/database/manga/manga-with-metadata.contract'
import { MangaCacheStatsContract } from '@shared/contracts/database/manga/manga-cache-stats.contract'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'

type MangaRow = typeof manga.$inferSelect

class MangaRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  batchUpsertManga(mangaData: UpsertMangaCommand[], executor: DbExecutor = this.db): void {
    const now: Date = new Date()

    executeBatchOperations({
      commands: mangaData,
      db: executor,
      singleOperation: (data) => this.upsertManga(data, executor),
      batchOperation: (tx, data) => {
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

  upsertManga(mangaData: UpsertMangaCommand, executor: DbExecutor = this.db): void {
    const now: Date = new Date()

    executor
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

  updateCoverCachedDate(mangaIds: string[]): void {
    if (mangaIds.length === 0) return

    const now = new Date()
    const CHUNK_SIZE = 500 // SQLite has a 999-parameter limit for WHERE IN clauses

    // Process in chunks to avoid SQLite's parameter limit
    for (let i = 0; i < mangaIds.length; i += CHUNK_SIZE) {
      const chunk = mangaIds.slice(i, i + CHUNK_SIZE)
      this.db
        .update(manga)
        .set({
          coverCachedAt: now,
          updatedAt: now
        })
        .where(inArray(manga.mangaId, chunk))
        .run()
    }
  }

  // Given an optional array of manga IDs, clear the cached cover date for the specified manga or all manga if no IDs are provided
  clearCachedCoverDate(mangaIds?: string[]): void {
    const now = new Date()

    if (mangaIds && mangaIds.length > 0) {
      const CHUNK_SIZE = 500 // SQLite has a 999-parameter limit for WHERE IN clauses

      // Process in chunks to avoid SQLite's parameter limit
      for (let i = 0; i < mangaIds.length; i += CHUNK_SIZE) {
        const chunk = mangaIds.slice(i, i + CHUNK_SIZE)
        this.db
          .update(manga)
          .set({
            coverCachedAt: null,
            updatedAt: now
          })
          .where(inArray(manga.mangaId, chunk))
          .run()
      }
    } else if (!mangaIds) {
      // Clear for all manga
      this.db.update(manga).set({ coverCachedAt: null, updatedAt: now }).run()
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

  getLibraryManga(options?: GetLibraryMangaCommand): MangaWithMetadataContract[] {
    // If no option is provided, return all favourited manga with their download status - this is the default library view without filters
    if (!options) {
      const result = this.db
        .select({
          manga: manga,
          downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
        })
        .from(manga)
        .leftJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
        .where(eq(manga.isFavourite, true))
        .groupBy(manga.mangaId)
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

    // If includeDownloaded is true, include manga that are EITHER favorited OR have completed downloads
    // Otherwise only include favorited manga (standard library view)
    if (options.includeDownloaded) {
      // Include manga that are favorited OR have at least one completed download (from LEFT JOIN)
      condition.push(
        or(
          eq(manga.isFavourite, true),
          and(
            isNotNull(chapterDownloads.mangaId), // Has at least one download
            eq(chapterDownloads.status, DownloadStatus.Completed) // And it's completed
          )
        )
      )
    } else {
      condition.push(eq(manga.isFavourite, true))
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
      .limit(options.limit ?? 100)
      .offset(options.offset ?? 0)
      .all()

    return query.map((row) => ({
      ...MangaMapper.toMangaWithMetadata(row.manga),
      hasDownloads: row.downloadCount > 0,
      downloadedChapterCount: row.downloadCount
    }))
  }

  getDownloadedManga(): MangaWithMetadataContract[] {
    const results = this.db
      .select({
        manga: manga,
        downloadCount: sql<number>`COUNT(CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN 1 END)`
      })
      .from(manga)
      .innerJoin(chapterDownloads, eq(manga.mangaId, chapterDownloads.mangaId))
      .where(
        eq(chapterDownloads.status, DownloadStatus.Completed) // Only completed downloads (isHidden is for DownloadView only)
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

  getLibraryMangaByCustomCondition(command: SearchMangaCommand): MangaWithMetadataContract[] {
    const condition: (SQL | undefined)[] = []
    // Only return explicitly favourited manga (library = curated bookmarks)
    condition.push(eq(manga.isFavourite, true))

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

  getMangaById(mangaId: string): MangaWithMetadataContract | undefined {
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

  statsMangaTable(): MangaCacheStatsContract {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 90)

    // Single query with conditional aggregation - most efficient approach
    // Uses LEFT JOIN to detect downloads, then aggregates with CASE expressions
    const result = this.db
      .select({
        totalManga: sql<number>`COUNT(DISTINCT ${manga.mangaId})`,
        totalFavouriteManga: sql<number>`COUNT(DISTINCT CASE WHEN ${manga.isFavourite} = 1 THEN ${manga.mangaId} END)`,
        downloadedManga: sql<number>`COUNT(DISTINCT CASE WHEN ${chapterDownloads.status} = ${DownloadStatus.Completed} THEN ${manga.mangaId} END)`,
        browsingCache: sql<number>`COUNT(DISTINCT CASE WHEN ${manga.isFavourite} = 0 AND ${chapterDownloads.status} IS NULL THEN ${manga.mangaId} END)`,
        oldCache: sql<number>`COUNT(DISTINCT CASE WHEN ${manga.isFavourite} = 0 AND ${chapterDownloads.status} IS NULL AND ${manga.lastAccessedAt} < ${thresholdDate} THEN ${manga.mangaId} END)`
      })
      .from(manga)
      .leftJoin(
        chapterDownloads,
        and(
          eq(manga.mangaId, chapterDownloads.mangaId),
          eq(chapterDownloads.status, DownloadStatus.Completed)
        )
      )
      .get()

    return {
      totalManga: result?.totalManga ?? 0,
      totalFavouriteManga: result?.totalFavouriteManga ?? 0,
      downloadedManga: result?.downloadedManga ?? 0,
      browsingCache: result?.browsingCache ?? 0,
      oldCache: result?.oldCache ?? 0
    }
  }

  // Cleanup the manga table, can be explicitly or on a schedule
  cleanupMangaCache(immediate?: boolean): number {
    const now = new Date()

    // Build delete condition
    // If immediate is true, delete all non-favourite, or non-downloaded manga regardless of last accessed time
    // Else, only delete non-favourite manga, or non-downloaded manga that hasn't been accessed in the last 90 days
    const condition: SQL[] = []

    condition.push(
      eq(manga.isFavourite, false),
      notExists(
        this.db
          .select()
          .from(chapterDownloads)
          .where(
            and(
              eq(chapterDownloads.mangaId, manga.mangaId),
              eq(chapterDownloads.status, DownloadStatus.Completed)
            )
          )
      )
    )

    if (!immediate) {
      const thresholdDate = new Date()
      thresholdDate.setDate(now.getDate() - 90)
      condition.push(lt(manga.lastAccessedAt, thresholdDate))
    }

    const deleteQuery = this.db.delete(manga).where(and(...condition))

    const result = deleteQuery.run()

    return Number(result.changes) || 0
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

export const mangaRepo = new MangaRepository()

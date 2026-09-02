import { eq, sql, and } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { chapter, chapterDownloads, manga } from '../schemas'
import { ChapterDownloadMapper } from '../mappers/chapter-downloads.mapper'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { executeBatchOperations } from '../utils/batch-operations.util'
import { DeleteChapterCommand } from '@shared/commands/repositories/chapter-downloads/delete-chapter.command'
import { CreateDownloadCommand } from '@shared/commands/repositories/chapter-downloads/create-download.command'
import { MarkDownloadStateCommand } from '@shared/commands/repositories/chapter-downloads/mark-state.command'
import { MangaStorageContract } from '@shared/contracts/database/chapter-downloads/manga-storage.contract'
import { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { AnySQLiteSelectQueryBuilder, SQLiteSelectDynamic } from 'drizzle-orm/sqlite-core'

class ChapterDownloadsRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  // Calculate total storage used by all manga downloads, and storage used by each manga grouped by title (sum of all chapters of the same manga)
  getStorageByManga(): MangaStorageContract {
    const mangaStorageByTitle = this.db
      .select({
        mangaId: manga.mangaId,
        mangaTitle: manga.title,
        coverUrl: manga.coverUrl,
        totalStorageSize: sql`SUM(${chapterDownloads.storageSize})`,
        chapterCount: sql`COUNT(${chapterDownloads.chapterId})`
      })
      .from(chapterDownloads)
      .innerJoin(manga, eq(chapterDownloads.mangaId, manga.mangaId))
      .where(
        and(
          eq(chapterDownloads.isHidden, false),
          eq(chapterDownloads.status, DownloadStatus.Completed)
        )
      )
      .groupBy(manga.mangaId)
      .all()

    const totalAppStorage = mangaStorageByTitle.reduce(
      (acc, manga) => acc + (manga.totalStorageSize as number),
      0
    )

    return ChapterDownloadMapper.toMangaStorageQuery(totalAppStorage, mangaStorageByTitle)
  }

  getDownload(chapterId: string): ChapterDownloadContract | undefined {
    let selectQuery = this.db
      .select({
        chapterId: chapterDownloads.chapterId,
        mangaId: chapterDownloads.mangaId,
        status: chapterDownloads.status,
        storageSize: chapterDownloads.storageSize,
        downloadedAt: chapterDownloads.downloadedAt,
        downloadsBasePath: chapterDownloads.downloadsBasePath,
        filePath: chapterDownloads.filePath,
        totalPages: chapterDownloads.totalPages,
        imageQuality: chapterDownloads.imageQuality,
        imageFormat: chapterDownloads.imageFormat,
        errorMessage: chapterDownloads.errorMessage,
        title: manga.title,
        coverUrl: manga.coverUrl,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        volume: chapter.volume,
        language: chapter.language
      })
      .from(chapterDownloads)
      .where(eq(chapterDownloads.chapterId, chapterId))
      .$dynamic()

    selectQuery = this.baseChapterDownloadInnerJoin(selectQuery)

    const result = selectQuery.get()

    if (result) {
      return ChapterDownloadMapper.toChapterDownloadQuery(result)
    }

    return undefined
  }

  getAllDownloads(): ChapterDownloadContract[] {
    let query = this.db
      .select({
        chapterId: chapterDownloads.chapterId,
        mangaId: chapterDownloads.mangaId,
        status: chapterDownloads.status,
        storageSize: chapterDownloads.storageSize,
        downloadedAt: chapterDownloads.downloadedAt,
        downloadsBasePath: chapterDownloads.downloadsBasePath,
        filePath: chapterDownloads.filePath,
        totalPages: chapterDownloads.totalPages,
        imageQuality: chapterDownloads.imageQuality,
        imageFormat: chapterDownloads.imageFormat,
        errorMessage: chapterDownloads.errorMessage,
        title: manga.title,
        coverUrl: manga.coverUrl,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        volume: chapter.volume,
        language: chapter.language
      })
      .from(chapterDownloads)
      .where(eq(chapterDownloads.isHidden, false))
      .$dynamic()

    query = this.baseChapterDownloadInnerJoin(query)

    const results = query.all()

    return results.map(ChapterDownloadMapper.toChapterDownloadQuery)
  }

  filterDownloadsByMangaId(mangaId: string): ChapterDownloadContract[] {
    let query = this.db
      .select({
        chapterId: chapterDownloads.chapterId,
        mangaId: chapterDownloads.mangaId,
        status: chapterDownloads.status,
        storageSize: chapterDownloads.storageSize,
        downloadedAt: chapterDownloads.downloadedAt,
        downloadsBasePath: chapterDownloads.downloadsBasePath,
        filePath: chapterDownloads.filePath,
        totalPages: chapterDownloads.totalPages,
        imageQuality: chapterDownloads.imageQuality,
        imageFormat: chapterDownloads.imageFormat,
        errorMessage: chapterDownloads.errorMessage,
        title: manga.title,
        coverUrl: manga.coverUrl,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        volume: chapter.volume,
        language: chapter.language
      })
      .from(chapterDownloads)
      .where(eq(chapterDownloads.mangaId, mangaId))
      .$dynamic()

    query = this.baseChapterDownloadInnerJoin(query)

    const results = query.all()

    return results.map(ChapterDownloadMapper.toChapterDownloadQuery)
  }

  // Delete a download, either permanently or soft delete (mark as hidden)
  deleteDownload(command: DeleteChapterCommand): void {
    if (command.isDeletePermanent) {
      // This is a permanent delete, remove the entry from the database and the files from disk (handled at service level)
      this.db
        .delete(chapterDownloads)
        .where(eq(chapterDownloads.chapterId, command.chapterId))
        .run()
    } else {
      // This is a soft delete, we will just mark the entry as hidden, which hides it from the UI but keep the files on disk and the entry in the database in case they want to read the chapter again without needing to redownload
      this.db
        .update(chapterDownloads)
        .set({ isHidden: true })
        .where(eq(chapterDownloads.chapterId, command.chapterId))
        .run()
    }
  }

  // Batch delete downloads, either permanently or soft delete (mark as hidden)
  batchDeleteDownloads(commands: DeleteChapterCommand[]): void {
    executeBatchOperations({
      commands,
      db: this.db,
      singleOperation: (command) => this.deleteDownload(command),
      batchOperation: (tx, command) => {
        if (command.isDeletePermanent) {
          tx.delete(chapterDownloads).where(eq(chapterDownloads.chapterId, command.chapterId)).run()
        } else {
          tx.update(chapterDownloads)
            .set({ isHidden: true })
            .where(eq(chapterDownloads.chapterId, command.chapterId))
            .run()
        }
      }
    })
  }

  createDownload(command: CreateDownloadCommand): void {
    this.db
      .insert(chapterDownloads)
      .values({
        chapterId: command.chapterId,
        mangaId: command.mangaId,
        totalPages: command.totalPages,
        downloadsBasePath: command.downloadsBasePath,
        filePath: command.filePath,
        imageQuality: command.imageQuality
      })
      .run()
  }

  markDownloadState(command: MarkDownloadStateCommand): void {
    this.db
      .update(chapterDownloads)
      .set(this.buildDownloadStateUpdates(command))
      .where(eq(chapterDownloads.chapterId, command.chapterId))
      .run()
  }

  batchMarkDownloadsState(commands: MarkDownloadStateCommand[]): void {
    executeBatchOperations({
      commands,
      db: this.db,
      singleOperation: (command) => this.markDownloadState(command),
      batchOperation: (tx, command) => {
        tx.update(chapterDownloads)
          .set(this.buildDownloadStateUpdates(command))
          .where(eq(chapterDownloads.chapterId, command.chapterId))
          .run()
      }
    })
  }

  updateVerificationTimestamp(chapterId: string): void {
    this.db
      .update(chapterDownloads)
      .set({ lastVerifiedAt: new Date() })
      .where(eq(chapterDownloads.chapterId, chapterId))
      .run()
  }

  countDownloadsByStatus(status: DownloadStatus): number {
    const result = this.db
      .select()
      .from(chapterDownloads)
      .where(eq(chapterDownloads.status, status))
      .all()

    return result.length
  }

  private buildDownloadStateUpdates(
    command: MarkDownloadStateCommand
  ): Partial<typeof chapterDownloads.$inferInsert> {
    const updates: Partial<typeof chapterDownloads.$inferInsert> = {}

    if (command.isDownloaded) {
      updates.status = DownloadStatus.Completed
      updates.storageSize = command.storageSize
      updates.totalPages = command.totalPages
      updates.downloadedAt = new Date()
      if (command.imageFormat) {
        updates.imageFormat = command.imageFormat
      }
    }

    if (command.isFailed) {
      updates.status = DownloadStatus.Failed
      updates.errorMessage = command.errorMessage ?? undefined
      updates.lastAttemptedAt = new Date()
    }

    return updates
  }

  private baseChapterDownloadInnerJoin<T extends AnySQLiteSelectQueryBuilder>(
    qb: T
  ): SQLiteSelectDynamic<T> {
    return qb
      .innerJoin(manga, eq(chapterDownloads.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(chapterDownloads.chapterId, chapter.chapterId))
  }
}
export const chapterDownloadsRepo = new ChapterDownloadsRepository()

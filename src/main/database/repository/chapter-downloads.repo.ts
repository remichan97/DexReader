import { eq } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { chapter, chapterDownloads, manga } from '../schema'
import { CreateDownloadCommand } from '../commands/chapter-downloads/create-download.command'
import { ChapterDownloadQuery } from '../queries/chapter-downloads/chapter-downloads.query'
import { ChapterDownloadMapper } from '../mappers/chapter-downloads.mapper'
import { MarkDownloadStateCommand } from '../commands/chapter-downloads/mark-state.command'
import { DownloadStatus } from '../enums/download-status.enum'

export class ChapterDownloadsRepo {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getDownload(chapterId: string): ChapterDownloadQuery | undefined {
    const result = this.db
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
        errorMessage: chapterDownloads.errorMessage,
        title: manga.title,
        coverUrl: manga.coverUrl,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        volume: chapter.volume,
        language: chapter.language
      })
      .from(chapterDownloads)
      .innerJoin(manga, eq(chapterDownloads.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(chapterDownloads.chapterId, chapter.chapterId))
      .where(eq(chapterDownloads.chapterId, chapterId))
      .get()

    if (result) {
      return ChapterDownloadMapper.toChapterDownloadQuery(result)
    }

    return undefined
  }

  getAllDownloads(): ChapterDownloadQuery[] {
    const results = this.db
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
        errorMessage: chapterDownloads.errorMessage,
        title: manga.title,
        coverUrl: manga.coverUrl,
        chapterNumber: chapter.chapterNumber,
        chapterTitle: chapter.title,
        volume: chapter.volume,
        language: chapter.language
      })
      .from(chapterDownloads)
      .innerJoin(manga, eq(chapterDownloads.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(chapterDownloads.chapterId, chapter.chapterId))
      .all()

    return results.map(ChapterDownloadMapper.toChapterDownloadQuery)
  }

  deleteDownload(chapterId: string): void {
    this.db.delete(chapterDownloads).where(eq(chapterDownloads.chapterId, chapterId)).run()
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
    const updates: Partial<typeof chapterDownloads.$inferInsert> = {}

    if (command.isDownloaded) {
      updates.status = DownloadStatus.Completed
      updates.storageSize = command.storageSize
      updates.totalPages = command.totalPages
      updates.downloadedAt = new Date()
    }

    if (command.isFailed) {
      updates.status = DownloadStatus.Failed
      updates.errorMessage = command.errorMessage ?? undefined
      updates.lastAttemptedAt = new Date()
    }

    this.db
      .update(chapterDownloads)
      .set(updates)
      .where(eq(chapterDownloads.chapterId, command.chapterId))
      .run()
  }

  updateVerificationTimestamp(chapterId: string): void {
    this.db
      .update(chapterDownloads)
      .set({ lastVerifiedAt: new Date() })
      .where(eq(chapterDownloads.chapterId, chapterId))
      .run()
  }
}
export const chapterDownloadsRepo = new ChapterDownloadsRepo()

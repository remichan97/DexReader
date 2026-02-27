import { eq } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { chapter, chapterDownloads, manga } from '../schema'
import { CreateDownloadCommand } from '../commands/chapter-downloads/create-download.command'
import { ChapterDownloadQuery } from '../queries/chapter-downloads/chapter-downloads.query'
import { ChapterDownloadMapper } from '../mappers/chapter-downloads.mapper'
import { MarkDownloadStateCommand } from '../commands/chapter-downloads/mark-state.command'
import { DownloadStatus } from '../enums/download-status.enum'
import { DeleteChapterCommand } from '../commands/chapter-downloads/delete-chapter.command'

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
      .innerJoin(manga, eq(chapterDownloads.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(chapterDownloads.chapterId, chapter.chapterId))
      .where(eq(chapterDownloads.isHidden, false))
      .all()

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
    // If no commands, skip
    if (commands.length === 0) return

    // If one command, use single delete/update for better performance
    if (commands.length === 1) {
      this.deleteDownload(commands[0])
      return
    }

    // For the rest, use a transaction to batch deletes/updates
    this.db.transaction((tx) => {
      // Same logic as single delete, but applied to each command in the batch
      // TODO: Maybe a dedicated method for this duplicated logic would be cleaner, but for now this is fine since it's only used in one place and the logic is pretty straightforward. The same could be said for various different batch operations in this repo
      for (const command of commands) {
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

    this.db
      .update(chapterDownloads)
      .set(updates)
      .where(eq(chapterDownloads.chapterId, command.chapterId))
      .run()
  }

  batchMarkDownloadsState(commands: MarkDownloadStateCommand[]): void {
    // If no commands, skip
    if (commands.length === 0) return

    // If one command, use single update for better performance
    if (commands.length === 1) {
      this.markDownloadState(commands[0])
      return
    }

    // For the rest, use a transaction to batch updates
    this.db.transaction((tx) => {
      for (const command of commands) {
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

        tx.update(chapterDownloads)
          .set(updates)
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
}
export const chapterDownloadsRepo = new ChapterDownloadsRepo()

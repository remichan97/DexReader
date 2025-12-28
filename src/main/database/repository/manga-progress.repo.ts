import { ChapterProgress } from '../queries/chapter-progress.query'
import { databaseConnection } from './../connection'
import { MangaProgressMetadata } from '../queries/manga-progress-metadata.query'
import { and, eq, sql } from 'drizzle-orm'
import { chapter, chapterProgress, manga, mangaProgress, readingStatistics } from '../schema'
import { MangaStatus } from '../../api/enums/manga-status.enum'
import { MangaProgress } from '../queries/manga-progress.query'
import { ReadingStats } from '../queries/reading-stats.query'
import { SaveProgressCommand } from '../commands/save-progress.command'

export class MangaProgressRepository {
  private readonly db = databaseConnection.getDb()

  getProgressByMangaId(mangaId: string): MangaProgress | undefined {
    const manga = this.db
      .select()
      .from(mangaProgress)
      .where(eq(mangaProgress.mangaId, mangaId))
      .get()

    if (!manga) {
      return undefined
    }

    return {
      mangaId: manga.mangaId,
      lastChapterId: manga.lastChapterId,
      firstReadAt: this.dateToUnixTimestamp(manga.firstReadAt),
      lastReadAt: this.dateToUnixTimestamp(manga.lastReadAt)
    }
  }

  deleteProgress(mangaId: string): void {
    this.db.delete(mangaProgress).where(eq(mangaProgress.mangaId, mangaId)).run()
  }

  getProgressWithMetadata(mangaId: string): MangaProgressMetadata | undefined {
    const result = this.db
      .select({
        mangaId: mangaProgress.mangaId,
        lastChapterId: mangaProgress.lastChapterId,
        firstReadAt: mangaProgress.firstReadAt,
        lastReadAt: mangaProgress.lastReadAt,
        title: manga.title,
        coverUrl: manga.coverUrl,
        status: manga.status,
        lastChapterNumber: chapter.chapterNumber,
        lastChapterTitle: chapter.title,
        lastChapterVolume: chapter.volume
      })
      .from(mangaProgress)
      .innerJoin(manga, eq(mangaProgress.mangaId, manga.mangaId))
      .leftJoin(chapter, eq(mangaProgress.lastChapterId, chapter.chapterId))
      .where(eq(mangaProgress.mangaId, mangaId))
      .get()

    if (!result) {
      return undefined
    }

    return {
      mangaId: result.mangaId,
      lastChapterId: result.lastChapterId,
      firstReadAt: this.dateToUnixTimestamp(result.firstReadAt),
      lastReadAt: this.dateToUnixTimestamp(result.lastReadAt),
      title: result.title,
      coverUrl: result.coverUrl ?? undefined,
      status: result.status as MangaStatus,
      lastChapterNumber: result.lastChapterNumber ?? undefined,
      lastChapterTitle: result.lastChapterTitle ?? undefined,
      lastChapterVolume: result.lastChapterVolume ?? undefined
    }
  }

  getAllProgressWithMetadata(): MangaProgressMetadata[] {
    const results = this.db
      .select({
        mangaId: mangaProgress.mangaId,
        lastChapterId: mangaProgress.lastChapterId,
        firstReadAt: mangaProgress.firstReadAt,
        lastReadAt: mangaProgress.lastReadAt,
        title: manga.title,
        coverUrl: manga.coverUrl,
        status: manga.status,
        lastChapterNumber: chapter.chapterNumber,
        lastChapterTitle: chapter.title,
        lastChapterVolume: chapter.volume
      })
      .from(mangaProgress)
      .innerJoin(manga, eq(mangaProgress.mangaId, manga.mangaId))
      .leftJoin(chapter, eq(mangaProgress.lastChapterId, chapter.chapterId))
      .all()

    return results.map((result) => ({
      mangaId: result.mangaId,
      lastChapterId: result.lastChapterId,
      firstReadAt: this.dateToUnixTimestamp(result.firstReadAt),
      lastReadAt: this.dateToUnixTimestamp(result.lastReadAt),
      title: result.title,
      coverUrl: result.coverUrl ?? undefined,
      status: result.status as MangaStatus,
      lastChapterNumber: result.lastChapterNumber ?? undefined,
      lastChapterTitle: result.lastChapterTitle ?? undefined,
      lastChapterVolume: result.lastChapterVolume ?? undefined
    }))
  }

  saveProgress(progress: SaveProgressCommand[]): void {
    const now = new Date()

    for (const item of progress) {
      // Insert/update in transaction to satisfy FK constraints
      this.db.transaction((tx) => {
        // Upsert manga entry (ensure it exists)
        tx.insert(manga)
          .values({
            mangaId: item.mangaId,
            title: 'Unknown', // Will be updated when user visits manga detail
            isRead: true, // Mark as read since user is reading it
            isFavourite: false,
            addedAt: now,
            updatedAt: now,
            lastAccessedAt: now
          })
          .onConflictDoUpdate({
            target: manga.mangaId,
            set: {
              isRead: true, // Ensure read flag is set
              lastAccessedAt: now // Update last access time
            }
          })
          .run()

        // Upsert manga progress entry
        tx.insert(mangaProgress)
          .values({
            mangaId: item.mangaId,
            lastChapterId: item.chapterId,
            firstReadAt: now,
            lastReadAt: now
          })
          .onConflictDoUpdate({
            target: mangaProgress.mangaId,
            set: {
              lastChapterId: item.chapterId,
              lastReadAt: now
            }
          })
          .run()

        tx.insert(chapterProgress)
          .values({
            mangaId: item.mangaId,
            chapterId: item.chapterId,
            currentPage: item.currentPage,
            completed: item.completed,
            lastReadAt: now
          })
          .onConflictDoUpdate({
            target: [chapterProgress.mangaId, chapterProgress.chapterId],
            set: {
              currentPage: item.currentPage,
              completed: item.completed,
              lastReadAt: now
            }
          })
          .run()
      })
    }
  }

  getChapterProgress(mangaId: string, chapterId: string): ChapterProgress | undefined {
    const result = this.db
      .select()
      .from(chapterProgress)
      .where(and(eq(chapterProgress.mangaId, mangaId), eq(chapterProgress.chapterId, chapterId)))
      .get()

    if (!result) {
      return undefined
    }

    return {
      mangaId: result.mangaId,
      chapterId: result.chapterId,
      currentPage: result.currentPage,
      completed: result.completed,
      lastReadAt: this.dateToUnixTimestamp(result.lastReadAt)
    }
  }

  getAllChapterProgress(mangaId: string): ChapterProgress[] {
    const results = this.db
      .select()
      .from(chapterProgress)
      .where(eq(chapterProgress.mangaId, mangaId))
      .all()

    if (results.length === 0) {
      return []
    }

    return results.map((result) => ({
      mangaId: result.mangaId,
      chapterId: result.chapterId,
      currentPage: result.currentPage,
      completed: result.completed,
      lastReadAt: this.dateToUnixTimestamp(result.lastReadAt)
    }))
  }

  getStats(): ReadingStats {
    const cached = this.db.select().from(readingStatistics).where(eq(readingStatistics.id, 1)).get()

    if (cached && Date.now() - this.dateToUnixTimestamp(cached.lastCalculatedAt) < 3600000) {
      return {
        totalMangaRead: cached.totalMangasRead,
        totalChaptersRead: cached.totalChaptersRead,
        totalPagesRead: cached.totalPagesRead,
        totalEstimatedMinutesRead: cached.totalEstimatedMinutes
      }
    }

    // Recalculate stats when needed (usually don't hit this often but sometimes it stales)
    const stats = this.db
      .select({
        totalManga: sql<number>`COUNT(DISTINCT ${mangaProgress.mangaId})`,
        totalChapters: sql<number>`SUM(CASE WHEN ${chapterProgress.completed} THEN 1 ELSE 0 END)`,
        totalPages: sql<number>`COALESCE(SUM(CASE WHEN ${chapterProgress.completed} THEN ${chapterProgress.currentPage} ELSE 0 END), 0)`
      })
      .from(mangaProgress)
      .leftJoin(chapterProgress, eq(mangaProgress.mangaId, chapterProgress.mangaId))
      .get()

    return {
      totalMangaRead: stats?.totalManga || 0,
      totalChaptersRead: stats?.totalChapters || 0,
      totalPagesRead: stats?.totalPages || 0,
      totalEstimatedMinutesRead: (stats?.totalPages || 0) * 2 // Assuming average 2 minutes per page
    }
  }

  private dateToUnixTimestamp(timestamp: Date): number {
    return Math.floor(timestamp.getTime() / 1000)
  }
}

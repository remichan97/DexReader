import { count, eq, sql, sumDistinct } from 'drizzle-orm'
import { databaseConnection } from '../connection'
import { chapterProgress, readingStatistics } from '../schema'
import { ReadingStats } from '../queries/reading-stats/reading-stats.query'

export class ReadingStatisticRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  calculateStatistics(): void {
    const stats = this.db
      .select({
        totalMangaRead: count(sumDistinct(chapterProgress.mangaId)),
        totalChaptersRead: count(sumDistinct(chapterProgress.chapterId)),
        totalPagesRead: sql<number>`SUM(${chapterProgress.currentPage})`
      })
      .from(chapterProgress)
      .where(eq(chapterProgress.completed, true))
      .get()

    const estimatedMinutes = Math.round(((stats?.totalPagesRead || 0) * 20) / 60) // Assuming 20 seconds per page

    this.db
      .update(readingStatistics)
      .set({
        totalMangasRead: stats?.totalMangaRead || 0,
        totalChaptersRead: stats?.totalChaptersRead || 0,
        totalPagesRead: stats?.totalPagesRead || 0,
        totalEstimatedMinutes: estimatedMinutes,
        lastCalculatedAt: new Date()
      })
      .where(eq(readingStatistics.id, 1))
      .run()
  }

  getStats(): ReadingStats {
    const stats = this.db.select().from(readingStatistics).where(eq(readingStatistics.id, 1)).get()

    return {
      totalMangaRead: stats?.totalMangasRead || 0,
      totalChaptersRead: stats?.totalChaptersRead || 0,
      totalPagesRead: stats?.totalPagesRead || 0,
      totalEstimatedMinutesRead: stats?.totalEstimatedMinutes || 0
    }
  }
}
export const readingRepo = new ReadingStatisticRepository()

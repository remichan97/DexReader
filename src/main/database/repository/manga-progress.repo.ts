import { ChapterProgress } from '../entities/chapter-progress.entity'
import { databaseConnection } from './../connection'
import { MangaProgress } from '../entities/manga-progress.entity'
import { MangaProgressMetadata } from '../entities/manga-progress-metadata.entity'
import { ReadingStats } from '../entities/reading-stats.entity'
import { eq } from 'drizzle-orm'
import { chapter, manga, mangaProgress } from '../schema'
import { MangaStatus } from '../../api/enums/manga-status.enum'

export class MangaProgressRepository {
  private readonly db = databaseConnection.getDb()

  async getProgressByMangaId(mangaId: string): Promise<MangaProgress | undefined> {
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

  async deleteProgress(mangaId: string): Promise<void> {
    this.db.delete(mangaProgress).where(eq(mangaProgress.mangaId, mangaId)).run()
  }

  async getProgressWithMetadata(mangaId: string): Promise<MangaProgressMetadata | undefined> {
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

  async getAllProgressWithMetadata(): Promise<MangaProgressMetadata[]> {
    throw new Error('Not implemented yet - Phase 3')
  }

  async saveProgress(progress: MangaProgress[]): Promise<void> {
    for (const item of progress) {
      this.db.transaction(() => {
        this.db
          .insert(mangaProgress)
          .values({
            mangaId: item.mangaId,
            lastChapterId: item.lastChapterId,
            firstReadAt: this.unixTimestampToDate(item.firstReadAt),
            lastReadAt: this.unixTimestampToDate(item.lastReadAt)
          })
          .onConflictDoUpdate({
            target: mangaProgress.mangaId,
            set: {
              lastChapterId: item.lastChapterId,
              firstReadAt: this.unixTimestampToDate(item.firstReadAt),
              lastReadAt: this.unixTimestampToDate(item.lastReadAt)
            }
          })


      })
    }
  }

  async getChapterProgress(
    mangaId: string,
    chapterId: string
  ): Promise<ChapterProgress | undefined> {
    throw new Error('Not implemented yet - Phase 3')
  }

  async getAllChapterProgress(mangaId: string): Promise<ChapterProgress[]> {
    throw new Error('Not implemented yet - Phase 3')
  }

  async getStats(): Promise<ReadingStats> {
    throw new Error('Not implemented yet - Phase 3')
  }

  private dateToUnixTimestamp(timestamp: Date): number {
    return Math.floor(timestamp.getTime() / 1000)
  }

  private unixTimestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000)
  }
}

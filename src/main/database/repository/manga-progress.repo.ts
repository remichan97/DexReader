import { ChapterProgress } from '../queries/progress/chapter-progress.query'
import { databaseConnection } from './../connection'
import { MangaProgressMetadata } from '../queries/progress/manga-progress-metadata.query'
import { and, eq } from 'drizzle-orm'
import { chapter, chapterProgress, manga, mangaProgress } from '../schema'
import { MangaProgress } from '../queries/progress/manga-progress.query'
import { SaveProgressCommand } from '../commands/progress/save-progress.command'
import { MangaMapper } from '../mappers/manga.mapper'
import { dateToUnixTimestamp } from '../utils/helpers.utils'
import { mangaRepository } from './manga.repo'
import { readingRepo } from './reading-stats.repo'

export class MangaProgressRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

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
      firstReadAt: dateToUnixTimestamp(manga.firstReadAt),
      lastReadAt: dateToUnixTimestamp(manga.lastReadAt)
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

    return result ? MangaMapper.toMangaProgressWithMetadata(result) : undefined
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

    return results.map(MangaMapper.toMangaProgressWithMetadata)
  }

  saveProgress(progress: SaveProgressCommand[]): void {
    const now = new Date()

    for (const item of progress) {
      // Insert/update in transaction to satisfy FK constraints
      this.db.transaction((tx) => {
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

        readingRepo.calculateStatistics()
        mangaRepository.cleanupMangaCache()
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
      lastReadAt: dateToUnixTimestamp(result.lastReadAt)
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
      lastReadAt: dateToUnixTimestamp(result.lastReadAt)
    }))
  }
}

export const progressRepo = new MangaProgressRepository()

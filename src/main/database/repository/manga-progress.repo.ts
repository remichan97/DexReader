import { ChapterProgressQuery } from '../queries/progress/chapter-progress.query'
import { databaseConnection } from './../connection'
import { MangaProgressMetadata } from '../queries/progress/manga-progress-metadata.query'
import { and, eq } from 'drizzle-orm'
import { chapter, chapterProgress, manga, mangaProgress } from '../schema'
import { MangaProgressQuery } from '../queries/progress/manga-progress.query'
import { SaveProgressCommand } from '../commands/progress/save-progress.command'
import { MangaMapper } from '../mappers/manga.mapper'
import { dateToUnixTimestamp, unixTimestampToDate } from '../../utils/timestamps.util'
import { mangaRepository } from './manga.repo'
import { readingRepo } from './reading-stats.repo'
import { UpdateFirstReadCommand } from '../commands/progress/update-firstread.command'

export class MangaProgressRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getProgressByMangaId(mangaId: string): MangaProgressQuery | undefined {
    const result = this.db
      .select({
        mangaId: mangaProgress.mangaId,
        lastChapterId: mangaProgress.lastChapterId,
        firstReadAt: mangaProgress.firstReadAt,
        lastReadAt: mangaProgress.lastReadAt,
        currentPage: chapterProgress.currentPage,
        completed: chapterProgress.completed
      })
      .from(mangaProgress)
      .leftJoin(
        chapterProgress,
        and(
          eq(mangaProgress.mangaId, chapterProgress.mangaId),
          eq(mangaProgress.lastChapterId, chapterProgress.chapterId)
        )
      )
      .where(eq(mangaProgress.mangaId, mangaId))
      .get()

    if (!result) {
      return undefined
    }

    return {
      mangaId: result.mangaId,
      lastChapterId: result.lastChapterId,
      firstReadAt: dateToUnixTimestamp(result.firstReadAt),
      lastReadAt: dateToUnixTimestamp(result.lastReadAt),
      currentPage: result.currentPage ?? 0,
      completed: result.completed ?? false
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
        lastChapterVolume: chapter.volume,
        language: chapter.language
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
        lastChapterVolume: chapter.volume,
        language: chapter.language
      })
      .from(mangaProgress)
      .innerJoin(manga, eq(mangaProgress.mangaId, manga.mangaId))
      .leftJoin(chapter, eq(mangaProgress.lastChapterId, chapter.chapterId))
      .all()

    return results.map(MangaMapper.toMangaProgressWithMetadata)
  }

  saveProgress(progress: SaveProgressCommand[]): void {
    // Use a single transaction for all progress items
    this.db.transaction((tx) => {
      for (const item of progress) {
        // Upsert manga progress entry
        tx.insert(mangaProgress)
          .values({
            mangaId: item.mangaId,
            lastChapterId: item.chapterId,
            firstReadAt: item.lastReadAt ? unixTimestampToDate(item.lastReadAt) : new Date(),
            lastReadAt: item.lastReadAt ? unixTimestampToDate(item.lastReadAt) : new Date()
          })
          .onConflictDoUpdate({
            target: mangaProgress.mangaId,
            set: {
              lastChapterId: item.chapterId,
              lastReadAt: item.lastReadAt ? unixTimestampToDate(item.lastReadAt) : new Date()
            }
          })
          .run()

        tx.insert(chapterProgress)
          .values({
            mangaId: item.mangaId,
            chapterId: item.chapterId,
            currentPage: item.currentPage,
            completed: item.completed,
            lastReadAt: item.lastReadAt ? unixTimestampToDate(item.lastReadAt) : new Date()
          })
          .onConflictDoUpdate({
            target: [chapterProgress.mangaId, chapterProgress.chapterId],
            set: {
              currentPage: item.currentPage,
              completed: item.completed,
              lastReadAt: item.lastReadAt ? unixTimestampToDate(item.lastReadAt) : new Date()
            }
          })
          .run()
      }

      // Calculate statistics and cleanup once after all items
      readingRepo.calculateStatistics()
      mangaRepository.cleanupMangaCache()
    })
  }

  // For import operation, preserving firstReadAt timestamp
  updateFirstReadAt(command: UpdateFirstReadCommand[]): void {
    this.db.transaction((tx) => {
      for (const item of command) {
        tx.update(mangaProgress)
          .set({
            firstReadAt: unixTimestampToDate(item.firstReadAt)
          })
          .where(eq(mangaProgress.mangaId, item.mangaId))
          .run()
      }
    })
  }

  getChapterProgress(mangaId: string, chapterId: string): ChapterProgressQuery | undefined {
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

  getAllChapterProgress(mangaId: string): ChapterProgressQuery[] {
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

  getAllChapterProgressForAllManga(): ChapterProgressQuery[] {
    const results = this.db.select().from(chapterProgress).all()

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

  getAllMangaProgress(): MangaProgressQuery[] {
    const results = this.db
      .select({
        mangaId: mangaProgress.mangaId,
        lastChapterId: mangaProgress.lastChapterId,
        firstReadAt: mangaProgress.firstReadAt,
        lastReadAt: mangaProgress.lastReadAt,
        currentPage: chapterProgress.currentPage,
        completed: chapterProgress.completed
      })
      .from(mangaProgress)
      .leftJoin(
        chapterProgress,
        and(
          eq(mangaProgress.mangaId, chapterProgress.mangaId),
          eq(mangaProgress.lastChapterId, chapterProgress.chapterId)
        )
      )
      .all()

    if (results.length === 0) {
      return []
    }

    return results.map((result) => ({
      mangaId: result.mangaId,
      lastChapterId: result.lastChapterId,
      firstReadAt: dateToUnixTimestamp(result.firstReadAt),
      lastReadAt: dateToUnixTimestamp(result.lastReadAt),
      currentPage: result.currentPage ?? 0,
      completed: result.completed ?? false
    }))
  }
}

export const progressRepo = new MangaProgressRepository()

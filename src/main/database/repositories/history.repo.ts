import { GetActiveDatesCommand } from '@shared/commands/repositories/history/get-active-dates.command'
import { HistoryEventMetadataContract } from '@shared/contracts/database/history/history-event-metadata.contract'
import { MangaMapper } from '../mappers/manga.mapper'
import { isDateStamp, isUUID } from '@shared/utils/common-assertion.util'
import { databaseConnection } from '../db-connection'
import { chapter, manga, mangaProgress, readHistory } from '../schemas'
import { between, eq } from 'drizzle-orm'
import { dateToLocalDateString } from '../../utils/timestamps.util'

class HistoryRepo {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  public getActiveDates(command: GetActiveDatesCommand): string[] {
    if (!isDateStamp(command.fromDate) || !isDateStamp(command.toDate)) {
      throw new TypeError('Invalid date format')
    }

    // Select all dates that has reading from the given range
    const resultSet = this.db
      .selectDistinct({
        readDate: readHistory.readDate
      })
      .from(readHistory)
      .where(between(readHistory.readDate, command.fromDate, command.toDate))
      .all()

    return resultSet.map((row) => row.readDate)
  }

  public getEventsByDate(onDate: string): HistoryEventMetadataContract[] {
    if (!isDateStamp(onDate)) {
      throw new TypeError('Invalid date format')
    }

    const resultSet = this.db
      .select({
        id: readHistory.id,
        mangaId: manga.mangaId,
        title: manga.title,
        chapterId: chapter.chapterId,
        coverUrl: manga.coverUrl,
        status: manga.status,
        chapterTitle: chapter.title,
        chapterNumber: chapter.chapterNumber,
        chapterVolume: chapter.volume,
        language: chapter.language
      })
      .from(readHistory)
      .innerJoin(manga, eq(readHistory.mangaId, manga.mangaId))
      .leftJoin(chapter, eq(readHistory.chapterId, chapter.chapterId))
      .where(eq(readHistory.readDate, onDate))
      .all()

    return resultSet.map(MangaMapper.toMangaHistory)
  }

  public logReadEvent(mangaId: string, chapterId: string, readDate: string): boolean {
    if (!isDateStamp(readDate)) {
      throw new TypeError('Invalid date format')
    }

    if (!isUUID(mangaId) || !isUUID(chapterId)) {
      throw new TypeError('Invalid Manga/Chapter ID format')
    }

    const affectedRows = this.db
      .insert(readHistory)
      .values({
        mangaId: mangaId,
        chapterId: chapterId,
        readDate: readDate,
        readAt: new Date()
      })
      .onConflictDoUpdate({
        target: [readHistory.mangaId, readHistory.chapterId, readHistory.readDate],
        set: {
          readAt: new Date()
        }
      })
      .run().changes

    return affectedRows > 0
  }

  public deleteHistoryForManga(mangaId: string): boolean {
    if (!isUUID(mangaId)) {
      throw new TypeError('Invalid Manga ID format')
    }

    const affectedRows = this.db
      .delete(readHistory)
      .where(eq(readHistory.mangaId, mangaId))
      .run().changes

    return affectedRows > 0
  }

  //One-time migration of history data from manga-progress
  public migrateHistoryFromMangaProgress(): boolean {
    // If readHistory already have something, skip this
    const existingRecords = this.db.select({ id: readHistory.id }).from(readHistory).limit(1).all()

    if (existingRecords.length > 0) {
      return false
    }

    const progressRows = this.db
      .select({
        mangaId: mangaProgress.mangaId,
        chapterId: mangaProgress.lastChapterId,
        lastReadAt: mangaProgress.lastReadAt
      })
      .from(mangaProgress)
      .all()

    if (progressRows.length === 0) {
      return false
    }

    const affectedRows = this.db
      .insert(readHistory)
      .values(
        progressRows.map((p) => ({
          mangaId: p.mangaId,
          chapterId: p.chapterId,
          readDate: dateToLocalDateString(p.lastReadAt),
          readAt: p.lastReadAt
        }))
      )
      .onConflictDoNothing()
      .run().changes
    return affectedRows > 0
  }
}
export const historyRepo = new HistoryRepo()

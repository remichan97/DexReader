import { eq, desc, max } from 'drizzle-orm'
import { GetReadHistoryCommand } from '../commands/history/get-history-options.command'
import { RecordReadCommand } from '../commands/history/record-read.command'
import { databaseConnection } from '../connection'
import { ReadHistoryQuery } from '../queries/history/reading-history.query'
import { chapter, manga, readHistory } from '../schema'
import { ReadHistoryMapper } from '../mappers/history.mapper'

export class ReadHistoryRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  recordRead(command: RecordReadCommand): void {
    const now = new Date()

    this.db
      .insert(readHistory)
      .values({
        mangaId: command.mangaId,
        chapterId: command.chapterId,
        readAt: now
      })
      .run()
  }

  // For History View: Return every read history entry, ordered by most recent
  getHistory(command?: GetReadHistoryCommand): ReadHistoryQuery[] {
    const query = this.db
      .select()
      .from(readHistory)
      .innerJoin(manga, eq(readHistory.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(readHistory.chapterId, chapter.chapterId))
      .orderBy(desc(readHistory.readAt))
    if (command?.limit) {
      query.limit(command.limit)
    }

    if (command?.offset) {
      query.offset(command.offset)
    }
    const results = query.all()

    return results.map(ReadHistoryMapper.toReadHistoryQuery)
  }

  //For Library View: Return unique/grouped read history by mangaId, ordered by most recent
  getRecentlyRead(limit?: number): ReadHistoryQuery[] {
    const subquery = this.db
      .select({
        mangaId: readHistory.mangaId,
        maxReadAt: max(readHistory.readAt)
      })
      .from(readHistory)
      .groupBy(readHistory.mangaId)
      .orderBy(desc(max(readHistory.readAt)))
    if (limit) {
      subquery.limit(limit)
    }

    const results = this.db
      .select()
      .from(subquery.as('recent_reads'))
      .innerJoin(readHistory, eq(readHistory.mangaId, subquery.as('recent_reads').mangaId))
      .innerJoin(manga, eq(readHistory.mangaId, manga.mangaId))
      .innerJoin(chapter, eq(readHistory.chapterId, chapter.chapterId))
      .where(eq(readHistory.readAt, subquery.as('recent_reads').maxReadAt))
      .orderBy(desc(subquery.as('recent_reads').maxReadAt))
      .all()

    return results.map(ReadHistoryMapper.toReadHistoryQuery)
  }

  // Clear all read history, ONLY when explicitly asked via a `Clear History` button on UI
  clearAllHistory(): number {
    const deleteResult = this.db.delete(readHistory).run()

    return deleteResult.changes
  }
}
export const readHistoryRepo = new ReadHistoryRepository()

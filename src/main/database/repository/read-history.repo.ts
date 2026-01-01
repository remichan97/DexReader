import { eq, desc } from 'drizzle-orm';
import { GetReadHistoryCommand } from '../commands/history/get-history-options.command'
import { RecordReadCommand } from '../commands/history/record-read.command'
import { databaseConnection } from '../connection'
import { ReadHistoryQuery } from '../queries/history/reading-history.query'
import { chapter, manga } from '../schema'
import { readHistory } from '../schema/read-history.schema'
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

}

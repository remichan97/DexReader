import { ReadHistoryQuery } from '../queries/history/reading-history.query'
import { readHistory } from '../schema/read-history.schema'
import { manga } from '../schema/manga.schema'
import { chapter } from '../schema/chapter.schema'

type ReadHistoryRow = typeof readHistory.$inferSelect
type MangaRow = typeof manga.$inferSelect
type ChapterRow = typeof chapter.$inferSelect

type ReadHistoryJoinResult = {
  read_history: ReadHistoryRow
  manga: MangaRow
  chapter: ChapterRow
}

export class ReadHistoryMapper {
  /**
   * Maps a joined query result (read_history + manga + chapter) to ReadHistoryQuery
   */
  static toReadHistoryQuery(row: ReadHistoryJoinResult): ReadHistoryQuery {
    return {
      mangaId: row.read_history.mangaId,
      chapterId: row.read_history.chapterId,
      readAt: row.read_history.readAt,
      mangaTitle: row.manga.title,
      coverId: row.manga.coverUrl ?? undefined,
      status: row.manga.status!
    }
  }
}

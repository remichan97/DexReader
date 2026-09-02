import { ReadHistoryContract } from '@shared/contracts/database/history/reading-history.query'
import { PublicationStatus } from '@shared/enums/mangadex'
import { readHistory } from '../schemas/read-history.schema'
import { manga } from '../schemas/manga.schema'
import { chapter } from '../schemas/chapter.schema'

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
   * Maps a joined query result (read_history + manga + chapter) to ReadHistoryContract
   */
  static toReadHistoryQuery(row: ReadHistoryJoinResult): ReadHistoryContract {
    return {
      mangaId: row.read_history.mangaId,
      chapterId: row.read_history.chapterId,
      readAt: row.read_history.readAt,
      mangaTitle: row.manga.title,
      coverId: row.manga.coverUrl ?? undefined,
      status: row.manga.status as PublicationStatus
    }
  }
}

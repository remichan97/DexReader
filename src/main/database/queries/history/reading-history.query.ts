import { MangaStatus } from '../../../api/enums/manga-status.enum'

export interface ReadHistoryQuery {
  mangaId: string
  chapterId: string
  readAt: Date
  mangaTitle: string
  coverId?: string
  status: MangaStatus
}

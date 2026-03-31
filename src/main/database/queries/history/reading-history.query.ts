import { PublicationStatus } from '../../../api/enums/publication-status.enum'

export interface ReadHistoryQuery {
  mangaId: string
  chapterId: string
  readAt: Date
  mangaTitle: string
  coverId?: string
  status: PublicationStatus
}

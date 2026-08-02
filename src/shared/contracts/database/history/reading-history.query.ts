import { PublicationStatus } from '@shared/enums/mangadex'

export interface ReadHistoryContract {
  mangaId: string
  chapterId: string
  readAt: Date
  mangaTitle: string
  coverId?: string
  status: PublicationStatus
}

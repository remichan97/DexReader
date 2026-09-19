import { PublicationStatus } from '@shared/enums/mangadex'

export interface HistoryEventMetadataContract {
  id: number
  title: string
  mangaId: string
  chapterId?: string
  coverUrl?: string
  status: PublicationStatus
  chapterNumber?: string
  chapterTitle?: string
  chapterVolume?: string
  language?: string
}

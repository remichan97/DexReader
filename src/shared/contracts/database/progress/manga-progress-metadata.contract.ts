import { PublicationStatus } from '@shared/enums/mangadex'

export interface MangaProgressMetadataContract {
  mangaId: string
  lastChapterId: string
  firstReadAt: number
  lastReadAt: number

  // Joined properties from manga entity
  title: string
  coverUrl?: string
  status: PublicationStatus

  // Joined properties from chapter entity
  lastChapterNumber?: string
  lastChapterTitle?: string
  lastChapterVolume?: string
  language?: string
}

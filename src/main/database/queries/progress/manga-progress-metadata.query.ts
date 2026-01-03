import { PublicationStatus } from '../../../api/enums'

export interface MangaProgressMetadata {
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
}

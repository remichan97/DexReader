import { MangaStatus } from '../../../api/enums/manga-status.enum'

export interface MangaProgressMetadata {
  mangaId: string
  lastChapterId: string
  firstReadAt: number
  lastReadAt: number

  // Joined properties from manga entity
  title: string
  coverUrl?: string
  status: MangaStatus

  // Joined properties from chapter entity
  lastChapterNumber?: string
  lastChapterTitle?: string
  lastChapterVolume?: string
}

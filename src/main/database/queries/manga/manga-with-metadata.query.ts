import { MangaStatus } from '../../../api/enums/manga-status.enum'

export interface MangaWithMetadata {
  mangaId: string
  title: string
  description?: string
  coverUrl?: string
  status: MangaStatus
  authors: string[]
  artists: string[]
  year?: number
  tags: string[]
  externalLinks?: Record<string, string>
  lastVolume?: string
  lastChapter?: string
}

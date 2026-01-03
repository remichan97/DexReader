import { PublicationStatus } from '../../../api/enums'

export interface MangaWithMetadata {
  mangaId: string
  title: string
  description?: string
  coverUrl?: string
  status: PublicationStatus
  authors: string[]
  artists: string[]
  year?: number
  tags: string[]
  externalLinks?: Record<string, string>
  updatedAt: Date // Last updated timestamp from MangaDex
  lastVolume?: string
  lastChapter?: string
  hasNewChapters: boolean
  lastCheckForUpdate: Date
  lastKnownChapterId?: string
  lastKnownChapterNumber?: string
}

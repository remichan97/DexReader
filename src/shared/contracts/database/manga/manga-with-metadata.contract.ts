import { PublicationStatus } from '@shared/enums/mangadex'

export interface MangaWithMetadataContract {
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
  isFavourite?: boolean // Whether user has favorited this manga
  hasDownloads?: boolean // Whether this manga has any downloaded chapters
  downloadedChapterCount?: number // Number of completed chapter downloads
}

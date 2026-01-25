import { PublicationStatus } from '../../../api/enums'

// Command object to insert data into the manga table for caching purposes
export interface UpsertMangaCommand {
  mangaId: string
  title: string
  description?: string
  coverUrl: string
  status: PublicationStatus
  authors: string[]
  artists: string[]
  year?: number
  tags: string[]
  externalLinks?: Record<string, string>
  lastVolume?: string
  lastChapter?: string
  lastKnownChapterId?: string // Since on first upsert we already have this info, might as well upsert it
  lastKnownChapterNumber?: string // Same as above
  lastCheckForUpdates?: Date // On first upsert, this will most likely be the time of upsertion, use to deffer update checks if has been checked recently
  isFavourite?: boolean // Use when importing from backup, default to false
}

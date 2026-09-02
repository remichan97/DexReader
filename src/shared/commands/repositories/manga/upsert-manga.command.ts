import { PublicationStatus } from '../../../enums/mangadex'

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
  isFavourite?: boolean // Use when importing from backup, default to false
}

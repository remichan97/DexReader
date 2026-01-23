export interface Chapter {
  // Core identifiers
  chapterId: string // UUID from MangaDex API
  mangaId: string // Parent manga UUID

  // Metadata
  title?: string // Chapter title (can be null)
  chapterNumber?: string // Chapter number (can be null)
  volume?: string // Volume number (can be null)
  language: string // Language code (e.g., "en", "ja")

  // Timestamps (Unix milliseconds)
  publishAt: number // When chapter was published
  createdAt: number // When cached in database
  updatedAt: number // When last updated in database

  // Additional info
  scanlationGroup?: string // Scanlation group name (can be null)
  externalUrl?: string // External URL (can be null)
}

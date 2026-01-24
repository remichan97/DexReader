export interface Manga {
  // Core identifiers
  mangaId: string // UUID from MangaDex API
  title: string // Main title

  // Metadata
  description?: string // Full description (can be null)
  status: string // "ongoing", "completed", "hiatus", "cancelled"
  coverUrl?: string // URL to cover image (can be null)
  year?: number // Year of publication (0 vs not set)

  // User flags
  isFavourite: boolean // Whether marked as favorite

  // Timestamps (Unix milliseconds)
  addedAt: number // When manga was added to database
  updatedAt: number // When manga was last updated
  lastAccessedAt: number // When manga was last accessed

  // JSON-serialized fields
  externalLinks: Record<string, string> // External links (e.g., {"al": "30416", "ap": "sidooh"})
  tags: string[] // Tags/genres (array of UUIDs or names)
  authors: string[] // Authors
  artists: string[] // Artists
  alternativeTitles: Record<string, string> // Alternative titles by language

  // Publication info (for display only, not for progress tracking)
  lastVolume?: string // Last known volume (can be null)
  lastChapter?: string // Last known chapter (can be null)

  // Update tracking (optional, for library UI indicators)
  lastKnownChapterId?: string // Last chapter ID we got from API
  lastKnownChapterNumber?: string // Latest chapter number we know of
  lastCheckForUpdates?: number // When we last checked for updates (0 vs not set)
  hasNewChapters: boolean // Whether to show "new" indicator
}

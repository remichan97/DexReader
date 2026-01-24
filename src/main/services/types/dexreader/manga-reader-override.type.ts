import { DoublePageMode } from './double-page-mode.type'

export interface MangaReaderOverride {
  mangaId: string // Manga UUID

  // Reader settings (matches MangaReadingSettings entity)
  readingMode: string // "single-page", "double-page", "vertical-scroll"

  // Double-page specific settings (optional, only present for double-page mode)
  doublePageMode?: DoublePageMode

  // Timestamps
  createdAt: number // Unix timestamp (milliseconds)
  updatedAt: number // Unix timestamp (milliseconds)
}

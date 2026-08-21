/**
 * Manga Helper Utilities
 *
 * Formatting helpers for displaying MangaContract data in the UI.
 * Field extraction (cover URL, authors/artists, tags) now happens in the main
 * process mapper - these helpers only resolve locale-dependent display strings
 * and map API enums to UI-facing values.
 */

import { PublicationStatus } from '@shared/enums/mangadex'
import type { MangaStatus } from '@renderer/types/components'
import type { MangaContract } from '../../../preload/window.types'

/**
 * Get manga title in preferred language
 * Falls back to English, then any available language
 */
export function getMangaTitle(manga: MangaContract): string {
  const titleObj = manga.title

  if (!titleObj || typeof titleObj !== 'object') {
    return 'Untitled'
  }

  if (titleObj.en) {
    return titleObj.en
  }

  const titles = Object.values(titleObj)
  return titles[0] || 'Untitled'
}

/**
 * Map API publication status to UI status
 */
export function mapPublicationStatus(apiStatus: PublicationStatus): MangaStatus {
  switch (apiStatus) {
    case PublicationStatus.Ongoing:
      return 'ongoing'
    case PublicationStatus.Completed:
      return 'completed'
    case PublicationStatus.Hiatus:
      return 'hiatus'
    case PublicationStatus.Cancelled:
      return 'completed' // Show cancelled as completed
    default:
      return 'ongoing'
  }
}

/**
 * Format chapter count display
 * Returns formatted string like "50 / 100" or "50" if total unknown
 */
export function formatChapterCount(read: number | undefined, total: number | undefined): string {
  if (read === undefined && total === undefined) {
    return '—'
  }

  if (total === undefined || total === 0) {
    return read === undefined ? '—' : `${read}`
  }

  return read === undefined ? `— / ${total}` : `${read} / ${total}`
}

/**
 * Get manga description in preferred language
 * Falls back to English, romaji, then first available
 */
export function getMangaDescription(manga: MangaContract): string {
  const descObj = manga.description

  if (!descObj || typeof descObj !== 'object') {
    return 'No description available.'
  }

  if (descObj.en) {
    return descObj.en
  }

  if (descObj['ja-ro']) {
    return descObj['ja-ro']
  }

  const descriptions = Object.values(descObj)
  return descriptions[0] || 'No description available.'
}

/**
 * Get content rating display text
 */
export function getContentRatingText(rating: string): string {
  const map: Record<string, string> = {
    safe: 'Safe',
    suggestive: 'Suggestive',
    erotica: 'Erotica',
    pornographic: '18+'
  }
  return map[rating?.toLowerCase()] || 'Unknown'
}

/**
 * Manga Helper Utilities
 *
 * Helper functions for extracting and formatting manga data from API entities.
 * Handles cover images, author/artist extraction, and status mapping.
 */

import { PublicationStatus } from '@renderer/stores/searchStore'

// Type extracted from global Window interface
type MangaEntity = Window['mangadex'] extends {
  searchManga: (...args: unknown[]) => Promise<infer R>
}
  ? R extends { data: (infer T)[] }
    ? T
    : never
  : never

/**
 * Cover image sizes available from MangaDex
 * Must match the backend CoverSize enum values
 */
export enum CoverSize {
  Medium = 256,
  Large = 512
}

/**
 * Manga status for UI display
 */
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled'

/**
 * Extract cover image URL from manga entity
 * Returns proxy protocol URL for renderer to use
 */
export function getCoverImageUrl(manga: MangaEntity, size: CoverSize = CoverSize.Medium): string {
  try {
    // Find cover_art relationship
    const coverRel = manga.relationships?.find((r) => r.type === 'cover_art')

    if (!coverRel?.attributes || !('fileName' in coverRel.attributes)) {
      return '/placeholder-cover.jpg' // Fallback to placeholder
    }

    const fileName = (coverRel.attributes as { fileName?: string }).fileName
    if (!fileName) {
      return '/placeholder-cover.jpg'
    }

    // Build cover URL directly (no need for IPC call since it's just a URL builder)
    // Format: https://uploads.mangadex.org/cover/{mangaId}/{fileName}{size}.jpg
    const coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.${size}.jpg`

    // Convert to proxy protocol for renderer
    return coverUrl.replace('https://', 'mangadex://')
  } catch (error) {
    console.error('Error extracting cover URL:', error)
    return '/placeholder-cover.jpg'
  }
}

/**
 * Extract author name from manga entity
 */
export function getAuthorName(manga: MangaEntity): string {
  try {
    const author = manga.relationships?.find((r) => r.type === 'author')

    if (!author?.attributes || !('name' in author.attributes)) {
      return 'Unknown'
    }

    return (author.attributes as { name?: string }).name || 'Unknown'
  } catch (error) {
    console.error('Error extracting author name:', error)
    return 'Unknown'
  }
}

/**
 * Extract artist name from manga entity
 */
export function getArtistName(manga: MangaEntity): string {
  try {
    const artist = manga.relationships?.find((r) => r.type === 'artist')

    if (!artist?.attributes || !('name' in artist.attributes)) {
      return 'Unknown'
    }

    return (artist.attributes as { name?: string }).name || 'Unknown'
  } catch (error) {
    console.error('Error extracting artist name:', error)
    return 'Unknown'
  }
}

/**
 * Get manga title in preferred language
 * Falls back to English, then any available language
 */
export function getMangaTitle(manga: MangaEntity): string {
  try {
    const titleObj = (manga.attributes as { title?: Record<string, string> }).title

    if (!titleObj || typeof titleObj !== 'object') {
      return 'Untitled'
    }

    // Try English first
    if (titleObj.en) {
      return titleObj.en
    }

    // Fall back to first available title
    const titles = Object.values(titleObj)
    return titles[0] || 'Untitled'
  } catch (error) {
    console.error('Error extracting manga title:', error)
    return 'Untitled'
  }
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
 * Extract available translation languages from manga entity
 * Returns array of language codes (e.g., ['en', 'ja', 'es'])
 */
export function getAvailableLanguages(manga: MangaEntity): string[] {
  try {
    const attrs = manga.attributes as { availableTranslatedLanguages?: string[] }
    return attrs.availableTranslatedLanguages || []
  } catch (error) {
    console.error('Error extracting available languages:', error)
    return []
  }
}

/**
 * Get manga description in preferred language
 * Falls back to English, romaji, then first available
 */
export function getMangaDescription(manga: MangaEntity): string {
  try {
    const descObj = (manga.attributes as { description?: Record<string, string> }).description

    if (!descObj || typeof descObj !== 'object') {
      return 'No description available.'
    }

    // Try English first
    if (descObj.en) {
      return descObj.en
    }

    // Try romaji
    if (descObj['ja-ro']) {
      return descObj['ja-ro']
    }

    // Fall back to first available
    const descriptions = Object.values(descObj)
    return descriptions[0] || 'No description available.'
  } catch (error) {
    console.error('Error extracting manga description:', error)
    return 'No description available.'
  }
}

/**
 * Get manga publication year
 */
export function getMangaYear(manga: MangaEntity): number | null {
  try {
    const year = (manga.attributes as { year?: number | null }).year
    return year ?? null
  } catch (error) {
    console.error('Error extracting manga year:', error)
    return null
  }
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

/**
 * Extract tags from manga relationships
 */
export function getMangaTags(manga: MangaEntity): Array<{ id: string; name: string }> {
  try {
    return (
      manga.relationships
        ?.filter((r) => r.type === 'tag')
        .map((r) => ({
          id: r.id,
          name: (r.attributes as { name?: { en?: string } })?.name?.en || 'Unknown'
        })) || []
    )
  } catch (error) {
    console.error('Error extracting manga tags:', error)
    return []
  }
}

/**
 * Get all available titles for manga (internationalization)
 */
export function getAllTitles(manga: MangaEntity): Record<string, string> {
  try {
    const titleObj = (manga.attributes as { title?: Record<string, string> }).title
    return titleObj || {}
  } catch (error) {
    console.error('Error extracting all titles:', error)
    return {}
  }
}

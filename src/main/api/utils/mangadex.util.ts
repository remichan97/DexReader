import { LocalizedString } from '@shared/types/strings/localised-string.type'
import { Manga } from '../entities/manga.entity'
import { CoverSize } from '../enums'
import { Chapter } from '../entities/chapter.entity'
import { TagContract } from '@shared/contracts/mangadex/tag.contract'
import { CreatorContract } from '@shared/contracts/mangadex/creator.contract'
import { RelationshipType } from '@shared/enums/mangadex/relationship-type.enum'

// Extract all artists from manga entity
export function getMangaCreator(
  manga: Manga,
  creatorType: RelationshipType.ARTIST | RelationshipType.AUTHOR
): CreatorContract[] {
  const creator = manga.relationships?.filter((r) => r.type === creatorType)
  // Collect all artists into a record with their ID as the key and name as the value
  const creatorList: CreatorContract[] = []
  creator?.forEach((a) => {
    creatorList.push({
      id: a.id,
      name: (a.attributes?.name as string) || 'Unknown'
    })
  })
  return creatorList
}

// Process manga title to return a string representation of the title.
// If the title is a localized string, it will return the English title if available, otherwise it will return the first available title in any language. If the title is not a localized string, it will return the title as is.
export function getMangaTitle(manga: Manga): LocalizedString {
  const title = manga.attributes.title

  if (!title || typeof title !== 'object') {
    return { en: 'Untitled' }
  }

  // Try English first
  if (title.en) {
    return { en: title.en }
  }

  // If no English title, return the first available title in any language
  const firstAvailableTitle = Object.values(title).find((t) => typeof t === 'string')
  if (firstAvailableTitle) {
    return { en: firstAvailableTitle as string }
  }

  // If no title is available, return 'Untitled'
  return { en: 'Untitled' }
}

// Collect all titles from the manga entity. Used as alternate titles in the MangaContract. Returns an array of localized strings.
export function getMangaAltTitles(manga: Manga): LocalizedString[] {
  const altTitles = manga.attributes.altTitles
  if (Array.isArray(altTitles)) {
    return altTitles.map((title) => title)
  }
  return []
}

// Get manga description if present from the manga entity
export function getMangaDescription(manga: Manga): LocalizedString {
  const description = manga.attributes.description
  if (description && typeof description === 'object') {
    return description
  }
  return {}
}

// Collect all tags from manga entity. Returns a record of tag IDs and their corresponding names. If no tags are present, returns an empty record.
export function getMangaTags(manga: Manga): TagContract[] {
  const tags = manga.attributes.tags
  const contract: TagContract[] = []
  if (Array.isArray(tags)) {
    tags.forEach((t) => {
      contract.push({
        id: t.id,
        name: t.attributes.name.en || 'Unknown',
        group: t.attributes.group
      })
    })
  }
  return contract
}

// Collect all links from manga entity. Links in this context are external links to the work (e.g. official website, Twitter, etc.)
export function getMangaLinks(manga: Manga): Record<string, string> {
  const links = manga.attributes.links
  if (links && typeof links === 'object') {
    return links
  }
  return {}
}

// Collect all available translated languages from manga entity. Returns an array of language codes (e.g., ['en', 'ja', 'es'])
export function getMangaAvailableTranslatedLanguages(manga: Manga): string[] {
  return manga.attributes.availableTranslatedLanguages || []
}

// Build a proxy URL of the original cover URL from the manga entity for displaying on the renderer. Since the original cover URL is not directly accessible, we construct a proxy URL using the manga ID and the cover file name.
export function getMangaCoverUrl(
  manga: Manga,
  size: CoverSize = CoverSize.Medium
): string | undefined {
  const coverRel = manga.relationships.find((r) => r.type === 'cover_art')

  // If nothing found, returns a placeholder:
  if (!coverRel?.attributes?.fileName && typeof coverRel?.attributes?.fileName !== 'string') {
    return undefined
  }

  // Construct the proxy URL using the manga ID and the cover file name
  // Original format: https://uploads.mangadex.org/cover/{mangaId}/{fileName}{size}.jpg
  const coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.${size}.jpg`

  // Convert to proxy protocol for renderer
  return coverUrl.replace('https://', 'mangadex://')
}

// Collect scanlation group infomation from a chapter entity. Returns a record of scanlation group ID and their corresponding name. If no scanlation groups are present, returns an empty record.
export function getChapterScanlationGroups(chapter: Chapter): Record<string, string> {
  const scanlationGroups = chapter.relationships.find((r) => r.type === 'scanlation_group')
  if (scanlationGroups?.attributes && 'name' in scanlationGroups.attributes) {
    return {
      [scanlationGroups.id]: (scanlationGroups.attributes as { name?: string }).name || 'Unknown'
    }
  }
  return {}
}

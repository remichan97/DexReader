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

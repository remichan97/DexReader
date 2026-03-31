import { ContentRating } from '../enums/content-rating.enum'
import { PublicationDemographic } from '../enums/demographic.enum'
import { PublicationStatus } from '../enums/publication-status.enum'
import { MangaEntityType } from '../enums/manga-entity-type.enum'
import { LocalizedString } from '../shared/common-types.shared'
import { Tag } from './tag-entity'
import { Relationship } from './relationship.entity'

/**
 * Manga entity representation
 */

export interface Manga {
  id: string
  type: MangaEntityType.Manga
  attributes: {
    title: LocalizedString
    altTitles: LocalizedString[]
    description: LocalizedString
    isLocked: boolean
    links: Record<string, string>
    originalLanguage: string
    lastVolume: string | null
    lastChapter: string | null
    publicationDemographic: PublicationDemographic | null
    status: PublicationStatus
    year: number | null
    contentRating: ContentRating
    tags: Tag[]
    state: string
    chapterNumbersResetOnNewVolume: boolean
    createdAt: string
    updatedAt: string
    version: number
    availableTranslatedLanguages: string[]
    latestUploadedChapter: string | null
  }
  relationships: Relationship[]
}

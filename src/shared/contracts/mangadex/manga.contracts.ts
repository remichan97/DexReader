import {
  ContentRating,
  PublicationDemographic,
  PublicationStatus,
  MangaEntityType
} from '../../enums/mangadex'
import { LocalizedString } from './common.contracts'
import { Tag } from './tag.contracts'
import { Relationship } from './relationship.contracts'

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

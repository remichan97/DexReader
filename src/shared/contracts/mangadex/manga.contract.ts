import { ContentRating, PublicationDemographic, PublicationStatus } from '@shared/enums/mangadex'
import { LocalizedString } from '@shared/types/strings/localised-string.type'
import { TagContract } from './tag.contract'
import { CreatorContract } from './creator.contract'

export interface MangaContract {
  id: string
  title: LocalizedString
  altTitles: LocalizedString[]
  description: LocalizedString
  links: Record<string, string> // External links to the work (e.g. official website, Twitter, etc.)
  lastVolume?: string // If applicable, the last volume number of the work.
  lastChapter?: string // If applicable, the last chapter number of the work.
  publicationDemographic?: PublicationDemographic
  status: PublicationStatus
  year?: number // The year the manga was first published. This is an optional field and may not be available for all manga.
  contentRating: ContentRating
  tags: TagContract[] // Key: tag ID, Value: tag name. A record of all tags associated with the manga.
  availableTranslatedLanguages: string[] // A list of language codes representing the languages in which the manga is available. An empty array usually means no translations are available, but it could also mean that the manga is only available in its original language.
  coverUrl?: string // Medium-resolution cover, used for cards/grids/thumbnails.
  coverUrlLarge?: string // Large-resolution cover, used for hero/detail displays.
  authors: CreatorContract[]
  artists: CreatorContract[]
}

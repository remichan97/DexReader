import { TagGroup } from '../enums/tag-group.enum'
import { MangaEntityType } from '../enums/manga-entity-type.enum'
import { LocalizedString } from '@shared/types/strings/localised-string.type'

export interface Tag {
  id: string
  type: MangaEntityType.Tag
  attributes: {
    name: LocalizedString
    description: LocalizedString
    group: TagGroup
    version: number
  }
}

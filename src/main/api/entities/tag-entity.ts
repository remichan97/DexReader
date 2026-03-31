import { LocalizedString } from '../shared/common-types.shared'
import { TagGroup } from '../enums/tag-group.enum'
import { MangaEntityType } from '../enums/manga-entity-type.enum'

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

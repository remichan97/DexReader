import { LocalizedString } from './common.contracts'
import { TagGroup, MangaEntityType } from '../../enums/mangadex'

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

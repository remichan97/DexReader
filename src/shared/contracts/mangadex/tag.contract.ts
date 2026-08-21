import { TagGroup } from '@shared/enums/mangadex'

export interface TagContract {
  id: string
  name: string
  group: TagGroup
}

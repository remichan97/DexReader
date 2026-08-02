import { CollectionContract } from './collection.contract'

export interface CollectionMetadataContract extends CollectionContract {
  mangaCount: number
  coverUrl?: string
}

import { MangaEntityType } from '../enums'
import { Relationship } from './relationship.entity'

export interface Chapter {
  id: string
  type: MangaEntityType.Chapter
  attributes: {
    title: string | null
    volume: string | null
    chapter: string | null
    pages: number
    translatedLanguage: string
    uploader: string
    externalUrl: string | null
    version: number
    createdAt: string
    updatedAt: string
    publishedAt: string
    readableAt: string
  }
  relationships: Relationship[]
}

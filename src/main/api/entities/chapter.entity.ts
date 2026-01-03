import { MangaEntityType } from '../enums'
import { Relationship } from './relationship.entity'

export interface Chapter {
  id: string
  type: MangaEntityType.Chapter
  attributes: {
    title?: string
    volume?: string
    chapter?: string
    pages: number
    translatedLanguage: string
    uploader: string
    externalUrl?: string
    version: number
    createdAt: string
    updatedAt: string
    publishedAt: string
    readableAt: string
  }
  relationships: Relationship[]
}

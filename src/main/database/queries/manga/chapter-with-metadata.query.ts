export interface ChapterWithMetadata {
  chapterId: string
  mangaId: string
  title?: string
  chapterNumber?: string
  volume?: string
  language: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
  scanlatorGroup?: string
  externalUrl?: string
}

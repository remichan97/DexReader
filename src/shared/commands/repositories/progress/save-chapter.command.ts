export interface SaveChapterCommand {
  chapterId: string
  mangaId: string
  title?: string
  chapterNumber?: string
  volume?: string
  language: string
  publishAt: Date
  scanlationGroup?: string
  externalUrl?: string
}

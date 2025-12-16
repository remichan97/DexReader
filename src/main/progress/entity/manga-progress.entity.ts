export interface MangaProgress {
  mangaId: string
  mangaTitle: string

  lastChapterId: string
  lastChapterNumber: number | undefined
  lastChapterTitle: string
  lastPage: number
  totalChapterPages: number

  firstReadAt: number //unix timestamp
  lastReadAt: number //unix timestamp

  chaptersRead: string[]
  totalPagesRead: number
  estimatedMinutesRead: number
}

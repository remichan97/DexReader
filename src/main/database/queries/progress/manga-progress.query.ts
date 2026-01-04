export interface MangaProgress {
  mangaId: string
  lastChapterId: string
  firstReadAt: number //unix timestamp
  lastReadAt: number //unix timestamp
  currentPage: number
  completed: boolean
}

export interface ChapterProgressContract {
  id?: number // Optional, as it may be auto-generated
  mangaId: string
  chapterId: string
  currentPage: number
  lastReadAt: number
  completed: boolean
}

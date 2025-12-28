export interface ChapterProgress {
  id?: number // Optional, as it may be auto-generated
  mangaId: string
  chapterId: string
  currentPage: number
  totalPages: number
  lastReadAt: number
  completed: boolean
}

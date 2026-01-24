export interface ChapterProgressData {
  mangaId: string // Manga UUID
  chapterId: string // Chapter UUID
  currentPage: number // Current page (0-based index)
  completed: boolean // Whether chapter is completed
  lastReadAt: number // Unix timestamp (milliseconds)
}

export interface UpdateResult {
  mangaId: string
  hasNewChapters: boolean
  latestChapter?: {
    chapterId: string
    number?: string
    title?: string
  }
  error?: string
}

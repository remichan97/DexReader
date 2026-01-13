export interface SaveProgressCommand {
  mangaId: string
  chapterId: string
  currentPage: number
  completed: boolean
  lastReadAt?: number
}

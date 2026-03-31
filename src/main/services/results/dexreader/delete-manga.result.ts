export interface DeleteMangaResult {
  success: boolean
  successfulCount: number
  failedCount: number
  failedChapters: string[] // List of chapterIds that failed to delete
}

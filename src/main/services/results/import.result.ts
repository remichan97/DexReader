export interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: string[]
  importedMangaIds?: string[]
}

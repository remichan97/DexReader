export interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: {
    mangaId: string
    title: string
    reason: string
  }[]
  importedMangaIds?: string[]
}

import { ImportErrorResult } from './import-error.result'

export interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: ImportErrorResult[]
  importedMangaIds?: string[]
}

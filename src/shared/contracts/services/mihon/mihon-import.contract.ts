import { MihonImportErrorContract } from './mihon-import-error.contract'
import { MihonSkippedMangaContract } from './mihon-skipped-manga.contract'

export interface MihonImportContract {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: MihonImportErrorContract[]
  importedMangaIds?: string[]
  /** MangaDex entries from sources in other languages, left out and offered to the user */
  skippedOtherLanguage?: MihonSkippedMangaContract[]
  /** Library entries from other (non-MangaDex) sources, which DexReader cannot import */
  ignoredOtherSourceCount?: number
}

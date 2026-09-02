import { MihonImportErrorContract } from './mihon-import-error.contract'

export interface MihonImportContract {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: MihonImportErrorContract[]
  importedMangaIds?: string[]
}

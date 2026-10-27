/**
 * Optional second pass over a backup that was already imported once: bring in the MangaDex
 * entries from other-language sources that the first pass listed as skipped.
 */
export interface MihonImportOptionsContract {
  /** Only these manga (taken from `skippedOtherLanguage`) are imported, nothing else */
  includeMangaIds?: string[]
}

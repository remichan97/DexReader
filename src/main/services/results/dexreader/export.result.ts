export interface DexReaderExportResult {
  filePath: string
  exportedMangaCount: number
  exportedChaptersCount: number
  exportedCollectionsCount?: number
  exportedProgressCount?: number
  exportedReaderSettingsCount?: number
  message?: string
}

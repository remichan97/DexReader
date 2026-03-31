export interface DexReaderMangaProgress {
  mangaId: string // Manga UUID
  lastChapterId: string // Last chapter read
  firstReadAt: number // Unix timestamp (milliseconds)
  lastReadAt: number // Unix timestamp (milliseconds)
}

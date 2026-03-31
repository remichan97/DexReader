export interface MangaStorageByTitleQuery {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  chapterCount: number
  totalStorageSize: number // in bytes, sum of all chapters for this manga
}

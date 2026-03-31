export interface MarkMangaNewChapterCommand {
  mangaId: string
  hasNew?: boolean // Optional: if not provided, defaults to true
}

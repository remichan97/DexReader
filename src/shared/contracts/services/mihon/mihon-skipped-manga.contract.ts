/**
 * A MangaDex entry in a Mihon/Tachiyomi backup that was left out of the import because it comes
 * from a MangaDex source in a language other than English. The user can add these back.
 */
export interface MihonSkippedMangaContract {
  mangaId: string
  title: string
}

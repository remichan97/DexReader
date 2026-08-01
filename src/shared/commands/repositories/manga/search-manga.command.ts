export interface SearchMangaCommand {
  // Possible search fields
  mangaId?: string
  title?: string
  author?: string
  artist?: string
  tag?: string
  //Pagination, if needed
  limit?: number
  offset?: number
}

export interface SearchMangaCommand {
  // Possible search fields, minus the ID here
  title?: string
  author?: string
  artist?: string
  tag?: string
  //Pagination, if needed
  limit?: number
  offset?: number
}

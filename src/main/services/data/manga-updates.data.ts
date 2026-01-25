import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'

export interface MangaUpdateData {
  hasNewChapters: boolean
  data: UpsertMangaCommand
}

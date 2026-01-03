import { UpsertMangaCommand } from '../../database/commands/collections/upsert-manga.command'

export interface MangaUpdateData {
  hasNewChapters: boolean
  data: UpsertMangaCommand
}

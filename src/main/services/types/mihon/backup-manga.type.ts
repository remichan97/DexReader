import { BackupChapter } from './backup-chapter.type'
import { BackupHistory } from './backup-history.type'

export interface BackupManga {
  source: string
  url: string
  title?: string
  artist?: string
  author?: string
  description?: string
  genre?: string[]
  status?: number
  thumbnailUrl?: string
  dateAdded?: number
  history: BackupHistory[]
  chapters: BackupChapter[]
  categories: number[]
  favorite?: boolean
}

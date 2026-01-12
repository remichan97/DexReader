import { BackupChapter } from './backup-chapter.type'
import { BackupHistory } from './backup-history.type'
import { BackupTracking } from './backup-tracking.type'

export interface BackupManga {
  source: bigint
  url: string
  title?: string
  artist?: string
  author?: string
  description?: string
  genre?: string[]
  status?: number
  thumbnailUrl?: string
  history: BackupHistory[]
  chapters: BackupChapter[]
  categories: number[]
  tracking?: BackupTracking[]
  favorite?: boolean
}

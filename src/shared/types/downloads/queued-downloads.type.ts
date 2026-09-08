import { ImageQuality } from '@shared/enums/mangadex'

export interface QueuedDownloads {
  chapterId: string
  mangaId: string
  language: string
  quality: ImageQuality
  addedAt: Date
  priority?: number
}

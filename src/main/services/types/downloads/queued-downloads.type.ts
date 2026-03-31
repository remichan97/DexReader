import { ImageQuality } from '../../../api/enums'

export interface QueuedDownloads {
  chapterId: string
  mangaId: string
  language: string
  quality: ImageQuality
  addedAt: Date
  priority?: number
}

import { ImageQuality } from '../../api/enums'

export interface DownloadChapterOptions {
  mangaId: string
  chapterId: string
  language: string
  quality: ImageQuality
}

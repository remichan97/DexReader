import { ImageQuality } from '../../enums/mangadex'

export interface DownloadChapterCommand {
  mangaId: string
  chapterId: string
  language: string
  quality: ImageQuality
}

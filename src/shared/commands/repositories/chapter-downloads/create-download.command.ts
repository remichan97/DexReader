import { ImageQuality } from '../../../enums/mangadex'

export interface CreateDownloadCommand {
  chapterId: string
  mangaId: string
  totalPages: number
  downloadsBasePath: string
  filePath: string
  imageQuality: ImageQuality
}

import { ImageQuality } from '../../../api/enums'

export interface CreateDownloadCommand {
  chapterId: string
  mangaId: string
  totalPages: number
  filePath: string
  imageQuality: ImageQuality
}

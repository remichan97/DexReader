import { ImageQuality } from '@shared/enums/mangadex'

export interface ImageUrlResponse {
  url: string
  filename: string
  quality: ImageQuality
}

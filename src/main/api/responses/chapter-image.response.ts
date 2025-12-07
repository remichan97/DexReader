import { ImageQuality } from '../enums/image-quality.enum'

export interface ChapterImagesResponse {
  url: string
  filename: string
  quality: ImageQuality
}

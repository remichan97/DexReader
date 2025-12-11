import { ImageQuality } from '../enums'

export interface ImageUrlResponse {
  url: string
  filename: string
  quality: ImageQuality
}

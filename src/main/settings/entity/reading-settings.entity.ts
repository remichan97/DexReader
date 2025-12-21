import { ReadingMode } from '../enum/reading-mode.enum'

export interface MangaReadingSettings {
  readingMode: ReadingMode
  doublePageMode?: {
    skipCoverPages: boolean
    readRightToLeft: boolean
  }
}

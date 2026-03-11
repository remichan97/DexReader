import { ReadingMode } from '../enums/reading-mode.enum'

export interface MangaReadingSettings {
  readingMode: ReadingMode
  doublePageMode?: {
    skipCoverPages: boolean
    readRightToLeft: boolean
  }
}

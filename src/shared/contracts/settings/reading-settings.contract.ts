import { ReadingMode } from '../../enums/settings/reading-mode.enum'

export interface MangaReadingSettings {
  readingMode: ReadingMode
  doublePageMode?: {
    skipCoverPages: boolean
    readRightToLeft: boolean
  }
}

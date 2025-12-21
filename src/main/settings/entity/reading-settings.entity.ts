import { ReadingMode } from '../enum/reading-mode.enum'

export interface ReaderSettings {
  readingMode: ReadingMode
  doublePageMode?: {
    skipCoverPages: boolean
    readRightToLeft: boolean
  }
}

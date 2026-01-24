import { ChapterProgressData } from './chapter-progress.type'
import { MangaProgressData } from './manga-progress.type'

export interface ProgressData {
  mangaProgress: MangaProgressData[]
  chapterProgress: ChapterProgressData[]
}

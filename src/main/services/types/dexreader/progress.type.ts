import { ChapterProgress } from './chapter-progress.type'
import { MangaProgress } from './manga-progress.type'

export interface ProgressData {
  mangaProgress: MangaProgress[]
  chapterProgress: ChapterProgress[]
}

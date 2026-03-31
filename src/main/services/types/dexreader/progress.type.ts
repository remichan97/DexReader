import { DexReaderChapterProgress } from './chapter-progress.type'
import { DexReaderMangaProgress } from './manga-progress.type'

export interface ProgressData {
  mangaProgress: DexReaderMangaProgress[]
  chapterProgress: DexReaderChapterProgress[]
}

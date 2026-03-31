import { DexReaderChapter } from './chapter.type'
import { DexReaderManga } from './manga.type'

export interface LibraryData {
  mangaList: DexReaderManga[]
  chapterList: DexReaderChapter[]
}

import { Chapter } from './chapter.type'
import { Manga } from './manga.type'

export interface LibraryData {
  mangaList: Manga[]
  chapterList: Chapter[]
}

import { ReaderSettings } from '../../settings/entity/reading-settings.entity'
import { ChapterProgress } from './chapter-progress.entity'

export interface MangaProgress {
  mangaId: string
  mangaTitle: string
  coverUrl: string
  readerSettings: ReaderSettings

  lastChapterId: string
  lastChapterNumber: number | undefined
  lastChapterTitle: string

  firstReadAt: number //unix timestamp
  lastReadAt: number //unix timestamp

  chapters: Record<string, ChapterProgress> // per-chapter progress
}

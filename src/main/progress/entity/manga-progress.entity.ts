import { ChapterProgress } from './chapter-progress.entity'

export interface MangaProgress {
  mangaId: string
  mangaTitle: string
  coverUrl: string

  lastChapterId: string
  lastChapterNumber: number | undefined
  lastChapterTitle: string

  firstReadAt: number //unix timestamp
  lastReadAt: number //unix timestamp

  chapters: Record<string, ChapterProgress> // per-chapter progress
}

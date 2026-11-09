import { useMemo } from 'react'
import { sortChaptersAscending } from '@renderer/utils/chapterOrder'
import type { MangaContract, ChapterContract } from '../../../../../../../preload/window.types'

type MangaEntity = MangaContract
type ChapterEntity = ChapterContract

interface UseChapterFiltersParams {
  manga: MangaEntity
  chapters: ChapterEntity[]
  sortOrder: 'asc' | 'desc'
}

interface UseChapterFiltersResult {
  availableLanguages: string[]
  /** What the list shows, in the order the user picked */
  displayChapters: ChapterEntity[]
  /** The same chapters oldest first, whatever the display order: for downloading and reading */
  readingOrderChapters: ChapterEntity[]
}

/**
 * Custom hook for managing chapter filtering and sorting logic
 */
export function useChapterFilters({
  manga,
  chapters,
  sortOrder
}: UseChapterFiltersParams): UseChapterFiltersResult {
  // Get available languages from manga
  const availableLanguages = useMemo(() => {
    const langs = manga.availableTranslatedLanguages || []
    return [...langs].sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Reading order (oldest first) of the chapters that can be read. The list in state is already
  // in that order; sorting again keeps this correct for any caller, and drops repeated ids.
  const readingOrderChapters = useMemo(
    () => sortChaptersAscending(chapters.filter((chapter) => !chapter.isUnavailable)),
    [chapters]
  )

  // Only the display flips with the sort order, so changing it never reloads anything
  const displayChapters = useMemo(
    () => (sortOrder === 'asc' ? readingOrderChapters : [...readingOrderChapters].reverse()),
    [readingOrderChapters, sortOrder]
  )

  return {
    availableLanguages,
    displayChapters,
    readingOrderChapters
  }
}

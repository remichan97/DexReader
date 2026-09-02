import { useMemo } from 'react'
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
  displayChapters: ChapterEntity[]
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
    return langs.sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Filter and sort chapters
  const displayChapters = useMemo(() => {
    // Filter out unavailable chapters
    const filtered = chapters.filter((chapter) => !chapter.isUnavailable)

    // Remove duplicates by chapter ID (shouldn't happen but ensures unique keys)
    const uniqueChapters = Array.from(
      new Map(filtered.map((chapter) => [chapter.id, chapter])).values()
    )

    // Sort by chapter number
    uniqueChapters.sort((a, b) => {
      const aNum = Number.parseFloat(a.chapter || '0')
      const bNum = Number.parseFloat(b.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return uniqueChapters
  }, [chapters, sortOrder])

  return {
    availableLanguages,
    displayChapters
  }
}

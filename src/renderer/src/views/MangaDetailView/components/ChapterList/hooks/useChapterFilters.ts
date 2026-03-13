import { useMemo } from 'react'

// Extract types from global window interface
type MangaEntity = Awaited<ReturnType<Window['mangadex']['getManga']>>['data']
type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

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
  // Get available languages from manga attributes
  const availableLanguages = useMemo(() => {
    const langs =
      (manga.attributes as { availableTranslatedLanguages?: string[] })
        .availableTranslatedLanguages || []
    return langs.sort((a, b) => a.localeCompare(b))
  }, [manga])

  // Filter and sort chapters
  const displayChapters = useMemo(() => {
    // Filter out unavailable chapters
    const filtered = chapters.filter(
      (chapter) => !(chapter.attributes as { isUnavailable?: boolean }).isUnavailable
    )

    // Remove duplicates by chapter ID (shouldn't happen but ensures unique keys)
    const uniqueChapters = Array.from(
      new Map(filtered.map((chapter) => [chapter.id, chapter])).values()
    )

    // Sort by chapter number
    uniqueChapters.sort((a, b) => {
      const aNum = Number.parseFloat(a.attributes.chapter || '0')
      const bNum = Number.parseFloat(b.attributes.chapter || '0')
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum
    })

    return uniqueChapters
  }, [chapters, sortOrder])

  return {
    availableLanguages,
    displayChapters
  }
}

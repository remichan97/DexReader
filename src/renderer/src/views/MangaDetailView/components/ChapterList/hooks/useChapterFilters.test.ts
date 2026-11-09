import { renderHook } from '@testing-library/react'
import { useChapterFilters } from './useChapterFilters'
import type { ChapterContract, MangaContract } from '../../../../../../../preload/window.types'

function chapter(
  id: string,
  number: string,
  overrides: Partial<ChapterContract> = {}
): ChapterContract {
  return {
    id,
    chapter: number,
    pages: 10,
    translatedLanguage: 'en',
    publishAt: '2026-01-01T00:00:00.000Z',
    isUnavailable: false,
    scanlationGroup: {},
    ...overrides
  }
}

const manga = { availableTranslatedLanguages: ['vi', 'en'] } as unknown as MangaContract

const ids = (list: ChapterContract[]): string[] => list.map((entry) => entry.id)

// The list in state is oldest first; these are in that order
const CHAPTERS = [chapter('a', '1'), chapter('b', '2'), chapter('c', '3')]

describe('useChapterFilters', () => {
  it('shows the list as it is for oldest first', () => {
    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: CHAPTERS, sortOrder: 'asc' })
    )

    expect(ids(result.current.displayChapters)).toEqual(['a', 'b', 'c'])
  })

  it('reverses the display for newest first', () => {
    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: CHAPTERS, sortOrder: 'desc' })
    )

    expect(ids(result.current.displayChapters)).toEqual(['c', 'b', 'a'])
  })

  it('keeps the reading order oldest first whichever way the display goes', () => {
    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: CHAPTERS, sortOrder: 'desc' })
    )

    expect(ids(result.current.readingOrderChapters)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by chapter number as a number, even from an unsorted list', () => {
    const unsorted = [chapter('ten', '10'), chapter('two', '2'), chapter('one', '1')]

    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: unsorted, sortOrder: 'desc' })
    )

    expect(ids(result.current.readingOrderChapters)).toEqual(['one', 'two', 'ten'])
    expect(ids(result.current.displayChapters)).toEqual(['ten', 'two', 'one'])
  })

  it('leaves out chapters that cannot be read', () => {
    const withUnavailable = [chapter('a', '1'), chapter('b', '2', { isUnavailable: true })]

    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: withUnavailable, sortOrder: 'asc' })
    )

    expect(ids(result.current.displayChapters)).toEqual(['a'])
    expect(ids(result.current.readingOrderChapters)).toEqual(['a'])
  })

  it('shows a repeated chapter id once', () => {
    const repeated = [chapter('a', '1'), chapter('a', '1'), chapter('b', '2')]

    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: repeated, sortOrder: 'asc' })
    )

    expect(ids(result.current.displayChapters)).toEqual(['a', 'b'])
  })

  it('does not change the list it was given', () => {
    const input = [chapter('b', '2'), chapter('a', '1')]

    renderHook(() => useChapterFilters({ manga, chapters: input, sortOrder: 'desc' }))

    expect(ids(input)).toEqual(['b', 'a'])
  })

  it('lists the manga languages alphabetically without changing the manga', () => {
    const { result } = renderHook(() =>
      useChapterFilters({ manga, chapters: CHAPTERS, sortOrder: 'asc' })
    )

    expect(result.current.availableLanguages).toEqual(['en', 'vi'])
    expect(manga.availableTranslatedLanguages).toEqual(['vi', 'en'])
  })
})

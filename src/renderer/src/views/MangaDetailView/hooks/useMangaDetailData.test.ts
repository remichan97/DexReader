import { act, renderHook, waitFor } from '@testing-library/react'
import { useMangaDetailData } from './useMangaDetailData'
import { setChapterSortPreference } from '@renderer/utils/chapterSortPreference'
import type { ChapterContract } from '../../../../../preload/window.types'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))
vi.mock('@renderer/utils/mangaCache', () => ({ cacheMangaMetadata: vi.fn() }))
// The conversions only reshape database rows; the tests hand over rows already in display shape
vi.mock('@renderer/utils/mangaDbConversion', () => ({
  convertDbMangaToContract: (manga: unknown) => manga,
  convertDbChaptersToContract: (chapters: unknown) => chapters
}))

const getMangaFeed = vi.fn()
const getManga = vi.fn()
const getMangaById = vi.fn()
const getCachedChapters = vi.fn()
const loadSettings = vi.fn()

// Only echoes the key; the hook just passes it through for its error messages
const t = ((key: string): string => key) as unknown as Parameters<typeof useMangaDetailData>[2]

function chapter(language: string, number: number): ChapterContract {
  return {
    id: `${language}-${number}`,
    chapter: String(number),
    pages: 10,
    translatedLanguage: language,
    publishAt: '2026-01-01T00:00:00.000Z',
    isUnavailable: false,
    scanlationGroup: {}
  }
}

/** Chapters per language that the fake MangaDex holds; '*' is what an unfiltered request sees */
let feedTotals: Record<string, number> = {}
/** When set, every page after the first waits for this promise */
let laterPagesGate: Promise<void> | undefined

function installFeed(): void {
  getMangaFeed.mockImplementation(
    async (
      _id: string,
      params: {
        offset: number
        limit: number
        translatedLanguage?: string[]
        order: Record<string, string>
      }
    ) => {
      if (params.offset > 0 && laterPagesGate) await laterPagesGate

      const language = params.translatedLanguage?.[0]
      const languages = language ? [language] : Object.keys(feedTotals).filter((l) => l !== '*')
      const all = languages.flatMap((lang) =>
        Array.from({ length: feedTotals[language ? lang : '*'] ?? feedTotals[lang] ?? 0 }, (_, i) =>
          chapter(lang, i + 1)
        )
      )
      if (params.order.chapter === 'desc') all.reverse()

      return {
        success: true,
        data: {
          result: 'ok',
          data: all.slice(params.offset, params.offset + params.limit),
          total: all.length,
          offset: params.offset,
          limit: params.limit
        }
      }
    }
  )
}

function holdLaterPages(): () => void {
  let release: () => void = () => undefined
  laterPagesGate = new Promise<void>((resolve) => (release = resolve))
  return release
}

function mount(
  isOnline = true
): ReturnType<typeof renderHook<ReturnType<typeof useMangaDetailData>, unknown>> {
  return renderHook(() => useMangaDetailData('manga-1', isOnline, t))
}

const numbers = (list: ChapterContract[]): number[] => list.map((entry) => Number(entry.chapter))

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.localStorage.clear()
  feedTotals = { en: 120 }
  laterPagesGate = undefined
  installFeed()

  getMangaById.mockResolvedValue({ success: false })
  getCachedChapters.mockResolvedValue({ success: true, data: [] })
  getManga.mockResolvedValue({
    success: true,
    data: { result: 'ok', data: { id: 'manga-1', availableTranslatedLanguages: ['en'] } }
  })
  loadSettings.mockResolvedValue({
    success: true,
    data: { language: { syncContentLanguage: true, displayLanguage: 'en-GB' } }
  })

  globalThis.library = { getMangaById, getCachedChapters } as unknown as typeof globalThis.library
  globalThis.mangadex = { getManga, getMangaFeed } as unknown as typeof globalThis.mangadex
  globalThis.settings = { load: loadSettings } as unknown as typeof globalThis.settings
})

describe('sort order', () => {
  it('is newest first for a manga nobody has changed, and asks for the newest page first', async () => {
    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(120))

    expect(result.current.chapterSort).toBe('desc')
    expect(getMangaFeed.mock.calls[0][1].order).toEqual({ chapter: 'desc', publishAt: 'desc' })
  })

  it('uses the order remembered for this manga, and loads from that end first', async () => {
    setChapterSortPreference('manga-1', 'asc')

    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(120))
    expect(result.current.chapterSort).toBe('asc')
    expect(getMangaFeed.mock.calls[0][1].order).toEqual({ chapter: 'asc', publishAt: 'asc' })
  })

  it('does not apply an order remembered for a different manga', async () => {
    setChapterSortPreference('another-manga', 'asc')

    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(120))
    expect(result.current.chapterSort).toBe('desc')
  })

  it('keeps the chapters oldest first whichever way the list is sorted', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.chapters).toHaveLength(120))

    expect(result.current.chapterSort).toBe('desc')
    expect(numbers(result.current.chapters)).toEqual(Array.from({ length: 120 }, (_, i) => i + 1))
  })

  it('changing it reloads nothing and is remembered for this manga only', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.chapters).toHaveLength(120))
    getMangaFeed.mockClear()

    act(() => result.current.setChapterSort('asc'))

    expect(result.current.chapterSort).toBe('asc')
    expect(getMangaFeed).not.toHaveBeenCalled()
    expect(
      JSON.parse(globalThis.localStorage.getItem('dexreader:mangaDetail:chapterSort') ?? '{}')
    ).toEqual({
      'manga-1': 'asc'
    })
  })
})

describe('a series that takes more than one page', () => {
  beforeEach(() => {
    feedTotals = { en: 1240 }
  })

  it('shows the first page at once and is incomplete until the rest arrives', async () => {
    const release = holdLaterPages()
    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(500))

    // Newest first: the newest 500 are here, the older ones are still coming
    expect(result.current.chaptersComplete).toBe(false)
    expect(result.current.chaptersTotal).toBe(1240)
    expect(result.current.chaptersLoadedFrom).toBe('newest')
    expect(result.current.chaptersLoading).toBe(false)
    expect(Math.min(...numbers(result.current.chapters))).toBe(741)

    release()
    await waitFor(() => expect(result.current.chaptersComplete).toBe(true))

    expect(result.current.chapters).toHaveLength(1240)
    expect(numbers(result.current.chapters)[0]).toBe(1)
  })

  it('starts from the oldest chapters for a list sorted oldest first', async () => {
    setChapterSortPreference('manga-1', 'asc')
    const release = holdLaterPages()

    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(500))
    expect(result.current.chaptersLoadedFrom).toBe('oldest')
    expect(Math.max(...numbers(result.current.chapters))).toBe(500)
    release()
  })

  it('keeps the list it has and flags the failure when a later page fails', async () => {
    getMangaFeed.mockImplementation(async (_id: string, params: { offset: number }) => {
      if (params.offset > 0) return { success: false, error: { message: 'rate limited' } }
      return {
        success: true,
        data: {
          result: 'ok',
          data: Array.from({ length: 500 }, (_, i) => chapter('en', 1240 - i)),
          total: 1240,
          offset: 0,
          limit: 500
        }
      }
    })

    const { result } = mount()

    await waitFor(() => expect(result.current.chaptersLoadFailed).toBe(true))
    expect(result.current.chapters).toHaveLength(500)
    expect(result.current.chaptersComplete).toBe(false)
    expect(result.current.chaptersError).toBeNull()
  })

  it('does not let a slow load overwrite the one that replaced it', async () => {
    feedTotals = { en: 1240, vi: 30 }
    const release = holdLaterPages()
    const { result } = mount()
    await waitFor(() => expect(result.current.chapters).toHaveLength(500))

    // Switch language while the English load is still waiting for its later pages
    await act(async () => {
      await result.current.loadChaptersForLanguage('vi')
    })
    await waitFor(() => expect(result.current.selectedLanguage).toBe('vi'))
    release()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(result.current.chapters).toHaveLength(30)
    expect(result.current.chapters.every((entry) => entry.translatedLanguage === 'vi')).toBe(true)
  })
})

describe('language cascade', () => {
  it('falls back to English when the preferred language has no chapters', async () => {
    feedTotals = { en: 10, vi: 0 }
    loadSettings.mockResolvedValue({
      success: true,
      data: { language: { syncContentLanguage: false, contentLanguage: ['vi'] } }
    })

    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(10))
    expect(result.current.selectedLanguage).toBe('en')
    expect(result.current.chaptersFilterLanguage).toBe('en')
  })

  it('shows every language, labelled with the first one found, as a last resort', async () => {
    feedTotals = { ja: 4 }

    const { result } = mount()

    await waitFor(() => expect(result.current.chapters).toHaveLength(4))
    expect(result.current.selectedLanguage).toBe('ja')
    expect(result.current.chaptersFilterLanguage).toBeUndefined()
  })

  it('shows an empty list, not an error, when the manga has no chapters at all', async () => {
    feedTotals = {}

    const { result } = mount()

    await waitFor(() => expect(result.current.chaptersLoading).toBe(false))
    expect(result.current.chapters).toEqual([])
    expect(result.current.chaptersError).toBeNull()
    expect(result.current.chaptersComplete).toBe(true)
  })

  it('reports a failed first page as a chapter error', async () => {
    getMangaFeed.mockResolvedValue({ success: false, error: { message: 'boom' } })

    const { result } = mount()

    await waitFor(() => expect(result.current.chaptersError?.message).toBe('boom'))
    expect(result.current.chapters).toEqual([])
  })
})

describe('cached data', () => {
  const cachedManga = { id: 'manga-1', availableTranslatedLanguages: ['en'] }

  beforeEach(() => {
    getMangaById.mockResolvedValue({ success: true, data: cachedManga })
  })

  it('shows the cached chapters of one language, oldest first, and treats them as complete', async () => {
    getCachedChapters.mockResolvedValue({
      success: true,
      data: [
        { ...chapter('en', 3), language: 'en' },
        { ...chapter('vi', 9), language: 'vi' },
        { ...chapter('en', 1), language: 'en' },
        { ...chapter('en', 2), language: 'en' }
      ]
    })

    const { result } = mount(false)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(numbers(result.current.chapters)).toEqual([1, 2, 3])
    expect(result.current.selectedLanguage).toBe('en')
    expect(result.current.chaptersComplete).toBe(true)
    expect(getMangaFeed).not.toHaveBeenCalled()
  })
})

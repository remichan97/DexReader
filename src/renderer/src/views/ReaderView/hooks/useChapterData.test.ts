import { act, renderHook, waitFor } from '@testing-library/react'
import { useChapterData } from './useChapterData'
import { useConnectivityStore } from '@renderer/stores/connectivityStore'
import { ImageQuality } from '@shared/enums/mangadex/image-quality.enum'
import type { ImageUrlResponse, ChapterContract } from '../../../../../preload/window.types'
import type { ChapterDownloadContract } from '@shared/contracts/database/chapter-downloads/chapter-downloads.contract'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const isDownloaded = vi.fn()
const getChapterImages = vi.fn()
const getMangaFeed = vi.fn()

interface LocationState {
  chapterNumber?: string
  chapterTitle?: string
  mangaTitle?: string
  coverUrl?: string
  chapters?: ChapterContract[]
  startAtLastPage?: boolean
  startPage?: number
}

function chapter(overrides: Partial<ChapterContract> = {}): ChapterContract {
  return {
    id: 'chapter-1',
    pages: 20,
    translatedLanguage: 'en',
    publishAt: '2026-01-01T00:00:00.000Z',
    isUnavailable: false,
    scanlationGroup: {},
    ...overrides
  }
}

function downloadRecord(overrides: Partial<ChapterDownloadContract> = {}): ChapterDownloadContract {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Completed,
    downloadedAt: 0,
    downloadsBasePath: '/downloads',
    filePath: 'manga/manga-1/chapters/chapter-1',
    totalPages: 3,
    storageSize: 1024,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    title: 'Berserk',
    chapterNumber: '1',
    ...overrides
  }
}

function imageUrl(overrides: Partial<ImageUrlResponse> = {}): ImageUrlResponse {
  return {
    url: 'https://example.com/1.png',
    filename: '1.png',
    quality: ImageQuality.High,
    ...overrides
  }
}

// A single stable locationState reference matters here: the hook's title-sync effect
// depends on `[locationState]` by reference, so a literal object inlined directly in the
// renderHook callback would get recreated (and thus re-trigger that effect) on every
// render the hook itself causes - see useCollectionManager.test.ts for the same note.
function mountChapterData(
  locationState: LocationState | null,
  overrides: { mangaId?: string; chapterId?: string; locationKey?: string } = {}
): ReturnType<typeof renderHook<ReturnType<typeof useChapterData>, unknown>> {
  return renderHook(() =>
    useChapterData(
      overrides.mangaId ?? 'manga-1',
      overrides.chapterId ?? 'chapter-1',
      locationState,
      overrides.locationKey ?? 'key-1',
      ImageQuality.High
    )
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useConnectivityStore.setState({ isOnline: true })
  globalThis.downloads = { isDownloaded } as unknown as typeof globalThis.downloads
  globalThis.mangadex = { getChapterImages, getMangaFeed } as unknown as typeof globalThis.mangadex
  globalThis.window.mangadex = globalThis.mangadex
  isDownloaded.mockResolvedValue({ success: true, data: undefined })
  getMangaFeed.mockResolvedValue({
    success: true,
    data: { result: 'ok', data: [], limit: 500, offset: 0, total: 0 }
  })
})

describe('initial state', () => {
  it('seeds metadata from locationState before any load completes', () => {
    const locationState: LocationState = {
      mangaTitle: 'Berserk',
      chapterNumber: '1',
      chapters: [chapter()]
    }

    const { result } = mountChapterData(locationState)

    expect(result.current.mangaTitle).toBe('Berserk')
    expect(result.current.chapterNumber).toBe('1')
    expect(result.current.chapters).toEqual([chapter()])
    expect(result.current.loading).toBe(true)
  })

  it('falls back to defaults when there is no locationState', () => {
    const { result } = mountChapterData(null)

    expect(result.current.mangaTitle).toBe('Manga')
    expect(result.current.chapterNumber).toBeNull()
    expect(result.current.chapters).toEqual([])
  })
})

describe('loadChapterImages', () => {
  it('builds local-manga:// urls when the chapter is downloaded', async () => {
    isDownloaded.mockResolvedValue({ success: true, data: downloadRecord({ totalPages: 2 }) })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.images).toEqual([
      {
        url: 'local-manga://chapter/chapter-1/page/0',
        filename: '000.jpg',
        quality: ImageQuality.High
      },
      {
        url: 'local-manga://chapter/chapter-1/page/1',
        filename: '001.jpg',
        quality: ImageQuality.High
      }
    ])
    expect(getChapterImages).not.toHaveBeenCalled()
  })

  it('fetches from the MangaDex API and rewrites https:// to the mangadex:// proxy scheme', async () => {
    isDownloaded.mockResolvedValue({ success: true, data: undefined })
    getChapterImages.mockResolvedValue({ success: true, data: [imageUrl()] })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.images).toEqual([
      { url: 'mangadex://example.com/1.png', filename: '1.png', quality: ImageQuality.High }
    ])
  })

  it('fails with a clear message when offline and the chapter is not downloaded', async () => {
    useConnectivityStore.setState({ isOnline: false })
    isDownloaded.mockResolvedValue({ success: true, data: undefined })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error?.message).toMatch(/you need to be online/i)
    expect(getChapterImages).not.toHaveBeenCalled()
  })

  it('surfaces the IPC error message when the API call fails', async () => {
    getChapterImages.mockResolvedValue({ success: false, error: { message: 'MangaDex is down' } })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error?.message).toBe('MangaDex is down')
  })

  it('fails with a clear message when the chapter has no pages', async () => {
    getChapterImages.mockResolvedValue({ success: true, data: [] })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error?.message).toMatch(/doesn't have any pages/i)
  })

  it('preserves already-loaded or errored page states across a reload, resetting only the rest', async () => {
    getChapterImages.mockResolvedValue({
      success: true,
      data: [imageUrl(), imageUrl(), imageUrl()]
    })
    const locationState: LocationState = { chapters: [chapter()] }

    const { result } = mountChapterData(locationState)
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setImageLoadingState(0, 'loaded')
      result.current.setImageLoadingState(1, 'error')
    })

    await act(async () => {
      await result.current.loadChapterImages('chapter-1')
    })

    expect(result.current.imageLoadingStates.get(0)).toBe('loaded')
    expect(result.current.imageLoadingStates.get(1)).toBe('error')
    expect(result.current.imageLoadingStates.get(2)).toBe('loading')
  })
})

describe('previousChapter / nextChapter', () => {
  const chapters = [chapter({ id: 'c1' }), chapter({ id: 'c2' }), chapter({ id: 'c3' })]
  const locationState: LocationState = { chapters }

  it('are both null when the current chapter is not in the list', () => {
    const { result } = mountChapterData(locationState, { chapterId: 'missing' })

    expect(result.current.previousChapter).toBeNull()
    expect(result.current.nextChapter).toBeNull()
  })

  it('derives both neighbours for a chapter in the middle of the list', () => {
    const { result } = mountChapterData(locationState, { chapterId: 'c2' })

    expect(result.current.previousChapter).toEqual(chapter({ id: 'c1' }))
    expect(result.current.nextChapter).toEqual(chapter({ id: 'c3' }))
  })

  it('has no previousChapter for the first chapter in the list', () => {
    const { result } = mountChapterData(locationState, { chapterId: 'c1' })

    expect(result.current.previousChapter).toBeNull()
    expect(result.current.nextChapter).toEqual(chapter({ id: 'c2' }))
  })

  it('has no nextChapter for the last chapter in the list', () => {
    const { result } = mountChapterData(locationState, { chapterId: 'c3' })

    expect(result.current.nextChapter).toBeNull()
  })
})

describe('setImageLoadingState', () => {
  it('updates only the targeted page', () => {
    const locationState: LocationState = { chapters: [chapter()] }
    const { result } = mountChapterData(locationState)

    act(() => {
      result.current.setImageLoadingState(2, 'loaded')
    })

    expect(result.current.imageLoadingStates.get(2)).toBe('loaded')
    expect(result.current.imageLoadingStates.get(0)).toBeUndefined()
  })
})

describe('chapter title effect', () => {
  it.each([
    ['1', 'The Black Swordsman', 'Chapter 1: The Black Swordsman'],
    ['1', undefined, 'Chapter 1'],
    [undefined, 'The Black Swordsman', 'The Black Swordsman']
  ])(
    'builds the title from chapterNumber=%s and chapterTitle=%s',
    (chapterNumber, chapterTitle, expected) => {
      const locationState: LocationState = { chapterNumber, chapterTitle, chapters: [chapter()] }

      const { result } = mountChapterData(locationState)

      expect(result.current.chapterTitle).toBe(expected)
    }
  )
})

describe('fallback chapter list (regression: no infinite reload loop)', () => {
  it('does not refetch the chapter list once locationState already supplied one', async () => {
    const locationState: LocationState = { chapters: [chapter()] }

    mountChapterData(locationState)

    await waitFor(() => expect(isDownloaded).toHaveBeenCalled())
    expect(getMangaFeed).not.toHaveBeenCalled()
  })

  it('fetches a fallback English chapter list when none was supplied (e.g. opened from History)', async () => {
    getMangaFeed.mockResolvedValue({
      success: true,
      data: { result: 'ok', data: [chapter()], limit: 500, offset: 0, total: 1 }
    })
    const locationState: LocationState = { chapters: [] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.chapters).toEqual([chapter()]))
    expect(getMangaFeed).toHaveBeenCalledTimes(1)
  })

  it('loads chapter images exactly once even after the fallback chapter list resolves', async () => {
    getMangaFeed.mockResolvedValue({
      success: true,
      data: { result: 'ok', data: [chapter()], limit: 500, offset: 0, total: 1 }
    })
    const locationState: LocationState = { chapters: [] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.chapters).toEqual([chapter()]))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // This is the exact bug fixed earlier: the fallback list used to be stored in a way
    // the image-loading effect depended on, so each resolution re-triggered a reload.
    expect(isDownloaded).toHaveBeenCalledTimes(1)
  })

  it('does not fetch a fallback list while offline', async () => {
    useConnectivityStore.setState({ isOnline: false })
    const locationState: LocationState = { chapters: [] }

    mountChapterData(locationState)

    await waitFor(() => expect(isDownloaded).toHaveBeenCalled())
    expect(getMangaFeed).not.toHaveBeenCalled()
  })

  it('clears chaptersLoading once the fetch settles', async () => {
    const locationState: LocationState = { chapters: [] }

    const { result } = mountChapterData(locationState)

    await waitFor(() => expect(result.current.chaptersLoading).toBe(false))
  })
})

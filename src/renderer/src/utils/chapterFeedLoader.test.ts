import {
  fetchChapterFeedPage,
  loadChapterFeed,
  type ChapterFeedProgress
} from './chapterFeedLoader'

const getMangaFeed = vi.fn()

interface FakeChapter {
  id: string
  chapter: string
  publishAt: string
}

function chapters(from: number, to: number): FakeChapter[] {
  return Array.from({ length: to - from + 1 }, (_, index) => ({
    id: `c${from + index}`,
    chapter: String(from + index),
    publishAt: '2026-01-01T00:00:00+00:00'
  }))
}

/** A fake feed holding chapters 1..total: pages come back in the requested direction */
function serveFeed(total: number): void {
  getMangaFeed.mockImplementation(
    async (
      _id: string,
      params: { offset: number; limit: number; order: Record<string, string> }
    ) => {
      const all = chapters(1, total)
      if (params.order.chapter === 'desc') all.reverse()
      return {
        success: true,
        data: {
          result: 'ok',
          data: all.slice(params.offset, params.offset + params.limit),
          total,
          offset: params.offset,
          limit: params.limit
        }
      }
    }
  )
}

function collect(): { reports: ChapterFeedProgress[]; onPage: (p: ChapterFeedProgress) => void } {
  const reports: ChapterFeedProgress[] = []
  return { reports, onPage: (progress) => reports.push(progress) }
}

const numbers = (progress: ChapterFeedProgress): number[] =>
  progress.chapters.map((entry) => Number(entry.chapter))

beforeEach(() => {
  vi.clearAllMocks()
  globalThis.mangadex = { getMangaFeed } as unknown as typeof globalThis.mangadex
})

describe('fetchChapterFeedPage', () => {
  it('asks for a full page ordered by chapter then publish date, in the same direction', async () => {
    serveFeed(3)

    await fetchChapterFeedPage({ mangaId: 'm', language: 'en', direction: 'desc', offset: 0 })

    expect(getMangaFeed).toHaveBeenCalledWith(
      'm',
      expect.objectContaining({
        limit: 500,
        offset: 0,
        translatedLanguage: ['en'],
        order: { chapter: 'desc', publishAt: 'desc' },
        includes: ['scanlation_group']
      })
    )
  })

  it('asks for every content rating, so a library title of any rating has chapters', async () => {
    serveFeed(1)

    await fetchChapterFeedPage({ mangaId: 'm', direction: 'asc', offset: 0 })

    const params = getMangaFeed.mock.calls[0][1]
    expect(params.contentRating).toEqual(['safe', 'suggestive', 'erotica', 'pornographic'])
  })

  it('does not filter by language when none is given', async () => {
    serveFeed(1)

    await fetchChapterFeedPage({ mangaId: 'm', direction: 'asc', offset: 0 })

    expect(getMangaFeed.mock.calls[0][1].translatedLanguage).toBeUndefined()
  })

  it('returns the page with its total and offset', async () => {
    serveFeed(7)

    const page = await fetchChapterFeedPage({ mangaId: 'm', direction: 'asc', offset: 0 })

    expect(page.total).toBe(7)
    expect(page.offset).toBe(0)
    expect(page.chapters).toHaveLength(7)
  })

  it.each([
    ['an IPC failure', { success: false, error: { message: 'offline' } }, 'offline'],
    ['a missing body', { success: true }, 'Failed to fetch chapters'],
    [
      'an error result from the API',
      { success: true, data: { result: 'error', data: [], total: 0 } },
      'Failed to fetch chapters from API'
    ]
  ])('throws on %s', async (_label, response, message) => {
    getMangaFeed.mockResolvedValue(response)

    await expect(
      fetchChapterFeedPage({ mangaId: 'm', direction: 'asc', offset: 0 })
    ).rejects.toThrow(message)
  })
})

describe('loadChapterFeed', () => {
  it('is complete after one request when the series fits one page', async () => {
    serveFeed(120)
    const { reports, onPage } = collect()

    const result = await loadChapterFeed({ mangaId: 'm', direction: 'desc', onPage })

    expect(result).toEqual({ status: 'complete' })
    expect(getMangaFeed).toHaveBeenCalledTimes(1)
    expect(reports).toHaveLength(1)
    expect(reports[0].complete).toBe(true)
    expect(reports[0].total).toBe(120)
  })

  it('reports each page of a long series, ending complete, and the list is always oldest first', async () => {
    serveFeed(1240)
    const { reports, onPage } = collect()

    const result = await loadChapterFeed({ mangaId: 'm', direction: 'desc', onPage })

    expect(result.status).toBe('complete')
    expect(getMangaFeed).toHaveBeenCalledTimes(3)
    expect(reports.map((report) => report.complete)).toEqual([false, false, true])
    expect(reports.map((report) => report.chapters.length)).toEqual([500, 1000, 1240])

    for (const report of reports) {
      const list = numbers(report)
      expect(list).toEqual([...list].sort((a, b) => a - b))
    }
  })

  it('starts from the newest chapters when asked newest first', async () => {
    serveFeed(1240)
    const { reports, onPage } = collect()

    await loadChapterFeed({ mangaId: 'm', direction: 'desc', onPage })

    expect(reports[0].loadedFrom).toBe('newest')
    expect(Math.min(...numbers(reports[0]))).toBe(741)
    expect(Math.max(...numbers(reports[0]))).toBe(1240)
  })

  it('starts from the oldest chapters when asked oldest first', async () => {
    serveFeed(1240)
    const { reports, onPage } = collect()

    await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(reports[0].loadedFrom).toBe('oldest')
    expect(Math.min(...numbers(reports[0]))).toBe(1)
    expect(Math.max(...numbers(reports[0]))).toBe(500)
  })

  it('pages with the offsets it has received so far', async () => {
    serveFeed(1240)

    await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage: () => undefined })

    expect(getMangaFeed.mock.calls.map((call) => call[1].offset)).toEqual([0, 500, 1000])
  })

  it('uses a first page the caller already fetched instead of asking again', async () => {
    serveFeed(1240)
    const firstPage = await fetchChapterFeedPage({
      mangaId: 'm',
      direction: 'desc',
      offset: 0
    })
    getMangaFeed.mockClear()
    const { reports, onPage } = collect()

    await loadChapterFeed({ mangaId: 'm', direction: 'desc', firstPage, onPage })

    expect(getMangaFeed.mock.calls.map((call) => call[1].offset)).toEqual([500, 1000])
    expect(reports).toHaveLength(3)
  })

  it('keeps a chapter once when one is repeated across pages', async () => {
    getMangaFeed
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1, 500), total: 501, offset: 0, limit: 500 }
      })
      .mockResolvedValueOnce({
        success: true,
        // Chapter 500 shifted onto the second page because something was uploaded in between
        data: { result: 'ok', data: chapters(500, 500), total: 501, offset: 500, limit: 500 }
      })
    const { reports, onPage } = collect()

    await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(reports.at(-1)?.chapters).toHaveLength(500)
  })

  it('follows a total that changes while loading', async () => {
    getMangaFeed
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1, 500), total: 600, offset: 0, limit: 500 }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(501, 1000), total: 1100, offset: 500, limit: 500 }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1001, 1100), total: 1100, offset: 1000, limit: 500 }
      })
    const { reports, onPage } = collect()

    await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(reports.at(-1)).toMatchObject({ complete: true, total: 1100 })
    expect(reports.at(-1)?.chapters).toHaveLength(1100)
  })

  it('stops, complete, when the feed holds fewer chapters than its total claims', async () => {
    getMangaFeed
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1, 500), total: 900, offset: 0, limit: 500 }
      })
      .mockResolvedValue({
        success: true,
        data: { result: 'ok', data: [], total: 900, offset: 500, limit: 500 }
      })
    const { reports, onPage } = collect()

    const result = await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(result.status).toBe('complete')
    expect(getMangaFeed).toHaveBeenCalledTimes(2)
    expect(reports.at(-1)?.complete).toBe(true)
  })

  it('reports an empty feed as complete', async () => {
    serveFeed(0)
    const { reports, onPage } = collect()

    const result = await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(result.status).toBe('complete')
    expect(reports).toEqual([{ chapters: [], total: 0, complete: true, loadedFrom: 'oldest' }])
  })

  it('throws when the first page fails', async () => {
    getMangaFeed.mockResolvedValue({ success: false, error: { message: 'offline' } })
    const { reports, onPage } = collect()

    await expect(loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })).rejects.toThrow(
      'offline'
    )
    expect(reports).toEqual([])
  })

  it('ends as partial, keeping what it reported, when a later page fails', async () => {
    getMangaFeed
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1, 500), total: 1200, offset: 0, limit: 500 }
      })
      .mockResolvedValueOnce({ success: false, error: { message: 'rate limited' } })
    const { reports, onPage } = collect()

    const result = await loadChapterFeed({ mangaId: 'm', direction: 'asc', onPage })

    expect(result.status).toBe('partial')
    expect(result.error?.message).toBe('rate limited')
    expect(reports).toHaveLength(1)
    expect(reports[0].complete).toBe(false)
  })

  it('stops quietly when cancelled between pages', async () => {
    serveFeed(1240)
    const controller = new AbortController()
    const reports: ChapterFeedProgress[] = []

    const result = await loadChapterFeed({
      mangaId: 'm',
      direction: 'asc',
      signal: controller.signal,
      onPage: (progress) => {
        reports.push(progress)
        controller.abort()
      }
    })

    expect(result).toEqual({ status: 'cancelled' })
    expect(reports).toHaveLength(1)
    expect(getMangaFeed).toHaveBeenCalledTimes(1)
  })

  it('reports nothing if it was cancelled before the first page came back', async () => {
    serveFeed(10)
    const controller = new AbortController()
    const { reports, onPage } = collect()

    const loading = loadChapterFeed({
      mangaId: 'm',
      direction: 'asc',
      signal: controller.signal,
      onPage
    })
    controller.abort()
    const result = await loading

    expect(result).toEqual({ status: 'cancelled' })
    expect(reports).toEqual([])
  })

  it('drops a page that arrives after the load was cancelled', async () => {
    let releasePage: (value: unknown) => void = () => undefined
    getMangaFeed
      .mockResolvedValueOnce({
        success: true,
        data: { result: 'ok', data: chapters(1, 500), total: 1200, offset: 0, limit: 500 }
      })
      .mockReturnValueOnce(new Promise((resolve) => (releasePage = resolve)))
    const controller = new AbortController()
    const { reports, onPage } = collect()

    const loading = loadChapterFeed({
      mangaId: 'm',
      direction: 'asc',
      signal: controller.signal,
      onPage
    })
    await vi.waitFor(() => expect(getMangaFeed).toHaveBeenCalledTimes(2))
    controller.abort()
    releasePage({
      success: true,
      data: { result: 'ok', data: chapters(501, 1000), total: 1200, offset: 500, limit: 500 }
    })

    expect(await loading).toEqual({ status: 'cancelled' })
    expect(reports).toHaveLength(1)
  })
})

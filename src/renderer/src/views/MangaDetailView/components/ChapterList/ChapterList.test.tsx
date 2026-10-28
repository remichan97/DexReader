import { fireEvent, render, screen } from '@testing-library/react'
import ChapterList from './ChapterList'
import type { ChapterContract, MangaContract } from '../../../../../../preload/window.types'

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate
}))
vi.mock('@renderer/hooks/useSecureNavigation', () => ({
  useSecureNavigation: () => ({ secureNavigate: vi.fn() })
}))

// Strings show their default text where there is one (with {{values}} filled in), else
// "key:loaded/total", so the loading row can be told apart without the real translations
vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const template = options?.defaultValue as string | undefined
      if (template) {
        return template.replaceAll(/\{\{(\w+)\}\}/g, (_match, name: string) =>
          String(options?.[name])
        )
      }
      return options?.loaded === undefined ? key : `${key}:${options.loaded}/${options.total}`
    }
  })
}))

const handleDownloadAllClick = vi.fn()
const handleDownloadAll = vi.fn()
vi.mock('./hooks/useChapterDownloads', () => ({
  useChapterDownloads: () => ({
    downloadSettings: { path: 'D:\\Downloads', defaultQuality: 'data', confirmation: 'never' },
    downloadStatusMap: new Map(),
    showDownloadDialog: false,
    showDownloadAllDialog: false,
    selectedChapter: null,
    isOnline: true,
    setShowDownloadDialog: vi.fn(),
    setShowDownloadAllDialog: vi.fn(),
    setSelectedChapter: vi.fn(),
    handleDownloadClick: vi.fn(),
    handleDownloadAllClick,
    handleDownloadConfirm: vi.fn(),
    handleDownloadAll
  })
}))

function chapter(number: number): ChapterContract {
  return {
    id: `c-${number}`,
    chapter: String(number),
    pages: 10,
    translatedLanguage: 'en',
    publishAt: '2026-01-01T00:00:00.000Z',
    isUnavailable: false,
    scanlationGroup: {}
  }
}

// Oldest first, as the chapter list in state always is
const CHAPTERS = [chapter(1), chapter(2), chapter(3)]

type Props = Parameters<typeof ChapterList>[0]

function renderList(overrides: Partial<Props> = {}): { onRetry: ReturnType<typeof vi.fn> } {
  const onRetry = vi.fn()
  render(
    <ChapterList
      mangaId="manga-1"
      manga={{ availableTranslatedLanguages: ['en'] } as unknown as MangaContract}
      chapters={CHAPTERS}
      selectedLanguage="en"
      sortOrder="desc"
      loading={false}
      error={null}
      showErrorDetails={false}
      progress={null}
      chapterProgress={new Map()}
      onLanguageChange={vi.fn()}
      onSortChange={vi.fn()}
      onRetry={onRetry}
      onToggleErrorDetails={vi.fn()}
      chaptersComplete
      chaptersTotal={3}
      chaptersLoadedFrom={undefined}
      chaptersLoadFailed={false}
      chaptersFilterLanguage="en"
      {...overrides}
    />
  )
  return { onRetry }
}

/** The rows of the list, top to bottom, as 'ch:<number>' or 'loading' */
function rows(): string[] {
  const list = document.querySelector('.chapter-list-items')
  return Array.from(list?.children ?? []).map((row) =>
    row.getAttribute('role') === 'status'
      ? 'loading'
      : `ch:${row.querySelector('.chapter-item__number')?.textContent?.replace('Ch. ', '')}`
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('display order', () => {
  it('lists the newest chapter first when sorted newest first', () => {
    renderList({ sortOrder: 'desc' })

    expect(rows()).toEqual(['ch:3', 'ch:2', 'ch:1'])
  })

  it('lists the oldest chapter first when sorted oldest first', () => {
    renderList({ sortOrder: 'asc' })

    expect(rows()).toEqual(['ch:1', 'ch:2', 'ch:3'])
  })
})

describe('a long series that is still loading', () => {
  it("puts the older chapters' placeholder at the bottom of a newest-first list", () => {
    renderList({ sortOrder: 'desc', chaptersComplete: false, chaptersLoadedFrom: 'newest' })

    expect(rows()).toEqual(['ch:3', 'ch:2', 'ch:1', 'loading'])
  })

  it("puts the older chapters' placeholder at the top of an oldest-first list", () => {
    renderList({ sortOrder: 'asc', chaptersComplete: false, chaptersLoadedFrom: 'newest' })

    expect(rows()).toEqual(['loading', 'ch:1', 'ch:2', 'ch:3'])
  })

  it("puts the newer chapters' placeholder at the bottom of an oldest-first list", () => {
    renderList({ sortOrder: 'asc', chaptersComplete: false, chaptersLoadedFrom: 'oldest' })

    expect(rows()).toEqual(['ch:1', 'ch:2', 'ch:3', 'loading'])
  })

  it("puts the newer chapters' placeholder at the top of a newest-first list", () => {
    renderList({ sortOrder: 'desc', chaptersComplete: false, chaptersLoadedFrom: 'oldest' })

    expect(rows()).toEqual(['loading', 'ch:3', 'ch:2', 'ch:1'])
  })

  it('says which chapters are coming and how many have arrived', () => {
    renderList({
      chaptersComplete: false,
      chaptersLoadedFrom: 'newest',
      chaptersTotal: 1240
    })

    expect(screen.getByRole('status').textContent).toBe('mangaDetail:chapters.loadingOlder:3/1240')
  })

  it('names the newer chapters when the older ones arrived first', () => {
    renderList({ chaptersComplete: false, chaptersLoadedFrom: 'oldest', chaptersTotal: 1240 })

    expect(screen.getByRole('status').textContent).toBe('mangaDetail:chapters.loadingNewer:3/1240')
  })

  it('shows how many of the total have loaded in the heading', () => {
    renderList({ chaptersComplete: false, chaptersLoadedFrom: 'newest', chaptersTotal: 1240 })

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Chapters (3 of 1240)')
  })

  it('offers a retry instead of the spinner once a later page has failed', () => {
    const { onRetry } = renderList({
      chaptersComplete: false,
      chaptersLoadedFrom: 'newest',
      chaptersLoadFailed: true
    })

    expect(screen.getByRole('status').textContent).toContain('mangaDetail:chapters.loadFailed')
    fireEvent.click(screen.getByRole('button', { name: 'common:button.retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows no placeholder, and the plain heading, once everything has loaded', () => {
    renderList({ chaptersComplete: true, chaptersLoadedFrom: 'newest', chaptersTotal: 3 })

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Chapters (3)')
  })

  it('does not offer Download All until everything has loaded', () => {
    renderList({ chaptersComplete: false, chaptersLoadedFrom: 'newest' })

    const button = screen.getByRole('button', { name: /download all is available once every/i })
    expect(button).toHaveProperty('disabled', true)
  })
})

describe('Download All', () => {
  it('queues the chapters oldest first even when the list is shown newest first', () => {
    renderList({ sortOrder: 'desc' })

    fireEvent.click(screen.getByRole('button', { name: /download all 3 chapters/i }))

    expect(handleDownloadAllClick).toHaveBeenCalledTimes(1)
    const queued = handleDownloadAllClick.mock.calls[0][0] as ChapterContract[]
    expect(queued.map((entry) => entry.chapter)).toEqual(['1', '2', '3'])
  })
})

describe('opening a chapter', () => {
  it('hands the reader the list oldest first, not the order shown', () => {
    renderList({ sortOrder: 'desc' })

    fireEvent.click(screen.getByRole('button', { name: 'Read Chapter 3: Untitled' }))

    const [path, options] = navigate.mock.calls[0]
    expect(path).toBe('/reader/manga-1/c-3')
    expect((options.state.chapters as ChapterContract[]).map((entry) => entry.chapter)).toEqual([
      '1',
      '2',
      '3'
    ])
  })

  it('tells the reader the list is incomplete, and what language it is filtered to', () => {
    renderList({
      chaptersComplete: false,
      chaptersLoadedFrom: 'newest',
      chaptersFilterLanguage: 'en'
    })

    fireEvent.click(screen.getByRole('button', { name: 'Read Chapter 3: Untitled' }))

    expect(navigate.mock.calls[0][1].state).toEqual(
      expect.objectContaining({ chaptersComplete: false, chapterLanguage: 'en' })
    )
  })
})

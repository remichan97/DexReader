import { act, render, screen, waitFor } from '@testing-library/react'
import { ContentRating, PublicationStatus } from '@shared/enums/mangadex'
import MangaHeroSection from './MangaHeroSection'
import type { ChapterContract } from '../../../../../../preload/window.types'

const showDialog = vi.fn()
const showConfirmDialog = vi.fn()
const deleteManga = vi.fn()
const getDownloadStats = vi.fn()
const getSettingByPath = vi.fn()
const showToast = vi.fn()

const navigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate
}))

vi.mock('@renderer/hooks/useSecureNavigation', () => ({
  useSecureNavigation: () => ({ secureNavigate: vi.fn() })
}))

vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string | undefined) ?? key
  })
}))

// Stable object/array references matter here, same as useCollectionManager's mock:
// a fresh literal on every call would give unstable identities to anything a child
// effect depends on. Kept as a single object for consistency even though this
// component's own effect only depends on manga.id.
const libraryState = {
  isFavourite: () => false,
  toggleFavourite: vi.fn(),
  loadFavourites: vi.fn()
}

vi.mock('@renderer/stores', () => ({
  useLibraryStore: (selector?: (state: typeof libraryState) => unknown) =>
    selector ? selector(libraryState) : libraryState,
  useToastStore: (selector: (state: { show: typeof showToast }) => unknown) =>
    selector({ show: showToast })
}))

vi.mock('@renderer/stores/connectivityStore', () => ({
  useConnectivityStore: (selector: (state: { isOnline: boolean }) => unknown) =>
    selector({ isOnline: true })
}))

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

function buildManga(): Parameters<typeof MangaHeroSection>[0]['manga'] {
  return {
    id: 'manga-1',
    title: { en: 'Test Manga' },
    altTitles: [],
    description: { en: '' },
    links: {},
    status: PublicationStatus.Ongoing,
    contentRating: ContentRating.Safe,
    tags: [],
    availableTranslatedLanguages: [],
    authors: [],
    artists: []
    // This is the flat MangaContract DTO the component actually consumes
    // (post Phase-4 DTO migration) - not the raw MangaDex API entity shape.
    // Every field this component reads directly (tags/authors/artists) needs
    // a real array here; the rest go through mangaHelpers.ts, which degrades
    // gracefully for missing optional fields.
  }
}

async function renderAndOpenManageDownloads(): Promise<void> {
  render(<MangaHeroSection manga={buildManga()} chapters={[]} progress={null} />)

  const manageButton = await screen.findByRole('button', { name: 'Manage Downloads' })

  // Selecting "Delete All Chapters" (index 1 of [addToLibrary, deleteAll, cancel])
  showDialog.mockResolvedValue({
    success: true,
    data: { response: 1, checkboxChecked: false }
  })

  await act(async () => {
    manageButton.click()
  })
}

describe('MangaHeroSection - manage downloads delete flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getSettingByPath.mockImplementation((_section: unknown, path: unknown) => {
      const values: Record<string, unknown> = {
        downloadPath: 'D:\\Downloads',
        defaultQuality: 'data',
        shouldConfirmDownload: 'always'
      }
      return Promise.resolve({ success: true, data: values[path as string] })
    })
    getDownloadStats.mockResolvedValue({
      success: true,
      data: { chapterCount: 3, totalBytes: 1000 }
    })

    // See useCollectionManager.test.ts for why these casts exist: index.d.ts's
    // declared return types for these dialog channels are stale relative to what
    // wrapIpcHandler actually sends at runtime (IpcResponse<T>, not the bare T
    // the .d.ts currently claims).
    globalThis.settings = { getSettingByPath } as unknown as typeof globalThis.settings
    globalThis.downloads = {
      getDownloadStats,
      deleteManga
    } as unknown as typeof globalThis.downloads
    globalThis.api = {
      showDialog,
      showConfirmDialog
    } as unknown as typeof globalThis.api
  })

  it('does not delete when the delete-downloads confirm dialog is declined', async () => {
    showConfirmDialog.mockResolvedValue({ success: true, data: false })

    await renderAndOpenManageDownloads()

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled())
    expect(deleteManga).not.toHaveBeenCalled()
  })

  it('does not throw and does not delete when the confirm dialog IPC call fails', async () => {
    showConfirmDialog.mockResolvedValue({ success: false, error: { message: 'dialog failed' } })

    await expect(renderAndOpenManageDownloads()).resolves.not.toThrow()

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled())
    expect(deleteManga).not.toHaveBeenCalled()
  })
})

function buildChapter(id: string, chapter: string): ChapterContract {
  return {
    id,
    chapter,
    pages: 10,
    translatedLanguage: 'en',
    publishAt: '2026-01-01T00:00:00.000Z',
    isUnavailable: false,
    scanlationGroup: {}
  }
}

// The chapters in state are oldest first
const LOADED_CHAPTERS = [buildChapter('c-10', '10'), buildChapter('c-11', '11')]

const progressOn = (lastChapterId: string): never =>
  ({ mangaId: 'manga-1', lastChapterId, currentPage: 4 }) as never

function setUpGlobals(): void {
  getSettingByPath.mockImplementation((_section: unknown, path: unknown) => {
    const values: Record<string, unknown> = {
      downloadPath: 'D:\\Downloads',
      defaultQuality: 'data',
      shouldConfirmDownload: 'never'
    }
    return Promise.resolve({ success: true, data: values[path as string] })
  })
  getDownloadStats.mockResolvedValue({ success: true, data: { chapterCount: 0, totalBytes: 0 } })
  globalThis.settings = { getSettingByPath } as unknown as typeof globalThis.settings
  globalThis.downloads = { getDownloadStats, deleteManga } as unknown as typeof globalThis.downloads
  globalThis.api = { showDialog, showConfirmDialog } as unknown as typeof globalThis.api
}

describe('MangaHeroSection - a chapter list that is still loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setUpGlobals()
  })

  it('disables Start Reading until every chapter has loaded, since the first one may be missing', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={null}
        chaptersComplete={false}
      />
    )

    const start = await screen.findByRole('button', { name: 'Start Reading' })

    expect(start).toHaveProperty('disabled', true)
    expect(start.getAttribute('title')).toBe('Loading every chapter…')
    start.click()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('enables Continue when the chapter being read is already loaded', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={progressOn('c-11')}
        chaptersComplete={false}
      />
    )

    const resume = await screen.findByRole('button', { name: 'Continue' })

    expect(resume).toHaveProperty('disabled', false)
  })

  it('disables Continue when the chapter being read has not loaded yet', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={progressOn('c-3')}
        chaptersComplete={false}
      />
    )

    const resume = await screen.findByRole('button', { name: 'Continue' })

    expect(resume).toHaveProperty('disabled', true)
  })

  it('disables Download All until every chapter has loaded', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={null}
        chaptersComplete={false}
      />
    )

    const downloadAll = await screen.findByRole('button', { name: 'Download All' })

    await waitFor(() =>
      expect(downloadAll.getAttribute('title')).toBe('Available once every chapter has loaded')
    )
    expect(downloadAll).toHaveProperty('disabled', true)
  })

  it('hands the reader the list, its completeness and its language when reading starts', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={null}
        chaptersComplete
        chaptersFilterLanguage="en"
      />
    )

    const start = await screen.findByRole('button', { name: 'Start Reading' })
    expect(start).toHaveProperty('disabled', false)
    start.click()

    expect(navigate).toHaveBeenCalledWith(
      '/reader/manga-1/c-10',
      expect.objectContaining({
        state: expect.objectContaining({
          chapters: LOADED_CHAPTERS,
          chaptersComplete: true,
          chapterLanguage: 'en'
        })
      })
    )
  })

  it('starts at the oldest chapter, the first in the list, not the newest', async () => {
    render(<MangaHeroSection manga={buildManga()} chapters={LOADED_CHAPTERS} progress={null} />)
    ;(await screen.findByRole('button', { name: 'Start Reading' })).click()

    expect(navigate.mock.calls[0][0]).toBe('/reader/manga-1/c-10')
  })

  it('continues from where the reader left off, and passes the incomplete list on', async () => {
    render(
      <MangaHeroSection
        manga={buildManga()}
        chapters={LOADED_CHAPTERS}
        progress={progressOn('c-11')}
        chaptersComplete={false}
        chaptersFilterLanguage="en"
      />
    )
    ;(await screen.findByRole('button', { name: 'Continue' })).click()

    expect(navigate).toHaveBeenCalledWith(
      '/reader/manga-1/c-11',
      expect.objectContaining({
        state: expect.objectContaining({
          startPage: 4,
          chaptersComplete: false,
          chapterLanguage: 'en'
        })
      })
    )
  })
})

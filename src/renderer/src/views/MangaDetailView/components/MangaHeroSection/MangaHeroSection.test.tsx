import { act, render, screen, waitFor } from '@testing-library/react'
import { ContentRating, PublicationStatus } from '@shared/enums/mangadex'
import MangaHeroSection from './MangaHeroSection'

const showDialog = vi.fn()
const showConfirmDialog = vi.fn()
const deleteManga = vi.fn()
const getDownloadStats = vi.fn()
const getSettingByPath = vi.fn()
const showToast = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
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

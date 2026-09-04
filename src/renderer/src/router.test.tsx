import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from './router'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('./views/BrowseView', () => ({ BrowseView: () => <div>BrowseView stub</div> }))
vi.mock('./views/CreatorView', () => ({ CreatorView: () => <div>CreatorView stub</div> }))
vi.mock('./views/LibraryView', () => ({ LibraryView: () => <div>LibraryView stub</div> }))
vi.mock('./views/HistoryView', () => ({ HistoryView: () => <div>HistoryView stub</div> }))
vi.mock('./views/ReaderView', () => ({ ReaderView: () => <div>ReaderView stub</div> }))
vi.mock('./views/SettingsView', () => ({ SettingsView: () => <div>SettingsView stub</div> }))
vi.mock('./views/DownloadsView', () => ({ DownloadsView: () => <div>DownloadsView stub</div> }))
vi.mock('./views/NotFoundView', () => ({ NotFoundView: () => <div>NotFoundView stub</div> }))
vi.mock('./views/MangaDetailView', () => ({
  MangaDetailView: () => <div>MangaDetailView stub</div>
}))

// This is a routing smoke test, not per-view coverage: every view is stubbed out so a
// future react-router bump can't silently break which component a path resolves to,
// without needing each view's own IPC/store dependencies wired up here.
function renderAtPath(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes startupRoute="/library" />
    </MemoryRouter>
  )
}

describe('AppRoutes', () => {
  it.each([
    ['/', 'LibraryView stub'],
    ['/browse', 'BrowseView stub'],
    ['/browse/manga-1', 'MangaDetailView stub'],
    ['/creator/author/creator-1', 'CreatorView stub'],
    ['/library', 'LibraryView stub'],
    ['/history', 'HistoryView stub'],
    ['/reader/manga-1/chapter-1', 'ReaderView stub'],
    ['/settings', 'SettingsView stub'],
    ['/downloads', 'DownloadsView stub'],
    ['/some/unknown/path', 'NotFoundView stub']
  ])('resolves %s to the expected view', (path, expectedText) => {
    renderAtPath(path)
    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })
})

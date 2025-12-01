import type { JSX } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ViewTransition } from './components/ViewTransition'
import { BrowseView } from './views/BrowseView'
import { LibraryView } from './views/LibraryView'
import { ReaderView } from './views/ReaderView'
import { SettingsView } from './views/SettingsView'
import { DownloadsView } from './views/DownloadsView'
import { NotFoundView } from './views/NotFoundView'

export function AppRoutes(): JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')

  return (
    <ViewTransition key={isReaderRoute ? 'reader' : location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowseView />} />
        <Route path="/library" element={<LibraryView />} />
        <Route path="/reader/:mangaId/:chapterId" element={<ReaderView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/downloads" element={<DownloadsView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </ViewTransition>
  )
}

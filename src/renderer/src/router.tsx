import type { JSX } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ViewTransition } from './components/ViewTransition'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BrowseView } from './views/BrowseView'
import { LibraryView } from './views/LibraryView'
import { HistoryView } from './views/HistoryView'
import { ReaderView } from './views/ReaderView'
import { SettingsView } from './views/SettingsView'
import { DownloadsView } from './views/DownloadsView'
import { NotFoundView } from './views/NotFoundView'
import { MangaDetailView } from './views/MangaDetailView'

export function AppRoutes(): JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')

  return (
    <ViewTransition key={isReaderRoute ? 'reader' : location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route
          path="/browse"
          element={
            <ErrorBoundary level="page">
              <BrowseView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/browse/:mangaId"
          element={
            <ErrorBoundary level="page">
              <MangaDetailView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/library"
          element={
            <ErrorBoundary level="page">
              <LibraryView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/history"
          element={
            <ErrorBoundary level="page">
              <HistoryView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/reader/:mangaId/:chapterId"
          element={
            <ErrorBoundary level="page">
              <ReaderView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary level="page">
              <SettingsView />
            </ErrorBoundary>
          }
        />
        <Route
          path="/downloads"
          element={
            <ErrorBoundary level="page">
              <DownloadsView />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </ViewTransition>
  )
}

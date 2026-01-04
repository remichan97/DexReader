import { BrowserRouter, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAccentColor } from './hooks/useAccentColor'
import { useIncognitoListener } from './hooks/useIncognitoListener'
import { ToastContainer } from './components/Toast'
import { useToastStore, useProgressStore, useLibraryStore } from './stores'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProgressRing } from './components/ProgressRing'

function AppContent(): React.JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')
  const flushPendingSaves = useProgressStore((state) => state.flushPendingSaves)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)
  const [isClosing, setIsClosing] = useState(false)

  // Listen for navigation commands from menu
  useNavigationListener()

  // Listen for incognito toggle from menu
  useIncognitoListener()

  // Handle keyboard shortcuts
  useKeyboardShortcuts()

  // Load and apply accent color on app startup
  useAccentColor()

  // Preload library data on app startup so Browse view shows correct favorite state
  useEffect(() => {
    void loadFavourites()
  }, [loadFavourites])

  // Flush pending progress saves before app closes
  useEffect(() => {
    const handleFlushRequest = async (): Promise<void> => {
      setIsClosing(true)
      // Signal main process that flush is complete
      window.electron?.ipcRenderer.send('flush-complete')
    }

    window.electron?.ipcRenderer.on('flush-pending-saves', handleFlushRequest)

    return () => {
      window.electron?.ipcRenderer.removeListener('flush-pending-saves', handleFlushRequest)
    }
  }, [flushPendingSaves])

  // Reader gets full screen without sidebar
  if (isReaderRoute) {
    return (
      <>
        <AppRoutes />
        {isClosing && <ClosingOverlay />}
      </>
    )
  }

  // Other views get AppShell with sidebar
  return (
    <>
      <AppShell>
        <AppRoutes />
      </AppShell>
      {isClosing && <ClosingOverlay />}
    </>
  )
}

function ClosingOverlay(): React.JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 99999,
        color: 'white'
      }}
    >
      <ProgressRing size="large" />
      <div style={{ fontSize: '16px', fontWeight: 500 }}>Saving progress...</div>
      <div style={{ fontSize: '14px', opacity: 0.7 }}>Please wait</div>
    </div>
  )
}

function App(): React.JSX.Element {
  // Global toast state
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismiss)

  return (
    <ErrorBoundary
      level="app"
      onError={(error, errorInfo) => {
        // Log to console in dev, future: send to crash reporting
        console.error('[App Error]', error, errorInfo)
      }}
    >
      <BrowserRouter>
        <AppContent />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} position="bottom-right" />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

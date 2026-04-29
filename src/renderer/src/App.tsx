import { HashRouter, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAccentColor } from './hooks/useAccentColor'
import { useIncognitoListener } from './hooks/useIncognitoListener'
import { useConnectivityListener } from './hooks/useConnectivityListener'
import { ToastContainer } from './components/Toast'
import { useToastStore, useProgressStore, useLibraryStore } from './stores'
import { useConnectivityStore } from './stores/connectivityStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProgressRing } from './components/ProgressRing'
import { UnsavedChangesProvider } from './contexts/UnsavedChangesProvider'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { rendererLog } from './services/logging.service'

/**
 * Map startup page setting to route path
 */
function mapStartupPageToRoute(startupPage: string): string {
  switch (startupPage) {
    case 'library':
      return '/library'
    case 'downloads':
      return '/downloads'
    case 'browse':
    default:
      return '/browse'
  }
}

function AppContent(): React.JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')
  const flushPendingSaves = useProgressStore((state) => state.flushPendingSaves)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)
  const startPolling = useConnectivityStore((state) => state.startPolling)
  const stopPolling = useConnectivityStore((state) => state.stopPolling)
  const [isClosing, setIsClosing] = useState(false)
  const [startupRoute, setStartupRoute] = useState<string | null>(null)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string>('')

  // Load startup page preference from settings
  useEffect(() => {
    async function loadStartupPreference(): Promise<void> {
      try {
        const settings = await globalThis.settings.load()
        if (settings.success) {
          const route = mapStartupPageToRoute(settings.data.appearance.startupPage)
          setStartupRoute(route)
          return
        }
        // If loading fails, fall back to default
        setStartupRoute('/browse')
      } catch (error) {
        rendererLog.error('[App] Failed to load startup page setting:', error)
        // Fall back to default
        setStartupRoute('/browse')
      }
    }
    void loadStartupPreference()
  }, [])

  // Check for update completion flag on startup
  useEffect(() => {
    async function checkForUpdateCompletion(): Promise<void> {
      try {
        const flagValue = localStorage.getItem('dexreader:updateJustCompleted')

        if (flagValue === 'true') {
          // Get version from localStorage (set before quit)
          const storedVersion = localStorage.getItem('dexreader:newVersion')

          // Fallback to app version if storage failed
          let version = storedVersion || ''
          if (!version) {
            const versionResult = await globalThis.appUpdate.getAppVersion()
            version = versionResult.data || 'unknown'
          }

          setUpdateVersion(version)
          setShowUpdateBanner(true)

          // Clear flags immediately (one-time trigger)
          localStorage.removeItem('dexreader:updateJustCompleted')
          localStorage.removeItem('dexreader:newVersion')

          rendererLog.info(`[App] Update detected, showing banner for v${version}`)
        }
      } catch (error) {
        rendererLog.error('[App] Failed to check update completion flag:', error)
        // Clean up flags even on error
        localStorage.removeItem('dexreader:updateJustCompleted')
        localStorage.removeItem('dexreader:newVersion')
      }
    }

    void checkForUpdateCompletion()
  }, [])

  const handleDismissBanner = (): void => {
    setShowUpdateBanner(false)
    rendererLog.info('[App] Update banner dismissed by user')
  }

  const handleViewReleaseNotes = async (): Promise<void> => {
    try {
      const repoUrl = 'https://github.com/remichan97/DexReader'
      const releaseUrl = `${repoUrl}/releases/tag/v${updateVersion}`

      // Open in external browser
      globalThis.open(releaseUrl, '_blank', 'noopener,noreferrer')

      // Auto-dismiss banner after opening release notes
      handleDismissBanner()
    } catch (error) {
      rendererLog.error('[App] Failed to open release notes:', error)
      // Don't auto-dismiss on error - let user try again or manually dismiss
    }
  }

  // Listen for navigation commands from menu
  useNavigationListener()

  // Listen for incognito toggle from menu
  useIncognitoListener()

  // Listen for connectivity toggle from menu
  useConnectivityListener()

  // Handle keyboard shortcuts
  useKeyboardShortcuts()

  // Load and apply accent color on app startup
  useAccentColor()

  // Preload library data on app startup so Browse view shows correct favorite state
  useEffect(() => {
    void loadFavourites()
  }, [loadFavourites])

  // Initialize connectivity polling
  useEffect(() => {
    // Start periodic connectivity checks
    startPolling()

    // Initial check on mount
    void useConnectivityStore.getState().checkConnectivity()

    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  const { hasUnsavedChanges } = useUnsavedChanges()

  // Notify main process about unsaved changes state
  useEffect(() => {
    globalThis.electron?.ipcRenderer
      .invoke('set-has-unsaved-changes', hasUnsavedChanges)
      .catch(() => {
        // Ignore errors
      })
  }, [hasUnsavedChanges])

  // Flush pending progress saves before app closes
  useEffect(() => {
    const handleFlushRequest = async (): Promise<void> => {
      setIsClosing(true)
      // Allow pending save operations to complete
      await flushPendingSaves()
      // Signal main process that flush is complete
      globalThis.electron?.ipcRenderer.send('flush-complete')
    }

    globalThis.electron?.ipcRenderer.on('flush-pending-saves', handleFlushRequest)

    return () => {
      globalThis.electron?.ipcRenderer.removeListener('flush-pending-saves', handleFlushRequest)
    }
  }, [flushPendingSaves])

  // Show loading state while fetching startup preference
  if (!startupRoute) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ProgressRing size="large" />
      </div>
    )
  }

  // Reader gets full screen without sidebar
  if (isReaderRoute) {
    return (
      <>
        <AppRoutes startupRoute={startupRoute} />
        {isClosing && <ClosingOverlay />}
      </>
    )
  }

  // Other views get AppShell with sidebar
  return (
    <>
      <AppShell
        showUpdateBanner={showUpdateBanner}
        updateVersion={updateVersion}
        onDismissBanner={handleDismissBanner}
        onViewReleaseNotes={handleViewReleaseNotes}
      >
        <AppRoutes startupRoute={startupRoute} />
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
      <div style={{ fontSize: '16px', fontWeight: 500 }}>A little bit of house keeping...</div>
      <div style={{ fontSize: '14px', opacity: 0.7 }}>Hang tight...</div>
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
        // Log to structured logger (goes to renderer.log file)
        rendererLog.error('[App] Critical error:', error, errorInfo)
      }}
    >
      <HashRouter>
        <UnsavedChangesProvider>
          <AppContent />
        </UnsavedChangesProvider>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} position="bottom-right" />
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App

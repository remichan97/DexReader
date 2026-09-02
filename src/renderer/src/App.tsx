import { HashRouter, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useAccentColor } from './hooks/useAccentColor'
import { KeyboardShortcutsHandler } from './components/KeyboardShortcutsHandler'
import { useIncognitoListener } from './hooks/useIncognitoListener'
import { useConnectivityListener } from './hooks/useConnectivityListener'
import { useGatekeeperGuard } from './hooks/useGatekeeperGuard'
import { useStartupTheme } from './hooks/useStartupTheme'
import { useStartupLanguage } from './hooks/useStartupLanguage'
import { useStartupRoute } from './hooks/useStartupRoute'
import { useUpdateBanner } from './hooks/useUpdateBanner'
import { ToastContainer } from './components/Toast'
import { useToastStore, useProgressStore, useLibraryStore } from './stores'
import { useConnectivityStore } from './stores/connectivityStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProgressRing } from './components/ProgressRing'
import { GatekeeperUnlockScreen } from './views/GatekeeperUnlockScreen'
import { GatekeeperReauthModal } from './components/GatekeeperReauthModal'
import { UnsavedChangesProvider } from './contexts/UnsavedChangesProvider'
import { SecureNavigationProvider } from './contexts/SecureNavigationContext'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { rendererLog } from './services/logging.service'

function AppContent(): React.JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')
  const flushPendingSaves = useProgressStore((state) => state.flushPendingSaves)
  const loadFavourites = useLibraryStore((state) => state.loadFavourites)
  const startPolling = useConnectivityStore((state) => state.startPolling)
  const stopPolling = useConnectivityStore((state) => state.stopPolling)
  const [isClosing, setIsClosing] = useState(false)

  const startupRoute = useStartupRoute()
  useStartupTheme()
  useStartupLanguage()

  const {
    isLocked,
    isCheckingLock,
    unlock,
    showReauthModal,
    handleNavigate,
    handleReauthSuccess,
    handleReauthCancel
  } = useGatekeeperGuard()

  const { showUpdateBanner, updateVersion, handleDismissBanner, handleViewReleaseNotes } =
    useUpdateBanner()

  // Listen for incognito toggle from menu
  useIncognitoListener()

  // Listen for connectivity toggle from menu
  useConnectivityListener()

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
        // Silently ignore errors
        return undefined
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

  // Show Gatekeeper unlock screen if locked
  if (isCheckingLock) {
    // Show loading while checking Gatekeeper status
    return (
      <div className="flex items-center justify-center h-screen">
        <ProgressRing size="large" />
      </div>
    )
  }

  if (isLocked) {
    return <GatekeeperUnlockScreen onUnlock={unlock} />
  }

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
      <SecureNavigationProvider onNavigate={handleNavigate}>
        <KeyboardShortcutsHandler />
        <AppRoutes startupRoute={startupRoute} />
        {isClosing && <ClosingOverlay />}
        <GatekeeperReauthModal
          isOpen={showReauthModal}
          onSuccess={handleReauthSuccess}
          onCancel={handleReauthCancel}
        />
      </SecureNavigationProvider>
    )
  }

  // Other views get AppShell with sidebar
  return (
    <SecureNavigationProvider onNavigate={handleNavigate}>
      <KeyboardShortcutsHandler />
      <AppShell
        showUpdateBanner={showUpdateBanner}
        updateVersion={updateVersion}
        onDismissBanner={handleDismissBanner}
        onViewReleaseNotes={handleViewReleaseNotes}
        onNavigate={handleNavigate}
      >
        <AppRoutes startupRoute={startupRoute} />
      </AppShell>
      {isClosing && <ClosingOverlay />}
      <GatekeeperReauthModal
        isOpen={showReauthModal}
        onSuccess={handleReauthSuccess}
        onCancel={handleReauthCancel}
      />
    </SecureNavigationProvider>
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

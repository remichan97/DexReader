import { BrowserRouter, useLocation } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAccentColor } from './hooks/useAccentColor'
import { useIncognitoListener } from './hooks/useIncognitoListener'
import { ToastContainer } from './components/Toast'
import { useToastStore } from './stores'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppContent(): React.JSX.Element {
  const location = useLocation()
  const isReaderRoute = location.pathname.startsWith('/reader/')

  // Listen for navigation commands from menu
  useNavigationListener()

  // Listen for incognito toggle from menu
  useIncognitoListener()

  // Handle keyboard shortcuts
  useKeyboardShortcuts()

  // Load and apply accent color on app startup
  useAccentColor()

  // Reader gets full screen without sidebar
  if (isReaderRoute) {
    return <AppRoutes />
  }

  // Other views get AppShell with sidebar
  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
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

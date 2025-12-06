import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useAccentColor } from './hooks/useAccentColor'
import { ToastContainer } from './components/Toast'
import { useToastStore } from './stores'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppContent(): React.JSX.Element {
  // Listen for navigation commands from menu
  useNavigationListener()

  // Handle keyboard shortcuts
  useKeyboardShortcuts()

  // Load and apply accent color on app startup
  useAccentColor()

  return <AppRoutes />
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
        <AppShell>
          <AppContent />
        </AppShell>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} position="bottom-right" />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

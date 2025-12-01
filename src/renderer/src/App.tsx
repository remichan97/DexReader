import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function AppContent(): React.JSX.Element {
  // Listen for navigation commands from menu
  useNavigationListener()

  // Handle keyboard shortcuts
  useKeyboardShortcuts()

  return <AppRoutes />
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AppShell>
        <AppContent />
      </AppShell>
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AppRoutes } from './router'
import { useNavigationListener } from './hooks/useNavigationListener'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useState } from 'react'

interface AppContentProps {
  onToggleSidebar: () => void
}

function AppContent({ onToggleSidebar }: AppContentProps): React.JSX.Element {
  // Listen for navigation commands from menu
  useNavigationListener()

  // Handle keyboard shortcuts including sidebar toggle
  useKeyboardShortcuts({
    onToggleSidebar
  })

  return <AppRoutes />
}

function App(): React.JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <BrowserRouter>
      <AppShell sidebarCollapsed={sidebarCollapsed} onSidebarToggle={setSidebarCollapsed}>
        <AppContent onToggleSidebar={handleToggleSidebar} />
      </AppShell>
    </BrowserRouter>
  )
}

export default App

import type { JSX, ReactNode } from 'react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { OfflineStatusBar } from '../components/OfflineStatusBar'
import { useAppStore } from '@renderer/stores'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const theme = useAppStore((state) => state.theme)
  const setSystemTheme = useAppStore((state) => state.setSystemTheme)
  const location = useLocation()

  // Update document title based on current route
  useEffect(() => {
    const viewTitles: Record<string, string> = {
      '/': 'Browse',
      '/browse': 'Browse',
      '/library': 'Library',
      '/downloads': 'Downloads',
      '/reader': 'Reader',
      '/settings': 'Settings'
    }

    const viewTitle = viewTitles[location.pathname] || 'DexReader'
    document.title = `${viewTitle} - DexReader`
  }, [location.pathname])

  // Sync system theme from Electron main process
  useEffect(() => {
    window.api.getTheme().then(setSystemTheme)
    window.api.onThemeChanged(setSystemTheme)
  }, [setSystemTheme])

  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OfflineStatusBar />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

import type { JSX, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { OfflineStatusBar } from '../components/OfflineStatusBar'
import { IncognitoStatusBar } from '../components/IncognitoStatusBar'
import { KeyboardShortcutsDialog } from '../components/KeyboardShortcutsDialog'
import { useAppStore } from '@renderer/stores'
import './AppShell.css'

interface AppShellProps {
  readonly children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  const theme = useAppStore((state) => state.theme)
  const setSystemTheme = useAppStore((state) => state.setSystemTheme)
  const location = useLocation()
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Update document title based on current route (only for main views, not sub-views)
  useEffect(() => {
    // Skip title management for dynamic routes (handled by individual views)
    if (location.pathname.startsWith('/browse/') || location.pathname.startsWith('/reader/')) {
      return
    }

    const viewTitles: Record<string, string> = {
      '/': 'Browse',
      '/browse': 'Browse',
      '/library': 'Library',
      '/downloads': 'Downloads',
      '/settings': 'Settings'
    }

    const viewTitle = viewTitles[location.pathname] || 'DexReader'
    document.title = `${viewTitle} - DexReader`
  }, [location.pathname])

  // Sync system theme from Electron main process
  useEffect(() => {
    globalThis.api.getTheme().then((response) => {
      if (response.success && response.data) {
        setSystemTheme(response.data as 'light' | 'dark')
      }
    })
    globalThis.api.onThemeChanged(setSystemTheme)
  }, [setSystemTheme])

  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Listen for keyboard shortcuts dialog trigger
  useEffect(() => {
    const handleShowShortcuts = (): void => {
      setShowKeyboardShortcuts(true)
    }

    // IPC from menu
    globalThis.electron.ipcRenderer.on('show-shortcuts', handleShowShortcuts)

    // Custom event from keyboard hook
    globalThis.window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts)

    return () => {
      globalThis.electron.ipcRenderer.removeListener('show-shortcuts', handleShowShortcuts)
      globalThis.window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts)
    }
  }, [])

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OfflineStatusBar />
      <IncognitoStatusBar />
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>
      <KeyboardShortcutsDialog
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  )
}

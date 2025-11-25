import type { JSX, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
  sidebarCollapsed: boolean
  onSidebarToggle: (collapsed: boolean | ((prev: boolean) => boolean)) => void
}

export function AppShell({ children, sidebarCollapsed, onSidebarToggle }: AppShellProps): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get initial theme
    window.api.getTheme().then((initialTheme) => {
      setTheme(initialTheme)
      document.documentElement.setAttribute('data-theme', initialTheme)
    })

    // Listen for theme changes
    window.api.onThemeChanged((newTheme) => {
      setTheme(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    })

    // Listen for sidebar toggle from menu
    window.api.onToggleSidebar(() => {
      onSidebarToggle(!sidebarCollapsed)
    })
  }, [onSidebarToggle, sidebarCollapsed])

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app-shell__body">
        <Sidebar collapsed={sidebarCollapsed} onToggle={onSidebarToggle} />
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

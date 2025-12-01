import type { JSX, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps): JSX.Element {
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
  }, [])

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="app-shell__body">
        <Sidebar />
        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

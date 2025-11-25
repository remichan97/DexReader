import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface KeyboardShortcutHandlers {
  onToggleSidebar?: () => void
}

/**
 * Hook to handle global keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers = {}): void {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl key (Cmd on Mac)
      const isCtrl = event.ctrlKey || event.metaKey

      // Ctrl+1: Navigate to Browse
      if (isCtrl && event.key === '1') {
        event.preventDefault()
        navigate('/browse')
        return
      }

      // Ctrl+2: Navigate to Library
      if (isCtrl && event.key === '2') {
        event.preventDefault()
        navigate('/library')
        return
      }

      // Ctrl+3: Navigate to Downloads
      if (isCtrl && event.key === '3') {
        event.preventDefault()
        navigate('/downloads')
        return
      }

      // Ctrl+,: Navigate to Settings
      if (isCtrl && event.key === ',') {
        event.preventDefault()
        navigate('/settings')
        return
      }

      // Ctrl+B: Toggle Sidebar
      if (isCtrl && event.key === 'b') {
        event.preventDefault()
        if (handlers.onToggleSidebar) {
          handlers.onToggleSidebar()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate, handlers])
}

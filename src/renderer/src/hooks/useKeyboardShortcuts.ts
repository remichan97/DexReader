import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook to handle global keyboard shortcuts
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
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

      // Ctrl+/: Show keyboard shortcuts
      if (isCtrl && event.key === '/') {
        event.preventDefault()
        globalThis.window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'))
      }
    }

    globalThis.window.addEventListener('keydown', handleKeyDown)

    return () => {
      globalThis.window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate])
}

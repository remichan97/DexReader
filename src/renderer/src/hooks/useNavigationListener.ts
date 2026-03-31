import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Hook to listen for navigation commands from the main process
 */
export function useNavigationListener(): void {
  const navigate = useNavigate()

  useEffect(() => {
    // Listen for navigation commands from menu
    window.api.onNavigate((route) => {
      navigate(route)
    })
  }, [navigate])
}

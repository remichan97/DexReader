import type { JSX } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotFoundView(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const showErrorDialog = async (): Promise<void> => {
      await globalThis.api.showConfirmDialog(
        'Oops! Lost your way?',
        "This page doesn't exist. Let's get you back to browsing manga!"
      )

      // Navigate to browse regardless of response
      navigate('/browse')
    }

    showErrorDialog()
  }, [navigate])

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <h1>Whoops! 404</h1>
      <p>Taking you back...</p>
    </div>
  )
}

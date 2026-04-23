import { rendererLog } from '@renderer/services/logging.service'
import type { JSX } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotFoundView(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const showErrorDialog = async (): Promise<void> => {
      const result = await globalThis.api.showConfirmDialog(
        'Oops! Lost your way?',
        "What you're looking for isn't here. Let's get you back to browsing manga!"
      )

      if (!result.success) {
        rendererLog.error('[NotFoundView] Failed to show dialog:', result.error)
      }

      // Navigate to browse regardless of response
      navigate('/browse')
    }

    showErrorDialog()
  }, [navigate])

  // Render nothing since we're showing a dialog and will navigate away
  return <></>
}

import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { JSX } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotFoundView(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['dialogs'])

  useEffect(() => {
    const showErrorDialog = async (): Promise<void> => {
      const result = await globalThis.api.showConfirmDialog(
        t('dialogs:confirmations.notFound.title'),
        t('dialogs:confirmations.notFound.message')
      )

      if (!result.success) {
        rendererLog.error('[NotFoundView] Failed to show dialog:', result.error)
      }

      // Navigate to browse regardless of response
      navigate('/browse')
    }

    showErrorDialog()
  }, [navigate, t])

  // Render nothing since we're showing a dialog and will navigate away
  return <></>
}

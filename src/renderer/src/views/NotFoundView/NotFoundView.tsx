import { rendererLog } from '@renderer/services/logging.service'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { JSX } from 'react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function NotFoundView(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['dialogs'])
  // `t` gets a new identity whenever translations load, and StrictMode re-runs effects in
  // development, so the effect below can fire more than once. The dialog is a blocking native
  // one, so every extra run queues another that has to be dismissed separately.
  const hasShownDialogRef = useRef(false)

  useEffect(() => {
    if (hasShownDialogRef.current) return
    hasShownDialogRef.current = true

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

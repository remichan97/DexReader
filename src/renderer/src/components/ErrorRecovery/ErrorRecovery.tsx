import type { JSX, ReactNode } from 'react'
import { Warning24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ErrorRecovery.css'

interface ErrorRecoveryProps {
  readonly error: Error
  readonly onRetry: () => void
  readonly isRetrying?: boolean
  readonly children?: ReactNode
}

/**
 * Inline error recovery UI component
 * Shows a user-friendly error message with retry button
 */
export function ErrorRecovery({
  error,
  onRetry,
  isRetrying = false,
  children
}: ErrorRecoveryProps): JSX.Element {
  const { t } = useTranslation(['common'])
  const message = error.message || t('common:error.fallbackMessage')

  return (
    <div className="error-recovery">
      <div className="error-recovery__icon">
        <Warning24Regular />
      </div>
      <h3 className="error-recovery__title">{t('common:error.recoveryTitle')}</h3>
      <p className="error-recovery__message">{message}</p>
      {children && <div className="error-recovery__extra">{children}</div>}
      <Button variant="primary" onClick={onRetry} disabled={isRetrying} loading={isRetrying}>
        {isRetrying ? t('common:error.retrying') : t('common:error.tryAgain')}
      </Button>
    </div>
  )
}

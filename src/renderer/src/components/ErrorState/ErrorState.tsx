import { JSX, useState } from 'react'
import { Warning48Regular, CloudOff48Regular } from '@fluentui/react-icons'
import { Button } from '../Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ErrorState.css'

export interface ErrorStateProps {
  /**
   * Optional error title/heading
   * @example "Couldn't load this chapter"
   */
  title?: string

  /**
   * Error message to display
   * @example "Failed to load data"
   */
  message: string

  /**
   * Full Error object for technical details
   */
  error?: Error | null

  /**
   * Error state variant
   * - 'default': Standard error (red warning icon)
   * - 'offline': Offline/network error (cloud icon)
   * - 'critical': Critical system error
   * @default 'default'
   */
  variant?: 'default' | 'offline' | 'critical'

  /**
   * Optional retry handler
   */
  onRetry?: () => void

  /**
   * Optional secondary action (e.g., "Go Back")
   */
  secondaryAction?: {
    label: string
    onClick: () => void
  }

  /**
   * Whether to show technical details toggle
   * @default false
   */
  showTechnicalDetails?: boolean

  /**
   * Whether the retry action is currently loading
   * @default false
   */
  retrying?: boolean
}

/**
 * ErrorState component for consistent error handling
 *
 * Provides standardized error UI with optional retry logic,
 * offline detection, and technical details for debugging.
 *
 * @example
 * // Simple error
 * <ErrorState message="Failed to load data" />
 *
 * @example
 * // Error with retry
 * <ErrorState
 *   title="Couldn't load chapter"
 *   message="Network error occurred"
 *   onRetry={() => loadChapter()}
 * />
 *
 * @example
 * // Offline error
 * <ErrorState
 *   variant="offline"
 *   title="You're offline"
 *   message="Browse requires an internet connection"
 *   secondaryAction={{ label: 'Go to Library', onClick: () => navigate('/library') }}
 * />
 *
 * @example
 * // Comprehensive error with technical details
 * <ErrorState
 *   title="Something went wrong"
 *   message="An unexpected error occurred"
 *   error={error}
 *   onRetry={() => retry()}
 *   showTechnicalDetails={true}
 * />
 */
export function ErrorState({
  title,
  message,
  error,
  variant = 'default',
  onRetry,
  secondaryAction,
  showTechnicalDetails = false,
  retrying = false
}: Readonly<ErrorStateProps>): JSX.Element {
  const { t } = useTranslation(['common', 'errors'])
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  const icon = variant === 'offline' ? <CloudOff48Regular /> : <Warning48Regular />
  const defaultTitle =
    variant === 'offline'
      ? t('errors:network.offline.title')
      : t('common:message.error.somethingWentWrong')

  return (
    <div className={`error-state error-state--${variant}`} role="alert" aria-live="assertive">
      <div className="error-state__icon">{icon}</div>

      <h3 className="error-state__title">{title ?? defaultTitle}</h3>

      <p className="error-state__message">{message}</p>

      {(onRetry || secondaryAction || (showTechnicalDetails && error)) && (
        <div className="error-state__actions">
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              disabled={retrying}
              loading={retrying}
              size="medium"
            >
              {retrying ? t('common:button.retrying') : t('common:button.tryAgain')}
            </Button>
          )}

          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick} size="medium">
              {secondaryAction.label}
            </Button>
          )}

          {showTechnicalDetails && error && (
            <Button
              variant="ghost"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              size="medium"
            >
              {detailsExpanded ? t('common:action.hide') : t('common:action.show')} technical
              details
            </Button>
          )}
        </div>
      )}

      {showTechnicalDetails && error && detailsExpanded && (
        <div className="error-state__technical-details">
          <div>
            <strong>Error:</strong> {error.message}
          </div>
          {error.stack && (
            <div className="error-state__stack-trace">
              <strong>Stack Trace:</strong>
              <pre>{error.stack}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

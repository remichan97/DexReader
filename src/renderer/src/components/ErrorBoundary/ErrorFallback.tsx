import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ErrorBoundary.css'

interface ErrorFallbackProps {
  readonly error: Error
  readonly reset: () => void
  readonly level?: 'page' | 'component' | 'app'
}

export function DefaultErrorFallback({
  error,
  reset,
  level = 'page'
}: ErrorFallbackProps): React.JSX.Element {
  const { t } = useTranslation(['common'])
  const isCritical = level === 'app'

  return (
    <div className="error-fallback" data-level={level}>
      <div className="error-fallback__content">
        <div className="error-fallback__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 20h20L12 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M12 9v4M12 17h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="error-fallback__title">
          {isCritical ? t('common:error.criticalTitle') : t('common:error.componentTitle')}
        </h2>
        <p className="error-fallback__message">
          {isCritical ? t('common:error.criticalMessage') : t('common:error.componentMessage')}
        </p>
        <div className="error-fallback__details">
          <details>
            <summary>{t('common:error.technicalDetails')}</summary>
            <pre className="error-fallback__error-message">{error.message}</pre>
            {error.stack && <pre className="error-fallback__stack">{error.stack}</pre>}
          </details>
        </div>
        <div className="error-fallback__actions">
          <Button variant="primary" onClick={reset}>
            {t('common:error.tryAgain')}
          </Button>
          {isCritical && (
            <Button variant="secondary" onClick={() => globalThis.location.reload()}>
              {t('common:error.reloadApp')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

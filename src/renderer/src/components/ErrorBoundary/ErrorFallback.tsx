import { Button } from '@renderer/components/Button'
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
          {isCritical ? 'Oops, something broke' : "Can't load this right now"}
        </h2>
        <p className="error-fallback__message">
          {isCritical
            ? 'Something unexpected happened. Try reloading if this keeps happening.'
            : "This part isn't working right now. Try again or check out other sections."}
        </p>
        <div className="error-fallback__details">
          <details>
            <summary>Technical details</summary>
            <pre className="error-fallback__error-message">{error.message}</pre>
            {error.stack && <pre className="error-fallback__stack">{error.stack}</pre>}
          </details>
        </div>
        <div className="error-fallback__actions">
          <Button variant="primary" onClick={reset}>
            Try Again
          </Button>
          {isCritical && (
            <Button variant="secondary" onClick={() => globalThis.location.reload()}>
              Reload App
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

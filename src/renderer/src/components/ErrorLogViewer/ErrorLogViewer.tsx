import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { Copy24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { globalErrorHandler, type ErrorLogEntry } from '@renderer/utils/errorHandler'
import { useToastStore } from '@renderer/stores'
import './ErrorLogViewer.css'

export function ErrorLogViewer(): JSX.Element {
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([])
  const showToast = useToastStore((state) => state.show)

  const refreshLog = (): void => {
    setErrorLog(globalErrorHandler.getErrorLog())
  }

  const handleClearLog = (): void => {
    globalErrorHandler.clearErrorLog()
    setErrorLog([])
    showToast({
      variant: 'success',
      title: 'Error log cleared',
      message: 'All error entries have been removed.',
      duration: 3000
    })
  }

  const handleCopyLog = async (): Promise<void> => {
    const logText = errorLog
      .map((entry) => {
        return [
          `[${entry.timestamp}] ${entry.type}`,
          `Message: ${entry.message}`,
          entry.stack ? `Stack: ${entry.stack}` : '',
          entry.url ? `URL: ${entry.url}:${entry.line}:${entry.column}` : '',
          '---'
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(logText)
      showToast({
        variant: 'success',
        title: 'Copied to clipboard',
        message: 'Error log copied. You can paste it in a bug report.',
        duration: 3000
      })
    } catch {
      showToast({
        variant: 'error',
        title: "Couldn't copy",
        message: 'Failed to copy to clipboard. Try again?',
        duration: 3000
      })
    }
  }

  // Refresh log on mount
  useEffect(() => {
    refreshLog()
  }, [])

  return (
    <div className="error-log-viewer">
      <div className="error-log-header">
        <div>
          <h4 className="error-log-title">Error Log</h4>
          <p className="error-log-description">
            Recent errors for debugging. Copy and include in bug reports.
          </p>
        </div>
        <div className="error-log-actions">
          <Button
            variant="secondary"
            size="small"
            onClick={handleCopyLog}
            disabled={errorLog.length === 0}
            icon={<Copy24Regular />}
          >
            Copy All
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleClearLog}
            disabled={errorLog.length === 0}
            icon={<Delete24Regular />}
          >
            Clear Log
          </Button>
        </div>
      </div>

      <div className="error-log-content">
        {errorLog.length === 0 ? (
          <div className="error-log-empty">
            <p>No errors logged yet. That&apos;s good!</p>
          </div>
        ) : (
          <div className="error-log-entries">
            {errorLog.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="error-log-entry">
                <div className="error-log-entry-header">
                  <span className={`error-log-entry-type error-log-entry-type--${entry.type}`}>
                    {entry.type === 'error' ? 'Error' : 'Unhandled Promise'}
                  </span>
                  <span className="error-log-entry-timestamp">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="error-log-entry-message">{entry.message}</div>
                {entry.stack && (
                  <details className="error-log-entry-stack">
                    <summary>Stack Trace</summary>
                    <pre>{entry.stack}</pre>
                  </details>
                )}
                {entry.url && (
                  <div className="error-log-entry-location">
                    {entry.url}:{entry.line}:{entry.column}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

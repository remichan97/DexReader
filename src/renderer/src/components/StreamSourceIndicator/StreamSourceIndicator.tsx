import type { JSX } from 'react'
import { Globe20Filled, SaveArrowRight20Filled } from '@fluentui/react-icons'
import './StreamSourceIndicator.css'

export type StreamSource = 'online' | 'local'

interface StreamSourceIndicatorProps {
  readonly source: StreamSource
}

/**
 * StreamSourceIndicator - Passive indicator showing chapter stream source
 *
 * Displays whether the current chapter is being:
 * - Streamed from MangaDex API (online)
 * - Read from local storage (downloaded)
 *
 * This is a non-interactive, informational component.
 */
export function StreamSourceIndicator({ source }: StreamSourceIndicatorProps): JSX.Element {
  const isOnline = source === 'online'

  return (
    <div
      className={`stream-source-indicator stream-source-indicator--${source} inline-flex items-center justify-center`}
      title={isOnline ? 'Streaming from MangaDex' : 'Reading from local storage'}
      aria-label={isOnline ? 'Streaming from MangaDex' : 'Reading from local storage'}
    >
      {isOnline ? (
        <Globe20Filled className="stream-source-indicator__icon" />
      ) : (
        <SaveArrowRight20Filled className="stream-source-indicator__icon" />
      )}
    </div>
  )
}

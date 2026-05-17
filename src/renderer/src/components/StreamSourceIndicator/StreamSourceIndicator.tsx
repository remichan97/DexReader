import type { JSX } from 'react'
import { Globe20Filled, SaveArrowRight20Filled } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  const { t } = useTranslation('reader')
  const isOnline = source === 'online'
  const label = isOnline ? t('source.streamingOnline') : t('source.readingLocal')

  return (
    <div
      className={`stream-source-indicator stream-source-indicator--${source} inline-flex items-center justify-center`}
      title={label}
      aria-label={label}
    >
      {isOnline ? (
        <Globe20Filled className="stream-source-indicator__icon" />
      ) : (
        <SaveArrowRight20Filled className="stream-source-indicator__icon" />
      )}
    </div>
  )
}

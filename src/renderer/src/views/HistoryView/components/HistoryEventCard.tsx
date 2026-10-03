import type { JSX } from 'react'
import { History24Regular, PlayCircle24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { getLanguageName } from '@renderer/constants/language-list.constant'

type HistoryEventMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.readHistory.getEventsByDate>>['data']
>[number]

interface HistoryEventCardProps {
  readonly event: HistoryEventMetadata
  readonly onContinueReading: () => void
  readonly onRemove: () => void
}

/**
 * A single read event within the History feed/day view.
 *
 * Shares reading-history-card CSS with ReadingHistoryCard, but reads from a
 * HistoryEventMetadataContract instead of a MangaProgressMetadataContract, and
 * never shows its own date - the surrounding sticky day-header or "Read on
 * {{date}}" heading already conveys that.
 */
export function HistoryEventCard({
  event,
  onContinueReading,
  onRemove
}: HistoryEventCardProps): JSX.Element {
  const { t } = useTranslation(['history', 'common'])

  return (
    <div className="reading-history-card flex items-center gap-3">
      <div className="reading-history-card__cover">
        {event.coverUrl ? (
          <img src={event.coverUrl} alt={`${event.title} cover`} />
        ) : (
          <div className="reading-history-card__cover-placeholder flex items-center justify-center">
            <History24Regular />
          </div>
        )}
      </div>

      <div className="reading-history-card__info">
        <h3 className="reading-history-card__title">{event.title}</h3>
        <p className="reading-history-card__progress flex items-center gap-2 flex-wrap">
          Ch. {event.chapterNumber || '?'}
          {event.chapterTitle && `: ${event.chapterTitle}`}
          {event.language && (
            <span className="reading-history-card__language inline-flex items-center">
              {getLanguageName(event.language)}
            </span>
          )}
        </p>
      </div>

      <div className="reading-history-card__actions flex gap-2">
        <Button
          variant="primary"
          size="small"
          onClick={onContinueReading}
          icon={<PlayCircle24Regular />}
        >
          {t('common:button.continue')}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={onRemove}
          icon={<Delete24Regular />}
          aria-label={t('history:card.removeAriaLabel', { defaultValue: 'Remove from history' })}
        >
          {''}
        </Button>
      </div>
    </div>
  )
}

import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar24Filled,
  Calendar24Regular,
  Dismiss24Regular,
  History24Regular
} from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'
import { LoadingState } from '@renderer/components/LoadingState'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useHistoryStore } from '@renderer/stores/historyStore'
import { parseLocalDateString, toLocalDateString } from '@renderer/utils/historyDate.util'
import { HistoryCalendar } from './components/HistoryCalendar'
import { HistoryEventCard } from './components/HistoryEventCard'
import './HistoryView.css'

type HistoryEventMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.readHistory.getEventsByDate>>['data']
>[number]

interface HistorySection {
  readonly dateStr: string
  readonly label: string
  readonly events: HistoryEventMetadata[]
}

function groupEventsByDate(
  events: HistoryEventMetadata[],
  t: (key: string, options?: Record<string, unknown>) => string
): HistorySection[] {
  const todayStr = toLocalDateString(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = toLocalDateString(yesterday)

  const sectionByDate = new Map<string, HistorySection>()

  for (const event of events) {
    const existing = sectionByDate.get(event.readDate)
    if (existing) {
      existing.events.push(event)
      continue
    }

    const label =
      event.readDate === todayStr
        ? t('history:feed.today', { defaultValue: 'Today' })
        : event.readDate === yesterdayStr
          ? t('history:feed.yesterday', { defaultValue: 'Yesterday' })
          : parseLocalDateString(event.readDate).toLocaleDateString()

    sectionByDate.set(event.readDate, { dateStr: event.readDate, label, events: [event] })
  }

  return Array.from(sectionByDate.values())
}

export function HistoryView(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation(['history', 'common'])

  const deleteProgress = useProgressStore((state) => state.deleteProgress)
  const loadStatistics = useProgressStore((state) => state.loadStatistics)
  const statistics = useProgressStore((state) => state.statistics)

  const recentEvents = useHistoryStore((state) => state.recentEvents)
  const activeDates = useHistoryStore((state) => state.activeDates)
  const selectedDate = useHistoryStore((state) => state.selectedDate)
  const eventsForSelectedDate = useHistoryStore((state) => state.eventsForSelectedDate)
  const historyLoading = useHistoryStore((state) => state.loading)
  const loadRecentEvents = useHistoryStore((state) => state.loadRecentEvents)
  const loadActiveDates = useHistoryStore((state) => state.loadActiveDates)
  const refreshActiveDates = useHistoryStore((state) => state.refreshActiveDates)
  const selectDate = useHistoryStore((state) => state.selectDate)
  const clearSelectedDate = useHistoryStore((state) => state.clearSelectedDate)

  const [searchQuery, setSearchQuery] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(true)

  useEffect(() => {
    loadRecentEvents()
    loadStatistics()
  }, [loadRecentEvents, loadStatistics])

  useEffect(() => {
    document.title = t('history:documentTitle')
  }, [t])

  const isDateFiltered = selectedDate !== undefined
  const baseEvents = isDateFiltered ? eventsForSelectedDate : recentEvents

  const filteredEvents = searchQuery
    ? baseEvents.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseEvents

  const sections = useMemo(
    () => (isDateFiltered ? [] : groupEventsByDate(filteredEvents, t)),
    [isDateFiltered, filteredEvents, t]
  )

  const handleContinueReading = (event: HistoryEventMetadata): void => {
    if (!event.chapterId) {
      return
    }

    navigate(`/reader/${event.mangaId}/${event.chapterId}`, {
      state: {
        chapterNumber: event.chapterNumber,
        chapterTitle: event.chapterTitle,
        mangaTitle: event.title,
        startPage: 0
      }
    })
  }

  const handleRemove = async (mangaId: string): Promise<void> => {
    await deleteProgress(mangaId)
    loadStatistics()
    void refreshActiveDates()

    if (isDateFiltered && selectedDate) {
      void selectDate(selectedDate)
    } else {
      void loadRecentEvents()
    }
  }

  const selectedDateLabel = selectedDate
    ? parseLocalDateString(selectedDate).toLocaleDateString()
    : ''

  return (
    <div className="history-view flex flex-col">
      {/* Screen reader heading for page structure */}
      <h1 className="sr-only">{t('history:pageTitle')}</h1>

      {/* Statistics */}
      {statistics && (
        <div className="history-view__stats">
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalMangaRead}</span>
            <span className="stat-card__label">{t('history:stats.mangaRead')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalChaptersRead}</span>
            <span className="stat-card__label">{t('history:stats.chapters')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalPagesRead}</span>
            <span className="stat-card__label">{t('history:stats.pages')}</span>
          </div>
          <div className="stat-card flex flex-col items-center">
            <span className="stat-card__value">{statistics.totalEstimatedMinutesRead}</span>
            <span className="stat-card__label">{t('history:stats.minutes')}</span>
          </div>
        </div>
      )}

      {/* Search + calendar toggle */}
      <div className="history-view__search flex items-center gap-2">
        <input
          type="search"
          placeholder={t('history:searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="history-view__search-input"
        />
        <Button
          variant={calendarOpen ? 'primary' : 'secondary'}
          size="small"
          icon={calendarOpen ? <Calendar24Filled /> : <Calendar24Regular />}
          onClick={() => setCalendarOpen((open) => !open)}
          aria-pressed={calendarOpen}
          aria-label={t('history:calendar.toggleAriaLabel', { defaultValue: 'Toggle calendar' })}
        >
          {''}
        </Button>
      </div>

      {/* Calendar */}
      {calendarOpen && (
        <div className="history-view__calendar">
          <HistoryCalendar
            activeDates={activeDates}
            selectedDate={selectedDate}
            onSelectDate={(date) => void selectDate(date)}
            onMonthChange={(range) => void loadActiveDates(range)}
          />
        </div>
      )}

      {/* Content */}
      <div className="history-view__content">
        {isDateFiltered && (
          <div className="history-view__content-header flex items-center justify-between">
            <h2 className="history-view__content-title">
              {t('history:feed.readOnDate', {
                date: selectedDateLabel,
                defaultValue: 'Read on {{date}}'
              })}
            </h2>
            <Button
              variant="ghost"
              size="small"
              icon={<Dismiss24Regular />}
              onClick={clearSelectedDate}
            >
              {t('history:feed.clearFilter', { defaultValue: 'Clear filter' })}
            </Button>
          </div>
        )}

        {historyLoading && <LoadingState message={t('history:loadingState.message')} />}

        {!historyLoading && filteredEvents.length === 0 && !searchQuery && (
          <EmptyState
            icon={<History24Regular />}
            title={t('history:emptyState.title')}
            message={t('history:emptyState.message')}
            action={{
              label: t('history:emptyState.action'),
              onClick: () => navigate('/browse'),
              variant: 'primary'
            }}
          />
        )}

        {!historyLoading && filteredEvents.length === 0 && searchQuery && (
          <EmptyState message={t('history:searchEmpty', { query: searchQuery })} variant="search" />
        )}

        {!historyLoading && filteredEvents.length > 0 && isDateFiltered && (
          <div className="history-view__list flex flex-col gap-3">
            {filteredEvents.map((event) => (
              <HistoryEventCard
                key={event.id}
                event={event}
                onContinueReading={() => handleContinueReading(event)}
                onRemove={() => handleRemove(event.mangaId)}
              />
            ))}
          </div>
        )}

        {!historyLoading &&
          filteredEvents.length > 0 &&
          !isDateFiltered &&
          sections.map((section) => (
            <div key={section.dateStr} className="history-view__section">
              <h2 className="history-view__section-header">{section.label}</h2>
              <div className="history-view__list flex flex-col gap-3">
                {section.events.map((event) => (
                  <HistoryEventCard
                    key={event.id}
                    event={event}
                    onContinueReading={() => handleContinueReading(event)}
                    onRemove={() => handleRemove(event.mangaId)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

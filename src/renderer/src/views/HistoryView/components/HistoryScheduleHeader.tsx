import type { JSX } from 'react'
import { useState } from 'react'
import { Dismiss24Regular, Search24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Popover } from '@renderer/components/Popover'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { parseLocalDateString } from '@renderer/utils/historyDate.util'
import { HistoryCalendar } from './HistoryCalendar'

interface HistoryScheduleHeaderProps {
  readonly viewedMonth: Date
  readonly onViewedMonthChange: (month: Date) => void
  readonly activeDates: ReadonlySet<string>
  readonly selectedDate: string | undefined
  readonly onSelectDate: (date: string) => void
  readonly searchQuery: string
  readonly onSearchChange: (value: string) => void
  readonly onToday: () => void
}

/**
 * Compact toolbar above the schedule feed: a date label that opens the month
 * calendar in a Popover (floats over the feed instead of reflowing the page),
 * a search toggle, and a "Today" action that clears any date filter and
 * scrolls the feed back to the top.
 */
export function HistoryScheduleHeader({
  viewedMonth,
  onViewedMonthChange,
  activeDates,
  selectedDate,
  onSelectDate,
  searchQuery,
  onSearchChange,
  onToday
}: HistoryScheduleHeaderProps): JSX.Element {
  const { t, i18n } = useTranslation(['history', 'common'])
  const [searchOpen, setSearchOpen] = useState(false)
  const isSearchVisible = searchOpen || searchQuery.length > 0

  const dateLabel = selectedDate
    ? parseLocalDateString(selectedDate).toLocaleDateString()
    : new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(viewedMonth)

  const handleCloseSearch = (): void => {
    setSearchOpen(false)
    onSearchChange('')
  }

  if (isSearchVisible) {
    return (
      <div className="history-schedule-header flex items-center gap-2">
        <input
          type="search"
          autoFocus
          placeholder={t('history:searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="history-schedule-header__search-input"
        />
        <Button
          variant="ghost"
          size="small"
          icon={<Dismiss24Regular />}
          onClick={handleCloseSearch}
          aria-label={t('common:button.close')}
        >
          {''}
        </Button>
      </div>
    )
  }

  return (
    <div className="history-schedule-header flex items-center gap-2">
      <Popover
        position="bottom"
        content={
          <HistoryCalendar
            viewedMonth={viewedMonth}
            onViewedMonthChange={onViewedMonthChange}
            activeDates={activeDates}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
          />
        }
      >
        <button type="button" className="history-schedule-header__date-label">
          {dateLabel}
        </button>
      </Popover>

      <div className="history-schedule-header__spacer" />

      <Button
        variant="ghost"
        size="small"
        icon={<Search24Regular />}
        onClick={() => setSearchOpen(true)}
        aria-label={t('history:searchPlaceholder')}
      >
        {''}
      </Button>
      <Button variant="secondary" size="small" onClick={onToday}>
        {t('history:feed.today', { defaultValue: 'Today' })}
      </Button>
    </div>
  )
}

import type { JSX } from 'react'
import { useMemo } from 'react'
import { ChevronLeft24Regular, ChevronRight24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { addMonths, toLocalDateString } from '@renderer/utils/historyDate.util'

interface HistoryCalendarProps {
  readonly viewedMonth: Date
  readonly onViewedMonthChange: (month: Date) => void
  readonly activeDates: ReadonlySet<string>
  readonly selectedDate: string | undefined
  readonly onSelectDate: (date: string) => void
}

interface CalendarCell {
  readonly date: Date
  readonly dateStr: string
  readonly inCurrentMonth: boolean
  readonly isActive: boolean
  readonly isToday: boolean
  readonly isSelected: boolean
}

const WEEKS_SHOWN = 6
const DAYS_PER_WEEK = 7

// Grid weeks start on Monday, matching the project's British-English default
function startOfCalendarGrid(monthStart: Date): Date {
  const mondayOffset = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - mondayOffset)
  return gridStart
}

export function HistoryCalendar({
  viewedMonth,
  onViewedMonthChange,
  activeDates,
  selectedDate,
  onSelectDate
}: HistoryCalendarProps): JSX.Element {
  const { t, i18n } = useTranslation(['history', 'common'])

  const cells = useMemo<CalendarCell[]>(() => {
    const todayStr = toLocalDateString(new Date())
    const gridStart = startOfCalendarGrid(viewedMonth)

    return Array.from({ length: WEEKS_SHOWN * DAYS_PER_WEEK }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      const dateStr = toLocalDateString(date)

      return {
        date,
        dateStr,
        inCurrentMonth: date.getMonth() === viewedMonth.getMonth(),
        isActive: activeDates.has(dateStr),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate
      }
    })
  }, [viewedMonth, activeDates, selectedDate])

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' })
    return cells.slice(0, DAYS_PER_WEEK).map((cell) => formatter.format(cell.date))
  }, [cells, i18n.language])

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
        viewedMonth
      ),
    [viewedMonth, i18n.language]
  )

  return (
    <div className="history-calendar">
      <div className="history-calendar__nav">
        <Button
          variant="ghost"
          size="small"
          icon={<ChevronLeft24Regular />}
          onClick={() => onViewedMonthChange(addMonths(viewedMonth, -1))}
          aria-label={t('history:calendar.previousMonth', { defaultValue: 'Previous month' })}
        >
          {''}
        </Button>
        <span className="history-calendar__month-label">{monthLabel}</span>
        <Button
          variant="ghost"
          size="small"
          icon={<ChevronRight24Regular />}
          onClick={() => onViewedMonthChange(addMonths(viewedMonth, 1))}
          aria-label={t('history:calendar.nextMonth', { defaultValue: 'Next month' })}
        >
          {''}
        </Button>
      </div>

      <div className="history-calendar__weekdays">
        {weekdayLabels.map((label, index) => (
          <span key={index} className="history-calendar__weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="history-calendar__grid">
        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            type="button"
            className="history-calendar__cell"
            data-in-month={cell.inCurrentMonth}
            data-active={cell.isActive}
            data-today={cell.isToday}
            data-selected={cell.isSelected}
            disabled={!cell.isActive}
            aria-current={cell.isToday ? 'date' : undefined}
            aria-pressed={cell.isSelected}
            onClick={() => onSelectDate(cell.dateStr)}
          >
            {cell.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

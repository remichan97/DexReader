/**
 * History Store - reading history calendar and event feed
 *
 * Separate from progressStore: this is a read-only domain (the renderer never
 * writes a history event directly - logging happens as a side effect of
 * progress:save-progress on the main process). No debounce/optimistic-update
 * machinery is needed here.
 */

import { create } from 'zustand'
import { rendererLog } from '@renderer/services/logging.service'
import { toError } from '@shared/utils/to-error.util'

type HistoryEventMetadata = NonNullable<
  Awaited<ReturnType<typeof globalThis.readHistory.getEventsByDate>>['data']
>[number]

const RECENT_EVENTS_LIMIT = 200

interface DateRange {
  readonly from: string
  readonly to: string
}

interface HistoryState {
  // State
  recentEvents: HistoryEventMetadata[]
  activeDates: Set<string>
  selectedDate: string | undefined
  eventsForSelectedDate: HistoryEventMetadata[]
  loading: boolean
  error: Error | null

  // Actions
  loadRecentEvents: () => Promise<void>
  loadActiveDates: (range: DateRange) => Promise<void>
  refreshActiveDates: () => Promise<void>
  selectDate: (date: string) => Promise<void>
  clearSelectedDate: () => void
  clearError: () => void
}

// Remembers the last requested month range so a removal elsewhere can refresh
// the calendar's dots without the component needing to track it separately.
let lastActiveDatesRange: DateRange | undefined

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recentEvents: [],
  activeDates: new Set(),
  selectedDate: undefined,
  eventsForSelectedDate: [],
  loading: false,
  error: null,

  loadRecentEvents: async () => {
    try {
      set({ loading: true, error: null })

      const response = await globalThis.readHistory.getRecentEvents(RECENT_EVENTS_LIMIT)

      if (response.success && response.data) {
        set({ recentEvents: response.data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      rendererLog.error('[HistoryStore] Failed to load recent events:', error)
      set({ error: toError(error), loading: false })
    }
  },

  loadActiveDates: async (range) => {
    try {
      lastActiveDatesRange = range

      const response = await globalThis.readHistory.getActiveDates({
        fromDate: range.from,
        toDate: range.to
      })

      if (response.success && response.data) {
        set({ activeDates: new Set(response.data) })
      }
    } catch (error) {
      rendererLog.error('[HistoryStore] Failed to load active dates:', error)
      set({ error: toError(error) })
    }
  },

  refreshActiveDates: async () => {
    if (!lastActiveDatesRange) {
      return
    }

    await get().loadActiveDates(lastActiveDatesRange)
  },

  selectDate: async (date) => {
    try {
      set({ selectedDate: date, loading: true, error: null })

      const response = await globalThis.readHistory.getEventsByDate(date)

      if (response.success && response.data) {
        set({ eventsForSelectedDate: response.data, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      rendererLog.error('[HistoryStore] Failed to load events for date:', error)
      set({ error: toError(error), loading: false })
    }
  },

  clearSelectedDate: () => {
    set({ selectedDate: undefined, eventsForSelectedDate: [] })
  },

  clearError: () => {
    set({ error: null })
  }
}))

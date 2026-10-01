import { useHistoryStore } from './historyStore'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const INITIAL_STATE = useHistoryStore.getState()

const getRecentEvents = vi.fn()
const getActiveDates = vi.fn()
const getEventsByDate = vi.fn()

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState(INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.readHistory = {
      getRecentEvents,
      getActiveDates,
      getEventsByDate
    } as unknown as typeof globalThis.readHistory
  })

  describe('loadRecentEvents', () => {
    it('populates recentEvents on success', async () => {
      getRecentEvents.mockResolvedValue({ success: true, data: [{ id: 1 }] })

      await useHistoryStore.getState().loadRecentEvents()

      expect(useHistoryStore.getState()).toEqual(
        expect.objectContaining({ recentEvents: [{ id: 1 }], loading: false, error: null })
      )
      expect(getRecentEvents).toHaveBeenCalledWith(200)
    })

    it('records the error and stops loading when the IPC call throws', async () => {
      getRecentEvents.mockRejectedValue(new Error('IPC channel closed'))

      await useHistoryStore.getState().loadRecentEvents()

      const state = useHistoryStore.getState()
      expect(state.loading).toBe(false)
      expect(state.error).toBeInstanceOf(Error)
    })
  })

  describe('loadActiveDates', () => {
    it('stores the returned dates as a Set', async () => {
      getActiveDates.mockResolvedValue({ success: true, data: ['2026-01-05', '2026-01-10'] })

      await useHistoryStore.getState().loadActiveDates({ from: '2026-01-01', to: '2026-01-31' })

      expect(getActiveDates).toHaveBeenCalledWith({ fromDate: '2026-01-01', toDate: '2026-01-31' })
      expect(useHistoryStore.getState().activeDates).toEqual(new Set(['2026-01-05', '2026-01-10']))
    })
  })

  describe('refreshActiveDates', () => {
    it('does nothing when loadActiveDates has never been called', async () => {
      // lastActiveDatesRange is private, unexported module state that setState()
      // can't reset, and an earlier test in this file has already called
      // loadActiveDates - so this needs a genuinely fresh module instance.
      vi.resetModules()
      const { useHistoryStore: freshHistoryStore } = await import('./historyStore')

      await freshHistoryStore.getState().refreshActiveDates()

      expect(getActiveDates).not.toHaveBeenCalled()
    })

    it('re-requests the last used date range', async () => {
      getActiveDates.mockResolvedValue({ success: true, data: ['2026-01-05'] })
      await useHistoryStore.getState().loadActiveDates({ from: '2026-01-01', to: '2026-01-31' })
      getActiveDates.mockClear()
      getActiveDates.mockResolvedValue({ success: true, data: ['2026-01-05', '2026-01-06'] })

      await useHistoryStore.getState().refreshActiveDates()

      expect(getActiveDates).toHaveBeenCalledWith({ fromDate: '2026-01-01', toDate: '2026-01-31' })
      expect(useHistoryStore.getState().activeDates).toEqual(new Set(['2026-01-05', '2026-01-06']))
    })
  })

  describe('selectDate', () => {
    it('sets selectedDate immediately and loads events for it', async () => {
      getEventsByDate.mockResolvedValue({ success: true, data: [{ id: 1 }] })

      await useHistoryStore.getState().selectDate('2026-01-05')

      expect(useHistoryStore.getState()).toEqual(
        expect.objectContaining({
          selectedDate: '2026-01-05',
          eventsForSelectedDate: [{ id: 1 }],
          loading: false
        })
      )
    })
  })

  describe('clearSelectedDate', () => {
    it('clears the selected date and its events', async () => {
      getEventsByDate.mockResolvedValue({ success: true, data: [{ id: 1 }] })
      await useHistoryStore.getState().selectDate('2026-01-05')

      useHistoryStore.getState().clearSelectedDate()

      expect(useHistoryStore.getState()).toEqual(
        expect.objectContaining({ selectedDate: undefined, eventsForSelectedDate: [] })
      )
    })
  })

  describe('clearError', () => {
    it('resets the error field to null', async () => {
      getRecentEvents.mockRejectedValue(new Error('boom'))
      await useHistoryStore.getState().loadRecentEvents()
      expect(useHistoryStore.getState().error).not.toBeNull()

      useHistoryStore.getState().clearError()

      expect(useHistoryStore.getState().error).toBeNull()
    })
  })
})

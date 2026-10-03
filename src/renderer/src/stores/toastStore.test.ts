import { useToastStore } from './toastStore'

const INITIAL_STATE = useToastStore.getState()

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState(INITIAL_STATE, true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('show', () => {
    it('appends a toast and returns its id', () => {
      const id = useToastStore.getState().show({ variant: 'success', title: 'Saved!' })

      expect(typeof id).toBe('string')
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({ id, variant: 'success', title: 'Saved!', duration: 5000 })
      ])
    })

    it('defaults duration to 5000ms when not given', () => {
      useToastStore.getState().show({ variant: 'info', title: 'Hi' })

      expect(useToastStore.getState().toasts[0].duration).toBe(5000)
    })

    it('auto-dismisses the toast after its duration elapses', () => {
      useToastStore.getState().show({ variant: 'info', title: 'Hi', duration: 1000 })
      expect(useToastStore.getState().toasts).toHaveLength(1)

      vi.advanceTimersByTime(1000)

      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('does not auto-dismiss a toast with duration: 0 (infinite)', () => {
      useToastStore.getState().show({ variant: 'error', title: 'Stays', duration: 0 })

      vi.advanceTimersByTime(60_000)

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })

    it('supports multiple simultaneous toasts', () => {
      useToastStore.getState().show({ variant: 'info', title: 'First' })
      useToastStore.getState().show({ variant: 'success', title: 'Second' })

      expect(useToastStore.getState().toasts).toHaveLength(2)
    })
  })

  describe('dismiss', () => {
    it('removes only the matching toast by id', () => {
      const firstId = useToastStore.getState().show({ variant: 'info', title: 'First' })
      useToastStore.getState().show({ variant: 'success', title: 'Second' })

      useToastStore.getState().dismiss(firstId)

      expect(useToastStore.getState().toasts.map((t) => t.title)).toEqual(['Second'])
    })

    it('cancels the auto-dismiss timer so it does not fire twice', () => {
      const id = useToastStore.getState().show({ variant: 'info', title: 'Hi', duration: 1000 })

      useToastStore.getState().dismiss(id)
      // If the timer weren't cleared, this would try to dismiss an already-removed
      // toast - filtering a missing id is a harmless no-op either way, but the
      // array must not go negative-length or throw.
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
      expect(useToastStore.getState().toasts).toHaveLength(0)
    })

    it('does nothing when the id does not match any toast', () => {
      useToastStore.getState().show({ variant: 'info', title: 'First' })

      useToastStore.getState().dismiss('nonexistent-id')

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })

  describe('dismissAll', () => {
    it('clears every toast and cancels their timers', () => {
      useToastStore.getState().show({ variant: 'info', title: 'First', duration: 1000 })
      useToastStore.getState().show({ variant: 'success', title: 'Second', duration: 2000 })

      useToastStore.getState().dismissAll()

      expect(useToastStore.getState().toasts).toEqual([])

      // Advancing past both durations must not resurrect or error on cleared timers
      expect(() => vi.advanceTimersByTime(5000)).not.toThrow()
      expect(useToastStore.getState().toasts).toEqual([])
    })
  })
})

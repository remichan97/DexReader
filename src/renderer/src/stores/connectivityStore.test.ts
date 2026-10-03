import { useConnectivityStore } from './connectivityStore'

vi.mock('../services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const INITIAL_STATE = useConnectivityStore.getState()

const updateMenuState = vi.fn()
const isServiceAlive = vi.fn()

describe('connectivityStore', () => {
  beforeEach(() => {
    useConnectivityStore.setState(INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.api = { updateMenuState } as unknown as typeof globalThis.api
    globalThis.mangadex = { isServiceAlive } as unknown as typeof globalThis.mangadex
  })

  afterEach(() => {
    useConnectivityStore.getState().stopPolling()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('setOnline / setOfflineMode / setNoInternet', () => {
    it('setOnline marks the store online and clears the offline menu flag', () => {
      useConnectivityStore.getState().setOnline()

      const state = useConnectivityStore.getState()
      expect(state.status).toBe('online')
      expect(state.isOnline).toBe(true)
      expect(state.lastChecked).toBeInstanceOf(Date)
      expect(updateMenuState).toHaveBeenCalledWith({ isOffline: false })
    })

    it('setOfflineMode marks the store as user-offline and sets the offline menu flag', () => {
      useConnectivityStore.getState().setOfflineMode()

      const state = useConnectivityStore.getState()
      expect(state.status).toBe('offline-user')
      expect(state.isOnline).toBe(false)
      expect(updateMenuState).toHaveBeenCalledWith({ isOffline: true })
    })

    it('setNoInternet marks the store as no-internet and sets the offline menu flag', () => {
      useConnectivityStore.getState().setNoInternet()

      const state = useConnectivityStore.getState()
      expect(state.status).toBe('offline-no-internet')
      expect(state.isOnline).toBe(false)
      expect(updateMenuState).toHaveBeenCalledWith({ isOffline: true })
    })
  })

  describe('toggleOfflineMode', () => {
    it('switches from online to user-offline and stops polling', () => {
      useConnectivityStore.getState().setOnline()
      vi.useFakeTimers()
      useConnectivityStore.getState().startPolling()

      useConnectivityStore.getState().toggleOfflineMode()

      expect(useConnectivityStore.getState().status).toBe('offline-user')
      expect(useConnectivityStore.getState().pollTimer).toBeNull()
      expect(updateMenuState).toHaveBeenLastCalledWith({ isOffline: true })
    })

    it('switches from user-offline back to online, starts polling, and checks connectivity', async () => {
      isServiceAlive.mockResolvedValue({ success: true, data: true })
      useConnectivityStore.getState().setOfflineMode()

      useConnectivityStore.getState().toggleOfflineMode()
      // checkConnectivity is fired without awaiting inside the action
      await vi.waitFor(() => expect(isServiceAlive).toHaveBeenCalled())

      expect(useConnectivityStore.getState().status).toBe('online')
      expect(useConnectivityStore.getState().pollTimer).not.toBeNull()
      expect(updateMenuState).toHaveBeenLastCalledWith({ isOffline: false })
    })
  })

  describe('startPolling / stopPolling', () => {
    it('checks connectivity every 30 seconds while online', () => {
      vi.useFakeTimers()
      isServiceAlive.mockResolvedValue({ success: true, data: true })
      useConnectivityStore.getState().setOnline()

      useConnectivityStore.getState().startPolling()
      vi.advanceTimersByTime(30_000)

      expect(isServiceAlive).toHaveBeenCalledTimes(1)
    })

    it('does not poll once status is user-offline', () => {
      vi.useFakeTimers()
      useConnectivityStore.getState().setOfflineMode()

      useConnectivityStore.getState().startPolling()
      vi.advanceTimersByTime(60_000)

      expect(isServiceAlive).not.toHaveBeenCalled()
    })

    it('replaces an existing timer instead of stacking a second one', () => {
      vi.useFakeTimers()
      isServiceAlive.mockResolvedValue({ success: true, data: true })
      useConnectivityStore.getState().setOnline()

      useConnectivityStore.getState().startPolling()
      useConnectivityStore.getState().startPolling()
      vi.advanceTimersByTime(30_000)

      expect(isServiceAlive).toHaveBeenCalledTimes(1)
    })

    it('stopPolling clears the timer so checkConnectivity no longer fires', () => {
      vi.useFakeTimers()
      useConnectivityStore.getState().setOnline()
      useConnectivityStore.getState().startPolling()

      useConnectivityStore.getState().stopPolling()
      vi.advanceTimersByTime(60_000)

      expect(isServiceAlive).not.toHaveBeenCalled()
      expect(useConnectivityStore.getState().pollTimer).toBeNull()
    })
  })

  describe('checkConnectivity', () => {
    it('goes online when the health check succeeds', async () => {
      useConnectivityStore.setState({ status: 'offline-no-internet' } as never)
      isServiceAlive.mockResolvedValue({ success: true, data: true })

      await useConnectivityStore.getState().checkConnectivity()

      expect(useConnectivityStore.getState().status).toBe('online')
    })

    it('does not override a user-chosen offline status even when the health check succeeds', async () => {
      useConnectivityStore.getState().setOfflineMode()
      isServiceAlive.mockResolvedValue({ success: true, data: true })

      await useConnectivityStore.getState().checkConnectivity()

      expect(useConnectivityStore.getState().status).toBe('offline-user')
    })

    it('goes to no-internet when the health check throws', async () => {
      useConnectivityStore.getState().setOnline()
      isServiceAlive.mockRejectedValue(new Error('network error'))

      await useConnectivityStore.getState().checkConnectivity()

      expect(useConnectivityStore.getState().status).toBe('offline-no-internet')
    })

    it('does not override a user-chosen offline status when the health check throws', async () => {
      useConnectivityStore.getState().setOfflineMode()
      isServiceAlive.mockRejectedValue(new Error('network error'))

      await useConnectivityStore.getState().checkConnectivity()

      expect(useConnectivityStore.getState().status).toBe('offline-user')
    })
  })
})

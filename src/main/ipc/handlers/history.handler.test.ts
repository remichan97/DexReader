import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { historyRepo } from '../../database/repositories/history.repo'
import { registerHistoryHandler } from './history.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/history.repo', () => ({
  historyRepo: {
    getActiveDates: vi.fn(),
    getEventsByDate: vi.fn(),
    getRecentEvents: vi.fn()
  }
}))

type RegisteredHandler = (
  event: IpcMainInvokeEvent,
  ...args: unknown[]
) => Promise<{ success: boolean; data?: unknown; error?: unknown }>

function getRegisteredHandler(channel: string): RegisteredHandler {
  const call = vi
    .mocked(ipcMain.handle)
    .mock.calls.find(([registeredChannel]) => registeredChannel === channel)
  if (!call) {
    throw new Error(`No handler registered for channel "${channel}"`)
  }
  return call[1] as RegisteredHandler
}

const EVENT = {} as IpcMainInvokeEvent

describe('history.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerHistoryHandler()
  })

  describe('history:get-active-dates', () => {
    it('forwards a valid command to historyRepo.getActiveDates', async () => {
      vi.mocked(historyRepo.getActiveDates).mockReturnValue(['2026-01-01'])
      const command = { fromDate: '2026-01-01', toDate: '2026-01-31' }

      await expect(
        getRegisteredHandler('history:get-active-dates')(EVENT, command)
      ).resolves.toEqual({ success: true, data: ['2026-01-01'] })
      expect(historyRepo.getActiveDates).toHaveBeenCalledWith(command)
    })

    it('rejects a command missing fromDate/toDate', async () => {
      const response = await getRegisteredHandler('history:get-active-dates')(EVENT, {
        fromDate: '2026-01-01'
      })

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError' })
      })
      expect(historyRepo.getActiveDates).not.toHaveBeenCalled()
    })
  })

  describe('history:get-events-by-date', () => {
    it('forwards a valid date to historyRepo.getEventsByDate', async () => {
      vi.mocked(historyRepo.getEventsByDate).mockReturnValue([{ id: 1 }] as never)

      await expect(
        getRegisteredHandler('history:get-events-by-date')(EVENT, '2026-01-01')
      ).resolves.toEqual({ success: true, data: [{ id: 1 }] })
      expect(historyRepo.getEventsByDate).toHaveBeenCalledWith('2026-01-01')
    })

    it('rejects a non-string date', async () => {
      const response = await getRegisteredHandler('history:get-events-by-date')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(historyRepo.getEventsByDate).not.toHaveBeenCalled()
    })
  })

  describe('history:get-recent-events', () => {
    it('forwards a valid limit to historyRepo.getRecentEvents', async () => {
      vi.mocked(historyRepo.getRecentEvents).mockReturnValue([{ id: 1 }] as never)

      await expect(getRegisteredHandler('history:get-recent-events')(EVENT, 20)).resolves.toEqual({
        success: true,
        data: [{ id: 1 }]
      })
      expect(historyRepo.getRecentEvents).toHaveBeenCalledWith(20)
    })

    it('rejects a non-number limit', async () => {
      const response = await getRegisteredHandler('history:get-recent-events')(EVENT, '20')

      expect(response.success).toBe(false)
      expect(historyRepo.getRecentEvents).not.toHaveBeenCalled()
    })
  })
})

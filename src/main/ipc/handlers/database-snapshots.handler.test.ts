import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { databaseSnapshotService } from '../../services/database-snapshot.service'
import { registerDatabaseSnapshotHandlers } from './database-snapshots.handler'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../services/database-snapshot.service', () => ({
  databaseSnapshotService: {
    listSnapshots: vi.fn(),
    createSnapshot: vi.fn(),
    restoreSnapshot: vi.fn(),
    deleteSnapshot: vi.fn()
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

describe('database-snapshots.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerDatabaseSnapshotHandlers()
  })

  describe('snapshot:list', () => {
    it('returns databaseSnapshotService.listSnapshots() unchanged', async () => {
      vi.mocked(databaseSnapshotService.listSnapshots).mockResolvedValue([
        { name: 'dexreader-1000_auto.db' }
      ] as never)

      await expect(getRegisteredHandler('snapshot:list')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ name: 'dexreader-1000_auto.db' }]
      })
    })
  })

  describe('snapshot:create', () => {
    it.each([SnapshotTrigger.Manual, SnapshotTrigger.Auto])(
      'forwards a valid trigger (%s) to databaseSnapshotService.createSnapshot',
      async (trigger) => {
        await getRegisteredHandler('snapshot:create')(EVENT, trigger)

        expect(databaseSnapshotService.createSnapshot).toHaveBeenCalledWith(trigger)
      }
    )

    it('rejects a trigger value outside the SnapshotTrigger enum', async () => {
      const response = await getRegisteredHandler('snapshot:create')(EVENT, 'scheduled')

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: 'Invalid snapshot trigger type' })
      })
      expect(databaseSnapshotService.createSnapshot).not.toHaveBeenCalled()
    })

    it('rejects a missing trigger', async () => {
      const response = await getRegisteredHandler('snapshot:create')(EVENT, undefined)

      expect(response.success).toBe(false)
      expect(databaseSnapshotService.createSnapshot).not.toHaveBeenCalled()
    })
  })

  describe('snapshot:restore', () => {
    it('forwards a valid snapshot name to databaseSnapshotService.restoreSnapshot', async () => {
      await getRegisteredHandler('snapshot:restore')(EVENT, 'dexreader-1000_auto.db')

      expect(databaseSnapshotService.restoreSnapshot).toHaveBeenCalledWith('dexreader-1000_auto.db')
    })

    it('rejects a non-string snapshot name', async () => {
      const response = await getRegisteredHandler('snapshot:restore')(EVENT, 42)

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ name: 'TypeError', message: 'Invalid snapshot name' })
      })
      expect(databaseSnapshotService.restoreSnapshot).not.toHaveBeenCalled()
    })

    it('propagates a restore failure as { success: false, error }', async () => {
      vi.mocked(databaseSnapshotService.restoreSnapshot).mockRejectedValue(
        new Error('snapshot file not found')
      )

      const response = await getRegisteredHandler('snapshot:restore')(
        EVENT,
        'dexreader-1000_auto.db'
      )

      expect(response).toEqual({
        success: false,
        error: expect.objectContaining({ message: 'snapshot file not found' })
      })
    })
  })

  describe('snapshot:delete', () => {
    it('forwards a valid snapshot name to databaseSnapshotService.deleteSnapshot', async () => {
      await getRegisteredHandler('snapshot:delete')(EVENT, 'dexreader-1000_auto.db')

      expect(databaseSnapshotService.deleteSnapshot).toHaveBeenCalledWith('dexreader-1000_auto.db')
    })

    it('rejects a non-string snapshot name', async () => {
      const response = await getRegisteredHandler('snapshot:delete')(EVENT, { name: 'x' })

      expect(response.success).toBe(false)
      expect(databaseSnapshotService.deleteSnapshot).not.toHaveBeenCalled()
    })
  })
})

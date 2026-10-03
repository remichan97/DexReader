import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { registerCollectionsHandlers } from './collections.handler'

vi.mock('electron', () => ({
  ipcMain: { handle: vi.fn() }
}))

vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('../../database/repositories/collection.repo', () => ({
  collectionRepo: {
    getAllCollections: vi.fn(),
    getMangaInCollection: vi.fn(),
    getCollectionByManga: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    deleteCollection: vi.fn(),
    addToCollection: vi.fn(),
    removeFromCollection: vi.fn()
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

describe('collections.handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerCollectionsHandlers()
  })

  describe('collections:get-all', () => {
    it('returns collectionRepo.getAllCollections() unchanged', async () => {
      vi.mocked(collectionRepo.getAllCollections).mockReturnValue([
        { id: 1, name: 'Reading' }
      ] as never)

      await expect(getRegisteredHandler('collections:get-all')(EVENT)).resolves.toEqual({
        success: true,
        data: [{ id: 1, name: 'Reading' }]
      })
    })
  })

  describe('collections:get-manga', () => {
    it('forwards a valid collectionId to collectionRepo.getMangaInCollection', async () => {
      vi.mocked(collectionRepo.getMangaInCollection).mockReturnValue(['manga-1'] as never)

      await expect(getRegisteredHandler('collections:get-manga')(EVENT, 1)).resolves.toEqual({
        success: true,
        data: ['manga-1']
      })
      expect(collectionRepo.getMangaInCollection).toHaveBeenCalledWith(1)
    })

    it('rejects a non-number collectionId', async () => {
      const response = await getRegisteredHandler('collections:get-manga')(EVENT, '1')

      expect(response.success).toBe(false)
      expect(collectionRepo.getMangaInCollection).not.toHaveBeenCalled()
    })
  })

  describe('collections:get-by-manga', () => {
    it('forwards a valid mangaId to collectionRepo.getCollectionByManga', async () => {
      vi.mocked(collectionRepo.getCollectionByManga).mockReturnValue([
        { id: 1, name: 'Reading' }
      ] as never)

      await getRegisteredHandler('collections:get-by-manga')(EVENT, 'manga-1')

      expect(collectionRepo.getCollectionByManga).toHaveBeenCalledWith('manga-1')
    })

    it('rejects a non-string mangaId', async () => {
      const response = await getRegisteredHandler('collections:get-by-manga')(EVENT, 42)

      expect(response.success).toBe(false)
      expect(collectionRepo.getCollectionByManga).not.toHaveBeenCalled()
    })
  })

  describe('collections:create', () => {
    it('forwards a valid command to collectionRepo.createCollection', async () => {
      vi.mocked(collectionRepo.createCollection).mockReturnValue(1 as never)
      const command = { name: 'Favourites', description: 'My picks' }

      await expect(getRegisteredHandler('collections:create')(EVENT, command)).resolves.toEqual({
        success: true,
        data: 1
      })
      expect(collectionRepo.createCollection).toHaveBeenCalledWith(command)
    })

    it('rejects a command with an empty name', async () => {
      const response = await getRegisteredHandler('collections:create')(EVENT, { name: '  ' })

      expect(response.success).toBe(false)
      expect(collectionRepo.createCollection).not.toHaveBeenCalled()
    })
  })

  describe('collections:update', () => {
    it('forwards a valid command to collectionRepo.updateCollection', async () => {
      const command = { id: 1, name: 'Renamed' }

      await getRegisteredHandler('collections:update')(EVENT, command)

      expect(collectionRepo.updateCollection).toHaveBeenCalledWith(command)
    })

    it('rejects a command missing id', async () => {
      const response = await getRegisteredHandler('collections:update')(EVENT, {
        name: 'Renamed'
      })

      expect(response.success).toBe(false)
      expect(collectionRepo.updateCollection).not.toHaveBeenCalled()
    })
  })

  describe('collections:delete', () => {
    it('forwards a valid collectionId to collectionRepo.deleteCollection', async () => {
      await getRegisteredHandler('collections:delete')(EVENT, 1)

      expect(collectionRepo.deleteCollection).toHaveBeenCalledWith(1)
    })

    it('rejects a non-number collectionId', async () => {
      const response = await getRegisteredHandler('collections:delete')(EVENT, '1')

      expect(response.success).toBe(false)
      expect(collectionRepo.deleteCollection).not.toHaveBeenCalled()
    })
  })

  describe('collections:add-manga', () => {
    it('forwards a valid command to collectionRepo.addToCollection', async () => {
      vi.mocked(collectionRepo.addToCollection).mockReturnValue(true as never)
      const command = { collectionId: 1, mangaId: 'manga-1' }

      await expect(getRegisteredHandler('collections:add-manga')(EVENT, command)).resolves.toEqual({
        success: true,
        data: true
      })
      expect(collectionRepo.addToCollection).toHaveBeenCalledWith(command)
    })

    it('rejects a command with a non-string mangaId', async () => {
      const response = await getRegisteredHandler('collections:add-manga')(EVENT, {
        collectionId: 1,
        mangaId: 42
      })

      expect(response.success).toBe(false)
      expect(collectionRepo.addToCollection).not.toHaveBeenCalled()
    })
  })

  describe('collections:remove-manga', () => {
    it('forwards a valid array of commands to collectionRepo.removeFromCollection', async () => {
      const commands = [{ collectionId: 1, mangaId: 'manga-1' }]

      await getRegisteredHandler('collections:remove-manga')(EVENT, commands)

      expect(collectionRepo.removeFromCollection).toHaveBeenCalledWith(commands)
    })

    it('rejects a non-array value', async () => {
      const response = await getRegisteredHandler('collections:remove-manga')(EVENT, {
        collectionId: 1,
        mangaId: 'manga-1'
      })

      expect(response.success).toBe(false)
      expect(collectionRepo.removeFromCollection).not.toHaveBeenCalled()
    })

    it('rejects an array containing an invalid entry', async () => {
      const response = await getRegisteredHandler('collections:remove-manga')(EVENT, [
        { collectionId: 1, mangaId: 'manga-1' },
        { collectionId: 'not-a-number', mangaId: 'manga-2' }
      ])

      expect(response.success).toBe(false)
      expect(collectionRepo.removeFromCollection).not.toHaveBeenCalled()
    })
  })
})

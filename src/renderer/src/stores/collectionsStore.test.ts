import { useCollectionsStore } from './collectionsStore'

vi.mock('../services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const INITIAL_STATE = useCollectionsStore.getState()

const getAllCollections = vi.fn()
const createCollection = vi.fn()
const updateCollection = vi.fn()
const deleteCollection = vi.fn()
const addToCollection = vi.fn()
const removeFromCollection = vi.fn()

describe('collectionsStore', () => {
  beforeEach(() => {
    useCollectionsStore.setState(INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.collections = {
      getAllCollections,
      createCollection,
      updateCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection
    } as unknown as typeof globalThis.collections
  })

  describe('loadCollections', () => {
    it('populates collections on success', async () => {
      getAllCollections.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Reading' }] })

      await useCollectionsStore.getState().loadCollections()

      expect(useCollectionsStore.getState()).toEqual(
        expect.objectContaining({
          collections: [{ id: 1, name: 'Reading' }],
          loading: false,
          error: null
        })
      )
    })

    it('sets an error message on failure', async () => {
      getAllCollections.mockResolvedValue({ success: false, error: { message: 'DB locked' } })

      await useCollectionsStore.getState().loadCollections()

      expect(useCollectionsStore.getState().error).toBe('DB locked')
    })
  })

  describe('createCollection', () => {
    it('reloads collections and returns the new id on success', async () => {
      createCollection.mockResolvedValue({ success: true, data: 5 })
      getAllCollections.mockResolvedValue({ success: true, data: [{ id: 5, name: 'New' }] })

      const result = await useCollectionsStore.getState().createCollection({ name: 'New' })

      expect(result).toBe(5)
      expect(getAllCollections).toHaveBeenCalled()
    })

    it('returns null and sets an error on failure', async () => {
      createCollection.mockResolvedValue({ success: false, error: { message: 'Duplicate name' } })

      const result = await useCollectionsStore.getState().createCollection({ name: 'New' })

      expect(result).toBeNull()
      expect(getAllCollections).not.toHaveBeenCalled()
      expect(useCollectionsStore.getState().error).toBe('Duplicate name')
    })
  })

  describe('updateCollection', () => {
    it('reloads collections on success', async () => {
      updateCollection.mockResolvedValue({ success: true })
      getAllCollections.mockResolvedValue({ success: true, data: [] })

      await useCollectionsStore.getState().updateCollection({ id: 1, name: 'Renamed' })

      expect(getAllCollections).toHaveBeenCalled()
    })

    it('sets an error without reloading on failure', async () => {
      updateCollection.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      await useCollectionsStore.getState().updateCollection({ id: 1, name: 'Renamed' })

      expect(getAllCollections).not.toHaveBeenCalled()
      expect(useCollectionsStore.getState().error).toBe('Not found')
    })
  })

  describe('deleteCollection', () => {
    it('reloads collections on success', async () => {
      deleteCollection.mockResolvedValue({ success: true })
      getAllCollections.mockResolvedValue({ success: true, data: [] })

      await useCollectionsStore.getState().deleteCollection(1)

      expect(getAllCollections).toHaveBeenCalled()
    })

    it('sets an error without reloading on failure', async () => {
      deleteCollection.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      await useCollectionsStore.getState().deleteCollection(1)

      expect(getAllCollections).not.toHaveBeenCalled()
      expect(useCollectionsStore.getState().error).toBe('Not found')
    })
  })

  describe('addToCollection', () => {
    it('returns true without reloading collections on success', async () => {
      addToCollection.mockResolvedValue({ success: true, data: true })

      const result = await useCollectionsStore
        .getState()
        .addToCollection({ collectionId: 1, mangaId: 'manga-1' })

      expect(result).toBe(true)
      expect(getAllCollections).not.toHaveBeenCalled()
    })

    it('returns false and sets an error on failure', async () => {
      addToCollection.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      const result = await useCollectionsStore
        .getState()
        .addToCollection({ collectionId: 1, mangaId: 'manga-1' })

      expect(result).toBe(false)
      expect(useCollectionsStore.getState().error).toBe('Not found')
    })
  })

  describe('removeFromCollection', () => {
    it('does not reload collections on success', async () => {
      removeFromCollection.mockResolvedValue({ success: true })

      await useCollectionsStore
        .getState()
        .removeFromCollection([{ collectionId: 1, mangaId: 'manga-1' }])

      expect(getAllCollections).not.toHaveBeenCalled()
      expect(useCollectionsStore.getState().error).toBeNull()
    })

    it('sets an error on failure', async () => {
      removeFromCollection.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      await useCollectionsStore
        .getState()
        .removeFromCollection([{ collectionId: 1, mangaId: 'manga-1' }])

      expect(useCollectionsStore.getState().error).toBe('Not found')
    })
  })
})

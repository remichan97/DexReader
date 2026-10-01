import { useSearchPresetsStore } from './searchPresetsStore'

vi.mock('../services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const INITIAL_STATE = useSearchPresetsStore.getState()

const getAll = vi.fn()
const create = vi.fn()
const deletePreset = vi.fn()
const updateLastUsedAt = vi.fn()

describe('searchPresetsStore', () => {
  beforeEach(() => {
    useSearchPresetsStore.setState(INITIAL_STATE, true)
    vi.clearAllMocks()
    globalThis.searchPresets = {
      getAll,
      create,
      delete: deletePreset,
      updateLastUsedAt
    } as unknown as typeof globalThis.searchPresets
  })

  describe('loadPresets', () => {
    it('populates presets on success', async () => {
      getAll.mockResolvedValue({ success: true, data: [{ id: 1, name: 'Default' }] })

      await useSearchPresetsStore.getState().loadPresets()

      expect(useSearchPresetsStore.getState()).toEqual(
        expect.objectContaining({
          presets: [{ id: 1, name: 'Default' }],
          loading: false,
          error: null
        })
      )
    })

    it('sets an error message on failure', async () => {
      getAll.mockResolvedValue({ success: false, error: { message: 'DB locked' } })

      await useSearchPresetsStore.getState().loadPresets()

      expect(useSearchPresetsStore.getState().error).toBe('DB locked')
    })
  })

  describe('createPreset', () => {
    it('reloads presets and returns the new preset on success', async () => {
      const preset = { id: 1, name: 'My Preset' }
      create.mockResolvedValue({ success: true, data: preset })
      getAll.mockResolvedValue({ success: true, data: [preset] })

      const result = await useSearchPresetsStore.getState().createPreset({
        name: 'My Preset',
        filters: {} as never
      })

      expect(result).toEqual(preset)
      expect(getAll).toHaveBeenCalled()
    })

    it('returns null and sets an error on failure', async () => {
      create.mockResolvedValue({ success: false, error: { message: 'Duplicate name' } })

      const result = await useSearchPresetsStore.getState().createPreset({
        name: 'My Preset',
        filters: {} as never
      })

      expect(result).toBeNull()
      expect(getAll).not.toHaveBeenCalled()
      expect(useSearchPresetsStore.getState().error).toBe('Duplicate name')
    })
  })

  describe('deletePreset', () => {
    it('removes the preset from local state on success without a full reload', async () => {
      useSearchPresetsStore.setState({
        presets: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' }
        ]
      } as never)
      deletePreset.mockResolvedValue({ success: true })

      await useSearchPresetsStore.getState().deletePreset(1)

      expect(useSearchPresetsStore.getState().presets.map((p) => p.id)).toEqual([2])
      expect(getAll).not.toHaveBeenCalled()
    })

    it('sets an error and leaves presets untouched on failure', async () => {
      useSearchPresetsStore.setState({ presets: [{ id: 1, name: 'A' }] } as never)
      deletePreset.mockResolvedValue({ success: false, error: { message: 'Not found' } })

      await useSearchPresetsStore.getState().deletePreset(1)

      expect(useSearchPresetsStore.getState().presets).toHaveLength(1)
      expect(useSearchPresetsStore.getState().error).toBe('Not found')
    })
  })

  describe('updateLastUsedAt', () => {
    it('updates only the matching preset lastUsedAt locally', async () => {
      useSearchPresetsStore.setState({
        presets: [
          { id: 1, name: 'A', lastUsedAt: null },
          { id: 2, name: 'B', lastUsedAt: null }
        ]
      } as never)
      updateLastUsedAt.mockResolvedValue({ success: true })

      await useSearchPresetsStore.getState().updateLastUsedAt(1)

      // lastUsedAt isn't part of the SearchPresetQuery contract (the mapper strips
      // it before it ever reaches the renderer), but the store patches it onto the
      // local object anyway - cast to read back what it actually wrote at runtime.
      const presets = useSearchPresetsStore.getState().presets as unknown as Array<{
        id: number
        lastUsedAt: string | null
      }>
      expect(presets.find((p) => p.id === 1)?.lastUsedAt).not.toBeNull()
      expect(presets.find((p) => p.id === 2)?.lastUsedAt).toBeNull()
    })

    it('leaves presets untouched when the IPC call reports failure', async () => {
      useSearchPresetsStore.setState({
        presets: [{ id: 1, name: 'A', lastUsedAt: null }]
      } as never)
      updateLastUsedAt.mockResolvedValue({ success: false })

      await useSearchPresetsStore.getState().updateLastUsedAt(1)

      const presets = useSearchPresetsStore.getState().presets as unknown as Array<{
        lastUsedAt: string | null
      }>
      expect(presets[0].lastUsedAt).toBeNull()
    })
  })

  describe('getPresetById / getPresetByName', () => {
    it('finds a preset by id', () => {
      useSearchPresetsStore.setState({ presets: [{ id: 1, name: 'A' }] } as never)

      expect(useSearchPresetsStore.getState().getPresetById(1)).toEqual({ id: 1, name: 'A' })
      expect(useSearchPresetsStore.getState().getPresetById(2)).toBeUndefined()
    })

    it('finds a preset by name', () => {
      useSearchPresetsStore.setState({ presets: [{ id: 1, name: 'A' }] } as never)

      expect(useSearchPresetsStore.getState().getPresetByName('A')).toEqual({ id: 1, name: 'A' })
      expect(useSearchPresetsStore.getState().getPresetByName('B')).toBeUndefined()
    })
  })
})

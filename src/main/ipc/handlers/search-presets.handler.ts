import { searchPresetService } from '../../services/search-preset.service'
import { isValidCreateSearchPresetCommand } from '../validators/search-presets.validator'
import { wrapIpcHandler } from '../wrap-handler'

export function registerSearchPresetsHandler(): void {
  /**
   * Get all search presets
   *
   * @returns Promise<SearchPresetQuery[]>
   *
   * @example
   * // Get all search presets
   * const presets = await window.api.invoke('search-presets:getAll')
   */
  wrapIpcHandler('search-presets:getAll', async () => {
    return searchPresetService.getAllSearchPresets()
  })

  /**
   * Get a search preset by its name
   *
   * @param name - The name of the search preset
   * @returns Promise<SearchPresetQuery | undefined>
   *
   * @example
   * // Get a search preset by name
   * const preset = await window.api.invoke('search-presets:getByName', 'My Preset')
   */
  wrapIpcHandler('search-presets:getByName', async (name: unknown) => {
    if (typeof name !== 'string') {
      throw new TypeError('Expected a string for the preset name')
    }
    return searchPresetService.getSearchPresetByName(name)
  })

  /**
   * Get a search preset by its id
   *
   * @param id - The id of the search preset
   * @returns Promise<SearchPresetQuery | undefined>
   *
   * @example
   * // Get a search preset by id
   * const preset = await window.api.invoke('search-presets:getById', 1)
   */
  wrapIpcHandler('search-presets:getById', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a number for the preset id')
    }
    return searchPresetService.getSearchPresetById(id)
  })

  /**
   * Update the last used timestamp of a search preset
   *
   * @param id - The id of the search preset
   * @returns Promise<void>
   *
   * @example
   * // Update the last used timestamp of a search preset
   * await window.api.invoke('search-presets:updateLastUsedAt', 1)
   */
  wrapIpcHandler('search-presets:updateLastUsedAt', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a number for the preset id')
    }
    return searchPresetService.updateLastUsedAt(id)
  })

  /**
   * Delete a search preset by its id
   *
   * @param id - The id of the search preset
   * @returns Promise<void>
   *
   * @example
   * // Delete a search preset by id
   * await window.api.invoke('search-presets:delete', 1)
   */
  wrapIpcHandler('search-presets:delete', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a number for the preset id')
    }
    return searchPresetService.deleteSearchPreset(id)
  })

  /**
   * Create new, or save a search preset
   *
   * @param command - The command object containing the preset details
   * @returns Promise<boolean> indicating success or failure
   *
   * @example
   * // Create a new search preset
   * const newPreset = await window.api.invoke('search-presets:save', {
   *   name: 'My Preset',
   *   searchQuery: 'One Piece',
   *   filters: { status: 'Ongoing' }
   * })
   */
  wrapIpcHandler('search-presets:save', async (command: unknown) => {
    if (typeof command !== 'object' || command === null) {
      throw new TypeError('Expected an object for the create search preset command')
    }

    const { name, searchQuery, filters } = command as {
      name: unknown
      searchQuery: unknown
      filters: unknown
    }

    if (typeof name !== 'string') {
      throw new TypeError('Expected a string for the preset name')
    }

    if (searchQuery !== undefined && typeof searchQuery !== 'string') {
      throw new TypeError('Expected a string or undefined for the preset search query')
    }

    if (filters !== undefined && typeof filters !== 'object') {
      throw new TypeError('Expected an object or undefined for the preset filters')
    }

    const createCommand = isValidCreateSearchPresetCommand(command)

    if (!createCommand) {
      throw new TypeError('Invalid create search preset command')
    }

    return searchPresetService.createSearchPreset(command)
  })
}

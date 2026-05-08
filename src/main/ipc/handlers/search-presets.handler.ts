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
   * @returns Promise<SearchPresetQuery> The created or updated search preset
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
    const createCommand = isValidCreateSearchPresetCommand(command)

    // This isn't supposed to be here, however, TypeScript would yell at me if I didn't do this check, even if the validation method
    // never returns false, but immediately throws an error if the command is invalid, so here we are
    if (!createCommand) {
      throw new TypeError('Invalid create search preset command')
    }

    return searchPresetService.createSearchPreset(command)
  })
}

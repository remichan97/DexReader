import { searchPresetsRepo } from '../../database/repositories/search-presets.repo'
import { isValidCreateSearchPresetCommand } from '../validators/search-presets.validator'
import { wrapIpcHandler } from '../wrap-handler'

export function registerSearchPresetsHandler(): void {
  wrapIpcHandler('search-presets:getAll', async () => {
    return searchPresetsRepo.getAll()
  })

  wrapIpcHandler('search-presets:getByName', async (name: unknown) => {
    if (typeof name !== 'string') {
      throw new TypeError('Expected a string for the preset name')
    }
    return searchPresetsRepo.getByName(name)
  })

  wrapIpcHandler('search-presets:getById', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a string for the preset id')
    }
    return searchPresetsRepo.getPresetById(id)
  })

  wrapIpcHandler('search-presets:updateLastUsedAt', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a string for the preset id')
    }
    return searchPresetsRepo.updateLastUsedAt(id)
  })

  wrapIpcHandler('search-presets:delete', async (id: unknown) => {
    if (typeof id !== 'number') {
      throw new TypeError('Expected a string for the preset id')
    }
    return searchPresetsRepo.delete(id)
  })

  wrapIpcHandler('search-presets:create', async (command: unknown) => {
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

    return searchPresetsRepo.create(command)
  })
}

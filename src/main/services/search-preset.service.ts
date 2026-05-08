import { CreateSearchPresetCommand } from '../database/commands/search-presets/create-search-preset.command'
import { SearchPresetQuery } from '../database/queries/search-presets/search-preset.query'
import { searchPresetsRepo } from '../database/repositories/search-presets.repo'
import { getSettingByPath, updateSettings } from '../settings/settings-manager'
import { mainLog } from './logging/main-logging.service'

class SearchPresetService {
  createSearchPreset(command: CreateSearchPresetCommand): SearchPresetQuery {
    if (command.name.trim() === '') {
      mainLog.error('[SearchPresetService] Failed to create search preset with empty name')
      throw new Error('Preset name cannot be empty')
    }

    if (command.name.length > 50) {
      mainLog.error(
        '[SearchPresetService] Failed to create search preset with name longer than 50 characters',
        {
          presetName: command.name
        }
      )
      throw new Error('Preset name cannot exceed 50 characters')
    }

    try {
      const preset = searchPresetsRepo.create(command)

      if (!preset) {
        mainLog.error('[SearchPresetService] Failed to create or update search preset', {
          presetName: command.name
        })
        throw new Error('Failed to create or update search preset')
      }
      return preset
    } catch (error) {
      mainLog.error('[SearchPresetService] Error while creating or updating search preset', {
        presetName: command.name,
        error: (error as Error).message
      })
      throw error
    }
  }

  updateLastUsedAt(id: number): boolean {
    try {
      const success = searchPresetsRepo.updateLastUsedAt(id)

      if (!success) {
        mainLog.error('[SearchPresetService] Failed to update last used at for search preset', {
          presetId: id
        })
        throw new Error('Failed to update last used at for search preset')
      }
      return success
    } catch (error) {
      mainLog.error('[SearchPresetService] Error while updating last used at for search preset', {
        presetId: id,
        error: (error as Error).message
      })
      throw error
    }
  }

  async deleteSearchPreset(id: number): Promise<boolean> {
    try {
      const success = searchPresetsRepo.delete(id)

      if (!success) {
        mainLog.error('[SearchPresetService] Failed to delete search preset', {
          presetId: id
        })
        throw new Error('Failed to delete search preset')
      }

      // Check Settings if the deleted preset was set as default, and if so, delete the default preset setting as well
      const defaultSearchPresetId = getSettingByPath('search', 'defaultPresetId') as unknown as
        | number
        | undefined
      if (defaultSearchPresetId === id) {
        mainLog.info(
          '[SearchPresetService] Deleted preset was set as default, clearing default preset setting',
          {
            presetId: id
          }
        )
        await updateSettings('search', { defaultPresetId: undefined })
      }

      return success
    } catch (error) {
      mainLog.error('[SearchPresetService] Error while deleting search preset', {
        presetId: id,
        error: (error as Error).message
      })
      throw error
    }
  }

  getAllSearchPresets(): SearchPresetQuery[] {
    return searchPresetsRepo.getAll()
  }

  getSearchPresetById(id: number): SearchPresetQuery | undefined {
    return searchPresetsRepo.getPresetById(id)
  }

  getSearchPresetByName(name: string): SearchPresetQuery | undefined {
    return searchPresetsRepo.getByName(name)
  }

  isPresetNameTaken(name: string): boolean {
    const preset = searchPresetsRepo.getByName(name)
    return !!preset
  }
}
export const searchPresetService = new SearchPresetService()

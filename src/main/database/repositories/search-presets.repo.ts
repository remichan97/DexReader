import { SearchPresetQuery } from './../queries/search-presets/search-preset.query'
import { databaseConnection } from '../connection'
import { searchPresets } from '../schemas'
import { SearchPresetsMapper } from '../mappers/search-presets.mapper'
import { eq } from 'drizzle-orm'
import { CreateSearchPresetCommand } from '../commands/search-presets/create-search-preset.command'
import { mainLog } from '../../services/logging/main-logging.service'

class SearchPresetsRepository {
  private get db(): ReturnType<typeof databaseConnection.getDb> {
    return databaseConnection.getDb()
  }

  getAll(): SearchPresetQuery[] {
    const results = this.db.select().from(searchPresets).all()

    return results.map(SearchPresetsMapper.toQuery)
  }

  getPresetById(id: number): SearchPresetQuery | undefined {
    const result = this.db.select().from(searchPresets).where(eq(searchPresets.id, id)).get()

    if (!result) {
      return undefined
    }

    return SearchPresetsMapper.toQuery(result)
  }

  getByName(name: string): SearchPresetQuery | undefined {
    const result = this.db.select().from(searchPresets).where(eq(searchPresets.name, name)).get()

    if (!result) {
      return undefined
    }

    return SearchPresetsMapper.toQuery(result)
  }

  // Create new, or update existing preset with the same name
  // Return true if the change was successfully committed to the database, false otherwise
  create(command: CreateSearchPresetCommand): boolean {
    const now = new Date()

    if (command.name.length > 50) {
      mainLog.error(
        '[Database] Refused to create search preset with name longer than 50 characters',
        {
          presetName: command.name
        }
      )
      throw new Error('Preset name cannot exceed 50 characters')
    }

    const result = this.db
      .insert(searchPresets)
      .values({
        name: command.name,
        searchQuery: command.searchQuery ?? '',
        filters: command.filters,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now
      })
      .onConflictDoUpdate({
        target: searchPresets.name,
        set: {
          searchQuery: command.searchQuery ?? '',
          filters: command.filters,
          updatedAt: new Date(),
          lastUsedAt: new Date()
        }
      })
      .run()

    return result.changes > 0 || result.lastInsertRowid !== 0
  }

  // Update lastUsedAt to the current date for the preset with the given id
  // Use this when the user selects a preset on the UI
  // Return true if the change was successfully committed to the database, false otherwise
  updateLastUsedAt(id: number): boolean {
    const result = this.db
      .update(searchPresets)
      .set({ lastUsedAt: new Date() })
      .where(eq(searchPresets.id, id))
      .run()

    return result.changes > 0
  }

  delete(id: number): boolean {
    const result = this.db.delete(searchPresets).where(eq(searchPresets.id, id)).run()

    return result.changes > 0
  }

  isExists(name: string): boolean {
    const results = this.db.select().from(searchPresets).where(eq(searchPresets.name, name)).get()

    return results !== undefined
  }
}
export const searchPresetsRepo = new SearchPresetsRepository()

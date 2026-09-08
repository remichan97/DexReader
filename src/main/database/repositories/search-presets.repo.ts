import { SearchPresetQuery } from '@shared/contracts/settings/search-preset.contract'
import { databaseConnection } from '../db-connection'
import { searchPresets } from '../schemas'
import { SearchPresetsMapper } from '../mappers/search-presets.mapper'
import { eq } from 'drizzle-orm'
import { CreateSearchPresetCommand } from '@shared/commands/services/create-search-preset.command'

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
  create(command: CreateSearchPresetCommand): SearchPresetQuery {
    const now = new Date()

    const result = this.db
      .insert(searchPresets)
      .values({
        name: command.name,
        searchQuery: command.searchQuery ?? '',
        filters: command.filters,
        resultsPerPage: command.resultsPerPage ?? 20,
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
          lastUsedAt: new Date(),
          resultsPerPage: command.resultsPerPage ?? searchPresets.resultsPerPage
        }
      })
      .returning()
      .get()

    return SearchPresetsMapper.toQuery(result)
  }

  // Update lastUsedAt to the current date for the preset with the given id
  // Use this when the user selects a preset on the UI
  // Return true if the change was successfully committed to the database, false otherwise
  updateLastUsedAt(id: number): boolean {
    const existingPreset = this.getPresetById(id)
    if (!existingPreset) {
      return false
    }

    const result = this.db
      .update(searchPresets)
      .set({ lastUsedAt: new Date() })
      .where(eq(searchPresets.id, id))
      .run()

    return result.changes > 0
  }

  delete(id: number): boolean {
    const existingPreset = this.getPresetById(id)
    if (!existingPreset) {
      return false
    }

    const result = this.db.delete(searchPresets).where(eq(searchPresets.id, id)).run()

    return result.changes > 0
  }
}
export const searchPresetsRepo = new SearchPresetsRepository()

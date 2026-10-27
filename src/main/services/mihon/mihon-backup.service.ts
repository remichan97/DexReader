import { SaveChapterCommand } from '@shared/commands/repositories/progress/save-chapter.command'
import { mihonBackup } from '../helpers/mihon-backup.helper'
import fs from 'node:fs/promises'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { BackupSource } from '../types/mihon/backup-source.type'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { MihonImportContract } from '@shared/contracts/services/mihon/mihon-import.contract'
import { MihonImportOptionsContract } from '@shared/contracts/services/mihon/mihon-import-options.contract'
import { MihonSkippedMangaContract } from '@shared/contracts/services/mihon/mihon-skipped-manga.contract'
import { decodeBackup, MihonBackupFormatError } from './mihon-backup.decoder'

// MangaDex (English) source ID from the Tachiyomi extension.
// A MangaDex extension source's ID is derived from its name and language, so each language has
// its own ID. Only English is imported; the other languages are offered back to the user.
// See: https://github.com/tachiyomiorg/tachiyomi-extensions
const MANGADEX_SOURCE_ID = 2499283573021220255n
const MANGADEX_SOURCE_NAME = 'mangadex'

/**
 * A backup's entries sorted by what DexReader can do with them.
 */
interface ClassifiedEntries {
  /** English MangaDex entries: imported straight away */
  english: BackupManga[]
  /** MangaDex entries from another language's source: listed for the user to add back */
  otherLanguage: BackupManga[]
  /** Everything else (other sources, or MangaDex entries whose source can't be identified) */
  ignoredCount: number
}

class MihonBackupService {
  private abortController?: AbortController

  async importFromBackup(
    filePath: string,
    options: MihonImportOptionsContract = {}
  ): Promise<MihonImportContract> {
    this.abortController?.abort()
    this.abortController = new AbortController()
    // Captured now, not read back through this.abortController later - a second import
    // starting mid-await would otherwise reassign that field, leaving this call's signal
    // pointing at the NEW controller instead of its own and defeating cancellation entirely.
    const signal = this.abortController.signal
    // Use node's fs instead of our secureFs since this is what users provide themselves using the file picker, not an external file.
    const buffer = await this.readBackupFile(filePath)

    const backup = await decodeBackup(buffer)
    const entries = this.classifyEntries(backup.backupManga, backup.backupSources ?? [])

    // A second pass only brings in the other-language titles the user picked; the English ones
    // were handled by the first pass and are not touched again
    const includeIds = options.includeMangaIds ? new Set(options.includeMangaIds) : undefined
    const otherLanguageById = this.indexByMangaId(entries.otherLanguage)
    const toImport = includeIds
      ? entries.otherLanguage.filter((entry) => includeIds.has(this.idOf(entry) ?? ''))
      : entries.english

    const skippedOtherLanguage = this.buildSkippedList(
      otherLanguageById,
      new Set([...(includeIds ?? []), ...entries.english.map((entry) => this.idOf(entry) ?? '')])
    )
    const ignoredOtherSourceCount = includeIds ? undefined : entries.ignoredCount

    // Nothing to import, report what was left out so the user can still see why
    if (toImport.length === 0) {
      return {
        importedMangaCount: 0,
        failedMangaCount: 0,
        skippedMangaCount: 0,
        skippedOtherLanguage,
        ignoredOtherSourceCount
      }
    }

    const result = await this.importManga(toImport, backup.backupCategories, signal)
    return { ...result, skippedOtherLanguage, ignoredOtherSourceCount }
  }

  private async readBackupFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath)
    } catch (error) {
      // Adding back skipped titles re-reads the file, which the user may have moved since
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new MihonBackupFormatError(
          'MIHON_BACKUP_FILE_MISSING',
          'The backup file could not be found',
          error
        )
      }
      throw error
    }
  }

  /**
   * Sort favourite entries into English MangaDex, other-language MangaDex and everything else.
   *
   * Other-language MangaDex sources are recognised by the backup's own source list: a source
   * named "MangaDex" whose ID isn't the English one. Entries whose source isn't in that list (or
   * has a blank name, which some backups have) can't be told apart from other sites and count as
   * ignored.
   */
  private classifyEntries(manga: BackupManga[], sources: BackupSource[]): ClassifiedEntries {
    const otherLanguageSourceIds = new Set<bigint>()
    for (const source of sources) {
      const id = this.parseSourceId(source.sourceId)
      if (
        id !== undefined &&
        id !== MANGADEX_SOURCE_ID &&
        source.name?.trim().toLowerCase() === MANGADEX_SOURCE_NAME
      ) {
        otherLanguageSourceIds.add(id)
      }
    }

    const classified: ClassifiedEntries = { english: [], otherLanguage: [], ignoredCount: 0 }

    for (const entry of manga) {
      // Assume all manga in backup are favourite, unless explicitly marked otherwise
      const isFavourite = entry.favorite ?? true
      if (!isFavourite) continue

      const sourceId = this.parseSourceId(entry.source)
      if (sourceId === MANGADEX_SOURCE_ID) {
        classified.english.push(entry)
      } else if (sourceId !== undefined && otherLanguageSourceIds.has(sourceId)) {
        classified.otherLanguage.push(entry)
      } else {
        classified.ignoredCount++
      }
    }

    return classified
  }

  private parseSourceId(value: string | number | undefined): bigint | undefined {
    if (value === undefined || value === '') return undefined

    try {
      return BigInt(value)
    } catch {
      return undefined
    }
  }

  private idOf(entry: BackupManga): string | undefined {
    return mihonBackup.extractIdFromUrl(entry.url, 'manga')
  }

  private indexByMangaId(entries: BackupManga[]): Map<string, BackupManga> {
    const index = new Map<string, BackupManga>()
    for (const entry of entries) {
      const id = this.idOf(entry)
      if (id && !index.has(id)) index.set(id, entry)
    }
    return index
  }

  /**
   * The titles to offer back to the user. Titles that are already in the library, or are being
   * imported in this pass, aren't offered.
   */
  private buildSkippedList(
    otherLanguageById: Map<string, BackupManga>,
    handledIds: Set<string>
  ): MihonSkippedMangaContract[] {
    const list: MihonSkippedMangaContract[] = []

    for (const [mangaId, entry] of otherLanguageById) {
      if (handledIds.has(mangaId)) continue
      if (mangaRepo.getLibraryMangaByCustomCondition({ mangaId }).length > 0) continue

      list.push({ mangaId, title: entry.title || 'Unknown Title' })
    }

    return list.sort((a, b) => a.title.localeCompare(b.title))
  }

  private async importManga(
    mangaList: BackupManga[],
    categories: BackupCategory[],
    signal: AbortSignal
  ): Promise<MihonImportContract> {
    const result: MihonImportContract = {
      importedMangaCount: 0,
      skippedMangaCount: 0,
      failedMangaCount: 0,
      errors: [],
      importedMangaIds: []
    }
    const upsertCommand: UpsertMangaCommand[] = []
    const addToCollectionsCommands: AddToCollectionCommand[] = []
    const progressCommands: SaveProgressCommand[] = []
    const chapterMetadata: SaveChapterCommand[] = []

    // First, create categories
    const categoryMap = mihonBackup.mapCategoriesToCollections(categories)

    // Then, import manga
    for (const manga of mangaList) {
      if (signal.aborted) {
        result.skippedMangaCount +=
          mangaList.length - result.importedMangaCount - result.failedMangaCount
        break
      }

      try {
        const mangaId = mihonBackup.extractIdFromUrl(manga.url, 'manga')

        if (!mangaId) {
          // Unable to extract manga ID from URL, skip
          result.failedMangaCount++
          result.errors?.push({
            mangaId: manga.url,
            title: manga.title || 'Unknown Title',
            reason: 'Invalid manga URL'
          })
          continue
        }

        // Check if manga already exists
        const existing = mangaRepo.getLibraryMangaByCustomCondition({ mangaId: mangaId })

        if (existing.length > 0) {
          result.skippedMangaCount++
          continue
        }

        // Create manga entry
        upsertCommand.push(mihonBackup.processMangaCommand(manga))

        // Assign to collections based on categories
        const categoryCommands = mihonBackup.processCategoryAssignments(
          manga.categories,
          mangaId,
          categoryMap
        )
        addToCollectionsCommands.push(...categoryCommands)
        // Small bit of chapter metadata here to make sure we at least got the history show up properly
        const chapterCommands = mihonBackup.processChapterMetadata(manga.chapters, mangaId)
        chapterMetadata.push(...chapterCommands)

        // Process reading progress
        const mangaProgressCommands = mihonBackup.processProgressCommands(
          manga.chapters,
          manga.history,
          mangaId
        )
        progressCommands.push(...mangaProgressCommands)
      } catch (error) {
        result.failedMangaCount++
        result.errors?.push({
          mangaId: manga.url,
          title: manga.title || 'Unknown Title',
          reason: (error as Error).message
        })
      }
    }

    // Now we batch everything we have built
    mangaRepo.batchUpsertManga(upsertCommand)
    collectionRepo.batchAddToCollection(addToCollectionsCommands)
    chapterRepo.saveChapters(chapterMetadata)
    progressRepo.saveProgress(progressCommands)

    result.importedMangaCount = upsertCommand.length
    result.importedMangaIds = upsertCommand.map((cmd) => cmd.mangaId)
    return result
  }

  cancelImport(): void {
    this.abortController?.abort()
  }
}
export const mihonBackupService = new MihonBackupService()

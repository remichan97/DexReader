import { databaseConnection } from '../../database/db-connection'
import { UpdateFirstReadCommand } from '@shared/commands/repositories/progress/update-firstread.command'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import Pako from 'pako'
import protobuf from 'protobufjs'
import { DexReaderBackup } from '../types/dexreader/backup.type'
import packgageData from '../../../../package.json'
import { ValidationError } from '../../ipc/error/validation.error'
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import { SaveChapterCommand } from '@shared/commands/repositories/progress/save-chapter.command'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { UpdateMangaOverrideCommand } from '@shared/commands/repositories/manga/update-manga-override.command'
import { CreateCollectionCommand } from '@shared/commands/repositories/collections/create-collection.command'
import { DexReaderManga } from '../types/dexreader/manga.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { dexreaderImport } from '../helpers/dexreader-import.helper'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'
import { readerSettingsRepo } from '../../database/repositories/reader-settings.repo'
import { DexReaderImportContract } from '@shared/contracts/services/dexreader/import.contract'

class DexReaderImportService {
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'dexreader.proto'
  )
  private abortController?: AbortController

  async importLibrary(filePath: string): Promise<DexReaderImportContract> {
    // Abort any ongoing import if exists
    if (this.abortController) {
      this.abortController.abort()
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // Read the file and process the import
    const buffer = await fs.readFile(filePath)
    const decommpressed = Pako.ungzip(buffer)

    const root = await protobuf.load(this.schemaPath)
    const importData = root
      .lookupType('DexReaderBackup')
      .decode(decommpressed)
      .toJSON() as DexReaderBackup

    // Check the schema version - only major version needs to match
    // Minor and patch versions are backwards compatible
    // TODO: For now we rejects anything not 1.x.x, but in the future we might want to add migration paths
    // should we change the schema in a non-backwards compatible way
    const currentMajor = Number.parseInt(packgageData.version.split('.')[0], 10)
    const importMajor = Number.parseInt(String(importData.schemaVersion).split('.')[0], 10)

    if (currentMajor !== importMajor) {
      throw new ValidationError(
        'schemaVersion',
        `Incompatible schema version: expected major version ${currentMajor}.x.x, got ${importData.schemaVersion}`
      )
    }

    // Now we begin the import, starting with the library data, to make sure no FK constraints are violated
    // No try/catch here, no manga data, no collections, no progress, no reader settings as manga must exist first
    const libraryResult = this.importMangaData(
      importData.library.mangaList,
      importData.library.chapterList,
      signal
    )

    // Next, we work on collections
    // Skip collections if none are present
    if (importData.collections) {
      try {
        this.importCollectionsData(
          importData.collections?.collectionList,
          importData.collections?.collectionItems,
          signal,
          libraryResult
        )
      } catch (error) {
        // If collection import fails, it's okay to continue, just log the error
        libraryResult.sectionErrors.collection = (error as Error).message
        libraryResult.importedCollectionsCount = 0
        libraryResult.importedCollectionItemsCount = 0
      }
    }
    // As well as the progress data, reading stats should be calculated the moment the progress data are flowing in
    if (importData.progress) {
      try {
        this.importProgressData(
          importData.progress.mangaProgress,
          importData.progress.chapterProgress,
          signal,
          libraryResult
        )
      } catch (error) {
        // If progress import fails, it's okay to continue, just log the error
        libraryResult.sectionErrors.progress = (error as Error).message
        libraryResult.importedMangaProgressCount = 0
      }
    }

    // Finally work on reader settings overrides
    if (importData.readerSettings) {
      try {
        this.importMangaReaderOverrides(importData.readerSettings.overrides, signal, libraryResult)
      } catch (error) {
        // If reader settings import fails, it's okay to continue, just log the error
        libraryResult.sectionErrors.readerSettings = (error as Error).message
        libraryResult.importedReaderOverridesCount = 0
      }
    }

    return libraryResult
  }

  cancelImport(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  private importMangaData(
    importManga: DexReaderManga[],
    importChapters: DexReaderChapter[],
    signal: AbortSignal
  ): DexReaderImportContract {
    const saveChapterCommand: SaveChapterCommand[] = []
    const upsertMangaCommand: UpsertMangaCommand[] = []
    const result: DexReaderImportContract = {
      importedMangaCount: 0,
      importedChaptersCount: 0,
      importedCollectionsCount: 0,
      importedCollectionItemsCount: 0,
      importedMangaProgressCount: 0,
      importedReaderOverridesCount: 0,
      skippedCollectionsCount: 0,
      skippedReaderSettingsCount: 0,
      sectionErrors: {}
    }

    for (const item of importManga) {
      signal.throwIfAborted()
      upsertMangaCommand.push(dexreaderImport.processUpsertMangaCommand(item))
      // Count only favourite manga as imported
      if (item.isFavourite) {
        result.importedMangaCount += 1
      }
    }

    if (importChapters) {
      for (const item of importChapters) {
        signal.throwIfAborted()
        saveChapterCommand.push(dexreaderImport.processSaveChapterCommand(item))
        result.importedChaptersCount += 1
      }
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    databaseConnection.getDb().transaction((tx) => {
      mangaRepo.batchUpsertManga(upsertMangaCommand, tx)
      chapterRepo.saveChapters(saveChapterCommand, tx)
    })

    return result
  }

  private importCollectionsData(
    collections: DexReaderCollection[],
    collectionItems: DexReaderCollectionItem[],
    signal: AbortSignal,
    result: DexReaderImportContract
  ): void {
    const createCollectionCommand: CreateCollectionCommand[] = []

    // Step 1: Build name→ID map of existing collections (for SKIP + MERGE)
    const existingCollections = collectionRepo.getAllCollections()
    const nameToIdMap = new Map(existingCollections.map((c) => [c.name, c.id]))

    // Step 2: Build oldId→newId mapping for collection ID translation
    const collectionIdMap = new Map<number, number>()

    // Track which collections from backup need to be created
    const collectionsToCreate: DexReaderCollection[] = []

    for (const item of collections) {
      signal.throwIfAborted()

      const existingId = nameToIdMap.get(item.name)
      if (existingId === undefined) {
        // New collection - will be created
        collectionsToCreate.push(item)
        createCollectionCommand.push(dexreaderImport.processCreateCollectionCommand(item))
      } else {
        // Collection already exists - map old ID to existing ID (MERGE strategy)
        collectionIdMap.set(item.id, existingId)
        result.skippedCollectionsCount += 1
      }
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    databaseConnection.getDb().transaction((tx) => {
      // Step 3: Create new collections and map their old IDs to new IDs
      if (createCollectionCommand.length > 0) {
        const newCollectionIds = collectionRepo.batchCreateCollections(createCollectionCommand, tx)
        result.importedCollectionsCount = newCollectionIds.length

        // Map each old collection ID to its new database ID
        for (let i = 0; i < collectionsToCreate.length; i++) {
          collectionIdMap.set(collectionsToCreate[i].id, newCollectionIds[i])
        }
      }

      // Step 4: Add manga to collections using the mapped IDs
      const addToCollectionCommand: AddToCollectionCommand[] = []

      for (const item of collectionItems) {
        signal.throwIfAborted()

        // Translate old collection ID to new ID
        const newCollectionId = collectionIdMap.get(item.collectionId)

        if (newCollectionId === undefined) {
          // Collection wasn't imported (shouldn't happen, but defensive)
          continue
        }

        addToCollectionCommand.push({
          collectionId: newCollectionId, // Use the NEW mapped ID
          mangaId: item.mangaId
        })
      }

      // Final signal check before adding items
      signal.throwIfAborted()

      if (addToCollectionCommand.length > 0) {
        collectionRepo.batchAddToCollection(addToCollectionCommand, tx)
        result.importedCollectionItemsCount = addToCollectionCommand.length
      }
    })
  }

  private importProgressData(
    mangaProgress: DexReaderMangaProgress[],
    chapterProgress: DexReaderChapterProgress[],
    signal: AbortSignal,
    result: DexReaderImportContract
  ): void {
    const saveProgressCommand: SaveProgressCommand[] = []
    const updateFirstReadCommand: UpdateFirstReadCommand[] = []

    for (const item of chapterProgress) {
      signal.throwIfAborted()
      saveProgressCommand.push(dexreaderImport.processSaveProgressCommand(item))
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    // Early return if there's nothing to import
    if (saveProgressCommand.length === 0) {
      return
    }

    // First, we save progress data first
    progressRepo.saveProgress(saveProgressCommand)

    // Then patch the firstReadAt timestamps, this is to preserve the original first read timestamps
    for (const item of mangaProgress) {
      signal.throwIfAborted()
      updateFirstReadCommand.push(dexreaderImport.processUpdateFirstReadCommand(item))
    }
    progressRepo.updateFirstReadAt(updateFirstReadCommand)
    result.importedMangaProgressCount = saveProgressCommand.length
  }

  private importMangaReaderOverrides(
    overrides: DexReaderMangaReaderOverride[],
    signal: AbortSignal,
    result: DexReaderImportContract
  ): void {
    const updateMangaOverrideCommand: UpdateMangaOverrideCommand[] = []

    const currentSettings = readerSettingsRepo.getAllOverridesWithMetadata()

    for (const item of overrides) {
      signal.throwIfAborted()
      // Skip overrides that already exist in the database
      if (currentSettings.some((s) => s.mangaId === item.mangaId)) {
        result.skippedReaderSettingsCount += 1
        continue
      }
      updateMangaOverrideCommand.push(dexreaderImport.processSaveReaderOverrideCommand(item))
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    // Early return if there's nothing to import
    if (updateMangaOverrideCommand.length === 0) {
      return
    }

    // Now we can perform the database operations
    readerSettingsRepo.batchUpdateOverrides(updateMangaOverrideCommand)
    result.importedReaderOverridesCount = updateMangaOverrideCommand.length
  }
}
export const dexreaderImportService = new DexReaderImportService()

import { UpdateFirstReadCommand } from './../../database/commands/progress/update-firstread.command'
import path from 'node:path'
import fs from 'node:fs/promises'
import { DexReaderImportResult } from '../results/dexreader/import.result'
import Pako from 'pako'
import protobuf from 'protobufjs'
import { DexReaderBackup } from '../types/dexreader/backup.type'
import packgageData from '../../../../package.json'
import { ValidationError } from '../../ipc/validationError'
import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'
import { SaveChapterCommand } from '../../database/commands/progress/save-chapter.command'
import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { UpdateMangaOverrideCommand } from '../../database/commands/manga/update-manga-override.command'
import { CreateCollectionCommand } from '../../database/commands/collections/create-collection.command'
import { DexReaderManga } from '../types/dexreader/manga.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { dexreaderImport } from '../helpers/dexreader-import.helper'
import { mangaRepository } from '../../database/repository/manga.repo'
import { chapterRepo } from '../../database/repository/chapter.repo'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { collectionRepo } from '../../database/repository/collection.repo'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { SaveProgressCommand } from '../../database/commands/progress/save-progress.command'
import { progressRepo } from '../../database/repository/manga-progress.repo'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'
import { readerSettingsRepo } from '../../database/repository/reader-settings.repo'

export class DexReaderImportService {
  private readonly schemaPath = path.join(
    __dirname,
    '../../',
    'services',
    'protobuf',
    'schemas',
    'dexreader.proto'
  )
  private abortController?: AbortController

  async importLibrary(filePath: string): Promise<DexReaderImportResult> {
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

    // Initialize result outside try block to preserve partial progress on abort
    let libraryResult: DexReaderImportResult = {
      importedMangaCount: 0,
      importedChaptersCount: 0,
      importedCollectionsCount: 0,
      importedCollectionItemsCount: 0,
      importedMangaProgressCount: 0,
      importedReaderOverridesCount: 0,
      skippedMangaCount: 0,
      skippedChaptersCount: 0,
      skippedCollectionsCount: 0,
      errors: [],
      message: ''
    }

    try {
      // Now we begin the import, starting with the library data, to make sure no FK constraints are violated
      libraryResult = this.importMangaData(
        importData.library.mangaList,
        importData.library.chapterList,
        signal
      )

      // Next, we work on collections
      // Skip collections if none are present
      if (importData.collections && importData.collections.collectionList.length > 0) {
        this.importCollectionsData(
          importData.collections?.collectionList,
          importData.collections?.collectionItems,
          signal,
          libraryResult
        )
      }
      // As well as the progress data, reading stats should be calculated the moment the progress data are flowing in
      if (importData.progress) {
        this.importProgressData(
          importData.progress.mangaProgress,
          importData.progress.chapterProgress,
          signal,
          libraryResult
        )
      }

      // Finally work on reader settings overrides
      if (importData.readerSettings) {
        this.importMangaReaderOverrides(importData.readerSettings.overrides, signal, libraryResult)
      }

      libraryResult.message = 'Import completed successfully'
      return libraryResult
    } catch (error) {
      // Handle user-initiated cancellation separately
      if (error instanceof Error && error.name === 'AbortError') {
        libraryResult.message = 'Import cancelled by user'
        return libraryResult
      }

      // Log and re-throw actual errors
      console.error('Error during DexReader import:', error)
      throw error
    }
  }

  cancelImport(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  private importMangaData(
    manga: DexReaderManga[],
    chapter: DexReaderChapter[],
    signal: AbortSignal
  ): DexReaderImportResult {
    const upsertMangaCommand: UpsertMangaCommand[] = []
    const saveChapterCommand: SaveChapterCommand[] = []
    const result: DexReaderImportResult = {
      importedMangaCount: 0,
      importedChaptersCount: 0,
      importedCollectionsCount: 0,
      importedCollectionItemsCount: 0,
      importedMangaProgressCount: 0,
      importedReaderOverridesCount: 0,
      skippedMangaCount: 0,
      skippedChaptersCount: 0,
      skippedCollectionsCount: 0,
      errors: [],
      message: ''
    }

    for (const item of manga) {
      signal.throwIfAborted()
      upsertMangaCommand.push(dexreaderImport.processUpsertMangaCommand(item))
    }

    for (const item of chapter) {
      signal.throwIfAborted()
      saveChapterCommand.push(dexreaderImport.processSaveChapterCommand(item))
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    mangaRepository.batchUpsertManga(upsertMangaCommand)
    result.importedMangaCount = upsertMangaCommand.length

    chapterRepo.saveChapters(saveChapterCommand)
    result.importedChaptersCount = saveChapterCommand.length

    return result
  }

  private importCollectionsData(
    collections: DexReaderCollection[],
    collectionItems: DexReaderCollectionItem[],
    signal: AbortSignal,
    result: DexReaderImportResult
  ): void {
    const createCollectionCommand: CreateCollectionCommand[] = []
    const addToCollectionCommand: AddToCollectionCommand[] = []

    for (const item of collections) {
      signal.throwIfAborted()
      createCollectionCommand.push(dexreaderImport.processCreateCollectionCommand(item))
    }

    for (const item of collectionItems) {
      signal.throwIfAborted()
      addToCollectionCommand.push(dexreaderImport.processAddToCollectionCommand(item))
    }

    // Final signal check before we start the database operations
    signal.throwIfAborted()

    // Early return if there's nothing to import
    if (createCollectionCommand.length === 0 && addToCollectionCommand.length === 0) {
      return
    }

    // Now we can perform the database operations
    // We assume that collections are created in the same order as they were exported
    const createdCollections = collectionRepo.batchCreateCollections(createCollectionCommand)
    result.importedCollectionsCount = createdCollections.length

    collectionRepo.batchAddToCollection(addToCollectionCommand)
    result.importedCollectionItemsCount = addToCollectionCommand.length
  }

  private importProgressData(
    mangaProgress: DexReaderMangaProgress[],
    chapterProgress: DexReaderChapterProgress[],
    signal: AbortSignal,
    result: DexReaderImportResult
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
    result: DexReaderImportResult
  ): void {
    const updateMangaOverrideCommand: UpdateMangaOverrideCommand[] = []

    for (const item of overrides) {
      signal.throwIfAborted()
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

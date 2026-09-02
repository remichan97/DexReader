import { SaveChapterCommand } from '@shared/commands/repositories/progress/save-chapter.command'
import { mihonBackup } from '../helpers/mihon-backup.helper'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { UpsertMangaCommand } from '@shared/commands/repositories/manga/upsert-manga.command'
import Pako from 'pako'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import protobuf from 'protobufjs'
import { Backup } from '../types/mihon/backup.type'
import { collectionRepo } from '../../database/repositories/collection.repo'
import { mangaRepo } from '../../database/repositories/manga.repo'
import { AddToCollectionCommand } from '@shared/commands/repositories/collections/add-to-collection.command'
import { SaveProgressCommand } from '@shared/commands/repositories/progress/save-progress.command'
import { progressRepo } from '../../database/repositories/manga-progress.repo'
import { chapterRepo } from '../../database/repositories/chapter.repo'
import { MihonImportContract } from '@shared/contracts/services/mihon/mihon-import.contract'

// MangaDex source ID from Tachiyomi extension
// See: https://github.com/tachiyomiorg/tachiyomi-extensions
const MANGADEX_SOURCE_ID = 2499283573021220255n

class MihonBackupService {
  private abortController?: AbortController
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'mihon.proto'
  )

  async importFromBackup(filePath: string): Promise<MihonImportContract> {
    this.abortController?.abort()
    this.abortController = new AbortController()
    // Use node's fs instead of our secureFs since this is what users provide themselves using the file picker, not an external file.
    const buffer = await fs.readFile(filePath)

    const decompressed = Pako.ungzip(buffer)

    const root = await protobuf.load(this.schemaPath)
    const backup = root.lookupType('Backup').decode(decompressed).toJSON() as Backup

    const mangadexManga = backup.backupManga.filter((it) => {
      const isMangaDex = BigInt(it.source) === MANGADEX_SOURCE_ID

      // Assume all manga in backup are favourite, unless explicitly marked otherwise
      const isFavourite = it.favorite ?? true

      return isMangaDex && isFavourite
    })

    // No MangaDex manga found in backup, return empty result
    if (mangadexManga.length === 0) {
      return {
        importedMangaCount: 0,
        failedMangaCount: 0,
        skippedMangaCount: 0
      }
    }

    const signal = this.abortController.signal

    return await this.importManga(mangadexManga, backup.backupCategories, signal)
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

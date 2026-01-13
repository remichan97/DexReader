import { SaveChapterCommand } from './../../database/commands/progress/save-chapter.command';
import { mihonBackup } from './../helpers/mihon-backup.helper'
import fs from 'node:fs/promises'
import { UpsertMangaCommand } from '../../database/commands/collections/upsert-manga.command'
import Pako from 'pako'
import { ImportResult } from '../results/import.result'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import protobuf from 'protobufjs'
import { Backup } from '../types/mihon/backup.type'
import { collectionRepo } from '../../database/repository/collection.repo'
import { mangaRepository } from '../../database/repository/manga.repo'
import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import path from 'node:path'
import { SaveProgressCommand } from '../../database/commands/progress/save-progress.command'
import { progressRepo } from '../../database/repository/manga-progress.repo'

export class MihonService {
  // MangaDex source ID from Tachiyomi extension
  // See: https://github.com/tachiyomiorg/tachiyomi-extensions
  private static readonly MangaDexSourceId = 2499283573021220255n

  private abortController?: AbortController
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'mihon.proto'
  )

  async importFromBackup(filePath: string): Promise<ImportResult> {
    this.abortController?.abort()
    this.abortController = new AbortController()
    // Use node's fs instead of our secureFs since this is what users provide themselves using the file picker, not an external file.
    const buffer = await fs.readFile(filePath)

    const decompressed = Pako.ungzip(buffer)

    const root = await protobuf.load(this.schemaPath)
    const backup = root.lookupType('Backup').decode(decompressed).toJSON() as Backup

    const mangadexManga = backup.backupManga.filter((it) => {
      const isMangaDex = BigInt(it.source) === MihonService.MangaDexSourceId

      // Assume all manga in backup are favourite, unless explicitly marked otherwise
      const isFavourite = it.favorite ?? true

      return isMangaDex && isFavourite
    })

    // No MangaDex manga found in backup, return early
    // Probably error out on the UI side?
    // or show 0 imported manga message?
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
  ): Promise<ImportResult> {
    const result: ImportResult = {
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
        const existing = mangaRepository.getLibraryMangaByCustomCondition({ mangaId: mangaId })

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
    mangaRepository.batchUpsertManga(upsertCommand)
    collectionRepo.batchAddToCollection(addToCollectionsCommands)
    progressRepo.saveChapters(chapterMetadata)
    progressRepo.saveProgress(progressCommands)

    result.importedMangaCount = upsertCommand.length
    result.importedMangaIds = upsertCommand.map((cmd) => cmd.mangaId)
    return result
  }

  cancelImport(): void {
    this.abortController?.abort()
  }
}
export const mihonService = new MihonService()

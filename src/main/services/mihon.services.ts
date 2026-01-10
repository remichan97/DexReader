import { UpsertMangaCommand } from './../database/commands/collections/upsert-manga.command'
import Pako from 'pako'
import { secureFs } from '../filesystem/secureFs'
import { ImportResult } from './results/import.result'
import { BackupCategory } from './types/mihon/backup-category.type'
import { BackupManga } from './types/mihon/backup-manga.type'
import protobuf from 'protobufjs'
import { Backup } from './types/mihon/backup.type'
import { collectionRepo } from '../database/repository/collection.repo'
import { mangaRepository } from '../database/repository/manga.repo'
import { PublicationStatus } from '../api/enums'
import { AddToCollectionCommand } from '../database/commands/collections/add-to-collection.command'
import path from 'node:path'

export class MihonService {
  // MangaDex source ID from Tachiyomi extension
  // See: https://github.com/tachiyomiorg/tachiyomi-extensions
  private static readonly MangaDexSourceId = 2499283573021220255n

  private static readonly StatusMap: Record<number, PublicationStatus> = {
    0: PublicationStatus.Ongoing,
    1: PublicationStatus.Ongoing,
    2: PublicationStatus.Completed,
    3: PublicationStatus.Ongoing,
    4: PublicationStatus.Completed,
    5: PublicationStatus.Cancelled,
    6: PublicationStatus.Hiatus
  } as const

  private abortController?: AbortController
  private readonly schemaPath = path.join(
    __dirname,
    'services',
    'protobuf',
    'schemas',
    'mihon.proto'
  )

  private static readonly MANGADEX_URL_PATTERN = /\/(?:manga|title)\/([a-f0-9-]{36})(?:\/|$)/i

  async importFromBackup(filePath: string): Promise<ImportResult> {
    this.abortController?.abort()
    this.abortController = new AbortController()
    const buffer = (await secureFs.readFile(filePath)) as Buffer

    const decompressed = Pako.ungzip(buffer)

    const root = await protobuf.load(this.schemaPath)
    const backup = root.lookupType('Backup').decode(decompressed) as unknown as Backup

    const mangadexManga = backup.backupManga.filter(
      (manga) => manga.source === MihonService.MangaDexSourceId
    )

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
    const categoryMap = new Map<number, number>() // Tachiyomi/Mihon -> Our app ID
    const result: ImportResult = {
      importedMangaCount: 0,
      skippedMangaCount: 0,
      failedMangaCount: 0,
      errors: [],
      importedMangaIds: []
    }
    const upsertCommand: UpsertMangaCommand[] = []
    const addToCollectionsCommands: AddToCollectionCommand[] = []

    // First, create categories
    const existing = collectionRepo.getAllCollections()
    let fallbackKey = -1
    for (const category of categories) {
      const match = existing.find((col) => col.name === category.name)

      if (match) {
        categoryMap.set(category.id ?? fallbackKey--, match.id)
      } else {
        const created = collectionRepo.createCollection({
          name: category.name,
          description: 'Import from Tachiyomi/Mihon backup'
        })
        categoryMap.set(category.id ?? fallbackKey--, created)
      }
    }

    // Then, import manga
    for (const manga of mangaList) {
      if (signal.aborted) {
        result.skippedMangaCount +=
          mangaList.length - result.importedMangaCount - result.failedMangaCount
        break
      }

      try {
        const mangaId = this.extractMangaIdFromUrl(manga.url)

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
        const existing = mangaRepository.getMangaByCustomCondition({ mangaId: mangaId })

        if (existing) {
          result.skippedMangaCount++
          continue
        }

        // Create manga entry
        upsertCommand.push({
          mangaId: mangaId,
          title: manga.title || 'Unknown Title',
          authors: manga.author ? [manga.author] : [],
          artists: manga.artist ? [manga.artist] : [],
          description: manga.description,
          tags: manga.genre ?? [],
          coverUrl: manga.thumbnailUrl ?? '',
          status: manga.status ? MihonService.StatusMap[manga.status] : PublicationStatus.Ongoing,
          isFavourite: manga.favorite
        })

        // Finally, assign to collection if category exists
        for (const categoryId of manga.categories) {
          const collectionId = categoryMap.get(categoryId)
          if (collectionId) {
            addToCollectionsCommands.push({
              collectionId: collectionId,
              mangaId: mangaId
            })
          }
        }
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

    result.importedMangaCount = upsertCommand.length
    result.importedMangaIds = upsertCommand.map((cmd) => cmd.mangaId)
    return result
  }

  cancelImport(): void {
    this.abortController?.abort()
  }

  private extractMangaIdFromUrl(url: string): string | undefined {
    // MangaDex URLs: /manga/{uuid} or https://mangadex.org/title/{uuid}
    const match = new RegExp(/\/(?:manga|title)\/([a-f0-9-]{36})(?:\/|$)/i).exec(url)

    if (!match?.[1]) {
      return undefined
    }

    return match[1]
  }
}
export const mihonService = new MihonService()

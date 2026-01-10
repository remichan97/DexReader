import { PublicationStatus } from '../../api/enums'
import { UpsertMangaCommand } from '../../database/commands/collections/upsert-manga.command'
import { collectionRepo } from '../../database/repository/collection.repo'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'

const MANGADEX_URL_PATTERN = /\/(?:manga|title)\/([a-f0-9-]{36})(?:\/|$)/i

const StatusMap: Record<number, PublicationStatus> = {
  0: PublicationStatus.Ongoing,
  1: PublicationStatus.Ongoing,
  2: PublicationStatus.Completed,
  3: PublicationStatus.Ongoing,
  4: PublicationStatus.Completed,
  5: PublicationStatus.Cancelled,
  6: PublicationStatus.Hiatus
} as const

export class MihonBackupHelper {
  mapCategoriesToCollections(categories: BackupCategory[]): Map<number, number> {
    const categoryMap = new Map<number, number>()
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

    return categoryMap
  }

  processMangaCommand(manga: BackupManga): UpsertMangaCommand {
    // Create manga entry
    return {
      mangaId: this.extractMangaIdFromUrl(manga.url)!, // We already validated this before calling the method
      title: manga.title || 'Unknown Title',
      authors: manga.author ? [manga.author] : [],
      artists: manga.artist ? [manga.artist] : [],
      description: manga.description,
      tags: manga.genre ?? [],
      coverUrl: manga.thumbnailUrl ?? '',
      status: manga.status ? StatusMap[manga.status] : PublicationStatus.Ongoing,
      isFavourite: manga.favorite
    }
  }

  extractMangaIdFromUrl(url: string): string | undefined {
    // MangaDex URLs: /manga/{uuid} or https://mangadex.org/title/{uuid}
    const match = MANGADEX_URL_PATTERN.exec(url)

    if (!match?.[1]) {
      return undefined
    }

    return match[1]
  }
}
export const mihonBackup = new MihonBackupHelper()

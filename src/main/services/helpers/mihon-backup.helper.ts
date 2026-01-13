import { PublicationStatus } from '../../api/enums'
import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { UpsertMangaCommand } from '../../database/commands/collections/upsert-manga.command'
import { collectionRepo } from '../../database/repository/collection.repo'
import { TagList } from '../../api/constants/tag-list.constant'
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

// Create reverse mapping: tag name -> tag ID (case-insensitive)
const TagNameToIdMap: Record<string, string> = Object.entries(TagList).reduce(
  (acc, [name, id]) => {
    // Convert PascalCase to space-separated (e.g., "SliceOfLife" -> "Slice of Life")
    const spacedName = name.replaceAll(/([A-Z])/g, ' $1').trim()
    acc[spacedName.toLowerCase()] = id
    acc[name.toLowerCase()] = id // Also support non-spaced version
    return acc
  },
  {} as Record<string, string>
)

export class MihonBackupHelper {
  mapCategoriesToCollections(categories: BackupCategory[]): Map<number, number> {
    const categoryMap = new Map<number, number>()
    if (!categories || categories.length === 0) {
      // Early return if nothing to map (backup has no categories)
      return categoryMap
    }
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
    // Convert Mihon tag names to MangaDex tag IDs
    const tagIds = manga.genre
      ? manga.genre
          .map((tagName) => {
            const normalized = tagName.toLowerCase().trim()
            return TagNameToIdMap[normalized]
          })
          .filter((id): id is string => !!id) // Remove undefined/null values
      : []

    // Create manga entry
    return {
      mangaId: this.extractMangaIdFromUrl(manga.url)!, // We already validated this before calling the method
      title: manga.title || 'Unknown Title',
      authors: manga.author ? [manga.author] : [],
      artists: manga.artist ? [manga.artist] : [],
      description: manga.description,
      tags: tagIds,
      coverUrl: manga.thumbnailUrl ?? '',
      status: manga.status ? StatusMap[manga.status] : PublicationStatus.Ongoing,
      isFavourite: true
    }
  }

  processCategoryAssignments(
    mangaCategories: number[],
    mangaId: string,
    categoryMap: Map<number, number>
  ): AddToCollectionCommand[] {
    const commands: AddToCollectionCommand[] = []

    if (categoryMap.size === 0 || !mangaCategories || mangaCategories.length === 0) {
      return commands
    }

    for (const categoryId of mangaCategories) {
      const collectionId = categoryMap.get(categoryId)
      if (collectionId) {
        commands.push({
          collectionId: collectionId,
          mangaId: mangaId
        })
      }
    }

    return commands
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

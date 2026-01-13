import { PublicationStatus } from '../../api/enums'
import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { UpsertMangaCommand } from '../../database/commands/collections/upsert-manga.command'
import { collectionRepo } from '../../database/repository/collection.repo'
import { TagList } from '../../api/constants/tag-list.constant'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { BackupChapter } from '../types/mihon/backup-chapter.type'
import { SaveProgressCommand } from '../../database/commands/progress/save-progress.command'
import { BackupHistory } from '../types/mihon/backup-history.type'
import { SaveChapterCommand } from '../../database/commands/progress/save-chapter.command'
import { unixTimestampToDate } from '../../utils/timestamps.util'

const MANGADEX_URL_PATTERN = /\/(?:manga|title)\/([a-f0-9-]{36})(?:\/|$)/i
const MANGADEX_CHAPTER_URL_PATTERN = /\/chapter\/([a-f0-9-]{36})(?:\/|$)/i

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
      mangaId: this.extractIdFromUrl(manga.url, 'manga')!, // We already validated this before calling the method
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

  processProgressCommands(
    chapters: BackupChapter[],
    history: BackupHistory[],
    mangaId: string
  ): SaveProgressCommand[] {
    const progressCommands: SaveProgressCommand[] = []
    const historyMap = new Map<string, BackupHistory>()

    // Map history by chapter URL for quick lookup
    for (const entry of history || []) {
      historyMap.set(entry.url, entry)
    }

    // Process each chapter to create progress commands
    for (const items of chapters || []) {
      if (items.lastPageRead && items.lastPageRead > 0) {
        // First, extract chapter ID from URL
        const chapterId = this.extractIdFromUrl(items.url, 'chapter')
        if (!chapterId) {
          // Unable to extract chapter ID, skip this chapter
          continue
        }

        // Find corresponding history entry
        const historyEntry = historyMap.get(items.url)

        progressCommands.push({
          mangaId: mangaId,
          chapterId: chapterId,
          currentPage: items.lastPageRead,
          completed: items.read ?? false,
          lastReadAt: historyEntry ? historyEntry.lastRead : undefined
        })
      }
    }

    return progressCommands
  }

  processChapterMetadata(chapters: BackupChapter[], mangaId: string): SaveChapterCommand[] {
    const chapterCommands: SaveChapterCommand[] = []

    for (const ch of chapters || []) {
      const chapterId = this.extractIdFromUrl(ch.url, 'chapter')
      if (!chapterId) {
        // Unable to extract chapter ID, skip this chapter
        continue
      }

      chapterCommands.push({
        chapterId,
        mangaId,
        title: ch.name || 'Untitled Chapter',
        chapterNumber: ch.chapterNumber?.toString() || 'Unknown',
        language: 'en', // Assuming English, as Mihon backup does not store language info
        publishAt:
          ch.dateUpload || ch.dateFetch
            ? unixTimestampToDate(ch.dateUpload || ch.dateFetch!)
            : new Date(),
        scanlationGroup: ch.scanlator || 'Unknown',
        externalUrl: ch.url
      })
    }

    return chapterCommands
  }

  extractIdFromUrl(url: string, extractType: 'manga' | 'chapter'): string | undefined {
    // MangaDex URLs: /manga/{uuid} or https://mangadex.org/title/{uuid}
    const match = (
      extractType === 'manga' ? MANGADEX_URL_PATTERN : MANGADEX_CHAPTER_URL_PATTERN
    ).exec(url)

    if (!match?.[1]) {
      return undefined
    }

    return match[1]
  }
}
export const mihonBackup = new MihonBackupHelper()

import { TagList } from '../../api/constants/tag-list.constant'
import { PublicationStatus } from '../../api/enums'
import { CollectionQuery } from '../../database/queries/collections/collection.query'
import { ChapterWithMetadata } from '../../database/queries/manga/chapter-with-metadata.query'
import { MangaWithMetadata } from '../../database/queries/manga/manga-with-metadata.query'
import { ChapterProgressQuery } from '../../database/queries/progress/chapter-progress.query'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupChapter } from '../types/mihon/backup-chapter.type'
import { BackupHistory } from '../types/mihon/backup-history.type'
import { BackupManga } from '../types/mihon/backup-manga.type'

const StatusMap: Record<number, PublicationStatus> = {
  0: PublicationStatus.Ongoing,
  1: PublicationStatus.Ongoing,
  2: PublicationStatus.Completed,
  3: PublicationStatus.Ongoing,
  4: PublicationStatus.Completed,
  5: PublicationStatus.Cancelled,
  6: PublicationStatus.Hiatus
} as const

const MangaDexSourceId = '2499283573021220255'

// Create mapping, tag Id -> tag name (Mihon uses names, MangaDex uses IDs)
const TagIdToNameMap: Record<string, string> = Object.entries(TagList).reduce(
  (acc, [name, id]) => {
    // Convert PascalCase to space-separated (e.g., "SliceOfLife" -> "Slice of Life")
    const spacedName = name.replaceAll(/([A-Z])/g, ' $1').trim()
    acc[id] = spacedName
    acc[id.toLowerCase()] = spacedName.toLowerCase() // Also support lowercase version
    return acc
  },
  {} as Record<string, string>
)

export class MihonExportHelper {
  buildMangaUrl(mangaId: string): string {
    return `/manga/${mangaId}`
  }

  buildChapterUrl(chapterId: string): string {
    return `/chapter/${chapterId}`
  }

  mapStatus(status: PublicationStatus): number {
    return StatusMap
      ? (Object.keys(StatusMap).find(
          (key) => StatusMap[Number(key)] === status
        ) as unknown as number)
      : 1
  }

  buildBackupChapter(
    chapterProgress: ChapterProgressQuery,
    metadata: ChapterWithMetadata | undefined
  ): BackupChapter {
    return {
      url: this.buildChapterUrl(chapterProgress.chapterId),
      name: metadata?.title,
      scanlator: metadata?.scanlatorGroup,
      read: chapterProgress.completed,
      lastPageRead: chapterProgress.currentPage,
      dateFetch: metadata ? dateToUnixTimestamp(metadata.publishedAt) : undefined,
      dateUpload: metadata ? dateToUnixTimestamp(metadata.createdAt) : undefined,
      chapterNumber: metadata ? Number(metadata.chapterNumber) : undefined
    }
  }

  buildBackupHistory(chapterProgress: ChapterProgressQuery): BackupHistory {
    return {
      url: this.buildChapterUrl(chapterProgress.chapterId),
      lastRead: chapterProgress.lastReadAt
    }
  }

  buildBackupCategory(collection: CollectionQuery, index: number): BackupCategory {
    return {
      name: collection.name,
      order: index,
      id: collection.id
    }
  }

  buildBackupManga(
    manga: MangaWithMetadata,
    categories: number[] | undefined,
    backupChapters: BackupChapter[],
    backupHistory: BackupHistory[]
  ): BackupManga {
    return {
      source: MangaDexSourceId,
      url: this.buildMangaUrl(manga.mangaId),
      title: manga.title,
      description: manga.description,
      status: this.mapStatus(manga.status),
      thumbnailUrl: manga.coverUrl,
      genre: manga.tags.map((tag) => TagIdToNameMap[tag.toLowerCase()] || tag),
      categories: categories ?? [],
      chapters: backupChapters,
      history: backupHistory,
      artist: manga.artists.length > 0 ? manga.artists[0] : undefined,
      author: manga.authors.length > 0 ? manga.authors[0] : undefined,
      favorite: true
    }
  }
}
export const mihonExport = new MihonExportHelper()

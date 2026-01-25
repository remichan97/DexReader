import { MangaProgressMetadata } from '../queries/progress/manga-progress-metadata.query'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { manga } from '../schema'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { PublicationStatus } from '../../api/enums'
import { MangaReadingSettings } from '../../settings/entity/reading-settings.entity'
import { MangaOverride } from '../queries/manga/manga-override.query'

type MangaRow = typeof manga.$inferSelect

type MangaProgressWithMetadataRow = {
  mangaId: string
  lastChapterId: string
  firstReadAt: Date
  lastReadAt: Date
  title: string
  coverUrl: string | null
  status: string | null
  lastChapterNumber: string | null
  lastChapterTitle: string | null
  lastChapterVolume: string | null
  language: string | null
}

type MangaOverrideRow = {
  mangaId: string
  title: string
  coverUrl: string | null
  readerSettings: MangaReadingSettings
  createdAt: Date
  updatedAt: Date
}

export class MangaMapper {
  static toMangaWithMetadata(row: MangaRow): MangaWithMetadata {
    return {
      mangaId: row.mangaId,
      title: row.title,
      description: row.description ?? undefined,
      coverUrl: row.coverUrl ?? undefined,
      status: row.status as PublicationStatus,
      authors: row.authors ?? [],
      artists: row.artists ?? [],
      year: row.year ?? undefined,
      tags: row.tags ?? [],
      updatedAt: row.updatedAt,
      externalLinks: row.externalLinks ?? undefined,
      lastVolume: row.lastVolume ?? undefined,
      lastChapter: row.lastChapter ?? undefined,
      hasNewChapters: row.hasNewChapters ?? false,
      lastKnownChapterId: row.lastKnownChapterId ?? undefined,
      lastKnownChapterNumber: row.lastKnownChapterNumber ?? undefined,
      lastCheckForUpdate: row.lastCheckForUpdates ?? new Date()
    }
  }

  static toMangaProgressWithMetadata(row: MangaProgressWithMetadataRow): MangaProgressMetadata {
    return {
      mangaId: row.mangaId,
      lastChapterId: row.lastChapterId,
      firstReadAt: dateToUnixTimestamp(row.firstReadAt),
      lastReadAt: dateToUnixTimestamp(row.lastReadAt),
      title: row.title,
      coverUrl: row.coverUrl ?? undefined,
      status: row.status as PublicationStatus,
      lastChapterNumber: row.lastChapterNumber ?? undefined,
      lastChapterTitle: row.lastChapterTitle ?? undefined,
      lastChapterVolume: row.lastChapterVolume ?? undefined,
      language: row.language ?? undefined
    }
  }

  static toMangaOverrideQuery(row: MangaOverrideRow): MangaOverride {
    return {
      mangaId: row.mangaId,
      title: row.title,
      coverUrl: row.coverUrl ?? undefined,
      readerSettings: row.readerSettings,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}

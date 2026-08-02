import { MangaProgressMetadataContract } from '@shared/contracts/database/progress/manga-progress-metadata.contract'
import { MangaWithMetadataContract } from '@shared/contracts/database/manga/manga-with-metadata.contract'
import { manga } from '../schemas'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { PublicationStatus } from '../../api/enums'
import { MangaReadingSettings } from '@shared/contracts/settings/reading-settings.contract'
import { MangaOverrideContract } from '@shared/contracts/database/manga/manga-override.contract'

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
  static toMangaWithMetadata(row: MangaRow): MangaWithMetadataContract {
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
      isFavourite: row.isFavourite
    }
  }

  static toMangaProgressWithMetadata(
    row: MangaProgressWithMetadataRow
  ): MangaProgressMetadataContract {
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

  static toMangaOverrideQuery(row: MangaOverrideRow): MangaOverrideContract {
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

import { MangaStatus } from '../../api/enums/manga-status.enum'
import { MangaProgressMetadata } from '../queries/progress/manga-progress-metadata.query'
import { MangaWithMetadata } from '../queries/manga/manga-with-metadata.query'
import { manga } from '../schema'
import { dateToUnixTimestamp } from '../utils/helpers.utils'

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
}

export class MangaMapper {
  static toMangaWithMetadata(row: MangaRow): MangaWithMetadata {
    return {
      mangaId: row.mangaId,
      title: row.title,
      description: row.description ?? undefined,
      coverUrl: row.coverUrl ?? undefined,
      status: row.status as MangaStatus,
      authors: row.authors ?? [],
      artists: row.artists ?? [],
      year: row.year ?? undefined,
      tags: row.tags ?? [],
      externalLinks: row.externalLinks ?? undefined,
      lastVolume: row.lastVolume ?? undefined,
      lastChapter: row.lastChapter ?? undefined,
      hasNewChapters: row.hasNewChapters ?? false,
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
      status: row.status as MangaStatus,
      lastChapterNumber: row.lastChapterNumber ?? undefined,
      lastChapterTitle: row.lastChapterTitle ?? undefined,
      lastChapterVolume: row.lastChapterVolume ?? undefined
    }
  }
}

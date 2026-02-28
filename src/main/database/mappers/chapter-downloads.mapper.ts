import { ImageQuality } from '../../api/enums'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { DownloadStatus } from '../enums/download-status.enum'
import { ChapterDownloadQuery } from '../queries/chapter-downloads/chapter-downloads.query'
import { MangaStorageQuery } from '../queries/chapter-downloads/manga-storage.query'

type ChapterDownloadRow = {
  chapterId: string
  mangaId: string
  status: DownloadStatus
  storageSize: number | null
  downloadedAt: Date | null
  downloadsBasePath: string
  filePath: string
  totalPages: number
  imageQuality: ImageQuality
  imageFormat: string
  errorMessage: string | null
  title: string
  coverUrl: string | null
  chapterNumber: string | null
  chapterTitle: string | null
  volume: string | null
  language: string
}

type MangaStorageByTitleRow = {
  mangaId: string
  mangaTitle: string
  coverUrl: string | null
  chapterCount: unknown
  totalStorageSize: unknown
}

export class ChapterDownloadMapper {
  static toChapterDownloadQuery(row: ChapterDownloadRow): ChapterDownloadQuery {
    return {
      chapterId: row.chapterId,
      mangaId: row.mangaId,
      status: row.status,
      storageSize: row.storageSize ?? 0,
      downloadedAt: row.downloadedAt
        ? dateToUnixTimestamp(row.downloadedAt)
        : dateToUnixTimestamp(new Date()),
      downloadsBasePath: row.downloadsBasePath,
      filePath: row.filePath,
      totalPages: row.totalPages,
      imageQuality: row.imageQuality,
      imageFormat: row.imageFormat,
      errorMessage: row.errorMessage ?? undefined,
      title: row.title,
      coverUrl: row.coverUrl ?? undefined,
      chapterNumber: row.chapterNumber ?? '',
      chapterTitle: row.chapterTitle ?? '',
      volume: row.volume ?? undefined,
      language: row.language
    }
  }

  static toMangaStorageQuery(
    totalAppStorage: number,
    mangaStorageByTitle: MangaStorageByTitleRow[]
  ): MangaStorageQuery {
    return {
      totalAppStorage,
      mangaStorageByTitle: mangaStorageByTitle.map((row) => ({
        mangaId: row.mangaId,
        mangaTitle: row.mangaTitle,
        coverUrl: row.coverUrl ?? undefined,
        chapterCount: row.chapterCount as number,
        totalStorageSize: row.totalStorageSize as number
      }))
    }
  }
}

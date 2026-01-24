import { CollectionItemQuery } from '../../database/queries/collections/collection-item.query'
import { CollectionQuery } from '../../database/queries/collections/collection.query'
import { ChapterWithMetadata } from '../../database/queries/manga/chapter-with-metadata.query'
import { MangaWithMetadata } from '../../database/queries/manga/manga-with-metadata.query'
import { ChapterProgressQuery } from '../../database/queries/progress/chapter-progress.query'
import { MangaProgressQuery } from '../../database/queries/progress/manga-progress.query'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { ChapterProgressData } from '../types/dexreader/chapter-progress.type'
import { Chapter } from '../types/dexreader/chapter.type'
import { CollectionItem } from '../types/dexreader/collection-item.type'
import { Collection } from '../types/dexreader/collection.type'
import { MangaProgressData } from '../types/dexreader/manga-progress.type'
import { Manga } from '../types/dexreader/manga.type'

export class DexReaderExportHelper {
  buildMangaData(data: MangaWithMetadata): Manga {
    return {
      mangaId: data.mangaId,
      title: data.title,
      status: data.status,
      description: data.description,
      coverUrl: data.coverUrl,
      year: data.year,
      isFavourite: false,
      addedAt: Date.now(),
      updatedAt: data.updatedAt.getTime(),
      lastAccessedAt: Date.now(),
      externalLinks: data.externalLinks || {},
      tags: data.tags,
      authors: data.authors,
      artists: data.artists,
      alternativeTitles: {},
      lastVolume: data.lastVolume,
      lastChapter: data.lastChapter,
      lastKnownChapterId: data.lastKnownChapterId,
      lastKnownChapterNumber: data.lastKnownChapterNumber,
      lastCheckForUpdates: data.lastCheckForUpdate.getTime(),
      hasNewChapters: data.hasNewChapters
    }
  }

  buildChapterData(data: ChapterWithMetadata): Chapter {
    return {
      chapterId: data.chapterId,
      mangaId: data.mangaId,
      title: data.title,
      chapterNumber: data.chapterNumber,
      volume: data.volume,
      language: data.language,
      publishAt: dateToUnixTimestamp(data.publishedAt),
      scanlationGroup: data.scanlatorGroup,
      externalUrl: data.externalUrl,
      createdAt: dateToUnixTimestamp(data.createdAt),
      updatedAt: dateToUnixTimestamp(data.updatedAt)
    }
  }

  buildCollectionData(data: CollectionQuery): Collection {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: dateToUnixTimestamp(data.createdAt),
      updatedAt: dateToUnixTimestamp(data.updatedAt)
    }
  }

  buildCollectionItemData(data: CollectionItemQuery): CollectionItem {
    return {
      collectionId: data.collectionId,
      mangaId: data.mangaId,
      addedAt: dateToUnixTimestamp(data.addedAt),
      position: 0
    }
  }

  buildMangaProgressData(data: MangaProgressQuery): MangaProgressData {
    return {
      mangaId: data.mangaId,
      lastChapterId: data.lastChapterId,
      firstReadAt: data.firstReadAt,
      lastReadAt: data.lastReadAt
    }
  }

  buildChapterProgressData(data: ChapterProgressQuery): ChapterProgressData {
    return {
      mangaId: data.mangaId,
      chapterId: data.chapterId,
      currentPage: data.currentPage,
      completed: data.completed,
      lastReadAt: data.lastReadAt
    }
  }
}
export const dexreaderExport = new DexReaderExportHelper()

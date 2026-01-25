import { CollectionItemQuery } from '../../database/queries/collections/collection-item.query'
import { CollectionQuery } from '../../database/queries/collections/collection.query'
import { ChapterProgressQuery } from '../../database/queries/progress/chapter-progress.query'
import { MangaProgressQuery } from '../../database/queries/progress/manga-progress.query'
import { chapter, manga } from '../../database/schema'
import { dateToUnixTimestamp } from '../../utils/timestamps.util'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderManga } from '../types/dexreader/manga.type'

type MangaRow = typeof manga.$inferInsert
type ChapterRow = typeof chapter.$inferSelect

export class DexReaderExportHelper {
  buildMangaData(data: MangaRow): DexReaderManga {
    return {
      mangaId: data.mangaId,
      title: data.title,
      status: data.status || 'ongoing',
      description: data.description || '',
      coverUrl: data.coverUrl || '',
      isFavourite: data.isFavourite || true,
      addedAt: dateToUnixTimestamp(data.addedAt),
      updatedAt: dateToUnixTimestamp(data.updatedAt),
      lastAccessedAt: dateToUnixTimestamp(data.lastAccessedAt),
      externalLinks: data.externalLinks || {},
      tags: data.tags || [],
      authors: data.authors || [],
      artists: data.artists || [],
      alternativeTitles: data.alternativeTitles || {},
      year: data.year || undefined,
      lastVolume: data.lastVolume || undefined,
      lastChapter: data.lastChapter || undefined,
      lastKnownChapterId: data.lastKnownChapterId || undefined,
      lastKnownChapterNumber: data.lastKnownChapterNumber || undefined,
      lastCheckForUpdates: data.lastCheckForUpdates
        ? dateToUnixTimestamp(data.lastCheckForUpdates)
        : undefined,
      hasNewChapters: data.hasNewChapters || false
    }
  }

  buildChapterData(data: ChapterRow): DexReaderChapter {
    return {
      chapterId: data.chapterId,
      mangaId: data.mangaId,
      title: data.title || '',
      chapterNumber: data.chapterNumber || '',
      volume: data.volume || '',
      language: data.language,
      publishAt: dateToUnixTimestamp(data.publishAt),
      createdAt: dateToUnixTimestamp(data.createdAt),
      updatedAt: dateToUnixTimestamp(data.updatedAt),
      scanlationGroup: data.scanlationGroup || '',
      externalUrl: data.externalUrl || ''
    }
  }

  buildCollectionData(data: CollectionQuery): DexReaderCollection {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: dateToUnixTimestamp(data.createdAt),
      updatedAt: dateToUnixTimestamp(data.updatedAt)
    }
  }

  buildCollectionItemData(data: CollectionItemQuery): DexReaderCollectionItem {
    return {
      collectionId: data.collectionId,
      mangaId: data.mangaId,
      addedAt: dateToUnixTimestamp(data.addedAt),
      position: data.position || 0
    }
  }

  buildMangaProgressData(data: MangaProgressQuery): DexReaderMangaProgress {
    return {
      mangaId: data.mangaId,
      lastChapterId: data.lastChapterId,
      firstReadAt: data.firstReadAt,
      lastReadAt: data.lastReadAt
    }
  }

  buildChapterProgressData(data: ChapterProgressQuery): DexReaderChapterProgress {
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

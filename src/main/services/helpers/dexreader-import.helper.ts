import { PublicationStatus } from '../../api/enums'
import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { CreateCollectionCommand } from '../../database/commands/collections/create-collection.command'
import { UpdateMangaOverrideCommand } from '../../database/commands/manga/update-manga-override.command'
import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'
import { SaveChapterCommand } from '../../database/commands/progress/save-chapter.command'
import { SaveProgressCommand } from '../../database/commands/progress/save-progress.command'
import { UpdateFirstReadCommand } from '../../database/commands/progress/update-firstread.command'
import { ReadingMode } from '../../settings/enum/reading-mode.enum'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'
import { DexReaderManga } from '../types/dexreader/manga.type'

export class DexReaderImportHelper {
  processUpsertMangaCommand(manga: DexReaderManga): UpsertMangaCommand {
    return {
      mangaId: manga.mangaId,
      title: manga.title,
      description: manga.description,
      coverUrl: manga.coverUrl ?? '',
      status: manga.status as PublicationStatus,
      authors: manga.authors,
      artists: manga.artists,
      year: manga.year,
      tags: manga.tags,
      externalLinks: manga.externalLinks,
      lastVolume: manga.lastVolume,
      lastChapter: manga.lastChapter,
      lastKnownChapterId: manga.lastKnownChapterId,
      lastKnownChapterNumber: manga.lastKnownChapterNumber,
      lastCheckForUpdates: manga.lastCheckForUpdates
        ? new Date(manga.lastCheckForUpdates)
        : undefined,
      isFavourite: manga.isFavourite
    }
  }

  processSaveChapterCommand(chapter: DexReaderChapter): SaveChapterCommand {
    return {
      chapterId: chapter.chapterId,
      mangaId: chapter.mangaId,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber,
      volume: chapter.volume,
      language: chapter.language,
      publishAt: new Date(chapter.publishAt),
      scanlationGroup: chapter.scanlationGroup,
      externalUrl: chapter.externalUrl
    }
  }

  processCreateCollectionCommand(collection: DexReaderCollection): CreateCollectionCommand {
    return {
      name: collection.name,
      description: collection.description
    }
  }

  processAddToCollectionCommand(item: DexReaderCollectionItem): AddToCollectionCommand {
    return {
      collectionId: item.collectionId,
      mangaId: item.mangaId
    }
  }

  processSaveProgressCommand(item: DexReaderChapterProgress): SaveProgressCommand {
    return {
      mangaId: item.mangaId,
      chapterId: item.chapterId,
      currentPage: item.currentPage,
      completed: item.completed,
      lastReadAt: item.lastReadAt
    }
  }

  processUpdateFirstReadCommand(item: DexReaderMangaProgress): UpdateFirstReadCommand {
    return {
      mangaId: item.mangaId,
      firstReadAt: item.firstReadAt
    }
  }

  processSaveReaderOverrideCommand(
    override: DexReaderMangaReaderOverride
  ): UpdateMangaOverrideCommand {
    return {
      mangaId: override.mangaId,
      overrideData: {
        readingMode:
          override.readingMode === 'single-page'
            ? ReadingMode.SinglePage
            : override.readingMode === 'double-page'
              ? ReadingMode.DoublePage
              : ReadingMode.VerticalScroll,
        doublePageMode: override.doublePageMode
      }
    }
  }
}
export const dexreaderImport = new DexReaderImportHelper()

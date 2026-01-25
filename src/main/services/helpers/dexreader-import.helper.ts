import { AddToCollectionCommand } from '../../database/commands/collections/add-to-collection.command'
import { CreateCollectionCommand } from '../../database/commands/collections/create-collection.command'
import { UpdateMangaOverrideCommand } from '../../database/commands/manga/update-manga-override.command'
import { UpsertMangaCommand } from '../../database/commands/manga/upsert-manga.command'
import { SaveChapterCommand } from '../../database/commands/progress/save-chapter.command'
import { ReadingMode } from '../../settings/enum/reading-mode.enum'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'
import { DexReaderManga } from '../types/dexreader/manga.type'

export class DexReaderImportHelper {
  processUpsertMangaCommand(manga: DexReaderManga): UpsertMangaCommand {
    return {
      mangaId: manga.mangaId,
      title: manga.title,
      description: manga.description,
      coverUrl: manga.coverUrl ?? '',
      status: manga.status as unknown as UpsertMangaCommand['status'],
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

  processSaveReaderOverrideCommand(
    override: DexReaderMangaReaderOverride[]
  ): UpdateMangaOverrideCommand[] {
    return override.map((o) => ({
      mangaId: o.mangaId,
      overrideData: {
        readingMode: ReadingMode[o.readingMode as keyof typeof ReadingMode],
        doublePageMode: o.doublePageMode || undefined
      }
    }))
  }
}
export const dexreaderImport = new DexReaderImportHelper()

import { defineRelations } from 'drizzle-orm'
import { collections } from './collections.schema'
import { collectionItems } from './collection-items.schema'
import { manga } from './manga.schema'
import { chapter } from './chapter.schema'
import { mangaProgress } from './manga-progress.schema'
import { mangaReaderOverrides } from './manga-reader-overrides.schema'
import { readHistory } from './read-history.schema'
import { chapterDownloads } from './chapter-downloads.schema'
import { chapterProgress } from './chapter-progress.schema'

export const relations = defineRelations(
  {
    collections,
    collectionItems,
    manga,
    chapter,
    mangaProgress,
    mangaReaderOverrides,
    readHistory,
    chapterDownloads,
    chapterProgress
  },
  (r) => ({
    // Collection Relations
    collections: {
      items: r.many.collectionItems({
        from: r.collections.id,
        to: r.collectionItems.collectionId,
        alias: 'collectionItems'
      })
    },

    // Collection Items Relations
    collectionItems: {
      collection: r.one.collections({
        from: r.collectionItems.collectionId,
        to: r.collections.id,
        alias: 'collection'
      }),
      manga: r.one.manga({
        from: r.collectionItems.mangaId,
        to: r.manga.mangaId,
        alias: 'mangaInCollection'
      })
    },

    // Manga Relations
    manga: {
      chapters: r.many.chapter({
        from: r.manga.mangaId,
        to: r.chapter.mangaId,
        alias: 'mangaChapters'
      }),
      progress: r.one.mangaProgress({
        from: r.manga.mangaId,
        to: r.mangaProgress.mangaId,
        alias: 'mangaProgress'
      }),
      readerOverride: r.one.mangaReaderOverrides({
        from: r.manga.mangaId,
        to: r.mangaReaderOverrides.mangaId,
        alias: 'mangaReaderOverride'
      }),
      readHistory: r.many.readHistory({
        from: r.manga.mangaId,
        to: r.readHistory.mangaId,
        alias: 'mangaReadHistory'
      }),
      downloads: r.many.chapterDownloads({
        from: r.manga.mangaId,
        to: r.chapterDownloads.mangaId,
        alias: 'mangaChapterDownloads'
      })
    },

    // Read History Relations
    readHistory: {
      manga: r.one.manga({
        from: r.readHistory.mangaId,
        to: r.manga.mangaId,
        alias: 'mangaReadHistory'
      })
    },

    // Manga Progress Relations
    mangaProgress: {
      manga: r.one.manga({
        from: r.mangaProgress.mangaId,
        to: r.manga.mangaId,
        alias: 'mangaChapterProgress'
      }),
      lastChapter: r.one.chapter({
        from: r.mangaProgress.lastChapterId,
        to: r.chapter.chapterId,
        alias: 'mangaProgressLastChapter'
      })
    },

    // Chapter Progress Relations
    chapterProgress: {
      mangaProgress: r.one.mangaProgress({
        from: r.chapterProgress.mangaId,
        to: r.mangaProgress.mangaId,
        alias: 'mangaProgressChapter'
      }),
      chapter: r.one.chapter({
        from: r.chapterProgress.chapterId,
        to: r.chapter.chapterId,
        alias: 'chapterProgressChapter'
      })
    },

    // Chapter Relations
    chapter: {
      manga: r.one.manga({
        from: r.chapter.mangaId,
        to: r.manga.mangaId,
        alias: 'chapterManga'
      }),
      downloads: r.one.chapterDownloads({
        from: r.chapter.chapterId,
        to: r.chapterDownloads.chapterId,
        alias: 'chapterDownloads'
      })
    },

    // Chapter Downloads Relations
    chapterDownloads: {
      manga: r.one.manga({
        from: r.chapterDownloads.mangaId,
        to: r.manga.mangaId,
        alias: 'chapterDownloadManga'
      }),
      chapter: r.one.chapter({
        from: r.chapterDownloads.chapterId,
        to: r.chapter.chapterId,
        alias: 'chapterDownloadChapter'
      })
    }
  })
)

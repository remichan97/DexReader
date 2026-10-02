import { dexreaderImport } from './dexreader-import.helper'
import { PublicationStatus } from '../../api/enums'
import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'
import { DexReaderManga } from '../types/dexreader/manga.type'
import { DexReaderChapter } from '../types/dexreader/chapter.type'
import { DexReaderCollection } from '../types/dexreader/collection.type'
import { DexReaderCollectionItem } from '../types/dexreader/collection-item.type'
import { DexReaderChapterProgress } from '../types/dexreader/chapter-progress.type'
import { DexReaderMangaProgress } from '../types/dexreader/manga-progress.type'
import { DexReaderMangaReaderOverride } from '../types/dexreader/manga-reader-override.type'

function mangaItem(overrides: Partial<DexReaderManga> = {}): DexReaderManga {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    status: 'ongoing',
    isFavourite: true,
    addedAt: 0,
    updatedAt: 0,
    lastAccessedAt: 0,
    externalLinks: { al: '30416' },
    tags: ['action'],
    authors: ['Kentaro Miura'],
    artists: ['Kentaro Miura'],
    alternativeTitles: {},
    description: 'A dark fantasy manga',
    coverUrl: 'https://example.com/cover.jpg',
    year: 1989,
    lastVolume: '41',
    lastChapter: '364',
    ...overrides
  }
}

function chapterItem(overrides: Partial<DexReaderChapter> = {}): DexReaderChapter {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    title: 'The Black Swordsman',
    chapterNumber: '1',
    volume: '1',
    language: 'en',
    publishAt: 1700000000000,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    scanlationGroup: 'Dark Horse',
    externalUrl: 'https://example.com/chapter-1',
    ...overrides
  }
}

function collection(overrides: Partial<DexReaderCollection> = {}): DexReaderCollection {
  return {
    id: 1,
    name: 'Favourites',
    description: 'My favourites',
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

function collectionItem(overrides: Partial<DexReaderCollectionItem> = {}): DexReaderCollectionItem {
  return { collectionId: 1, mangaId: 'manga-1', addedAt: 0, position: 0, ...overrides }
}

function chapterProgress(
  overrides: Partial<DexReaderChapterProgress> = {}
): DexReaderChapterProgress {
  return {
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    currentPage: 5,
    completed: true,
    lastReadAt: 1700000000,
    ...overrides
  }
}

function mangaProgress(overrides: Partial<DexReaderMangaProgress> = {}): DexReaderMangaProgress {
  return {
    mangaId: 'manga-1',
    lastChapterId: 'chapter-1',
    firstReadAt: 1700000000,
    lastReadAt: 1700003600,
    ...overrides
  }
}

function readerOverride(
  overrides: Partial<DexReaderMangaReaderOverride> = {}
): DexReaderMangaReaderOverride {
  return {
    mangaId: 'manga-1',
    readingMode: 'single-page',
    createdAt: 0,
    updatedAt: 0,
    ...overrides
  }
}

describe('processUpsertMangaCommand', () => {
  it('maps a DexReaderManga into an UpsertMangaCommand', () => {
    const result = dexreaderImport.processUpsertMangaCommand(mangaItem())

    expect(result).toEqual({
      mangaId: 'manga-1',
      title: 'Berserk',
      description: 'A dark fantasy manga',
      coverUrl: 'https://example.com/cover.jpg',
      status: PublicationStatus.Ongoing,
      authors: ['Kentaro Miura'],
      artists: ['Kentaro Miura'],
      year: 1989,
      tags: ['action'],
      externalLinks: { al: '30416' },
      lastVolume: '41',
      lastChapter: '364',
      isFavourite: true
    })
  })

  it('falls back to an empty string when coverUrl is missing', () => {
    const result = dexreaderImport.processUpsertMangaCommand(mangaItem({ coverUrl: undefined }))

    expect(result.coverUrl).toBe('')
  })
})

describe('processSaveChapterCommand', () => {
  it('maps a DexReaderChapter into a SaveChapterCommand, converting publishAt to a Date', () => {
    const result = dexreaderImport.processSaveChapterCommand(chapterItem())

    expect(result).toEqual({
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      title: 'The Black Swordsman',
      chapterNumber: '1',
      volume: '1',
      language: 'en',
      publishAt: new Date(1700000000000),
      scanlationGroup: 'Dark Horse',
      externalUrl: 'https://example.com/chapter-1'
    })
  })
})

describe('processCreateCollectionCommand', () => {
  it('maps a DexReaderCollection into a CreateCollectionCommand', () => {
    const result = dexreaderImport.processCreateCollectionCommand(
      collection({ name: 'Plan to Read', description: 'Backlog' })
    )

    expect(result).toEqual({ name: 'Plan to Read', description: 'Backlog' })
  })
})

describe('processAddToCollectionCommand', () => {
  it('maps a DexReaderCollectionItem into an AddToCollectionCommand', () => {
    const result = dexreaderImport.processAddToCollectionCommand(
      collectionItem({ collectionId: 9, mangaId: 'manga-2' })
    )

    expect(result).toEqual({ collectionId: 9, mangaId: 'manga-2' })
  })
})

describe('processSaveProgressCommand', () => {
  it('maps a DexReaderChapterProgress into a SaveProgressCommand', () => {
    const result = dexreaderImport.processSaveProgressCommand(
      chapterProgress({ chapterId: 'chapter-2', currentPage: 10, completed: false })
    )

    expect(result).toEqual({
      mangaId: 'manga-1',
      chapterId: 'chapter-2',
      currentPage: 10,
      completed: false,
      lastReadAt: 1700000000
    })
  })
})

describe('processUpdateFirstReadCommand', () => {
  it('maps a DexReaderMangaProgress into an UpdateFirstReadCommand', () => {
    const result = dexreaderImport.processUpdateFirstReadCommand(
      mangaProgress({ mangaId: 'manga-2', firstReadAt: 1699999999 })
    )

    expect(result).toEqual({ mangaId: 'manga-2', firstReadAt: 1699999999 })
  })
})

describe('processSaveReaderOverrideCommand', () => {
  it.each([
    ['single-page', ReadingMode.SinglePage],
    ['double-page', ReadingMode.DoublePage],
    ['vertical-scroll', ReadingMode.VerticalScroll],
    ['an unrecognised value', ReadingMode.VerticalScroll]
  ])('maps readingMode %s to %s', (readingMode, expected) => {
    const result = dexreaderImport.processSaveReaderOverrideCommand(readerOverride({ readingMode }))

    expect(result.overrideData.readingMode).toBe(expected)
  })

  it('carries doublePageMode through unchanged', () => {
    const doublePageMode = { skipCoverPages: true, readRightToLeft: false }

    const result = dexreaderImport.processSaveReaderOverrideCommand(
      readerOverride({ readingMode: 'double-page', doublePageMode })
    )

    expect(result).toEqual({
      mangaId: 'manga-1',
      overrideData: { readingMode: ReadingMode.DoublePage, doublePageMode }
    })
  })
})

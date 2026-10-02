import { dexreaderExport } from './dexreader-export.helper'
import { manga, chapter } from '../../database/schemas'
import { CollectionContract } from '@shared/contracts/database/collections/collection.contract'
import { CollectionItemContract } from '@shared/contracts/database/collections/collection-item.contract'
import { MangaProgressContract } from '@shared/contracts/database/progress/manga-progress.contract'
import { ChapterProgressContract } from '@shared/contracts/database/progress/chapter-progress.contract'

type MangaRow = typeof manga.$inferInsert
type ChapterRow = typeof chapter.$inferSelect

const ADDED_AT = new Date('2026-01-01T00:00:00.000Z')
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z')
const LAST_ACCESSED_AT = new Date('2026-01-03T00:00:00.000Z')

function mangaRow(overrides: Partial<MangaRow> = {}): MangaRow {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    isFavourite: true,
    addedAt: ADDED_AT,
    updatedAt: UPDATED_AT,
    lastAccessedAt: LAST_ACCESSED_AT,
    ...overrides
  }
}

function chapterRow(overrides: Partial<ChapterRow> = {}): ChapterRow {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    title: null,
    chapterNumber: null,
    volume: null,
    language: 'en',
    publishAt: ADDED_AT,
    createdAt: ADDED_AT,
    updatedAt: UPDATED_AT,
    scanlationGroup: null,
    externalUrl: null,
    ...overrides
  }
}

function collection(overrides: Partial<CollectionContract> = {}): CollectionContract {
  return {
    id: 1,
    name: 'Favourites',
    createdAt: ADDED_AT,
    updatedAt: UPDATED_AT,
    ...overrides
  }
}

function collectionItem(overrides: Partial<CollectionItemContract> = {}): CollectionItemContract {
  return {
    id: 1,
    collectionId: 1,
    mangaId: 'manga-1',
    addedAt: ADDED_AT,
    position: 0,
    ...overrides
  }
}

function mangaProgress(overrides: Partial<MangaProgressContract> = {}): MangaProgressContract {
  return {
    mangaId: 'manga-1',
    lastChapterId: 'chapter-1',
    firstReadAt: 1700000000,
    lastReadAt: 1700003600,
    currentPage: 3,
    completed: false,
    ...overrides
  }
}

function chapterProgress(
  overrides: Partial<ChapterProgressContract> = {}
): ChapterProgressContract {
  return {
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    currentPage: 5,
    completed: true,
    lastReadAt: 1700003600,
    ...overrides
  }
}

describe('buildMangaData', () => {
  it('maps a full manga row, converting timestamps to unix seconds', () => {
    const result = dexreaderExport.buildMangaData(
      mangaRow({
        description: 'A dark fantasy manga',
        coverUrl: 'https://example.com/cover.jpg',
        status: 'ongoing' as never,
        externalLinks: { al: '30416' },
        tags: ['action'],
        authors: ['Kentaro Miura'],
        artists: ['Kentaro Miura'],
        alternativeTitles: { ja: 'ベルセルク' },
        year: 1989,
        lastVolume: '41',
        lastChapter: '364'
      })
    )

    expect(result).toEqual({
      mangaId: 'manga-1',
      title: 'Berserk',
      status: 'ongoing',
      description: 'A dark fantasy manga',
      coverUrl: 'https://example.com/cover.jpg',
      isFavourite: true,
      addedAt: Math.floor(ADDED_AT.getTime() / 1000),
      updatedAt: Math.floor(UPDATED_AT.getTime() / 1000),
      lastAccessedAt: Math.floor(LAST_ACCESSED_AT.getTime() / 1000),
      externalLinks: { al: '30416' },
      tags: ['action'],
      authors: ['Kentaro Miura'],
      artists: ['Kentaro Miura'],
      alternativeTitles: { ja: 'ベルセルク' },
      year: 1989,
      lastVolume: '41',
      lastChapter: '364'
    })
  })

  it('falls back to defaults for every nullable field', () => {
    const result = dexreaderExport.buildMangaData(
      mangaRow({
        description: null,
        coverUrl: null,
        status: null,
        isFavourite: false,
        externalLinks: null,
        tags: null,
        authors: null,
        artists: null,
        alternativeTitles: null,
        year: null,
        lastVolume: null,
        lastChapter: null
      })
    )

    expect(result.status).toBe('ongoing')
    expect(result.description).toBe('')
    expect(result.coverUrl).toBe('')
    expect(result.isFavourite).toBe(false)
    expect(result.externalLinks).toEqual({})
    expect(result.tags).toEqual([])
    expect(result.authors).toEqual([])
    expect(result.artists).toEqual([])
    expect(result.alternativeTitles).toEqual({})
    expect(result.year).toBeUndefined()
    expect(result.lastVolume).toBeUndefined()
    expect(result.lastChapter).toBeUndefined()
  })
})

describe('buildChapterData', () => {
  it('maps a full chapter row, converting timestamps to unix seconds', () => {
    const result = dexreaderExport.buildChapterData(
      chapterRow({
        title: 'The Black Swordsman',
        chapterNumber: '1',
        volume: '1',
        scanlationGroup: 'Dark Horse',
        externalUrl: 'https://example.com/chapter-1'
      })
    )

    expect(result).toEqual({
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      title: 'The Black Swordsman',
      chapterNumber: '1',
      volume: '1',
      language: 'en',
      publishAt: Math.floor(ADDED_AT.getTime() / 1000),
      createdAt: Math.floor(ADDED_AT.getTime() / 1000),
      updatedAt: Math.floor(UPDATED_AT.getTime() / 1000),
      scanlationGroup: 'Dark Horse',
      externalUrl: 'https://example.com/chapter-1'
    })
  })

  it('falls back to empty strings for every nullable field', () => {
    const result = dexreaderExport.buildChapterData(chapterRow())

    expect(result.title).toBe('')
    expect(result.chapterNumber).toBe('')
    expect(result.volume).toBe('')
    expect(result.scanlationGroup).toBe('')
    expect(result.externalUrl).toBe('')
  })
})

describe('buildCollectionData', () => {
  it('maps a collection, converting timestamps to unix seconds', () => {
    const result = dexreaderExport.buildCollectionData(
      collection({ id: 7, name: 'Plan to Read', description: 'Backlog' })
    )

    expect(result).toEqual({
      id: 7,
      name: 'Plan to Read',
      description: 'Backlog',
      createdAt: Math.floor(ADDED_AT.getTime() / 1000),
      updatedAt: Math.floor(UPDATED_AT.getTime() / 1000)
    })
  })
})

describe('buildCollectionItemData', () => {
  it('maps a collection item, converting the timestamp to unix seconds', () => {
    const result = dexreaderExport.buildCollectionItemData(
      collectionItem({ collectionId: 7, mangaId: 'manga-2', position: 3 })
    )

    expect(result).toEqual({
      collectionId: 7,
      mangaId: 'manga-2',
      addedAt: Math.floor(ADDED_AT.getTime() / 1000),
      position: 3
    })
  })

  it('falls back to position 0 when position is missing', () => {
    const result = dexreaderExport.buildCollectionItemData(
      collectionItem({ position: undefined as unknown as number })
    )

    expect(result.position).toBe(0)
  })
})

describe('buildMangaProgressData', () => {
  it('maps manga progress straight through without converting timestamps (already unix seconds)', () => {
    const result = dexreaderExport.buildMangaProgressData(
      mangaProgress({ mangaId: 'manga-2', lastChapterId: 'chapter-9' })
    )

    expect(result).toEqual({
      mangaId: 'manga-2',
      lastChapterId: 'chapter-9',
      firstReadAt: 1700000000,
      lastReadAt: 1700003600
    })
  })
})

describe('buildChapterProgressData', () => {
  it('maps chapter progress straight through without converting timestamps (already unix seconds)', () => {
    const result = dexreaderExport.buildChapterProgressData(
      chapterProgress({ chapterId: 'chapter-2', currentPage: 10, completed: false })
    )

    expect(result).toEqual({
      mangaId: 'manga-1',
      chapterId: 'chapter-2',
      currentPage: 10,
      completed: false,
      lastReadAt: 1700003600
    })
  })
})

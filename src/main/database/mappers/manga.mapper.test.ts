import { MangaMapper } from './manga.mapper'
import { manga } from '../schemas'
import { PublicationStatus } from '../../api/enums'
import { ReadingMode } from '@shared/enums/settings/reading-mode.enum'

type MangaRow = typeof manga.$inferSelect
type MangaProgressWithMetadataRow = Parameters<typeof MangaMapper.toMangaProgressWithMetadata>[0]
type MangaOverrideRow = Parameters<typeof MangaMapper.toMangaOverrideQuery>[0]
type MangaHistoryRow = Parameters<typeof MangaMapper.toMangaHistory>[0]

function mangaRow(overrides: Partial<MangaRow> = {}): MangaRow {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    description: 'A dark fantasy manga',
    coverUrl: 'https://example.com/cover.jpg',
    status: PublicationStatus.Ongoing,
    coverCachedAt: null,
    year: 1989,
    isFavourite: true,
    addedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastAccessedAt: new Date('2026-01-03T00:00:00.000Z'),
    externalLinks: { al: '30416' },
    tags: ['action'],
    authors: ['Kentaro Miura'],
    artists: ['Kentaro Miura'],
    alternativeTitles: { ja: 'ベルセルク' },
    lastVolume: '41',
    lastChapter: '364',
    ...overrides
  }
}

function progressRow(
  overrides: Partial<MangaProgressWithMetadataRow> = {}
): MangaProgressWithMetadataRow {
  return {
    mangaId: 'manga-1',
    lastChapterId: 'chapter-1',
    firstReadAt: new Date('2026-01-01T00:00:00.000Z'),
    lastReadAt: new Date('2026-01-02T00:00:00.000Z'),
    title: 'Berserk',
    coverUrl: 'https://example.com/cover.jpg',
    status: PublicationStatus.Ongoing,
    lastChapterNumber: '1',
    lastChapterTitle: 'The Black Swordsman',
    lastChapterVolume: '1',
    language: 'en',
    ...overrides
  }
}

function overrideRow(overrides: Partial<MangaOverrideRow> = {}): MangaOverrideRow {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    coverUrl: 'https://example.com/cover.jpg',
    readerSettings: { readingMode: ReadingMode.SinglePage },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides
  }
}

function historyRow(overrides: Partial<MangaHistoryRow> = {}): MangaHistoryRow {
  return {
    id: 1,
    mangaId: 'manga-1',
    title: 'Berserk',
    chapterId: 'chapter-1',
    coverUrl: 'https://example.com/cover.jpg',
    status: PublicationStatus.Ongoing,
    chapterTitle: 'The Black Swordsman',
    chapterNumber: '1',
    chapterVolume: '1',
    language: 'en',
    readDate: '2026-01-01',
    readAt: new Date('2026-01-01T12:00:00.000Z'),
    ...overrides
  }
}

describe('toMangaWithMetadata', () => {
  it('maps a fully-populated manga row', () => {
    const result = MangaMapper.toMangaWithMetadata(mangaRow())

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
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      externalLinks: { al: '30416' },
      lastVolume: '41',
      lastChapter: '364',
      isFavourite: true
    })
  })

  it('falls back to empty arrays and undefined for every nullable field', () => {
    const result = MangaMapper.toMangaWithMetadata(
      mangaRow({
        description: null,
        coverUrl: null,
        authors: null,
        artists: null,
        year: null,
        tags: null,
        externalLinks: null,
        lastVolume: null,
        lastChapter: null
      })
    )

    expect(result.description).toBeUndefined()
    expect(result.coverUrl).toBeUndefined()
    expect(result.authors).toEqual([])
    expect(result.artists).toEqual([])
    expect(result.year).toBeUndefined()
    expect(result.tags).toEqual([])
    expect(result.externalLinks).toBeUndefined()
    expect(result.lastVolume).toBeUndefined()
    expect(result.lastChapter).toBeUndefined()
  })
})

describe('toMangaProgressWithMetadata', () => {
  it('maps progress metadata, converting timestamps to unix seconds', () => {
    const result = MangaMapper.toMangaProgressWithMetadata(progressRow())

    expect(result).toEqual({
      mangaId: 'manga-1',
      lastChapterId: 'chapter-1',
      firstReadAt: Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000),
      lastReadAt: Math.floor(new Date('2026-01-02T00:00:00.000Z').getTime() / 1000),
      title: 'Berserk',
      coverUrl: 'https://example.com/cover.jpg',
      status: PublicationStatus.Ongoing,
      lastChapterNumber: '1',
      lastChapterTitle: 'The Black Swordsman',
      lastChapterVolume: '1',
      language: 'en'
    })
  })

  it('falls back to undefined for every nullable field', () => {
    const result = MangaMapper.toMangaProgressWithMetadata(
      progressRow({
        coverUrl: null,
        status: null,
        lastChapterNumber: null,
        lastChapterTitle: null,
        lastChapterVolume: null,
        language: null
      })
    )

    expect(result.coverUrl).toBeUndefined()
    // status is a direct `as PublicationStatus` cast with no nullish fallback, so null stays null.
    expect(result.status).toBeNull()
    expect(result.lastChapterNumber).toBeUndefined()
    expect(result.lastChapterTitle).toBeUndefined()
    expect(result.lastChapterVolume).toBeUndefined()
    expect(result.language).toBeUndefined()
  })
})

describe('toMangaOverrideQuery', () => {
  it('maps a reader-settings override row', () => {
    const result = MangaMapper.toMangaOverrideQuery(overrideRow())

    expect(result).toEqual({
      mangaId: 'manga-1',
      title: 'Berserk',
      coverUrl: 'https://example.com/cover.jpg',
      readerSettings: { readingMode: ReadingMode.SinglePage },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z')
    })
  })

  it('falls back to undefined when coverUrl is null', () => {
    const result = MangaMapper.toMangaOverrideQuery(overrideRow({ coverUrl: null }))

    expect(result.coverUrl).toBeUndefined()
  })
})

describe('toMangaHistory', () => {
  it('maps a history event, converting readAt to unix seconds', () => {
    const result = MangaMapper.toMangaHistory(historyRow())

    expect(result).toEqual({
      id: 1,
      mangaId: 'manga-1',
      title: 'Berserk',
      chapterId: 'chapter-1',
      coverUrl: 'https://example.com/cover.jpg',
      status: PublicationStatus.Ongoing,
      chapterTitle: 'The Black Swordsman',
      chapterNumber: '1',
      chapterVolume: '1',
      language: 'en',
      readDate: '2026-01-01',
      readAt: Math.floor(new Date('2026-01-01T12:00:00.000Z').getTime() / 1000)
    })
  })

  it('falls back to undefined for every nullable field', () => {
    const result = MangaMapper.toMangaHistory(
      historyRow({
        chapterId: null,
        coverUrl: null,
        status: null,
        chapterTitle: null,
        chapterNumber: null,
        chapterVolume: null,
        language: null
      })
    )

    expect(result.chapterId).toBeUndefined()
    expect(result.coverUrl).toBeUndefined()
    // status is a direct `as PublicationStatus` cast with no nullish fallback, so null stays null.
    expect(result.status).toBeNull()
    expect(result.chapterTitle).toBeUndefined()
    expect(result.chapterNumber).toBeUndefined()
    expect(result.chapterVolume).toBeUndefined()
    expect(result.language).toBeUndefined()
  })
})

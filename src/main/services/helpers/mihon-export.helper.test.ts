import { mihonExport } from './mihon-export.helper'
import { PublicationStatus } from '../../api/enums'
import { ChapterProgressContract } from '@shared/contracts/database/progress/chapter-progress.contract'
import { ChapterWithMetadataContract } from '@shared/contracts/database/manga/chapter-with-metadata.contract'
import { CollectionContract } from '@shared/contracts/database/collections/collection.contract'
import { MangaWithMetadataContract } from '@shared/contracts/database/manga/manga-with-metadata.contract'

function chapterProgress(
  overrides: Partial<ChapterProgressContract> = {}
): ChapterProgressContract {
  return {
    mangaId: 'manga-1',
    chapterId: 'chapter-1',
    currentPage: 5,
    completed: true,
    lastReadAt: 1700000000,
    ...overrides
  }
}

function chapterMetadata(
  overrides: Partial<ChapterWithMetadataContract> = {}
): ChapterWithMetadataContract {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    title: 'The Black Swordsman',
    chapterNumber: '1',
    language: 'en',
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    scanlatorGroup: 'Dark Horse',
    ...overrides
  }
}

function collection(overrides: Partial<CollectionContract> = {}): CollectionContract {
  return {
    id: 7,
    name: 'Favourites',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  }
}

function manga(overrides: Partial<MangaWithMetadataContract> = {}): MangaWithMetadataContract {
  return {
    mangaId: 'manga-1',
    title: 'Berserk',
    status: PublicationStatus.Ongoing,
    authors: [],
    artists: [],
    tags: [],
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  }
}

describe('buildMangaUrl / buildChapterUrl', () => {
  it('builds Mihon-style manga and chapter urls', () => {
    expect(mihonExport.buildMangaUrl('manga-1')).toBe('/manga/manga-1')
    expect(mihonExport.buildChapterUrl('chapter-1')).toBe('/chapter/chapter-1')
  })
})

describe('mapStatus', () => {
  // Object.keys(StatusMap).find(...) returns the matching key as a STRING ('2', not 2) -
  // the `as unknown as number` cast papers over this at the type level. It's still a real
  // mismatch from the declared `number` return type, but harmless in practice: protobufjs
  // coerces a numeric string into the int32 field correctly on encode (verified directly
  // against the real mihon.proto schema), so the exported backup is unaffected.
  it.each([
    [PublicationStatus.Completed, '2'],
    [PublicationStatus.Cancelled, '5'],
    [PublicationStatus.Hiatus, '6']
  ])('maps %s to Mihon status %s', (status, expected) => {
    expect(mihonExport.mapStatus(status)).toBe(expected)
  })

  it('maps Ongoing to the first matching Mihon status code', () => {
    // Several Mihon codes (0, 1, 3) all map back to Ongoing; Object.keys().find() returns
    // the first one in insertion order.
    expect(mihonExport.mapStatus(PublicationStatus.Ongoing)).toBe('0')
  })
})

describe('buildBackupChapter', () => {
  it('builds a BackupChapter from progress and metadata', () => {
    const result = mihonExport.buildBackupChapter(
      chapterProgress({ chapterId: 'chapter-2', currentPage: 10, completed: false }),
      chapterMetadata({ chapterId: 'chapter-2', chapterNumber: '2' })
    )

    expect(result).toEqual({
      url: '/chapter/chapter-2',
      name: 'The Black Swordsman',
      scanlator: 'Dark Horse',
      read: false,
      lastPageRead: 10,
      dateFetch: Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000),
      dateUpload: Math.floor(new Date('2026-01-02T00:00:00.000Z').getTime() / 1000),
      chapterNumber: 2
    })
  })

  it('leaves metadata-derived fields undefined when there is no matching metadata', () => {
    const result = mihonExport.buildBackupChapter(chapterProgress(), undefined)

    expect(result).toEqual({
      url: '/chapter/chapter-1',
      name: undefined,
      scanlator: undefined,
      read: true,
      lastPageRead: 5,
      dateFetch: undefined,
      dateUpload: undefined,
      chapterNumber: undefined
    })
  })
})

describe('buildBackupHistory', () => {
  it('builds a BackupHistory entry from chapter progress', () => {
    const result = mihonExport.buildBackupHistory(
      chapterProgress({ chapterId: 'chapter-3', lastReadAt: 1700005555 })
    )

    expect(result).toEqual({ url: '/chapter/chapter-3', lastRead: 1700005555 })
  })
})

describe('buildBackupCategory', () => {
  it('builds a BackupCategory from a collection, using its position as the order', () => {
    const result = mihonExport.buildBackupCategory(collection({ id: 3, name: 'Plan to Read' }), 1)

    expect(result).toEqual({ name: 'Plan to Read', order: 1, id: 3 })
  })
})

describe('buildBackupManga', () => {
  it('builds a BackupManga, translating MangaDex tag ids to Mihon genre names', () => {
    const result = mihonExport.buildBackupManga(
      manga({
        tags: ['391b0423-d847-456f-aff0-8b0cfc03066b'],
        authors: ['Kentaro Miura'],
        artists: ['Kentaro Miura'],
        description: 'A dark fantasy manga',
        coverUrl: 'https://example.com/cover.jpg'
      }),
      [42],
      [],
      []
    )

    expect(result).toEqual({
      source: '2499283573021220255',
      url: '/manga/manga-1',
      title: 'Berserk',
      description: 'A dark fantasy manga',
      status: '0',
      thumbnailUrl: 'https://example.com/cover.jpg',
      genre: ['Action'],
      categories: [42],
      chapters: [],
      history: [],
      artist: 'Kentaro Miura',
      author: 'Kentaro Miura',
      favorite: true
    })
  })

  it('keeps an unrecognised tag id as-is in the genre list', () => {
    const result = mihonExport.buildBackupManga(manga({ tags: ['not-a-known-tag-id'] }), [], [], [])

    expect(result.genre).toEqual(['not-a-known-tag-id'])
  })

  it('defaults categories to an empty array and omits author/artist when none are set', () => {
    const result = mihonExport.buildBackupManga(manga(), undefined, [], [])

    expect(result.categories).toEqual([])
    expect(result.artist).toBeUndefined()
    expect(result.author).toBeUndefined()
  })
})

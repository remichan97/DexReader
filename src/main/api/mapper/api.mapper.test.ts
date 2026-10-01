import { mapChapterEntityToContract, mapMangaEntityToContract } from './api.mapper'
import { Manga } from '../entities/manga.entity'
import { Chapter } from '../entities/chapter.entity'
import { Relationship } from '../entities/relationship.entity'
import { RelationshipType } from '../enums/relationship-type.enum'
import { MangaEntityType } from '../enums/manga-entity-type.enum'
import { CoverSize } from '../enums/cover-size.enum'

function relationship(overrides: Partial<Relationship> = {}): Relationship {
  return { id: 'rel-1', type: RelationshipType.AUTHOR, attributes: { name: 'Name' }, ...overrides }
}

function manga(overrides: Partial<Manga> = {}): Manga {
  return {
    id: 'manga-1',
    type: MangaEntityType.Manga,
    attributes: {
      title: { en: 'Berserk' },
      altTitles: [{ ja: 'ベルセルク' }],
      description: { en: 'A dark fantasy manga' },
      isLocked: false,
      links: { al: '30416' },
      originalLanguage: 'ja',
      lastVolume: null,
      lastChapter: null,
      publicationDemographic: null,
      status: 'ongoing' as never,
      year: null,
      contentRating: 'safe' as never,
      tags: [],
      state: 'published',
      chapterNumbersResetOnNewVolume: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      version: 1,
      availableTranslatedLanguages: ['en', 'ja'],
      latestUploadedChapter: null
    },
    relationships: [],
    ...overrides
  }
}

function chapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'chapter-1',
    type: MangaEntityType.Chapter,
    attributes: {
      title: 'The Black Swordsman',
      volume: '1',
      chapter: '1',
      pages: 20,
      translatedLanguage: 'en',
      uploader: 'uploader-1',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      publishAt: '2026-01-01T00:00:00Z',
      readableAt: '2026-01-01T00:00:00Z',
      isUnavailable: false
    },
    relationships: [],
    ...overrides
  }
}

describe('mapMangaEntityToContract', () => {
  it('maps the straightforward fields through unchanged', () => {
    const result = mapMangaEntityToContract(manga())

    expect(result).toEqual(
      expect.objectContaining({
        id: 'manga-1',
        title: { en: 'Berserk' },
        altTitles: [{ ja: 'ベルセルク' }],
        description: { en: 'A dark fantasy manga' },
        links: { al: '30416' },
        status: 'ongoing',
        contentRating: 'safe',
        availableTranslatedLanguages: ['en', 'ja']
      })
    )
  })

  it.each(['lastVolume', 'lastChapter', 'publicationDemographic', 'year'] as const)(
    'converts a null %s to undefined',
    (field) => {
      const result = mapMangaEntityToContract(manga())

      expect(result[field]).toBeUndefined()
    }
  )

  it.each([
    ['lastVolume', '12'],
    ['lastChapter', '364'],
    ['publicationDemographic', 'seinen'],
    ['year', 1989]
  ] as const)('passes through a non-null %s value', (field, value) => {
    const result = mapMangaEntityToContract(
      manga({ attributes: { ...manga().attributes, [field]: value } })
    )

    expect(result[field]).toBe(value)
  })

  it('derives tags/authors/artists/cover urls from the relationships and tags', () => {
    const result = mapMangaEntityToContract(
      manga({
        relationships: [
          relationship({
            id: 'author-1',
            type: RelationshipType.AUTHOR,
            attributes: { name: 'Kentaro Miura' }
          }),
          relationship({
            id: 'artist-1',
            type: RelationshipType.ARTIST,
            attributes: { name: 'Kentaro Miura' }
          }),
          relationship({
            type: RelationshipType.COVER_ART,
            attributes: { fileName: 'cover.jpg' }
          })
        ]
      })
    )

    expect(result.authors).toEqual([{ id: 'author-1', name: 'Kentaro Miura' }])
    expect(result.artists).toEqual([{ id: 'artist-1', name: 'Kentaro Miura' }])
    expect(result.coverUrl).toBe(
      `mangadex://uploads.mangadex.org/covers/manga-1/cover.jpg.${CoverSize.Medium}.jpg`
    )
    expect(result.coverUrlLarge).toBe(
      `mangadex://uploads.mangadex.org/covers/manga-1/cover.jpg.${CoverSize.Large}.jpg`
    )
  })

  it('returns an undefined cover url when there is no cover_art relationship', () => {
    const result = mapMangaEntityToContract(manga({ relationships: [] }))

    expect(result.coverUrl).toBeUndefined()
    expect(result.coverUrlLarge).toBeUndefined()
  })
})

describe('mapChapterEntityToContract', () => {
  it('maps the straightforward fields through unchanged', () => {
    const result = mapChapterEntityToContract(chapter())

    expect(result).toEqual(
      expect.objectContaining({
        id: 'chapter-1',
        title: 'The Black Swordsman',
        volume: '1',
        chapter: '1',
        pages: 20,
        translatedLanguage: 'en',
        isUnavailable: false,
        publishAt: '2026-01-01T00:00:00Z'
      })
    )
  })

  it('derives the scanlation group from relationships', () => {
    const result = mapChapterEntityToContract(
      chapter({
        relationships: [
          relationship({
            id: 'group-1',
            type: RelationshipType.SCANLATION_GROUP,
            attributes: { name: 'Scan Group' }
          })
        ]
      })
    )

    expect(result.scanlationGroup).toEqual({ 'group-1': 'Scan Group' })
  })

  it('returns an empty scanlation group record when there is none', () => {
    const result = mapChapterEntityToContract(chapter({ relationships: [] }))

    expect(result.scanlationGroup).toEqual({})
  })
})

import {
  getChapterScanlationGroups,
  getMangaCoverUrl,
  getMangaCreator,
  getMangaTags
} from './mangadex.util'
import { Manga } from '../entities/manga.entity'
import { Chapter } from '../entities/chapter.entity'
import { Relationship } from '../entities/relationship.entity'
import { Tag } from '../entities/tag-entity'
import { RelationshipType } from '../enums/relationship-type.enum'
import { MangaEntityType } from '../enums/manga-entity-type.enum'
import { TagGroup } from '../enums/tag-group.enum'
import { CoverSize } from '../enums/cover-size.enum'

function relationship(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: 'rel-1',
    type: RelationshipType.AUTHOR,
    attributes: { name: 'Kentaro Miura' },
    ...overrides
  }
}

function manga(overrides: Partial<Manga> = {}): Manga {
  return {
    id: 'manga-1',
    type: MangaEntityType.Manga,
    attributes: {
      title: { en: 'Berserk' },
      altTitles: [],
      description: { en: 'A dark fantasy manga' },
      isLocked: false,
      links: {},
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
      availableTranslatedLanguages: ['en'],
      latestUploadedChapter: null
    },
    relationships: [],
    ...overrides
  }
}

function tag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    type: MangaEntityType.Tag,
    attributes: { name: { en: 'Action' }, description: {}, group: TagGroup.GENRE, version: 1 },
    ...overrides
  }
}

function chapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'chapter-1',
    type: MangaEntityType.Chapter,
    attributes: {
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

describe('getMangaCreator', () => {
  it('returns only relationships matching the requested creator type', () => {
    const subject = manga({
      relationships: [
        relationship({
          id: 'author-1',
          type: RelationshipType.AUTHOR,
          attributes: { name: 'Author Name' }
        }),
        relationship({
          id: 'artist-1',
          type: RelationshipType.ARTIST,
          attributes: { name: 'Artist Name' }
        }),
        relationship({ id: 'cover-1', type: RelationshipType.COVER_ART })
      ]
    })

    expect(getMangaCreator(subject, RelationshipType.AUTHOR)).toEqual([
      { id: 'author-1', name: 'Author Name' }
    ])
    expect(getMangaCreator(subject, RelationshipType.ARTIST)).toEqual([
      { id: 'artist-1', name: 'Artist Name' }
    ])
  })

  it('returns an empty array when there are no matching relationships', () => {
    expect(getMangaCreator(manga({ relationships: [] }), RelationshipType.AUTHOR)).toEqual([])
  })

  it('falls back to "Unknown" when the relationship has no name attribute', () => {
    const subject = manga({
      relationships: [relationship({ type: RelationshipType.AUTHOR, attributes: {} })]
    })

    expect(getMangaCreator(subject, RelationshipType.AUTHOR)).toEqual([
      { id: 'rel-1', name: 'Unknown' }
    ])
  })
})

describe('getMangaTags', () => {
  it('maps each tag to its id, English name, and group', () => {
    const subject = manga({
      attributes: {
        ...manga().attributes,
        tags: [tag({ id: 'tag-1', attributes: { ...tag().attributes, name: { en: 'Action' } } })]
      }
    })

    expect(getMangaTags(subject)).toEqual([{ id: 'tag-1', name: 'Action', group: TagGroup.GENRE }])
  })

  it('falls back to "Unknown" when the English tag name is missing', () => {
    const subject = manga({
      attributes: {
        ...manga().attributes,
        tags: [tag({ attributes: { ...tag().attributes, name: {} } })]
      }
    })

    expect(getMangaTags(subject)[0].name).toBe('Unknown')
  })

  it('returns an empty array when the manga has no tags', () => {
    expect(getMangaTags(manga({ attributes: { ...manga().attributes, tags: [] } }))).toEqual([])
  })
})

describe('getMangaCoverUrl', () => {
  it('builds a mangadex:// proxy URL using the medium size by default', () => {
    const subject = manga({
      relationships: [
        relationship({
          type: RelationshipType.COVER_ART,
          attributes: { fileName: 'cover.jpg' }
        })
      ]
    })

    expect(getMangaCoverUrl(subject)).toBe(
      `mangadex://uploads.mangadex.org/covers/manga-1/cover.jpg.${CoverSize.Medium}.jpg`
    )
  })

  it('builds the URL at the requested size', () => {
    const subject = manga({
      relationships: [
        relationship({
          type: RelationshipType.COVER_ART,
          attributes: { fileName: 'cover.jpg' }
        })
      ]
    })

    expect(getMangaCoverUrl(subject, CoverSize.Large)).toBe(
      `mangadex://uploads.mangadex.org/covers/manga-1/cover.jpg.${CoverSize.Large}.jpg`
    )
  })

  it('returns undefined when there is no cover_art relationship', () => {
    expect(getMangaCoverUrl(manga({ relationships: [] }))).toBeUndefined()
  })

  it('returns undefined when the cover_art relationship has no fileName', () => {
    const subject = manga({
      relationships: [relationship({ type: RelationshipType.COVER_ART, attributes: {} })]
    })

    expect(getMangaCoverUrl(subject)).toBeUndefined()
  })
})

describe('getChapterScanlationGroups', () => {
  it('returns a record keyed by the scanlation group id', () => {
    const subject = chapter({
      relationships: [
        relationship({
          id: 'group-1',
          type: RelationshipType.SCANLATION_GROUP,
          attributes: { name: 'Scan Group' }
        })
      ]
    })

    expect(getChapterScanlationGroups(subject)).toEqual({ 'group-1': 'Scan Group' })
  })

  it('falls back to "Unknown" when the name attribute is present but empty', () => {
    const subject = chapter({
      relationships: [
        relationship({
          id: 'group-1',
          type: RelationshipType.SCANLATION_GROUP,
          attributes: { name: '' }
        })
      ]
    })

    expect(getChapterScanlationGroups(subject)).toEqual({ 'group-1': 'Unknown' })
  })

  it('returns an empty record when the relationship has no name field at all', () => {
    const subject = chapter({
      relationships: [
        relationship({ id: 'group-1', type: RelationshipType.SCANLATION_GROUP, attributes: {} })
      ]
    })

    expect(getChapterScanlationGroups(subject)).toEqual({})
  })

  it('returns an empty record when there is no scanlation_group relationship', () => {
    expect(getChapterScanlationGroups(chapter({ relationships: [] }))).toEqual({})
  })
})

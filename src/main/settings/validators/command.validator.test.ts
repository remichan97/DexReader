import {
  isQueuedDownloads,
  isGetLibraryMangaCommand,
  isUpsertMangaCommand,
  isCreateCollectionCommand,
  isUpdateCollectionCommand,
  isAddToCollectionCommand,
  isRemoveFromCollectionCommand,
  isSaveProgressCommand,
  isSaveChapterCommand,
  isGetActiveDatesCommand
} from './command.validator'
import { PublicationStatus } from '@shared/enums/mangadex'
import { ImageQuality } from '@shared/enums/mangadex'

describe('isQueuedDownloads', () => {
  function valid(overrides: Record<string, unknown> = {}): unknown {
    return {
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      language: 'en',
      quality: ImageQuality.High,
      addedAt: new Date(),
      ...overrides
    }
  }

  it('accepts a valid command', () => {
    expect(isQueuedDownloads(valid())).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isQueuedDownloads(null)).toThrow(TypeError)
  })

  it.each(['chapterId', 'mangaId', 'language', 'quality'])(
    'rejects a missing or non-string %s',
    (field) => {
      expect(() => isQueuedDownloads(valid({ [field]: 42 }))).toThrow(TypeError)
    }
  )

  it('rejects a non-Date addedAt', () => {
    expect(() => isQueuedDownloads(valid({ addedAt: '2026-01-01' }))).toThrow(TypeError)
  })
})

describe('isGetLibraryMangaCommand', () => {
  it('accepts an empty command (every field optional)', () => {
    expect(isGetLibraryMangaCommand({})).toBe(true)
  })

  it('accepts a fully-populated command', () => {
    expect(
      isGetLibraryMangaCommand({
        collectionId: 1,
        search: 'berserk',
        limit: 20,
        offset: 0,
        includeDownloaded: true
      })
    ).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isGetLibraryMangaCommand(null)).toThrow(TypeError)
  })

  it.each([
    ['collectionId', 'x'],
    ['search', 42],
    ['limit', 'x'],
    ['offset', 'x'],
    ['includeDownloaded', 'x']
  ])('rejects an invalid %s when provided', (field, value) => {
    expect(() => isGetLibraryMangaCommand({ [field]: value })).toThrow(TypeError)
  })
})

describe('isUpsertMangaCommand', () => {
  function valid(overrides: Record<string, unknown> = {}): unknown {
    return {
      mangaId: 'manga-1',
      title: 'Berserk',
      coverUrl: 'https://example.com/cover.jpg',
      status: PublicationStatus.Ongoing,
      authors: ['Kentaro Miura'],
      artists: ['Kentaro Miura'],
      tags: ['action'],
      ...overrides
    }
  }

  it('accepts a valid command', () => {
    expect(isUpsertMangaCommand(valid())).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isUpsertMangaCommand(null)).toThrow(TypeError)
  })

  it.each(['mangaId', 'title', 'coverUrl'])('rejects a missing or non-string %s', (field) => {
    expect(() => isUpsertMangaCommand(valid({ [field]: 42 }))).toThrow(TypeError)
  })

  it('rejects an invalid status', () => {
    expect(() => isUpsertMangaCommand(valid({ status: 'bogus' }))).toThrow(TypeError)
  })

  it.each(['authors', 'artists', 'tags'])(
    'rejects a %s that is not an array of strings',
    (field) => {
      expect(() => isUpsertMangaCommand(valid({ [field]: [1, 2] }))).toThrow(TypeError)
      expect(() => isUpsertMangaCommand(valid({ [field]: 'not-an-array' }))).toThrow(TypeError)
    }
  )
})

describe('isCreateCollectionCommand', () => {
  it('accepts a valid command', () => {
    expect(isCreateCollectionCommand({ name: 'Favourites' })).toBe(true)
  })

  it('accepts an optional description', () => {
    expect(isCreateCollectionCommand({ name: 'Favourites', description: 'My list' })).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isCreateCollectionCommand(null)).toThrow(TypeError)
  })

  it('rejects a missing name', () => {
    expect(() => isCreateCollectionCommand({})).toThrow(TypeError)
  })

  it('rejects a blank (whitespace-only) name', () => {
    expect(() => isCreateCollectionCommand({ name: '   ' })).toThrow(TypeError)
  })

  it('rejects a non-string description when provided', () => {
    expect(() => isCreateCollectionCommand({ name: 'Favourites', description: 42 })).toThrow(
      TypeError
    )
  })
})

describe('isUpdateCollectionCommand', () => {
  it('accepts a command with only an id', () => {
    expect(isUpdateCollectionCommand({ id: 1 })).toBe(true)
  })

  it('accepts a fully-populated command', () => {
    expect(isUpdateCollectionCommand({ id: 1, name: 'Favourites', description: 'My list' })).toBe(
      true
    )
  })

  it('rejects a non-object value', () => {
    expect(() => isUpdateCollectionCommand(null)).toThrow(TypeError)
  })

  it('rejects a missing or non-numeric id', () => {
    expect(() => isUpdateCollectionCommand({})).toThrow(TypeError)
    expect(() => isUpdateCollectionCommand({ id: 'x' })).toThrow(TypeError)
  })

  it('rejects a non-string name when provided', () => {
    expect(() => isUpdateCollectionCommand({ id: 1, name: 42 })).toThrow(TypeError)
  })

  it('rejects a non-string description when provided', () => {
    expect(() => isUpdateCollectionCommand({ id: 1, description: 42 })).toThrow(TypeError)
  })
})

describe('isAddToCollectionCommand', () => {
  it('accepts a valid command', () => {
    expect(isAddToCollectionCommand({ collectionId: 1, mangaId: 'manga-1' })).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isAddToCollectionCommand(null)).toThrow(TypeError)
  })

  it('rejects a missing or non-numeric collectionId', () => {
    expect(() => isAddToCollectionCommand({ mangaId: 'manga-1' })).toThrow(TypeError)
  })

  it('rejects a missing or non-string mangaId', () => {
    expect(() => isAddToCollectionCommand({ collectionId: 1 })).toThrow(TypeError)
  })
})

describe('isRemoveFromCollectionCommand', () => {
  it('accepts a valid command', () => {
    expect(isRemoveFromCollectionCommand({ collectionId: 1, mangaId: 'manga-1' })).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isRemoveFromCollectionCommand(null)).toThrow(TypeError)
  })

  it('rejects a missing or non-numeric collectionId', () => {
    expect(() => isRemoveFromCollectionCommand({ mangaId: 'manga-1' })).toThrow(TypeError)
  })

  it('rejects a missing or non-string mangaId', () => {
    expect(() => isRemoveFromCollectionCommand({ collectionId: 1 })).toThrow(TypeError)
  })
})

describe('isSaveProgressCommand', () => {
  function valid(overrides: Record<string, unknown> = {}): unknown {
    return {
      mangaId: 'manga-1',
      chapterId: 'chapter-1',
      currentPage: 3,
      completed: false,
      ...overrides
    }
  }

  it('accepts a valid command', () => {
    expect(isSaveProgressCommand(valid())).toBe(true)
  })

  it('accepts an optional lastReadAt', () => {
    expect(isSaveProgressCommand(valid({ lastReadAt: 1700000000 }))).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isSaveProgressCommand(null)).toThrow(TypeError)
  })

  it.each(['mangaId', 'chapterId'])('rejects a missing or non-string %s', (field) => {
    expect(() => isSaveProgressCommand(valid({ [field]: 42 }))).toThrow(TypeError)
  })

  it('rejects a non-numeric currentPage', () => {
    expect(() => isSaveProgressCommand(valid({ currentPage: 'x' }))).toThrow(TypeError)
  })

  it('rejects a non-boolean completed', () => {
    expect(() => isSaveProgressCommand(valid({ completed: 'x' }))).toThrow(TypeError)
  })

  it('rejects a non-numeric lastReadAt when provided', () => {
    expect(() => isSaveProgressCommand(valid({ lastReadAt: 'x' }))).toThrow(TypeError)
  })
})

describe('isSaveChapterCommand', () => {
  function valid(overrides: Record<string, unknown> = {}): unknown {
    return {
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      language: 'en',
      publishAt: new Date(),
      ...overrides
    }
  }

  it('accepts a valid command', () => {
    expect(isSaveChapterCommand(valid())).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isSaveChapterCommand(null)).toThrow(TypeError)
  })

  it.each(['chapterId', 'mangaId', 'language'])('rejects a missing or non-string %s', (field) => {
    expect(() => isSaveChapterCommand(valid({ [field]: 42 }))).toThrow(TypeError)
  })

  it('rejects a non-Date publishAt', () => {
    expect(() => isSaveChapterCommand(valid({ publishAt: '2026-01-01' }))).toThrow(TypeError)
  })
})

describe('isGetActiveDatesCommand', () => {
  it('accepts a valid command', () => {
    expect(isGetActiveDatesCommand({ fromDate: '2026-01-01', toDate: '2026-01-31' })).toBe(true)
  })

  it('rejects a non-object value', () => {
    expect(() => isGetActiveDatesCommand(null)).toThrow(TypeError)
  })

  it('rejects a missing or non-string fromDate', () => {
    expect(() => isGetActiveDatesCommand({ toDate: '2026-01-31' })).toThrow(TypeError)
  })

  it('rejects a missing or non-string toDate', () => {
    expect(() => isGetActiveDatesCommand({ fromDate: '2026-01-01' })).toThrow(TypeError)
  })
})

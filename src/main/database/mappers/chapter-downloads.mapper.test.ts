import { ChapterDownloadMapper } from './chapter-downloads.mapper'
import { DownloadStatus } from '@shared/enums/repositories/download-status.enum'
import { ImageQuality } from '../../api/enums'

type ChapterDownloadRow = Parameters<typeof ChapterDownloadMapper.toChapterDownloadQuery>[0]

function row(overrides: Partial<ChapterDownloadRow> = {}): ChapterDownloadRow {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    status: DownloadStatus.Completed,
    storageSize: 1024,
    downloadedAt: new Date('2026-01-01T00:00:00.000Z'),
    downloadsBasePath: '/downloads',
    filePath: 'manga-1/chapter-1',
    totalPages: 10,
    imageQuality: ImageQuality.High,
    imageFormat: '.jpg',
    errorMessage: null,
    title: 'Berserk',
    coverUrl: 'https://example.com/cover.jpg',
    chapterNumber: '1',
    chapterTitle: 'The Black Swordsman',
    volume: '1',
    language: 'en',
    ...overrides
  }
}

describe('toChapterDownloadQuery', () => {
  it('maps a fully-populated row', () => {
    const result = ChapterDownloadMapper.toChapterDownloadQuery(row())

    expect(result).toEqual({
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      status: DownloadStatus.Completed,
      storageSize: 1024,
      downloadedAt: Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000),
      downloadsBasePath: '/downloads',
      filePath: 'manga-1/chapter-1',
      totalPages: 10,
      imageQuality: ImageQuality.High,
      imageFormat: '.jpg',
      errorMessage: undefined,
      title: 'Berserk',
      coverUrl: 'https://example.com/cover.jpg',
      chapterNumber: '1',
      chapterTitle: 'The Black Swordsman',
      volume: '1',
      language: 'en'
    })
  })

  it('falls back to defaults for every nullable field', () => {
    const result = ChapterDownloadMapper.toChapterDownloadQuery(
      row({
        storageSize: null,
        errorMessage: null,
        coverUrl: null,
        chapterNumber: null,
        chapterTitle: null,
        volume: null
      })
    )

    expect(result.storageSize).toBe(0)
    expect(result.errorMessage).toBeUndefined()
    expect(result.coverUrl).toBeUndefined()
    expect(result.chapterNumber).toBe('')
    expect(result.chapterTitle).toBe('')
    expect(result.volume).toBeUndefined()
  })

  it('falls back to the current time when downloadedAt is null', () => {
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'))

    const result = ChapterDownloadMapper.toChapterDownloadQuery(row({ downloadedAt: null }))

    expect(result.downloadedAt).toBe(
      Math.floor(new Date('2026-02-01T00:00:00.000Z').getTime() / 1000)
    )
    vi.useRealTimers()
  })
})

describe('toMangaStorageQuery', () => {
  it('maps the total app storage and per-manga breakdown, falling back coverUrl to undefined', () => {
    const result = ChapterDownloadMapper.toMangaStorageQuery(2048, [
      {
        mangaId: 'manga-1',
        mangaTitle: 'Berserk',
        coverUrl: 'https://example.com/cover.jpg',
        chapterCount: 5,
        totalStorageSize: 1024
      },
      {
        mangaId: 'manga-2',
        mangaTitle: 'Vagabond',
        coverUrl: null,
        chapterCount: 3,
        totalStorageSize: 512
      }
    ])

    expect(result).toEqual({
      totalAppStorage: 2048,
      mangaStorageByTitle: [
        {
          mangaId: 'manga-1',
          mangaTitle: 'Berserk',
          coverUrl: 'https://example.com/cover.jpg',
          chapterCount: 5,
          totalStorageSize: 1024
        },
        {
          mangaId: 'manga-2',
          mangaTitle: 'Vagabond',
          coverUrl: undefined,
          chapterCount: 3,
          totalStorageSize: 512
        }
      ]
    })
  })

  it('returns an empty breakdown when there is no per-manga data', () => {
    const result = ChapterDownloadMapper.toMangaStorageQuery(0, [])

    expect(result).toEqual({ totalAppStorage: 0, mangaStorageByTitle: [] })
  })
})

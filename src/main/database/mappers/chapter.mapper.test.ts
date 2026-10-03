import { ChapterMapper } from './chapter.mapper'
import { chapter } from '../schemas/chapter.schema'

type ChapterRow = typeof chapter.$inferSelect

function row(overrides: Partial<ChapterRow> = {}): ChapterRow {
  return {
    chapterId: 'chapter-1',
    mangaId: 'manga-1',
    title: 'The Black Swordsman',
    chapterNumber: '1',
    volume: '1',
    language: 'en',
    publishAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    scanlationGroup: 'Dark Horse',
    externalUrl: 'https://example.com/chapter-1',
    ...overrides
  }
}

describe('toChapterMetadata', () => {
  it('maps a fully-populated chapter row', () => {
    const result = ChapterMapper.toChapterMetadata(row())

    expect(result).toEqual({
      chapterId: 'chapter-1',
      mangaId: 'manga-1',
      title: 'The Black Swordsman',
      chapterNumber: '1',
      volume: '1',
      language: 'en',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      scanlatorGroup: 'Dark Horse',
      externalUrl: 'https://example.com/chapter-1'
    })
  })

  it('falls back to undefined for every nullable field', () => {
    const result = ChapterMapper.toChapterMetadata(
      row({
        title: null,
        chapterNumber: null,
        volume: null,
        scanlationGroup: null,
        externalUrl: null
      })
    )

    expect(result.title).toBeUndefined()
    expect(result.chapterNumber).toBeUndefined()
    expect(result.volume).toBeUndefined()
    expect(result.scanlatorGroup).toBeUndefined()
    expect(result.externalUrl).toBeUndefined()
  })
})

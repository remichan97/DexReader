import { compareChaptersAscending, parseChapterNumber, sortChaptersAscending } from './chapterOrder'

interface TestChapter {
  id: string
  chapter?: string
  volume?: string
  publishAt: string
}

function chapter(
  id: string,
  chapterNumber?: string,
  overrides: Partial<TestChapter> = {}
): TestChapter {
  return { id, chapter: chapterNumber, publishAt: '2026-01-01T00:00:00+00:00', ...overrides }
}

const ids = (list: TestChapter[]): string[] => list.map((entry) => entry.id)

describe('parseChapterNumber', () => {
  it.each([
    ['1', 1],
    ['10', 10],
    ['10.5', 10.5],
    ['0', 0],
    ['007', 7],
    [' 12 ', 12],
    ['5a', 5],
    ['100.25b', 100.25]
  ])('reads %j as %d', (value, expected) => {
    expect(parseChapterNumber(value)).toBe(expected)
  })

  it.each([undefined, '', '   ', 'Extra', 'Prologue', '-', 'x5'])(
    'finds no number in %j',
    (value) => {
      expect(parseChapterNumber(value)).toBeUndefined()
    }
  )
})

describe('sortChaptersAscending', () => {
  it('orders by chapter number as a number, not as text', () => {
    const sorted = sortChaptersAscending([
      chapter('a', '10'),
      chapter('b', '2'),
      chapter('c', '1'),
      chapter('d', '100')
    ])

    expect(ids(sorted)).toEqual(['c', 'b', 'a', 'd'])
  })

  it('puts fractional chapters between their neighbours', () => {
    const sorted = sortChaptersAscending([
      chapter('c', '11'),
      chapter('b', '10.5'),
      chapter('a', '10')
    ])

    expect(ids(sorted)).toEqual(['a', 'b', 'c'])
  })

  it('puts chapters without a number first, so a one-shot or prologue comes before chapter 1', () => {
    const sorted = sortChaptersAscending([
      chapter('one', '1'),
      chapter('oneshot', undefined),
      chapter('extra', 'Extra'),
      chapter('zero', '0')
    ])

    expect(ids(sorted).slice(0, 2).sort()).toEqual(['extra', 'oneshot'])
    expect(ids(sorted).slice(2)).toEqual(['zero', 'one'])
  })

  it('never produces an inconsistent order for non-numeric chapters', () => {
    const list = ['5', 'Extra', '3', undefined, '4', 'Bonus', '1'].map((value, index) =>
      chapter(`c${index}`, value)
    )

    const once = ids(sortChaptersAscending(list))
    const reversed = ids(sortChaptersAscending([...list].reverse()))

    expect(reversed).toEqual(once)
  })

  it('orders several groups uploading the same chapter by volume, then publish date, then id', () => {
    const sorted = sortChaptersAscending([
      chapter('late', '5', { publishAt: '2026-03-01T00:00:00+00:00' }),
      chapter('early', '5', { publishAt: '2026-02-01T00:00:00+00:00' }),
      chapter('volume-two', '5', { volume: '2', publishAt: '2026-01-01T00:00:00+00:00' }),
      chapter('volume-one', '5', { volume: '1', publishAt: '2026-04-01T00:00:00+00:00' })
    ])

    // No volume sorts before volume 1, then 1, then 2; the two without one are told apart by date
    expect(ids(sorted)).toEqual(['early', 'late', 'volume-one', 'volume-two'])
  })

  it('breaks a complete tie by id, so the result does not depend on the input order', () => {
    const a = chapter('a', '1')
    const b = chapter('b', '1')

    expect(ids(sortChaptersAscending([b, a]))).toEqual(['a', 'b'])
    expect(ids(sortChaptersAscending([a, b]))).toEqual(['a', 'b'])
  })

  it('treats an unreadable publish date as the oldest', () => {
    const sorted = sortChaptersAscending([
      chapter('dated', '1', { publishAt: '2026-01-01T00:00:00+00:00' }),
      chapter('broken', '1', { publishAt: 'not a date' })
    ])

    expect(ids(sorted)).toEqual(['broken', 'dated'])
  })

  it('keeps a chapter that appears twice once', () => {
    const sorted = sortChaptersAscending([chapter('a', '1'), chapter('b', '2'), chapter('a', '1')])

    expect(ids(sorted)).toEqual(['a', 'b'])
  })

  it('returns a new array and leaves the input alone', () => {
    const input = [chapter('b', '2'), chapter('a', '1')]

    const sorted = sortChaptersAscending(input)

    expect(sorted).not.toBe(input)
    expect(ids(input)).toEqual(['b', 'a'])
  })

  it('handles an empty list and a large one', () => {
    expect(sortChaptersAscending([])).toEqual([])

    const large = Array.from({ length: 5000 }, (_, index) =>
      chapter(`c${index}`, String(5000 - index))
    )
    const sorted = sortChaptersAscending(large)

    expect(sorted[0].chapter).toBe('1')
    expect(sorted.at(-1)?.chapter).toBe('5000')
  })
})

describe('compareChaptersAscending', () => {
  it('is consistent in both directions', () => {
    const lower = chapter('a', '1')
    const higher = chapter('b', '2')

    expect(compareChaptersAscending(lower, higher)).toBeLessThan(0)
    expect(compareChaptersAscending(higher, lower)).toBeGreaterThan(0)
    expect(compareChaptersAscending(lower, lower)).toBe(0)
  })
})

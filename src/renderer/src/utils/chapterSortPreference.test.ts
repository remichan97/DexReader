import {
  DEFAULT_CHAPTER_SORT,
  getChapterSortPreference,
  setChapterSortPreference
} from './chapterSortPreference'

const KEY = 'dexreader:mangaDetail:chapterSort'

beforeEach(() => {
  globalThis.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const stored = (): Record<string, string> =>
  JSON.parse(globalThis.localStorage.getItem(KEY) ?? '{}') as Record<string, string>

describe('getChapterSortPreference', () => {
  it('is newest first when nothing was chosen', () => {
    expect(DEFAULT_CHAPTER_SORT).toBe('desc')
    expect(getChapterSortPreference('manga-1')).toBe('desc')
  })

  it('returns what was chosen for that manga', () => {
    setChapterSortPreference('manga-1', 'asc')

    expect(getChapterSortPreference('manga-1')).toBe('asc')
  })

  it('keeps one manga from affecting another', () => {
    setChapterSortPreference('manga-1', 'asc')

    expect(getChapterSortPreference('manga-2')).toBe('desc')
  })

  it.each([
    ['not JSON', '{oops'],
    ['an array', '["asc"]'],
    ['null', 'null'],
    ['a string', '"asc"'],
    ['a number', '42']
  ])('falls back to the default when the stored value is %s', (_label, value) => {
    globalThis.localStorage.setItem(KEY, value)

    expect(getChapterSortPreference('manga-1')).toBe('desc')
  })

  it('ignores an entry with a value it does not know, but keeps the valid ones', () => {
    globalThis.localStorage.setItem(KEY, JSON.stringify({ a: 'sideways', b: 'asc', c: 7 }))

    expect(getChapterSortPreference('a')).toBe('desc')
    expect(getChapterSortPreference('b')).toBe('asc')
    expect(getChapterSortPreference('c')).toBe('desc')
  })

  it('falls back to the default when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(getChapterSortPreference('manga-1')).toBe('desc')
  })
})

describe('setChapterSortPreference', () => {
  it('stores only what differs from the default', () => {
    setChapterSortPreference('manga-1', 'desc')

    expect(globalThis.localStorage.getItem(KEY)).toBe('{}')
  })

  it('forgets the entry when a manga goes back to the default', () => {
    setChapterSortPreference('manga-1', 'asc')
    setChapterSortPreference('manga-2', 'asc')

    setChapterSortPreference('manga-1', 'desc')

    expect(stored()).toEqual({ 'manga-2': 'asc' })
  })

  it('keeps only the most recent 300 manga', () => {
    for (let index = 0; index < 305; index++) {
      setChapterSortPreference(`manga-${index}`, 'asc')
    }

    const map = stored()
    expect(Object.keys(map)).toHaveLength(300)
    expect(map['manga-0']).toBeUndefined()
    expect(map['manga-4']).toBeUndefined()
    expect(map['manga-5']).toBe('asc')
    expect(map['manga-304']).toBe('asc')
  })

  it('counts a changed entry as recent, so it outlives older ones', () => {
    for (let index = 0; index < 300; index++) {
      setChapterSortPreference(`manga-${index}`, 'asc')
    }

    // manga-0 is the oldest; touching it makes manga-1 the oldest instead
    setChapterSortPreference('manga-0', 'asc')
    setChapterSortPreference('manga-new', 'asc')

    const map = stored()
    expect(map['manga-0']).toBe('asc')
    expect(map['manga-1']).toBeUndefined()
  })

  it('replaces an unreadable stored value instead of failing', () => {
    globalThis.localStorage.setItem(KEY, '{oops')

    setChapterSortPreference('manga-1', 'asc')

    expect(stored()).toEqual({ 'manga-1': 'asc' })
  })

  it('does not throw when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(() => setChapterSortPreference('manga-1', 'asc')).not.toThrow()
  })
})

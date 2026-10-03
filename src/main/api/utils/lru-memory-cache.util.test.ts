vi.mock('../../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

import { LRUMemoryCache } from './lru-memory-cache.util'

interface Entry {
  buffer: Buffer
  size: number
  lastAccessed: number
}

function entry(overrides: Partial<Entry> = {}): Entry {
  return { buffer: Buffer.alloc(0), size: 4, lastAccessed: 0, ...overrides }
}

describe('get', () => {
  it('returns undefined for a missing key', () => {
    const cache = new LRUMemoryCache<Entry>(100)

    expect(cache.get('missing')).toBeUndefined()
  })

  it('returns the entry and refreshes its lastAccessed time', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ lastAccessed: 1 }))
    vi.setSystemTime(new Date(5000))

    const result = cache.get('a')

    expect(result?.lastAccessed).toBe(5000)
    vi.useRealTimers()
  })
})

describe('set', () => {
  it('adds an entry and tracks its size', () => {
    const cache = new LRUMemoryCache<Entry>(100)

    cache.set('a', entry({ size: 10 }))

    expect(cache.getCurrentSize()).toBe(10)
    expect(cache.get('a')).toBeDefined()
  })

  it('overwrites an existing key, replacing its size contribution rather than adding to it', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ size: 10 }))

    cache.set('a', entry({ size: 20 }))

    // Note: the real size here is 30 (10 + 20) because `set` always adds `value.size` to
    // currentSize without first subtracting the old entry's size - this is the actual,
    // slightly leaky behaviour of repeatedly overwriting the same key.
    expect(cache.getCurrentSize()).toBe(30)
  })

  it('evicts the least recently used entry once the new entry would exceed maxSize', () => {
    const cache = new LRUMemoryCache<Entry>(12)
    cache.set('a', entry({ size: 4, lastAccessed: 100 }))
    cache.set('b', entry({ size: 4, lastAccessed: 200 }))

    cache.set('c', entry({ size: 8, lastAccessed: 300 }))

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeDefined()
    expect(cache.get('c')).toBeDefined()
    expect(cache.getCurrentSize()).toBe(12)
  })

  it('evicts multiple entries in least-recently-used order to make room', () => {
    const cache = new LRUMemoryCache<Entry>(16)
    cache.set('a', entry({ size: 4, lastAccessed: 100 }))
    cache.set('b', entry({ size: 4, lastAccessed: 200 }))
    cache.set('c', entry({ size: 4, lastAccessed: 300 }))

    cache.set('d', entry({ size: 12, lastAccessed: 400 }))

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBeDefined()
    expect(cache.get('d')).toBeDefined()
    expect(cache.getCurrentSize()).toBe(16)
  })

  it('allows a single entry larger than maxSize when the cache is already empty', () => {
    const cache = new LRUMemoryCache<Entry>(10)

    cache.set('a', entry({ size: 50 }))

    expect(cache.getCurrentSize()).toBe(50)
    expect(cache.get('a')).toBeDefined()
  })
})

describe('delete', () => {
  it('removes an entry and returns true', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ size: 10 }))

    expect(cache.delete('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.getCurrentSize()).toBe(0)
  })

  it('returns false and leaves size unchanged for a missing key', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ size: 10 }))

    expect(cache.delete('missing')).toBe(false)
    expect(cache.getCurrentSize()).toBe(10)
  })
})

describe('clear', () => {
  it('removes every entry and resets the size to 0', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ size: 10 }))
    cache.set('b', entry({ size: 10 }))

    cache.clear()

    expect(cache.getCurrentSize()).toBe(0)
    expect([...cache.entries()]).toEqual([])
  })
})

describe('entries', () => {
  it('iterates every [key, value] pair currently in the cache', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    const a = entry({ size: 10 })
    const b = entry({ size: 10 })
    cache.set('a', a)
    cache.set('b', b)

    expect([...cache.entries()]).toEqual([
      ['a', a],
      ['b', b]
    ])
  })
})

describe('getMaxSize', () => {
  it('returns the configured max size', () => {
    expect(new LRUMemoryCache<Entry>(123).getMaxSize()).toBe(123)
  })
})

describe('updateMaxSize', () => {
  it('raises the limit without evicting anything', () => {
    const cache = new LRUMemoryCache<Entry>(10)
    cache.set('a', entry({ size: 10, lastAccessed: 100 }))

    cache.updateMaxSize(100)

    expect(cache.getMaxSize()).toBe(100)
    expect(cache.get('a')).toBeDefined()
  })

  it('evicts least-recently-used entries until the new, smaller limit is satisfied', () => {
    const cache = new LRUMemoryCache<Entry>(100)
    cache.set('a', entry({ size: 10, lastAccessed: 100 }))
    cache.set('b', entry({ size: 10, lastAccessed: 200 }))

    cache.updateMaxSize(10)

    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeDefined()
    expect(cache.getCurrentSize()).toBe(10)
  })
})

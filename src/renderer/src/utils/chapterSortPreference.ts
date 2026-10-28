import type { ChapterDirection } from './chapterFeedLoader'

/**
 * Which way a manga's chapter list is sorted, remembered per manga on this device.
 *
 * This is a view preference, so it lives in localStorage rather than in settings: nothing to
 * migrate, and it is not part of backups. The default (newest first) is never stored; only the
 * series the user flipped are, and only the most recent ones, so the map cannot grow without
 * bound.
 */

export const DEFAULT_CHAPTER_SORT: ChapterDirection = 'desc'

const STORAGE_KEY = 'dexreader:mangaDetail:chapterSort'
const MAX_REMEMBERED_MANGA = 300

type SortMap = Record<string, ChapterDirection>

function isDirection(value: unknown): value is ChapterDirection {
  return value === 'asc' || value === 'desc'
}

/** The stored map, or an empty one when there is none, it is unreadable or storage is blocked */
function readMap(): SortMap {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}

    const map: SortMap = {}
    for (const [mangaId, direction] of Object.entries(parsed)) {
      if (isDirection(direction)) map[mangaId] = direction
    }
    return map
  } catch {
    return {}
  }
}

function writeMap(map: SortMap): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Storage can be full or unavailable; the preference just isn't remembered
  }
}

export function getChapterSortPreference(mangaId: string): ChapterDirection {
  return readMap()[mangaId] ?? DEFAULT_CHAPTER_SORT
}

export function setChapterSortPreference(mangaId: string, order: ChapterDirection): void {
  const map = readMap()

  // Re-adding moves the entry to the end, which is what "most recent" means below
  delete map[mangaId]
  if (order !== DEFAULT_CHAPTER_SORT) {
    map[mangaId] = order
  }

  const entries = Object.entries(map)
  const kept = entries.slice(Math.max(0, entries.length - MAX_REMEMBERED_MANGA))

  writeMap(Object.fromEntries(kept))
}

import type { ChapterContract } from '../../../preload/window.types'

/**
 * The one definition of "reading order" for a manga's chapters.
 *
 * The chapter list kept in state is always ascending by this order: the Reader's previous/next
 * step through it by index, Start Reading takes its first entry and Download all queues it as is.
 * Only what the chapter list *shows* is ever reversed.
 */

type OrderedChapter = Pick<ChapterContract, 'id' | 'chapter' | 'volume' | 'publishAt'>

const NUMBER_PREFIX = /^\s*(\d+(?:\.\d+)?)/

/**
 * A chapter or volume number as a number, or undefined when it has none.
 *
 * "10.5" is 10.5 and "5a" is 5 (an extra with a suffix sits at its number). Anything that does
 * not start with a number ("Extra", "", missing) has none, which is what one-shots and
 * prologues look like.
 */
export function parseChapterNumber(value: string | undefined): number | undefined {
  const match = value === undefined ? null : NUMBER_PREFIX.exec(value)
  return match ? Number.parseFloat(match[1]) : undefined
}

function compareNumbers(a: number | undefined, b: number | undefined): number {
  if (a === b) return 0
  // No number sorts first: a one-shot or prologue comes before chapter 1
  if (a === undefined) return -1
  if (b === undefined) return 1
  return a - b
}

function publishTime(chapter: OrderedChapter): number {
  const time = Date.parse(chapter.publishAt)
  return Number.isNaN(time) ? 0 : time
}

/**
 * Orders chapters oldest first by chapter number. Several scanlation groups often upload the same
 * chapter, so equal numbers are common; they are ordered by volume, then publish date, then id,
 * which makes the order deterministic.
 */
export function compareChaptersAscending(a: OrderedChapter, b: OrderedChapter): number {
  return (
    compareNumbers(parseChapterNumber(a.chapter), parseChapterNumber(b.chapter)) ||
    compareNumbers(parseChapterNumber(a.volume), parseChapterNumber(b.volume)) ||
    publishTime(a) - publishTime(b) ||
    a.id.localeCompare(b.id)
  )
}

/**
 * A new list in reading order, with a chapter that appears twice (same id) kept once. Paged
 * feeds can repeat a chapter when one is uploaded between two requests.
 */
export function sortChaptersAscending<T extends OrderedChapter>(chapters: readonly T[]): T[] {
  const unique = new Map<string, T>()
  for (const chapter of chapters) {
    if (!unique.has(chapter.id)) unique.set(chapter.id, chapter)
  }

  return Array.from(unique.values()).sort(compareChaptersAscending)
}

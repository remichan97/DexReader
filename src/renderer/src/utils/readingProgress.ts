interface SavedChapterProgress {
  readonly currentPage: number
  readonly completed: boolean
}

/**
 * Page (0-based) to reopen a chapter on, or undefined to start from the beginning.
 *
 * Resumes where the reader left off, except when the chapter was finished: reopening a
 * completed chapter means reading it again, so it starts from the first page rather than
 * dropping the reader on the last one.
 */
export function getResumePage(progress: SavedChapterProgress | undefined): number | undefined {
  if (!progress || progress.completed || progress.currentPage <= 0) {
    return undefined
  }
  return progress.currentPage
}

/**
 * Looks up a chapter's saved progress and returns the page to reopen it on (see
 * getResumePage). For entry points that only know the manga and chapter ids - History,
 * Downloads - rather than already holding the progress. Resuming is best effort: if the
 * lookup fails the chapter simply opens from the beginning, it never blocks opening it.
 */
export async function loadResumePage(
  mangaId: string,
  chapterId: string
): Promise<number | undefined> {
  try {
    const response = await globalThis.progress.getAllChapterProgress(mangaId)
    if (!response.success || !response.data) {
      return undefined
    }
    return getResumePage(response.data.find((entry) => entry.chapterId === chapterId))
  } catch {
    return undefined
  }
}

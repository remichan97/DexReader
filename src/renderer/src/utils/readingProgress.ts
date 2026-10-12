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

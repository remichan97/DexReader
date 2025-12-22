import React from 'react'
import { Button } from '@renderer/components/Button'
import type { ChapterEntity } from '../ReaderView'

/**
 * End of Chapter Overlay Component
 * Shows navigation options at the end of chapter
 */
interface EndOfChapterOverlayProps {
  readonly chapterTitle: string
  readonly chapterNumber: string | null
  readonly previousChapter: ChapterEntity | null
  readonly nextChapter: ChapterEntity | null
  readonly onPreviousChapter: () => void
  readonly onNextChapter: () => void
  readonly onBackToDetail: () => void
}

export function EndOfChapterOverlay({
  chapterTitle,
  chapterNumber,
  previousChapter,
  nextChapter,
  onPreviousChapter,
  onNextChapter,
  onBackToDetail
}: EndOfChapterOverlayProps): React.JSX.Element {
  return (
    <div className="end-of-chapter-overlay">
      <div className="end-of-chapter-overlay__content">
        <h2 className="end-of-chapter-overlay__title">End of Chapter {chapterNumber}</h2>
        <p className="end-of-chapter-overlay__subtitle">{chapterTitle}</p>

        <div className="end-of-chapter-overlay__actions">
          {previousChapter && (
            <Button variant="secondary" size="large" onClick={onPreviousChapter}>
              <span>← Previous Chapter</span>
              <span className="end-of-chapter-overlay__chapter-info">
                Ch. {previousChapter.attributes.chapter}
                {previousChapter.attributes.title && `: ${previousChapter.attributes.title}`}
              </span>
            </Button>
          )}

          {nextChapter && (
            <Button variant="primary" size="large" onClick={onNextChapter}>
              <span>Next Chapter →</span>
              <span className="end-of-chapter-overlay__chapter-info">
                Ch. {nextChapter.attributes.chapter}
                {nextChapter.attributes.title && `: ${nextChapter.attributes.title}`}
              </span>
            </Button>
          )}

          {!nextChapter && !previousChapter && (
            <p className="end-of-chapter-overlay__no-chapters">No more chapters available</p>
          )}
        </div>

        <Button variant="ghost" onClick={onBackToDetail} className="end-of-chapter-overlay__back">
          Back to Manga Details
        </Button>
      </div>
    </div>
  )
}

import React from 'react'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import type { ChapterEntity } from './ChapterListSidebar'

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
  const { t } = useTranslation(['reader'])

  return (
    <div className="end-of-chapter-overlay flex justify-center items-end">
      <div className="end-of-chapter-overlay__content">
        <h2 className="end-of-chapter-overlay__title">
          {t('reader:endOfChapter.title', { number: chapterNumber })}
        </h2>
        <p className="end-of-chapter-overlay__subtitle">
          {t('reader:endOfChapter.subtitle', { title: chapterTitle })}
        </p>

        <div className="end-of-chapter-overlay__actions flex flex-col gap-3">
          {previousChapter && (
            <Button
              variant="secondary"
              size="large"
              onClick={onPreviousChapter}
              className="flex flex-col items-center gap-1"
            >
              <span>{t('reader:endOfChapter.previousChapter')}</span>
              <span className="end-of-chapter-overlay__chapter-info">
                {t('reader:endOfChapter.chapterInfo', {
                  number: previousChapter.chapter,
                  title: previousChapter.title || ''
                })}
              </span>
            </Button>
          )}

          {nextChapter && (
            <Button
              variant="primary"
              size="large"
              onClick={onNextChapter}
              className="flex flex-col items-center gap-1"
            >
              <span>{t('reader:endOfChapter.nextChapter')}</span>
              <span className="end-of-chapter-overlay__chapter-info">
                {t('reader:endOfChapter.chapterInfo', {
                  number: nextChapter.chapter,
                  title: nextChapter.title || ''
                })}
              </span>
            </Button>
          )}

          {!nextChapter && !previousChapter && (
            <p className="end-of-chapter-overlay__no-chapters">
              {t('reader:endOfChapter.noMoreChapters')}
            </p>
          )}
          <Button variant="ghost" onClick={onBackToDetail} className="end-of-chapter-overlay__back">
            {t('reader:endOfChapter.backToDetail')}
          </Button>
        </div>
      </div>
    </div>
  )
}

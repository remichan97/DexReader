import { type JSX } from 'react'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'
import { useTranslation } from '@renderer/hooks/useTranslation'

/**
 * Chapter Entity type from MangaDex feed response
 */
export type ChapterEntity = Awaited<ReturnType<Window['mangadex']['getMangaFeed']>>['data'][number]

/**
 * Chapter List Sidebar Component Props
 */
export interface ChapterListSidebarProps {
  readonly chapters: ChapterEntity[]
  readonly currentChapterId: string
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onChapterClick: (chapterId: string) => void
}

/**
 * Chapter List Sidebar Component
 * Displays a sidebar with the list of chapters for navigation
 */
export function ChapterListSidebar({
  chapters,
  currentChapterId,
  isOpen,
  onClose,
  onChapterClick
}: ChapterListSidebarProps): JSX.Element {
  const { t } = useTranslation(['reader', 'common'])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="chapter-list-overlay"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose()
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={t('reader:header.closeChapterList')}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`chapter-list-sidebar flex flex-col ${isOpen ? 'chapter-list-sidebar--open' : ''}`}
      >
        <header className="chapter-list-sidebar__header flex items-center justify-between">
          <h2>{t('reader:header.chaptersButton')}</h2>
          <Button onClick={onClose} size="small">
            {t('common:button.close')}
          </Button>
        </header>

        <div className="chapter-list-sidebar__content">
          {chapters.length === 0 ? (
            <EmptyState message={t('reader:chapterList.noChapters')} />
          ) : (
            <ul className="chapter-list-sidebar__list">
              {chapters.map((chapter) => {
                const chapterNumber = chapter.attributes.chapter || 'N/A'
                const chapterTitle = chapter.attributes.title
                const ariaLabel = chapterTitle
                  ? t('reader:chapterList.chapterWithTitle', {
                      number: chapterNumber,
                      title: chapterTitle
                    })
                  : t('reader:chapterList.chapter', { number: chapterNumber })

                return (
                  <li
                    key={chapter.id}
                    className={`chapter-list-sidebar__item ${
                      chapter.id === currentChapterId ? 'chapter-list-sidebar__item--active' : ''
                    }`}
                    onClick={() => onChapterClick(chapter.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onChapterClick(chapter.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={ariaLabel}
                    aria-current={chapter.id === currentChapterId ? 'true' : undefined}
                  >
                    <div className="chapter-list-sidebar__item-number">
                      {t('reader:chapterList.chapterShort')} {chapterNumber}
                      {chapter.attributes.volume &&
                        ` ${t('reader:chapterList.volumeShort')} ${chapter.attributes.volume}`}
                    </div>
                    {chapterTitle && (
                      <div className="chapter-list-sidebar__item-title">{chapterTitle}</div>
                    )}
                    <div className="chapter-list-sidebar__item-meta">
                      {t('reader:chapterList.pages', { count: chapter.attributes.pages })}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}

import { type JSX } from 'react'
import { Button } from '@renderer/components/Button'
import { EmptyState } from '@renderer/components/EmptyState'

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
          aria-label="Close chapter list"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`chapter-list-sidebar flex flex-col ${isOpen ? 'chapter-list-sidebar--open' : ''}`}
      >
        <header className="chapter-list-sidebar__header flex items-center justify-between">
          <h2>Chapters</h2>
          <Button onClick={onClose} size="small">
            Close
          </Button>
        </header>

        <div className="chapter-list-sidebar__content">
          {chapters.length === 0 ? (
            <EmptyState message="No chapters available" />
          ) : (
            <ul className="chapter-list-sidebar__list">
              {chapters.map((chapter) => {
                const chapterNumber = chapter.attributes.chapter || 'N/A'
                const chapterTitle = chapter.attributes.title
                const ariaLabel = chapterTitle
                  ? `Chapter ${chapterNumber}: ${chapterTitle}`
                  : `Chapter ${chapterNumber}`

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
                      Ch. {chapterNumber}
                      {chapter.attributes.volume && ` Vol. ${chapter.attributes.volume}`}
                    </div>
                    {chapterTitle && (
                      <div className="chapter-list-sidebar__item-title">{chapterTitle}</div>
                    )}
                    <div className="chapter-list-sidebar__item-meta">
                      {chapter.attributes.pages} pages
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

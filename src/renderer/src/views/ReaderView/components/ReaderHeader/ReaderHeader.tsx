import React, { type JSX } from 'react'
import { Button } from '@renderer/components/Button'
import {
  StreamSourceIndicator,
  type StreamSource
} from '@renderer/components/StreamSourceIndicator'
import { type ReadingMode } from '@renderer/components/ReadingModeSelector'
import { ArrowLeftRegular, BookRegular, EyeOff20Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'

/**
 * Reader Header Component Props
 */
export interface ReaderHeaderProps {
  readonly chapterTitle: string
  readonly currentPage: number
  readonly totalPages: number
  readonly onBackClick: () => void
  readonly onToggleChapterList: () => void
  readonly showChapterList: boolean
  // Incognito mode
  readonly isIncognito: boolean
  // Reader settings
  readonly settingsPopover: React.ReactNode
  // Zoom controls popover
  readonly zoomControlsPopover: React.ReactNode
  // Reading mode info for page counter
  readonly readingMode: ReadingMode
  readonly currentPagePair?: [number] | [number, number]
  readonly readRightToLeft?: boolean
  // Stream source indicator
  readonly streamSource: StreamSource
}

/**
 * Reader Header Component
 * Displays chapter information, navigation controls, and reading settings
 */
export function ReaderHeader({
  chapterTitle,
  currentPage,
  totalPages,
  onBackClick,
  onToggleChapterList,
  showChapterList,
  isIncognito,
  settingsPopover,
  zoomControlsPopover,
  readingMode,
  currentPagePair,
  readRightToLeft,
  streamSource
}: ReaderHeaderProps): JSX.Element {
  const { t } = useTranslation(['reader', 'common'])

  return (
    <header className="reader-header flex items-center justify-between">
      <div className="reader-header__left flex items-center">
        <Button variant="ghost" onClick={onBackClick} icon={<ArrowLeftRegular />} size="medium">
          {t('common:button.back')}
        </Button>
      </div>

      <h1 className="reader-header__title flex items-center justify-center">
        <StreamSourceIndicator source={streamSource} />
        {chapterTitle}
      </h1>

      <div className="reader-header__right flex items-center gap-3 justify-end">
        {/* Incognito mode indicator */}
        {isIncognito && (
          <div
            className="reader-header__incognito-badge flex items-center gap-1-5"
            title={t('reader:header.incognitoTooltip')}
          >
            <EyeOff20Regular />
            <span>{t('reader:header.incognitoBadge')}</span>
          </div>
        )}
        {/* Reader settings popover */}
        {settingsPopover}
        {/* Zoom controls popover */}
        {zoomControlsPopover}

        <div className="reader-header__page-counter flex items-center gap-1">
          {readingMode === 'double' && currentPagePair && currentPagePair.length === 2
            ? readRightToLeft
              ? t('reader:header.pageCounter.doubleRtl', {
                  right: currentPagePair[1] + 1,
                  left: currentPagePair[0] + 1,
                  total: totalPages
                })
              : t('reader:header.pageCounter.double', {
                  left: currentPagePair[0] + 1,
                  right: currentPagePair[1] + 1,
                  total: totalPages
                })
            : t('reader:header.pageCounter.single', {
                current: currentPage + 1,
                total: totalPages
              })}
        </div>
        <Button
          variant="ghost"
          onClick={onToggleChapterList}
          icon={<BookRegular />}
          size="medium"
          aria-label={
            showChapterList
              ? t('reader:header.closeChapterList')
              : t('reader:header.openChapterList')
          }
        >
          {t('reader:header.chaptersButton')}
        </Button>
      </div>
    </header>
  )
}

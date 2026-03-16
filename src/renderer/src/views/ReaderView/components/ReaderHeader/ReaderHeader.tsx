import React, { type JSX } from 'react'
import { Button } from '@renderer/components/Button'
import {
  StreamSourceIndicator,
  type StreamSource
} from '@renderer/components/StreamSourceIndicator'
import { ArrowLeftRegular, BookRegular, EyeOff20Regular } from '@fluentui/react-icons'

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
  readonly readingMode: 'single' | 'double' | 'vertical'
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
  return (
    <header className="reader-header">
      <div className="reader-header__left">
        <Button variant="ghost" onClick={onBackClick} icon={<ArrowLeftRegular />} size="medium">
          Back
        </Button>
      </div>

      <h1 className="reader-header__title">
        <StreamSourceIndicator source={streamSource} />
        {chapterTitle}
      </h1>

      <div className="reader-header__right">
        {/* Incognito mode indicator */}
        {isIncognito && (
          <div
            className="reader-header__incognito-badge"
            title="Progress tracking is disabled. Go to Settings or File menu to enable."
          >
            <EyeOff20Regular />
            <span>Incognito</span>
          </div>
        )}
        {/* Reader settings popover */}
        {settingsPopover}
        {/* Zoom controls popover */}
        {zoomControlsPopover}

        <div className="reader-header__page-counter">
          {readingMode === 'double' && currentPagePair && currentPagePair.length === 2
            ? readRightToLeft
              ? `Page ${currentPagePair[1] + 1}-${currentPagePair[0] + 1}/${totalPages}`
              : `Page ${currentPagePair[0] + 1}-${currentPagePair[1] + 1}/${totalPages}`
            : `${currentPage + 1}/${totalPages}`}
        </div>
        <Button
          variant="ghost"
          onClick={onToggleChapterList}
          icon={<BookRegular />}
          size="medium"
          aria-label={showChapterList ? 'Close chapter list' : 'Open chapter list'}
        >
          Chapters
        </Button>
      </div>
    </header>
  )
}

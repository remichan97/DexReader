import type { JSX } from 'react'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { ArrowDownload20Regular } from '@fluentui/react-icons'
import { getLanguageName } from '@renderer/constants/language-list.constant'

interface ChapterListHeaderProps {
  readonly chapterCount: number
  readonly availableLanguages: string[]
  readonly selectedLanguage: string
  readonly sortOrder: 'asc' | 'desc'
  readonly onLanguageChange: (lang: string) => void
  readonly onSortChange: (order: 'asc' | 'desc') => void
  readonly onDownloadAllClick?: () => void
  readonly downloadAllEnabled?: boolean
}

/**
 * Header section for ChapterList with filters and download all button
 */
export function ChapterListHeader({
  chapterCount,
  availableLanguages,
  selectedLanguage,
  sortOrder,
  onLanguageChange,
  onSortChange,
  onDownloadAllClick,
  downloadAllEnabled = true
}: ChapterListHeaderProps): JSX.Element {
  return (
    <div className="chapter-list-header flex justify-between items-center">
      <h2 className="section-title">Chapters ({chapterCount})</h2>

      <div className="chapter-controls flex gap-2">
        {/* Download All button */}
        {chapterCount > 0 && onDownloadAllClick && (
          <Button
            variant="secondary"
            size="small"
            onClick={onDownloadAllClick}
            disabled={!downloadAllEnabled}
            aria-label={`Download all ${chapterCount} chapters`}
          >
            <ArrowDownload20Regular />
            Download All
          </Button>
        )}

        {/* Language filter */}
        {availableLanguages.length > 1 && (
          <Select
            value={selectedLanguage}
            onChange={(val) => onLanguageChange(val as string)}
            options={availableLanguages.map((lang) => ({
              value: lang,
              label: `${getLanguageName(lang)} (${lang.toUpperCase()})`
            }))}
            aria-label="Select chapter language"
          />
        )}

        {/* Sort order */}
        <Select
          value={sortOrder}
          onChange={(val) => onSortChange(val as 'asc' | 'desc')}
          options={[
            { value: 'asc', label: 'Oldest First' },
            { value: 'desc', label: 'Newest First' }
          ]}
          aria-label="Sort chapters"
        />
      </div>
    </div>
  )
}

import type { JSX } from 'react'
import { Button } from '@renderer/components/Button'
import { Select } from '@renderer/components/Select'
import { ArrowDownload20Regular } from '@fluentui/react-icons'
import { getLanguageName } from '@renderer/constants/language-list.constant'
import { LanguageFlag } from '@renderer/components/LanguageBadge'
import { useTranslation } from '@renderer/hooks/useTranslation'

interface ChapterListHeaderProps {
  readonly chapterCount: number
  readonly availableLanguages: string[]
  readonly selectedLanguage: string
  readonly sortOrder: 'asc' | 'desc'
  readonly onLanguageChange: (lang: string) => void
  readonly onSortChange: (order: 'asc' | 'desc') => void
  readonly onDownloadAllClick?: () => void
  readonly downloadAllEnabled?: boolean
  /** True while the rest of a long series is loading: Download all would queue a partial list */
  readonly downloadAllWaitingForChapters?: boolean
  /** The series' full chapter count, given only while it is still loading ("500 of 1,240") */
  readonly totalChapters?: number
  readonly isOnline?: boolean
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
  downloadAllEnabled = true,
  downloadAllWaitingForChapters = false,
  totalChapters,
  isOnline = true
}: ChapterListHeaderProps): JSX.Element {
  const { t } = useTranslation(['mangaDetail', 'common'])

  const getDownloadButtonTitle = (): string => {
    if (!isOnline) {
      return t('common:message.info.youAreOffline')
    }
    if (downloadAllWaitingForChapters) {
      return t('mangaDetail:chapters.downloadAllLoading', {
        defaultValue: 'Download all is available once every chapter has loaded'
      })
    }
    if (!downloadAllEnabled) {
      return t('mangaDetail:chapters.downloadAllUnavailable', {
        defaultValue: 'Download all is not available'
      })
    }
    return t('mangaDetail:chapters.downloadAllTooltip', {
      defaultValue: 'Download all {{count}} chapters',
      count: chapterCount
    })
  }

  return (
    <div className="chapter-list-header flex justify-between items-center">
      <h2 className="section-title">
        {totalChapters === undefined
          ? t('mangaDetail:chapters.title', {
              defaultValue: 'Chapters ({{count}})',
              count: chapterCount
            })
          : t('mangaDetail:chapters.titlePartial', {
              defaultValue: 'Chapters ({{loaded}} of {{total}})',
              loaded: chapterCount,
              total: totalChapters
            })}
      </h2>

      <div className="chapter-controls flex gap-2">
        {/* Download All button */}
        {chapterCount > 0 && onDownloadAllClick && (
          <Button
            variant="secondary"
            size="medium"
            onClick={onDownloadAllClick}
            disabled={!downloadAllEnabled || !isOnline || downloadAllWaitingForChapters}
            aria-label={getDownloadButtonTitle()}
            title={getDownloadButtonTitle()}
            icon={<ArrowDownload20Regular />}
          >
            {t('mangaDetail:chapters.downloadAll', { defaultValue: 'Download All' })}
          </Button>
        )}

        {/* Language filter */}
        {availableLanguages.length > 1 && (
          <Select
            value={selectedLanguage}
            onChange={(val) => onLanguageChange(val as string)}
            options={availableLanguages.map((lang) => ({
              value: lang,
              label: `${getLanguageName(lang)} (${lang.toUpperCase()})`,
              icon: <LanguageFlag code={lang} />
            }))}
            aria-label={t('mangaDetail:chapters.selectLanguage', {
              defaultValue: 'Select chapter language'
            })}
          />
        )}

        {/* Sort order */}
        <Select
          value={sortOrder}
          onChange={(val) => onSortChange(val as 'asc' | 'desc')}
          options={[
            {
              value: 'asc',
              label: t('mangaDetail:chapters.sort.oldestFirst', { defaultValue: 'Oldest First' })
            },
            {
              value: 'desc',
              label: t('mangaDetail:chapters.sort.newestFirst', { defaultValue: 'Newest First' })
            }
          ]}
          aria-label={t('mangaDetail:chapters.sortChapters', { defaultValue: 'Sort chapters' })}
        />
      </div>
    </div>
  )
}

import { Modal } from '../Modal'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import {
  CheckmarkCircle48Regular,
  Warning48Regular,
  ErrorCircle48Regular,
  Dismiss24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular
} from '@fluentui/react-icons'
import { useState } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ImportResultDialog.css'

// ImportResult interface matches src/main/services/results/import.result.ts
export interface ImportResult {
  importedMangaCount: number
  skippedMangaCount: number
  failedMangaCount: number
  errors?: Array<{
    mangaId?: string
    title?: string
    reason: string
  }>
  importedMangaIds?: string[]
  /** MangaDex titles from other-language sources that were left out and can be added back */
  skippedOtherLanguage?: Array<{ mangaId: string; title: string }>
  /** Entries from other (non-MangaDex) sources, which can't be imported */
  ignoredOtherSourceCount?: number
}

export interface ImportResultDialogProps {
  /**
   * Whether the dialog is open
   */
  readonly open: boolean

  /**
   * Import result data
   */
  readonly result: ImportResult | null

  /**
   * Called when dialog is closed
   */
  readonly onClose: () => void

  /**
   * Called when user wants to view imported manga in library
   */
  readonly onViewLibrary?: () => void

  /**
   * Called when the user adds the other-language titles they picked back to the library.
   * Without it, the skipped titles are not offered.
   */
  readonly onAddSkipped?: (mangaIds: string[]) => void

  /**
   * Whether adding the picked titles is in progress
   */
  readonly isAddingSkipped?: boolean
}

/**
 * Dialog showing results of Tachiyomi/Mihon import operation
 *
 * @example
 * ```tsx
 * <ImportResultDialog
 *   open={showResult}
 *   result={importResult}
 *   onClose={() => setShowResult(false)}
 *   onViewLibrary={() => navigate('/library')}
 * />
 * ```
 */
export function ImportResultDialog({
  open,
  result,
  onClose,
  onViewLibrary,
  onAddSkipped,
  isAddingSkipped = false
}: Readonly<ImportResultDialogProps>): React.JSX.Element {
  const { t } = useTranslation(['dialogs', 'common'])
  const [showErrors, setShowErrors] = useState(false)
  const [selectedSkipped, setSelectedSkipped] = useState<Set<string>>(new Set())

  if (!result) {
    return <></>
  }

  const { importedMangaCount, skippedMangaCount, failedMangaCount, errors } = result
  const total = importedMangaCount + skippedMangaCount + failedMangaCount
  const hasErrors = errors && errors.length > 0
  const skippedTitles = onAddSkipped ? (result.skippedOtherLanguage ?? []) : []
  // A title that has since been added drops out of the list, and so out of the selection
  const pickedIds = skippedTitles
    .filter((title) => selectedSkipped.has(title.mangaId))
    .map((title) => title.mangaId)
  const allSkippedPicked = skippedTitles.length > 0 && pickedIds.length === skippedTitles.length
  const ignoredCount = result.ignoredOtherSourceCount ?? 0

  const toggleSkipped = (mangaId: string, checked: boolean): void => {
    setSelectedSkipped((previous) => {
      const next = new Set(previous)
      if (checked) {
        next.add(mangaId)
      } else {
        next.delete(mangaId)
      }
      return next
    })
  }

  const toggleAllSkipped = (checked: boolean): void => {
    setSelectedSkipped(checked ? new Set(skippedTitles.map((title) => title.mangaId)) : new Set())
  }

  // Determine dialog status
  let status: 'success' | 'warning' | 'error' = 'success'
  let StatusIcon = CheckmarkCircle48Regular
  let statusText = t('dialogs:importResult.titles.success')

  if (failedMangaCount > 0) {
    status = 'error'
    StatusIcon = ErrorCircle48Regular
    statusText = t('dialogs:importResult.titles.error')
  } else if (skippedMangaCount > 0) {
    status = 'warning'
    StatusIcon = Warning48Regular
    statusText = t('dialogs:importResult.titles.warning')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={statusText}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} icon={<Dismiss24Regular />}>
            {t('common:button.close')}
          </Button>
          {onViewLibrary && importedMangaCount > 0 && (
            <Button variant="primary" onClick={onViewLibrary}>
              {t('common:button.viewLibrary')}
            </Button>
          )}
        </>
      }
    >
      <div className="import-result-dialog flex flex-col items-center gap-6">
        <div className={`import-result-dialog__header import-result-dialog__header--${status}`}>
          <StatusIcon className="import-result-dialog__icon flex justify-center items-center" />
        </div>

        <div className="import-result-dialog__stats flex gap-4 justify-center">
          <div className="import-result-dialog__stat import-result-dialog__stat--success flex flex-col items-center gap-1">
            <div className="import-result-dialog__stat-value">{importedMangaCount}</div>
            <div className="import-result-dialog__stat-label">
              {t('dialogs:importResult.stats.imported')}
            </div>
          </div>

          <div className="import-result-dialog__stat import-result-dialog__stat--warning flex flex-col items-center gap-1">
            <div className="import-result-dialog__stat-value">{skippedMangaCount}</div>
            <div className="import-result-dialog__stat-label">
              {t('dialogs:importResult.stats.skipped')}
            </div>
          </div>

          <div className="import-result-dialog__stat import-result-dialog__stat--error flex flex-col items-center gap-1">
            <div className="import-result-dialog__stat-value">{failedMangaCount}</div>
            <div className="import-result-dialog__stat-label">
              {t('dialogs:importResult.stats.failed')}
            </div>
          </div>
        </div>

        <div className="import-result-dialog__summary">
          <p>{t('dialogs:importResult.summary.main', { count: importedMangaCount, total })}</p>

          {skippedMangaCount > 0 && (
            <p className="import-result-dialog__note">
              {t('dialogs:importResult.summary.skipped', { count: skippedMangaCount })}
            </p>
          )}
        </div>

        {ignoredCount > 0 && (
          <p className="import-result-dialog__note">
            {t('dialogs:importResult.ignoredSources', { count: ignoredCount })}
          </p>
        )}

        {skippedTitles.length > 0 && (
          <div className="import-result-dialog__skipped">
            <div className="import-result-dialog__skipped-title">
              {t('dialogs:importResult.skippedLanguages.title', { count: skippedTitles.length })}
            </div>
            <p className="import-result-dialog__note">
              {t('dialogs:importResult.skippedLanguages.description')}
            </p>

            <Checkbox
              checked={allSkippedPicked}
              indeterminate={pickedIds.length > 0 && !allSkippedPicked}
              onChange={toggleAllSkipped}
              disabled={isAddingSkipped}
              label={t('dialogs:importResult.skippedLanguages.selectAll')}
            />

            <div className="import-result-dialog__skipped-list">
              {skippedTitles.map((title) => (
                <Checkbox
                  key={title.mangaId}
                  checked={selectedSkipped.has(title.mangaId)}
                  onChange={(checked) => toggleSkipped(title.mangaId, checked)}
                  disabled={isAddingSkipped}
                  label={title.title}
                />
              ))}
            </div>

            <Button
              variant="secondary"
              disabled={pickedIds.length === 0 || isAddingSkipped}
              onClick={() => onAddSkipped?.(pickedIds)}
            >
              {isAddingSkipped
                ? t('dialogs:importResult.skippedLanguages.adding')
                : t('dialogs:importResult.skippedLanguages.add', { count: pickedIds.length })}
            </Button>
          </div>
        )}

        {hasErrors && (
          <div className="import-result-dialog__errors">
            <button
              type="button"
              className="import-result-dialog__errors-toggle flex items-center justify-between"
              onClick={() => setShowErrors(!showErrors)}
            >
              <span>
                {showErrors ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
                {t('dialogs:importResult.errors.toggle', { count: errors.length })}
              </span>
            </button>

            {showErrors && (
              <div className="import-result-dialog__errors-list">
                {errors.map((error, index) => (
                  <div
                    key={`error-${error.mangaId || 'unknown'}-${index}`}
                    className="import-result-dialog__error-item"
                  >
                    <div className="import-result-dialog__error-title">
                      {error.title || t('dialogs:importResult.errors.unknownManga')}
                    </div>
                    <div className="import-result-dialog__error-message">{error.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

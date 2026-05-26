import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ChevronUp16Regular, ChevronDown16Regular } from '@fluentui/react-icons'
import './UnsavedChangesBanner.css'

interface UnsavedChangesBannerProps {
  readonly onSave: () => Promise<void>
  readonly onReset: () => void
  readonly disabled?: boolean
  readonly modifiedSettings: Set<string>
  readonly getSettingLabel: (key: string) => string
}

export function UnsavedChangesBanner({
  onSave,
  onReset,
  disabled = false,
  modifiedSettings,
  getSettingLabel
}: UnsavedChangesBannerProps): JSX.Element {
  const { t } = useTranslation(['settings', 'common'])
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const modifiedCount = modifiedSettings.size
  const modifiedList = Array.from(modifiedSettings)

  return (
    <div className="unsaved-changes-banner">
      <div className="unsaved-changes-banner__content">
        <div className="unsaved-changes-banner__info">
          <span className="unsaved-changes-banner__text">
            {disabled
              ? t('settings:unsavedChangesBanner.validationError', {
                  defaultValue: 'Some settings are invalid. Fix validation errors before saving.'
                })
              : t('settings:unsavedChangesBanner.message', {
                  defaultValue: 'You have unsaved changes'
                })}
          </span>
          {!disabled && modifiedCount > 0 && (
            <button
              className="unsaved-changes-banner__toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Hide modified settings' : 'Show modified settings'}
            >
              <span className="unsaved-changes-banner__count">
                {t('settings:unsavedChangesBanner.modifiedCount', {
                  count: modifiedCount,
                  defaultValue: '{{count}} modified'
                })}
              </span>
              {isExpanded ? <ChevronDown16Regular /> : <ChevronUp16Regular />}
            </button>
          )}
        </div>
        <div className="unsaved-changes-banner__actions">
          <Button
            variant="secondary"
            size="small"
            onClick={onReset}
            disabled={isSaving || disabled}
          >
            {t('settings:unsavedChangesBanner.discardButton')}
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            loading={isSaving}
            disabled={disabled}
          >
            {t('settings:unsavedChangesBanner.saveButton')}
          </Button>
        </div>
      </div>
      {isExpanded && modifiedList.length > 0 && (
        <div className="unsaved-changes-banner__details">
          <ul className="unsaved-changes-banner__list">
            {modifiedList.map((key) => (
              <li key={key} className="unsaved-changes-banner__list-item">
                {getSettingLabel(key)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './UnsavedChangesBanner.css'

interface UnsavedChangesBannerProps {
  readonly onSave: () => Promise<void>
  readonly onReset: () => void
  readonly disabled?: boolean
}

export function UnsavedChangesBanner({
  onSave,
  onReset,
  disabled = false
}: UnsavedChangesBannerProps): JSX.Element {
  const { t } = useTranslation(['settings', 'common'])
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="unsaved-changes-banner">
      <div className="unsaved-changes-banner__content">
        <span className="unsaved-changes-banner__text">
          {disabled
            ? t('settings:unsavedChangesBanner.validationError', {
                defaultValue: 'Some settings are invalid. Fix validation errors before saving.'
              })
            : t('settings:unsavedChangesBanner.message')}
        </span>
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
    </div>
  )
}

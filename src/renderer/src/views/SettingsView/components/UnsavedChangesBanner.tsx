import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
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
            ? 'Some settings are invalid. Fix validation errors before saving.'
            : 'Careful — you have unsaved changes!'}
        </span>
        <div className="unsaved-changes-banner__actions">
          <Button
            variant="secondary"
            size="small"
            onClick={onReset}
            disabled={isSaving || disabled}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            loading={isSaving}
            disabled={disabled}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

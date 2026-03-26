import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import './UnsavedChangesBanner.css'

interface UnsavedChangesBannerProps {
  readonly onSave: () => Promise<void>
  readonly onReset: () => void
}

export function UnsavedChangesBanner({ onSave, onReset }: UnsavedChangesBannerProps): JSX.Element {
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
        <span className="unsaved-changes-banner__text">Careful — you have unsaved changes!</span>
        <div className="unsaved-changes-banner__actions">
          <Button variant="secondary" size="small" onClick={onReset} disabled={isSaving}>
            Reset
          </Button>
          <Button variant="primary" size="small" onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

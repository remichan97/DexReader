/**
 * UpdateBanner Component
 *
 * Displays a dismissible "What's New" banner after app updates.
 * Triggered by localStorage flag set before update installation.
 *
 * Behavior:
 * - Shown once when localStorage flag exists
 * - Links to GitHub releases page for current version
 * - Dismissal removes the banner (flags already cleared by parent)
 */

import type { JSX } from 'react'
import { Button } from '../Button'
import { Sparkle24Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './UpdateBanner.css'

interface UpdateBannerProps {
  readonly version: string
  readonly onDismiss: () => void
  readonly onViewReleaseNotes: () => void
}

export function UpdateBanner({
  version,
  onDismiss,
  onViewReleaseNotes
}: UpdateBannerProps): JSX.Element {
  const { t } = useTranslation('common')

  return (
    <div className="update-banner" role="alert" aria-live="polite">
      <div className="update-banner__content">
        <Sparkle24Regular className="update-banner__icon" aria-hidden="true" />
        <span className="update-banner__text">
          <strong>{t('updateBanner.welcome', { version })}</strong>
        </span>
      </div>
      <div className="update-banner__actions">
        <Button variant="primary" size="small" onClick={onViewReleaseNotes}>
          {t('button.viewReleaseNotes')}
        </Button>
        <Button variant="ghost" size="small" onClick={onDismiss}>
          {t('button.letsGo')}
        </Button>
      </div>
    </div>
  )
}

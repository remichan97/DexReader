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
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions
} from '@fluentui/react-components'
import { Button } from '../Button'
import { Sparkle24Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'

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
    // Sparkle icon passed explicitly - MessageBar's success intent would otherwise default to
    // a generic checkmark, losing the "something new to celebrate" framing the original had.
    <MessageBar intent="success" icon={<Sparkle24Regular />}>
      <MessageBarBody>
        <MessageBarTitle>{t('updateBanner.welcome', { version })}</MessageBarTitle>
      </MessageBarBody>
      <MessageBarActions>
        <Button variant="primary" size="small" onClick={onViewReleaseNotes}>
          {t('button.viewReleaseNotes')}
        </Button>
        <Button variant="ghost" size="small" onClick={onDismiss}>
          {t('button.letsGo')}
        </Button>
      </MessageBarActions>
    </MessageBar>
  )
}

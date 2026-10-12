import type { JSX } from 'react'
import { MessageBar, MessageBarBody } from '@fluentui/react-components'
import { EyeOff24Regular } from '@fluentui/react-icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import { useTranslation } from '@renderer/hooks/useTranslation'

/**
 * IncognitoStatusBar Component
 *
 * Persistent status bar that appears when incognito mode is active.
 * Shows full-width notification at top of app (below menu bar).
 *
 * Features:
 * - Visible when autoSaveEnabled is false (incognito mode)
 * - Stacks with OfflineStatusBar if both active
 *
 * UX Pattern: Like OfflineStatusBar - persistent notification (no auto-dismiss, no close button)
 */
export function IncognitoStatusBar(): JSX.Element | null {
  const autoSaveEnabled = useProgressStore((state) => state.autoSaveEnabled)
  const { t } = useTranslation('common')

  // Don't show when tracking is enabled
  if (autoSaveEnabled) {
    return null
  }

  return (
    <MessageBar intent="warning" icon={<EyeOff24Regular />}>
      <MessageBarBody>{t('statusBar.incognitoActive')}</MessageBarBody>
    </MessageBar>
  )
}

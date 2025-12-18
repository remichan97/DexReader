import type { JSX } from 'react'
import { EyeOff24Regular } from '@fluentui/react-icons'
import { useProgressStore } from '@renderer/stores/progressStore'
import './IncognitoStatusBar.css'

/**
 * IncognitoStatusBar Component
 *
 * Persistent status bar that appears when incognito mode is active.
 * Shows full-width notification at top of app (below menu bar).
 *
 * Features:
 * - Visible when autoSaveEnabled is false (incognito mode)
 * - Slide-down animation on mount
 * - Silent disappearance on unmount (no exit animation or message)
 * - Stacks with OfflineStatusBar if both active
 * - Matches Windows 11 dark theme aesthetic
 *
 * UX Pattern: Like OfflineStatusBar - persistent notification (no auto-dismiss, no close button)
 */
export function IncognitoStatusBar(): JSX.Element | null {
  const autoSaveEnabled = useProgressStore((state) => state.autoSaveEnabled)

  // Don't show when tracking is enabled
  if (autoSaveEnabled) {
    return null
  }

  return (
    <output className="incognito-status-bar" aria-live="polite">
      <div className="incognito-status-bar__content">
        <EyeOff24Regular className="incognito-status-bar__icon" />
        <span className="incognito-status-bar__text">
          <strong>You've gone Incognito</strong> — Progress tracking is disabled
        </span>
      </div>
    </output>
  )
}

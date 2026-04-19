import React, { useState, useEffect } from 'react'
import { Switch } from '@renderer/components/Switch'
import { Button } from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

interface AdvancedSettingsProps {
  readonly autoCheckForUpdates: boolean
  readonly autoDownloadUpdates: boolean
  readonly onAutoCheckChange: (value: boolean) => void
  readonly onAutoDownloadChange: (value: boolean) => void
}

export function AdvancedSettings({
  autoCheckForUpdates,
  autoDownloadUpdates,
  onAutoCheckChange,
  onAutoDownloadChange
}: AdvancedSettingsProps): React.JSX.Element {
  const showToast = useToastStore((state) => state.show)
  const [appVersion, setAppVersion] = useState<string>('...')
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)

  // Load app version on mount
  useEffect(() => {
    async function loadVersion(): Promise<void> {
      try {
        const result = await globalThis.appUpdate.getAppVersion()
        if (result.success && result.data) {
          setAppVersion(result.data)
        }
      } catch (error) {
        rendererLog.error('[AdvancedSettings] Failed to load app version:', error)
      }
    }
    loadVersion()
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setIsCheckingForUpdates(true)
    try {
      await globalThis.appUpdate.checkForUpdates(true) // true = manual check
    } catch (error) {
      rendererLog.error('[AdvancedSettings] Update check failed:', error)
      showToast({
        variant: 'error',
        title: 'Update check failed',
        message: 'Failed to check for updates. Please try again later.',
        duration: 4000
      })
    } finally {
      // Reset after a short delay to allow the check to complete
      setTimeout(() => setIsCheckingForUpdates(false), 2000)
    }
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      {/* Application Updates Section */}
      <div className="settings-view__section">
        <h2 className="settings-view__section-heading">Application Updates</h2>
        <p className="settings-view__section-description">
          Configure how DexReader checks for and installs updates
        </p>

        <div className="flex flex-col gap-4">
          {/* Auto-check for updates */}
          <Switch
            checked={autoCheckForUpdates}
            onChange={onAutoCheckChange}
            label="Automatically check for updates"
            description="Check for new versions when the app starts"
          />

          {/* Auto-download updates */}
          <Switch
            checked={autoDownloadUpdates}
            onChange={onAutoDownloadChange}
            disabled={!autoCheckForUpdates}
            label="Automatically download updates"
            description="Download updates in the background. You choose when to install."
          />

          {/* Manual check button */}
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={handleCheckForUpdates}
              disabled={isCheckingForUpdates}
              loading={isCheckingForUpdates}
            >
              Check for Updates Now
            </Button>
            <span className="text-sm text-secondary">Current version: {appVersion}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

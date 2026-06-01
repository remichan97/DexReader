import React, { useState, useEffect } from 'react'
import { Switch } from '@renderer/components/Switch'
import { Button } from '@renderer/components/Button'
import { useToastStore } from '@renderer/stores'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { rendererLog } from '@renderer/services/logging.service'

interface AdvancedSettingsProps {
  readonly autoCheckForUpdates: boolean
  readonly autoDownloadUpdates: boolean
  readonly useHardwareAcceleration: boolean
  readonly onAutoCheckChange: (value: boolean) => void
  readonly onAutoDownloadChange: (value: boolean) => void
  readonly onHardwareAccelerationChange: (value: boolean) => void
}

export function AdvancedSettings({
  autoCheckForUpdates,
  autoDownloadUpdates,
  useHardwareAcceleration,
  onAutoCheckChange,
  onAutoDownloadChange,
  onHardwareAccelerationChange
}: AdvancedSettingsProps): React.JSX.Element {
  const { t } = useTranslation(['settings', 'errors'])
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
        title: t('errors:updates.check_failed.title'),
        message: t('errors:updates.check_failed.message'),
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
        <h2 className="settings-view__section-heading">{t('advanced.updatesSection')}</h2>
        <p className="settings-view__section-description">{t('advanced.updatesDescription')}</p>

        <div className="flex flex-col gap-4">
          {/* Auto-check for updates */}
          <div>
            <Switch
              checked={autoCheckForUpdates}
              onChange={onAutoCheckChange}
              label={t('advanced.autoCheck.label')}
              description={t('advanced.autoCheck.description')}
            />
          </div>

          {/* Auto-download updates */}
          <div>
            <Switch
              checked={autoDownloadUpdates}
              onChange={onAutoDownloadChange}
              disabled={!autoCheckForUpdates}
              label={t('advanced.autoDownload.label')}
              description={t('advanced.autoDownload.description')}
            />
          </div>

          {/* Manual check button */}
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={handleCheckForUpdates}
              disabled={isCheckingForUpdates}
              loading={isCheckingForUpdates}
            >
              {t('advanced.checkNowButton')}
            </Button>
            <span className="text-sm text-secondary">
              {t('advanced.currentVersion', { version: appVersion })}
            </span>
          </div>
        </div>
      </div>

      {/* System Section */}
      <div className="settings-view__section">
        <h2 className="settings-view__section-heading">{t('advanced.systemSection')}</h2>
        <p className="settings-view__section-description">{t('advanced.systemDescription')}</p>

        <div className="flex flex-col gap-4">
          {/* Hardware Acceleration */}
          <div>
            <Switch
              checked={useHardwareAcceleration}
              onChange={onHardwareAccelerationChange}
              label={t('advanced.hardwareAcceleration.label')}
              description={t('advanced.hardwareAcceleration.description')}
            />
          </div>

          {/* Network Proxy Settings */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-primary">
              {t('advanced.networkProxy.label')}
            </h3>
            <p className="text-sm text-secondary mb-2">{t('advanced.networkProxy.description')}</p>
            <Button
              variant="secondary"
              onClick={() => globalThis.settings.openSystemProxySettings()}
            >
              {t('advanced.networkProxy.button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

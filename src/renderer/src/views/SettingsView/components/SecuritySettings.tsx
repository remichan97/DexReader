import React, { useState, useEffect } from 'react'
import { Button } from '@renderer/components/Button'
import { Badge } from '@renderer/components/Badge'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'
import './SecuritySettings.css'

interface SecuritySettingsProps {
  readonly onOpenSetupModal: () => void
  readonly onOpenChangeModal: () => void
  readonly onOpenResetModal: () => void
}

/**
 * Security Settings Component
 * Manages the App Lock (Gatekeeper) feature
 *
 * UI Pattern: Button-based (not toggle switches)
 * - When disabled: Badge "Disabled" + Primary Button "Enable App Lock"
 * - When enabled: Badge "Enabled" + Two secondary buttons ("Change Passphrase", "Reset App Lock")
 */
export function SecuritySettings({
  onOpenSetupModal,
  onOpenChangeModal,
  onOpenResetModal
}: SecuritySettingsProps): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const showToast = useToastStore((state) => state.show)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if Gatekeeper is enabled on mount
  useEffect(() => {
    const checkStatus = async (): Promise<void> => {
      try {
        const result = await globalThis.gatekeeper.isEnabled()

        if (!result.success) {
          rendererLog.error('[SecuritySettings] Failed to check status:', result.error)
          showToast({
            variant: 'error',
            title: t('common:errors.generic', { defaultValue: 'An unexpected error occurred' })
          })
          return
        }

        setIsEnabled(result.data)
      } catch (err) {
        rendererLog.error('[SecuritySettings] Unexpected error:', err)
      } finally {
        setIsChecking(false)
      }
    }

    checkStatus()
  }, [showToast, t])

  // Refresh status (called from parent after modal actions)
  const refreshStatus = async (): Promise<void> => {
    try {
      const result = await globalThis.gatekeeper.isEnabled()
      if (result.success) {
        setIsEnabled(result.data)
      }
    } catch (err) {
      rendererLog.error('[SecuritySettings] Failed to refresh status:', err)
    }
  }

  // Expose refresh method to parent
  React.useEffect(() => {
    // Store refresh function in globalThis for parent to call
    ;(globalThis as Record<string, unknown>).__refreshGatekeeperStatus = refreshStatus
    return () => {
      delete (globalThis as Record<string, unknown>).__refreshGatekeeperStatus
    }
  }, [])

  if (isChecking) {
    return (
      <div className="py-4 flex flex-col gap-5">
        <div>
          <h4 className="security-settings__section-title mb-3">
            {t('gatekeeper:settings.sectionTitle', { defaultValue: 'App Lock' })}
          </h4>
          <p className="security-settings__description mb-4">
            {t('gatekeeper:settings.description', {
              defaultValue: 'Require a passphrase when DexReader starts'
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 flex flex-col gap-5">
      <div>
        <h4 className="security-settings__section-title mb-3">
          {t('gatekeeper:settings.sectionTitle', { defaultValue: 'App Lock' })}
        </h4>
        <p className="security-settings__description mb-4">
          {t('gatekeeper:settings.description', {
            defaultValue: 'Require a passphrase when DexReader starts'
          })}
        </p>

        <div className="security-settings__control">
          <div className="security-settings__status">
            <Badge variant={isEnabled ? 'success' : 'default'}>
              {isEnabled
                ? t('gatekeeper:settings.status.enabled', { defaultValue: 'Enabled' })
                : t('gatekeeper:settings.status.disabled', { defaultValue: 'Disabled' })}
            </Badge>
          </div>

          <div className="security-settings__actions">
            {isEnabled ? (
              <>
                <Button variant="secondary" onClick={onOpenChangeModal}>
                  {t('gatekeeper:settings.buttons.change', { defaultValue: 'Change Passphrase' })}
                </Button>
                <Button variant="secondary" onClick={onOpenResetModal}>
                  {t('gatekeeper:settings.buttons.disable', { defaultValue: 'Reset App Lock' })}
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={onOpenSetupModal}>
                {t('gatekeeper:settings.buttons.enable', { defaultValue: 'Enable App Lock' })}
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="security-settings__help">
          <p className="security-settings__help-text">
            {t('gatekeeper:settings.help.recovery', {
              defaultValue:
                "If you forget your passphrase, you'll need to manually delete the gatekeeper.lock file from your AppData folder and restart the app."
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

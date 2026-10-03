import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './RestartRequiredBanner.css'

interface RestartRequiredBannerProps {
  readonly settingKeys: string[]
  readonly getSettingLabel: (key: string) => string
  readonly getSettingSection: (key: string) => string
  readonly onScrollToSection: (sectionId: string) => void
  readonly onRestartNow: () => Promise<void>
  readonly onDismiss: () => void
}

export function RestartRequiredBanner({
  settingKeys,
  getSettingLabel,
  getSettingSection,
  onScrollToSection,
  onRestartNow,
  onDismiss
}: RestartRequiredBannerProps): JSX.Element {
  const { t } = useTranslation(['settings', 'common'])
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestart = async (): Promise<void> => {
    setIsRestarting(true)
    try {
      await onRestartNow()
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <div className="restart-required-banner">
      <div className="restart-required-banner__content">
        <div className="restart-required-banner__info">
          <span className="restart-required-banner__text">
            {t('settings:restartRequiredBanner.message', {
              defaultValue: 'Some changes need a restart to take effect'
            })}
          </span>
          <ul className="restart-required-banner__list">
            {settingKeys.map((key) => (
              <li key={key}>
                <button
                  className="restart-required-banner__list-btn"
                  onClick={() => onScrollToSection(getSettingSection(key))}
                >
                  {getSettingLabel(key)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="restart-required-banner__actions">
          <Button variant="secondary" size="small" onClick={onDismiss} disabled={isRestarting}>
            {t('settings:restartRequiredBanner.dismissButton', { defaultValue: 'Maybe Later' })}
          </Button>
          <Button variant="primary" size="small" onClick={handleRestart} loading={isRestarting}>
            {t('settings:restartRequiredBanner.restartButton', { defaultValue: 'Restart Now' })}
          </Button>
        </div>
      </div>
    </div>
  )
}

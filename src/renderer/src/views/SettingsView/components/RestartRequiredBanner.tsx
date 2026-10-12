import type { JSX } from 'react'
import { useState } from 'react'
import {
  MessageBar,
  MessageBarBody,
  MessageBarActions,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'

interface RestartRequiredBannerProps {
  readonly settingKeys: string[]
  readonly getSettingLabel: (key: string) => string
  readonly getSettingSection: (key: string) => string
  readonly onScrollToSection: (sectionId: string) => void
  readonly onRestartNow: () => Promise<void>
  readonly onDismiss: () => void
}

const useStyles = makeStyles({
  // MessageBar is a normal block element by design - it has no notion of floating itself at the
  // viewport edge, so the fixed-to-bottom positioning stays a thin wrapper around it rather than
  // something MessageBar itself could express.
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  list: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginTop: tokens.spacingVerticalS,
    marginBottom: 0,
    ...shorthands.padding(0),
    listStyleType: 'none'
  },
  listButton: {
    ...shorthands.padding('4px', '10px'),
    backgroundColor: tokens.colorSubtleBackground,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    color: 'inherit',
    fontSize: tokens.fontSizeBase200,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
      textDecorationLine: 'underline'
    }
  }
})

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
  const styles = useStyles()

  const handleRestart = async (): Promise<void> => {
    setIsRestarting(true)
    try {
      await onRestartNow()
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <MessageBar intent="warning" layout="multiline">
        <MessageBarBody>
          {t('settings:restartRequiredBanner.message', {
            defaultValue: 'Some changes need a restart to take effect'
          })}
          <ul className={styles.list}>
            {settingKeys.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={styles.listButton}
                  onClick={() => onScrollToSection(getSettingSection(key))}
                >
                  {getSettingLabel(key)}
                </button>
              </li>
            ))}
          </ul>
        </MessageBarBody>
        <MessageBarActions>
          <Button variant="secondary" size="small" onClick={onDismiss} disabled={isRestarting}>
            {t('settings:restartRequiredBanner.dismissButton', { defaultValue: 'Maybe Later' })}
          </Button>
          <Button variant="primary" size="small" onClick={handleRestart} loading={isRestarting}>
            {t('settings:restartRequiredBanner.restartButton', { defaultValue: 'Restart Now' })}
          </Button>
        </MessageBarActions>
      </MessageBar>
    </div>
  )
}

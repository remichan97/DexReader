import { useState, useEffect, FormEvent } from 'react'
import { LockClosed24Regular, Eye24Regular, EyeOff24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { rendererLog } from '@renderer/services/logging.service'
import './GatekeeperUnlockScreen.css'

export interface GatekeeperUnlockScreenProps {
  /**
   * Callback when unlock is successful
   */
  onUnlock: () => void
}

/**
 * Fullscreen overlay that blocks access to DexReader until correct passphrase is entered.
 * Appears on app startup when Gatekeeper is enabled.
 *
 * Features:
 * - Fullscreen overlay with backdrop blur
 * - Passphrase input with show/hide toggle
 * - Unlimited retry attempts (casual privacy, not Fort Knox)
 * - No "Forgot Passphrase?" link (requires manual file deletion)
 * - Auto-focus on mount
 * - Enter key to submit
 */
export function GatekeeperUnlockScreen({
  onUnlock
}: Readonly<GatekeeperUnlockScreenProps>): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Auto-focus input on mount
  useEffect(() => {
    const input = document.getElementById('gatekeeper-passphrase-input')
    if (input) {
      input.focus()
    }
  }, [])

  const handleUnlock = async (): Promise<void> => {
    if (!passphrase.trim()) {
      setError(t('gatekeeper:unlock.errors.empty'))
      return
    }

    setIsUnlocking(true)
    setError('')

    try {
      const result = await globalThis.gatekeeper.verify(passphrase)

      if (!result.success) {
        // IPC error
        rendererLog.error('[GatekeeperUnlock] IPC error:', result.error)
        setError(t('gatekeeper:unlock.errors.system'))
        setIsUnlocking(false)
        return
      }

      if (result.data) {
        // Correct passphrase - unlock successful!
        rendererLog.info('[GatekeeperUnlock] Unlock successful')
        onUnlock()
      } else {
        // Incorrect passphrase
        rendererLog.warn('[GatekeeperUnlock] Incorrect passphrase attempt')
        setError(t('gatekeeper:unlock.errors.incorrect'))
        setPassphrase('')
        setIsUnlocking(false)

        // Re-focus input after error
        setTimeout(() => {
          const input = document.getElementById('gatekeeper-passphrase-input')
          if (input) {
            input.focus()
          }
        }, 100)
      }
    } catch (err) {
      rendererLog.error('[GatekeeperUnlock] Unexpected error:', err)
      setError(t('gatekeeper:unlock.errors.unexpected'))
      setIsUnlocking(false)
    }
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!isUnlocking && passphrase.trim()) {
      handleUnlock()
    }
  }

  const handleOpenRecoveryDocs = (): void => {
    // Open recovery documentation in browser (will be added to wiki)
    globalThis.electron.shell.openExternal(
      'https://github.com/remichan97/dexreader/wiki/App-Lock#recovery'
    )
  }

  return (
    <div className="gatekeeper-unlock-screen">
      <div className="gatekeeper-unlock-container">
        <div className="gatekeeper-unlock-icon">
          <LockClosed24Regular />
        </div>

        <h1 className="gatekeeper-unlock-title">
          {t('gatekeeper:unlock.title', { defaultValue: 'DexReader is Locked' })}
        </h1>

        <p className="gatekeeper-unlock-description">
          {t('gatekeeper:unlock.description', {
            defaultValue: 'Enter your passphrase to continue'
          })}
        </p>

        <form onSubmit={handleSubmit} className="gatekeeper-unlock-form">
          <div className="gatekeeper-unlock-input-group">
            <Input
              id="gatekeeper-passphrase-input"
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={setPassphrase}
              placeholder={t('gatekeeper:unlock.placeholder', { defaultValue: 'Passphrase' })}
              disabled={isUnlocking}
              error={error}
              autoComplete="off"
              className="gatekeeper-unlock-input"
            />
            <Button
              variant="ghost"
              onClick={() => setShowPassphrase(!showPassphrase)}
              disabled={isUnlocking}
              aria-label={
                showPassphrase
                  ? t('gatekeeper:unlock.hidePassphrase', { defaultValue: 'Hide passphrase' })
                  : t('gatekeeper:unlock.showPassphrase', { defaultValue: 'Show passphrase' })
              }
              className="gatekeeper-unlock-toggle"
            >
              {showPassphrase ? <EyeOff24Regular /> : <Eye24Regular />}
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            onClick={handleUnlock}
            disabled={!passphrase.trim() || isUnlocking}
            loading={isUnlocking}
            className="gatekeeper-unlock-button"
          >
            {isUnlocking
              ? t('gatekeeper:unlock.unlocking', { defaultValue: 'Unlocking...' })
              : t('gatekeeper:unlock.button', { defaultValue: 'Unlock' })}
          </Button>
        </form>

        <p className="gatekeeper-unlock-help">
          {t('gatekeeper:unlock.help.prefix', { defaultValue: 'Forgot your passphrase?' })}{' '}
          <button
            type="button"
            className="gatekeeper-unlock-help-link"
            onClick={handleOpenRecoveryDocs}
          >
            {t('gatekeeper:unlock.help.link', { defaultValue: 'See recovery steps' })}
          </button>
        </p>
      </div>
    </div>
  )
}

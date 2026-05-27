import { useState, useEffect, FormEvent } from 'react'
import { LockClosed48Regular } from '@fluentui/react-icons'
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
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [nextAttemptTime, setNextAttemptTime] = useState<number | null>(null)
  const [remainingDelay, setRemainingDelay] = useState(0)

  // Auto-focus input on mount
  useEffect(() => {
    const input = document.getElementById('gatekeeper-passphrase-input')
    if (input) {
      input.focus()
    }
  }, [])

  // Update window title when locked
  useEffect(() => {
    const originalTitle = document.title
    document.title = t('gatekeeper:unlock.title', { defaultValue: 'DexReader is Locked' })
    return () => {
      document.title = originalTitle
    }
  }, [t])

  // Countdown timer for delay
  useEffect(() => {
    if (nextAttemptTime === null) return

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((nextAttemptTime - now) / 1000))
      setRemainingDelay(remaining)

      if (remaining === 0) {
        setNextAttemptTime(null)
        // Re-focus input after delay
        setTimeout(() => {
          const input = document.getElementById('gatekeeper-passphrase-input')
          if (input) {
            input.focus()
          }
        }, 100)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [nextAttemptTime])

  const handleUnlock = async (): Promise<void> => {
    if (!passphrase.trim()) {
      setError(t('gatekeeper:unlock.errors.empty'))
      return
    }

    // Check if still in delay period
    if (nextAttemptTime !== null) {
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
        setFailedAttempts(0)
        setNextAttemptTime(null)
        onUnlock()
      } else {
        // Incorrect passphrase - add delay
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        rendererLog.warn(`[GatekeeperUnlock] Incorrect passphrase attempt #${newAttempts}`)

        // Calculate delay: 2s, 4s, 8s, 16s, 30s (max)
        const delaySeconds = Math.min(Math.pow(2, newAttempts), 30)
        const attemptTime = Date.now() + delaySeconds * 1000
        setNextAttemptTime(attemptTime)
        setRemainingDelay(delaySeconds)

        setError(
          t('gatekeeper:unlock.errors.incorrectWithDelay', {
            defaultValue: 'Incorrect passphrase. Wait {{seconds}} seconds before trying again.',
            seconds: delaySeconds
          })
        )
        setPassphrase('')
        setIsUnlocking(false)
      }
    } catch (err) {
      rendererLog.error('[GatekeeperUnlock] Unexpected error:', err)
      setError(t('gatekeeper:unlock.errors.unexpected'))
      setIsUnlocking(false)
    }
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!isUnlocking && passphrase.trim() && nextAttemptTime === null) {
      handleUnlock()
    }
  }

  // Compute button text
  const getButtonText = (): string => {
    if (isUnlocking) {
      return t('gatekeeper:unlock.unlocking', { defaultValue: 'Unlocking...' })
    }
    if (nextAttemptTime !== null) {
      return t('gatekeeper:unlock.waitButton', {
        defaultValue: 'Wait {{seconds}}s...',
        seconds: remainingDelay
      })
    }
    return t('gatekeeper:unlock.button', { defaultValue: 'Unlock' })
  }

  const handleOpenRecoveryDocs = (): void => {
    // Open recovery documentation in browser (will be added to wiki)
    globalThis.api.openExternal('https://github.com/remichan97/dexreader/wiki/App-Lock#recovery')
  }

  return (
    <div className="gatekeeper-unlock-screen">
      <div className="gatekeeper-unlock-container">
        <div className="gatekeeper-unlock-icon">
          <LockClosed48Regular />
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
          <Input
            id="gatekeeper-passphrase-input"
            type="password"
            value={passphrase}
            onChange={setPassphrase}
            placeholder={t('gatekeeper:unlock.placeholder', { defaultValue: 'Passphrase' })}
            disabled={isUnlocking || nextAttemptTime !== null}
            error={remainingDelay > 0 ? `${error} (${remainingDelay}s)` : error}
            autoComplete="off"
            className="gatekeeper-unlock-input"
          />

          <Button
            type="submit"
            variant="primary"
            onClick={handleUnlock}
            disabled={!passphrase.trim() || isUnlocking || nextAttemptTime !== null}
            loading={isUnlocking}
            className="gatekeeper-unlock-button"
          >
            {getButtonText()}
          </Button>
        </form>

        {/* Only show recovery help after 3 failed attempts */}
        {failedAttempts >= 3 && (
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
        )}
      </div>
    </div>
  )
}

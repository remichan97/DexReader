import { useState, FormEvent } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { rendererLog } from '@renderer/services/logging.service'
import './GatekeeperReauthModal.css'

export interface GatekeeperReauthModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean
  /**
   * Callback when user cancels authentication (ESC or Cancel button)
   */
  onCancel: () => void
  /**
   * Callback when authentication is successful
   */
  onSuccess: () => void
}

/**
 * Re-authentication modal for accessing Settings when requireForSettings is enabled
 *
 * Unlike the main unlock screen:
 * - No delay/cooldown on incorrect attempts (Settings is lower risk)
 * - Shows in a modal dialog (not fullscreen)
 * - Simple single input + verify button
 * - Can be cancelled (returns to previous screen)
 */
export function GatekeeperReauthModal({
  isOpen,
  onCancel,
  onSuccess
}: Readonly<GatekeeperReauthModalProps>): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async (): Promise<void> => {
    if (!passphrase.trim()) {
      setError(
        t('gatekeeper:reauth.errors.empty', { defaultValue: 'Please enter your passphrase' })
      )
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await globalThis.gatekeeper.verify(passphrase)

      if (!result.success) {
        // IPC error
        rendererLog.error('[GatekeeperReauth] IPC error:', result.error)
        setError(
          t('gatekeeper:reauth.errors.system', {
            defaultValue: 'Failed to verify passphrase. Please try again.'
          })
        )
        setIsVerifying(false)
        return
      }

      if (result.data) {
        // Correct passphrase - authentication successful!
        rendererLog.info('[GatekeeperReauth] Re-authentication successful')
        setPassphrase('')
        setError('')
        onSuccess()
      } else {
        // Incorrect passphrase - allow immediate retry (no cooldown)
        rendererLog.warn('[GatekeeperReauth] Incorrect passphrase')
        setError(
          t('gatekeeper:reauth.errors.incorrect', {
            defaultValue: 'Incorrect passphrase. Please try again.'
          })
        )
        setPassphrase('')
        setIsVerifying(false)
      }
    } catch (err) {
      rendererLog.error('[GatekeeperReauth] Unexpected error:', err)
      setError(
        t('gatekeeper:reauth.errors.unexpected', {
          defaultValue: 'Something went wrong. Please try again.'
        })
      )
      setIsVerifying(false)
    }
  }

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!isVerifying && passphrase.trim()) {
      handleVerify()
    }
  }

  const handleCancel = (): void => {
    // Reset state when cancelling
    setPassphrase('')
    setError('')
    onCancel()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title={t('gatekeeper:reauth.title', { defaultValue: 'Enter Passphrase' })}
      closeOnEscape={!isVerifying}
      closeOnOverlayClick={!isVerifying}
    >
      <p className="gatekeeper-reauth-description">
        {t('gatekeeper:reauth.description', {
          defaultValue: 'Enter your passphrase to access Settings'
        })}
      </p>

      <form onSubmit={handleSubmit} className="gatekeeper-reauth-form">
        <div className="gatekeeper-reauth-input-group">
          <label htmlFor="reauth-passphrase" className="gatekeeper-reauth-label">
            {t('gatekeeper:reauth.passphraseLabel', { defaultValue: 'Passphrase' })}
          </label>
          <Input
            id="reauth-passphrase"
            type="password"
            value={passphrase}
            onChange={setPassphrase}
            placeholder={t('gatekeeper:reauth.passphrasePlaceholder', {
              defaultValue: 'Enter your passphrase'
            })}
            disabled={isVerifying}
            error={error}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="gatekeeper-reauth-actions">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={isVerifying}>
            {t('common:button.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleVerify}
            disabled={!passphrase.trim() || isVerifying}
            loading={isVerifying}
          >
            {isVerifying
              ? t('gatekeeper:reauth.verifying', { defaultValue: 'Verifying...' })
              : t('gatekeeper:reauth.verifyButton', { defaultValue: 'Verify' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { useState, FormEvent } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Input } from '@renderer/components/Input'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

export interface GatekeeperSetupModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal for setting up App Lock for the first time
 *
 * Features:
 * - Two inputs: passphrase + confirm passphrase
 * - Must match before enabling
 * - Validation: 4-128 characters
 * - Show/hide toggle for both fields
 */
export function GatekeeperSetupModal({
  open,
  onClose,
  onSuccess
}: Readonly<GatekeeperSetupModalProps>): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const showToast = useToastStore((state) => state.show)

  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleClose = (): void => {
    if (isCreating) return
    setPassphrase('')
    setConfirmPassphrase('')
    setError('')
    onClose()
  }

  const validateInputs = (): boolean => {
    if (!passphrase.trim()) {
      setError(t('gatekeeper:settings.errors.enable.empty'))
      return false
    }

    if (passphrase.length < 4 || passphrase.length > 128) {
      setError(t('gatekeeper:settings.errors.enable.lengthInvalid'))
      return false
    }

    if (passphrase !== confirmPassphrase) {
      setError(t('gatekeeper:settings.errors.enable.mismatch'))
      return false
    }

    return true
  }

  const handleSubmit = async (e?: FormEvent): Promise<void> => {
    e?.preventDefault()

    if (!validateInputs()) return

    setIsCreating(true)
    setError('')

    try {
      const result = await globalThis.gatekeeper.enable(passphrase)

      if (!result.success) {
        rendererLog.error('[GatekeeperSetup] Failed to enable:', result.error)
        setError(t('gatekeeper:settings.errors.enable.generic'))
        setIsCreating(false)
        return
      }

      rendererLog.info('[GatekeeperSetup] App Lock enabled successfully')

      showToast({
        variant: 'success',
        title: t('gatekeeper:settings.success.enabled.message', {
          defaultValue: 'Your manga library is now protected with a passphrase'
        })
      })

      handleClose()
      onSuccess()
    } catch (err) {
      rendererLog.error('[GatekeeperSetup] Unexpected error:', err)
      setError(t('gatekeeper:settings.errors.enable.generic'))
      setIsCreating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('gatekeeper:settings.setup.title', { defaultValue: 'Set Up App Lock' })}
      size="small"
      closeOnEscape={!isCreating}
      closeOnOverlayClick={!isCreating}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isCreating}>
            {t('gatekeeper:settings.setup.cancelButton', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isCreating}
            disabled={isCreating}
          >
            {isCreating
              ? t('gatekeeper:settings.setup.creating', { defaultValue: 'Enabling...' })
              : t('gatekeeper:settings.setup.createButton', { defaultValue: 'Enable App Lock' })}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-secondary mb-2">
          {t('gatekeeper:settings.setup.description', {
            defaultValue:
              'Create a passphrase to lock DexReader on startup. Make sure to remember it—recovery requires manual file deletion.'
          })}
        </p>

        {/* Passphrase Input */}
        <Input
          id="gatekeeper-setup-passphrase"
          type="password"
          label={t('gatekeeper:settings.setup.passphraseLabel', { defaultValue: 'Passphrase' })}
          value={passphrase}
          onChange={setPassphrase}
          placeholder={t('gatekeeper:settings.setup.passphrasePlaceholder', {
            defaultValue: 'Enter passphrase (4-128 characters)'
          })}
          disabled={isCreating}
          autoComplete="off"
        />

        {/* Confirm Passphrase Input */}
        <Input
          id="gatekeeper-setup-confirm"
          type="password"
          label={t('gatekeeper:settings.setup.confirmLabel', {
            defaultValue: 'Confirm Passphrase'
          })}
          value={confirmPassphrase}
          onChange={setConfirmPassphrase}
          placeholder={t('gatekeeper:settings.setup.confirmPlaceholder', {
            defaultValue: 'Re-enter passphrase'
          })}
          disabled={isCreating}
          autoComplete="off"
        />

        {/* Error Display */}
        {error && (
          <div className="px-3 py-2 bg-error-subtle border border-error-default rounded-md">
            <p className="text-sm text-error-default m-0">{error}</p>
          </div>
        )}
      </form>
    </Modal>
  )
}

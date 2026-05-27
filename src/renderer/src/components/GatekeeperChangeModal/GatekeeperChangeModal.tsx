import { useState, FormEvent } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Input } from '@renderer/components/Input'
import { Button } from '@renderer/components/Button'
import { Eye24Regular, EyeOff24Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

export interface GatekeeperChangeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal for changing the App Lock passphrase
 *
 * Features:
 * - Three inputs: current + new + confirm new
 * - Validates current passphrase first
 * - Checks if new passphrase is different from old
 * - Validation: 4-128 characters for new passphrase
 */
export function GatekeeperChangeModal({
  open,
  onClose,
  onSuccess
}: Readonly<GatekeeperChangeModalProps>): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const showToast = useToastStore((state) => state.show)

  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassphrase, setNewPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  const handleClose = (): void => {
    if (isChanging) return
    setCurrentPassphrase('')
    setNewPassphrase('')
    setConfirmPassphrase('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    setError('')
    onClose()
  }

  const validateInputs = (): boolean => {
    if (!currentPassphrase.trim() || !newPassphrase.trim()) {
      setError(t('gatekeeper:settings.errors.change.empty'))
      return false
    }

    if (newPassphrase.length < 4 || newPassphrase.length > 128) {
      setError(t('gatekeeper:settings.errors.change.lengthInvalid'))
      return false
    }

    if (newPassphrase !== confirmPassphrase) {
      setError(t('gatekeeper:settings.errors.change.mismatch'))
      return false
    }

    return true
  }

  const handleSubmit = async (e?: FormEvent): Promise<void> => {
    e?.preventDefault()

    if (!validateInputs()) return

    setIsChanging(true)
    setError('')

    try {
      const result = await globalThis.gatekeeper.changePassphrase(currentPassphrase, newPassphrase)

      if (!result.success) {
        rendererLog.error('[GatekeeperChange] Failed to change:', result.error)

        // Parse error message for specific cases
        const errorMsg = result.error || ''
        if (errorMsg.includes('incorrect') || errorMsg.includes('Current passphrase')) {
          setError(t('gatekeeper:settings.errors.change.currentIncorrect'))
        } else if (errorMsg.includes('same')) {
          setError(t('gatekeeper:settings.errors.change.sameAsOld'))
        } else {
          setError(t('gatekeeper:settings.errors.change.generic'))
        }

        setIsChanging(false)
        return
      }

      rendererLog.info('[GatekeeperChange] Passphrase changed successfully')

      showToast({
        variant: 'success',
        title: t('gatekeeper:settings.success.changed.message', {
          defaultValue: 'Your passphrase has been updated successfully'
        })
      })

      handleClose()
      onSuccess()
    } catch (err) {
      rendererLog.error('[GatekeeperChange] Unexpected error:', err)
      setError(t('gatekeeper:settings.errors.change.generic'))
      setIsChanging(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('gatekeeper:settings.change.title', { defaultValue: 'Change Passphrase' })}
      size="small"
      closeOnEscape={!isChanging}
      closeOnOverlayClick={!isChanging}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isChanging}>
            {t('gatekeeper:settings.change.cancelButton', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isChanging}
            disabled={isChanging}
          >
            {isChanging
              ? t('gatekeeper:settings.change.changing', { defaultValue: 'Changing...' })
              : t('gatekeeper:settings.change.changeButton', { defaultValue: 'Change Passphrase' })}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-secondary mb-2">
          {t('gatekeeper:settings.change.description', {
            defaultValue: 'Enter your current passphrase and create a new one'
          })}
        </p>

        {/* Current Passphrase */}
        <div className="flex gap-2 items-start">
          <Input
            id="gatekeeper-change-current"
            type={showCurrent ? 'text' : 'password'}
            label={t('gatekeeper:settings.change.currentLabel', {
              defaultValue: 'Current Passphrase'
            })}
            value={currentPassphrase}
            onChange={setCurrentPassphrase}
            placeholder={t('gatekeeper:settings.change.currentPlaceholder', {
              defaultValue: 'Enter current passphrase'
            })}
            disabled={isChanging}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            variant="ghost"
            onClick={() => setShowCurrent(!showCurrent)}
            disabled={isChanging}
            aria-label={showCurrent ? 'Hide current' : 'Show current'}
            className="mt-[28px]"
          >
            {showCurrent ? <EyeOff24Regular /> : <Eye24Regular />}
          </Button>
        </div>

        {/* New Passphrase */}
        <div className="flex gap-2 items-start">
          <Input
            id="gatekeeper-change-new"
            type={showNew ? 'text' : 'password'}
            label={t('gatekeeper:settings.change.newLabel', { defaultValue: 'New Passphrase' })}
            value={newPassphrase}
            onChange={setNewPassphrase}
            placeholder={t('gatekeeper:settings.change.newPlaceholder', {
              defaultValue: 'Enter new passphrase (4-128 characters)'
            })}
            disabled={isChanging}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            variant="ghost"
            onClick={() => setShowNew(!showNew)}
            disabled={isChanging}
            aria-label={showNew ? 'Hide new' : 'Show new'}
            className="mt-[28px]"
          >
            {showNew ? <EyeOff24Regular /> : <Eye24Regular />}
          </Button>
        </div>

        {/* Confirm New Passphrase */}
        <div className="flex gap-2 items-start">
          <Input
            id="gatekeeper-change-confirm"
            type={showConfirm ? 'text' : 'password'}
            label={t('gatekeeper:settings.change.confirmLabel', {
              defaultValue: 'Confirm New Passphrase'
            })}
            value={confirmPassphrase}
            onChange={setConfirmPassphrase}
            placeholder={t('gatekeeper:settings.change.confirmPlaceholder', {
              defaultValue: 'Re-enter new passphrase'
            })}
            disabled={isChanging}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            variant="ghost"
            onClick={() => setShowConfirm(!showConfirm)}
            disabled={isChanging}
            aria-label={showConfirm ? 'Hide confirm' : 'Show confirm'}
            className="mt-[28px]"
          >
            {showConfirm ? <EyeOff24Regular /> : <Eye24Regular />}
          </Button>
        </div>

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

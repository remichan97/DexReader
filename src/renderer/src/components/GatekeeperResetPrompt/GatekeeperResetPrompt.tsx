import { useState, FormEvent } from 'react'
import { Modal } from '@renderer/components/Modal'
import { Input } from '@renderer/components/Input'
import { Button } from '@renderer/components/Button'
import { Eye24Regular, EyeOff24Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { useToastStore } from '@renderer/stores'
import { rendererLog } from '@renderer/services/logging.service'

export interface GatekeeperResetPromptProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Modal for resetting (disabling) App Lock
 *
 * Features:
 * - Single passphrase input for confirmation
 * - Calls disable() which verifies passphrase before disabling
 * - Success message indicates App Lock is now disabled
 */
export function GatekeeperResetPrompt({
  open,
  onClose,
  onSuccess
}: Readonly<GatekeeperResetPromptProps>): React.JSX.Element {
  const { t } = useTranslation(['gatekeeper', 'common'])
  const showToast = useToastStore((state) => state.show)

  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleClose = (): void => {
    if (isResetting) return
    setPassphrase('')
    setShowPassphrase(false)
    setError('')
    onClose()
  }

  const handleSubmit = async (e?: FormEvent): Promise<void> => {
    e?.preventDefault()

    if (!passphrase.trim()) {
      setError(t('gatekeeper:settings.errors.reset.incorrect'))
      return
    }

    setIsResetting(true)
    setError('')

    try {
      const result = await globalThis.gatekeeper.disable(passphrase)

      if (!result.success) {
        rendererLog.error('[GatekeeperReset] Failed to disable:', result.error)
        setError(t('gatekeeper:settings.errors.reset.generic'))
        setIsResetting(false)
        return
      }

      if (!result.data) {
        // Passphrase was incorrect
        rendererLog.warn('[GatekeeperReset] Incorrect passphrase')
        setError(t('gatekeeper:settings.errors.reset.incorrect'))
        setPassphrase('')
        setIsResetting(false)
        return
      }

      rendererLog.info('[GatekeeperReset] App Lock disabled successfully')

      showToast({
        variant: 'success',
        title: t('gatekeeper:settings.success.reset.message', {
          defaultValue: 'App Lock has been disabled. Your manga library is no longer protected.'
        })
      })

      handleClose()
      onSuccess()
    } catch (err) {
      rendererLog.error('[GatekeeperReset] Unexpected error:', err)
      setError(t('gatekeeper:settings.errors.reset.generic'))
      setIsResetting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('gatekeeper:settings.reset.title', { defaultValue: 'Reset App Lock' })}
      size="small"
      closeOnEscape={!isResetting}
      closeOnOverlayClick={!isResetting}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isResetting}>
            {t('gatekeeper:settings.reset.cancelButton', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isResetting}
            disabled={isResetting || !passphrase.trim()}
          >
            {isResetting
              ? t('gatekeeper:settings.reset.resetting', { defaultValue: 'Resetting...' })
              : t('gatekeeper:settings.reset.resetButton', { defaultValue: 'Reset App Lock' })}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-secondary mb-2">
          {t('gatekeeper:settings.reset.description', {
            defaultValue: 'Enter your passphrase to disable App Lock'
          })}
        </p>

        <div className="px-3 py-3 bg-warning-subtle border border-warning-default rounded-md mb-2">
          <p className="text-sm text-warning-default m-0 font-medium">
            {t('gatekeeper:settings.reset.confirm.message', {
              defaultValue:
                "This will disable App Lock and delete your passphrase. You'll need to set up App Lock again if you want to use it."
            })}
          </p>
        </div>

        {/* Passphrase Input */}
        <div className="flex gap-2 items-start">
          <Input
            id="gatekeeper-reset-passphrase"
            type={showPassphrase ? 'text' : 'password'}
            label={t('gatekeeper:settings.reset.passphraseLabel', { defaultValue: 'Passphrase' })}
            value={passphrase}
            onChange={setPassphrase}
            placeholder={t('gatekeeper:settings.reset.passphrasePlaceholder', {
              defaultValue: 'Enter your passphrase'
            })}
            disabled={isResetting}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            variant="ghost"
            onClick={() => setShowPassphrase(!showPassphrase)}
            disabled={isResetting}
            aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
            className="mt-[28px]"
          >
            {showPassphrase ? <EyeOff24Regular /> : <Eye24Regular />}
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

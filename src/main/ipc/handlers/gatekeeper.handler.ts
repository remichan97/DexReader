import { gatekeeperService } from '../../services/gatekeeper.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerGatekeeperHandlers(): void {
  wrapIpcHandler('gatekeeper:available', async () => {
    return gatekeeperService.isEnabled()
  })

  wrapIpcHandler('gatekeeper:getRequireForSettings', async () => {
    return gatekeeperService.getRequireForSettings()
  })

  wrapIpcHandler('gatekeeper:enable', async (_, passphrase: unknown) => {
    // At least trim the passphrase to prevent accidental leading/trailing spaces, but otherwise allow any characters
    const trimmedPassphrase = (passphrase as string).trim()
    return await gatekeeperService.enable(trimmedPassphrase)
  })

  wrapIpcHandler('gatekeeper:verify', async (_, passphrase: unknown) => {
    return await gatekeeperService.verify((passphrase as string).trim())
  })

  wrapIpcHandler('gatekeeper:disable', async (_, passphrase: unknown) => {
    return await gatekeeperService.disable((passphrase as string).trim())
  })

  wrapIpcHandler('gatekeeper:update', async (_, oldPassphrase: unknown, newPassphrase: unknown) => {
    return await gatekeeperService.changePassphrase(
      (oldPassphrase as string).trim(),
      (newPassphrase as string).trim()
    )
  })

  wrapIpcHandler('gatekeeper:toggleRequireForSettings', async (_, required: unknown) => {
    return gatekeeperService.toggleRequiredForSettings(!!required)
  })

  wrapIpcHandler('gatekeeper:reset', async () => {
    gatekeeperService.reset()
    return true
  })
}

import { gatekeeperService } from '../../services/gatekeeper.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerGatekeeperHandlers(): void {
  wrapIpcHandler('gatekeeper:available', async () => {
    return gatekeeperService.isEnabled()
  })

  wrapIpcHandler('gatekeeper:enable', async (_, passphrase: string) => {
    return await gatekeeperService.enable(passphrase)
  })

  wrapIpcHandler('gatekeeper:verify', async (_, passphrase: string) => {
    return await gatekeeperService.verify(passphrase)
  })

  wrapIpcHandler('gatekeeper:update', async (_, passphrase: string) => {
    return await gatekeeperService.update(passphrase)
  })

  wrapIpcHandler('gatekeeper:reset', async () => {
    gatekeeperService.reset()
    return true
  })
}

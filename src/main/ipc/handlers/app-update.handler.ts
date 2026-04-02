import { appUpdateService } from '../../services/app-update.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerAppUpdateHandler(): void {
  wrapIpcHandler('app-update:check', async (_, manual: unknown) => {
    // Validate and safely coerce manual parameter
    const isManual = typeof manual === 'boolean' ? manual : false
    return await appUpdateService.checkForUpdates(isManual)
  })

  wrapIpcHandler('app-update:download', async () => {
    return await appUpdateService.downloadUpdate()
  })

  wrapIpcHandler('app-update:install', async () => {
    return appUpdateService.exitAndInstall()
  })

  wrapIpcHandler('app-update:version', async () => {
    return appUpdateService.getAppVersion()
  })
}

import { mihonService } from '../../services/mihon.services'
import { wrapIpcHandler } from '../wrapHandler'

export function registerMihonHandlers(): void {
  wrapIpcHandler('mihon:import-backup', async (_, filePath: unknown) => {
    if (typeof filePath !== 'string') {
      throw new TypeError('Invalid file path')
    }

    await mihonService.importFromBackup(filePath)
  })

  wrapIpcHandler('mihon:cancel-import', async () => {
    mihonService.cancelImport()
  })
}

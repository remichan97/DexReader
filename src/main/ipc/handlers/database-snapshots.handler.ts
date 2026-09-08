import { databaseSnapshotService } from '../../services/database-snapshot.service'
import { wrapIpcHandler } from '../wrap-handler'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'

export function registerDatabaseSnapshotHandlers(): void {
  wrapIpcHandler('snapshot:list', async () => {
    return databaseSnapshotService.listSnapshots()
  })

  wrapIpcHandler('snapshot:create', async (_, trigger: unknown) => {
    // Validate the trigger type
    if (Object.values(SnapshotTrigger).includes(trigger as SnapshotTrigger) === false) {
      throw new Error(`Invalid snapshot trigger type`)
    }

    return databaseSnapshotService.createSnapshot(trigger as SnapshotTrigger)
  })

  wrapIpcHandler('snapshot:restore', async (_, snapshotName: unknown) => {
    if (typeof snapshotName !== 'string') {
      throw new TypeError(`Invalid snapshot name`)
    }

    return databaseSnapshotService.restoreSnapshot(snapshotName)
  })

  wrapIpcHandler('snapshot:delete', async (_, snapshotName: unknown) => {
    if (typeof snapshotName !== 'string') {
      throw new TypeError(`Invalid snapshot name`)
    }

    return databaseSnapshotService.deleteSnapshot(snapshotName)
  })
}

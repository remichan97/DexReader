import { settingsManager } from './../settings/settings-manager'
import { SnapshotItemContract } from '@shared/contracts/services/download-snapshots/snapshot-item.contract'
import { getSnapshotPath, validatePath } from '../filesystem/path-validator'
import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'
import { databaseConnection } from '../database/db-connection'
import { secureFs } from '../filesystem/secure-fs'
import { app } from 'electron'
import { mainLog } from './logging/main-logging.service'
import { dateToUnixTimestamp } from '../utils/timestamps.util'
import path from 'node:path'

class DatabaseSnapshotService {
  private readonly snapshotsDir = getSnapshotPath()

  // List all snapshots present in the snapshots directory
  public async listSnapshots(): Promise<SnapshotItemContract[]> {
    if (!this.isSnapshotEnabled()) {
      mainLog.info('[DatabaseSnapshotService] Snapshot listing is disabled in settings.')
      return []
    }

    const snapshots: SnapshotItemContract[] = []

    // Loop through the files in the snapshots directory and extract the timestamp and trigger from the filename, then stat the file to get its size
    try {
      await validatePath(this.snapshotsDir)
      const files = await secureFs.readDir(this.snapshotsDir)

      for (const file of files) {
        const filePath = `${this.snapshotsDir}/${file}`
        const stats = await secureFs.stat(filePath)

        // Snapshot file are in the format dexreader-{timestamp}_{trigger}.db, extract the timestamp and trigger from the filename
        const match = new RegExp(/dexreader-(\d+)_(manual|auto)\.db/).exec(file)
        if (match) {
          const timestamp = Number.parseInt(match[1], 10)
          const trigger = match[2] as SnapshotTrigger

          snapshots.push({
            fileName: file,
            createdAt: new Date(timestamp * 1000), // Convert to milliseconds
            sizeInBytes: stats.size,
            trigger
          })
        }
      }
    } catch (error) {
      // If the directory doesn't exist, return an empty array
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      throw new Error(`Failed to list snapshots: ${error}`)
    }

    return snapshots
  }

  // Create a new snapshot of the database, naming the file based on the current timestamp and the trigger type (manual or auto)
  public async createSnapshot(trigger: SnapshotTrigger): Promise<void> {
    if (!this.isSnapshotEnabled()) {
      mainLog.info('[DatabaseSnapshotService] Snapshot creation is disabled in settings.')
      return
    }

    // Current timestamps in UNIX format (seconds since epoch)
    const timestamp = dateToUnixTimestamp(new Date())
    const snapshotFileName = `dexreader-${timestamp}_${trigger}.db`
    const snapshotFilePath = `${this.snapshotsDir}/${snapshotFileName}`

    try {
      // Don't trust the provided snapshots directory, validate it first
      await validatePath(this.snapshotsDir)

      // Start the backup process
      await databaseConnection.backupDatabase(snapshotFilePath)
    } catch (error) {
      throw new Error(`Failed to create snapshot: ${error}`)
    }

    await this.pruneOldSnapshots()
  }

  public async deleteSnapshot(snapshotName: string): Promise<void> {
    if (!this.isSnapshotEnabled()) {
      mainLog.info('[DatabaseSnapshotService] Snapshot deletion is disabled in settings.')
      return
    }

    // Rejects if the file contains any escaping
    if (path.basename(snapshotName) !== snapshotName) {
      throw new Error('Operation rejected. Filename contains unusual characters')
    }

    const snapshotFilePath = `${this.snapshotsDir}/${snapshotName}`

    try {
      // Stats the snapshot file to ensure it exists and is a file
      const stats = await secureFs.stat(snapshotFilePath)
      if (!stats.isFile()) {
        throw new Error(`Snapshot file ${snapshotName} is not a valid file.`)
      }

      mainLog.info(
        `[DatabaseSnapshotService] Deleting snapshot ${snapshotName} from ${snapshotFilePath}`
      )

      await secureFs.deleteFile(snapshotFilePath)
    } catch (error) {
      throw new Error(`Failed to delete snapshot ${snapshotName}: ${error}`)
    }
  }

  // Given a snapshot name, restore the database from that snapshot, then restart the app. This will overwrite the current database.
  public async restoreSnapshot(snapshotName: string): Promise<void> {
    if (!this.isSnapshotEnabled()) {
      mainLog.info('[DatabaseSnapshotService] Snapshot restore is disabled in settings.')
      return
    }

    // Rejects if the file contains any escaping
    if (path.basename(snapshotName) !== snapshotName) {
      throw new Error('Operation rejected. Filename contains unusual characters')
    }

    const snapshotFilePath = `${this.snapshotsDir}/${snapshotName}`
    try {
      await validatePath(this.snapshotsDir)

      //Stat the snapshot file to ensure it exists and is a file
      const stats = await secureFs.stat(snapshotFilePath)
      if (!stats.isFile()) {
        throw new Error(`Snapshot file ${snapshotName} is not a valid file.`)
      }

      mainLog.info(
        `[DatabaseSnapshotService] Restoring snapshot ${snapshotName} from ${snapshotFilePath}`
      )
      // Close the current database connection before restoring
      databaseConnection.close()

      // Rename the current database file to a backup name, in case the restore fails and we need to revert
      const dbFilePath = databaseConnection.getDbFilePath()
      const backupDbFilePath = `${dbFilePath}.backup`
      await secureFs.copyFile(dbFilePath, backupDbFilePath)

      // Delete any WAL and SHM files associated with the current database to ensure a clean restore
      await secureFs.deleteFile(`${dbFilePath}-wal`).catch(() => {})
      await secureFs.deleteFile(`${dbFilePath}-shm`).catch(() => {})

      // Copy the snapshot file to the database file path, overwriting the current database
      await secureFs.copyFile(snapshotFilePath, dbFilePath)

      // The restore was successful, delete the backup database file
      await secureFs.deleteFile(backupDbFilePath).catch(() => {})

      mainLog.info(`[DatabaseSnapshotService] Successfully restored snapshot ${snapshotName}`)

      // Restart the app when everything is done. The app will re-open the database connection on startup.
      app.relaunch()
      app.exit(0)
    } catch (error) {
      mainLog.error(
        `[DatabaseSnapshotService] Failed to restore snapshot ${snapshotName}: ${error}`
      )

      // Revert the database file to the backup if the restore failed
      const dbFilePath = databaseConnection.getDbFilePath()
      const backupDbFilePath = `${dbFilePath}.backup`
      await secureFs.copyFile(backupDbFilePath, dbFilePath).catch(() => {})

      // Reopen the database connection
      databaseConnection.init()

      throw new Error(`Failed to restore snapshot ${snapshotName}: ${error}`)
    }
  }

  public async createSnapshotOnAppStartup(): Promise<void> {
    if (!this.isSnapshotEnabled()) {
      mainLog.info(
        '[DatabaseSnapshotService] Snapshot Feature is disabled in settings. Skipping automatic snapshot creation on app startup.'
      )
      return
    }

    // When was the last automatic snapshot created? If there are no snapshots, create one. If there are snapshots, check the last one and see if it was created more than the intervalInHours ago. If so, create a new snapshot.
    const snapshots = await this.listSnapshots()
    const intervalInHours = settingsManager.getByPath('snapshot', 'intervalInHours') ?? 6

    const lastSnapshot = snapshots
      .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .find((snapshot) => snapshot.trigger === SnapshotTrigger.Auto)

    const now = new Date()
    const hoursSinceLastSnapshot = lastSnapshot
      ? (now.getTime() - lastSnapshot.createdAt.getTime()) / (1000 * 60 * 60)
      : Infinity

    if (hoursSinceLastSnapshot >= intervalInHours) {
      await this.createSnapshot(SnapshotTrigger.Auto)
    }
  }

  private async pruneOldSnapshots(): Promise<void> {
    // List all snapshots and sort them by creation date (oldest first)
    const snapshots = await this.listSnapshots()

    snapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    // Read the maximum number of snapshots to keep from settings, then delete the oldest snapshots if there are more than that number
    const maxSnapshots = settingsManager.getByPath('snapshot', 'maxSnapshotsCount') ?? 5

    if (snapshots.length > maxSnapshots) {
      const snapshotsToDelete = snapshots.slice(0, snapshots.length - maxSnapshots)

      for (const snapshot of snapshotsToDelete) {
        const snapshotFileName = `dexreader-${Math.floor(snapshot.createdAt.getTime() / 1000)}_${
          snapshot.trigger
        }.db`
        const snapshotFilePath = `${this.snapshotsDir}/${snapshotFileName}`

        try {
          await secureFs.deleteFile(snapshotFilePath)
        } catch (error) {
          throw new Error(`Failed to delete old snapshot ${snapshotFileName}: ${error}`)
        }
      }
    }
  }

  private isSnapshotEnabled(): boolean {
    return settingsManager.getByPath('snapshot', 'isEnabled') ?? false
  }
}

export const databaseSnapshotService = new DatabaseSnapshotService()

import { app, clipboard, dialog, shell } from 'electron'
import { databaseConnection } from './connection'
import { secureFs } from '../filesystem/secure-fs'
import { mainLog } from '../services/logging/main-logging.service'

const RELEASES_URL = 'https://github.com/remichan97/dexreader/releases'

function buildDiagnosticInfo(error: unknown): string {
  const normalisedError = error instanceof Error ? error : new Error(String(error))

  return [
    `DexReader ${app.getVersion()}`,
    `Platform: ${process.platform} ${process.arch}`,
    `Electron: ${process.versions.electron}`,
    `Node: ${process.versions.node}`,
    '',
    `${normalisedError.name}: ${normalisedError.message}`,
    normalisedError.stack ?? ''
  ].join('\n')
}

async function backUpCorruptDatabase(): Promise<void> {
  const dbPath = databaseConnection.getDbFilePath()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // WAL mode leaves -wal/-shm sidecar files that belong to the same corrupt database
  for (const suffix of ['', '-wal', '-shm']) {
    const candidatePath = `${dbPath}${suffix}`
    if (await secureFs.isExists(candidatePath)) {
      await secureFs.rename(candidatePath, `${candidatePath}.corrupt-${timestamp}`)
    }
  }
}

/**
 * Handles a failure to open the database connection (typically file-level corruption).
 * Returns true if the database was backed up, reset, and reopened successfully.
 */
export async function recoverFromDatabaseOpenFailure(error: unknown): Promise<boolean> {
  mainLog.error('[Database] Failed to open database:', error)

  const { response } = await dialog.showMessageBox({
    type: 'error',
    title: 'Database problem',
    message: "DexReader couldn't open its database.",
    detail:
      'The database file appears to be corrupted and can\'t be opened. Choosing "Back up & reset" ' +
      'moves the broken file aside (it is not deleted) and starts a fresh, empty database. ' +
      "Your library and reading history won't be restored automatically — re-import from a backup afterwards if you have one.",
    buttons: ['Back up & reset', 'Quit'],
    defaultId: 0,
    cancelId: 1
  })

  if (response === 1) {
    return false
  }

  try {
    await backUpCorruptDatabase()
    databaseConnection.init()
    mainLog.info('[Database] Corrupt database backed up and a fresh database was opened')
    return true
  } catch (resetError) {
    mainLog.error('[Database] Failed to reset database after open failure:', resetError)
    await dialog.showMessageBox({
      type: 'error',
      title: 'Database problem',
      message: "DexReader still couldn't recover its database.",
      detail:
        'Please reinstall the app, or contact support with the log files from the app data folder.',
      buttons: ['Quit']
    })
    return false
  }
}

/**
 * Handles a migration failure. This is almost always a bug shipped in this release rather than
 * an environment issue — the migrator rolls back on failure, so existing data is untouched, but
 * retrying re-applies the same broken SQL and fails identically every time. There is nothing to
 * offer but diagnostics and a way back to the last working release.
 */
export async function handleMigrationFailure(error: unknown): Promise<void> {
  mainLog.error('[Database] Migration failed:', error)

  const diagnosticInfo = buildDiagnosticInfo(error)

  for (;;) {
    const { response } = await dialog.showMessageBox({
      type: 'error',
      title: 'Update problem',
      message: "DexReader couldn't update its database for this version.",
      detail:
        'This is a bug in this release, not a problem with your data — your library and reading ' +
        'history are untouched. Copy the diagnostic details to report it, and consider installing ' +
        'the previous release until a fix is out.',
      buttons: ['Copy diagnostic info', 'Previous releases', 'Quit'],
      defaultId: 2,
      cancelId: 2,
      noLink: true
    })

    if (response === 0) {
      clipboard.writeText(diagnosticInfo)
      mainLog.info('[Database] Diagnostic info copied to clipboard')
      continue
    }

    if (response === 1) {
      await shell.openExternal(RELEASES_URL)
      continue
    }

    break
  }
}

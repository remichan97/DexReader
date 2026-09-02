import { app, clipboard, dialog, shell } from 'electron'
import { databaseConnection } from './connection'
import { secureFs } from '../filesystem/secure-fs'
import { mainLog } from '../services/logging/main-logging.service'
import { toError } from '@shared/utils/to-error.util'
import i18next from '../i18n/i18n.config'

const RELEASES_URL = 'https://github.com/remichan97/dexreader/releases'

function buildDiagnosticInfo(error: unknown): string {
  const normalisedError = toError(error)

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
    title: i18next.t('dialogs:databaseRecovery.openFailure.title'),
    message: i18next.t('dialogs:databaseRecovery.openFailure.message'),
    detail: i18next.t('dialogs:databaseRecovery.openFailure.detail'),
    buttons: [
      i18next.t('dialogs:databaseRecovery.openFailure.buttons.backupAndReset'),
      i18next.t('dialogs:databaseRecovery.openFailure.buttons.quit')
    ],
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
      title: i18next.t('dialogs:databaseRecovery.recoveryFailure.title'),
      message: i18next.t('dialogs:databaseRecovery.recoveryFailure.message'),
      detail: i18next.t('dialogs:databaseRecovery.recoveryFailure.detail'),
      buttons: [i18next.t('dialogs:databaseRecovery.openFailure.buttons.quit')]
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
      title: i18next.t('dialogs:databaseRecovery.migrationFailure.title'),
      message: i18next.t('dialogs:databaseRecovery.migrationFailure.message'),
      detail: i18next.t('dialogs:databaseRecovery.migrationFailure.detail'),
      buttons: [
        i18next.t('dialogs:databaseRecovery.migrationFailure.buttons.copyDiagnostics'),
        i18next.t('dialogs:databaseRecovery.migrationFailure.buttons.previousReleases'),
        i18next.t('dialogs:databaseRecovery.migrationFailure.buttons.quit')
      ],
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

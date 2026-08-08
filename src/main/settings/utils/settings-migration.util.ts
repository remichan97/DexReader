import { mainLog } from '../../services/logging/main-logging.service'
import { AppSettings } from '../../../shared/types/settings/app-settings.type'
import { validateSettings } from '../validators/types.validator'

// Each time we change the settings structure in a way that guarantees a full migration, increment this version number. This is used to determine if a migration is needed, and to apply the correct migration functions if there are breaking changes.
export const CURRENT_SETTINGS_VERSION = 6

// Define a type for migration function, which takes settings object, and migrate it to the next version. Use when there are breaking changes.
type MigrationFunction = (settings: Partial<AppSettings>) => AppSettings

/**
 * Sparse registry of breaking change migrations
 *
 * Add entries here ONLY when you have a BREAKING CHANGE (rename, remove, restructure).
 * Most version bumps (just adding fields) don't need an entry - deepMergeDefaults backfills
 * new fields automatically.
 *
 * Convention: [targetVersion]: (settings) => ...migration logic
 */
const breakingChangesMigrations: Record<number, MigrationFunction> = {
  // Empty for now - add breaking change migrations as needed
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Recursively backfill missing fields from `defaults` into `stored`.
 *
 * electron-store only shallow-merges its `defaults` option with the persisted file
 * (Object.assign at the top level), so nested fields added to an existing section (e.g. a new
 * `appearance.sidebarSize`) are never backfilled for existing users. This fills that gap so
 * every nested field always has a value, without requiring a migration entry per field.
 */
export function deepMergeDefaults<T extends object>(defaults: T, stored: Partial<T>): T {
  const defaultsRecord = defaults as Record<string, unknown>
  const storedRecord = stored as Record<string, unknown>
  const result: Record<string, unknown> = { ...defaultsRecord }

  for (const key of Object.keys(defaultsRecord)) {
    const storedValue = storedRecord[key]
    if (storedValue === undefined) continue

    const defaultValue = defaultsRecord[key]
    if (isPlainObject(defaultValue) && isPlainObject(storedValue)) {
      result[key] = deepMergeDefaults(defaultValue, storedValue)
    } else {
      result[key] = storedValue
    }
  }

  return result as T
}

export function migrateSettings(settings: AppSettings, defaults: AppSettings): AppSettings {
  const userVersion = settings.version || 0

  // Does someone came from the future? Since we don't know what the future holds, and we really don't know if the future version is compatible with current one, we should just reset to defaults to avoid potential issues
  if (userVersion > CURRENT_SETTINGS_VERSION) {
    mainLog.warn(
      `[SettingsMigration] User settings version (${userVersion}) is newer than current app version (${CURRENT_SETTINGS_VERSION}). Resetting to defaults to avoid potential compatibility issues.`
    )
    return defaults
  }

  // Backfill any fields missing from the persisted file before running version-specific
  // migrations, so migration functions always receive a fully-populated settings object.
  let migrated = deepMergeDefaults(defaults, settings)

  // Are we already at latest version, if so, verify object integrity and return as is (with correct typing)
  if (userVersion === CURRENT_SETTINGS_VERSION) {
    mainLog.info(
      `[SettingsMigration] User settings are already at the latest version (${CURRENT_SETTINGS_VERSION}). No migration needed.`
    )
    if (!validateSettings(migrated)) {
      mainLog.error(
        '[SettingsMigration] User settings object failed validation. This indicates a problem with the settings file. Reverting to defaults to avoid potential issues.'
      )
      return defaults
    }
    return migrated
  }

  // If all version checks are passed, and a migration is needed, we shall begin here.

  mainLog.info(
    `[SettingsMigration] Migrating settings from version ${userVersion} to ${CURRENT_SETTINGS_VERSION}`
  )

  // If there are breaking changes that require a migration, we'll now run through each migration function sequentially until we reach the current version. This allows us to handle multiple sequential breaking changes gracefully.
  for (let version = userVersion + 1; version <= CURRENT_SETTINGS_VERSION; version++) {
    const migrationFunction = breakingChangesMigrations[version]
    if (migrationFunction) {
      mainLog.info(`[SettingsMigration] Applying migration for version ${version}`)
      try {
        migrated = migrationFunction(migrated)
      } catch (error) {
        mainLog.error(
          `[SettingsMigration] Error applying migration for version ${version}: ${error}`
        )
        throw error // If a migration fails, we should throw the error to prevent saving potentially corrupted settings
      }
    } else {
      // Move on if nothing found, which means no breaking changes for this version
      mainLog.info(`[SettingsMigration] No breaking changes for version ${version}, skipping.`)
    }
  }

  // Make sure we end up with the correct version number in the migrated settings, in case some migration functions forgot to update it
  migrated.version = CURRENT_SETTINGS_VERSION

  // Final validation to make sure migrated settings are valid. This is a safeguard to prevent saving corrupted settings to disk, which can cause issues on next app startup. If the migrated settings are invalid, we should throw an error to prevent saving them.
  if (!validateSettings(migrated)) {
    mainLog.error(
      '[SettingsMigration] Final migrated settings object failed validation. This indicates a problem with the migration functions. Please check the migration functions for potential issues.'
    )
    throw new Error('Migrated settings object is invalid after migration.')
  }

  mainLog.info(
    `[SettingsMigration] Migration completed. Final settings version: ${migrated.version}`
  )

  return migrated
}

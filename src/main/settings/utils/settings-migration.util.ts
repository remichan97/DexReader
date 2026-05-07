import { mainLog } from '../../services/logging/main-logging.service'
import { AppSettings } from '../entities/app-settings.entity'
import {
  isDownloadsSettings,
  isAppearanceSettings,
  isReaderSettings,
  isUpdateSettings,
  isLogSettings
} from '../validators/types.validator'

export const CURRENT_SETTINGS_VERSION = 1

// Define a type for migration function, which takes settings object, and migrate it to the next version. Use when there are breaking changes.
type MigrationFunction = (settings: Partial<AppSettings>) => AppSettings

/**
 * Sparse registry of breaking change migrations
 *
 * Add entries here ONLY when you have a BREAKING CHANGE (rename, remove, restructure).
 * Most version bumps (just adding fields) don't need an entry!
 *
 * Convention: [targetVersion]: (settings) => ...migration logic
 */
const breakingChangesMigrations: Record<number, MigrationFunction> = {
  // Empty for now - add breaking change migrations as needed
}

function mergeWithDefaults(userSettings: Partial<AppSettings>, defaults: AppSettings): AppSettings {
  return {
    version: CURRENT_SETTINGS_VERSION,
    downloads: {
      ...defaults.downloads,
      ...userSettings.downloads
    },
    appearance: {
      ...defaults.appearance,
      ...userSettings.appearance
    },
    reader: {
      ...defaults.reader,
      ...userSettings.reader,
      // Deep merge nested objects to preserve user's custom settings
      global: {
        ...defaults.reader.global,
        ...userSettings.reader?.global
      },
      performance: {
        ...defaults.reader.performance,
        ...userSettings.reader?.performance
      }
    },
    update: {
      ...defaults.update,
      ...userSettings.update
    },
    logs: {
      ...defaults.logs,
      ...userSettings.logs
    },
    search: {
      ...defaults.search,
      ...userSettings.search
    }
  }
}

export function migrateSettings(
  userSettings: Partial<AppSettings>,
  defaults: AppSettings
): AppSettings {
  const userVersion = userSettings.version || 0

  // Are we already at latest version, if so, verify object integrity and return as is (with correct typing)
  if (userVersion === CURRENT_SETTINGS_VERSION) {
    mainLog.info(
      `[SettingsMigration] User settings are already at the latest version (${CURRENT_SETTINGS_VERSION}). No migration needed.`
    )
    if (!validateSettingsObject(userSettings as AppSettings)) {
      mainLog.error(
        '[SettingsMigration] User settings object failed validation. This indicates a problem with the settings file. Reverting to defaults to avoid potential issues.'
      )
      return defaults
    }
    return userSettings as AppSettings
  }

  // Does someone came from the future? Since we don't know what the future holds, and we really don't know if the future version is compatible with current one, we should just reset to defaults to avoid potential issues
  if (userVersion > CURRENT_SETTINGS_VERSION) {
    mainLog.warn(
      `[SettingsMigration] User settings version (${userVersion}) is newer than current app version (${CURRENT_SETTINGS_VERSION}). Resetting to defaults to avoid potential compatibility issues.`
    )
    return defaults
  }

  // If all version checks are passed, and a migration is needed, we shall begin here.

  mainLog.info(
    `[SettingsMigration] Migrating settings from version ${userVersion} to ${CURRENT_SETTINGS_VERSION}`
  )

  // First, attempts to auto-merge, which should cover most non-breaking changes (like added fields with defaults)
  let migrated = mergeWithDefaults(userSettings, defaults)

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
  if (!validateSettingsObject(migrated)) {
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

export function validateSettingsObject(settings: AppSettings): boolean {
  // Run through all validators to make sure settings object is valid. This is a safeguard to prevent saving corrupted settings to disk, which can cause issues on next app startup.
  // If any of the validators fail, an error is thrown, which should be caught by the caller to prevent saving the invalid settings.
  if (!isDownloadsSettings(settings.downloads)) {
    mainLog.error('[SettingsMigration] Validation failed for downloads settings.')
    return false
  }
  if (!isAppearanceSettings(settings.appearance)) {
    mainLog.error('[SettingsMigration] Validation failed for appearance settings.')
    return false
  }
  if (!isReaderSettings(settings.reader)) {
    mainLog.error('[SettingsMigration] Validation failed for reader.global settings.')
    return false
  }
  if (!isUpdateSettings(settings.update)) {
    mainLog.error('[SettingsMigration] Validation failed for update settings.')
    return false
  }
  if (!isLogSettings(settings.logs)) {
    mainLog.error('[SettingsMigration] Validation failed for logs settings.')
    return false
  }

  // If all validators passed, the settings object is valid
  return true
}

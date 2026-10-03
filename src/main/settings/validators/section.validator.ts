import { AppSettings } from '@shared/types/settings/app-settings.type'
import {
  isAppearanceSettings,
  isDownloadsSettings,
  isLanguageSettings,
  isLogSettings,
  isReaderSettings,
  isSearchSettings,
  isSnapshotSettings,
  isSystemSettings,
  isUpdateSettings
} from './settings.validator'

type SectionValidator<K extends keyof AppSettings> = (value: unknown) => value is AppSettings[K]

type SettingSectionKey = keyof typeof SECTION_VALIDATORS

const SECTION_VALIDATORS: {
  [K in Exclude<keyof AppSettings, 'version'>]: SectionValidator<K>
} = {
  appearance: isAppearanceSettings,
  downloads: isDownloadsSettings,
  reader: isReaderSettings,
  update: isUpdateSettings,
  logs: isLogSettings,
  search: isSearchSettings,
  language: isLanguageSettings,
  snapshot: isSnapshotSettings,
  system: isSystemSettings
}

export function isSettingsSectionKey(section: string): section is SettingSectionKey {
  return section in SECTION_VALIDATORS
}

export function validateSection<K extends SettingSectionKey>(
  section: K,
  value: unknown
): value is AppSettings[K] {
  const validate = SECTION_VALIDATORS[section] as SectionValidator<K>
  return validate(value)
}

import type { AppSettings } from '../../../../../../preload/window.types'

/**
 * Common shape every settings-domain hook exposes so SettingsView can drive
 * dirty-checking, saving, and resetting through one registry instead of
 * enumerating each domain by hand in three separate places.
 *
 * `TPayload` is intentionally NOT constrained to `Partial<AppSettings>`: the
 * settings enums (`AppTheme`, `StartupPage`, etc.) are nominal, while this
 * form's local state - like the rest of this component tree - uses plain
 * string-literal unions matching the section components' prop types. The
 * payload shapes are structurally compatible with `AppSettings` at the
 * values every domain actually produces; only the nominal enum identity
 * differs, and `settings.saveAll` is called with the merged object exactly
 * as this file's predecessor did.
 */
export interface SettingsDomain<TPayload> {
  isDirty: (original: AppSettings) => boolean
  buildPayload: () => TPayload
  reset: (original: AppSettings) => void
}

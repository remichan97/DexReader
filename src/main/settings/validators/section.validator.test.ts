import { AppearanceSettings } from '@shared/types/settings/appearance-settings.type'
import { SystemSettings } from '@shared/types/settings/system-settings.type'
import { AppTheme } from '@shared/enums/settings/theme-mode.enum'
import { StartupPage } from '@shared/enums/settings/startup-page.enum'
import { SidebarSize } from '@shared/enums/settings/sidebar-size.enum'
import { isSettingsSectionKey, validateSection } from './section.validator'

describe('isSettingsSectionKey', () => {
  it.each([
    'appearance',
    'downloads',
    'reader',
    'update',
    'logs',
    'search',
    'language',
    'snapshot',
    'system'
  ])('recognises "%s" as a valid section key', (section) => {
    expect(isSettingsSectionKey(section)).toBe(true)
  })

  it('rejects "version" - not a section, the top-level schema version', () => {
    expect(isSettingsSectionKey('version')).toBe(false)
  })

  it('rejects unknown section names', () => {
    expect(isSettingsSectionKey('notASection')).toBe(false)
    expect(isSettingsSectionKey('')).toBe(false)
  })
})

describe('validateSection', () => {
  const validAppearance: AppearanceSettings = {
    theme: AppTheme.Dark,
    startupPage: StartupPage.Library,
    sidebarSize: SidebarSize.Full
  }

  const validSystem: SystemSettings = {
    useHardwareAcceleration: true
  }

  it('dispatches to the matching section validator and returns true for a valid value', () => {
    expect(validateSection('appearance', validAppearance)).toBe(true)
    expect(validateSection('system', validSystem)).toBe(true)
  })

  it('propagates the underlying validator error for an invalid value', () => {
    expect(() =>
      validateSection('appearance', { ...validAppearance, theme: 'not-a-theme' })
    ).toThrow()
    expect(() => validateSection('system', { useHardwareAcceleration: 'yes' })).toThrow()
  })

  it('does not cross-validate against the wrong section', () => {
    expect(() => validateSection('system', validAppearance)).toThrow()
  })
})

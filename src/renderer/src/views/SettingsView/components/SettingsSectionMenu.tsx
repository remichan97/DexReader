import type { JSX } from 'react'
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuGroupHeader,
  MenuItemRadio,
  MenuButton,
  type MenuCheckedValueChangeData,
  type MenuCheckedValueChangeEvent
} from '@fluentui/react-components'
import type { SettingsSection } from './SettingsHeader'
import { useTranslation } from '@renderer/hooks/useTranslation'

const CHECKED_VALUES_NAME = 'section'

interface SettingsSectionMenuProps {
  readonly currentSection: string
  readonly currentSectionLabel?: string
  readonly sections: readonly SettingsSection[]
  readonly onSectionSelect: (sectionId: string) => void
}

/**
 * Dropdown menu for quick section navigation in Settings, built on Fluent 2's
 * `Menu`/`MenuButton`/`MenuItemRadio` (@fluentui/react-components). Portal rendering,
 * positioning, click-outside/Escape dismissal, and arrow-key navigation all come from
 * Fluent's Menu - the hand-rolled versions of all of these (manual focused-index tracking,
 * a document mousedown listener, a window keydown listener) are gone. The current section
 * is modelled as a `MenuItemRadio` selection rather than a custom "active" indicator, since
 * that's exactly what this is: picking one of several sections.
 */
export function SettingsSectionMenu({
  currentSection,
  currentSectionLabel,
  sections,
  onSectionSelect
}: Readonly<SettingsSectionMenuProps>): JSX.Element {
  const { t } = useTranslation(['settings'])

  const handleCheckedValueChange = (
    _event: MenuCheckedValueChangeEvent,
    data: MenuCheckedValueChangeData
  ): void => {
    if (data.name === CHECKED_VALUES_NAME && data.checkedItems[0]) {
      onSectionSelect(data.checkedItems[0])
    }
  }

  return (
    <Menu
      checkedValues={{ [CHECKED_VALUES_NAME]: [currentSection] }}
      onCheckedValueChange={handleCheckedValueChange}
    >
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          appearance="outline"
          aria-label={t('settings:jumpToSection', { defaultValue: 'Jump to section' })}
        >
          {currentSectionLabel || t('settings:jumpTo', { defaultValue: 'Jump to...' })}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuGroupHeader>{t('settings:jumpTo', { defaultValue: 'Jump to...' })}</MenuGroupHeader>
          {sections.map((section) => (
            <MenuItemRadio key={section.id} name={CHECKED_VALUES_NAME} value={section.id}>
              {section.label}
            </MenuItemRadio>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

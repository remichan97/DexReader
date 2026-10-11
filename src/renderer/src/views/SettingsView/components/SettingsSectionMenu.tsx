import type { JSX } from 'react'
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuGroupHeader,
  MenuItemRadio,
  MenuButton,
  makeStyles,
  type MenuCheckedValueChangeData,
  type MenuCheckedValueChangeEvent
} from '@fluentui/react-components'
import type { SettingsSection } from './SettingsHeader'
import { useTranslation } from '@renderer/hooks/useTranslation'

const CHECKED_VALUES_NAME = 'section'

const useStyles = makeStyles({
  // Spans the header like the original dropdown did: label at the start, chevron pushed to
  // the end (MenuButton is inline-flex and shrink-to-fit by default)
  trigger: {
    width: '100%',
    justifyContent: 'space-between'
  },
  // MenuPopover caps itself at 300px, which would clamp the width matched to the trigger
  popover: {
    maxWidth: 'none'
  }
})

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
  const styles = useStyles()

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
      // Same width as the trigger, so the list reads as the trigger opening downwards
      positioning={{ matchTargetSize: 'width' }}
      checkedValues={{ [CHECKED_VALUES_NAME]: [currentSection] }}
      onCheckedValueChange={handleCheckedValueChange}
    >
      <MenuTrigger disableButtonEnhancement>
        {/* Not appearance="outline": its expanded state thickens the border 1px -> 3px, which
            grows the trigger by 4px and shifts the sticky header's content down while open. */}
        <MenuButton
          className={styles.trigger}
          appearance="secondary"
          aria-label={t('settings:jumpToSection', { defaultValue: 'Jump to section' })}
        >
          {currentSectionLabel || t('settings:jumpTo', { defaultValue: 'Jump to...' })}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover className={styles.popover}>
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

import type { JSX } from 'react'
import { useState } from 'react'
import { SettingsSectionMenu } from './SettingsSectionMenu'
import './SettingsHeader.css'

export interface SettingsSection {
  id: string
  label: string
  translationKey: string
}

interface SettingsHeaderProps {
  currentSection: string
  sections: SettingsSection[]
  onSectionSelect: (sectionId: string) => void
}

/**
 * Sticky header for Settings view with section navigation dropdown
 */
export function SettingsHeader({
  currentSection,
  sections,
  onSectionSelect
}: Readonly<SettingsHeaderProps>): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const currentSectionLabel = sections.find((s) => s.id === currentSection)?.label

  const handleSectionSelect = (id: string): void => {
    onSectionSelect(id)
    setIsMenuOpen(false)
  }

  return (
    <header className="settings-header">
      <SettingsSectionMenu
        currentSection={currentSection}
        currentSectionLabel={currentSectionLabel}
        sections={sections}
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        onSectionSelect={handleSectionSelect}
      />
    </header>
  )
}

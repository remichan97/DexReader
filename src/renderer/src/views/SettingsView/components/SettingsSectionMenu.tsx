import type { JSX } from 'react'
import { useRef, useEffect, useState } from 'react'
import { ChevronDown16Regular } from '@fluentui/react-icons'
import type { SettingsSection } from './SettingsHeader'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './SettingsSectionMenu.css'

interface SettingsSectionMenuProps {
  currentSection: string
  currentSectionLabel?: string
  sections: SettingsSection[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSectionSelect: (sectionId: string) => void
}

/**
 * Dropdown menu for quick section navigation in Settings
 */
export function SettingsSectionMenu({
  currentSection,
  currentSectionLabel,
  sections,
  isOpen,
  onOpenChange,
  onSectionSelect
}: Readonly<SettingsSectionMenuProps>): JSX.Element {
  const { t } = useTranslation(['settings'])
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onOpenChange])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onOpenChange(false)
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => Math.min(prev + 1, sections.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          onSectionSelect(sections[focusedIndex].id)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, sections, onSectionSelect, onOpenChange])

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) {
      const currentIndex = sections.findIndex((s) => s.id === currentSection)
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [isOpen, currentSection, sections])

  return (
    <div className="settings-section-menu" ref={menuRef}>
      <button
        className="settings-section-menu__trigger"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('settings:jumpTo', { defaultValue: 'Jump to section' })}
      >
        <span>{currentSectionLabel || t('settings:jumpTo', { defaultValue: 'Jump to...' })}</span>
        <ChevronDown16Regular
          className={`settings-section-menu__icon ${isOpen ? 'settings-section-menu__icon--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="settings-section-menu__dropdown" role="menu">
          <div className="settings-section-menu__header">
            {t('settings:jumpTo', { defaultValue: 'Jump to...' })}
          </div>
          {sections.map((section, index) => (
            <button
              key={section.id}
              className={`settings-section-menu__item ${
                section.id === currentSection ? 'settings-section-menu__item--active' : ''
              } ${index === focusedIndex ? 'settings-section-menu__item--focused' : ''}`}
              onClick={() => onSectionSelect(section.id)}
              role="menuitem"
              aria-current={section.id === currentSection ? 'true' : undefined}
            >
              {section.id === currentSection && (
                <span className="settings-section-menu__indicator" aria-hidden="true">
                  ●
                </span>
              )}
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

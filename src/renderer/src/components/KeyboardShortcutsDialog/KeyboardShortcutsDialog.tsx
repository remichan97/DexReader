import React from 'react'
import { Modal } from '../Modal'
import './KeyboardShortcutsDialog.css'

interface KeyboardShortcutsDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

type ShortcutCategory = 'global' | 'navigation' | 'library' | 'reader' | 'search' | 'accessibility'

interface ShortcutItem {
  key: string
  description: string
  category: ShortcutCategory
  ariaLabel?: string
}

const SHORTCUTS: ShortcutItem[] = [
  // Global
  { key: 'Ctrl+U', description: 'Check for app updates', category: 'global' },
  { key: 'Ctrl+,', description: 'Open Settings', category: 'global' },
  { key: 'Ctrl+Shift+N', description: 'Toggle Incognito mode', category: 'global' },
  { key: 'F11', description: 'Toggle fullscreen', category: 'global' },
  { key: 'Ctrl+R', description: 'Reload current view', category: 'global' },
  { key: 'F1', description: 'Open Help', category: 'global' },
  { key: 'Ctrl+/', description: 'Show keyboard shortcuts', category: 'global' },
  { key: 'Alt+F4', description: 'Exit app', category: 'global' },

  // Navigation
  { key: 'Ctrl+1', description: 'Go to Browse', category: 'navigation' },
  { key: 'Ctrl+2', description: 'Go to Library', category: 'navigation' },
  { key: 'Ctrl+3', description: 'Go to Downloads', category: 'navigation' },
  { key: 'Ctrl+4', description: 'Go to Reading History', category: 'navigation' },
  { key: 'Ctrl+F', description: 'Focus search bar', category: 'navigation' },

  // Library
  { key: 'Ctrl+D', description: 'Add/Remove from Favourites', category: 'library' },
  { key: 'Ctrl+Shift+N', description: 'Create new collection', category: 'library' },
  { key: 'Ctrl+Shift+C', description: 'Manage collections', category: 'library' },
  { key: 'Ctrl+Shift+U', description: 'Check library for updates', category: 'library' },
  { key: 'Ctrl+Shift+D', description: 'Download chapter', category: 'library' },
  { key: 'Ctrl+Alt+D', description: 'Download entire manga', category: 'library' },
  { key: 'Ctrl+Shift+E', description: 'Edit collection', category: 'library' },

  // Reader - Page Navigation
  {
    key: '→ / PageDown / Enter',
    description: 'Next page',
    category: 'reader',
    ariaLabel: 'Arrow Right, PageDown, or Enter: Next page'
  },
  {
    key: '← / PageUp',
    description: 'Previous page',
    category: 'reader',
    ariaLabel: 'Arrow Left or PageUp: Previous page'
  },
  { key: 'Space', description: 'Next page', category: 'reader' },
  { key: 'Shift+Space', description: 'Previous page', category: 'reader' },
  { key: 'Home', description: 'First page', category: 'reader' },
  { key: 'End', description: 'Last page', category: 'reader' },

  // Reader - Chapter Navigation
  {
    key: '↑',
    description: 'Previous chapter',
    category: 'reader',
    ariaLabel: 'Arrow Up: Previous chapter'
  },
  {
    key: '↓',
    description: 'Next chapter',
    category: 'reader',
    ariaLabel: 'Arrow Down: Next chapter'
  },
  { key: 'L', description: 'Toggle chapter list', category: 'reader' },

  // Reader - Reading Modes
  { key: 'M', description: 'Cycle reading modes', category: 'reader' },

  // Reader - Zoom & Fit
  { key: 'Z', description: 'Cycle fit modes', category: 'reader' },
  { key: 'Ctrl+0', description: 'Reset zoom', category: 'reader' },
  { key: 'Ctrl++', description: 'Zoom in', category: 'reader' },
  { key: 'Ctrl+-', description: 'Zoom out', category: 'reader' },
  { key: 'Ctrl+Wheel', description: 'Zoom at cursor', category: 'reader' },

  // Reader - Exit
  { key: 'Escape', description: 'Back / Close sidebar', category: 'reader' },

  // Search
  { key: 'Escape', description: 'Clear search (when focused)', category: 'search' },

  // Accessibility
  { key: 'Tab', description: 'Navigate focusable elements', category: 'accessibility' },
  {
    key: 'Enter / Space',
    description: 'Activate buttons, switches, tabs',
    category: 'accessibility'
  },
  {
    key: 'Arrow keys',
    description: 'Navigate dropdowns, tabs, menus',
    category: 'accessibility'
  }
]

export function KeyboardShortcutsDialog({
  isOpen,
  onClose
}: KeyboardShortcutsDialogProps): React.JSX.Element {
  const globalShortcuts = SHORTCUTS.filter((s) => s.category === 'global')
  const navigationShortcuts = SHORTCUTS.filter((s) => s.category === 'navigation')
  const libraryShortcuts = SHORTCUTS.filter((s) => s.category === 'library')
  const readerShortcuts = SHORTCUTS.filter((s) => s.category === 'reader')
  const searchShortcuts = SHORTCUTS.filter((s) => s.category === 'search')
  const accessibilityShortcuts = SHORTCUTS.filter((s) => s.category === 'accessibility')

  return (
    <Modal open={isOpen} onClose={onClose} size="large" title="Keyboard Shortcuts">
      <div className="keyboard-shortcuts-dialog">
        <div className="keyboard-shortcuts-dialog__subtitle">
          All keyboard shortcuts available in DexReader
        </div>

        <div className="keyboard-shortcuts-dialog__content">
          {/* Global Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">Global</h3>
            <div className="shortcut-list">
              {globalShortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd
                    className="shortcut-item__key"
                    aria-label={shortcut.ariaLabel || shortcut.key}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="shortcut-item__description">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Navigation Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">Navigation</h3>
            <div className="shortcut-list">
              {navigationShortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd
                    className="shortcut-item__key"
                    aria-label={shortcut.ariaLabel || shortcut.key}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="shortcut-item__description">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Library Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">Library</h3>
            <div className="shortcut-list">
              {libraryShortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd
                    className="shortcut-item__key"
                    aria-label={shortcut.ariaLabel || shortcut.key}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="shortcut-item__description">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Reader Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">Reader</h3>

            <h4 className="shortcut-subsection__title">Page Navigation</h4>
            <div className="shortcut-list">
              {readerShortcuts
                .filter(
                  (s) =>
                    s.description.includes('page') &&
                    !s.description.includes('chapter') &&
                    !s.description.includes('mode')
                )
                .map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-item">
                    <kbd
                      className="shortcut-item__key"
                      aria-label={shortcut.ariaLabel || shortcut.key}
                    >
                      {shortcut.key}
                    </kbd>
                    <span className="shortcut-item__description">{shortcut.description}</span>
                  </div>
                ))}
            </div>

            <h4 className="shortcut-subsection__title">Chapter Navigation</h4>
            <div className="shortcut-list">
              {readerShortcuts
                .filter((s) => s.description.includes('chapter') || s.key === 'L')
                .map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-item">
                    <kbd
                      className="shortcut-item__key"
                      aria-label={shortcut.ariaLabel || shortcut.key}
                    >
                      {shortcut.key}
                    </kbd>
                    <span className="shortcut-item__description">{shortcut.description}</span>
                  </div>
                ))}
            </div>

            <h4 className="shortcut-subsection__title">Zoom & Fit</h4>
            <div className="shortcut-list">
              {readerShortcuts
                .filter(
                  (s) =>
                    s.description.includes('zoom') ||
                    s.description.includes('fit') ||
                    s.description.includes('mode')
                )
                .map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-item">
                    <kbd
                      className="shortcut-item__key"
                      aria-label={shortcut.ariaLabel || shortcut.key}
                    >
                      {shortcut.key}
                    </kbd>
                    <span className="shortcut-item__description">{shortcut.description}</span>
                  </div>
                ))}
            </div>

            <h4 className="shortcut-subsection__title">Exit</h4>
            <div className="shortcut-list">
              {readerShortcuts
                .filter((s) => s.key === 'Escape')
                .map((shortcut) => (
                  <div key={shortcut.key} className="shortcut-item">
                    <kbd
                      className="shortcut-item__key"
                      aria-label={shortcut.ariaLabel || shortcut.key}
                    >
                      {shortcut.key}
                    </kbd>
                    <span className="shortcut-item__description">{shortcut.description}</span>
                  </div>
                ))}
            </div>
          </section>

          {/* Search Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">Search</h3>
            <div className="shortcut-list">
              {searchShortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd
                    className="shortcut-item__key"
                    aria-label={shortcut.ariaLabel || shortcut.key}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="shortcut-item__description">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Accessibility section */}
          <section className="shortcut-section shortcut-section--muted">
            <h3 className="shortcut-section__title">Accessibility</h3>
            <p className="shortcut-section__note">
              Standard keyboard navigation is available throughout the app
            </p>
            <div className="shortcut-list">
              {accessibilityShortcuts.map((shortcut) => (
                <div key={shortcut.key} className="shortcut-item">
                  <kbd
                    className="shortcut-item__key"
                    aria-label={shortcut.ariaLabel || shortcut.key}
                  >
                    {shortcut.key}
                  </kbd>
                  <span className="shortcut-item__description">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}

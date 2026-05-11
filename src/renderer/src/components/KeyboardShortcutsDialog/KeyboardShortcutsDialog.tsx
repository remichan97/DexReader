import React from 'react'
import { Modal } from '../Modal'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './KeyboardShortcutsDialog.css'

interface KeyboardShortcutsDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

interface ShortcutItem {
  key: string
  translationKey: string
  ariaLabelKey?: string
}

interface ShortcutItem {
  key: string
  translationKey: string
  ariaLabelKey?: string
}

// Shortcuts data mapped to translation keys
const GLOBAL_SHORTCUTS: ShortcutItem[] = [
  { key: 'Ctrl+U', translationKey: 'shortcuts:categories.global.shortcuts.checkUpdates' },
  { key: 'Ctrl+,', translationKey: 'shortcuts:categories.global.shortcuts.openSettings' },
  { key: 'Ctrl+Shift+N', translationKey: 'shortcuts:categories.global.shortcuts.toggleIncognito' },
  { key: 'F11', translationKey: 'shortcuts:categories.global.shortcuts.toggleFullscreen' },
  { key: 'Ctrl+R', translationKey: 'shortcuts:categories.global.shortcuts.reload' },
  { key: 'F1', translationKey: 'shortcuts:categories.global.shortcuts.openHelp' },
  { key: 'Ctrl+/', translationKey: 'shortcuts:categories.global.shortcuts.showShortcuts' },
  { key: 'Alt+F4', translationKey: 'shortcuts:categories.global.shortcuts.exitApp' }
]

const NAVIGATION_SHORTCUTS: ShortcutItem[] = [
  { key: 'Ctrl+1', translationKey: 'shortcuts:categories.navigation.shortcuts.goToBrowse' },
  { key: 'Ctrl+2', translationKey: 'shortcuts:categories.navigation.shortcuts.goToLibrary' },
  { key: 'Ctrl+3', translationKey: 'shortcuts:categories.navigation.shortcuts.goToDownloads' },
  { key: 'Ctrl+4', translationKey: 'shortcuts:categories.navigation.shortcuts.goToHistory' },
  { key: 'Ctrl+F', translationKey: 'shortcuts:categories.navigation.shortcuts.focusSearch' }
]

const LIBRARY_SHORTCUTS: ShortcutItem[] = [
  { key: 'Ctrl+D', translationKey: 'shortcuts:categories.library.shortcuts.toggleFavorite' },
  {
    key: 'Ctrl+Shift+N',
    translationKey: 'shortcuts:categories.library.shortcuts.createCollection'
  },
  {
    key: 'Ctrl+Shift+C',
    translationKey: 'shortcuts:categories.library.shortcuts.manageCollections'
  },
  { key: 'Ctrl+Shift+U', translationKey: 'shortcuts:categories.library.shortcuts.checkForUpdates' },
  { key: 'Ctrl+Shift+D', translationKey: 'shortcuts:categories.library.shortcuts.downloadChapter' },
  { key: 'Ctrl+Alt+D', translationKey: 'shortcuts:categories.library.shortcuts.downloadManga' },
  { key: 'Ctrl+Shift+E', translationKey: 'shortcuts:categories.library.shortcuts.editCollection' }
]

const READER_PAGE_NAV_SHORTCUTS: ShortcutItem[] = [
  {
    key: '→ / PageDown / Enter',
    translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.nextPage',
    ariaLabelKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.nextPageKeys'
  },
  {
    key: '← / PageUp',
    translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.previousPage',
    ariaLabelKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.previousPageKeys'
  },
  {
    key: 'Space',
    translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.nextPageSpace'
  },
  {
    key: 'Shift+Space',
    translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.previousPageShiftSpace'
  },
  { key: 'Home', translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.firstPage' },
  { key: 'End', translationKey: 'shortcuts:categories.reader.pageNavigation.shortcuts.lastPage' }
]

const READER_CHAPTER_NAV_SHORTCUTS: ShortcutItem[] = [
  {
    key: '↑',
    translationKey: 'shortcuts:categories.reader.chapterNavigation.shortcuts.previousChapter'
  },
  {
    key: '↓',
    translationKey: 'shortcuts:categories.reader.chapterNavigation.shortcuts.nextChapter'
  },
  {
    key: 'L',
    translationKey: 'shortcuts:categories.reader.chapterNavigation.shortcuts.toggleChapterList'
  }
]

const READER_READING_MODES_SHORTCUTS: ShortcutItem[] = [
  {
    key: 'M',
    translationKey: 'shortcuts:categories.reader.readingModes.shortcuts.cycleReadingModes'
  }
]

const READER_ZOOM_SHORTCUTS: ShortcutItem[] = [
  { key: 'Z', translationKey: 'shortcuts:categories.reader.zoomAndFit.shortcuts.cycleFitModes' },
  { key: 'Ctrl+0', translationKey: 'shortcuts:categories.reader.zoomAndFit.shortcuts.resetZoom' },
  { key: 'Ctrl++', translationKey: 'shortcuts:categories.reader.zoomAndFit.shortcuts.zoomIn' },
  { key: 'Ctrl+-', translationKey: 'shortcuts:categories.reader.zoomAndFit.shortcuts.zoomOut' },
  {
    key: 'Ctrl+Wheel',
    translationKey: 'shortcuts:categories.reader.zoomAndFit.shortcuts.zoomAtCursor'
  }
]

const READER_EXIT_SHORTCUTS: ShortcutItem[] = [
  { key: 'Escape', translationKey: 'shortcuts:categories.reader.exit.shortcuts.backOrCloseSidebar' }
]

const SEARCH_SHORTCUTS: ShortcutItem[] = [
  { key: 'Escape', translationKey: 'shortcuts:categories.search.shortcuts.clearSearch' }
]

const ACCESSIBILITY_SHORTCUTS: ShortcutItem[] = [
  { key: 'Tab', translationKey: 'shortcuts:categories.accessibility.shortcuts.navigateFocusable' },
  {
    key: 'Enter / Space',
    translationKey: 'shortcuts:categories.accessibility.shortcuts.activateElements'
  },
  {
    key: 'Arrow keys',
    translationKey: 'shortcuts:categories.accessibility.shortcuts.navigateControls'
  }
]

export function KeyboardShortcutsDialog({
  isOpen,
  onClose
}: KeyboardShortcutsDialogProps): React.JSX.Element {
  const { t } = useTranslation('shortcuts')

  const renderShortcutList = (shortcuts: ShortcutItem[]): React.JSX.Element => (
    <div className="shortcut-list">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.key} className="shortcut-item">
          <kbd
            className="shortcut-item__key"
            aria-label={shortcut.ariaLabelKey ? t(shortcut.ariaLabelKey) : shortcut.key}
          >
            {shortcut.key}
          </kbd>
          <span className="shortcut-item__description">{t(shortcut.translationKey)}</span>
        </div>
      ))}
    </div>
  )

  return (
    <Modal open={isOpen} onClose={onClose} size="large" title={t('dialogTitle')}>
      <div className="keyboard-shortcuts-dialog flex flex-col">
        <div className="keyboard-shortcuts-dialog__subtitle">{t('dialogSubtitle')}</div>

        <div className="keyboard-shortcuts-dialog__content">
          {/* Global Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">{t('categories.global.title')}</h3>
            {renderShortcutList(GLOBAL_SHORTCUTS)}
          </section>

          {/* Navigation Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">{t('categories.navigation.title')}</h3>
            {renderShortcutList(NAVIGATION_SHORTCUTS)}
          </section>

          {/* Library Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">{t('categories.library.title')}</h3>
            {renderShortcutList(LIBRARY_SHORTCUTS)}
          </section>

          {/* Reader Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">{t('categories.reader.title')}</h3>

            <h4 className="shortcut-subsection__title">
              {t('categories.reader.pageNavigation.subtitle')}
            </h4>
            {renderShortcutList(READER_PAGE_NAV_SHORTCUTS)}

            <h4 className="shortcut-subsection__title">
              {t('categories.reader.chapterNavigation.subtitle')}
            </h4>
            {renderShortcutList(READER_CHAPTER_NAV_SHORTCUTS)}

            <h4 className="shortcut-subsection__title">
              {t('categories.reader.readingModes.subtitle')}
            </h4>
            {renderShortcutList(READER_READING_MODES_SHORTCUTS)}

            <h4 className="shortcut-subsection__title">
              {t('categories.reader.zoomAndFit.subtitle')}
            </h4>
            {renderShortcutList(READER_ZOOM_SHORTCUTS)}

            <h4 className="shortcut-subsection__title">{t('categories.reader.exit.subtitle')}</h4>
            {renderShortcutList(READER_EXIT_SHORTCUTS)}
          </section>

          {/* Search Shortcuts */}
          <section className="shortcut-section">
            <h3 className="shortcut-section__title">{t('categories.search.title')}</h3>
            {renderShortcutList(SEARCH_SHORTCUTS)}
          </section>

          {/* Accessibility section */}
          <section className="shortcut-section shortcut-section--muted">
            <h3 className="shortcut-section__title">{t('categories.accessibility.title')}</h3>
            <p className="shortcut-section__note">{t('categories.accessibility.note')}</p>
            {renderShortcutList(ACCESSIBILITY_SHORTCUTS)}
          </section>
        </div>
      </div>
    </Modal>
  )
}

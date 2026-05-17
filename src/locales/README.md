# DexReader Locales

This directory contains all translation files for DexReader's internationalization (i18n) support.

## Structure

```
locales/
├── en-GB/          # British English (default)
│   ├── common.json         # Common UI elements (buttons, labels, states, forms)
│   ├── menu.json           # Application menu items
│   ├── errors.json         # Error messages organized by category
│   ├── dialogs.json        # Dialog messages, confirmations, toasts
│   ├── validation.json     # Form validation messages
│   ├── shortcuts.json      # Keyboard shortcuts descriptions
│   ├── browse.json         # Browse view strings
│   ├── library.json        # Library view strings
│   ├── downloads.json      # Downloads view strings
│   ├── reader.json         # Reader view strings
│   ├── settings.json       # Settings view strings
│   ├── history.json        # Reading history view strings
│   ├── mangaDetail.json    # Manga detail view strings
│   └── index.ts            # Exports all locale files
└── en-US/          # American English
    └── (same structure as en-GB)
└── vi-VN/          # Vietnamese
    └── (same structure as en-GB)
```

## Translation Keys

Translation keys use dot notation for hierarchical organization:

- `common.button.save` → "Save"
- `menu.file.settings` → "Settings..."
- `errors.network.offline.title` → "You're offline"
- `reader.header.backButton` → "Back"

## Interpolation

Some strings support variable interpolation using `{{variable}}` syntax:

- `dialogs.importResult.summary.main` → "Successfully imported {{count}} out of {{total}} manga from your backup."
- `settings.performance.systemInfo` → "System RAM: {{ram}} GB | Recommended: {{recommended}} MB"

## Default Language

**British English (en-GB)** is the default language and fallback for all translations. This is the source of truth for all translation keys.

### British English Conventions

- "Favourites" (not "Favorites")
- "Colour" (not "Color")
- "Organise" (not "Organize")
- "Realise" (not "Realize")
- "Centre" (not "Center")

## Adding a New Language

1. Create a new directory with the language code (e.g., `ja-JP` for Japanese)
2. Copy all JSON files from `en-GB/` to the new directory
3. Translate all string values (keep keys unchanged)
4. Create an `index.ts` file that exports all translations
5. Update the main i18n configuration to include the new language

## Translation Guidelines

1. **Maintain Tone**: DexReader uses a casual, friendly tone. Avoid overly formal or technical language.
2. **Keep Context**: Some strings are context-dependent. Check the key path to understand where they're used.
3. **Icons**: Continue using Fluent UI icons from `@fluentui/react-icons`. Do not translate icon names.
4. **Technical Terms**: Some technical terms (e.g., "MangaDex", "Mihon", "Tachiyomi") should not be translated.
5. **Pluralization**: Use i18next pluralization features when needed (see i18next documentation).
6. **Date/Time**: Date and time formatting is handled separately by the system locale settings.

### Language-Specific Guides

For languages with unique translation challenges, see the dedicated translation guides:

- **Vietnamese (vi-VN)**: [vi-VN-translation-guide.md](vi-VN-translation-guide.md) - Covers terminology challenges, borrowed terms, and localization strategies for Vietnamese speakers

## File Organization

### common.json (350+ strings)

General UI elements used across multiple views:

- Button labels (save, cancel, delete, etc.)
- Actions (add, edit, remove, etc.)
- States (loading, success, error, etc.)
- Form elements (placeholders, labels, helper text)
- Status indicators, badges, empty states

### menu.json (50+ strings)

Application menu structure:

- File menu (settings, updates, exit)
- View menu (navigation items)
- Library menu (favourites, collections, import/export)
- Tools menu (storage, cache, history)
- Help menu (documentation, issues, about)

### errors.json (100+ strings)

Error messages organized by category:

- Network errors (offline, timeout, connection)
- File errors (not found, access denied, disk space)
- API errors (rate limit, not found)
- Entity errors (manga, chapter, downloads)
- Operation errors (library, collections, presets, progress)

### dialogs.json (100+ strings)

Dialog and modal content:

- Creation dialogs (collections, presets)
- Confirmation dialogs (delete, clear, reset)
- Result dialogs (import, export)
- Toast notifications (success, error, info)
- Update notifications

### validation.json (40+ strings)

Form validation messages:

- Common validation (required, invalid type)
- Settings validation (appearance, downloads, reader)
- Performance validation (cache size limits)
- Path validation (file system errors)
- UI validation messages

### shortcuts.json (50+ strings)

Keyboard shortcuts organized by category:

- Global shortcuts (updates, settings, fullscreen)
- Navigation shortcuts (browse, library, downloads)
- Library shortcuts (favourites, collections)
- Reader shortcuts (page/chapter navigation, zoom, reading modes)
- Search and accessibility shortcuts

### View Files (browse.json, library.json, etc.)

View-specific strings:

- Page titles and headers
- Search placeholders
- Filter and sort options
- Empty states and loading messages
- View-specific actions and buttons
- Help text and tooltips

## Usage in Code

### React Components (Renderer)

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation('common')

  return (
    <button>{t('button.save')}</button>
  )
}

// With interpolation
const { t } = useTranslation('dialogs')
const message = t('importResult.summary.main', { count: 10, total: 15 })
// "Successfully imported 10 out of 15 manga from your backup."
```

### Main Process (Electron)

```typescript
import i18n from './i18n/config'

const label = i18n.t('menu.file.settings')
// "Settings..."
```

## Statistics

- **Total namespaces**: 13
- **Total translation keys**: ~1,500+
- **Supported languages**: 3 (en-GB, en-US, vi-VN)
- **Planned languages**: en-US (American English)

## Notes

- All strings extracted from source code as of v1.3.0
- Maintains British English spelling conventions per system-pattern.md
- Organized for maintainability and easy translation
- Supports dynamic language switching without app restart (renderer process)
- Main process (menus) requires menu rebuild on language change

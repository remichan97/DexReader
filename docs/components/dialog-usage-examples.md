# Dialogue Usage Examples

## Overview

DexReader provides two dialogue APIs for showing native OS dialogues:

1. **`showConfirmDialog`** - Simple yes/no confirmation (use for quick confirmations)
2. **`showDialog`** - Multi-choice dialogue with custom buttons and options (use for 3+ choices)

## When to Use Which?

### Use `showConfirmDialog` for

- Simple yes/no decisions
- Quick confirmations that don't need explanation
- Actions that can be confirmed or cancelled
- Examples: "Delete this item?", "Close without saving?", "Mark as read?"

### Use `showDialog` for

- Multiple choice scenarios (3+ options)
- Custom button labels that need to be descriptive
- Dialogues with checkboxes ("Don't ask again")
- Complex decisions where users need clear options
- Examples: "Save/Discard/Cancel", "Remove bookmark only/Remove downloads/Remove everything/Cancel"

---

## Simple Confirm Dialogue

```typescript
// Simple yes/no confirmation
const confirmed = await window.api.showConfirmDialog(
  'Delete this item?',
  'This action cannot be undone'
)

if (confirmed) {
  // User clicked "Leave"
  deleteItem()
}
```

## Multi-Choice Dialogue

### Real-World Example: Removing Manga with Downloads

```typescript
// User wants to remove a manga that has downloaded chapters
const result = await window.api.showDialog({
  message: 'Remove "One Piece" from library?',
  detail: 'This manga has 50 downloaded chapters. What would you like to do?',
  buttons: [
    'Remove bookmark only (keep downloads)',
    'Remove downloads only (keep bookmark)',
    'Remove everything',
    'Cancel'
  ],
  type: 'question',
  defaultId: 3, // Cancel is safe default
  cancelId: 3
})

switch (result.response) {
  case 0:
    // Remove bookmark only
    removeFromLibrary(mangaId)
    break
  case 1:
    // Remove downloads only
    deleteDownloadedChapters(mangaId)
    break
  case 2:
    // Remove everything
    removeFromLibrary(mangaId)
    deleteDownloadedChapters(mangaId)
    break
  case 3:
    // User cancelled
    break
}
```

### Basic Example with 3 Options

```typescript
const result = await window.api.showDialog({
  message: 'Unsaved changes',
  detail: 'What would you like to do with your changes?',
  buttons: ['Save', 'Discard', 'Cancel'],
  type: 'question',
  defaultId: 0, // "Save" is selected by default
  cancelId: 2 // "Cancel" is triggered by ESC key
})

switch (result.response) {
  case 0:
    // User clicked "Save"
    saveChanges()
    break
  case 1:
    // User clicked "Discard"
    discardChanges()
    break
  case 2:
    // User clicked "Cancel"
    break
}
```

### Windows Command Links (Arrow Buttons)

On Windows, non-common button labels automatically appear as command links with arrow icons:

```typescript
const result = await window.api.showDialog({
  message: 'Choose import source',
  detail: 'Select where to import your library from',
  buttons: [
    'Import from DexReader backup', // Command link with arrow
    'Import from Tachiyomi backup', // Command link with arrow
    'Import from another source', // Command link with arrow
    'Cancel' // Regular button
  ],
  type: 'question',
  noLink: false // Default: shows command links on Windows
})

if (result.response === 0) {
  importFromDexReader()
} else if (result.response === 1) {
  importFromTachiyomi()
} else if (result.response === 2) {
  showCustomImportDialog()
}
```

### Dialog with Checkbox

```typescript
const result = await window.api.showDialog({
  message: 'Clear cache',
  detail: 'This will delete all cached manga covers and metadata',
  buttons: ['Clear Cache', 'Cancel'],
  type: 'warning',
  checkboxLabel: "Don't ask me again",
  checkboxChecked: false
})

if (result.response === 0) {
  clearCache()

  if (result.checkboxChecked) {
    // Save preference to not show this warning again
    savePreference('skipCacheClearWarning', true)
  }
}
```

### Different Dialog Types

```typescript
// Information dialog
await window.api.showDialog({
  message: 'Update available',
  detail: 'Version 2.0.0 is now available',
  buttons: ['Download', 'Later'],
  type: 'info'
})

// Warning dialog
await window.api.showDialog({
  message: 'Low disk space',
  detail: 'You have less than 1GB of free space',
  buttons: ['OK'],
  type: 'warning'
})

// Error dialog
await window.api.showDialog({
  message: 'Failed to connect',
  detail: 'Could not connect to MangaDex API',
  buttons: ['Retry', 'Cancel'],
  type: 'error'
})

// Question dialog
await window.api.showDialog({
  message: 'Delete collection?',
  detail: 'This will not delete the manga, only the collection',
  buttons: ['Delete', 'Cancel'],
  type: 'question'
})
```

### Disable Command Links (Regular Buttons Only)

```typescript
const result = await window.api.showDialog({
  message: 'Choose download quality',
  buttons: ['High Quality', 'Data Saver', 'Cancel'],
  type: 'question',
  noLink: true // Forces regular buttons on Windows instead of command links
})
```

## Dialog Options Reference

### `showDialog` Options

| Property          | Type                                                      | Description                                                 |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `message`         | `string`                                                  | Main message text (required)                                |
| `detail`          | `string?`                                                 | Additional detail text below the message                    |
| `buttons`         | `string[]?`                                               | Array of button labels (default: `['OK', 'Cancel']`)        |
| `type`            | `'none' \| 'info' \| 'error' \| 'question' \| 'warning'?` | Dialog type, affects icon (default: `'question'`)           |
| `defaultId`       | `number?`                                                 | Index of button selected by default (default: `0`)          |
| `cancelId`        | `number?`                                                 | Index of button triggered by ESC key (default: last button) |
| `noLink`          | `boolean?`                                                | Disable command links on Windows (default: `false`)         |
| `checkboxLabel`   | `string?`                                                 | Text for optional checkbox                                  |
| `checkboxChecked` | `boolean?`                                                | Initial checkbox state (default: `false`)                   |

### Return Value

```typescript
{
  response: number // Index of clicked button (0-based)
  checkboxChecked: boolean // Checkbox state (false if no checkbox)
}
```

## Platform-Specific Behavior

### Windows

- Common buttons (OK, Cancel, Yes, No) appear as regular buttons
- Other labels appear as **command links** with arrow icons (unless `noLink: true`)
- Command links are the native Windows way to present multiple options
- Best for 3+ options with descriptive labels

### macOS

- All buttons appear horizontally
- Works best with 2-3 buttons
- More than 3 buttons may appear cramped
- Sheet style when attached to window

### Linux

- Follows system theme (GTK/Qt)
- Similar to Windows behavior
- Command links not available on all desktop environments

## Best Practices

1. **Use command links for descriptive actions**: "Save and Continue", "Delete All", "Import from Backup"
2. **Keep common actions as regular buttons**: OK, Cancel, Yes, No
3. **Limit to 4-5 buttons maximum** for good UX
4. **Set appropriate `defaultId`**: Most common action should be default
5. **Set appropriate `cancelId`**: Safe/cancel action should handle ESC key
6. **Use checkboxes for preferences**: "Don't show this again", "Remember my choice"
7. **Choose the right dialog type**: Use `warning` for destructive actions, `error` for failures

## Common Patterns

### Save/Discard/Cancel

```typescript
const result = await window.api.showDialog({
  message: 'Unsaved changes',
  buttons: ['Save', 'Discard', 'Cancel'],
  type: 'warning',
  defaultId: 0,
  cancelId: 2
})
```

### Delete with Confirmation Checkbox

```typescript
const result = await window.api.showDialog({
  message: 'Delete 150 manga?',
  detail: 'This will permanently delete all downloaded chapters',
  buttons: ['Delete', 'Cancel'],
  type: 'warning',
  defaultId: 1,
  checkboxLabel: 'I understand this cannot be undone'
})

if (result.response === 0 && result.checkboxChecked) {
  deleteManga()
}
```

### Multiple Options with Descriptions

```typescript
const result = await window.api.showDialog({
  message: 'Export library',
  detail: 'Choose the export format',
  buttons: ['DexReader format (full backup)', 'Tachiyomi format (cross-platform)', 'Cancel'],
  type: 'question',
  noLink: false // Use command links on Windows
})
```

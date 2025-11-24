# DexReader Native Menu Bar Structure

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document specifies the complete native menu bar structure for DexReader. The menu bar follows Windows desktop application conventions, providing keyboard-accessible access to all application features.

---

## Complete Menu Structure

### File Menu

```ui
File
├─ Check for Updates...            Ctrl+U
├─ ──────────────────────          (separator)
├─ Settings...                     Ctrl+,
├─ ──────────────────────          (separator)
└─ Exit                             Alt+F4
```

**Items**:

1. **Check for Updates...**
   - Opens update checker dialog
   - Accelerator: `Ctrl+U`
   - Always enabled

2. **Settings...**
   - Navigate to Settings view
   - Accelerator: `Ctrl+,`
   - Always enabled

3. **Exit**
   - Close application
   - Accelerator: `Alt+F4` (system default)
   - Always enabled

---

### View Menu

```ui
View
├─ Browse Manga                     Ctrl+1
├─ My Library                       Ctrl+2
├─ Downloads                        Ctrl+3
├─ ──────────────────────          (separator)
├─ Toggle Sidebar                   Ctrl+B
├─ Toggle Fullscreen                F11
├─ ──────────────────────          (separator)
├─ Reload                           Ctrl+R
└─ Toggle DevTools                  F12
```

**Items**:

1. **Browse Manga**
   - Navigate to Browse view
   - Accelerator: `Ctrl+1`
   - Always enabled

2. **My Library**
   - Navigate to Library view
   - Accelerator: `Ctrl+2`
   - Always enabled

3. **Downloads**
   - Navigate to Downloads view
   - Accelerator: `Ctrl+3`
   - Always enabled

4. **Toggle Sidebar**
   - Collapse/expand navigation sidebar
   - Accelerator: `Ctrl+B`
   - Always enabled
   - Checkmark shows current state (expanded/collapsed)

5. **Toggle Fullscreen**
   - Enter/exit fullscreen mode
   - Accelerator: `F11`
   - Always enabled
   - Electron role: `togglefullscreen`

6. **Reload**
   - Reload current view (refresh)
   - Accelerator: `Ctrl+R`
   - Always enabled
   - Electron role: `reload`

7. **Toggle DevTools**
   - Open/close developer tools
   - Accelerator: `F12`
   - Always enabled (development only in production)
   - Electron role: `toggleDevTools`

---

### Library Menu

```ui
Library
├─ Add to Favorites                 Ctrl+D
├─ Create Collection...             Ctrl+Shift+N
├─ Manage Collections...            Ctrl+Shift+C
├─ ──────────────────────          (separator)
├─ Import Library                   ▶
│  ├─ From DexReader Backup...
│  └─ From Tachiyomi Backup...
└─ Export Library                   ▶
   ├─ To DexReader Backup...        Ctrl+Shift+E
   └─ To Tachiyomi Format...
```

**Items**:

1. **Add to Favorites**
   - Add currently viewed manga to favorites
   - Accelerator: `Ctrl+D`
   - Enabled: When viewing manga detail
   - Disabled: In Browse/Library/Settings/Downloads views

2. **Create Collection...**
   - Open create collection dialog
   - Accelerator: `Ctrl+Shift+N`
   - Always enabled

3. **Manage Collections...**
   - Open collection management view
   - Accelerator: `Ctrl+Shift+C`
   - Always enabled

4. **Import Library** (submenu):
   - **From DexReader Backup...**
     - Opens file picker for `.dexreader` files
     - No accelerator
     - Always enabled

   - **From Tachiyomi Backup...**
     - Opens file picker for `.proto.gz` or `.tachibk` files
     - No accelerator
     - Always enabled

5. **Export Library** (submenu):
   - **To DexReader Backup...**
     - Opens save dialog for native backup
     - Accelerator: `Ctrl+Shift+E`
     - Always enabled

   - **To Tachiyomi Format...**
     - Opens save dialog for Tachiyomi-compatible file
     - No accelerator
     - Always enabled

---

### Tools Menu

```ui
Tools
├─ Download Chapter                 Ctrl+Shift+D    [context-aware]
├─ Download Manga                                   [context-aware]
├─ ──────────────────────          (separator)
├─ Clear Cache...
└─ Clear Reading History...
```

**Items**:

1. **Download Chapter**
   - Download currently viewed chapter for offline reading
   - Accelerator: `Ctrl+Shift+D`
   - **Enabled**: When viewing manga detail or reader view with a specific chapter
   - **Disabled**: In Browse/Library/Settings/Downloads views
   - Context-aware: Shows current chapter title when available

2. **Download Manga**
   - Download all chapters of current manga
   - No accelerator
   - **Enabled**: When viewing manga detail
   - **Disabled**: All other views
   - Context-aware: Shows current manga title when available

3. **Clear Cache...**
   - Opens confirmation dialog to clear cover image cache
   - No accelerator
   - Always enabled
   - Shows cache size in dialog

4. **Clear Reading History...**
   - Opens confirmation dialog to clear all reading progress
   - No accelerator
   - Always enabled
   - Warning: Cannot be undone

---

### Help Menu

```ui
Help
├─ Documentation                    F1
├─ Keyboard Shortcuts...            Ctrl+/
├─ ──────────────────────          (separator)
├─ Report Issue...
└─ About DexReader...
```

**Items**:

1. **Documentation**
   - Opens documentation in system browser
   - Accelerator: `F1`
   - Always enabled
   - Opens: `https://github.com/remichan97/DexReader/wiki`

2. **Keyboard Shortcuts...**
   - Opens in-app keyboard shortcut reference
   - Accelerator: `Ctrl+/`
   - Always enabled

3. **Report Issue...**
   - Opens GitHub issues page in system browser
   - No accelerator
   - Always enabled
   - Opens: `https://github.com/remichan97/DexReader/issues/new`

4. **About DexReader...**
   - Opens native About dialog with version info
   - No accelerator
   - Always enabled
   - Uses Electron `dialog.showMessageBox()` with app icon

---

## Context-Aware Menu Behavior

### Dynamic Enable/Disable

**Download Chapter** (`Ctrl+Shift+D`):

```typescript
// Enabled when:
- In Reader view (current chapter available)
- In Manga Detail view with chapter selected

// Disabled when:
- In Browse view
- In Library view (no specific manga/chapter)
- In Settings view
- In Downloads view
```

**Download Manga**:

```typescript
// Enabled when:
- In Manga Detail view (manga ID available)
- In Reader view (manga ID available)

// Disabled when:
- In Browse view (browsing multiple manga)
- In Library view (no specific manga selected)
- In Settings view
- In Downloads view
```

**Add to Favorites** (`Ctrl+D`):

```typescript
// Enabled when:
- In Manga Detail view
- In Reader view

// Disabled when:
- In Browse view
- In Library view
- In Settings view
- In Downloads view

// Label changes to "Remove from Favorites" if already favorited
```

### Dynamic Labels

```typescript
// Example: Download Chapter shows chapter title
"Download Chapter" → "Download Chapter 45: Chapter Name"

// Example: Add to Favorites changes when already added
"Add to Favorites" → "Remove from Favorites"

// Example: Download Manga shows manga title
"Download Manga" → "Download 'Manga Title'"
```

---

## Electron Implementation

### Menu Template

```typescript
// src/main/index.ts
import { Menu, app } from 'electron'

const menuTemplate: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Check for Updates...',
        accelerator: 'CmdOrCtrl+U',
        click: () => {
          // Trigger update check
        }
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('navigate', '/settings')
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: 'Alt+F4',
        role: 'quit'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Browse Manga',
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          mainWindow.webContents.send('navigate', '/browse')
        }
      },
      {
        label: 'My Library',
        accelerator: 'CmdOrCtrl+2',
        click: () => {
          mainWindow.webContents.send('navigate', '/library')
        }
      },
      {
        label: 'Downloads',
        accelerator: 'CmdOrCtrl+3',
        click: () => {
          mainWindow.webContents.send('navigate', '/downloads')
        }
      },
      { type: 'separator' },
      {
        label: 'Toggle Sidebar',
        accelerator: 'CmdOrCtrl+B',
        click: () => {
          mainWindow.webContents.send('toggle-sidebar')
        }
      },
      {
        label: 'Toggle Fullscreen',
        accelerator: 'F11',
        role: 'togglefullscreen'
      },
      { type: 'separator' },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        role: 'reload'
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'F12',
        role: 'toggleDevTools'
      }
    ]
  },
  {
    label: 'Library',
    submenu: [
      {
        id: 'add-to-favorites',
        label: 'Add to Favorites',
        accelerator: 'CmdOrCtrl+D',
        enabled: false, // Dynamically updated
        click: () => {
          mainWindow.webContents.send('add-to-favorites')
        }
      },
      {
        label: 'Create Collection...',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('create-collection')
        }
      },
      {
        label: 'Manage Collections...',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => {
          mainWindow.webContents.send('manage-collections')
        }
      },
      { type: 'separator' },
      {
        label: 'Import Library',
        submenu: [
          {
            label: 'From DexReader Backup...',
            click: async () => {
              const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Import Library',
                filters: [
                  { name: 'DexReader Backup', extensions: ['dexreader'] }
                ],
                properties: ['openFile']
              })
              if (!result.canceled) {
                mainWindow.webContents.send('import-library', result.filePaths[0])
              }
            }
          },
          {
            label: 'From Tachiyomi Backup...',
            click: async () => {
              const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Import Tachiyomi Backup',
                filters: [
                  { name: 'Tachiyomi Backup', extensions: ['proto.gz', 'tachibk'] }
                ],
                properties: ['openFile']
              })
              if (!result.canceled) {
                mainWindow.webContents.send('import-tachiyomi', result.filePaths[0])
              }
            }
          }
        ]
      },
      {
        label: 'Export Library',
        submenu: [
          {
            label: 'To DexReader Backup...',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: async () => {
              const result = await dialog.showSaveDialog(mainWindow, {
                title: 'Export Library',
                defaultPath: 'dexreader-backup.dexreader',
                filters: [
                  { name: 'DexReader Backup', extensions: ['dexreader'] }
                ]
              })
              if (!result.canceled) {
                mainWindow.webContents.send('export-library', result.filePath)
              }
            }
          },
          {
            label: 'To Tachiyomi Format...',
            click: async () => {
              const result = await dialog.showSaveDialog(mainWindow, {
                title: 'Export to Tachiyomi',
                defaultPath: 'tachiyomi-backup.proto.gz',
                filters: [
                  { name: 'Tachiyomi Backup', extensions: ['proto.gz'] }
                ]
              })
              if (!result.canceled) {
                mainWindow.webContents.send('export-tachiyomi', result.filePath)
              }
            }
          }
        ]
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        id: 'download-chapter',
        label: 'Download Chapter',
        accelerator: 'CmdOrCtrl+Shift+D',
        enabled: false, // Dynamically updated
        click: () => {
          mainWindow.webContents.send('download-chapter')
        }
      },
      {
        id: 'download-manga',
        label: 'Download Manga',
        enabled: false, // Dynamically updated
        click: () => {
          mainWindow.webContents.send('download-manga')
        }
      },
      { type: 'separator' },
      {
        label: 'Clear Cache...',
        click: () => {
          mainWindow.webContents.send('clear-cache')
        }
      },
      {
        label: 'Clear Reading History...',
        click: () => {
          mainWindow.webContents.send('clear-history')
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        accelerator: 'F1',
        click: () => {
          shell.openExternal('https://github.com/remichan97/DexReader/wiki')
        }
      },
      {
        label: 'Keyboard Shortcuts...',
        accelerator: 'CmdOrCtrl+/',
        click: () => {
          mainWindow.webContents.send('show-shortcuts')
        }
      },
      { type: 'separator' },
      {
        label: 'Report Issue...',
        click: () => {
          shell.openExternal('https://github.com/remichan97/DexReader/issues/new')
        }
      },
      {
        label: 'About DexReader...',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About DexReader',
            message: 'DexReader',
            detail: `Version ${app.getVersion()}\n\nA desktop manga reader for MangaDex\n\nDeveloped by remichan97`,
            buttons: ['OK'],
            noLink: true
          })
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)
```

### Dynamic Menu Updates

```typescript
// Update menu item state from renderer
ipcMain.on('update-menu-state', (event, state) => {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  // Update "Add to Favorites"
  const addToFavoritesItem = menu.getMenuItemById('add-to-favorites')
  if (addToFavoritesItem) {
    addToFavoritesItem.enabled = state.canAddToFavorites
    addToFavoritesItem.label = state.isFavorited
      ? 'Remove from Favorites'
      : 'Add to Favorites'
  }

  // Update "Download Chapter"
  const downloadChapterItem = menu.getMenuItemById('download-chapter')
  if (downloadChapterItem) {
    downloadChapterItem.enabled = state.canDownloadChapter
    if (state.chapterTitle) {
      downloadChapterItem.label = `Download ${state.chapterTitle}`
    }
  }

  // Update "Download Manga"
  const downloadMangaItem = menu.getMenuItemById('download-manga')
  if (downloadMangaItem) {
    downloadMangaItem.enabled = state.canDownloadManga
    if (state.mangaTitle) {
      downloadMangaItem.label = `Download '${state.mangaTitle}'`
    }
  }
})
```

---

## Keyboard Shortcuts Reference

### Global Shortcuts

| Shortcut | Action | Menu Location |
|----------|--------|---------------|
| `Ctrl+1` | Navigate to Browse | View → Browse Manga |
| `Ctrl+2` | Navigate to Library | View → My Library |
| `Ctrl+3` | Navigate to Downloads | View → Downloads |
| `Ctrl+,` | Open Settings | File → Settings... |
| `Ctrl+B` | Toggle Sidebar | View → Toggle Sidebar |
| `Ctrl+R` | Reload View | View → Reload |
| `Ctrl+U` | Check for Updates | File → Check for Updates... |
| `F1` | Open Documentation | Help → Documentation |
| `F11` | Toggle Fullscreen | View → Toggle Fullscreen |
| `F12` | Toggle DevTools | View → Toggle DevTools |
| `Alt+F4` | Exit Application | File → Exit |

### Context-Aware Shortcuts

| Shortcut | Action | Menu Location | Context |
|----------|--------|---------------|---------|
| `Ctrl+D` | Add/Remove Favorites | Library → Add to Favorites | Manga Detail/Reader |
| `Ctrl+Shift+D` | Download Chapter | Tools → Download Chapter | Manga Detail/Reader |
| `Ctrl+Shift+N` | Create Collection | Library → Create Collection... | Any View |
| `Ctrl+Shift+C` | Manage Collections | Library → Manage Collections... | Any View |
| `Ctrl+Shift+E` | Export Library | Library → Export Library → DexReader | Any View |
| `Ctrl+/` | Show Keyboard Shortcuts | Help → Keyboard Shortcuts... | Any View |

---

## Accessibility

### Keyboard Navigation

- **Alt Key**: Activates menu bar (underlines access keys)
- **Alt+F**: Opens File menu
- **Alt+V**: Opens View menu
- **Alt+L**: Opens Library menu
- **Alt+T**: Opens Tools menu
- **Alt+H**: Opens Help menu
- **Arrow Keys**: Navigate within menus
- **Enter**: Activate selected menu item
- **Escape**: Close menu

### Screen Reader Support

All menu items have:

- Clear, descriptive labels
- Accelerator hints announced
- Enabled/disabled state announced
- Submenu indicators announced

---

## Platform-Specific Considerations

### Windows

- **Alt+F4**: System-wide quit shortcut (respected)
- **F10**: Alternative menu activation key
- **CmdOrCtrl**: Maps to `Ctrl` key

### macOS (Future Support)

- **Cmd+Q**: Quit application (instead of Alt+F4)
- **Cmd+,**: Settings (already using CmdOrCtrl)
- **Cmd+H**: Hide window (system default)
- **CmdOrCtrl**: Maps to `Cmd` key

### Linux

- Similar to Windows behavior
- **CmdOrCtrl**: Maps to `Ctrl` key

---

## Summary

DexReader's native menu bar provides:

✅ **Complete Feature Access**: All features accessible via menu (no hidden functions)
✅ **Keyboard Shortcuts**: Comprehensive accelerators for power users
✅ **Context Awareness**: Menu items enable/disable based on current view
✅ **Dynamic Labels**: Labels update to show current context (chapter title, etc.)
✅ **Platform Native**: Follows Windows desktop app conventions
✅ **Accessible**: Full keyboard navigation and screen reader support
✅ **Discoverable**: Users can explore features via menu structure

**Review Status**: ✅ Ready for implementation (P1-T02)

---

*Menu bar structure created: 24 November 2025*
*Part of P1-T01 deliverables*

interface IpcChannelDefinition {
  channel: string
  category: 'filesystem' | 'theme' | 'navigation' | 'menu' | 'dialogue' | 'window'
  type: 'invoke' | 'send' | 'on'
  description: string
  requestType?: string
  responseType?: string
  errorTypes?: string[]
  example?: string
}

export const IPC_REGISTRY: IpcChannelDefinition[] = [
  // Filesystem IPC channels
  {
    channel: 'fs:read-file',
    category: 'filesystem',
    type: 'invoke',
    description: 'Reads the contents of a file',
    requestType: 'string', // file path
    responseType: 'string', // file contents
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:read-file", "/path/to/file.txt")'
  },
  {
    channel: 'fs:write-file',
    category: 'filesystem',
    type: 'invoke',
    description: 'Writes data to a file',
    requestType: 'string, string | Buffer', // file path, data
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:write-file", "/path/to/file.txt", "data to write")'
  },
  {
    channel: 'fs:copy-file',
    category: 'filesystem',
    type: 'invoke',
    description: 'Copies a file from source to destination',
    requestType: 'string, string', // source path, destination path
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:copy-file", "/path/to/source.txt", "/path/to/dest.txt")'
  },
  {
    channel: 'fs:append-file',
    category: 'filesystem',
    type: 'invoke',
    description: 'Appends data to a file',
    requestType: 'string, string | Buffer', // file path, data
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:append-file", "/path/to/file.txt", "data to append")'
  },
  {
    channel: 'fs:rename',
    category: 'filesystem',
    type: 'invoke',
    description: 'Renames a file or directory',
    requestType: 'string, string', // old path, new path
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:rename", "/path/to/oldname.txt", "/path/to/newname.txt")'
  },
  {
    channel: 'fs:is-exists',
    category: 'filesystem',
    type: 'invoke',
    description: 'Checks if a file or directory exists',
    requestType: 'string', // path
    responseType: 'boolean', // exists
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:is-exists", "/path/to/file-or-dir")'
  },
  {
    channel: 'fs:mkdir',
    category: 'filesystem',
    type: 'invoke',
    description: 'Creates a new directory',
    requestType: 'string', // directory path
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:mkdir", "/path/to/new-directory")'
  },
  {
    channel: 'fs:rmdir',
    category: 'filesystem',
    type: 'invoke',
    description: 'Removes a directory',
    requestType: 'string', // directory path
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:rmdir", "/path/to/directory")'
  },
  {
    channel: 'fs:unlink',
    category: 'filesystem',
    type: 'invoke',
    description: 'Deletes a file',
    requestType: 'string', // file path
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:unlink", "/path/to/file.txt")'
  },
  {
    channel: 'fs:rm',
    category: 'filesystem',
    type: 'invoke',
    description: 'Deletes a directory',
    requestType: 'string, { recursive?: boolean }', // directory path, options
    responseType: 'boolean', // success
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:rm", "/path/to/directory", { recursive: true })'
  },
  {
    channel: 'fs:readdir',
    category: 'filesystem',
    type: 'invoke',
    description: 'Reads the contents of a directory',
    requestType: 'string', // directory path
    responseType: 'string[]', // list of file and directory names
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:readdir", "/path/to/directory")'
  },
  {
    channel: 'fs:get-stats',
    category: 'filesystem',
    type: 'invoke',
    description: 'Gets the stats of a file or directory',
    requestType: 'string', // path
    responseType:
      '{ isFile: boolean; isDirectory: boolean; size: number; created: string; modified: string }', // stats object
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:get-stats", "/path/to/file-or-dir")'
  },
  {
    channel: 'fs:stat',
    category: 'filesystem',
    type: 'invoke',
    description: 'Gets the stats of a file or directory',
    requestType: 'string', // path
    responseType:
      '{ isFile: boolean; isDirectory: boolean; size: number; created: string; modified: string }', // stats object
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:stat", "/path/to/file-or-dir")'
  },
  {
    channel: 'fs:get-allowed-paths',
    category: 'filesystem',
    type: 'invoke',
    description: 'Gets the list of allowed filesystem paths',
    responseType: 'string[]', // list of allowed paths
    errorTypes: [],
    example: 'ipcRenderer.invoke("fs:get-allowed-paths")'
  },
  {
    channel: 'fs:select-downloads-folder',
    category: 'filesystem',
    type: 'invoke',
    description: 'Opens a dialog to select the downloads folder',
    responseType: 'string', // selected folder path
    errorTypes: ['FileSystemError', 'ValidationError'],
    example: 'ipcRenderer.invoke("fs:select-downloads-folder")'
  },
  // Theme IPC channels
  {
    channel: 'get-theme',
    category: 'theme',
    type: 'invoke',
    description: 'Gets the current system theme (light or dark)',
    responseType: "'light' | 'dark'",
    errorTypes: [],
    example: 'ipcRenderer.invoke("get-theme")'
  },
  {
    channel: 'theme:get-system-accent-color',
    category: 'theme',
    type: 'invoke',
    description: 'Gets the system accent color',
    responseType: 'string', // accent color in hex format
    errorTypes: [],
    example: 'ipcRenderer.invoke("theme:get-system-accent-color")'
  },
  {
    channel: 'theme-changed',
    category: 'theme',
    type: 'on',
    description: 'Event fired when the system theme changes',
    requestType: "'light' | 'dark'",
    example: "ipcRenderer.on('theme-changed', (_, theme) => console.log(theme))"
  },
  {
    channel: 'accent-color-changed',
    category: 'theme',
    type: 'on',
    description: 'Event fired when the system accent color changes',
    requestType: 'string', // hex color
    example: "ipcRenderer.on('accent-color-changed', (_, color) => console.log(color))"
  },
  // Navigation IPC channels
  {
    channel: 'navigate',
    category: 'navigation',
    type: 'on',
    description: 'Event fired when the app should navigate to a specific route',
    requestType: 'string', // route path
    example: "ipcRenderer.on('navigate', (_, route) => navigate(route))"
  },
  // Dialogue IPC channels
  {
    channel: 'show-confirm-dialog',
    category: 'dialogue',
    type: 'invoke',
    description:
      'Shows a simple yes/no confirmation dialogue. Use this for quick confirmations that only need Cancel/Confirm',
    requestType: 'string, string?', // message, optional detail
    responseType: 'boolean', // true if confirmed, false if cancelled
    errorTypes: [],
    example:
      'ipcRenderer.invoke("show-confirm-dialog", "Delete this item?", "This cannot be undone")'
  },
  {
    channel: 'show-dialog',
    category: 'dialogue',
    type: 'invoke',
    description:
      'Shows a native dialogue with custom buttons and options. Use this when you need 3+ choices, checkboxes, or custom button labels. Supports multiple buttons, checkboxes, and different dialogue types',
    requestType:
      '{ message: string; detail?: string; buttons?: string[]; type?: "none" | "info" | "error" | "question" | "warning"; defaultId?: number; cancelId?: number; noLink?: boolean; checkboxLabel?: string; checkboxChecked?: boolean }',
    responseType: '{ response: number; checkboxChecked: boolean }',
    errorTypes: [],
    example:
      'ipcRenderer.invoke("show-dialog", { message: "Choose action", buttons: ["Save", "Discard", "Cancel"], type: "question" })'
  },
  // Menu IPC channels
  {
    channel: 'update-menu-state',
    category: 'menu',
    type: 'send',
    description: 'Updates the enabled/disabled state of menu items dynamically',
    requestType:
      '{ canAddToFavorites?: boolean; isFavorited?: boolean; canDownloadChapter?: boolean; chapterTitle?: string; canDownloadManga?: boolean; mangaTitle?: string }',
    example:
      "ipcRenderer.send('update-menu-state', { canAddToFavorites: true, isFavorited: false })"
  },
  {
    channel: 'check-for-updates',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks File > Check for Updates',
    example: "ipcRenderer.on('check-for-updates', () => checkForUpdates())"
  },
  {
    channel: 'add-to-favorites',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Library > Add to Favourites',
    example: "ipcRenderer.on('add-to-favorites', () => addCurrentMangaToFavorites())"
  },
  {
    channel: 'create-collection',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Library > Create Collection',
    example: "ipcRenderer.on('create-collection', () => openCreateCollectionDialog())"
  },
  {
    channel: 'manage-collections',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Library > Manage Collections',
    example: "ipcRenderer.on('manage-collections', () => openManageCollectionsDialog())"
  },
  {
    channel: 'import-library',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user selects a DexReader backup file to import',
    requestType: 'string', // file path
    example: "ipcRenderer.on('import-library', (_, filePath) => importLibrary(filePath))"
  },
  {
    channel: 'import-tachiyomi',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user selects a Tachiyomi backup file to import',
    requestType: 'string', // file path
    example: "ipcRenderer.on('import-tachiyomi', (_, filePath) => importTachiyomiBackup(filePath))"
  },
  {
    channel: 'export-library',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user chooses where to save a DexReader backup',
    requestType: 'string', // file path
    example: "ipcRenderer.on('export-library', (_, filePath) => exportLibrary(filePath))"
  },
  {
    channel: 'export-tachiyomi',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user chooses where to save a Tachiyomi backup',
    requestType: 'string', // file path
    example: "ipcRenderer.on('export-tachiyomi', (_, filePath) => exportToTachiyomi(filePath))"
  },
  {
    channel: 'download-chapter',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Tools > Download Chapter',
    example: "ipcRenderer.on('download-chapter', () => downloadCurrentChapter())"
  },
  {
    channel: 'download-manga',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Tools > Download Manga',
    example: "ipcRenderer.on('download-manga', () => downloadCurrentManga())"
  },
  {
    channel: 'clear-metadata',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Tools > Clear Cache',
    example: "ipcRenderer.on('clear-metadata', () => clearCachedMetadata())"
  },
  {
    channel: 'clear-history',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Tools > Clear Reading History',
    example: "ipcRenderer.on('clear-history', () => clearReadingHistory())"
  },
  {
    channel: 'show-shortcuts',
    category: 'menu',
    type: 'on',
    description: 'Event fired when user clicks Help > Keyboard Shortcuts',
    example: "ipcRenderer.on('show-shortcuts', () => showKeyboardShortcutsDialog())"
  }
]

export function getChannelsByCategory(
  category: IpcChannelDefinition['category']
): IpcChannelDefinition[] {
  return IPC_REGISTRY.filter((channel) => channel.category === category)
}

export function getChannelDefinition(channelName: string): IpcChannelDefinition | undefined {
  return IPC_REGISTRY.find((channel) => channel.channel === channelName)
}

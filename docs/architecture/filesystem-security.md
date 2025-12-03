# Filesystem Security Model

**Last Updated**: 3 December 2025
**Status**: ✅ Implemented (P1-T05)
**Version**: 1.0.0

---

## Overview

DexReader implements a restricted filesystem access model that limits all file operations to two explicitly allowed directory trees. This security-first approach follows the principle of least privilege, ensuring the application can only access directories it explicitly needs for functionality.

**Security Principle**: DexReader should only access directories it needs. No access to system directories, user documents, or other applications' data.

---

## Allowed Directories

### 1. AppData Directory

**Location** (automatically determined by Electron):

- **Windows**: `C:\Users\<username>\AppData\Roaming\dexreader`
- **macOS**: `~/Library/Application Support/dexreader`
- **Linux**: `~/.config/dexreader`

**Contents**:

- `settings.json` - Application settings and preferences
- `cache/` - Cover image cache
- `logs/` - Application logs
- `downloads/` - Default downloads location (see below)

**Characteristics**:

- Automatically managed by Electron via `app.getPath('userData')`
- No user configuration needed
- Persistent across app updates
- Cleared only by explicit user action or uninstall
- **Always allowed** - No validation needed for this directory

### 2. Downloads Directory

**Default Location**: `<AppData>/downloads`

- **Windows**: `C:\Users\<username>\AppData\Roaming\dexreader\downloads`
- **macOS**: `~/Library/Application Support/dexreader/downloads`
- **Linux**: `~/.config/dexreader/downloads`

**User-Configurable**: Yes (optional), via Settings → Storage → Downloads Location

**Contents**:

- `manga/<mangaId>/chapters/<chapterId>/` - Downloaded manga chapters
- `manga/<mangaId>/metadata.json` - Manga metadata
- User-initiated explicit downloads only

**Characteristics**:

- Works out-of-the-box with secure defaults inside AppData
- User can optionally change to custom location (e.g., larger drive)
- Changed via native OS folder picker (prevents invalid path entry)
- Custom path validated before accepting
- Persisted in `settings.json` (`downloadsPath` key)

---

## Forbidden Access

**DexReader MUST NOT access**:

❌ System directories:

- Windows: `System32`, `Program Files`, `Windows`
- macOS: `/System`, `/usr`, `/bin`, `/sbin`
- Linux: `/usr`, `/bin`, `/sbin`, `/etc`, `/root`

❌ User's personal directories (unless explicitly selected):

- Documents, Pictures, Videos, Desktop, Downloads (system)

❌ Other applications' data:

- Other apps' AppData directories
- Browser data, game saves, etc.

❌ Registry (Windows):

- Except Electron-provided APIs for theme detection

❌ Network locations:

- UNC paths (`\\server\share`)
- SMB shares, NFS mounts

❌ Path traversal:

- `../../../etc/passwd`
- `..\..\Windows\System32`

❌ Symlinks pointing outside allowed directories

---

## Implementation

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Renderer Process                   │
│              (React UI Components)                  │
│                                                     │
│  window.fileSystem.readFile(path)                  │
│  window.fileSystem.writeFile(path, data)           │
│  window.fileSystem.getAllowedPaths()               │
│  window.fileSystem.selectDownloadsFolder()         │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ IPC Bridge (contextBridge)
                   │
┌──────────────────▼──────────────────────────────────┐
│               Preload Script                        │
│         (src/preload/index.ts)                      │
│                                                     │
│  Exposes secure filesystem API via contextBridge   │
│  All IPC calls go through here                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ IPC Channel (electron)
                   │
┌──────────────────▼──────────────────────────────────┐
│               Main Process                          │
│           (src/main/index.ts)                       │
│                                                     │
│  IPC Handlers:                                      │
│  - fs:read-file                                     │
│  - fs:write-file                                    │
│  - fs:mkdir, fs:unlink, fs:rm                       │
│  - fs:get-allowed-paths                             │
│  - fs:select-downloads-folder                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Calls
                   │
┌──────────────────▼──────────────────────────────────┐
│          Filesystem Security Layer                  │
│    (src/main/filesystem/secureFs.ts)                │
│                                                     │
│  All operations call validatePath() first          │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Validates
                   │
┌──────────────────▼──────────────────────────────────┐
│           Path Validator                            │
│    (src/main/filesystem/pathValidator.ts)           │
│                                                     │
│  1. Normalize path (resolve, canonicalize)         │
│  2. Check if path starts with AppData or Downloads │
│  3. Throw error if not allowed                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ If valid
                   │
┌──────────────────▼──────────────────────────────────┐
│            Node.js fs/promises                      │
│         (Native filesystem operations)              │
└─────────────────────────────────────────────────────┘
```

### Core Modules

#### 1. Path Validator (`src/main/filesystem/pathValidator.ts`)

**Purpose**: Centralized path validation and normalization.

**Key Functions**:

```typescript
// Normalize path to absolute canonical form
function normalizePath(inputPath: string): string

// Check if path is within allowed directories
function isPathAllowed(inputPath: string): boolean

// Validate and throw if path is not allowed
function validatePath(inputPath: string): string

// Get allowed paths
function getAppDataPath(): string
function getDownloadsPath(): string

// Update downloads path (called by settingsManager)
function updateDownloadsPath(newPath: string): void

// Validate directory exists and is accessible
async function validateDirectoryPath(dirPath: string): Promise<void>
```

**Security Features**:

- ✅ Path normalization prevents traversal attacks
- ✅ Canonical path resolution prevents symlink exploits
- ✅ Prefix matching ensures only allowed directories are accessed
- ✅ Throws descriptive errors for unauthorized access attempts

#### 2. Secure Filesystem (`src/main/filesystem/secureFs.ts`)

**Purpose**: Wrapper around Node.js `fs/promises` with automatic path validation.

**Available Operations**:

```typescript
export const secureFs = {
  // Read operations
  async readFile(filePath: string, encoding?: BufferEncoding): Promise<string | Buffer>
  async readDir(dirPath: string): Promise<string[]>
  async stat(path: string): Promise<Stats>
  async isExists(path: string): Promise<boolean>

  // Write operations
  async writeFile(filePath: string, data: string | Buffer, encoding?: BufferEncoding): Promise<void>
  async appendFile(filePath: string, data: string | Buffer): Promise<void>

  // Directory operations
  async mkdir(dirPath: string): Promise<string | undefined>
  async ensureDir(dirPath: string): Promise<string | undefined>

  // Delete operations
  async deleteFile(filePath: string): Promise<void>
  async deleteDir(dirPath: string, options?: { recursive?: boolean }): Promise<void>

  // File operations
  async copyFile(srcPath: string, destPath: string): Promise<void>
  async rename(oldPath: string, newPath: string): Promise<void>
}
```

**Security Features**:

- ✅ Every operation calls `validatePath()` before execution
- ✅ Multi-path operations (copy, rename) validate both paths
- ✅ Parent directories automatically created when writing files
- ✅ Consistent error messages across all operations

#### 3. Settings Manager (`src/main/filesystem/settingsManager.ts`)

**Purpose**: Persist application settings to AppData.

**Key Functions**:

```typescript
// Load settings from disk (creates defaults if missing)
async function loadSettings(): Promise<AppSettings>

// Save settings to disk
async function saveSettings(settings: AppSettings): Promise<void>

// Update specific setting
async function updateSettings<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void>

// Get specific setting
async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]>

// Set downloads path with validation
async function setDownloadsPath(newPath: string): Promise<void>

// Initialize downloads path on app startup
async function initializeDownloadsPath(): Promise<void>
```

**Settings Schema**:

```typescript
interface AppSettings {
  downloadsPath: string | null // null = use default (AppData/downloads)
  theme: 'light' | 'dark' | 'system'
  accentColor: string | undefined // Hex color, undefined = use system
}
```

**Storage Location**: `<AppData>/settings.json`

**Security Features**:

- ✅ Settings file always in AppData (no user control over location)
- ✅ Downloads path validated before accepting
- ✅ Graceful fallback to defaults if settings file corrupted

---

## Usage Examples

### Basic File Operations

```typescript
// In renderer process (React components)

// Read a file
try {
  const content = await window.fileSystem.readFile('/path/to/file.json', 'utf-8')
  const data = JSON.parse(content)
} catch (error) {
  console.error('Failed to read file:', error)
}

// Write a file (parent directories created automatically)
try {
  await window.fileSystem.writeFile('/path/to/data.json', JSON.stringify(data, null, 2), 'utf-8')
} catch (error) {
  console.error('Failed to write file:', error)
}

// Check if file exists
const exists = await window.fileSystem.isExists('/path/to/file')
if (exists) {
  // File exists, proceed
}

// Get file stats
const stats = await window.fileSystem.stat('/path/to/file')
console.log('File size:', stats.size, 'bytes')
console.log('Last modified:', stats.modified)
```

### Directory Operations

```typescript
// Create directory (recursive)
await window.fileSystem.mkdir('/path/to/nested/directory')

// Read directory contents
const files = await window.fileSystem.readdir('/path/to/directory')
console.log('Files:', files)

// Delete directory (recursive)
await window.fileSystem.rmdir('/path/to/directory', { recursive: true })
```

### Get Allowed Paths

```typescript
// Get current allowed paths
const paths = await window.fileSystem.getAllowedPaths()
console.log('AppData:', paths.appData)
console.log('Downloads:', paths.downloads)

// Use in path construction
const coverPath = `${paths.appData}/cache/covers/${mangaId}.jpg`
const chapterPath = `${paths.downloads}/manga/${mangaId}/chapters/${chapterId}/`
```

### Select Downloads Folder

```typescript
// Show native folder picker
const result = await window.fileSystem.selectDownloadsFolder()

if (!result.cancelled && result.path) {
  console.log('New downloads folder:', result.path)
  // Path is automatically validated and saved
} else {
  console.log('User cancelled folder selection')
}
```

### Working with Settings

```typescript
// Settings are automatically loaded on app startup
// But if you need to access them directly in main process:

import { loadSettings, updateSettings } from './filesystem/settingsManager'

// Load current settings
const settings = await loadSettings()
console.log('Theme:', settings.theme)
console.log('Downloads path:', settings.downloadsPath)

// Update a setting
await updateSettings('theme', 'dark')

// Settings are persisted to AppData/settings.json
```

---

## Security Guarantees

### What This System Prevents

✅ **Path Traversal Attacks**:

```typescript
// ❌ This will fail:
await window.fileSystem.readFile('../../../etc/passwd')
// Error: Access to the path "..." is not allowed.
```

✅ **Accessing System Directories**:

```typescript
// ❌ This will fail:
await window.fileSystem.readFile('C:\\Windows\\System32\\config\\sam')
// Error: Access to the path "..." is not allowed.
```

✅ **Accessing User's Documents**:

```typescript
// ❌ This will fail (unless explicitly selected via folder picker):
await window.fileSystem.readFile('C:\\Users\\User\\Documents\\private.txt')
// Error: Access to the path "..." is not allowed.
```

✅ **Symlink Exploits**:

```typescript
// ❌ Symlinks pointing outside allowed directories are resolved and blocked:
// /path/in/appdata/symlink -> /etc/passwd
await window.fileSystem.readFile('/path/in/appdata/symlink')
// Error: Access to the path "/etc/passwd" is not allowed.
```

### What This System Allows

✅ **Reading/Writing AppData**:

```typescript
// ✅ Allowed:
await window.fileSystem.readFile(appData + '/settings.json', 'utf-8')
await window.fileSystem.writeFile(appData + '/logs/app.log', logData, 'utf-8')
```

✅ **Reading/Writing Downloads**:

```typescript
// ✅ Allowed (default or custom location):
await window.fileSystem.writeFile(downloads + '/manga/123/ch1/page1.jpg', imageBuffer)
```

✅ **User-Selected Directories**:

```typescript
// ✅ Allowed - User explicitly chose this directory:
const result = await window.fileSystem.selectDownloadsFolder()
// Native OS folder picker shown, path validated
// New path is now part of allowed directories
```

---

## Error Handling

### Error Types

**Path Validation Errors**:

```typescript
try {
  await window.fileSystem.readFile('/forbidden/path')
} catch (error) {
  // Error: Access to the path "/forbidden/path" is not allowed.
}
```

**File Not Found**:

```typescript
try {
  await window.fileSystem.readFile(appData + '/nonexistent.json', 'utf-8')
} catch (error) {
  // Error: Unable to read file: ENOENT: no such file or directory
}
```

**Permission Denied**:

```typescript
try {
  await window.fileSystem.writeFile(downloads + '/readonly.txt', 'data')
} catch (error) {
  // Error: Unable to write file: EACCES: permission denied
}
```

### Best Practices

✅ **DO**: Always wrap filesystem calls in try-catch:

```typescript
try {
  const data = await window.fileSystem.readFile(path, 'utf-8')
  // Process data
} catch (error) {
  console.error('Failed to read file:', error)
  // Show user-friendly error message
}
```

✅ **DO**: Check if file exists before reading (optional):

```typescript
if (await window.fileSystem.isExists(path)) {
  const data = await window.fileSystem.readFile(path, 'utf-8')
}
```

✅ **DO**: Use path construction with allowed paths:

```typescript
const paths = await window.fileSystem.getAllowedPaths()
const settingsPath = `${paths.appData}/settings.json`
```

❌ **DON'T**: Hardcode absolute paths:

```typescript
// ❌ Bad - breaks on different systems
await window.fileSystem.readFile('C:\\Users\\User\\AppData\\...')

// ✅ Good - use getAllowedPaths()
const { appData } = await window.fileSystem.getAllowedPaths()
await window.fileSystem.readFile(`${appData}/settings.json`)
```

❌ **DON'T**: Concatenate user input directly into paths:

```typescript
// ❌ Bad - vulnerable to path traversal
const userFile = userInput // Could be "../../../etc/passwd"
await window.fileSystem.readFile(downloads + '/' + userFile)

// ✅ Good - validate and sanitize user input first
const sanitizedName = userInput.replace(/[^a-zA-Z0-9_-]/g, '_')
await window.fileSystem.readFile(`${downloads}/${sanitizedName}`)
```

---

## Configuration

### Changing Downloads Location

**Via Settings UI** (Recommended):

1. Open Settings → Storage
2. Click "Browse..." button
3. Select folder in native OS dialog
4. Path is validated and saved automatically

**Programmatically** (Advanced):

```typescript
// In main process only
import { setDownloadsPath } from './filesystem/settingsManager'

try {
  await setDownloadsPath('/path/to/new/downloads')
  console.log('Downloads path updated')
} catch (error) {
  console.error('Failed to set downloads path:', error)
  // Path doesn't exist or not accessible
}
```

### Settings Persistence

Settings are automatically saved to `<AppData>/settings.json`:

```json
{
  "downloadsPath": "D:\\Manga\\DexReader",
  "theme": "dark",
  "accentColor": "#0078d4"
}
```

**Persistence Behavior**:

- `downloadsPath: null` → Use default (AppData/downloads)
- `downloadsPath: "/path"` → Use custom path
- `theme: "system"` → Follow OS theme
- `accentColor: undefined` → Use system accent color

**Settings Loaded**:

- On app startup (before window creation)
- Automatically restored from disk
- Validated on load (falls back to defaults if invalid)

---

## Testing

### Manual Testing Checklist

**Path Validation**:

- [ ] Reading file in AppData succeeds
- [ ] Writing file to Downloads succeeds
- [ ] Reading file in Documents fails with error
- [ ] Reading file in System32 fails with error
- [ ] Path traversal (`../../../etc/passwd`) fails with error

**Downloads Folder**:

- [ ] Opens Settings → Storage
- [ ] Clicks "Browse..." button
- [ ] Selects valid folder
- [ ] Path updates in UI
- [ ] Restarts app
- [ ] Path persists after restart

**File Operations**:

- [ ] Create directory recursively
- [ ] Write file with auto-created parent dirs
- [ ] Read file back
- [ ] Copy file within allowed paths
- [ ] Delete file
- [ ] Delete directory recursively

**Edge Cases**:

- [ ] Very long paths (near system limits)
- [ ] Paths with special characters
- [ ] Symlinks pointing to allowed paths
- [ ] Symlinks pointing outside allowed paths (should fail)
- [ ] Non-existent paths (should fail gracefully)

### Automated Testing (Phase 5)

Unit tests to be added:

```typescript
// pathValidator.test.ts
describe('normalizePath', () => {
  it('converts relative paths to absolute', () => {})
  it('resolves .. segments', () => {})
  it('handles redundant separators', () => {})
})

describe('isPathAllowed', () => {
  it('allows AppData paths', () => {})
  it('allows Downloads paths', () => {})
  it('denies system paths', () => {})
  it('denies path traversal attacks', () => {})
})
```

---

## Performance Considerations

**Path Validation Overhead**:

- Path validation is extremely fast (< 1ms)
- Only string operations, no disk I/O
- Negligible impact on filesystem operations

**Caching**:

- Allowed paths cached in memory (updated only when downloads path changes)
- No repeated disk reads for validation

**Optimization**:

- All operations use `fs/promises` (async, non-blocking)
- Parent directory creation happens once per write
- No unnecessary stat() calls

---

## Known Limitations

### 1. Hard Links

**Status**: Not specifically handled
**Impact**: Low (hard links create multiple directory entries for same inode)
**Mitigation**: Path validation checks the path itself, not the inode

### 2. Junction Points (Windows)

**Status**: Resolved to real path and checked
**Impact**: Low (similar to symlinks)
**Mitigation**: `path.resolve()` follows junctions, then validation applies

### 3. Network Paths (UNC)

**Status**: Currently allowed if user explicitly selects via folder picker
**Impact**: Medium (disconnected network drives cause errors)
**Future**: Consider blocking UNC paths entirely or adding reconnection logic

### 4. Case Sensitivity

**Status**: Follows OS behavior (Windows: insensitive, Linux: sensitive)
**Impact**: Low (path.normalize() handles this)
**Mitigation**: Use OS-native path comparison

---

## Future Enhancements

### Phase 3: Additional Security

- [ ] **Settings Backup**: Automatic backup of settings.json
- [ ] **Restore from Backup**: Recovery if settings corrupted
- [ ] **Path Blacklist**: Explicitly forbidden paths beyond system directories

### Phase 4: Advanced Features

- [ ] **Quota Management**: Track disk usage in downloads directory
- [ ] **Disk Space Warnings**: Alert when approaching limit
- [ ] **Auto-cleanup**: Remove old chapters to free space
- [ ] **File Encryption**: Encrypt downloads at rest (optional)

### Phase 5: Testing

- [ ] **Unit Tests**: Full test coverage for path validation
- [ ] **Integration Tests**: Test IPC handlers with real filesystem
- [ ] **E2E Tests**: Test Settings UI with Playwright
- [ ] **Security Audit**: Third-party security review

---

## Troubleshooting

### "Access to the path is not allowed"

**Cause**: Trying to access file outside AppData or Downloads

**Solution**:

1. Check if path is within allowed directories
2. Use `getAllowedPaths()` to get valid base paths
3. Construct paths relative to allowed directories

### Downloads folder not accessible after restart

**Cause**: Custom downloads path no longer exists or accessible

**Solution**:

1. App automatically falls back to default (AppData/downloads)
2. Check console for warning message
3. Reselect downloads folder in Settings

### "Unable to read file: ENOENT"

**Cause**: File doesn't exist

**Solution**:

1. Check file path spelling
2. Use `isExists()` before reading
3. Ensure file was written successfully

### Settings not persisting

**Cause**: Settings file corrupted or AppData not writable

**Solution**:

1. Check AppData directory exists
2. Check file permissions
3. Delete settings.json (will recreate with defaults)

---

## References

### Related Documentation

- [System Pattern](../memory-bank/system-pattern.md) - Development guidelines
- [Tech Context](../memory-bank/tech-context.md) - Technology stack
- [State Management](./state-management.md) - Zustand stores

### External Resources

- [Electron Security Guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [Node.js fs/promises API](https://nodejs.org/api/fs.html#promises-api)
- [Path Traversal (OWASP)](https://owasp.org/www-community/attacks/Path_Traversal)

---

**Document Status**: ✅ Complete
**Last Review**: 3 December 2025
**Next Review**: Phase 3 (Security Audit)

# DexReader System Pattern

**Last Updated**: 6 September 2026
**Version**: 1.0.0 (v1.0 Release Baseline)
**Architecture**: Electron Multi-Process Desktop Application
**Status**: Active - This document defines architectural patterns, design principles, and technical decisions

> **Note**: For technology stack versions, dependencies, and build configuration details, see `tech-context.md`

---

## Localisation & Language

### Display Language

**Default**: **British English (en-GB)**

**Spelling Conventions**: Use British English consistently (Favourites, Colour, Organise, Realise, Centre)

**Date Format**: Default DD/MM/YYYY (British format), user-configurable in Settings for future i18n support

**Writing Style**:

- British English across UI, documentation, and code comments
- **Casual, friendly tone** - Conversational UI, avoid formality
- Error messages: clear, actionable, friendly (e.g., "Oops! Couldn't load that chapter")
- Use contractions and natural language
- **Icons**: Always use Fluent UI icons from `@fluentui/react-icons` - never unicode emoji (inconsistent rendering)
- Avoid corporate jargon or overly technical language in user-facing text

---

## MangaDex API Integration

### Image Proxy Architecture

**Critical Requirement**: MangaDex blocks direct image hotlinking - all images MUST be proxied through the main process.

**Dual Protocol Handler Architecture**:

1. **`mangadex://` Protocol** - Custom protocol for online image streaming
   - Replaces `https://` URLs with native Chromium integration
   - Streaming support with lowest memory overhead
   - Handles online chapter pages, cover images, thumbnails

2. **`local-manga://` Protocol** - Custom protocol for downloaded chapters
   - Format: `local-manga://chapter/{chapterId}/page/{pageNum}`
   - Filesystem reads for offline content
   - Path resolution uses `downloadsBasePath` from database (not current settings)

**Security**: Internal protocol only, NOT OS-registered, accessible only within DexReader's renderer processes

### Caching Strategy: Progressive by Phase

**Phase 2 (Streaming)**: Ephemeral memory cache (~50MB max, true LRU eviction)
**Phase 3 (Bookmarks)**: Persistent metadata + cover cache in SQLite + disk
**Phase 4 (Downloads)**: Full offline chapter storage with dual protocol architecture

**Key Distinction**: Streaming (automatic, memory-only) vs Bookmarks (auto on bookmark) vs Downloads (manual user action, persistent)

### Rate Limiting

**Global**: 5 requests/second per IP
**At-Home Endpoint**: 40 requests/minute for image URLs
**Implementation**: Token bucket algorithm with endpoint-specific limits, automatic retry on HTTP 429

### Error Handling

**Custom Error Types**: `MangaDexApiError` (HTTP errors), `MangaDexNetworkError` (network failures)
**Retry Strategy**: Automatic retry on 429 with `Retry-After` header, immediate failure on other HTTP errors
**Request Tracking**: Logs `X-Request-Id` for debugging

---

## Development Approach

### Backend Development Philosophy

**Hands-On Implementation**: Developer implements backend/main process code directly with Copilot as code reviewer.

**Copilot's Role**: Review for mistakes/security/optimization, provide guidance, avoid direct implementation unless requested

**Applies To**: Main process, filesystem operations, IPC handlers, preload scripts, Node.js backend features

**Frontend Code**: Normal collaborative implementation (Copilot implements directly)

**Rationale**: Backend code (especially security-critical operations) benefits from hands-on learning and deep understanding.

---

## Architecture Overview

### Multi-Process Architecture

**Main Process (Node.js)**: Window lifecycle, native OS integration, IPC routing, filesystem access
**Preload Script**: Secure context bridge, API exposure (contextIsolated), type definitions
**Renderer Process (Chromium)**: React application, UI components, browser-based environment

**Security Model**: Context isolation enabled, strict CSP, sandboxed renderer, selective API exposure via `contextBridge`

---

## Error Handling Philosophy

### Error Message Tone

**Casual, Conversational Language** - All user-facing errors use friendly, actionable language:

- ✓ "Can't find that file. Maybe it was moved or deleted?"
- ✗ "An error has occurred while attempting to access the specified resource"

**Implementation**: ~20 error patterns in error message catalog, covering filesystem, network, validation, and IPC errors

### Offline Mode States

**Three Connectivity States**: `online`, `offline-user` (manual), `offline-no-internet` (system detected)
**UI Pattern**: Persistent banner with context-appropriate actions ("Go Online" vs "Retry")

> **Note**: For error handling implementation details (error boundaries, global handlers, logging), see `tech-context.md`

---

## Project Structure

### Directory Organization

**Main Areas**:

- `.github/memory-bank/` - Project documentation & patterns
- `build/` - Build resources (icons, entitlements)
- `resources/` - Application resources (bundled)
- `src/main/` - Main process (Node.js)
- `src/preload/` - Security bridge
- `src/renderer/` - Frontend application
- `out/` - Build output (main, preload, renderer)

---

## Filesystem & Security Model

### Restricted Filesystem Access

**Principle**: DexReader restricts itself to specific, user-controlled directories only.

**Allowed Directories**:

1. **AppData Directory** (`app.getPath('userData')`)
   - Application database, metadata, settings, logs
   - Windows: `C:\Users\<username>\AppData\Roaming\dexreader`

2. **Downloads Directory** (User-configurable)
   - Default: `app.getPath('downloads') + '/DexReader'`
   - Downloaded manga chapters and metadata
   - Explicit user downloads only

**Access Pattern**: All file operations MUST validate paths against allowed base directories before proceeding

**Network Access**: Whitelist-only (`api.mangadex.org`, `uploads.mangadex.org`, MangaDex at-home servers)

**User Controls**: Native folder picker dialog for downloads directory selection

---

## Database & Transaction Patterns

### `PRAGMA foreign_keys` is set once, globally, at connection init

**Location**: `connection.ts` sets `PRAGMA foreign_keys = ON` when the `DatabaseSync` connection is created — not per-transaction.

**Gotcha**: SQLite silently ignores `PRAGMA foreign_keys = OFF/ON` issued _inside_ a transaction — the pragma can only take effect between transactions. Toggling it mid-`db.transaction()` block does nothing (found and fixed 2 September 2026 in `cleanup.repo.ts`'s `clearAllData()`, which had toggled it around a bulk delete under the mistaken assumption it would suspend FK checks for that delete).

**Practical implication**: because FK enforcement is genuinely active for the whole connection lifetime, any manual multi-table delete (bulk wipes, cascading manual cleanup) must either delete children before parents, or rely on `onDelete: 'cascade'` already being correct on every relevant FK and only delete the roots. Don't assume a pragma toggle will relax this for you inside a transaction.

**Full `collection_items`/`chapter`/`manga`/etc. delete order reference**: see `clearAllData()` in `src/main/database/repositories/cleanup.repo.ts` for the current children-before-parents ordering, derived from `relationships.schema.ts`.

### Database Snapshot & Restore ("Time Machine")

**Location**: `src/main/services/database-snapshot.service.ts`, backed by `node:sqlite`'s Online Backup API (`databaseConnection.backupDatabase()`) to safely copy a live DB — including one in WAL mode — without closing the connection.

**Snapshots are opaque, never addressed by path.** The public surface (IPC, service methods) only ever takes a bare filename drawn from `listSnapshots()`, resolved solely inside the managed `~/.dexreader/snapshots/` folder — never an absolute or user-picked path. A first implementation pass let `restoreSnapshot` accept an arbitrary filesystem path, which was a path-traversal / arbitrary-file-as-database vulnerability; every entry point that takes a filename now rejects anything failing a `path.basename(name) !== name` check before touching disk. This deliberately keeps the feature non-overlapping with Import/Export (the `.dexreader` format) — moving a backup off-machine is that feature's job, not this one's.

**No new DB table** — snapshot metadata (timestamp, trigger, size) is derived entirely from filenames and `stat()` on the snapshots folder, the same pattern `logging.service.ts`'s `cleanupLogs()` uses for the logs folder.

**Trigger model is check-on-startup only**, run once at DB-init time (`src/main/index.ts`), not a live timer: compares the newest automatic snapshot's age against `settings.snapshot.intervalInHours` and only creates a new one if overdue. Chosen over a live `setInterval` (needless lifecycle management once a manual "Create Now" button exists) and over an exit-only hook (this codebase's `before-quit` handling is synchronous while `node:sqlite`'s `backup()` is async, and exit-only misses every ungraceful exit — exactly when a recent snapshot matters most).

**Full design rationale**: `claude-plans/db-snapshot-restore-plan.md`.

---

## Code Conventions

### File Naming

- **Components**: PascalCase (`App.tsx`, `Versions.tsx`)
- **Utilities**: camelCase
- **Assets**: kebab-case (`base.css`, `main.css`)

> **Note**: For code formatting (Prettier) and linting (ESLint) configuration, see `tech-context.md`

---

## IPC Communication Pattern

**Documentation**: [ipc-messaging.md](../../docs/architecture/ipc-messaging.md)

### Channel Naming Convention

**Pattern**: `<category>:<action>` (e.g., `fs:read-file`, `theme:get-system-accent-color`)

### Design Principles

**Error Handling**: All handlers wrapped for automatic error catching and serialisation
**Request Validation**: All parameters validated before processing (type, path, encoding)
**Type Safety**: All IPC calls use type guards (`isIpcSuccess`, `isIpcError`) for safe data access

> **Note**: For IPC channel list, error classes, and implementation details, see `tech-context.md` and `docs/architecture/ipc-messaging.md`

---

## Styling Architecture

### CSS Structure

- `assets/base.css` - Design tokens, resets, typography
- `assets/main.css` - Layout, component styles

### Responsive Breakpoints

- 720px: Font size adjustments
- 620px: Hide version display
- 350px: Hide secondary UI elements

---

## Window Management Pattern

### Main Window Pattern

**Anti-Flicker Pattern**: Create window with `show: false`, then show on `ready-to-show` event
**Clean Interface**: `autoHideMenuBar: true` for streamlined UI

### Platform-Specific Behaviors

- **Linux**: Custom icon required
- **macOS**: App stays active when all windows close (platform convention)
- **Windows**: Standard window close behavior

---

## State Management Pattern

### Zustand Store Pattern

**Store Structure**: Types in `stores/types.ts`, stores with persist middleware where needed

### Store Guidelines

**✅ Do**: Use selector pattern, keep stores focused, validate input, use `partialize` for persistence
**❌ Don't**: Access entire store (causes re-renders), store derived state, mutate directly

**Persistence Strategy**: App-wide settings via Settings Manager IPC, renderer stores ephemeral or localStorage, library data in SQLite

> **Note**: For current store list and implementation, see `tech-context.md`

---

## Development Principles

1. **Security First**: Context isolation, CSP, sandboxing
2. **Type Safety**: Strict TypeScript across all processes
3. **Modern React**: Hooks, functional components, StrictMode
4. **Fast Feedback**: HMR for instant development updates
5. **Code Quality**: ESLint + Prettier automation
6. **Cross-Platform**: Consistent experience across OS

---

## Native Dialog Best Practices

### Message vs Detail Structure

**Pattern**: Short static message + dynamic content in detail

Native dialogs have fixed-width message titles that truncate long text. Dynamic content (manga titles, specifics, context) should be in the `detail` body instead.

**Why**: Message field has OS width constraints, detail field expands naturally

---

---

_This system pattern reflects the architectural patterns, design principles, and technical decisions guiding DexReader development. Focus on high-level patterns rather than implementation details. Update as patterns evolve._

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [1.7.0] - 2026-05-25

### Changed

- Migrate project to ECMAScript Modules (ESM)
  - Update package.json to specify `"type": "module"` for native ESM support
  - Refactor main process for full ESM compatibility
  - Modernize codebase with native ESM imports/exports throughout application
  - Implement compatibility workaround for electron-updater CommonJS dependency
  - Improved module loading and better alignment with Node.js ecosystem standards

### Fixed

- Fix IPC response handling issues in DownloadsView and dialog components
- Fix filesystem deleteDir method not consistently applying recursive flag when removing directories
- Fix missing translation keys for Downloads view and favorite/unfavorite actions
- Fix Vietnamese locale translation coverage gaps

---

## [1.6.0] - 2026-05-25

### Added

- Add Electron renderer sandboxing for enhanced security
  - Enabled sandbox mode in BrowserWindow webPreferences for improved protection against malicious content
  - Configured preload script bundling to support sandboxed environment (dependencies now bundled instead of externalized)
  - Sandboxed renderer provides better isolation and security compliance with Electron best practices
  - Performance impact: negligible overhead with significantly improved security posture
- Add localized unsaved changes dialogs for window close and navigation blocking
  - Window close confirmation now respects user's display language preference
  - Navigation blocking prompts use localized messages

### Changed

- Update preload build configuration to bundle dependencies for sandbox compatibility
  - Changed `externalizeDeps` from `true` to `false` in electron.vite.config
  - Sandboxed preload scripts cannot access node_modules at runtime, requiring bundled dependencies
  - Preload output format set to CommonJS (cjs) as required by Electron
- Update CI workflow to use newer checkout action version (resolves deprecation notice)
- Improve translation coverage for Settings view and dialog components

### Fixed

- Fix missing `useEffect` dependency in CacheManagementSettings component
- Fix incorrect tag creation workflow check in CI pipeline

---

## [1.5.0] - 2026-05-22

### Added

- Add Content Language Settings allowing users to configure preferred content languages
  - Select up to 3 priority languages for manga content filtering
  - Language preferences stored in application settings
  - New PriorityLanguages component for managing language selection
  - Integrated with MangaDex API for content language filtering
- Add comprehensive Settings infrastructure migration to electron-store
  - Migrated from JSON file-based storage to electron-store for better reliability
  - Improved settings validation and type safety
  - Automatic settings migration for existing users
- Add CI automation for release tagging
  - Automatically creates git tags when release PRs are merged

### Changed

- Reorganize SettingsView with cleaner separation of concerns
  - Improved Settings UI layout and structure
  - Better categorization of settings options
- Update and improve translations across all locale files
  - Enhanced Vietnamese translation coverage and quality
  - Fixed translation inconsistencies
- Update `protobufjs` dependency from 8.0.2 to 8.2.0

### Fixed

- Fix incorrect translation key usage on the StorageChart component

### Removed

- Remove app lock feature dependencies (deferred to future release)
  - Feature temporarily removed from scope for this release
  - Related dependencies cleaned up

---

## [1.4.1] - 2026-05-18

### Fixed

- Fix settings migration not triggering on v1.4.0 upgrade due to missing version bump
- Fix missing settings key during app initialization for i18n preferences
- Ensure migrated settings are properly persisted to settings file

---

## [1.4.0] - 2026-05-17

### Added

- Add full internationalization (i18n) support with multiple language locales
  - British English (en-GB) - default locale
  - American English (en-US) - with localized spellings (color vs colour, organize vs organise, etc.)
  - Vietnamese (vi-VN) - complete Vietnamese translation
- Add display language selection in Settings → Appearance
  - Real-time language switching without app restart for most UI elements
  - Automatic app restart prompt when language change affects backend components
  - Persistent language preference across sessions
- Add comprehensive translation coverage across all application views
  - Browse view with all search filters and controls
  - Library view with collection management
  - Downloads view with queue management
  - Reader view with all reading controls and navigation
  - Settings view with all configuration options
  - Manga details view with metadata and chapter lists
  - History view with reading history
  - All dialogs and confirmation prompts
  - Error messages and validation feedback
  - Menu bar and context menus
  - Loading states and status banners
- Add i18n infrastructure for both main and renderer processes
  - i18next integration with React (react-i18next)
  - File system backend for locale file loading (i18next-fs-backend)
  - Automatic locale file copying during build process
  - Type-safe translation keys with TypeScript support
- Add aria-label translations for improved accessibility across all locales
- Add restart dialog component for language change notifications

### Changed

- Update all hard-coded UI text to use localized translation keys
- Update dialog system to use Electron native dialogs instead of web alert API
- Update Incognito Banner to use localized text instead of hard-coded strings
- Update `protobufjs` dependency from 8.0.1 to 8.0.2 (security update)
- Restructure settings to include new "Display Language" category

### Fixed

- Fix missing translation keys across all views (Browse, Library, Downloads, Reader, Settings, History, Manga Details)
- Fix string template syntax issues in locale files
- Fix duplicate translation entries in locale files
- Fix build configuration to properly copy locale files to application bundle
- Fix sidebar navigation labels to use translations
- Fix status banners and filtering controls to use localized text
- Fix backend default translation keys for native UI elements

---

## [1.3.0] - 2026-05-09

### Added

- Add search preset functionality to save and reuse search configurations in Browse view
  - Save current search query + filters as named presets (up to 50 characters)
  - Load saved presets from dropdown selector with one click
  - Delete presets with confirmation dialog
  - Set default preset option for automatic application on app startup
  - Presets include search query, all filters, and results per page setting
  - Automatic upsert: updating existing preset replaces it (no duplicates)
- Add database schema for search presets with proper indexing and constraints
- Add complete IPC handlers for search preset CRUD operations (create, read, update, delete)
- Add search presets store in renderer for centralized state management
- Add SavePresetDialog component for creating/updating presets with preview
- Add PresetSelector component with integrated delete button
- Add hover tooltips on search UI elements for better discoverability

### Changed

- Update clear filter button on BrowseView to reset back to default filters instead of completely clear out the filter list
- Update Select and Option components with improved styling and hover states
- Refactor search preset service, repository, and handler structure for maintainability
- Update `fast-uri` dependency from 3.0.3 to 3.0.5 (security vulnerability fix)
- Update `ip-address` dependency from 10.1.1 to 10.2.0
- Update `drizzle-kit` dependency from 0.32.2 to 0.32.3

### Fixed

- Fix missing PublicationStatus enum export in main process
- Fix IPC event parameter types for improved type safety

---

## [1.2.0] - 2026-05-06

### Added

- Add "Include Downloaded Titles" toggle in Library view to display non-favorited downloaded manga alongside favorited titles
- Add soft delete functionality for downloaded chapters with ability to hide from Download view
- Add confirmation dialog for chapter download deletion with option to undo
- Add download and favorite status badges on manga cards in Library view for better visual distinction
- Add dual-badge system: heart badge for favorited titles, download badge for temporary downloads

### Changed

- Reorganize Library search header layout with integrated toggle buttons matching BrowseView pattern
- Improve Library search bar UI with buttons positioned absolutely within search container
- Update library database queries to merge favorited and downloaded manga efficiently

### Fixed

- Reduce settings file writes from 5 operations to 1 for better performance
- Optimize library database queries by avoiding subqueries
- Fix batch deletion of completed downloads to use batch method instead of loop

---

## [1.1.0] - 2026-04-29

### Added

- Add post-update "What's New" banner that displays after app updates with direct link to GitHub release notes
- Add configurable startup page selection (Browse, Library, or Downloads) in Settings → Appearance
- Add automatic settings migration system for seamless schema evolution across updates
- Add markdownlint ignore rules for improved documentation workflow

### Changed

- Update `@xmldom/xmldom` from 0.8.11 to 0.8.13 (security dependency update)

### Removed

- Remove unused manga update checking features from Library view (Check for Updates button, update badges)
- Remove manga update-related database fields and backend services for cleaner codebase
- The Details view will always fetch new chapters, and titles metadata when the user visits the title

### Fixed

- Fix NotFound redirect rendering unnecessary elements

---

## [1.0.0] - 2026-04-22

### 🎉 Golden Milestone - First Stable Release

**DexReader v1.0.0** marks the completion of our initial development phase (November 2025 - April 2026). This is a production-ready manga reader for MangaDex with offline support, auto-updates, and full accessibility compliance.

#### Release Highlights

- **Complete MangaDex Integration** - Browse, search, and read manga from MangaDex's extensive library
- **Offline Reading** - Download chapters for offline access with queue management
- **Auto-Update System** - Automatic updates via GitHub Releases (Windows/macOS/Linux)
- **Mihon/Tachiyomi Compatibility** - Import backups from Mihon/Tachiyomi (formerly Tachiyomi)
- **Accessibility** - WCAG 2.1 AA compliant (100% compliance across 45 criteria)
- **Multi-Platform** - Native support for Windows, macOS, and Linux

#### What's Included

- Advanced library management with custom collections and reading history tracking
- Multiple reading modes (single page, double page, vertical scroll) with zoom/pan
- Discord/GitHub-style search syntax with 6 filter types (status, tag, author, artist, year, downloaded)
- Parallel chapter downloads with progress tracking
- Privacy-first local logging with configurable retention periods
- Modern Windows 11-inspired UI with dark theme support
- Comprehensive API documentation for developers

#### Development Statistics

- **Development Period**: 6 months (November 2025 - April 2026)
- **Milestones Completed**: 29 milestones across 5 phases
- **Code Quality**: 56% frontend complexity reduction, 88-99% faster database queries
- **Documentation**: 4,900+ lines of architecture docs, coding patterns, and API references

#### Known Issues

- esbuild vulnerability via drizzle-kit transitive dependency (development-only, not runtime)
- macOS builds untested on real hardware (community testing appreciated)

#### Next Steps

This v1.0.0 release establishes a stable foundation for:

- Community feedback and bug fixes
- Performance optimizations
- Future feature development based on user needs

For complete development history, architectural decisions, and implementation details, see `.github/memory-bank/historical/`.

---

## [0.12.0] - 2026-04-12

### Added

- Add privacy-first local logging system with automatic log file rotation
- Add logging settings UI in Advanced preferences with retention period configuration (3, 7, 14, 30 days, default: 7)
- Add "Open Logs Folder" button to view logs in native file explorer
- Add "Clear All Logs" button with confirmation dialog to manually delete all log files
- Add structured logging service with log levels (info, warn, error) replacing console calls

### Changed

- Replace 129 console.\* calls in main process with structured logging service for better debugging
- Change default log retention from 30 to 7 days for practical storage management
- Migrate 22 files to barrel export pattern for cleaner imports and better code organization

### Fixed

- Fix DownloadsView missing h1 heading for proper screen reader navigation
- Fix heading hierarchy in ExternalLinksSection (h3 → h2) for semantic HTML compliance
- Remove 44 development console statements from 14 renderer files for production cleanliness

### Improved

- Achieve 100% WCAG 2.1 AA accessibility compliance (45/45 criteria met)
- Improve semantic HTML structure with screen-reader-only headings for all main views
- Enhance developer experience with comprehensive logging without cloud telemetry or privacy concerns

## [0.11.0] - 2026-04-08

### Added

- Add Library and Downloads as separate views with independent navigation
- Add Discord/GitHub-style search syntax for Library filtering with 6 filter types:
  - `status:` - Filter by publication status (ongoing/completed/hiatus/cancelled)
  - `tag:` - Filter by tags
  - `downloaded:` - Filter by download status (yes/no)
  - `author:` - Filter by author name
  - `artist:` - Filter by artist name
  - `year:` - Filter by publication year with comparison operators (>, <, =)
- Add search syntax help panel with examples in Library view
- Add active filters display as visual chips in Library view

### Changed

- Split Library view into dedicated Library and Downloads sections for better organization
- Refactor collection context menu to use reusable ContextMenu component pattern
- Move user data out of Electron's cache folder to prevent data loss on cache clear

### Fixed

- Fix startup update check banner appearing on every launch (now properly suppressed when disabled)
- Fix badge components stretching to full width (changed to inline-flex)
- Fix loading screens appearing when navigating back to History/Downloads views (now uses session cache)
- Fix collection list not refreshing after adding/removing manga from collections
- Fix duplicate breakdowns in line chart visualization
- Fix styling conflict with main ProgressBar component
- Fix navigation issues in DownloadsView
- Fix various styling issues in DownloadsView

## [0.10.0] - 2026-04-03

### Added

- Add auto-update settings UI in Advanced preferences (auto-check and auto-download toggles)
- Add manual update check button in settings with current version display

### Changed

- Optimize build process with vendor code splitting (55% faster updates for app code changes)
- Reduce installer size by 1 MB through optimized file exclusions
- Reduce Linux build targets from 4 to 2 formats (AppImage + deb, maintaining 99% distribution coverage)
- Disable DevTools in production builds for security hardening (emergency access via ENABLE_DEVTOOLS=1)
- Abandon Snap and RPM build targets due to publishing complexity

### Fixed

- Fix vendor code splitting to improve update download efficiency (529 KB vs 1,180 KB for app-only changes)

## [0.9.3] - 2026-04-03

### Fixed

- Fix race condition in release workflow where builds could publish release before all platforms completed (now waits for all builds before publishing)

## [0.9.2] - 2026-04-03

### Added

- Add comprehensive release process documentation for maintainers

### Changed

- Create draft release before uploading build artifacts (supports immutable release enforcement)

## [0.9.1] - 2026-04-02

### Fixed

- Fix HashRouter for production builds (routes now work in packaged app)
- Fix electron-builder.yml Linux section structure (deb packages now build correctly)
- Remove unnecessary macOS permissions (camera, microphone)

### Changed

- Add ASAR packaging and maximum compression for all platforms
- Build separate macOS binaries for x64 and arm64 (smaller download sizes)
- Remove portable ZIP builds (installers only for better auto-update support)
- Improve GitHub Actions job names (show "Linux" instead of "ubuntu-latest")
- Upload only required YAML files (exclude builder-debug.yaml)

## [0.9.0] - 2026-04-01

- initial release

<!-- Links -->

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

<!-- Versions -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

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

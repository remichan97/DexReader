# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

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

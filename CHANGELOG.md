# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

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

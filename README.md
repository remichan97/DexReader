# DexReader

[![CI](https://github.com/remichan97/DexReader/actions/workflows/ci.yaml/badge.svg)](https://github.com/remichan97/DexReader/actions/workflows/ci.yaml)
[![Release](https://github.com/remichan97/DexReader/actions/workflows/release.yaml/badge.svg)](https://github.com/remichan97/DexReader/actions/workflows/release.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, cross-platform manga reader for MangaDex built with Electron, React, and TypeScript.

## Features

- 🔍 **Browse & Search** - Search MangaDex's extensive library with advanced filters (tags, content rating, status) and save your favorite searches as reusable presets
- 📚 **Library Management** - Organise your manga library with favourites, collections, and reading history. Advanced search syntax with 6 filter types (status, tag, author, artist, year, downloaded)
- 📖 **Flexible Reader** - Multiple reading modes (single page, double page, vertical scroll) with zoom and pan controls
- ⬇️ **Offline Reading** - Download chapters for offline access with parallel download support
- � **Multi-Language Support** - Full internationalization with British English, American English, and Vietnamese locales
- �🎨 **Modern UI** - Clean, responsive interface following Windows 11 design principles (to our best abilities)
- ⚡ **High Performance** - Optimized database queries, image caching, and React rendering for smooth experience

## Download

> **⚠️ Security Notice**: Current builds are unsigned. You may see security warnings from Windows SmartScreen or macOS Gatekeeper.
>
> - **Windows**: Click "More info" → "Run anyway"
> - **macOS**: Right-click → "Open" → Confirm

> **📢 macOS Testing Notice**: DexReader is built and tested primarily on Windows and Linux. While macOS builds are generated automatically via CI/CD, we haven't conduct any extensive testing on real hardware due to device availability. If you're a Mac user, we'd really appreciate your feedback! Please report any issues you encounter on [GitHub Issues](https://github.com/remichan97/DexReader/issues) or offer to help with testing in [Discussions](https://github.com/remichan97/DexReader/discussions).

### Installation

We provide installation binaries on the [GitHub Releases](https://github.com/remichan97/DexReader/releases) page:

- **Windows**: `dexreader-{version}-setup.exe` (NSIS installer)
- **macOS**: `dexreader-{version}.dmg` (Disk image)
- **Linux**:
  - `dexreader-{version}.AppImage` (Portable, recommended)
  - `dexreader-{version}.deb` (Debian/Ubuntu)

Or, you can also build from the source code by downloading the tarball, or ZIP files provided in each release

## Development

### Prerequisites

- Node.js 24.x or later
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/remichan97/DexReader.git
cd DexReader

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Available Scripts

- `npm run dev` - Start development app with hot reload
- `npm run dev:inspect` - Same as above, but expose DevTools port for debugging main processes
- `npm run build` - Build for production (no packaging)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Building Installers

```bash
# Windows (requires Windows, and escalated permission)
npm run build:win

# macOS (requires macOS)
npm run build:mac

# Linux
npm run build:linux
```

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) 41.0.2
- **Frontend**: [React](https://react.dev/) 19 + TypeScript 5.9.2
- **Build Tool**: [electron-vite](https://electron-vite.org/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + SQLite
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: CSS Modules with Windows 11 design tokens
- **API**: [MangaDex API](https://api.mangadex.org/docs/)

## Project Status

**Current Version**: 1.4.0 (May 17, 2026) 🌐

DexReader v1.4.0 introduces full internationalization support:

- ✅ Complete MangaDex extensive manga library integration (browse, search, read)
- ✅ **Multi-Language Support** - Three locales supported (British English, American English, Vietnamese)
- ✅ Search presets - Save and reuse search configurations with one click
- ✅ Offline reading with download management
- ✅ Auto-update system with post-update "What's New" banner
- ✅ Configurable startup page (Browse, Library, or Downloads)
- ✅ Automatic settings migration system
- ✅ Mihon/Tachiyomi backup compatibility
- ✅ WCAG 2.1 AA accessibility compliance (100%)
- ✅ Multi-platform support (Windows, macOS, Linux)

This release enhances the browsing experience by allowing users to save their favorite search configurations as presets for quick access.

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and development history.

## 🙋 Help Wanted: macOS Testing

We're currently looking for Mac users to help test DexReader! No coding required—just download the app, try it out, and let us know if anything doesn't work as expected.

**How to help**:

1. Download the latest macOS `.dmg` from [Releases](https://github.com/remichan97/DexReader/releases)
2. Test the core features (browse, read, download)
3. Report any bugs or quirks on [GitHub Issues](https://github.com/remichan97/DexReader/issues)
4. Share your experience in [Discussions](https://github.com/remichan97/DexReader/discussions)

Your feedback helps make DexReader better for all Mac users!

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <description>

Examples:
feat(reader): add double-page spread mode
fix(download): prevent duplicate downloads
docs(readme): update installation instructions
```

Pre-commit hooks will validate all commits automatically.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Content provided by [MangaDex](https://mangadex.org/)
- Built with [Electron](https://www.electronjs.org/) and [React](https://react.dev/)

---

**Note**: DexReader is an independent project and is not affiliated with or endorsed by MangaDex.

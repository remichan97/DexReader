# DexReader

[![CI](https://github.com/remichan97/DexReader/actions/workflows/ci.yaml/badge.svg)](https://github.com/remichan97/DexReader/actions/workflows/ci.yaml)
[![Release](https://github.com/remichan97/DexReader/actions/workflows/release.yaml/badge.svg)](https://github.com/remichan97/DexReader/actions/workflows/release.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, cross-platform manga reader for MangaDex built with Electron, React, and TypeScript.

## Features

- 🔍 **Browse & Search** - Search MangaDex's extensive library with advanced filters (tags, content rating, status)
- 📚 **Library Management** - Organize manga with favorites, collections, and reading history
- 📖 **Flexible Reader** - Multiple reading modes (single page, double page, vertical scroll) with zoom and pan controls
- ⬇️ **Offline Reading** - Download chapters for offline access with parallel download support
- 🎨 **Modern UI** - Clean, responsive interface following Windows 11 design principles
- ⚡ **High Performance** - Optimized database queries, image caching, and React rendering for smooth experience

## Download

> **⚠️ Security Notice**: Current builds are unsigned. You may see security warnings from Windows SmartScreen or macOS Gatekeeper.
>
> - **Windows**: Click "More info" → "Run anyway"
> - **macOS**: Right-click → "Open" → Confirm

### Stable Releases

Download the latest version from [GitHub Releases](https://github.com/remichan97/DexReader/releases):

- **Windows**: `dexreader-{version}-setup.exe` (NSIS installer)
- **macOS**: `dexreader-{version}.dmg` (Disk image)
- **Linux**:
  - `dexreader-{version}.AppImage` (Portable, recommended)
  - `dexreader-{version}.deb` (Debian/Ubuntu)
  - `dexreader-{version}.snap` (Snap package)

## Installation

### Windows

1. Download `dexreader-{version}-setup.exe`
2. Run the installer (click "More info" → "Run anyway" if SmartScreen appears)
3. The app will install per-user to `%LOCALAPPDATA%\Programs\dexreader`
4. Launch from Start Menu or desktop shortcut

### macOS

1. Download `dexreader-{version}.dmg`
2. Mount the disk image
3. Drag `dexreader.app` to your Applications folder
4. Right-click the app → "Open" (first launch only, to bypass Gatekeeper)

### Linux

**AppImage** (Recommended):

```bash
chmod +x dexreader-{version}.AppImage
./dexreader-{version}.AppImage
```

**Debian/Ubuntu**:

```bash
sudo dpkg -i dexreader-{version}.deb
```

**Snap**:

```bash
sudo snap install dexreader-{version}.snap --dangerous
```

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

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (no packaging)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Building Installers

```bash
# Windows (requires Windows)
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

**Current Version**: 0.9.0 (Pre-release)
**Target Release**: v1.0.0 (May 2026)

Phase 5 (Production Readiness) - In Progress:

- ✅ Frontend refactoring (56% complexity reduction)
- ✅ Database optimization (88-99% faster queries)
- ✅ Memory profiling and leak detection
- ✅ Download system performance (5-10x improvement)
- ✅ Image loading optimization
- ✅ CI/CD pipeline with GitHub Actions
- ⏳ UI responsiveness improvements
- ⏳ Auto-update system
- ⏳ Testing suite

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes.

## Contributing

Contributions are welcome! We appreciate bug reports, feature requests, documentation improvements, and code contributions.

Before contributing, please read:

- [Contributing Guidelines](CONTRIBUTING.md) - Development setup, code standards, commit conventions, and PR process
- [Code of Conduct](CODE_OF_CONDUCT.md) - Expected behavior and community standards

Key topics covered in the contributing guide:

- Development setup and workflow
- Code standards and style guide
- Commit message conventions
- Pull request process
- Project architecture overview

### Quick Start for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/DexReader.git
cd DexReader

# Install dependencies (this also sets up git hooks)
npm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Start development
npm run dev
```

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/). All commits must follow this format:

```
<type>(<scope>): <description>

Examples:
feat(reader): add double-page spread mode
fix(download): prevent duplicate downloads
docs(readme): update installation instructions
```

Pre-commit hooks will validate your commits automatically.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Content provided by [MangaDex](https://mangadex.org/)
- Built with [Electron](https://www.electronjs.org/) and [React](https://react.dev/)

---

**Note**: DexReader is an independent project and is not affiliated with or endorsed by MangaDex.

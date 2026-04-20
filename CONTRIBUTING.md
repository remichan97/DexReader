# Contributing to DexReader

Thank you for your interest in contributing to DexReader! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Architecture](#project-architecture)
- [Testing](#testing)
- [Project Documentation](#project-documentation)

---

> **📢 Help Wanted**: We're looking for **Mac users** to help test DexReader! See the [Testing](#testing) section for details. No coding required—just download, try it out, and report your experience.

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand what behaviours are expected and what will not be tolerated.

## Getting Started

### Prerequisites

- **Node.js**: Version 24.x or later
- **npm**: Version 11.x or later (comes with Node.js)
- **Git**: For version control
- **Code Editor**: We recommend VS Code, as we have some project-level settings, and extensions recommendation that would make your development experience smoother, but feel free to use other editor of your choice
- **Database Management tool** (optional): We use SQLite 3 as the local database for the app, which you can easily inspect the database using said tool. It's not required to work with the app, but having it should allows you an easier time debugging database code should you ever need to

### Initial Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/DexReader.git
   cd DexReader
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Up Git Hooks**

   Git hooks are automatically installed via Husky during `npm install`. These hooks enforce:
   - Code formatting (Prettier)
   - Linting (ESLint)
   - Commit message conventions (commitlint)

4. **Run Development Server**

   ```bash
   npm run dev
   ```

   The app will launch in development mode with hot reload enabled.

### Available Scripts

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start development server with hot reload   |
| `npm run build`       | Build for production (no packaging)        |
| `npm run lint`        | Run ESLint to check code quality           |
| `npm run typecheck`   | Run TypeScript type checking               |
| `npm run format`      | Format all code with Prettier              |
| `npm run build:win`   | Build Windows installer (requires Windows) |
| `npm run build:mac`   | Build macOS DMG (requires macOS)           |
| `npm run build:linux` | Build Linux packages (AppImage, Deb, Snap) |

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Recommended branch naming conventions** (feel free to use your own if you prefer):

- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation changes
- `refactor/*` - Code refactoring
- `perf/*` - Performance improvements
- `test/*` - Adding or updating tests

The project doesn't enforce specific branch names convention, but using descriptive names helps everyone understand what you're working on.

### Making Changes

1. **Write Code**
   - Follow the [Code Standards](#code-standards)
   - Write clear, self-documenting code
   - Add comments for complex logic

2. **Test Your Changes**
   - Run `npm run dev` and manually test
   - Ensure no TypeScript errors: `npm run typecheck`
   - Fix any linting issues: `npm run lint`

3. **Format Code**
   - Run `npm run format` or let pre-commit hooks handle it

## Code Standards

### Language and Spelling

**Use British English** consistently throughout the codebase:

- "Favourites" (not "Favorites")
- "Colour" (not "Color")
- "Organise" (not "Organize")
- "Centre" (not "Center")

### Writing Style

- **Tone**: Casual and friendly (avoid corporate jargon)
- **Error Messages**: Clear, actionable, and friendly
  - Good: "Oops! Couldn't load that chapter. Check your internet connection?"
  - Bad: "An error occurred while loading the requested resource."
- **Use Contractions**: can't, won't, it's, etc.
- **Icons**: Always use Fluent UI icons (`@fluentui/react-icons`) - never use unicode emoji in code

### TypeScript Guidelines

- **Strict Mode**: Always enabled - no implicit `any` types
- **Explicit Types**: Prefer explicit return types for functions
- **Interfaces**: Use for public APIs and component props
- **Type Aliases**: Use for unions, complex types, and utility types
- **Prefer `undefined` over `null`**: Use `undefined` for absent optional values
  - Exception: React `useState` hooks commonly initialize with `null`
  - Exception: When `null` has semantic meaning (e.g., "explicitly cleared" vs "not set")
  - Exception: External APIs or libraries that expect `null`
  - Exception: JSON serialization where `undefined` is omitted
- **Null Safety**: Handle both `null` and `undefined` explicitly when they can occur

Example:

```typescript
// Good - Prefer undefined for optional values
interface MangaSearchParams {
  query: string
  limit?: number // Will be undefined if not provided
  tags?: string[] // Will be undefined if not provided
}

function searchManga(params: MangaSearchParams): Manga[] | undefined {
  // Return undefined if no results (not null)
  return results.length > 0 ? results : undefined
}

// Acceptable - React state commonly uses null
const [selectedManga, setSelectedManga] = useState<Manga | null>(null)

// Good - Explicit typing
interface MangaListProps {
  manga: Manga[]
  onSelect: (id: string) => void
}

export function MangaList({ manga, onSelect }: MangaListProps): JSX.Element {
  // Implementation
}

// Avoid - Implicit any
function MangaList(props) {
  // Implementation
}
```

### React Guidelines

- **Functional Components**: Always use function components (no class components)
- **Hooks**: Follow Rules of Hooks
- **Component Files**: One component per file
- **Props Destructuring**: Destructure props in function parameters
- **Event Handlers**: Prefix with `handle` (e.g., `handleClick`, `handleSubmit`)

### File Organization

```
src/
├── main/              # Electron main process
│   ├── api/          # MangaDex API client
│   ├── database/     # Database schemas and queries
│   ├── ipc/          # IPC handlers
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── preload/          # Electron preload scripts
└── renderer/         # React frontend
    └── src/
        ├── components/  # React components
        ├── hooks/       # Custom React hooks
        ├── stores/      # Zustand state stores
        ├── types/       # TypeScript type definitions
        └── utils/       # Frontend utilities
```

### Naming Conventions

- **Files**: kebab-case (e.g., `manga-list.tsx`, `use-fetch-manga.ts`)
- **Components**: PascalCase (e.g., `MangaList`, `ChapterReader`)
- **Functions**: camelCase (e.g., `fetchManga`, `handleClick`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CACHE_SIZE`, `API_BASE_URL`)
- **Interfaces**: PascalCase with descriptive names (e.g., `MangaListProps`, `ApiResponse`)
- **Types**: PascalCase (e.g., `MangaId`, `ChapterStatus`)

## Commit Message Guidelines

This project uses **Conventional Commits** enforced by commitlint. All commit messages must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

| Type       | Description                                    |
| ---------- | ---------------------------------------------- |
| `feat`     | New feature                                    |
| `fix`      | Bug fix                                        |
| `docs`     | Documentation changes                          |
| `style`    | Code style changes (formatting, whitespace)    |
| `refactor` | Code refactoring (no functional changes)       |
| `perf`     | Performance improvements                       |
| `test`     | Adding or updating tests                       |
| `build`    | Build system or dependency changes             |
| `ci`       | CI/CD configuration changes                    |
| `chore`    | Maintenance tasks (no production code changes) |

### Examples

```bash
# Feature
feat(reader): add double-page spread mode

# Bug fix
fix(download): prevent duplicate downloads for same chapter

# Documentation
docs(readme): update installation instructions for Linux

# Refactoring
refactor(api): simplify rate limiter implementation

# Performance
perf(database): add index for chapter queries
```

### Scope (Optional)

Common scopes:

- `reader` - Chapter reader component
- `library` - Library/favourites management
- `download` - Download functionality
- `api` - MangaDex API integration
- `database` - Database operations
- `ui` - UI components

### Subject Guidelines

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

## Pull Request Process

### Before Submitting

1. **Update Your Branch**

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run All Checks**

   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **Test Thoroughly**
   - Manual testing in development mode
   - Test on your target platform (Windows/macOS/Linux)
   - Verify no regressions in existing functionality

### Creating a Pull Request

1. **Push Your Branch**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub**
   - Fill out the PR template completely
   - Write a clear description of changes
   - Reference any related issues (e.g., "Closes #123")
   - Add screenshots for UI changes

3. **PR Title**: Must follow conventional commit format
   - Example: `feat(reader): add double-page spread mode`
   - This is enforced by CI checks

### CI Checks

All PRs must pass the following checks:

- **PR Title Validation**: Must follow conventional commit format
- **PR Description**: Must include description (not just template)
- **Commit Messages**: All commits must follow conventional format
- **Linting**: ESLint must pass with no errors
- **Type Checking**: TypeScript compilation must succeed

### Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged to `main`

## Project Architecture

### Electron Multi-Process Architecture

DexReader follows Electron's multi-process architecture:

- **Main Process**: Node.js environment (API client, database, file system)
- **Renderer Process**: Chromium/React (UI, user interactions)
- **Preload Scripts**: Bridge between main and renderer (IPC)

### Key Architectural Decisions

#### Image Proxy System

**Critical**: MangaDex blocks direct image hotlinking. All images MUST be proxied through the main process using custom protocol handlers:

- `mangadex://` - Online image streaming
- `local-manga://` - Downloaded chapter images

See `docs/architecture/` for detailed information.

#### State Management

- **Zustand**: Primary state management library
- **React Context**: For component-scoped state
- **Local State**: Use `useState` for simple component state

#### Database

- **Better-sqlite3**: Synchronous SQLite database
- **Drizzle ORM**: Type-safe database queries
- **Migrations**: SQLite schema migrations in `src/main/database/migrations/`

When you first start the app, you should see the development database located at the root of the project directory

### Project Documentation

Comprehensive documentation is available in `docs/`:

- **[API Reference](docs/api-reference.md)** - Complete IPC handler documentation with usage examples
- `docs/architecture/` - System architecture and design decisions
- `docs/components/` - UI component specifications
- `docs/design/` - Design system and wireframes

**For developers working with IPC**: See the [API Reference](docs/api-reference.md) for complete documentation of all available IPC handlers, including parameters, return types, error handling, and usage examples.

## Testing

### 🙋 Help Wanted: macOS Testing

**We're looking for Mac users to help test DexReader!** No coding experience required—just download, try it out, and let us know any issues you find.

**Why we need help**: DexReader is developed and tested primarily on Windows and Linux. While macOS builds are generated automatically via CI/CD, they haven't been extensively tested on real Mac hardware due to device availability constraints.

**How to help**:

1. Download the latest `.dmg` from [Releases](https://github.com/remichan97/DexReader/releases)
2. Install and test the core features:
   - Browse and search manga
   - Read chapters (single page, double page, vertical scroll modes)
   - Download chapters for offline reading
   - Manage your library (favorites, collections, history)
3. Check for macOS-specific issues:
   - Menu bar integration
   - Keyboard shortcuts (Cmd vs Ctrl)
   - Notifications
   - Retina display rendering
   - File path handling
4. Report bugs on [GitHub Issues](https://github.com/remichan97/DexReader/issues)
5. Share your experience in [Discussions](https://github.com/remichan97/DexReader/discussions)

Your feedback is incredibly valuable and helps ensure DexReader works great for all Mac users! 🎉

---

### Manual Testing

Currently, the project relies on manual testing:

1. Run the app in development mode: `npm run dev`
2. Test your changes thoroughly
3. Check both happy paths and error cases
4. Verify UI responsiveness and accessibility

### Future: Automated Testing

Automated testing (unit, integration, E2E) will be added in future phases. Contributions to establish testing infrastructure are welcome!

## Contributing to Documentation

### When to Update Documentation

Update documentation when you:

- Add new features or APIs
- Change existing behavior
- Fix bugs that weren't obvious
- Add architectural decisions

### Documentation Locations

- **README.md**: User-facing installation and usage
- **CONTRIBUTING.md**: This file - contributor guidelines
- **docs/**: Technical documentation
  - `docs/architecture/`: System design and architecture
  - `docs/components/`: Component specifications
  - `docs/design/`: Design system and UI guidelines
- **Code Comments**: Explain "why", not "what"

### Writing Documentation

- Use British English
- Be clear and concise
- Include code examples where helpful
- Update the `Last Updated` date in memory bank files

## Questions or Need Help?

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check `docs/` for architectural details

---

Once again, thank you for your interest in contributing to DexReader!

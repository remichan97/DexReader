# DexReader Active Context

**Last Updated**: 23 November 2025
**Current Phase**: Phase 0 - Foundation
**Session**: Initial Project Setup

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 0 - Foundation ✅
**Progress**: 100% Complete
**Completed**: 23 November 2025

### ✅ Completed This Session

1. Project scaffolded with electron-vite template
2. Development environment configured (Node 22.21.1, npm 11.3.0)
3. Dependencies installed successfully
4. Memory bank documentation structure created:
   - `system-pattern.md` - Complete architecture patterns
   - `tech-context.md` - Full technology stack documentation
   - `project-progress.md` - Complete timeline with task codes
   - `active-context.md` - Session dashboard
   - `project-brief.md` - Project vision and requirements
5. Task coding system implemented (P1-T01 through P7-T08)
6. Core application features and requirements defined
7. Project scope established (MangaDex integration details)
8. Coding standards verified (Prettier + ESLint already configured)
9. Git repository initialized with first commit
10. Repository pushed to GitHub (remichan97/DexReader)

### 🔄 Active Work

- Ready to begin Phase 1

### ⏳ Next Actions

1. **P1-T01**: Design main application layout
2. **P1-T02**: Implement menu bar and navigation
3. Plan Phase 1 detailed milestones and subtasks
4. Set up project dependencies for MangaDex API integration

---

## Recent Decisions (23 Nov 2025)

**Content & API**:

- ✅ MangaDex public API only (no authentication needed)
- ✅ Image files only: JPG, PNG, WebP (no PDF support)
- ✅ Public read-only endpoints for all features

**Development Priority**:

- ✅ Online functionality FIRST (Phase 2)
- ✅ Offline downloads LATER (Phase 4)

**Caching Strategy**:

- ✅ Cover images: Auto-cache when manga bookmarked
- ✅ Chapter images: User-initiated downloads only
- ✅ Online reading: Stream only, no disk caching (memory preload for smooth transitions)

**Tech Stack**:

- ✅ Electron 38 + React 19 + TypeScript 5.9
- ✅ electron-vite for build system
- ✅ Three-process architecture (main/preload/renderer)

**UI/UX Design**:

- ✅ Windows 11 native design system (Mica, Acrylic effects)
- ✅ System theme detection (auto light/dark based on Windows)
- ✅ Native OS title bar with menu bar (File, View, Library, Tools, Help)
- ✅ Collapsible sidebar navigation (secondary to menu bar)
- ✅ Custom components (no UI library for performance)
- ✅ Segoe UI Variable font

**Security Model**:

- ✅ Restricted filesystem access (2 directories only)
- ✅ AppData: Database, cache, settings (automatic)
- ✅ Downloads: User-configurable via native folder picker
- ✅ Path validation enforced on all file operations
- ✅ Network restricted to MangaDex domains only

**Features**:

- ✅ Library import/export (native DexReader + Tachiyomi formats)
- ✅ Downloads directory configuration in Settings
- ✅ Backup/restore for app data

---

## Current Work Focus

### Today's Goals

- [ ] Document core feature requirements
- [ ] Define target user experience
- [ ] Create project brief document
- [ ] **P1-T01**: Plan Phase 1 architecture

### Current Blockers

None

### Open Questions

None at this time

---

## Quick Command Reference

```bash
npm run dev         # Start development with HMR
npm run build       # Type check + build
npm run typecheck   # Validate types only
```

---

## Session Notes

### 23 November 2025 - Initial Setup & Planning

**Accomplished**:

- Created project structure with electron-vite
- Set up complete memory bank documentation system (5 files)
- Wrote comprehensive project brief with requirements
- Defined MangaDex integration approach (public API only)
- Clarified technical decisions:
  - Images only, no PDFs
  - Explicit downloads only (no auto-caching)
  - Online functionality first, offline later
  - Public API endpoints only (no authentication)
- Implemented task coding system (P1-T01 through P7-T12)
- Documented complete 7-month timeline with 8 phases
- Established architecture patterns and tech context
- Set up Git repository with initial commit
- Pushed to GitHub (remichan97/DexReader)
- Verified coding standards already configured (Prettier + ESLint)
- Designed Windows 11 native UI system:
  - System theme detection (light/dark auto-switching)
  - Native menu bar + collapsible sidebar navigation
  - Mica/Acrylic effects for modern Windows look
  - Custom components (no UI library)
- Established security model:
  - Restricted filesystem (AppData + user-configured downloads only)
  - Path validation on all file operations
  - Network restricted to MangaDex domains
- Added library import/export feature (native + Tachiyomi formats)
- Created detailed P1-T01 plan (main application layout)

**Key Insights**:

- MangaDex has public endpoints for all read operations
- No authentication simplifies architecture significantly
- User-controlled downloads prevent unwanted disk usage
- Personal app focus allows tailored UX decisions

**Features Defined**:

- Manga search, browse, and bookmarking
- Book-like reading interface with progress tracking
- Quick jump to last read page
- Personal library with collections
- Explicit chapter/manga downloads
- Check for updates on demand or startup
- Library import from Tachiyomi backups
- Library export (native DexReader + Tachiyomi formats)
- User-configurable downloads directory
- Windows 11 native design with system theme sync

**Next Session**:

1. Execute **P1-T01**: Design main application layout (wireframes, component hierarchy, Windows 11 design tokens)
2. **P1-T02**: Implement menu bar and navigation
3. **P1-T05**: Implement restricted filesystem access model
4. **P1-T06**: Create path validation system
5. Continue Phase 1 implementation (**P1-T03** to **P1-T09**)

> **Task Reference**: See `project-progress.md` for technical task codes (P1-T01 through P7-T12)
> **Design Plan**: See `.github/copilot-plans/P1-T01-main-application-layout-plan.md` for layout design details

---

## Memory Bank Structure

- **active-context.md** (this file) - Current session state, recent decisions, immediate work
- **project-progress.md** - Full timeline, all phases, milestones, risks
- **system-pattern.md** - Architecture patterns, code conventions, design principles
- **tech-context.md** - Technology stack details, configurations, dependencies

> **When to Update**: End of each session, when making decisions, when completing milestones

---

*Last session: 23 Nov 2025 | Next session: TBD*

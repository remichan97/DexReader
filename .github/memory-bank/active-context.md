# DexReader Active Context

**Last Updated**: 23 November 2025
**Current Phase**: Phase 0 - Foundation
**Session**: Initial Project Setup

> **Purpose**: This is your session dashboard. Read this FIRST when resuming work to understand what's happening NOW, what was decided recently, and what to work on next.

---

## Current Status Summary

**Phase**: Phase 0 - Foundation 🔵
**Progress**: ~80% Complete
**Target Completion**: Early December 2025

### ✅ Completed This Session

1. Project scaffolded with electron-vite template
2. Development environment configured (Node 22.21.1, npm 11.3.0)
3. Dependencies installed successfully
4. Memory bank documentation structure created:
   - `system-pattern.md` - Complete architecture patterns
   - `tech-context.md` - Full technology stack documentation
   - `project-progress.md` - Complete timeline with task codes
   - `active-context.md` - Session dashboard
   - `project-brief.md` - Project vision and requirements ✅ NEW
5. Task coding system implemented (P1-T01 through P7-T08)
6. Core application features and requirements defined
7. Project scope established (MangaDex integration details)

### 🔄 Active Work

- None currently

### ⏳ Next Actions

1. Set up Git repository and initial commit
2. Establish coding standards checklist
3. Plan Phase 1 detailed milestones (tasks **P1-T01** to **P1-T08**)
4. **P1-T01**: Begin Phase 1 architecture design

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
- Implemented task coding system (P1-T01 through P7-T08)
- Documented complete 7-month timeline with 8 phases
- Established architecture patterns and tech context

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

**Next Session**:

1. Set up Git repository and initial commit
2. Define coding standards checklist
3. Plan Phase 1 tasks in detail
4. **P1-T01** to **P1-T08**: Begin Phase 1 implementation

> **Task Reference**: See `project-progress.md` for technical task codes (P1-T01 through P7-T08)

---

## Memory Bank Structure

- **active-context.md** (this file) - Current session state, recent decisions, immediate work
- **project-progress.md** - Full timeline, all phases, milestones, risks
- **system-pattern.md** - Architecture patterns, code conventions, design principles
- **tech-context.md** - Technology stack details, configurations, dependencies

> **When to Update**: End of each session, when making decisions, when completing milestones

---

*Last session: 23 Nov 2025 | Next session: TBD*

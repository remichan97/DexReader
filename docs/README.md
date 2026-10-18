# DexReader Documentation

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout

This folder contains all design and architectural documentation for DexReader.

---

## Folder Structure

### 📐 `/design`

Visual design and design system specifications.

- **windows11-design-tokens.md** - Design tokens (`tokens.css`): light/dark colours, typography, spacing, radii, shadows, motion
- **responsive-behavior-guide.md** - How layouts adapt to window size: fluid grids, the user-selected sidebar mode and the component-local media queries (mainly 768px and 480px)

### 🏗️ `/architecture`

System architecture, navigation patterns, and layout specifications.

- **navigation-flow.md** - Routes, ways to navigate, origin-aware Back, what state survives navigation, invalid-route handling
- **layout-specification.md** - Application shell, sidebar display modes, per-view layouts, content widths, layering and scrolling
- **reader-layout-specification.md** - 3 reading modes (single/double/vertical) with controls, interactions, preloading strategy
- **menu-bar-structure.md** - Native Electron menu bar (File, View, Library, Help): items, accelerators, the IPC events and menu state, and known gaps
- **database-architecture.md** - 🗄️ **SQLite database design** with Drizzle ORM, 9 tables, CQRS pattern, migration strategy
- **state-management.md** - The 10 Zustand stores: what each holds, where its data comes from, conventions, startup hydration, testing
- **error-handling.md** - Error patterns, IPC error handling, user-facing messages
- **filesystem-security.md** - Path validation, security restrictions, safe file operations
- **ipc-messaging.md** - IPC architecture, handler patterns, type safety
- **mangadex-api.md** - MangaDex API integration, rate limiting, error handling

### 📚 API & Integration

- **[api-reference.md](./api-reference.md)** - 📡 **Complete IPC API reference** with 90+ handlers across 14 categories, type definitions, error handling patterns, and usage examples

### 🎨 `/components`

UI component documentation. Per-component READMEs live beside the code in `src/renderer/src/components/<Name>/README.md`.

- **ui-component-library.md** - 📚 **Component catalog** covering the shared components, usage examples, design patterns, TypeScript types
- **ui-polish-refinements.md** - ✨ **Polish documentation** covering refinements applied after user testing (focus behaviour, animations, icons)
- **loading-feedback-states.md** - Loading/error/empty state system (skeleton screens, progress rings/bars, spinners, error handling)
- **utility-classes.md** - The utility classes in `utilities.css` (the small set that components actually use)

### 🔧 Maintainer Documentation

- **RELEASE_PROCESS.md** - 🚀 **Release workflow and versioning** - Semantic versioning, normal releases, hotfix procedure, yank + fix strategy, pre-releases

---

## Component Library Status

**Since v1.16.0** the shared components in `src/renderer/src/components/` are thin wrappers over **Fluent 2** (`@fluentui/react-components`), not hand-rolled controls. Each keeps its own public props, so views import `Button`, `Input`, `Modal`, `Select` and so on exactly as before, while Fluent supplies the rendering, focus handling, keyboard navigation and popup positioning. See the "Built on Fluent 2" section of `components/ui-component-library.md`.

- Form Controls: Button, Input, SearchBar, Checkbox, Switch, Radio, Select, TagPicker, NumberSpinner
- Feedback: Toast, ProgressBar, ProgressRing, Badge, Skeleton, InfoBar and the status banners
- Navigation: Sidebar, Tabs
- Layout: MangaCard, List / ListItem, LanguageBadge
- Overlays: Modal, Tooltip, Popover
- Utilities: ViewTransition

Components that nothing in Fluent matches (Sidebar, MangaCard, ViewTransition, LanguageBadge) are still DexReader's own, built with Fluent's styling tokens (`makeStyles`) where they need styling.

---

## Document Purpose

All documents in this folder are **implementation-ready specifications** and **living documentation**. Documents include:

- TypeScript interfaces and type definitions
- CSS specifications with class names and animation details
- Accessibility requirements (ARIA labels, keyboard navigation)
- Code examples for implementation guidance
- Windows 11 Fluent Design integration
- **NEW**: Complete component library with usage examples and polish patterns

---

## Quick Reference

**Tech Stack**: React 19 + TypeScript 5.9 + Electron 43
**Routing**: React Router v7
**UI**: Fluent 2 (`@fluentui/react-components` 9.x) with a custom theme
**Icons**: @fluentui/react-icons 2.0 (Official Microsoft Fluent UI)
**Flags**: country-flag-icons (bundled SVGs, per-flag imports)
**State Management**: Zustand v5 + SQLite (via Drizzle ORM)
**Database**: SQLite + Drizzle ORM (9 tables, WAL mode, CQRS pattern)
**Design System**: Windows 11 look and feel on Fluent 2 (Segoe UI Variable)
**Animations**: Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for indicators
**Reading Modes**: Single page, Double page (R-L), Vertical scroll
**Navigation**: Native menu bar + Fixed icon sidebar with Fluent icons (80px; full, compact and auto-hide display modes)
**Responsive**: Fluid `auto-fill` grids (180px minimum card); component-local media queries at 768px and 480px
**Components**: Fluent 2 wrappers plus a few DexReader-specific ones (see Component Library Status)

---

## Usage

### For New Features

1. Start with `/architecture` docs to understand system structure
2. Reference `/design` docs for visual specifications and design tokens
3. Use **`/components/ui-component-library.md`** for component usage and examples
4. Check `/components` specs for detailed component implementation

### For Component Development

1. Read **`ui-component-library.md`** for design patterns and guidelines
2. Review **`ui-polish-refinements.md`** to understand polish decisions
3. Follow established patterns (wrap a Fluent 2 component and keep the public props stable, `makeStyles` for new styling, TypeScript interfaces)
4. Ensure Windows 11 Fluent Design consistency

All specifications follow Windows 11 design language and include comprehensive accessibility support.

---

_Documentation created: 24 November 2025_
_Part of Phase 1 - Core Architecture planning_

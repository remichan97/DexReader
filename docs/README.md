# DexReader Documentation

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout

This folder contains all design and architectural documentation for DexReader.

---

## Folder Structure

### 📐 `/design`

Visual design, layout wireframes, and design system specifications.

- **wireframes.md** - ASCII wireframes for all 5 primary views (Browse, Library, Reader, Settings, Downloads)
- **windows11-design-tokens.md** - Complete design token system with light/dark themes, colors, typography, spacing, effects
- **responsive-behavior-guide.md** - Breakpoint specifications and adaptive behaviors (3 breakpoints: >720px, 620-720px, <620px)

### 🏗️ `/architecture`

System architecture, navigation patterns, and layout specifications.

- **navigation-flow.md** - Complete navigation graph with 9 routes, keyboard shortcuts, back behavior, state persistence
- **layout-specification.md** - Application shell structure, view layouts, sidebar specs, spacing system, z-index hierarchy
- **routing-decision.md** - React Router v6 evaluation and configuration with hooks documentation
- **reader-layout-specification.md** - 3 reading modes (single/double/vertical) with controls, interactions, preloading strategy
- **menu-bar-structure.md** - Native Electron menu bar with 5 menus, 30+ items, keyboard accelerators, implementation code

### 🧩 `/components`

Component specifications, hierarchy, UI patterns, and implementation library.

- **ui-component-library.md** - 📚 **Complete component catalog** with 17 production-ready components, usage examples, design patterns, TypeScript types
- **ui-polish-refinements.md** - ✨ **Polish documentation** covering 9 refinements applied after user testing (focus behavior, animations, icons)
- **component-hierarchy.md** - React component tree with 20+ components, TypeScript interfaces, file structure, communication patterns
- **component-specifications.md** - Detailed specs for AppShell, Sidebar, ViewContainer, and reusable components (MangaCard, SearchBar, Toast) with BEM CSS
- **loading-feedback-states.md** - Complete loading/error/empty state system (skeleton screens, progress rings/bars, spinners, error handling)

---

## Component Library Status

**P1-T03 Progress**: 18/20 steps complete (90%)

✅ **All 17 Core Components Implemented**:

- Form Controls: Button, Input, SearchBar, Checkbox, Switch, Dropdown (6)
- Feedback: Toast, ProgressBar, ProgressRing, Badge, Skeleton (5)
- Navigation: Sidebar, Tabs (2)
- Layout: MangaCard (1)
- Overlays: Modal, Tooltip, Popover (3)
- Utilities: ViewTransition (1)

✅ **Polish Applied**: All components polished to Windows 11 Fluent Design standards

- Official Fluent UI icons with Regular/Filled variants
- Spring-animated indicators (sidebar, tabs)
- Clean focus behavior (no outer glow)
- Consistent textbox styling (32px, 2px border)
- Key-based ViewTransition (no flash)

📝 **Remaining**: Documentation consolidation (Step 19), Integration & testing (Step 20)

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

**Tech Stack**: React 19.1.1 + TypeScript 5.9.2 + Electron 38.1.2
**Routing**: React Router v6.28.0
**Icons**: @fluentui/react-icons 2.0 (Official Microsoft Fluent UI)
**Design System**: Windows 11 (Mica, Acrylic, Segoe UI Variable)
**Animations**: Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` for indicators
**Reading Modes**: Single page, Double page (R-L), Vertical scroll
**Navigation**: Native menu bar + Animated sidebar (240px/48px)
**Responsive**: 5/3/2 column grids across breakpoints
**Components**: 17 production-ready, fully polished to Windows 11 standards

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
3. Follow established patterns (BEM CSS, TypeScript interfaces, spring animations)
4. Ensure Windows 11 Fluent Design consistency

All specifications follow Windows 11 design language and include comprehensive accessibility support.

---

_Documentation created: 24 November 2025_
_Part of Phase 1 - Core Architecture planning_

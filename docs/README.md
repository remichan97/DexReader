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

Component specifications, hierarchy, and UI patterns.

- **component-hierarchy.md** - React component tree with 20+ components, TypeScript interfaces, file structure, communication patterns
- **component-specifications.md** - Detailed specs for AppShell, Sidebar, ViewContainer, and reusable components (MangaCard, SearchBar, Toast) with BEM CSS
- **loading-feedback-states.md** - Complete loading/error/empty state system (skeleton screens, progress rings/bars, spinners, error handling)

---

## Document Purpose

All documents in this folder are **implementation-ready specifications** created as part of P1-T01 (Design Main Application Layout). Each document includes:

- TypeScript interfaces and type definitions
- CSS specifications with class names
- Accessibility requirements (ARIA labels, keyboard navigation)
- Code examples for implementation guidance
- Windows 11 design language integration

---

## Quick Reference

**Tech Stack**: React 19.1.1 + TypeScript 5.9.2 + Electron 38.1.2
**Routing**: React Router v6.28.0
**Design System**: Windows 11 (Mica, Acrylic, Segoe UI Variable)
**Reading Modes**: Single page, Double page (R-L), Vertical scroll
**Navigation**: Native menu bar + Collapsible sidebar (240px/48px)
**Responsive**: 5/3/2 column grids across breakpoints

---

## Usage

When implementing features:

1. Start with `/architecture` docs to understand system structure
2. Reference `/design` docs for visual specifications and design tokens
3. Use `/components` docs for detailed component implementation

All specifications follow Windows 11 design language and include accessibility considerations.

---

*Documentation created: 24 November 2025*
*Part of Phase 1 - Core Architecture planning*

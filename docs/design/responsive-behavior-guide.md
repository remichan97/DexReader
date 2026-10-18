# DexReader Responsive Behaviour Guide

**Created**: 24 November 2025
**Updated**: 14 October 2026 (rewritten to describe the implemented behaviour, as of v1.16.1)

---

## Overview

DexReader is a desktop-first application designed around its 900 × 670 px default window. This guide describes how the layout adapts when the window is resized. The first version of this document specified a 5/3/2-column grid with breakpoints at 720px and 620px and a sidebar that collapses on small windows; none of that was implemented. The shipped behaviour is simpler:

- **Grids are fluid**: the column count follows from the available width, not from breakpoints
- **The sidebar does not respond to window size**: its width is a user setting
- **Media queries are used sparingly**, mainly to stack toolbars and shrink padding at 768px and below
- **There is no enforced minimum window size**

See [`layout-specification.md`](../architecture/layout-specification.md) for the shell and per-view structure.

---

## Fluid Manga Grids

Browse and Library use one grid definition:

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
gap: var(--space-4); /* 16px */
```

The main content area is the window width minus the sidebar, minus 24px of padding on each side. With the default 80px sidebar the columns are:

| Window width | Content width | Columns |
| ------------ | ------------- | ------- |
| 600px        | 472px         | 2       |
| 700px        | 572px         | 2       |
| 800px        | 672px         | 3       |
| 900px        | 772px         | 4       |
| 1100px       | 972px         | 5       |
| 1280px       | 1152px        | 5       |
| 1400px       | 1272px        | 6       |

(The compact sidebar is 20px narrower and the auto-hide strip 72px narrower, so those modes can add a column near a threshold.) Cards scale up to fill the row, so there is no fixed card width.

The Creator view uses a slightly denser grid, `minmax(160px, 1fr)`, reducing to `140px` at ≤768px and `120px` at ≤480px (with smaller gaps).

---

## The Sidebar

The sidebar has three display modes chosen in Settings → Appearance (`full` 80px, `compact` 60px, `auto-hide` 8px expanding on hover or focus). It does **not** collapse or change automatically at any window width. Users who want more room on a small window pick `compact` or `auto-hide`. See the sidebar section of the layout specification.

---

## Media Queries in Use

The breakpoints are not a single system; each is local to the component that needs it.

| Breakpoint | Where it is used                                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `≤1024px`  | `FilterPanel`: the quick-filter row stacks vertically and groups lose their minimum width                               |
| `≤768px`   | The main tablet-width breakpoint (below)                                                                                |
| `≤640px`   | `PriorityList` items and `SecuritySettings` action buttons stack                                                        |
| `≤480px`   | Creator grid and padding, the Gatekeeper unlock card, the download-confirmation dialog's path text, reader header sizes |

### At 768px and below

| Area              | Change                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Downloads         | Padding drops to 16px; the controls row and stats row stack; group headers stack with their stats pinned across the full width |
| Manga Detail      | The hero becomes a single column with a centred 150px cover; the title is 24px; actions and chapter-list controls stack        |
| Creator           | Padding `16px 20px`, 24px title, 140px minimum card                                                                            |
| Manga card        | Content padding drops to 8px; the list variant is 120px tall with an 80px cover                                                |
| Skeleton card     | Content padding drops to 8px, matching the manga card                                                                          |
| Toasts            | The container is limited to the viewport width minus padding; centred positions span the full width                            |
| Reader            | Header is 48px tall with smaller text; page padding drops to 16px; fit-height and actual-size images account for the header    |
| Reader (double)   | Double-page mode stacks the two pages vertically (each up to 50vh)                                                             |
| Reader (vertical) | Pages use the full width with 8px side padding                                                                                 |

### At 480px and below

- Creator: padding `12px 16px`, 22px title, 120px minimum card, 12px gap
- Reader: smaller header minimums and 12px page padding
- Gatekeeper unlock card: tighter width limit and padding, a 56px icon and a smaller title; the download-confirmation dialog shows its path in a smaller font

### Views with no responsive rules

Browse, Library, History and Settings rely on their fluid layouts and wrapping flex rows (search row, filter chips, calendar header) rather than breakpoints. Settings content is capped at 800px wide and centred; Downloads is capped at 1200px.

---

## Reader Behaviour

The reader opts out of the shell and has its own responsive rules (above). See [`reader-layout-specification.md`](../architecture/reader-layout-specification.md) for reading modes and controls.

---

## Touch and Pointer Considerations

DexReader is a mouse-and-keyboard desktop application; it is not designed for touch screens, and there is no bottom navigation or drawer pattern. Two details are touch-aware:

- `@media (hover: none)` in the reader hides the hover-driven page-navigation indicator on devices that can't hover
- Interactive Fluent components keep their standard control sizes; DexReader's own sidebar items are 60-72px tall, which is comfortably above common 44px target guidance

---

## Guidance for New Layouts

- Prefer `grid-template-columns: repeat(auto-fill, minmax(Npx, 1fr))` over breakpoint-driven column counts
- Let flex rows wrap (`flex-wrap`) and stack toolbars at `≤768px` with `flex-direction: column; align-items: stretch`
- Cap long-form content with a `max-width` and centre it, as Settings does
- Test at the 900 × 670 default and at roughly 700px wide (the point where grids drop to two columns)
- Use the design tokens (`--space-*`) for padding changes, and the existing 768px and 480px breakpoints so behaviour stays consistent

---

## Summary

- **Desktop-first** with a 900 × 670 default and no minimum size
- **Fluid grids** (`auto-fill`, 180px minimum) instead of 5/3/2 columns
- **User-controlled sidebar** (full, compact, auto-hide), not a responsive one
- **Component-local media queries**, chiefly 768px and 480px, to stack toolbars and tighten padding

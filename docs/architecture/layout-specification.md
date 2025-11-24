# DexReader Layout Specification

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document specifies the structural layout of DexReader, defining persistent UI elements, view containers, and layout patterns for all primary views.

---

## Application Shell Structure

### Persistent Elements

Every view in DexReader (except fullscreen Reader) shares these persistent elements:

```
┌─────────────────────────────────────────────────────────────┐
│ Native Title Bar with Menu Bar        (always present)      │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │          Main Content Area                       │
│ (collap) │          (view-specific)                         │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

### Layout Zones

**Zone 1: Native Title Bar + Menu Bar**
- **Height**: System-defined (Windows 11: ~32px title bar + ~25px menu bar)
- **Content**: Window controls, menu bar (File, View, Library, Tools, Help)
- **Behavior**: Always visible, native OS rendering
- **Electron Implementation**: `Menu.setApplicationMenu()`

**Zone 2: Navigation Sidebar**
- **Width**: 240px (expanded), 48px (collapsed)
- **Content**: Primary navigation icons + labels
- **Behavior**: Collapsible, persists across views, uses Acrylic blur
- **Toggle**: Ctrl+B or menu item

**Zone 3: Main Content Area**
- **Dimensions**: Fills remaining space (dynamic)
- **Content**: View-specific content (Browse, Library, Reader, Downloads, Settings)
- **Behavior**: Scrollable, contains view-specific layouts

---

## Layout Dimensions

### Default Window Size

**Initial Window**:
- Width: 900px
- Height: 670px
- Minimum: 400px × 300px
- Resizable: Yes
- Maximizable: Yes

### Layout Calculations

**With Expanded Sidebar**:
```
Main Content Width = Window Width - Sidebar Width
                   = 900px - 240px
                   = 660px
```

**With Collapsed Sidebar**:
```
Main Content Width = Window Width - Sidebar Width
                   = 900px - 48px
                   = 852px
```

### Breakpoints

| Breakpoint | Window Width | Layout Behavior |
|------------|--------------|-----------------|
| **Small** | < 620px | 2-column grid, icon-only sidebar or bottom nav |
| **Medium** | 620px - 720px | 3-column grid, compact UI |
| **Large** | > 720px | 5-column grid, full UI (default) |

---

## View-Specific Layouts

### Browse View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Title Bar + Menu Bar                                         │
├──────────┬───────────────────────────────────────────────────┤
│          │ ┌─────────────────────────────────────────────┐  │
│          │ │ Search Bar (full width, 48px height)       │  │
│          │ └─────────────────────────────────────────────┘  │
│          │                                                   │
│ Sidebar  │ ┌─────────────────────────────────────────────┐  │
│ (240px)  │ │ Filters Panel (collapsible, 80px height)   │  │
│          │ └─────────────────────────────────────────────┘  │
│          │                                                   │
│          │ ┌─────────────────────────────────────────────┐  │
│          │ │                                             │  │
│          │ │ Manga Grid (5 columns, auto rows)          │  │
│          │ │ - Card width: ~120px                        │  │
│          │ │ - Card height: ~200px (cover + text)       │  │
│          │ │ - Gap: 16px horizontal, 24px vertical      │  │
│          │ │                                             │  │
│          │ │ (Scrollable, infinite scroll)               │  │
│          │ │                                             │  │
│          │ └─────────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────────┘
```

**Layout Properties**:
- **Search Bar**: Sticky at top (position: sticky)
- **Filters**: Collapsible accordion (closed by default after first use)
- **Grid**: CSS Grid with auto-fill
- **Scroll**: Main content area scrolls, sidebar fixed

---

### Library View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Title Bar + Menu Bar                                         │
├──────────┬────────┬──────────────────────────────────────────┤
│          │        │ ┌────────────────────────────────────┐  │
│          │        │ │ Toolbar (Sort, Filter, View Mode) │  │
│          │Collect │ └────────────────────────────────────┘  │
│ Sidebar  │ ions   │                                          │
│ (240px)  │Sidebar │ ┌────────────────────────────────────┐  │
│          │(200px) │ │                                    │  │
│          │        │ │ Manga Grid (5 columns)             │  │
│          │        │ │ or                                 │  │
│          │        │ │ Manga List (1 column, large items) │  │
│          │        │ │                                    │  │
│          │        │ │ (Scrollable)                       │  │
│          │        │ │                                    │  │
│          │        │ └────────────────────────────────────┘  │
└──────────┴────────┴──────────────────────────────────────────┘
```

**Layout Properties**:
- **Collections Sidebar**: 200px width, nested within main sidebar area
- **Grid Mode**: Same as Browse view (5 columns)
- **List Mode**: Single column, each item ~80px height
- **Toolbar**: Sticky at top of content area

---

### Reader View Layout (Fullscreen)

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar (auto-hide, Acrylic blur, 64px height)              │
│ ← Back | Manga Title - Chapter Name | Ch. Dropdown | Menu   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                                                               │
│                    Manga Page(s)                             │
│                    (centered)                                │
│                                                               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│ Bottom Bar (auto-hide, Acrylic blur, 64px height)           │
│ [◀ Prev]   Page 12/24   [Settings] [Zoom]   [Next ▶]       │
└──────────────────────────────────────────────────────────────┘
```

**Layout Properties**:
- **Background**: Pure black (#000000) for maximum contrast
- **Bars**: Semi-transparent with Acrylic blur
- **Page Area**: Fills entire space between bars
- **Auto-hide**: Bars fade out after 3 seconds of inactivity
- **Reveal**: Mouse movement or touch brings bars back

**Reading Modes**:

1. **Single Page Mode**:
   - One page centered
   - Fit-to-height or fit-to-width based on user preference
   - Black letterboxing on sides/top/bottom

2. **Double Page Mode**:
   - Two pages side-by-side
   - Right-to-left layout (right page is "previous")
   - Both pages fit within viewport height

3. **Vertical Scroll Mode**:
   - Pages stacked vertically
   - Full-width pages
   - Continuous scrolling (webtoon style)
   - Bars remain visible, no auto-hide

---

### Settings View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Title Bar + Menu Bar                                         │
├──────────┬───────────────────────────────────────────────────┤
│          │ ┌──────────────────────────────────────────────┐ │
│          │ │ Settings Header                              │ │
│ Sidebar  │ └──────────────────────────────────────────────┘ │
│ (240px)  │                                                   │
│          │ ┌──────────────────────────────────────────────┐ │
│ Settings │ │ General Settings Panel                       │ │
│ Sections:│ │ - Theme dropdown                             │ │
│          │ │ - Language dropdown                          │ │
│ General  │ │ - Update check toggle                        │ │
│ Reading  │ └──────────────────────────────────────────────┘ │
│ Download │                                                   │
│ Storage  │ ┌──────────────────────────────────────────────┐ │
│ About    │ │ Reading Preferences Panel                    │ │
│          │ │ - Reading mode radio buttons                 │ │
│          │ │ - Direction radio buttons                    │ │
│          │ │ - Image fit radio buttons                    │ │
│          │ └──────────────────────────────────────────────┘ │
│          │                                                   │
│          │ (Scrollable if panels exceed viewport)           │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

**Layout Properties**:
- **Settings Sidebar**: Integrated with main sidebar (left side)
- **Panels**: Stacked vertically with 24px gap
- **Panel Width**: Fills available space (max 800px for readability)
- **Panel Height**: Auto-sized to content

---

### Downloads View Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Title Bar + Menu Bar                                         │
├──────────┬───────────────────────────────────────────────────┤
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ Downloads Header + Controls                │   │
│ Sidebar  │ │ [Pause All] [Resume All] [Clear Completed] │   │
│ (240px)  │ └────────────────────────────────────────────┘   │
│          │                                                   │
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ Active Downloads (list)                    │   │
│          │ │                                            │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ Manga X - Chapter 45                   │ │   │
│          │ │ │ [██████████░░░░░░░░░░] 50% │ 2.5 MB/s  │ │   │
│          │ │ │ 15.2 MB • 30s remaining                │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │                                            │   │
│          │ │ ┌────────────────────────────────────────┐ │   │
│          │ │ │ Manga Y - Chapter 12                   │ │   │
│          │ │ │ [████████████░░░░░░░░] 65% │ 1.8 MB/s  │ │   │
│          │ │ │ 8.4 MB • 15s remaining                 │ │   │
│          │ │ └────────────────────────────────────────┘ │   │
│          │ │                                            │   │
│          │ │ (Scrollable list)                          │   │
│          │ └────────────────────────────────────────────┘   │
│          │                                                   │
│          │ ┌────────────────────────────────────────────┐   │
│          │ │ Completed Downloads (collapsed by default) │   │
│          │ └────────────────────────────────────────────┘   │
└──────────┴───────────────────────────────────────────────────┘
```

**Layout Properties**:
- **Download Items**: Full-width cards, stacked vertically
- **Item Height**: 80px each (compact), expands for errors
- **Progress Bars**: Horizontal, 6px height, full width within card
- **List Sections**: "Active", "Paused", "Completed" (collapsible)

---

## Sidebar Specifications

### Navigation Sidebar (All Views Except Reader)

**Expanded State (240px)**:
```
┌────────────────┐
│ [🔍] Browse    │  ← 48px height per item
│                │
│ [📚] Library   │
│                │
│ [⬇] Downloads │
│                │
│ [⚙] Settings  │
│                │
│                │
│                │
│   (Acrylic bg) │
└────────────────┘
```

**Collapsed State (48px)**:
```
┌────┐
│ 🔍 │  ← 48px × 48px per item
│    │
│ 📚 │
│    │
│ ⬇  │
│    │
│ ⚙  │
│    │
└────┘
```

**Properties**:
- **Background**: Acrylic blur (Windows 11 effect)
- **Item Height**: 48px (minimum touch target)
- **Icon Size**: 20px
- **Text**: 14px Segoe UI Variable
- **Active State**: Accent color background (#0078d4 light, #60cdff dark)
- **Hover State**: Subtle background tint (+5% opacity)
- **Transition**: Width change animates over 200ms ease-in-out

---

## Spacing System

### Global Spacing Scale

Based on 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing (icon-to-text) |
| `--space-sm` | 8px | Card padding, small gaps |
| `--space-md` | 12px | Component internal spacing |
| `--space-lg` | 16px | Section gaps, grid gaps |
| `--space-xl` | 24px | Major section separation |
| `--space-2xl` | 32px | View-level margins |

### Applied Spacing

**Browse/Library Grids**:
- Card gap: 16px horizontal, 24px vertical
- Container padding: 24px all sides
- Section margin: 32px between major sections

**Settings Panels**:
- Panel padding: 16px
- Panel gap: 24px
- Input spacing: 12px between form fields

**Reader Controls**:
- Button padding: 12px horizontal, 8px vertical
- Button gap: 8px
- Bar padding: 16px horizontal

---

## Z-Index Hierarchy

Layering order from bottom to top:

| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0 | Main content, background |
| Sidebar | 10 | Navigation sidebar (Acrylic) |
| Overlays | 100 | Modals, dropdowns, tooltips |
| Reader Controls | 200 | Top/bottom bars in reader |
| Native UI | System | Title bar, menu bar (OS-controlled) |
| Toast/Snackbar | 1000 | Temporary notifications |

---

## Layout Constraints

### Minimum Dimensions

**Window Minimum**:
- Min Width: 400px
- Min Height: 300px
- Rationale: Ensures UI remains usable on small screens

**Content Minimum**:
- Manga Card Min Width: 100px
- Reader Page Min Width: 200px (zoomed out)

### Maximum Dimensions

**Content Maximum**:
- Settings Panel Max Width: 800px (centered for readability)
- Text Column Max Width: 600px (for descriptions)

### Aspect Ratios

**Manga Covers**:
- Target Aspect Ratio: 2:3 (standard manga cover)
- Fallback: 3:4 (if cover dimensions vary)
- Object Fit: Cover (fills card, crops if needed)

---

## Scrolling Behavior

### View Scroll Containers

**Browse/Library Views**:
- **Scroll Container**: Main content area (excluding sidebar)
- **Overflow**: Auto (shows scrollbar when needed)
- **Scroll Behavior**: Smooth (`scroll-behavior: smooth`)

**Settings View**:
- **Scroll Container**: Settings panels area
- **Scroll Snap**: Optional snap to panel tops

**Reader View**:
- **Single/Double Page**: No scroll (page navigation only)
- **Vertical Scroll**: Natural scroll, smooth snapping to page tops

### Scroll Position Preservation

**On View Change**:
- Browse → Library: Reset scroll to top
- Library → Browse: Restore previous scroll position
- Settings sections: Maintain scroll within Settings view

**On Return from Reader**:
- Restore scroll position to manga card that opened reader

---

## Responsive Layout Behavior

### Large Screens (>720px)

**Browse/Library**:
- 5-column grid (default)
- Full sidebar with labels
- All UI elements visible

**Reader**:
- Double page mode available
- Large control buttons

### Medium Screens (620px-720px)

**Browse/Library**:
- 3-column grid
- Sidebar still expanded (can collapse for more space)
- Filters slightly compressed

**Reader**:
- Single page mode recommended
- Compact controls

### Small Screens (<620px)

**Browse/Library**:
- 2-column grid
- Icon-only sidebar or bottom navigation bar
- Filters in drawer/modal

**Reader**:
- Single page mode only
- Touch-optimized controls (larger tap targets)
- Vertical scroll mode recommended for webtoons

---

## Accessibility Layout Features

### Skip Links

Invisible links at top of page for keyboard users:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#sidebar-nav" class="skip-link">Skip to navigation</a>
```

**Behavior**:
- Hidden by default
- Becomes visible on focus (keyboard Tab)
- Allows jumping directly to content

### Landmark Regions

Semantic HTML for screen readers:

```html
<header>       <!-- Title bar + menu bar -->
<nav>          <!-- Sidebar navigation -->
<main>         <!-- Main content area -->
<aside>        <!-- Collections sidebar in Library -->
<footer>       <!-- Status bar (if added) -->
```

### Focus Indicators

**Visible Focus**:
- 2px solid accent color outline
- 2px offset from element
- High contrast in both light/dark modes

---

## Layout Implementation Notes

### CSS Grid for Manga Grids

```css
.manga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px 24px;
  padding: 24px;
}
```

**Benefits**:
- Automatically responsive
- Even spacing
- Fills available width

### Flexbox for Sidebar

```css
.app-shell {
  display: flex;
  height: 100vh;
}

.sidebar {
  flex: 0 0 240px; /* no grow, no shrink, 240px basis */
  transition: flex-basis 200ms ease-in-out;
}

.sidebar.collapsed {
  flex-basis: 48px;
}

.main-content {
  flex: 1; /* grow to fill remaining space */
  overflow-y: auto;
}
```

---

## Layout Performance Considerations

### Virtualization

**Not Needed Initially**:
- Start with simple scroll (browsers handle ~1000 DOM nodes well)
- Add virtualization later if performance issues arise

**When to Add**:
- Library exceeds 500+ manga
- Browse results exceed 1000+ items
- Scroll performance degrades

**Recommended Library**: `react-window` or `@tanstack/react-virtual`

### Layout Shift Prevention

**Strategies**:
- Reserve space for images with aspect-ratio CSS
- Show skeleton screens during load
- Avoid content jumping when images load

```css
.manga-card-cover {
  aspect-ratio: 2/3;
  object-fit: cover;
}
```

---

## Summary

DexReader's layout system provides:

✅ **Consistent Shell**: Persistent sidebar + menu bar across views
✅ **Flexible Content Area**: Adapts to view requirements
✅ **Responsive Grid**: 5/3/2 columns based on window width
✅ **Fullscreen Reader**: Distraction-free reading experience
✅ **Accessible Structure**: Semantic HTML with skip links and landmarks
✅ **Smooth Transitions**: Animated sidebar collapse, route changes
✅ **Touch-Friendly**: Minimum 44px tap targets on all interactive elements

**Review Status**: ✅ Ready for component hierarchy design (Step 2)

---

*Layout specification created: 24 November 2025*
*Part of P1-T01 deliverables*

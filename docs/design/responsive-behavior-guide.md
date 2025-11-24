# DexReader Responsive Behavior Guide

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

DexReader is a desktop-first application optimized for 900×670px default window. This guide defines how layouts adapt when users resize windows.

---

## Breakpoints

### Large (>720px) - Default Layout

**Target**: 900×670px and larger windows

**Browse/Library Views**:
- 5-column manga grid
- Full sidebar with text labels (240px)
- All UI elements visible
- Grid gap: 16px horizontal, 24px vertical

**Reader View**:
- Double page mode available
- Large control buttons (48px height)
- Full chapter dropdown with titles

**Settings View**:
- Two-column form layouts where applicable
- Full sidebar with section labels

---

### Medium (620px-720px) - Compact Layout

**Browse/Library Views**:
- 3-column manga grid
- Sidebar still expanded (can manually collapse for more space)
- Filters slightly compressed
- Grid gap: 12px horizontal, 20px vertical

**Reader View**:
- Single page mode recommended
- Compact controls (40px height)
- Chapter dropdown shows numbers only

**Settings View**:
- Single-column forms
- Sidebar remains visible

---

### Small (<620px) - Mobile-Style Layout

**Browse/Library Views**:
- 2-column manga grid
- Icon-only sidebar (48px) or bottom navigation bar
- Filters in collapsible drawer
- Grid gap: 8px horizontal, 16px vertical

**Reader View**:
- Single page mode only
- Touch-optimized controls (larger tap targets, minimum 44px)
- Vertical scroll mode recommended for webtoons

**Settings View**:
- Single-column forms
- Icon-only sidebar
- Sections in drawer

---

## CSS Media Queries

```css
/* Base styles (Large screens >720px) */
.manga-grid {
  grid-template-columns: repeat(5, 1fr);
  gap: 16px 24px;
}

.sidebar {
  width: 240px;
}

/* Medium screens (620px-720px) */
@media (max-width: 720px) {
  .manga-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px 20px;
  }

  .reader-bottom-bar {
    height: 40px;
  }
}

/* Small screens (<620px) */
@media (max-width: 620px) {
  .manga-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
  }

  .sidebar {
    width: 48px; /* Icon-only */
  }

  .sidebar-item__label {
    display: none;
  }
}
```

---

## Adaptive Components

### MangaGrid

```typescript
function useMangaGridColumns() {
  const [columns, setColumns] = useState(5)

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width < 620) setColumns(2)
      else if (width < 720) setColumns(3)
      else setColumns(5)
    }

    window.addEventListener('resize', updateColumns)
    updateColumns()

    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  return columns
}
```

### Sidebar

```typescript
function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 620) {
        setCollapsed(true) // Auto-collapse on small screens
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>...</nav>
}
```

---

## Touch Targets

### Minimum Sizes

**WCAG 2.2 Guideline**: 44×44px minimum touch target

```css
.button,
.sidebar-item,
.manga-card {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 620px) {
  .reader-bottom-bar button {
    min-height: 48px; /* Larger for touch screens */
    min-width: 48px;
  }
}
```

---

## Summary

✅ **Desktop-First**: Optimized for 900×670px
✅ **Three Breakpoints**: Large, medium, small
✅ **Graceful Degradation**: Layout simplifies at smaller sizes
✅ **Touch-Friendly**: Larger tap targets on small screens
✅ **Flexible Grids**: 5/3/2 columns based on window width

**Review Status**: ✅ Ready for implementation

---

*Responsive guide created: 24 November 2025*
*Part of P1-T01 deliverables*

# DexReader Component Specifications

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document provides detailed specifications for all major layout components, including props, state, styling, and implementation notes. Use BEM (Block-Element-Modifier) for CSS class naming.

---

## Layout Components

### AppShell

**Purpose**: Root layout container with title bar, sidebar, and content area

```typescript
interface AppShellProps {
  children: React.ReactNode
  theme: 'light' | 'dark' | 'auto'
}

interface AppShellState {
  sidebarCollapsed: boolean
  isFullscreen: boolean
}
```

**CSS Classes**:
```css
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--mica-background);
}

.app-shell__title-bar {
  height: 32px;
  -webkit-app-region: drag;
  background: var(--mica-background);
}

.app-shell__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
```

**Accessibility**:
- Skip link to main content: `<a href="#main-content">Skip to main content</a>`
- Landmark regions: `<nav>`, `<main role="main" id="main-content">`

---

### Sidebar

**Purpose**: Primary navigation with collapsible states

```typescript
interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  activeRoute: string
}

interface SidebarItem {
  id: string
  label: string
  icon: IconName
  route: string
  badge?: number // For downloads count
}
```

**CSS Classes**:
```css
.sidebar {
  width: 240px;
  background: var(--surface-secondary);
  border-right: 1px solid var(--divider);
  display: flex;
  flex-direction: column;
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar--collapsed {
  width: 48px;
}

.sidebar__item {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 8px;
}

.sidebar__item--active {
  background: var(--accent-subtle);
  color: var(--accent);
}

.sidebar__item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar__item-label {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar--collapsed .sidebar__item-label {
  display: none;
}
```

**Keyboard Navigation**:
- Arrow keys to navigate items
- Enter/Space to activate item
- Ctrl+B to toggle collapse

**ARIA Attributes**:
```tsx
<nav
  className="sidebar"
  aria-label="Main navigation"
  aria-expanded={!collapsed}
>
  <button
    className="sidebar__item"
    aria-current={active ? "page" : undefined}
    role="link"
  >
    <Icon aria-hidden="true" />
    <span>{label}</span>
  </button>
</nav>
```

---

### ViewContainer

**Purpose**: Wrapper for all view content with scroll management

```typescript
interface ViewContainerProps {
  children: React.ReactNode
  className?: string
  scrollable?: boolean // Default: true
}
```

**CSS Classes**:
```css
.view-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  background: var(--mica-background);
}

.view-container--no-scroll {
  overflow: hidden;
}
```

**Scroll Restoration**:
- Save scroll position on unmount
- Restore on mount if returning to view
- Use `sessionStorage` key: `scroll-${routeName}`

---

## Reusable Components

### MangaCard

**Purpose**: Display manga thumbnail with title and metadata

```typescript
interface MangaCardProps {
  id: string
  title: string
  coverUrl: string
  status?: 'reading' | 'completed' | 'plan_to_read'
  progress?: { current: number; total: number }
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}
```

**CSS Classes**:
```css
.manga-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-secondary);
  transition: transform 150ms, box-shadow 150ms;
}

.manga-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.manga-card__cover {
  aspect-ratio: 2 / 3;
  object-fit: cover;
  background: var(--surface-tertiary);
}

.manga-card__info {
  padding: 12px;
}

.manga-card__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.manga-card__progress {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
```

**Accessibility**:
```tsx
<article
  className="manga-card"
  onClick={onClick}
  onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
  tabIndex={0}
  role="button"
  aria-label={`${title}, ${progress.current} of ${progress.total} chapters read`}
>
  <img
    src={coverUrl}
    alt={`${title} cover`}
    loading="lazy"
  />
  <div className="manga-card__info">
    <h3 className="manga-card__title">{title}</h3>
    <p className="manga-card__progress">{progress.current}/{progress.total}</p>
  </div>
</article>
```

---

### SearchBar

**Purpose**: Search input with live suggestions

```typescript
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
}
```

**CSS Classes**:
```css
.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-bar__input {
  width: 100%;
  height: 40px;
  padding: 0 16px 0 40px; /* Space for icon */
  border: 1px solid var(--divider);
  border-radius: 20px;
  background: var(--surface-secondary);
  font-size: 14px;
  color: var(--text-primary);
}

.search-bar__input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.search-bar__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-bar__suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--surface-secondary);
  border: 1px solid var(--divider);
  border-radius: 8px;
  box-shadow: var(--shadow-large);
  z-index: var(--z-dropdown);
  max-height: 300px;
  overflow-y: auto;
}

.search-bar__suggestion {
  padding: 12px 16px;
  cursor: pointer;
}

.search-bar__suggestion:hover,
.search-bar__suggestion--selected {
  background: var(--accent-subtle);
}
```

**Keyboard Navigation**:
- Arrow Up/Down to navigate suggestions
- Enter to select highlighted suggestion
- Escape to close suggestions

---

### Toast

**Purpose**: Non-blocking notifications

```typescript
interface ToastProps {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number // Default: 4000ms
  onClose?: () => void
}
```

**CSS Classes**:
```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  min-width: 300px;
  max-width: 500px;
  padding: 16px;
  border-radius: 8px;
  background: var(--surface-secondary);
  backdrop-filter: blur(40px);
  box-shadow: var(--shadow-large);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: var(--z-toast);
  animation: toast-slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes toast-slide-in {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast--error {
  border-left: 4px solid var(--error);
}

.toast--success {
  border-left: 4px solid var(--success);
}

.toast--warning {
  border-left: 4px solid var(--warning);
}

.toast__message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.toast__close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: var(--text-secondary);
}
```

**Accessibility**:
```tsx
<div
  className="toast"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <span className="toast__message">{message}</span>
  <button
    className="toast__close"
    onClick={onClose}
    aria-label="Close notification"
  >
    <CloseIcon />
  </button>
</div>
```

---

## Summary

✅ **BEM Naming**: Block-Element-Modifier pattern
✅ **TypeScript Interfaces**: All component props defined
✅ **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
✅ **Responsive**: Media queries for adaptability
✅ **Performance**: Lazy loading, memoization notes

**Review Status**: ✅ Ready for implementation

---

*Component specifications created: 24 November 2025*
*Part of P1-T01 deliverables*

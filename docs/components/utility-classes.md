# Utility Class System

## Overview

DexReader uses a comprehensive utility class system for rapid UI development and consistent styling. These classes are built on top of our Windows 11 design tokens, ensuring theme compatibility and adherence to the design system.

**Location**: `src/renderer/src/assets/utilities.css`

**Import Order**:

```tsx
import './assets/tokens.css' // 1. Design tokens (variables)
import './assets/utilities.css' // 2. Utility classes (uses tokens)
import './assets/main.css' // 3. Application styles
```

## Benefits

- **Consistency**: All utilities use design tokens for theme compatibility
- **Productivity**: Reduce CSS duplication and speed up development
- **Maintainability**: Centralized styling logic, easier to update
- **Performance**: Reusable classes reduce CSS bundle size
- **Accessibility**: Built-in support for semantic HTML patterns

## Naming Conventions

Utility classes follow a predictable naming pattern:

- **Property abbreviations**: `p` = padding, `m` = margin, `flex` = flexbox
- **Design token scale**: Numbers (1-12) map to spacing tokens (e.g., `gap-4` = `var(--space-4)`)
- **Directional suffixes**:
  - `t` = top
  - `b` = bottom
  - `l` = left
  - `r` = right
  - `x` = horizontal (left + right)
  - `y` = vertical (top + bottom)
- **Semantic values**: `primary`, `secondary`, `tertiary`, `error`, `success`, `warning`

### Examples

- `mt-4` = margin-top: var(--space-4) _(16px)_
- `px-6` = padding-left: var(--space-6); padding-right: var(--space-6) _(24px horizontal padding)_
- `text-secondary` = color: var(--win-text-secondary) _(theme-aware secondary text color)_

## Available Utility Classes

### Flexbox Utilities

#### Display

```css
.flex            /* display: flex */
.inline-flex     /* display: inline-flex */
```

#### Direction

```css
.flex-row        /* flex-direction: row */
.flex-row-reverse
.flex-col        /* flex-direction: column */
.flex-col-reverse
```

#### Wrap

```css
.flex-wrap       /* flex-wrap: wrap */
.flex-nowrap     /* flex-wrap: nowrap */
```

#### Justify Content

```css
.justify-start   /* justify-content: flex-start */
.justify-end     /* justify-content: flex-end */
.justify-center  /* justify-content: center */
.justify-between /* justify-content: space-between */
.justify-around  /* justify-content: space-around */
.justify-evenly  /* justify-content: space-evenly */
```

#### Align Items

```css
.items-start     /* align-items: flex-start */
.items-end       /* align-items: flex-end */
.items-center    /* align-items: center */
.items-baseline  /* align-items: baseline */
.items-stretch   /* align-items: stretch */
```

#### Align Self

```css
.self-auto       /* align-self: auto */
.self-start      /* align-self: flex-start */
.self-end        /* align-self: flex-end */
.self-center     /* align-self: center */
.self-stretch    /* align-self: stretch */
```

#### Flex Sizing

```css
.flex-1          /* flex: 1 1 0% - grow and shrink, zero basis */
.flex-auto       /* flex: 1 1 auto - grow and shrink, auto basis */
.flex-initial    /* flex: 0 1 auto - shrink but don't grow */
.flex-none       /* flex: none - neither grow nor shrink */
```

**Usage Example**:

```tsx
<div className="flex flex-col items-center gap-4">
  <h1>Title</h1>
  <p>Content</p>
</div>
```

### Gap Utilities

Map to spacing tokens (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px):

```css
.gap-0           /* gap: 0 */
.gap-1           /* gap: var(--space-1) = 4px */
.gap-1-5         /* gap: var(--space-1-5) = 6px */
.gap-2           /* gap: var(--space-2) = 8px */
.gap-3           /* gap: var(--space-3) = 12px */
.gap-4           /* gap: var(--space-4) = 16px */
.gap-5           /* gap: var(--space-5) = 20px */
.gap-6           /* gap: var(--space-6) = 24px */
.gap-8           /* gap: var(--space-8) = 32px */
.gap-10          /* gap: var(--space-10) = 40px */
.gap-12          /* gap: var(--space-12) = 48px */
```

**Row-specific gaps**:

```css
.row-gap-2       /* row-gap: var(--space-2) */
.row-gap-4       /* row-gap: var(--space-4) */
.row-gap-6       /* row-gap: var(--space-6) */
```

**Column-specific gaps**:

```css
.col-gap-2       /* column-gap: var(--space-2) */
.col-gap-4       /* column-gap: var(--space-4) */
.col-gap-6       /* column-gap: var(--space-6) */
```

**Usage Example**:

```tsx
<div className="flex gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

### Padding Utilities

#### All Sides

```css
.p-0, .p-1, .p-2, .p-3, .p-4, .p-5, .p-6, .p-8, .p-10, .p-12
```

#### Horizontal (left + right)

```css
.px-0, .px-2, .px-3, .px-4, .px-6
```

#### Vertical (top + bottom)

```css
.py-0, .py-2, .py-3, .py-4, .py-6
```

#### Individual Sides

```css
.pt-0, .pt-2, .pt-4, .pt-6  /* padding-top */
.pr-0, .pr-2, .pr-4, .pr-6  /* padding-right */
.pb-0, .pb-2, .pb-4, .pb-6  /* padding-bottom */
.pl-0, .pl-2, .pl-4, .pl-6  /* padding-left */
```

**Usage Example**:

```tsx
<div className="p-6">
  {' '}
  {/* 24px padding all sides */}
  <header className="pb-4">
    {' '}
    {/* 16px bottom padding */}
    <h1>Title</h1>
  </header>
  <main className="px-4 py-6">
    {' '}
    {/* 16px horizontal, 24px vertical */}
    <p>Content</p>
  </main>
</div>
```

### Margin Utilities

#### All Sides

```css
.m-0, .m-1, .m-2, .m-3, .m-4, .m-5, .m-6
.m-auto          /* margin: auto - for centering */
```

#### Horizontal (left + right)

```css
.mx-0, .mx-2, .mx-4
.mx-auto         /* margin-left: auto; margin-right: auto */
```

#### Vertical (top + bottom)

```css
.my-0, .my-2, .my-4
```

#### Individual Sides

```css
.mt-0, .mt-1, .mt-2, .mt-3, .mt-4, .mt-5, .mt-6, .mt-8  /* margin-top */
.mr-0, .mr-2, .mr-4, .mr-6  /* margin-right */
.mb-0, .mb-1, .mb-2, .mb-3, .mb-4, .mb-6, .mb-8  /* margin-bottom */
.ml-0, .ml-2, .ml-4, .ml-6  /* margin-left */
```

**Usage Example**:

```tsx
<div className="mx-auto max-w-lg">
  {' '}
  {/* Center horizontally, max-width 512px */}
  <h1 className="mb-4">Title</h1>
  <p className="mt-2">Paragraph with top margin</p>
</div>
```

### Text Utilities

#### Alignment

```css
.text-left       /* text-align: left */
.text-center     /* text-align: center */
.text-right      /* text-align: right */
.text-justify    /* text-align: justify */
```

#### Color (theme-aware)

```css
.text-primary    /* color: var(--win-text-primary) */
.text-secondary  /* color: var(--win-text-secondary) */
.text-tertiary   /* color: var(--win-text-tertiary) */
.text-disabled   /* color: var(--win-text-disabled) */
.text-error      /* color: var(--win-error) */
.text-success    /* color: var(--win-success) */
.text-warning    /* color: var(--win-warning) */
.text-accent     /* color: var(--win-accent) */
```

#### Font Size

```css
.text-caption    /* font-size: 12px */
.text-body       /* font-size: 14px */
.text-subtitle   /* font-size: 16px */
.text-title      /* font-size: 20px */
```

#### Font Weight

```css
.font-regular    /* font-weight: 400 */
.font-semibold   /* font-weight: 600 */
.font-bold       /* font-weight: 700 */
```

**Usage Example**:

```tsx
<div>
  <h1 className="text-title font-bold text-primary">Heading</h1>
  <p className="text-body text-secondary">Description text</p>
  <span className="text-caption text-tertiary">Caption</span>
</div>
```

### Layout Utilities

#### Display

```css
.block           /* display: block */
.inline-block    /* display: inline-block */
.inline          /* display: inline */
.hidden          /* display: none */
```

#### Width

```css
.w-full          /* width: 100% */
.w-auto          /* width: auto */
```

#### Height

```css
.h-full          /* height: 100% */
.h-auto          /* height: auto */
```

#### Max Width

```css
.max-w-xs        /* max-width: 320px */
.max-w-sm        /* max-width: 384px */
.max-w-md        /* max-width: 448px */
.max-w-lg        /* max-width: 512px */
.max-w-xl        /* max-width: 576px */
.max-w-full      /* max-width: 100% */
```

#### Position

```css
.relative        /* position: relative */
.absolute        /* position: absolute */
.fixed           /* position: fixed */
.sticky          /* position: sticky */
```

#### Overflow

```css
.overflow-auto   /* overflow: auto */
.overflow-hidden /* overflow: hidden */
.overflow-visible /* overflow: visible */
.overflow-scroll /* overflow: scroll */
.overflow-x-auto /* overflow-x: auto */
.overflow-y-auto /* overflow-y: auto */
```

**Usage Example**:

```tsx
<div className="relative h-full overflow-y-auto">
  <div className="max-w-lg mx-auto">
    <Content />
  </div>
</div>
```

### Background Utilities

Theme-aware background colors:

```css
.bg-base         /* background-color: var(--win-bg-base) */
.bg-card         /* background-color: var(--win-bg-card) */
.bg-elevated     /* background-color: var(--win-bg-elevated) */
.bg-subtle       /* background-color: var(--win-bg-subtle) */
.bg-hover        /* background-color: var(--win-bg-hover) */
```

**Usage Example**:

```tsx
<div className="bg-card rounded-md p-4">
  <h2>Card Content</h2>
</div>
```

### Border Utilities

#### Border Radius

```css
.rounded-none    /* border-radius: 0 */
.rounded-xs      /* border-radius: 2px */
.rounded-sm      /* border-radius: 4px */
.rounded-md      /* border-radius: 8px */
.rounded-lg      /* border-radius: 12px */
.rounded-full    /* border-radius: 9999px */
```

#### Border

```css
.border          /* border: 1px solid var(--win-border-default) */
.border-0        /* border: 0 */
```

**Usage Example**:

```tsx
<button className="border rounded-md px-4 py-2">Button</button>
```

### Opacity Utilities

```css
.opacity-0       /* opacity: 0 */
.opacity-30      /* opacity: 0.3 */
.opacity-50      /* opacity: 0.5 */
.opacity-70      /* opacity: 0.7 */
.opacity-100     /* opacity: 1 */
```

### Cursor Utilities

```css
.cursor-pointer      /* cursor: pointer */
.cursor-default      /* cursor: default */
.cursor-not-allowed  /* cursor: not-allowed */
```

### Accessibility Utilities

```css
.sr-only         /* Screen reader only - visually hidden but accessible */
```

Visually hides content while keeping it accessible to screen readers:

```tsx
<button>
  <Icon name="close" />
  <span className="sr-only">Close dialog</span>
</button>
```

## Usage Guidelines

### ✅ DO

- Use utility classes for common patterns (flexbox layouts, spacing, text styling)
- Combine utilities for complex layouts: `className="flex flex-col items-center gap-4"`
- Use design token scale (1-12) instead of arbitrary values
- Apply theme-aware color utilities: `.text-primary`, `.bg-card`
- Use `.sr-only` for accessibility when visual labels are hidden

### ❌ DON'T

- Override utility classes with inline styles
- Create component-specific utility classes (use component CSS instead)
- Mix arbitrary pixel values with design tokens
- Use utilities for complex component-specific styling (create dedicated CSS files)

## When to Use Component CSS vs. Utilities

### Use Utilities For

- Layout (flexbox, grid, spacing)
- Text styling (color, size, weight, alignment)
- Common patterns that appear across multiple components
- Rapid prototyping and iteration

### Use Component CSS For

- Component-specific styles
- Complex hover/focus states
- Animations and transitions
- Child element targeting (`.parent > .child`)
- Media queries and responsive breakpoints

## Migration from Inline Styles

**Before** (inline styles):

```tsx
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px'
  }}
>
  <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Title</h1>
  <p style={{ color: 'var(--win-text-secondary)' }}>Content</p>
</div>
```

**After** (utility classes):

```tsx
<div className="flex flex-col gap-4 p-6">
  <h1 className="text-title font-bold">Title</h1>
  <p className="text-secondary">Content</p>
</div>
```

## Design Token Reference

All utility classes are built on design tokens defined in `tokens.css`:

### Spacing Scale

- `--space-0`: 0
- `--space-1`: 4px
- `--space-1-5`: 6px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px

### Text Colors (theme-aware)

- `--win-text-primary`: Main text color
- `--win-text-secondary`: Secondary/muted text
- `--win-text-tertiary`: Tertiary/disabled text
- `--win-text-disabled`: Disabled state text

### Semantic Colors (theme-aware)

- `--win-error`: Error states (#f85149 dark, #A80000 light)
- `--win-success`: Success states (#3fb950 dark, #0f7b0f light)
- `--win-warning`: Warning states (#ff8c42 dark, #f7630c light)
- `--win-accent`: Accent/primary actions (#60cdff dark, #0078d4 light)

### Background Colors (theme-aware)

- `--win-bg-base`: Page background
- `--win-bg-card`: Card/panel background
- `--win-bg-elevated`: Elevated surface background
- `--win-bg-subtle`: Subtle background tint
- `--win-bg-hover`: Hover state background

### Border Radius

- `--radius-none`: 0
- `--radius-xs`: 2px
- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 12px
- `--radius-full`: 9999px

## Examples

### Card Component

```tsx
<div className="bg-card rounded-md border p-6">
  <h2 className="text-subtitle font-semibold mb-3">Card Title</h2>
  <p className="text-body text-secondary mb-4">Card description text</p>
  <div className="flex gap-3 justify-end">
    <button className="px-4 py-2">Cancel</button>
    <button className="px-4 py-2 bg-hover rounded-sm">Confirm</button>
  </div>
</div>
```

### List with Items

```tsx
<ul className="flex flex-col gap-2">
  {items.map((item) => (
    <li key={item.id} className="flex items-center justify-between p-3 bg-subtle rounded-sm">
      <span className="text-body text-primary">{item.name}</span>
      <span className="text-caption text-tertiary">{item.date}</span>
    </li>
  ))}
</ul>
```

### Centered Empty State

```tsx
<div className="flex flex-col items-center justify-center h-full gap-4 text-center">
  <Icon className="opacity-50" />
  <h2 className="text-subtitle font-semibold text-secondary">No results found</h2>
  <p className="text-body text-tertiary max-w-md">Try adjusting your search criteria</p>
</div>
```

### Form Layout

```tsx
<form className="flex flex-col gap-6 max-w-lg">
  <div className="flex flex-col gap-2">
    <label className="text-body font-semibold">Username</label>
    <input className="p-3 border rounded-sm" />
  </div>
  <div className="flex flex-col gap-2">
    <label className="text-body font-semibold">Password</label>
    <input type="password" className="p-3 border rounded-sm" />
  </div>
  <button className="px-6 py-3 rounded-md self-end">Submit</button>
</form>
```

## Related Documentation

- [Design Tokens](../design/windows11-design-tokens.md) - Complete design token reference
- [Component Library](ui-component-library.md) - Reusable UI components
- [Responsive Behavior](../design/responsive-behavior-guide.md) - Responsive design patterns

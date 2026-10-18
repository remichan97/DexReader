# Utility Classes

## Overview

`src/renderer/src/assets/utilities.css` holds a small set of single-purpose classes (flexbox, spacing, text, borders) built on the design tokens in `tokens.css`, so they follow the light and dark themes. It currently has **51 classes**, and every one of them is used by a component or view.

**Import order** (`src/renderer/src/main.tsx`):

```tsx
import './assets/tokens.css' // 1. Design tokens (variables)
import './assets/utilities.css' // 2. Utility classes (use the tokens)
import './assets/main.css' // 3. Application styles
```

## The file only holds what is used

If nothing uses a class, it doesn't belong in the file. When you need a utility that doesn't exist, add it; when the last use of one goes, delete it.

- Add the class to the matching section of `utilities.css`, using a design token rather than a pixel value, and add its row to the tables below.
- **Never build a utility class name dynamically** (for example `` `gap-${size}` ``). Pruning relies on a plain search for the whole class name, so a name assembled at runtime would look unused and get deleted. Write the full class names, or choose between them with a conditional.
- Keep a utility out of the file if only one component needs it. Give that component its own CSS instead.

## Naming conventions

- **Property abbreviations**: `p` = padding, `m` = margin, `gap`, `flex`, `text`
- **Spacing scale**: numbers map to spacing tokens, so `gap-4` is `var(--space-4)` (16px). `gap-1-5` is the 6px step.
- **Directional suffixes**: `t` = top, `b` = bottom, `x` = horizontal (left and right), `y` = vertical (top and bottom)
- **Semantic values**: `primary`, `secondary`, `error`

## Available classes

### Flexbox

| Class              | Declaration                                         |
| ------------------ | --------------------------------------------------- |
| `.flex`            | `display: flex;`                                    |
| `.inline-flex`     | `display: inline-flex;`                             |
| `.grid`            | `display: grid;`                                    |
| `.grid-cols-2`     | `grid-template-columns: repeat(2, minmax(0, 1fr));` |
| `.flex-col`        | `flex-direction: column;`                           |
| `.flex-wrap`       | `flex-wrap: wrap;`                                  |
| `.justify-end`     | `justify-content: flex-end;`                        |
| `.justify-center`  | `justify-content: center;`                          |
| `.justify-between` | `justify-content: space-between;`                   |
| `.items-start`     | `align-items: flex-start;`                          |
| `.items-end`       | `align-items: flex-end;`                            |
| `.items-center`    | `align-items: center;`                              |
| `.flex-1`          | `flex: 1 1 0%;`                                     |

### Gap

| Class      | Declaration              |
| ---------- | ------------------------ |
| `.gap-1`   | `gap: var(--space-1);`   |
| `.gap-1-5` | `gap: var(--space-1-5);` |
| `.gap-2`   | `gap: var(--space-2);`   |
| `.gap-3`   | `gap: var(--space-3);`   |
| `.gap-4`   | `gap: var(--space-4);`   |
| `.gap-5`   | `gap: var(--space-5);`   |
| `.gap-6`   | `gap: var(--space-6);`   |

### Padding

| Class   | Declaration                                                    |
| ------- | -------------------------------------------------------------- |
| `.p-4`  | `padding: var(--space-4);`                                     |
| `.p-6`  | `padding: var(--space-6);`                                     |
| `.p-10` | `padding: var(--space-10);`                                    |
| `.px-3` | `padding-left: var(--space-3); padding-right: var(--space-3);` |
| `.py-2` | `padding-top: var(--space-2); padding-bottom: var(--space-2);` |
| `.py-4` | `padding-top: var(--space-4); padding-bottom: var(--space-4);` |
| `.pt-3` | `padding-top: var(--space-3);`                                 |

### Margin

| Class   | Declaration                      |
| ------- | -------------------------------- |
| `.m-0`  | `margin: var(--space-0);`        |
| `.mt-2` | `margin-top: var(--space-2);`    |
| `.mt-3` | `margin-top: var(--space-3);`    |
| `.mt-4` | `margin-top: var(--space-4);`    |
| `.mt-6` | `margin-top: var(--space-6);`    |
| `.mb-2` | `margin-bottom: var(--space-2);` |
| `.mb-3` | `margin-bottom: var(--space-3);` |
| `.mb-4` | `margin-bottom: var(--space-4);` |

### Text

| Class             | Declaration                                     |
| ----------------- | ----------------------------------------------- |
| `.text-center`    | `text-align: center;`                           |
| `.text-primary`   | `color: var(--win-text-primary);`               |
| `.text-secondary` | `color: var(--win-text-secondary);`             |
| `.text-error`     | `color: var(--win-error);`                      |
| `.text-caption`   | `font-size: var(--win-font-size-caption);`      |
| `.text-body`      | `font-size: var(--win-font-size-body);`         |
| `.text-subtitle`  | `font-size: var(--win-font-size-subtitle);`     |
| `.font-semibold`  | `font-weight: var(--win-font-weight-semibold);` |

### Layout

| Class       | Declaration      |
| ----------- | ---------------- |
| `.h-screen` | `height: 100vh;` |

### Background

| Class            | Declaration                                |
| ---------------- | ------------------------------------------ |
| `.bg-subtle`     | `background-color: var(--win-bg-subtle);`  |
| `.bg-error-tint` | `background-color: var(--win-error-tint);` |

### Border

| Class           | Declaration                                    |
| --------------- | ---------------------------------------------- |
| `.rounded-md`   | `border-radius: var(--radius-md);`             |
| `.rounded-lg`   | `border-radius: var(--radius-lg);`             |
| `.border`       | `border: 1px solid var(--win-border-default);` |
| `.border-error` | `border-color: var(--win-error);`              |

### Accessibility

| Class      | Declaration                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.sr-only` | `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;` |

## Usage guidelines

### Do

- Use utilities for layout, spacing and text styling that several components share: `className="flex flex-col items-center gap-4"`
- Use the theme-aware colour classes (`.text-primary`, `.text-secondary`, `.text-error`) instead of hard-coded colours
- Use `.sr-only` for text that should reach screen readers but not be seen

### Don't

- Override a utility with an inline style
- Add component-specific utilities (use the component's CSS)
- Use utilities for hover and focus states, animations, media queries or child targeting (`.parent > .child`). Those belong in component CSS.

## Examples

### Search syntax hint (`LibraryView`)

```tsx
<div className="mb-4 p-4 bg-subtle border rounded-lg">
  <div className="grid grid-cols-2 gap-2 text-body">{/* ... */}</div>
</div>
```

### Inline error notice (Gatekeeper dialogs)

```tsx
<div className="px-3 py-2 bg-error-tint border border-error rounded-md">{/* ... */}</div>
```

### Row with a trailing action

```tsx
<div className="flex items-center justify-between gap-3">
  <span className="text-body text-primary">{name}</span>
  <span className="text-caption text-secondary">{date}</span>
</div>
```

## Related documentation

- [Design Tokens](../design/windows11-design-tokens.md): the tokens the utilities are built on
- [Component Library](ui-component-library.md): reusable UI components
- [Responsive Behavior](../design/responsive-behavior-guide.md): responsive design patterns

# UI Component Library

**Version**: 1.16.0
**Last Updated**: 12 October 2026
**Design System**: Fluent 2 (`@fluentui/react-components`) with a custom DexReader theme and Windows 11 design tokens

> **Overview**: DexReader's UI component library is a set of TypeScript components that wrap Fluent 2 (and, for a few, are DexReader's own). Each keeps a small, stable public prop API, so views are not coupled to Fluent directly. Fluent provides the rendering, focus handling, keyboard navigation and popup positioning; the wrappers add DexReader behaviour and defaults. See [Built on Fluent 2](#built-on-fluent-2).

---

## Table of Contents

- [Getting Started](#getting-started)
- [Built on Fluent 2](#built-on-fluent-2)
- [Design Principles](#design-principles)
- [Component Catalog](#component-catalog)
  - [Form Controls](#form-controls)
  - [Feedback & Status](#feedback--status)
  - [Navigation](#navigation)
  - [Layout & Display](#layout--display)
  - [Overlays & Dialogs](#overlays--dialogs)
  - [Utilities](#utilities)
- [Design Patterns](#design-patterns)
- [Animation Guidelines](#animation-guidelines)
- [Accessibility](#accessibility)
- [TypeScript Types](#typescript-types)

---

## Getting Started

### Component Structure

All components follow a consistent structure:

```
ComponentName/
├── ComponentName.tsx      # React component with TypeScript
├── ComponentName.css      # Optional: layout CSS with design tokens (Fluent-based components mostly use makeStyles instead)
├── index.ts              # Barrel export
└── README.md             # Component documentation
```

### Basic Usage

```tsx
import { Button, Input, Modal } from '@/components'

function MyComponent() {
  return (
    <div>
      <Input label="Username" placeholder="Enter username" />
      <Button variant="accent" size="medium">
        Submit
      </Button>
    </div>
  )
}
```

### Design Tokens

All components use CSS custom properties from `tokens.css`:

```css
/* Color tokens */
--win-accent              /* #0078D4 - Primary accent */
--win-accent-subtle       /* rgba(0, 120, 212, 0.1) */
--win-bg-solid            /* Background colors */
--win-text-primary        /* Text colors */

/* Spacing tokens */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;

/* Radius tokens */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;

/* Animation tokens */
--transition-fast: 0.15s;
--transition-normal: 0.2s;
--transition-slow: 0.3s;
```

---

## Built on Fluent 2

Since v1.16.0 the shared components are thin wrappers over Fluent 2 rather than hand-rolled controls.

- **Theme**: `App.tsx` wraps the app in a `FluentProvider` whose theme comes from `createDexReaderThemes(accentColor)` (`src/renderer/src/theme/fluentTheme.ts`). It regenerates Fluent's brand ramp from the current accent colour and pins the neutral colours to DexReader's Windows 11 palette, for light and dark. The reader nests its own `FluentProvider` so a forced dark reader still themes Fluent components and their portalled popups.
- **Public props stay stable**: a wrapper maps its existing props onto the Fluent component (for example `Button`'s `variant` onto Fluent's `appearance`), so call sites don't change when the internals do. Options that nothing used were dropped (for example `Select` no longer has multi-select or search modes); add them back by using Fluent's own `multiselect` or `Combobox` if a real use appears.
- **Styling**: new styling uses Griffel's `makeStyles` and Fluent's `tokens`. Griffel's runtime style tags carry the app's CSP nonce (`RendererProvider`), so the Content Security Policy is unchanged and needs no `unsafe-inline`.
- **What Fluent now provides**: portal rendering, click-outside and Escape dismissal, focus trapping and restoration, arrow-key navigation and edge-aware positioning for `Modal`, `Tooltip`, `Popover`, `Select`, menus and the pickers. The wrappers no longer implement these themselves.
- **Fluent quirks to know about**: its popups and some controls ship their own size caps (`Dropdown` min-width 250px, `MenuPopover` max-width 300px, `MenuItem` max-width 290px, `SearchBox` max-width 468px, the `TagPicker` list max-height 80vh) which wrappers override where a layout needs it. `TagPicker` closes its list after every pick unless `keepOpenOnSelect` is set. `SearchBox` collapses its trailing slot until focused, which `SearchBar` overrides.
- **Icons and flags**: icons come from `@fluentui/react-icons`; country flags from `country-flag-icons`, imported per flag and bundled.

---

## Design Principles

### 1. Windows 11 Fluent Design

All components follow Microsoft's Fluent Design System:

- **Subtle borders**: 1-2px borders with `--win-border-default`
- **Bottom border emphasis**: 2px accent borders on focus for inputs
- **Rounded corners**: 4-8px border radius
- **Mica/Acrylic effects**: Backdrop blur for overlays
- **Spring animations**: Overshoot easing for satisfying feedback

### 2. Consistent Behavior

- **Focus management**: Tab navigation, visible focus indicators
- **Keyboard shortcuts**: Space/Enter for activation, Escape to close
- **Click-outside-to-close**: Dropdowns, modals, popovers
- **Disabled states**: Visual feedback with reduced opacity

### 3. Accessibility First

- **ARIA attributes**: Proper roles, labels, and states
- **Keyboard navigation**: Full keyboard support
- **Screen reader support**: Descriptive labels and announcements
- **Motion preferences**: Respects `prefers-reduced-motion`

### 4. TypeScript Integration

- **Strict typing**: All props fully typed
- **IntelliSense support**: JSDoc comments for prop descriptions
- **Type safety**: No `any` types, proper interfaces

---

## Component Catalog

### Form Controls

#### Button

**Purpose**: Primary user action trigger
**Variants**: 5 (primary, secondary, accent, danger, ghost)
**Sizes**: 3 (small, medium, large)
**Features**: Loading state, icon support, full width option

```tsx
<Button variant="accent" size="medium" icon={<SaveIcon />}>
  Save Changes
</Button>
```

[Full Documentation](../../src/renderer/src/components/Button/README.md)

---

#### Input

**Purpose**: Single-line text input
**Features**: Label, error states, required indicator, helper text
**Focus**: Clean bottom border transition (no outer glow)
**Accessibility**: ARIA labels, error announcements

```tsx
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  required
  error="Invalid email address"
/>
```

[Full Documentation](../../src/renderer/src/components/Input/README.md)

---

#### SearchBar

**Purpose**: Dedicated search input with icon
**Built on**: Fluent `SearchBox` (icon, clear button and focus underline come from Fluent)
**Features**: Debounced `onChange` (a clear is reported immediately), Ctrl+F to focus, Escape to clear, optional filter button with an active-filter count, and an `actions` slot for extra buttons shown inside the box

```tsx
<SearchBar
  value={query}
  onChange={setQuery}
  placeholder="Search manga..."
  onFilterClick={openFilters}
  filterCount={3}
/>
```

[Full Documentation](../../src/renderer/src/components/SearchBar/README.md)

---

#### Checkbox

**Purpose**: Binary or indeterminate selection
**States**: 3 (unchecked, checked, indeterminate)
**Features**: Animated checkmark, label support, group functionality
**Animation**: Scale + fade checkmark (200ms)

```tsx
<Checkbox label="Remember me" checked={isChecked} onChange={setIsChecked} />
```

[Full Documentation](../../src/renderer/src/components/Checkbox/README.md)

---

#### Switch

**Purpose**: Toggle control for binary settings
**Layout**: Full-width with right-aligned toggle
**Features**: Label + description, sliding knob animation
**Size**: 40×20px toggle, 12px knob

```tsx
<Switch
  label="Dark Mode"
  description="Use dark theme across the app"
  checked={isDark}
  onChange={setIsDark}
/>
```

[Full Documentation](../../src/renderer/src/components/Switch/README.md)

---

#### Select

**Purpose**: Choose one value from a list
**Built on**: Fluent `Field` + `Dropdown`
**Features**: Keyboard navigation, disabled options, optional `icon` per option (shown in the list), shrinks to its content in toolbars and fills its container elsewhere; the popup is sized to its longest option, never narrower than the trigger
**Props**: `value`, `onChange(value: string)`, `options`, `label`, `placeholder`, `helperText`, `disabled`

```tsx
<Select label="Sort by" options={sortOptions} value={sort} onChange={setSort} />
```

[Full Documentation](../../src/renderer/src/components/Select/README.md)

---

#### TagPicker

**Purpose**: Searchable multi-select that shows its picks as removable chips
**Built on**: Fluent `TagPicker`
**Features**: Typing filters the list, optional option groups, `disabledIds` to cross-exclude from a paired picker (the Browse Include and Exclude tags), optional `icon` per option, picked options hidden from the list, and `keepOpenOnSelect` to keep the list open for picking several in a row by click or arrow keys and Enter. The list is capped at 280px so it opens below (or above) the control

```tsx
<TagPicker
  options={options}
  selectedIds={selected}
  onChange={setSelected}
  keepOpenOnSelect
  placeholder="Search tags..."
/>
```

---

### Feedback & Status

#### Toast

**Purpose**: Temporary notification messages
**Variants**: 4 (info, success, warning, error)
**Positions**: 4 (top-right, top-left, bottom-right, bottom-left)
**Features**: Auto-dismiss, stacking, close button

```tsx
// Use the hook
const { showToast } = useToast()

showToast({
  message: 'Settings saved successfully',
  variant: 'success',
  duration: 3000
})
```

[Full Documentation](../../src/renderer/src/components/Toast/README.md)

---

#### ProgressBar

**Purpose**: Linear progress indicator
**Modes**: 2 (determinate, indeterminate)
**Variants**: 3 (default, success, error)
**Features**: Label, percentage, metadata (speed, ETA)

```tsx
<ProgressBar
  value={75}
  max={100}
  label="Downloading chapter"
  showPercentage
  metadata={{ speed: '2.5 MB/s', eta: '5s' }}
/>
```

[Full Documentation](../../src/renderer/src/components/ProgressBar/README.md)

---

#### ProgressRing

**Purpose**: Circular loading spinner
**Modes**: 2 (determinate, indeterminate)
**Sizes**: 3 (small 24px, medium 40px, large 64px)
**Animation**: Rotation + arc (800ms) for indeterminate

```tsx
<ProgressRing size="medium" indeterminate />
```

[Full Documentation](../../src/renderer/src/components/ProgressRing/README.md)

---

#### Badge

**Purpose**: Status indicators and labels
**Variants**: 5 (default, success, warning, error, info)
**Sizes**: 2 (small, medium)
**Features**: Icon support, dot variant

```tsx
<Badge variant="success" size="medium">Active</Badge>
<Badge variant="error" dot />
```

[Full Documentation](../../src/renderer/src/components/Badge/README.md)

---

#### Skeleton

**Purpose**: Loading placeholders
**Variants**: 4 (text, circle, rect, card)
**Features**: Shimmer animation, grid support
**Animation**: Gradient sweep (1.5s)

```tsx
<SkeletonGrid count={6} columns={3} />
```

[Full Documentation](../../src/renderer/src/components/Skeleton/README.md)

---

### Navigation

#### Sidebar

**Purpose**: Main application navigation
**Features**: Fluent UI icons (Regular/Filled variants), animated indicator
**Animation**: Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (400ms)
**Icon Pattern**: Regular for inactive, Filled for active

```tsx
<Sidebar
  items={[
    {
      id: 'browse',
      label: 'Browse',
      icon: <Search24Regular />,
      iconFilled: <Search24Filled />,
      path: '/browse'
    }
  ]}
/>
```

**Icons Used**:

- `@fluentui/react-icons` package (~5-6 KB total)
- Search24Regular/Filled
- Library24Regular/Filled
- ArrowDownload24Regular/Filled
- Settings24Regular/Filled

[Full Documentation](../../src/renderer/src/components/Sidebar/README.md)

---

#### Tabs

**Purpose**: Content organization with tab navigation
**Features**: Animated indicator, keyboard navigation, disabled tabs
**Architecture**: Context-based (Tabs/TabList/Tab/TabPanel)
**Animation**: Sliding accent bar (300ms cubic-bezier)

```tsx
<Tabs defaultValue="overview">
  <TabList>
    <Tab value="overview">Overview</Tab>
    <Tab value="chapters">Chapters</Tab>
  </TabList>
  <TabPanel value="overview">Content here</TabPanel>
  <TabPanel value="chapters">Chapters here</TabPanel>
</Tabs>
```

[Full Documentation](../../src/renderer/src/components/Tabs/README.md)

---

### Layout & Display

#### List / ListItem

**Purpose**: Generic row-list primitive for settings lists (restore points, storage entries, presets, etc.)
**Composition**: `List` (bordered container, auto-dividers) + `ListItem` (row: leading/title/subtitle/trailing slots)
**Features**: Optional per-row interactivity, disabled state, trailing-slot click isolation

```tsx
<List>
  <ListItem
    leading={<Badge variant="info">Auto</Badge>}
    title="6 September 2026, 14:32"
    subtitle="128 MB"
    trailing={
      <Button variant="danger" size="small">
        Delete
      </Button>
    }
  />
</List>
```

[Full Documentation](../../src/renderer/src/components/ListItem/README.md)

---

#### NumberSpinner

**Purpose**: Numeric stepper input for small bounded ranges (Fluent NumberBox pattern)
**Features**: Clamps to `[min, max]` before calling onChange, stacked chevron steppers, unit suffix
**Keyboard**: Arrow Up/Down to step, Enter to commit typed value

```tsx
<NumberSpinner
  label="Snapshot interval"
  value={intervalInHours}
  onChange={setIntervalInHours}
  min={1}
  max={6}
  suffix="hours"
/>
```

[Full Documentation](../../src/renderer/src/components/NumberSpinner/README.md)

---

#### LanguageBadge

**Purpose**: Show a language as a flag plus its code or full name
**Components**: `LanguageBadge` (flag + label) and `LanguageFlag` (flag only, for use inside other controls, decorative and `aria-hidden`)
**Features**: Bundled SVG flags (not emoji, which Windows does not draw) mapped per MangaDex language code in `utils/languageFlags.ts`; the flag is never shown without text, because variants share a flag (`ja` / `ja-ro`, `ko` / `ko-ro`, `zh` / `zh-ro`); languages with no sensible flag get a neutral globe icon

```tsx
<LanguageBadge code="es-la" />              {/* flag + ES-LA */}
<LanguageBadge code="pt-br" label="name" /> {/* flag + Portuguese (Brazil) */}
```

---

#### MangaCard

**Purpose**: Display manga with cover, title, and metadata
**Sizes**: 2 (compact, standard)
**Features**: Hover effects, status badges, loading state
**Aspect Ratio**: 2:3 (standard manga cover)

```tsx
<MangaCard
  title="One Piece"
  cover="/covers/one-piece.jpg"
  author="Eiichiro Oda"
  status="ongoing"
  size="standard"
/>
```

[Full Documentation](../../src/renderer/src/components/MangaCard/README.md)

---

### Overlays & Dialogs

#### Modal

**Built on**: Fluent `Dialog` (actions in the `footer` prop render in a pinned `DialogActions`)
**Purpose**: Full-screen overlay dialogs
**Sizes**: 3 (small 400px, medium 600px, large 800px)
**Features**: Focus trap, body scroll lock, Escape to close
**Backdrop**: Acrylic blur effect

```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action" size="medium">
  <p>Are you sure you want to continue?</p>
</Modal>
```

[Full Documentation](../../src/renderer/src/components/Modal/README.md)

---

#### Tooltip

**Purpose**: Hover-based contextual information
**Positions**: 4 (top, right, bottom, left)
**Features**: Auto-flip near edges, arrow pointer, portal rendering
**Delay**: Configurable (default 500ms)

```tsx
<Tooltip content="Click to save" position="top">
  <Button>Save</Button>
</Tooltip>
```

[Full Documentation](../../src/renderer/src/components/Tooltip/README.md)

---

#### Popover

**Purpose**: Contextual menus and content overlays
**Triggers**: 2 (click, hover)
**Positions**: 4 (top, right, bottom, left)
**Features**: Click-outside-to-close, Escape support, portal rendering

```tsx
<Popover
  trigger="click"
  position="bottom"
  content={
    <div>
      <button>Option 1</button>
      <button>Option 2</button>
    </div>
  }
>
  <Button>Open Menu</Button>
</Popover>
```

[Full Documentation](../../src/renderer/src/components/Popover/README.md)

---

### Utilities

#### ViewTransition

**Purpose**: Smooth route transition animations
**Animation**: Fade + 8px slide (300ms)
**Pattern**: Key-based React remounting
**Usage**: Single wrapper around Routes

```tsx
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()

  return (
    <ViewTransition key={location.pathname}>
      <Routes location={location}>{/* routes */}</Routes>
    </ViewTransition>
  )
}
```

**Why Key-Based?**
Using `key={location.pathname}` triggers React's unmount/remount cycle, allowing CSS animations to play naturally without double-rendering flash.

[Full Documentation](../../src/renderer/src/components/ViewTransition/README.md)

---

## Design Patterns

> **Note**: The portal, click-outside, focus-management and keyboard-navigation patterns below describe how overlays used to be hand-rolled. Fluent 2 now provides all of them for `Modal`, `Tooltip`, `Popover`, `Select` and the menus, so only reach for these when building a genuinely custom overlay.

### Portal Rendering

Components that need to escape their parent's stacking context use portal rendering:

```tsx
import { createPortal } from 'react-dom'

function Tooltip() {
  return createPortal(<div className="tooltip">{content}</div>, document.body)
}
```

**Components using portals**: Tooltip, Popover, Modal

---

### Spring Animations

For satisfying, natural animations, we use spring easing with overshoot:

```css
transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

The value `1.56 > 1.0` creates overshoot, then settles back.

**Components using spring easing**: Sidebar indicator, Tabs indicator

---

### Focus Management

All interactive components follow Windows 11 focus patterns:

1. **No outer glow**: Remove browser default with `box-shadow: none !important`
2. **Bottom border emphasis**: 2px accent color on focus
3. **Smooth transition**: 200ms cubic-bezier easing

```css
.input:focus {
  outline: none;
  box-shadow: none !important;
  border-bottom-color: var(--win-accent);
  transition: border-bottom-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Components with focus states**: Input, SearchBar, Button, Checkbox, Switch, Dropdown

---

### Icon Variant Pattern

Following Windows 11 conventions, navigation icons show different weights for active/inactive states:

```tsx
{
  isActive ? item.iconFilled : item.icon
}
```

**Regular icons**: Inactive/default state (outlined)
**Filled icons**: Active/selected state (solid fill)

**Example**:

- Inactive: `<Search24Regular />`
- Active: `<Search24Filled />`

---

### Controlled vs Uncontrolled

Many components support both patterns:

**Controlled** (parent manages state):

```tsx
<Switch checked={isDark} onChange={setIsDark} />
```

**Uncontrolled** (component manages state):

```tsx
<Switch defaultChecked={false} />
```

**Components supporting both**: Switch, Checkbox, Tabs, Dropdown, Modal, Popover

---

### Click-Outside Detection

For dropdowns, modals, and popovers:

```tsx
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      onClose()
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [onClose])
```

---

### Keyboard Navigation

All interactive components support keyboard:

- **Tab**: Focus navigation
- **Enter/Space**: Activation
- **Escape**: Close/cancel
- **Arrow keys**: List navigation (Dropdown, Tabs)
- **Home/End**: Jump to first/last (Dropdown, Tabs)

---

## Animation Guidelines

### Performance

All animations are GPU-accelerated using `transform` and `opacity`:

```css
/* Good - GPU accelerated */
transform: translateY(8px);
opacity: 0;

/* Avoid - triggers layout */
top: 8px;
height: auto;
```

### Easing Functions

| Use Case      | Easing                              | Duration   |
| ------------- | ----------------------------------- | ---------- |
| Fade in/out   | `ease`                              | 150-200ms  |
| Slide/scale   | `cubic-bezier(0.4, 0, 0.2, 1)`      | 200-300ms  |
| Spring/bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400ms      |
| Indeterminate | `linear`                            | 800-1500ms |

### Motion Preferences

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .component {
    animation: none;
    transition: none;
  }
}
```

---

## Accessibility

### ARIA Attributes

All components include proper ARIA attributes:

```tsx
<button role="button" aria-label="Close dialog" aria-pressed={isPressed} aria-disabled={isDisabled}>
  Close
</button>
```

### Screen Reader Support

- **Announcements**: Use `role="status"` or `role="alert"` for notifications
- **Labels**: All form controls have associated labels
- **Descriptions**: Helper text linked via `aria-describedby`

### Keyboard Support

- **Focus indicators**: Always visible (2px accent border or outline)
- **Skip links**: For main content navigation
- **Tab order**: Logical and predictable

### WCAG AA Compliance

- **Color contrast**: Minimum 4.5:1 for text
- **Touch targets**: Minimum 44×44px for interactive elements
- **Text size**: Minimum 14px body text

---

## TypeScript Types

### Base Types

```typescript
// Common base props for all components
export interface BaseComponentProps {
  className?: string
  style?: React.CSSProperties
  'data-testid'?: string
}

// Size variants used across components
export type Size = 'small' | 'medium' | 'large'

// Common variant types
export type Variant = 'default' | 'success' | 'warning' | 'error' | 'info'

// Position types for tooltips/popovers
export type Position = 'top' | 'right' | 'bottom' | 'left'
```

### Component-Specific Types

Each component exports its own prop interface:

```typescript
// Button
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
  size?: Size
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
}

// Input
export interface InputProps extends BaseComponentProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}
```

---

## Component Checklist

When creating new components, ensure:

- [ ] TypeScript interface with JSDoc comments
- [ ] BEM CSS naming convention
- [ ] Design tokens (no hardcoded colors/spacing)
- [ ] Keyboard navigation support
- [ ] ARIA attributes
- [ ] Focus indicator (visible, accessible)
- [ ] Disabled state styling
- [ ] Loading/error states (if applicable)
- [ ] Responsive behavior
- [ ] `prefers-reduced-motion` support
- [ ] README with usage examples
- [ ] Barrel export in `index.ts`
- [ ] Type exports for consumers

---

## Package Dependencies

### Core Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.18.3",
  "@fluentui/react-components": "^9.74.9",
  "@fluentui/react-icons": "^2.0.0",
  "country-flag-icons": "^1.6.20"
}
```

### Icon Library

**@fluentui/react-icons** (Official Microsoft Fluent UI Icons)

- **Size**: ~1-2 KB per icon (tree-shakeable)
- **Total bundle impact**: ~5-6 KB for 8 icons used
- **Import style**: Named imports
- **Pattern**: Regular/Filled variants

```tsx
import { Search24Regular, Search24Filled } from '@fluentui/react-icons'
```

**Icons in use**:

- Search (Browse tab)
- Library (Library tab)
- ArrowDownload (Downloads tab)
- Settings (Settings tab)

---

## Browser Support

| Browser | Version | Notes                         |
| ------- | ------- | ----------------------------- |
| Chrome  | 100+    | Full support                  |
| Edge    | 100+    | Full support (primary target) |
| Firefox | 100+    | Full support                  |
| Safari  | 15+     | Full support                  |

**Note**: As an Electron app, we bundle Chromium, ensuring consistent behavior across all platforms.

---

## Performance Considerations

### Bundle Size

- **Total component library**: ~15-20 KB (gzipped)
- **Individual components**: 1-3 KB each
- **Icons**: ~1-2 KB per icon
- **CSS**: ~10 KB total (all components)

### Optimization Tips

1. **Tree-shaking**: Import only components you need
2. **Code splitting**: Lazy load routes and heavy components
3. **CSS bundling**: Use CSS modules or extract to single file
4. **Icon optimization**: Only import icons you use

```tsx
// Good - tree-shakeable
import { Button, Input } from '@/components'

// Avoid - imports everything
import * as Components from '@/components'
```

---

## Migration Guide

### From v0.x to v1.0

**Breaking Changes**:

1. **Select renamed to Dropdown**: Import path changed

   ```tsx
   // Old
   import { Select } from '@/components'

   // New
   import { Dropdown } from '@/components'
   ```

2. **Badge variant renamed**: `default` → `neutral`

   ```tsx
   // Old
   <Badge variant="default" />

   // New (optional, default is implied)
   <Badge variant="default" />
   ```

3. **ProgressBar variant props**: Separated into `variant` prop

   ```tsx
   // Old
   <ProgressBar value={75} success />

   // New
   <ProgressBar value={75} variant="success" />
   ```

---

## Contributing

### Adding New Components

1. **Create component folder** in `src/renderer/src/components/`
2. **Follow naming conventions**: PascalCase for component, kebab-case for CSS
3. **Include all files**: Component, CSS, README, index.ts
4. **Add to this document** in appropriate category
5. **Update barrel export** in `components/index.ts`
6. **Add demo** to SettingsView for testing

### Code Review Checklist

- [ ] TypeScript strict mode passing
- [ ] No console errors or warnings
- [ ] Accessible (keyboard + screen reader tested)
- [ ] Responsive on all screen sizes
- [ ] Design tokens used (no magic values)
- [ ] BEM CSS naming followed
- [ ] README complete with examples
- [ ] JSDoc comments on all props

---

## Support

**Issues**: [GitHub Issues](https://github.com/remichan97/DexReader/issues)
**Discussions**: [GitHub Discussions](https://github.com/remichan97/DexReader/discussions)
**Documentation**: `/docs/components/`

---

**Built with ❤️ for DexReader**
_Windows 11 Fluent Design • TypeScript • React 19_

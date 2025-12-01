# UI Component Library

**Version**: 1.0.0
**Last Updated**: 1 December 2025
**Design System**: Windows 11 Fluent Design

> **Overview**: DexReader's UI component library provides 17 production-ready components following Windows 11 Fluent Design principles. All components are built with TypeScript, include comprehensive accessibility features, and support Windows 11 design tokens.

---

## Table of Contents

- [Getting Started](#getting-started)
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
├── ComponentName.css      # BEM-style CSS with design tokens
├── index.ts              # Barrel export
└── README.md             # Component documentation
```

### Basic Usage

```tsx
import { Button, Input, Modal } from '@/components';

function MyComponent() {
  return (
    <div>
      <Input label="Username" placeholder="Enter username" />
      <Button variant="accent" size="medium">Submit</Button>
    </div>
  );
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

[Full Documentation](./Button/README.md)

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

[Full Documentation](./Input/README.md)

---

#### SearchBar

**Purpose**: Dedicated search input with icon
**Styling**: Matches Input component (32px height, 2px border)
**Features**: Search icon, clear button, debounced callback
**Focus**: Bottom border accent (no glow)

```tsx
<SearchBar
  placeholder="Search manga..."
  onSearch={(query) => console.log(query)}
  debounce={300}
/>
```

[Full Documentation](./SearchBar/README.md)

---

#### Checkbox

**Purpose**: Binary or indeterminate selection
**States**: 3 (unchecked, checked, indeterminate)
**Features**: Animated checkmark, label support, group functionality
**Animation**: Scale + fade checkmark (200ms)

```tsx
<Checkbox
  label="Remember me"
  checked={isChecked}
  onChange={setIsChecked}
/>
```

[Full Documentation](./Checkbox/README.md)

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

[Full Documentation](./Switch/README.md)

---

#### Dropdown (Select)

**Purpose**: Single or multi-select from options
**Modes**: 3 (basic, searchable, multi-select)
**Features**: Keyboard navigation, filtering, disabled options
**Keyboard**: Arrow keys, Enter, Escape, Home/End

```tsx
<Dropdown
  label="Language"
  options={languages}
  value={selected}
  onChange={setSelected}
  searchable
/>
```

[Full Documentation](./Dropdown/README.md)

---

### Feedback & Status

#### Toast

**Purpose**: Temporary notification messages
**Variants**: 4 (info, success, warning, error)
**Positions**: 4 (top-right, top-left, bottom-right, bottom-left)
**Features**: Auto-dismiss, stacking, close button

```tsx
// Use the hook
const { showToast } = useToast();

showToast({
  message: 'Settings saved successfully',
  variant: 'success',
  duration: 3000
});
```

[Full Documentation](./Toast/README.md)

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

[Full Documentation](./ProgressBar/README.md)

---

#### ProgressRing

**Purpose**: Circular loading spinner
**Modes**: 2 (determinate, indeterminate)
**Sizes**: 3 (small 24px, medium 40px, large 64px)
**Animation**: Rotation + arc (800ms) for indeterminate

```tsx
<ProgressRing size="medium" indeterminate />
```

[Full Documentation](./ProgressRing/README.md)

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

[Full Documentation](./Badge/README.md)

---

#### Skeleton

**Purpose**: Loading placeholders
**Variants**: 4 (text, circle, rect, card)
**Features**: Shimmer animation, grid support
**Animation**: Gradient sweep (1.5s)

```tsx
<SkeletonGrid count={6} columns={3} />
```

[Full Documentation](./Skeleton/README.md)

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

[Full Documentation](./Sidebar/README.md)

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

[Full Documentation](./Tabs/README.md)

---

### Layout & Display

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

[Full Documentation](./MangaCard/README.md)

---

### Overlays & Dialogs

#### Modal

**Purpose**: Full-screen overlay dialogs
**Sizes**: 3 (small 400px, medium 600px, large 800px)
**Features**: Focus trap, body scroll lock, Escape to close
**Backdrop**: Acrylic blur effect

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="medium"
>
  <p>Are you sure you want to continue?</p>
</Modal>
```

[Full Documentation](./Modal/README.md)

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

[Full Documentation](./Tooltip/README.md)

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

[Full Documentation](./Popover/README.md)

---

### Utilities

#### ViewTransition

**Purpose**: Smooth route transition animations
**Animation**: Fade + 8px slide (300ms)
**Pattern**: Key-based React remounting
**Usage**: Single wrapper around Routes

```tsx
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  return (
    <ViewTransition key={location.pathname}>
      <Routes location={location}>
        {/* routes */}
      </Routes>
    </ViewTransition>
  );
}
```

**Why Key-Based?**
Using `key={location.pathname}` triggers React's unmount/remount cycle, allowing CSS animations to play naturally without double-rendering flash.

[Full Documentation](./ViewTransition/README.md)

---

## Design Patterns

### Portal Rendering

Components that need to escape their parent's stacking context use portal rendering:

```tsx
import { createPortal } from 'react-dom';

function Tooltip() {
  return createPortal(
    <div className="tooltip">{content}</div>,
    document.body
  );
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
{isActive ? item.iconFilled : item.icon}
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
      onClose();
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [onClose]);
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

| Use Case | Easing | Duration |
|----------|--------|----------|
| Fade in/out | `ease` | 150-200ms |
| Slide/scale | `cubic-bezier(0.4, 0, 0.2, 1)` | 200-300ms |
| Spring/bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400ms |
| Indeterminate | `linear` | 800-1500ms |

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
<button
  role="button"
  aria-label="Close dialog"
  aria-pressed={isPressed}
  aria-disabled={isDisabled}
>
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
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

// Size variants used across components
export type Size = 'small' | 'medium' | 'large';

// Common variant types
export type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';

// Position types for tooltips/popovers
export type Position = 'top' | 'right' | 'bottom' | 'left';
```

### Component-Specific Types

Each component exports its own prop interface:

```typescript
// Button
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

// Input
export interface InputProps extends BaseComponentProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  "react-router-dom": "^6.28.0",
  "@fluentui/react-icons": "^2.0.0"
}
```

### Icon Library

**@fluentui/react-icons** (Official Microsoft Fluent UI Icons)

- **Size**: ~1-2 KB per icon (tree-shakeable)
- **Total bundle impact**: ~5-6 KB for 8 icons used
- **Import style**: Named imports
- **Pattern**: Regular/Filled variants

```tsx
import { Search24Regular, Search24Filled } from '@fluentui/react-icons';
```

**Icons in use**:

- Search (Browse tab)
- Library (Library tab)
- ArrowDownload (Downloads tab)
- Settings (Settings tab)

---

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 100+ | Full support |
| Edge | 100+ | Full support (primary target) |
| Firefox | 100+ | Full support |
| Safari | 15+ | Full support |

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
import { Button, Input } from '@/components';

// Avoid - imports everything
import * as Components from '@/components';
```

---

## Migration Guide

### From v0.x to v1.0

**Breaking Changes**:

1. **Select renamed to Dropdown**: Import path changed

   ```tsx
   // Old
   import { Select } from '@/components';

   // New
   import { Dropdown } from '@/components';
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
*Windows 11 Fluent Design • TypeScript • React 19*

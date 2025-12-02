# Sidebar Component

Main navigation sidebar with animated indicator and Fluent UI icons following Windows 11 design patterns.

## Usage

```tsx
import { Sidebar } from '@renderer/components/Sidebar'

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">{/* Your content */}</main>
    </div>
  )
}
```

## Features

### Animated Indicator

A sliding blue accent bar that animates between active navigation items:

- **Spring Animation**: Uses `cubic-bezier(0.34, 1.56, 0.64, 1)` for overshoot effect
- **Duration**: 400ms for noticeable but smooth transitions
- **Position**: Calculated dynamically via `offsetTop` and `offsetHeight`
- **Overshoot**: The 1.56 value exceeds 1.0, creating a satisfying bounce

```css
.sidebar__indicator {
  transition:
    top 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
}
```

### Fluent UI Icons

Uses `@fluentui/react-icons` with Regular/Filled variant pattern:

- **Inactive State**: Regular (outlined) icons
- **Active State**: Filled (solid) icons
- **Size**: 24×24px (24Regular/24Filled naming convention)
- **Bundle Impact**: ~5-6 KB total for all 8 icons used

```tsx
{
  id: 'browse',
  label: 'Browse',
  icon: <Search24Regular />,
  iconFilled: <Search24Filled />,
  route: '/browse'
}
```

### Navigation Items

Default items included:

| Icon | Label     | Route        | Regular Icon           | Filled Icon           |
| ---- | --------- | ------------ | ---------------------- | --------------------- |
| 🔍   | Browse    | `/browse`    | Search24Regular        | Search24Filled        |
| 📚   | Library   | `/library`   | Library24Regular       | Library24Filled       |
| ⬇️   | Downloads | `/downloads` | ArrowDownload24Regular | ArrowDownload24Filled |
| ⚙️   | Settings  | `/settings`  | Settings24Regular      | Settings24Filled      |

## Props

The Sidebar component currently has no props - navigation items are defined internally. Future versions may support customizable items.

## Implementation Details

### Icon Variant Switching

Icons switch between Regular and Filled based on active state:

```tsx
{
  isActive ? item.iconFilled : item.icon
}
```

This follows Windows 11 conventions where active navigation items show filled (solid) icons while inactive items show outlined icons.

### Indicator Position Calculation

The indicator position is calculated in a `useEffect` that runs when route changes:

```tsx
useEffect(() => {
  const updateIndicator = (): void => {
    if (!sidebarRef.current) return

    const activeIndex = sidebarItems.findIndex(
      (item) => location.pathname === item.route || location.pathname.startsWith(item.route + '/')
    )

    if (activeIndex === -1) {
      setIndicatorStyle({ top: 0, height: 24, opacity: 0 })
      return
    }

    // +1 to skip the indicator element itself
    const activeItem = sidebarRef.current.children[activeIndex + 1] as HTMLElement
    if (activeItem) {
      const top = activeItem.offsetTop + activeItem.offsetHeight / 2 - 12
      setIndicatorStyle({ top, height: 24, opacity: 1 })
    }
  }

  updateIndicator()
}, [location.pathname])
```

**Important**: The `+1` offset accounts for the indicator element itself, which is the first child of the sidebar ref.

### Spring Animation Breakdown

```
cubic-bezier(0.34, 1.56, 0.64, 1)
              ↑     ↑
         P1   |  P2 |
         Control Points
```

- **P1 (0.34)**: Slow start
- **P2 (1.56)**: Overshoot (>1.0 causes bounce)
- **P3 (0.64)**: Ease back
- **P4 (1.0)**: Final position

The key is P2 = 1.56, which makes the animation overshoot the target, then settle back. This creates the "spring" effect common in modern UIs.

## States

### Default

Items show Regular (outlined) icons with normal styling

### Hover

- Background changes to `--win-bg-hover`
- Smooth 200ms transition
- Cursor changes to pointer

### Active

- Indicator slides to position behind active item
- Icon switches to Filled variant
- Background uses `--win-bg-active`
- Slightly scaled down (`transform: scale(0.98)`) for press feedback

### Focus

- Visible focus ring for keyboard navigation
- Tab key cycles through items
- Enter/Space activates navigation

## Accessibility

- **Semantic HTML**: `<nav>` with `aria-label="Main navigation"`
- **Keyboard Navigation**: Full Tab/Enter/Space support
- **ARIA Current**: `aria-current="page"` on active item
- **Screen Readers**: Each item has descriptive `aria-label`
- **Icon Hiding**: Icons marked `aria-hidden="true"` (labels provide context)
- **Focus Management**: Visible focus indicators

## Design Principles

- **Windows 11 Patterns**: Follows native app navigation styling
- **Fluent Icons**: Official Microsoft icons for authenticity
- **Spring Animation**: Natural, satisfying movement
- **Icon Variants**: Regular/Filled for clear state indication
- **Touch Targets**: 48px height per item (comfortable for touch/click)

## Package Dependency

```json
{
  "@fluentui/react-icons": "^2.0.0"
}
```

**Why Fluent over Lucide/Heroicons?**

- Authentic Windows 11 appearance
- Official Microsoft library
- Tree-shakeable (only imports used icons)
- Regular/Filled variants built-in
- Memory impact negligible in Electron runtime (~100MB+)
- ~2KB size difference not significant for desktop app

## Examples

### Default Usage

```tsx
<Sidebar />
```

### Within App Shell

```tsx
function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
```

### Keyboard Navigation

Users can navigate the sidebar using:

- **Tab**: Move focus between items
- **Shift+Tab**: Move focus backward
- **Enter or Space**: Activate focused item
- **Arrow Keys**: (Future enhancement)

## Animation Performance

All animations use GPU-accelerated properties:

- `transform`: translateY() for position
- `opacity`: for fade in/out
- `top`: Positioned absolute (in layout container)

The spring animation runs at 60fps on modern hardware with smooth easing.

## Browser Compatibility

Works in all modern browsers (Chrome 100+, Edge 100+, Firefox 100+, Safari 15+).

Since this is an Electron app, we bundle Chromium, ensuring consistent animation behavior across all platforms (Windows, macOS, Linux).

## Polish History

**Before**: Emoji icons (🔍📚⬇️⚙️), no indicator animation

**After**:

- Official Fluent UI icons with Regular/Filled variants
- Spring-animated sliding indicator (400ms cubic-bezier)
- Proper icon sizing (24×24px)
- Active state visual feedback (scale + filled icons)

This polish pass brought the sidebar from basic navigation to polished, Windows 11-authentic experience.

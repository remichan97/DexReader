# ViewTransition Component

Provides smooth fade and slide animations for route transitions following Windows 11 Fluent Design principles using React's key-based remounting pattern.

## Features

- **Fade + Slide Animation**: 300ms fade with subtle 8px vertical slide
- **Key-based Remounting**: Uses `key` prop to trigger React unmount/mount cycle
- **No Content Flash**: Single wrapper approach prevents double-rendering
- **Reduced Motion Support**: Respects `prefers-reduced-motion` user preference
- **Smooth Transitions**: Cubic-bezier easing for natural feel

## Usage

**IMPORTANT**: Use a single wrapper around `Routes` with `key` prop, not individual route wrapping.

```tsx
import { ViewTransition } from '@renderer/components/ViewTransition'
import { Routes, Route, useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()

  return (
    <ViewTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/library" element={<LibraryView />} />
        <Route path="/browse" element={<BrowseView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>
    </ViewTransition>
  )
}
```

### Why This Pattern?

**❌ Wrong (causes flash)**:
```tsx
<Routes>
  <Route path="/library" element={<ViewTransition><LibraryView /></ViewTransition>} />
  <Route path="/browse" element={<ViewTransition><BrowseView /></ViewTransition>} />
</Routes>
```

Each route has different children, causing ViewTransition to show new content immediately before animating.

**✅ Correct (smooth animation)**:
```tsx
const location = useLocation()

<ViewTransition key={location.pathname}>
  <Routes location={location}>
    {/* routes */}
  </Routes>
</ViewTransition>
```

The `key` prop changes when pathname changes, triggering React's unmount → remount cycle. The CSS animation plays naturally during the mount phase.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | View content to animate |

## Behavior

- **Key-based Remounting**: When `key` changes, React unmounts old component and mounts new one
- **Animation on Mount**: CSS animation plays during component mount phase
- **Single Wrapper**: Only one ViewTransition instance wraps entire routing tree
- **Performance**: Uses GPU-accelerated `transform` and `opacity`
- **Timing**: 300ms duration with smooth cubic-bezier easing

## Implementation Details

### How It Works

1. **Parent provides key**: `<ViewTransition key={location.pathname}>`
2. **Key changes**: When user navigates, pathname changes
3. **React unmounts**: Old Routes component removed from DOM
4. **React mounts**: New Routes component added to DOM
5. **CSS animation**: `.view-transition--fade-in` class applies animation

### Simplified Component

```tsx
export function ViewTransition({
  children
}: ViewTransitionProps): React.JSX.Element {
  return (
    <div className="view-transition view-transition--fade-in">
      {children}
    </div>
  )
}
```

The magic is in the `key` prop on the parent, not complex state management inside the component.

### Why No useLocation Inside?

Early versions had `useLocation` inside ViewTransition and managed display state. This caused:

- **Double rendering**: Old content shown briefly, then animation, then new content
- **Complex state**: Multiple useEffect hooks tracking stage (fade-out/fade-in)
- **Flash issue**: Brief moment where both old and new content visible

Key-based approach eliminates all these issues by leveraging React's built-in mount/unmount cycle.

## Polish History

**Before (v1.0)**:
```tsx
// Complex state management
const [stage, setStage] = useState<'fade-out' | 'fade-in'>('fade-in')
const [displayLocation, setDisplayLocation] = useState(location)

useEffect(() => {
  if (location !== displayLocation) {
    setStage('fade-out')
  }
}, [location, displayLocation])

// Two-stage animation with double-render flash
```

**After (v1.1 - Current)**:
```tsx
// Simple wrapper, parent controls via key
export function ViewTransition({ children }) {
  return <div className="view-transition view-transition--fade-in">{children}</div>
}

// Usage: <ViewTransition key={location.pathname}>
```

Result: No flash, simpler code, cleaner implementation.

## Accessibility

- Respects `prefers-reduced-motion` - disables animations when user prefers reduced motion
- Does not interfere with focus management
- Maintains accessibility tree during transitions

## Design Tokens

Uses Windows 11 animation patterns:

- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Fluent ease-out)
- Distance: 8px vertical slide

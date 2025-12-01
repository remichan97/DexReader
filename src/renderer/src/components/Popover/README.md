# Popover Component

Provides contextual menus and content overlays following Windows 11 Fluent Design principles.

## Features

- **4 Position Variants**: Top, Right, Bottom, Left
- **Auto-flip**: Automatically repositions if near viewport edges
- **Dual Triggers**: Click or hover activation
- **Click Outside to Close**: Automatically closes when clicking outside
- **Escape Key Support**: Press Escape to close and return focus
- **Portal Rendering**: Renders outside parent DOM hierarchy
- **Controlled/Uncontrolled**: Supports both modes
- **Smooth Animations**: Direction-aware slide entrance with reduced-motion support
- **Accessibility**: Proper `role="dialog"` and focus management

## Usage

```tsx
import { Popover } from '@renderer/components/Popover'

// Click trigger (default)
<Popover
  content={
    <div>
      <h4>Settings</h4>
      <p>Configure your preferences here.</p>
    </div>
  }
>
  <Button>Open Settings</Button>
</Popover>

// Hover trigger
<Popover
  content="This is hover-activated content"
  trigger="hover"
  position="right"
>
  <Button>Hover Me</Button>
</Popover>

// Controlled mode
function ControlledExample() {
  const [open, setOpen] = useState(false)

  return (
    <Popover
      content={<div>Controlled content</div>}
      open={open}
      onOpenChange={setOpen}
    >
      <Button>Toggle</Button>
    </Popover>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `React.ReactNode` | Required | Popover content to display |
| `position` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` | Preferred position (auto-flips if near edge) |
| `trigger` | `'click' \| 'hover'` | `'click'` | Activation trigger type |
| `open` | `boolean` | `undefined` | Controlled open state |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Called when open state changes |
| `children` | `React.ReactElement` | Required | Trigger element |
| `className` | `string` | `''` | Additional CSS classes |

## Behavior

- **Click Trigger**: Toggle popover on click, closes on outside click or Escape
- **Hover Trigger**: Opens on hover, stays open when hovering popover content, closes after brief delay when leaving
- **Auto-positioning**: If popover would overflow viewport, automatically flips to opposite side
- **Portal Rendering**: Uses React Portal to render at document.body for proper z-index
- **Focus Management**: Returns focus to trigger when closed via Escape key

## Accessibility

- Uses proper `role="dialog"` attribute
- Escape key support for keyboard users
- Focus returns to trigger after closing
- Respects `prefers-reduced-motion` for users who prefer reduced animations
- High contrast mode support with increased border widths

## Design Tokens

Uses Windows 11 design system:

- Background: `--win-bg-card`
- Border: `--win-border-default`
- Text: `--win-text-primary`
- Shadow: `--win-shadow-lg`
- Spacing: `--space-2`
- Border radius: `--radius-md`

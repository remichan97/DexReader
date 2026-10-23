# Popover Component

Provides contextual content overlays anchored to a trigger. A thin wrapper over the Fluent 2 `Popover` with a position / trigger API.

## Features

- **4 Position Variants**: Top, Right, Bottom, Left (mapped to Fluent's `above` / `after` / `below` / `before`)
- **Auto-flip**: Fluent repositions the popover if it would overflow the viewport
- **Dual Triggers**: Click or hover activation
- **Click Outside to Close**: Closes when clicking outside
- **Escape Key Support**: Press Escape to close and return focus to the trigger
- **Portal Rendering**: Renders outside the parent DOM hierarchy
- **Controlled/Uncontrolled**: Supports both modes
- **Arrow Pointer**: Visual indicator pointing to the trigger
- **Accessibility**: Fluent's `PopoverSurface` renders `role="dialog"` and manages focus

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

| Prop           | Type                                     | Default     | Description                                  |
| -------------- | ---------------------------------------- | ----------- | -------------------------------------------- |
| `content`      | `React.ReactNode`                        | Required    | Popover content to display                   |
| `position`     | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'`  | Preferred position (auto-flips if near edge) |
| `trigger`      | `'click' \| 'hover'`                     | `'click'`   | Activation trigger type                      |
| `open`         | `boolean`                                | `undefined` | Controlled open state                        |
| `onOpenChange` | `(open: boolean) => void`                | `undefined` | Called when open state changes               |
| `children`     | `React.ReactElement`                     | Required    | Trigger element                              |
| `className`    | `string`                                 | `''`        | Additional CSS classes                       |

## Behavior

- **Click Trigger**: Toggle popover on click, closes on outside click or Escape
- **Hover Trigger**: Opens on hover, stays open while the pointer is over the popover content, closes 100ms after the pointer leaves
- **Auto-positioning**: If the popover would overflow the viewport, Fluent flips it to the opposite side
- **Portal Rendering**: Rendered into a portal at the end of `document.body`
- **Focus Management**: Returns focus to the trigger when closed via Escape
- **Size Caps**: Fluent's popover surface has its own default width and padding; override them with `className` where a layout needs something different

## Accessibility

- The surface has `role="dialog"`
- Escape closes the popover and returns focus to the trigger
- The trigger is wired to the surface with the appropriate ARIA attributes by Fluent

## Styling

Styling comes from Fluent 2 and the app's Fluent theme (surface, border and shadow follow light/dark mode). There is no stylesheet; pass `className` to adjust the popover surface.

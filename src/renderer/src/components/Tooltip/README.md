# Tooltip Component

Provides contextual information on hover or keyboard focus. A thin wrapper over the Fluent 2 `Tooltip` that keeps a simple position / delay API.

## Features

- **4 Position Variants**: Top, Right, Bottom, Left (mapped to Fluent's `above` / `after` / `below` / `before`)
- **Auto-flip**: Fluent repositions the tooltip if it would overflow the viewport
- **Hover Delay**: Configurable delay before showing (default 500ms); hides immediately
- **Portal Rendering**: Renders outside the parent DOM hierarchy to avoid z-index and clipping issues
- **Arrow Pointer**: Visual indicator pointing to the trigger element
- **Accessibility**: Fluent adds `role="tooltip"` and wires the trigger to it with `aria-describedby` or `aria-labelledby`

## Usage

```tsx
import { Tooltip } from '@renderer/components/Tooltip'

// Basic usage
<Tooltip content="Click to save your changes">
  <Button>Save</Button>
</Tooltip>

// Custom position and delay
<Tooltip content="Delete this item permanently" position="right" delay={300}>
  <Button variant="danger">Delete</Button>
</Tooltip>

// Complex content
<Tooltip
  content={
    <div>
      <strong>Keyboard Shortcut:</strong>
      <br />
      Ctrl+S
    </div>
  }
>
  <Button>Save</Button>
</Tooltip>
```

## Props

| Prop           | Type                                     | Default         | Description                                                                  |
| -------------- | ---------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `content`      | `React.ReactNode`                        | Required        | Tooltip content to display                                                   |
| `position`     | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`         | Preferred position (auto-flips if near edge)                                 |
| `delay`        | `number`                                 | `500`           | Delay before showing tooltip (ms)                                            |
| `relationship` | `'label' \| 'description'`               | `'description'` | `'label'` when the tooltip is the trigger's only accessible name (icon-only) |
| `children`     | `React.ReactElement`                     | Required        | Trigger element                                                              |
| `className`    | `string`                                 | -               | Class applied to the tooltip content, not the trigger                        |

## Behavior

- **Hover and Focus Trigger**: Tooltip appears after the delay when hovering or focusing the trigger
- **Auto-positioning**: If the tooltip would overflow the viewport, Fluent flips it to the opposite side
- **Portal Rendering**: Rendered into a portal at the end of `document.body`
- **Immediate Exit**: The hide delay is 0, so the tooltip disappears as soon as the pointer or focus leaves

## Accessibility

- Fluent renders the tooltip with `role="tooltip"`
- With `relationship="description"` (default) the trigger gets `aria-describedby`; with `relationship="label"` it gets `aria-labelledby`, so use `label` for icon-only triggers that have no other name
- Shown on keyboard focus as well as hover; Escape dismisses it

## Styling

Styling comes from Fluent 2 and the app's Fluent theme (surface, border, shadow and text colours follow light/dark mode). There is no stylesheet; pass `className` to adjust the tooltip content.

# Tooltip Component

Provides contextual information on hover following Windows 11 Fluent Design principles.

## Features

- **4 Position Variants**: Top, Right, Bottom, Left
- **Auto-flip**: Automatically repositions if near viewport edges
- **Hover Delay**: Configurable delay before showing (default 500ms)
- **Portal Rendering**: Renders outside parent DOM hierarchy to avoid z-index issues
- **Arrow Pointer**: Visual indicator pointing to trigger element
- **Smooth Animations**: Fade and scale entrance with reduced-motion support
- **Accessibility**: Proper `role="tooltip"` attribute

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

| Prop        | Type                                     | Default  | Description                                  |
| ----------- | ---------------------------------------- | -------- | -------------------------------------------- |
| `content`   | `React.ReactNode`                        | Required | Tooltip content to display                   |
| `position`  | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`  | Preferred position (auto-flips if near edge) |
| `delay`     | `number`                                 | `500`    | Delay before showing tooltip (ms)            |
| `children`  | `React.ReactElement`                     | Required | Trigger element                              |
| `className` | `string`                                 | `''`     | Additional CSS classes                       |

## Behavior

- **Hover Trigger**: Tooltip appears after delay when hovering over trigger
- **Auto-positioning**: If tooltip would overflow viewport, automatically flips to opposite side
- **Portal Rendering**: Uses React Portal to render at document.body for proper z-index
- **Smooth Exit**: Fades out immediately when mouse leaves trigger

## Accessibility

- Uses proper `role="tooltip"` attribute
- Respects `prefers-reduced-motion` for users who prefer reduced animations
- High contrast mode support with increased border widths

## Design Tokens

Uses Windows 11 design system:

- Background: `--win-bg-card`
- Border: `--win-border-default`
- Text: `--win-text-primary`
- Shadow: `--win-shadow-md`
- Spacing: `--space-1-5`, `--space-2`
- Border radius: `--radius-sm`

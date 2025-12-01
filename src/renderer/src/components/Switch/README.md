# Switch Component

Toggle switch component for settings following Windows 11 Fluent Design principles.

## Usage

```tsx
import { Switch } from '@renderer/components/Switch'

function Settings() {
  const [notifications, setNotifications] = useState(false)

  return (
    <Switch
      checked={notifications}
      onChange={setNotifications}
      label="Enable notifications"
      description="Receive notifications when new chapters are available"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | Required | Whether the switch is checked |
| `onChange` | `(checked: boolean) => void` | Required | Change handler |
| `label` | `string` | `undefined` | Label text |
| `description` | `string` | `undefined` | Description text below the label |
| `disabled` | `boolean` | `false` | Whether the switch is disabled |
| `className` | `string` | `''` | Additional CSS class |
| `aria-label` | `string` | `undefined` | ARIA label (defaults to label) |

## Examples

### Basic Switch

```tsx
<Switch checked={enabled} onChange={setEnabled} />
```

### With Label

```tsx
<Switch
  checked={enabled}
  onChange={setEnabled}
  label="Dark Mode"
/>
```

### With Label and Description

```tsx
<Switch
  checked={autoUpdate}
  onChange={setAutoUpdate}
  label="Auto-update library"
  description="Automatically check for new chapters every hour"
/>
```

### Disabled

```tsx
<Switch
  checked={true}
  onChange={() => {}}
  label="Premium Feature"
  description="Available in Pro version"
  disabled
/>
```

## Keyboard Navigation

- **Space/Enter**: Toggle switch state
- **Tab**: Focus next/previous element

## Accessibility

- Uses `role="switch"` and `aria-checked`
- Keyboard accessible (Space/Enter to toggle)
- Focus visible indicator
- Disabled state prevents interaction
- Label click toggles switch

## Styling

Follows Windows 11 Fluent Design:
- 40×20px track size
- 12px knob that slides 20px when checked
- Accent color when checked
- Smooth animation (150ms cubic-bezier)
- Respects `prefers-reduced-motion`

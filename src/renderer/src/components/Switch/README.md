# Switch Component

Toggle switch for settings. A thin wrapper over the Fluent 2 `Switch` with a label and optional description.

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

| Prop          | Type                         | Default     | Description                      |
| ------------- | ---------------------------- | ----------- | -------------------------------- |
| `checked`     | `boolean`                    | Required    | Whether the switch is checked    |
| `onChange`    | `(checked: boolean) => void` | Required    | Change handler                   |
| `label`       | `string`                     | `undefined` | Label text                       |
| `description` | `string`                     | `undefined` | Description text below the label |
| `disabled`    | `boolean`                    | `false`     | Whether the switch is disabled   |
| `className`   | `string`                     | `''`        | Additional CSS class             |
| `aria-label`  | `string`                     | `undefined` | ARIA label (defaults to label)   |

## Examples

### Basic Switch

```tsx
<Switch checked={enabled} onChange={setEnabled} />
```

### With Label

```tsx
<Switch checked={enabled} onChange={setEnabled} label="Dark Mode" />
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

- **Space**: Toggle switch state (native checkbox behaviour; Enter does not toggle)
- **Tab**: Focus next/previous element

## Accessibility

- Fluent 2's `Switch` renders a native `<input type="checkbox" role="switch">`
- `aria-label` falls back to `label` when not provided
- Fluent provides the focus indicator; disabled state prevents interaction
- Clicking the label toggles the switch

## Styling

Styling comes from Fluent 2 and the app's Fluent theme. The wrapper makes the control fill its row (`width: 100%`) with the label on the left and the indicator on the right (`labelPosition="before"`), and renders `label` in semibold with `description` beneath it in the smaller, secondary text style. There is no stylesheet; use `className` for layout tweaks.

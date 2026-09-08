# NumberSpinner Component

Numeric stepper input following Windows 11 Fluent Design's NumberBox pattern. Clamps to
`[min, max]` internally before ever calling `onChange`, so the value a consumer receives
is always valid - no separate range check needed before sending it to the main process.

## Usage

```tsx
import { NumberSpinner } from '@renderer/components/NumberSpinner'

function SnapshotSettings() {
  const [intervalInHours, setIntervalInHours] = useState(6)

  return (
    <NumberSpinner
      label="Snapshot interval"
      description="How often an automatic restore point is created"
      value={intervalInHours}
      onChange={setIntervalInHours}
      min={1}
      max={6}
      suffix="hours"
    />
  )
}
```

## Props

| Prop          | Type                      | Default     | Description                                         |
| ------------- | ------------------------- | ----------- | --------------------------------------------------- |
| `value`       | `number`                  | Required    | Current value                                       |
| `onChange`    | `(value: number) => void` | Required    | Called with a clamped, valid value                  |
| `min`         | `number`                  | `undefined` | Minimum allowed value (inclusive)                   |
| `max`         | `number`                  | `undefined` | Maximum allowed value (inclusive)                   |
| `step`        | `number`                  | `1`         | Amount changed per stepper click or arrow key       |
| `label`       | `string`                  | `undefined` | Label text                                          |
| `description` | `string`                  | `undefined` | Description text below the label                    |
| `suffix`      | `string`                  | `undefined` | Unit suffix shown inside the field (e.g. `"hours"`) |
| `helperText`  | `string`                  | `undefined` | Helper text below the field                         |
| `error`       | `string`                  | `undefined` | Error message (shows error state)                   |
| `disabled`    | `boolean`                 | `false`     | Whether the field is disabled                       |
| `className`   | `string`                  | `''`        | Additional CSS class                                |
| `aria-label`  | `string`                  | `undefined` | ARIA label (defaults to label)                      |

## Behaviour Notes

- Typing is only clamped and committed on blur or `Enter` - not on every keystroke - so
  you can freely type a multi-digit value without it fighting you mid-edit.
- The stepper buttons and arrow keys always produce an in-range value immediately.
- An invalid or empty typed value reverts to the last committed value on blur, rather
  than calling `onChange` with `NaN`.
- `onChange` is only ever called with a value already clamped to `[min, max]` - callers
  don't need to re-validate the range themselves.

## Keyboard Navigation

- **Arrow Up/Down**: Increment/decrement by `step` (clamped)
- **Enter**: Commit the typed value
- **Tab**: Focus next/previous element (stepper buttons are not tab-stops - they're a
  pointer-only shortcut for the same action as the arrow keys)

## Accessibility

- Input uses `role="spinbutton"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- `aria-invalid` and `role="alert"` on the error message when `error` is set
- Stepper buttons are disabled (and visually dimmed) at `min`/`max`

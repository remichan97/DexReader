# Radio Component

Radio buttons for choosing one option from a set. Thin wrappers over the Fluent 2 `Radio` and `RadioGroup`.

## Overview

`Radio` adds a label and an optional description to Fluent 2's radio. `RadioGroup` owns the selected value and the shared `name`, and shares them with its child `Radio`s through Fluent's context, so a `Radio` must be rendered inside a `RadioGroup`.

## Usage

### Basic RadioGroup

```tsx
import { Radio, RadioGroup } from '@renderer/components/Radio'

function CacheSettings() {
  const [tier, setTier] = useState('normal')

  return (
    <RadioGroup value={tier} onChange={setTier} name="cache-tier" label="Cache Size">
      <Radio value="low" label="Low (75 MB)" description="1-2 chapters" />
      <Radio value="normal" label="Normal (200 MB)" description="3-4 chapters, recommended" />
      <Radio value="high" label="High (350 MB)" description="5-7 chapters" />
    </RadioGroup>
  )
}
```

### Horizontal Layout

```tsx
<RadioGroup value={mode} onChange={setMode} name="view-mode" orientation="horizontal">
  <Radio value="grid" label="Grid View" />
  <Radio value="list" label="List View" />
</RadioGroup>
```

### With Disabled State

```tsx
<RadioGroup value={tier} onChange={setTier} name="tier">
  <Radio value="free" label="Free" description="Basic features" />
  <Radio value="pro" label="Pro" description="All features" disabled />
</RadioGroup>
```

## Features

- ✅ **Fluent 2 Radio**: Native radio inputs with the app theme applied
- ✅ **Label + Description**: Optional label and helper text below
- ✅ **Keyboard Navigation**: Arrow keys move and select within the group, Tab enters and leaves it
- ✅ **Accessibility**: `role="radiogroup"` on the group with native radio inputs
- ✅ **Automatic State Management**: RadioGroup handles value and name through context
- ✅ **Horizontal/Vertical Layouts**: Flexible orientation
- ✅ **Disabled State**: Handled by Fluent

## Component API

### Radio Props

| Prop          | Type      | Default  | Description                               |
| ------------- | --------- | -------- | ----------------------------------------- |
| `value`       | `string`  | Required | The value of this radio option            |
| `label`       | `string`  | -        | Label text                                |
| `description` | `string`  | -        | Description text below label              |
| `disabled`    | `boolean` | `false`  | Whether the radio is disabled             |
| `className`   | `string`  | `''`     | Additional CSS classes                    |
| `aria-label`  | `string`  | -        | Accessibility label (defaults to `label`) |

The selected state, `onChange` and `name` come from the enclosing `RadioGroup`, not from the individual `Radio`.

### RadioGroup Props

| Prop          | Type                         | Default      | Description                      |
| ------------- | ---------------------------- | ------------ | -------------------------------- |
| `value`       | `string`                     | Required     | Currently selected value         |
| `onChange`    | `(value: string) => void`    | Required     | Handler for value changes        |
| `name`        | `string`                     | Required     | Name passed to all radio buttons |
| `children`    | `React.ReactNode`            | Required     | Radio button children            |
| `label`       | `string`                     | -            | Group label for accessibility    |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction                 |
| `className`   | `string`                     | `''`         | Additional CSS classes           |

## Styling

Styling comes from Fluent 2 and the app's Fluent theme, so the radio picks up the accent colour and light/dark mode automatically. The description is rendered below the label in the smaller, secondary text style. The wrapper has no stylesheet; use `className` for layout tweaks.

## Accessibility

- `RadioGroup` renders Fluent's `role="radiogroup"` container, labelled by the group's `label`
- Each option is a native radio input, so the browser provides arrow-key navigation and selection (Space also selects)
- Fluent provides the focus indicator

## Examples

### Settings Page Section

```tsx
function PerformanceSettings() {
  const [cacheTier, setCacheTier] = useState<ChapterCacheTier>('normal')

  return (
    <div className="settings-section">
      <h3>Chapter Cache Strategy</h3>
      <p>Control how many chapters are kept in memory.</p>

      <RadioGroup
        value={cacheTier}
        onChange={(value) => setCacheTier(value as ChapterCacheTier)}
        name="chapter-cache-tier"
        label="Cache Size"
      >
        <Radio value="low" label="Low (75 MB)" description="1-2 chapters, lowest memory usage" />
        <Radio
          value="normal"
          label="Normal (200 MB)"
          description="3-4 chapters, balanced performance"
        />
        <Radio value="high" label="High (350 MB)" description="5-7 chapters, higher memory usage" />
        <Radio value="custom" label="Custom" description="Advanced users only" />
      </RadioGroup>
    </div>
  )
}
```

## Related Components

- [Checkbox](../Checkbox/README.md) - For multiple selections
- [Switch](../Switch/README.md) - For on/off toggles
- [Select](../Select/README.md) - For larger option sets

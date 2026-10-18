# Checkbox Component

A checkbox with checked, unchecked and indeterminate states. A thin wrapper over the Fluent 2 `Checkbox` that keeps a simple `checked` / `onChange(checked)` API.

## Features

- **Three States**: Checked, unchecked, and indeterminate
- **Keyboard Support**: Space toggles, via the native checkbox
- **Disabled State**: Handled by Fluent
- **Accessibility**: Native input semantics with a label-based `aria-label` fallback
- **Fluent 2 Theming**: Follows the app theme (accent colour, light and dark)

## Usage

```tsx
import { Checkbox } from '@renderer/components/Checkbox'

function MyComponent() {
  const [agreed, setAgreed] = useState(false)

  return (
    <Checkbox checked={agreed} onChange={setAgreed} label="I agree to the terms and conditions" />
  )
}
```

## Props

| Prop            | Type                | Default | Description                         |
| --------------- | ------------------- | ------- | ----------------------------------- |
| `checked`       | `boolean`           | -       | Whether the checkbox is checked     |
| `onChange`      | `(checked) => void` | -       | Change handler                      |
| `label`         | `string`            | -       | Label text                          |
| `indeterminate` | `boolean`           | `false` | Indeterminate/partially checked     |
| `disabled`      | `boolean`           | `false` | Disabled state                      |
| `name`          | `string`            | -       | Name attribute for form submission  |
| `value`         | `string`            | -       | Value attribute for form submission |
| `className`     | `string`            | `''`    | Additional CSS class                |
| `aria-label`    | `string`            | -       | Accessibility label                 |

## Examples

### Basic Checkbox

```tsx
<Checkbox checked={isEnabled} onChange={setIsEnabled} label="Enable notifications" />
```

### Without Label

```tsx
<Checkbox checked={isSelected} onChange={setIsSelected} aria-label="Select item" />
```

### Indeterminate State

```tsx
<Checkbox
  checked={false}
  indeterminate={someChildrenSelected}
  onChange={handleSelectAll}
  label="Select all items"
/>
```

### Disabled Checkbox

```tsx
<Checkbox checked={true} onChange={() => {}} label="This option is locked" disabled />
```

### Form Integration

```tsx
<form onSubmit={handleSubmit}>
  <Checkbox
    checked={acceptTerms}
    onChange={setAcceptTerms}
    label="I accept the terms"
    name="acceptTerms"
    value="true"
  />
  <button type="submit" disabled={!acceptTerms}>
    Submit
  </button>
</form>
```

### Checkbox Group

```tsx
function CheckboxGroup() {
  const [options, setOptions] = useState({
    option1: false,
    option2: true,
    option3: false
  })

  const allChecked = Object.values(options).every(Boolean)
  const someChecked = Object.values(options).some(Boolean) && !allChecked

  const handleSelectAll = (checked: boolean): void => {
    setOptions({
      option1: checked,
      option2: checked,
      option3: checked
    })
  }

  return (
    <div>
      <Checkbox
        checked={allChecked}
        indeterminate={someChecked}
        onChange={handleSelectAll}
        label="Select all"
      />
      <div style={{ marginLeft: '24px', marginTop: '8px' }}>
        <Checkbox
          checked={options.option1}
          onChange={(checked) => setOptions({ ...options, option1: checked })}
          label="Option 1"
        />
        <Checkbox
          checked={options.option2}
          onChange={(checked) => setOptions({ ...options, option2: checked })}
          label="Option 2"
        />
        <Checkbox
          checked={options.option3}
          onChange={(checked) => setOptions({ ...options, option3: checked })}
          label="Option 3"
        />
      </div>
    </div>
  )
}
```

## Accessibility

- Wraps Fluent 2's `Checkbox`, which renders a native `<input type="checkbox">`, so form submission and label association work natively
- The indeterminate state is set through the input's `indeterminate` property, which assistive technology reports as "mixed"
- `aria-label` falls back to `label` when not provided
- Fluent provides the focus indicator and disabled handling

## Keyboard Shortcuts

- **Space**: Toggle checkbox (native checkbox behaviour; Enter does not toggle)
- **Tab**: Navigate to next focusable element

## Styling

Styling comes from Fluent 2 and the app's Fluent theme, so the checkbox picks up the accent colour and light/dark mode automatically. Use `className` for layout tweaks. The wrapper has no stylesheet of its own.

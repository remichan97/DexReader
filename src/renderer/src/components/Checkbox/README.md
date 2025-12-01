# Checkbox Component

A customizable checkbox component with support for checked, unchecked, and indeterminate states, following Windows 11 Fluent Design principles.

## Features

- **Three States**: Checked, unchecked, and indeterminate
- **Keyboard Support**: Space and Enter keys for toggling
- **Smooth Animations**: Scale and fade animations for state changes
- **Disabled State**: Visual feedback for disabled checkboxes
- **Accessibility**: Full ARIA support and keyboard navigation
- **Windows 11 Design**: Rounded style with accent color

## Usage

```tsx
import { Checkbox } from '@renderer/components/Checkbox'

function MyComponent() {
  const [agreed, setAgreed] = useState(false)

  return (
    <Checkbox
      checked={agreed}
      onChange={setAgreed}
      label="I agree to the terms and conditions"
    />
  )
}
```

## Props

| Prop            | Type               | Default | Description                         |
| --------------- | ------------------ | ------- | ----------------------------------- |
| `checked`       | `boolean`          | -       | Whether the checkbox is checked     |
| `onChange`      | `(checked) => void`| -       | Change handler                      |
| `label`         | `string`           | -       | Label text                          |
| `indeterminate` | `boolean`          | `false` | Indeterminate/partially checked     |
| `disabled`      | `boolean`          | `false` | Disabled state                      |
| `name`          | `string`           | -       | Name attribute for form submission  |
| `value`         | `string`           | -       | Value attribute for form submission |
| `className`     | `string`           | `''`    | Additional CSS class                |
| `aria-label`    | `string`           | -       | Accessibility label                 |

## Examples

### Basic Checkbox

```tsx
<Checkbox
  checked={isEnabled}
  onChange={setIsEnabled}
  label="Enable notifications"
/>
```

### Without Label

```tsx
<Checkbox
  checked={isSelected}
  onChange={setIsSelected}
  aria-label="Select item"
/>
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
<Checkbox
  checked={true}
  onChange={() => {}}
  label="This option is locked"
  disabled
/>
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

- Uses native `<input type="checkbox">` for form compatibility
- ARIA attributes for screen readers
- `aria-checked="mixed"` for indeterminate state
- Keyboard navigation with Space and Enter
- Proper focus indicators
- Label association for click targets

## Keyboard Shortcuts

- **Space**: Toggle checkbox
- **Enter**: Toggle checkbox
- **Tab**: Navigate to next focusable element

## Styling

The component uses CSS custom properties from the design tokens:

- `--win-bg-input`: Checkbox background
- `--win-border-default`: Border color
- `--win-accent`: Accent color for checked state
- `--radius-xs`: Border radius

## Performance Notes

- Smooth animations with CSS transforms
- GPU-accelerated animations
- Respects `prefers-reduced-motion` for accessibility
- Minimal re-renders with React.memo compatibility

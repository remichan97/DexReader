# Select Component

A customizable dropdown select component with keyboard navigation and optional search, following Windows 11 Fluent Design principles.

## Features

- **Keyboard Navigation**: Arrow keys, Enter, Escape, Home, End
- **Search/Filter**: Optional search functionality
- **Multi-Select**: Support for selecting multiple options
- **Click Outside**: Auto-close when clicking outside
- **Disabled Options**: Individual option disabling
- **Accessibility**: Full ARIA support and keyboard navigation
- **Windows 11 Design**: Native styling with smooth animations

## Usage

```tsx
import { Select } from '@renderer/components/Select'
import type { SelectOption } from '@renderer/components/Select'

function MyComponent() {
  const [country, setCountry] = useState('')

  const options: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' }
  ]

  return (
    <Select
      label="Country"
      value={country}
      onChange={setCountry}
      options={options}
      placeholder="Select a country"
    />
  )
}
```

## Props

| Prop           | Type                              | Default               | Description                     |
| -------------- | --------------------------------- | --------------------- | ------------------------------- |
| `value`        | `string \| string[]`              | -                     | Current selected value(s)       |
| `onChange`     | `(value) => void`                 | -                     | Change handler                  |
| `options`      | `SelectOption[]`                  | -                     | Available options               |
| `label`        | `string`                          | -                     | Label text                      |
| `placeholder`  | `string`                          | `'Select an option'`  | Placeholder when no selection   |
| `helperText`   | `string`                          | -                     | Helper text below the select    |
| `error`        | `string`                          | -                     | Error message                   |
| `multiple`     | `boolean`                         | `false`               | Enable multi-select mode        |
| `searchable`   | `boolean`                         | `false`               | Enable search/filter            |
| `emptyMessage` | `string`                          | `'No options found'`  | Empty state message             |
| `disabled`     | `boolean`                         | `false`               | Disabled state                  |
| `className`    | `string`                          | `''`                  | Additional CSS class            |
| `aria-label`   | `string`                          | -                     | Accessibility label             |

### SelectOption Interface

```typescript
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}
```

## Examples

### Basic Select

```tsx
<Select
  label="Fruit"
  value={fruit}
  onChange={setFruit}
  options={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' }
  ]}
/>
```

### Searchable Select

```tsx
<Select
  label="Country"
  value={country}
  onChange={setCountry}
  options={countries}
  searchable
  placeholder="Search countries..."
/>
```

### Multi-Select

```tsx
<Select
  label="Languages"
  value={languages}
  onChange={setLanguages}
  options={[
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'go', label: 'Go' }
  ]}
  multiple
  placeholder="Select languages"
/>
```

### With Disabled Options

```tsx
<Select
  label="Status"
  value={status}
  onChange={setStatus}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived', disabled: true }
  ]}
/>
```

### With Helper Text and Error

```tsx
<Select
  label="Priority"
  value={priority}
  onChange={setPriority}
  options={priorities}
  helperText="Select the task priority level"
  error={!priority ? 'Priority is required' : undefined}
/>
```

## Accessibility

- Uses `role="listbox"` and `role="option"`
- Keyboard navigation with Arrow keys
- Enter/Space to select
- Escape to close
- Home/End to jump to first/last option
- Proper ARIA labels and states
- Focus management
- Screen reader announcements

## Keyboard Shortcuts

- **Enter / Space**: Open dropdown or select focused option
- **Escape**: Close dropdown
- **Arrow Down**: Open dropdown or move focus down
- **Arrow Up**: Move focus up
- **Home**: Jump to first option
- **End**: Jump to last option
- **Type to Search**: When searchable is enabled

## Styling

The component uses CSS custom properties from the design tokens:

- `--win-bg-input`: Input background
- `--win-border-default`: Border color
- `--win-accent`: Accent color for focus and selection
- `--radius-sm`: Border radius

## Performance Notes

- Click outside detection with cleanup
- Smooth animations with CSS transforms
- Virtual scrolling not needed for typical lists
- Respects `prefers-reduced-motion` for accessibility

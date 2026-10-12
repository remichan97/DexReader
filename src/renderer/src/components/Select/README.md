# Select Component

A single-value select built on Fluent 2's `Field` + `Dropdown` (`@fluentui/react-components`).

## Features

- **Keyboard Navigation**: Arrow keys, Home/End, type-to-find, Enter, Escape — all from Fluent
- **Positioning**: Opens below, flips above near the bottom edge; dismisses on outside click or Escape
- **Disabled Options**: Individual option disabling
- **Option icons**: Optional decorative `icon` per option (shown in the list, e.g. a flag)
- **Sizing**: Shrinks to its content inside toolbars and headers, fills its container elsewhere. The popup is as wide as its longest option, never narrower than the trigger
- **Accessibility**: Full ARIA support from Fluent

Fluent's `Dropdown` has a built-in `min-width` of 250px; `Select` removes it so it can sit in a flex row without squeezing its neighbours.

## Usage

```tsx
import { Select } from '@renderer/components/Select'
import type { SelectOption } from '@renderer/components/Select'

function MyComponent() {
  const [country, setCountry] = useState('')

  const options: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
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

| Prop          | Type                      | Default | Description                   |
| ------------- | ------------------------- | ------- | ----------------------------- |
| `value`       | `string`                  | -       | Current selected value        |
| `onChange`    | `(value: string) => void` | -       | Change handler                |
| `options`     | `SelectOption[]`          | -       | Available options             |
| `label`       | `string`                  | -       | Label text                    |
| `placeholder` | `string`                  | -       | Placeholder when no selection |
| `helperText`  | `string`                  | -       | Helper text below the select  |
| `disabled`    | `boolean`                 | `false` | Disabled state                |
| `className`   | `string`                  | -       | Class applied to the `Field`  |
| `aria-label`  | `string`                  | -       | Accessibility label           |

### SelectOption Interface

```typescript
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  icon?: ReactNode // decorative, shown before the label in the option list
}
```

## Not supported

`multiple`, `searchable`, `error` and `emptyMessage` existed on the hand-rolled version and were removed in v1.16.0 because nothing used them. If a real need appears:

- **Several values**: Fluent's `Dropdown` has a `multiselect` prop (the list stays open while you tick items)
- **Searching**: use Fluent's `Combobox`, or `TagPicker` (see `components/TagPicker`) when picks should show as chips

## Examples

### With a flag per option

```tsx
<Select
  value={language}
  onChange={setLanguage}
  options={languages.map((code) => ({
    value: code,
    label: getLanguageName(code),
    icon: <LanguageFlag code={code} />
  }))}
/>
```

### Disabled option

```tsx
<Select
  value={plan}
  onChange={setPlan}
  options={[
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro (coming soon)', disabled: true }
  ]}
/>
```

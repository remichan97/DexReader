# Radio Component

Radio button component following Windows 11 Fluent Design principles.

## Overview

The Radio component provides standard radio button functionality with label and description support. RadioGroup automatically manages value state and passes props to child Radio components.

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

### Standalone Radio (without RadioGroup)

```tsx
<Radio
  value="enabled"
  checked={isEnabled}
  onChange={(value) => setIsEnabled(value === 'enabled')}
  label="Enable feature"
  description="Turn on advanced functionality"
  name="feature-toggle"
/>
```

### With Disabled State

```tsx
<RadioGroup value={tier} onChange={setTier} name="tier">
  <Radio value="free" label="Free" description="Basic features" />
  <Radio value="pro" label="Pro" description="All features" disabled />
</RadioGroup>
```

## Features

- ✅ **Windows 11 Fluent Design**: Circular border with animated dot indicator
- ✅ **Label + Description**: Optional label and helper text below
- ✅ **Keyboard Navigation**: Space/Enter to select, Tab to navigate
- ✅ **Accessibility**: Proper ARIA roles and labels
- ✅ **Automatic State Management**: RadioGroup handles value and name automatically
- ✅ **Horizontal/Vertical Layouts**: Flexible orientation
- ✅ **Disabled State**: Visual feedback with reduced opacity

## Component API

### Radio Props

| Prop          | Type                      | Default  | Description                        |
| ------------- | ------------------------- | -------- | ---------------------------------- |
| `value`       | `string`                  | Required | The value of this radio option     |
| `checked`     | `boolean`                 | Required | Whether this radio is selected     |
| `onChange`    | `(value: string) => void` | Required | Handler called when selected       |
| `label`       | `string`                  | -        | Label text                         |
| `description` | `string`                  | -        | Description text below label       |
| `name`        | `string`                  | -        | Form name (auto-set by RadioGroup) |
| `disabled`    | `boolean`                 | `false`  | Whether the radio is disabled      |
| `className`   | `string`                  | `''`     | Additional CSS classes             |
| `aria-label`  | `string`                  | -        | Accessibility label                |

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

## Design Tokens

The component uses standard Windows 11 design tokens:

- **Circle Size**: 20px × 20px
- **Dot Size**: 10px × 10px (when checked)
- **Border**: 1.5px solid `--win-border-default`
- **Checked Border**: `--win-accent`
- **Background**: `--win-bg-input`
- **Animation**: 200ms scale + fade (cubic-bezier)
- **Focus Indicator**: 2px outline with 2px offset

## Accessibility

- Proper `role="radiogroup"` on container
- Native radio input for screen readers
- Keyboard navigation (Space, Enter)
- Focus indicators (outline on focus-visible)
- ARIA labels support

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

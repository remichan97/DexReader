# Button Component

A button with several variants, sizes and a loading state. A thin wrapper over the Fluent 2 `Button` that keeps DexReader's `variant` API. Any other native button attributes (for example `title` or `data-*`) are passed through.

## Usage

```tsx
import { Button } from '@renderer/components/Button'

// Primary button (default)
<Button onClick={handleClick}>Save Changes</Button>

// Secondary button
<Button variant="secondary" onClick={handleClick}>
  Cancel
</Button>

// Ghost button (transparent)
<Button variant="ghost" onClick={handleClick}>
  Learn More
</Button>

// Destructive button
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// With icon
<Button icon={<SaveIcon />} onClick={handleSave}>
  Save
</Button>

// Loading state
<Button loading>Saving...</Button>

// Disabled state
<Button disabled>Cannot Click</Button>

// Different sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

## Props

| Prop         | Type                                                                       | Default     | Description                                    |
| ------------ | -------------------------------------------------------------------------- | ----------- | ---------------------------------------------- |
| `variant`    | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'warning' \| 'accent'` | `'primary'` | Visual style variant                           |
| `size`       | `'small' \| 'medium' \| 'large'`                                           | `'medium'`  | Button size                                    |
| `disabled`   | `boolean`                                                                  | `false`     | Disables button interaction                    |
| `loading`    | `boolean`                                                                  | `false`     | Shows loading spinner and disables interaction |
| `icon`       | `React.ReactElement`                                                       | `undefined` | Icon to display before text                    |
| `children`   | `React.ReactNode`                                                          | `undefined` | Button content/text (omit for icon-only)       |
| `type`       | `'button' \| 'submit' \| 'reset'`                                          | `'button'`  | HTML button type                               |
| `onClick`    | `(event: MouseEvent) => void`                                              | `undefined` | Click handler                                  |
| `className`  | `string`                                                                   | `''`        | Additional CSS class                           |
| `aria-label` | `string`                                                                   | `undefined` | Accessible label for screen readers            |

## Variants

Variants map onto Fluent 2 button appearances:

| Variant     | Fluent appearance | Notes                                                            |
| ----------- | ----------------- | ---------------------------------------------------------------- |
| `primary`   | `primary`         | Accent background; use for main actions                          |
| `accent`    | `primary`         | Currently renders identically to `primary`                       |
| `secondary` | `secondary`       | Outlined, neutral; use for secondary actions                     |
| `ghost`     | `subtle`          | Transparent until hovered; use for tertiary actions              |
| `danger`    | `primary`         | Overrides the background with `--win-error` (and hover/active)   |
| `warning`   | `primary`         | Overrides the background with `--win-warning` (and hover/active) |

Fluent has no danger or warning button appearance, so those two layer the app's `--win-error` and `--win-warning` tokens over the primary appearance.

## Sizes

Sizes map directly to Fluent's button sizes:

- **Small**: Use in compact spaces or secondary UI
- **Medium**: Default, use for most buttons
- **Large**: Use for prominent actions or hero sections

## States

Hover, pressed, focus and disabled styling all come from Fluent 2 and the app theme.

### Loading

- Replaces the icon with a small `ProgressRing` (labelled with the translated "loading" string)
- Sets `aria-busy` and disables the button
- Clicks are ignored while loading or disabled

## Accessibility

- Uses a semantic `<button>` element
- Supports keyboard activation (Enter/Space)
- Fluent provides the focus indicator
- `aria-busy` is set while loading
- `aria-label` support for icon-only buttons
- Disabled and loading states prevent interaction

## Styling

Styling comes from Fluent 2 and the app's Fluent theme, so colours follow light/dark mode. Only the `danger` and `warning` variants add their own styles, via `makeStyles` and the `--win-error` / `--win-warning` tokens from `tokens.css`. There is no stylesheet; use `className` for layout tweaks.

## Examples

### Form Submit Button

```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit" loading={isSubmitting}>
    {isSubmitting ? 'Saving...' : 'Save'}
  </Button>
</form>
```

### Action Buttons

```tsx
<div>
  <Button variant="primary" onClick={handleSave}>
    Save
  </Button>
  <Button variant="secondary" onClick={handleCancel}>
    Cancel
  </Button>
</div>
```

### Icon Button

```tsx
<Button
  variant="ghost"
  size="small"
  icon={<TrashIcon />}
  onClick={handleDelete}
  aria-label="Delete item"
>
  Delete
</Button>
```

### Loading Button

```tsx
<Button variant="primary" loading={isLoading} disabled={isLoading} onClick={handleDownload}>
  {isLoading ? 'Downloading...' : 'Download'}
</Button>
```

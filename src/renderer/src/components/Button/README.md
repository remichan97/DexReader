# Button Component

A versatile button component following Windows 11 Fluent Design principles with multiple variants, sizes, and states.

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
<Button variant="destructive" onClick={handleDelete}>
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

| Prop         | Type                                                   | Default      | Description                                    |
| ------------ | ------------------------------------------------------ | ------------ | ---------------------------------------------- |
| `variant`    | `'primary' \| 'secondary' \| 'ghost' \| 'destructive'` | `'primary'`  | Visual style variant                           |
| `size`       | `'small' \| 'medium' \| 'large'`                       | `'medium'`   | Button size                                    |
| `disabled`   | `boolean`                                              | `false`      | Disables button interaction                    |
| `loading`    | `boolean`                                              | `false`      | Shows loading spinner and disables interaction |
| `icon`       | `React.ReactNode`                                      | `undefined`  | Icon to display before text                    |
| `children`   | `React.ReactNode`                                      | **required** | Button content/text                            |
| `type`       | `'button' \| 'submit' \| 'reset'`                      | `'button'`   | HTML button type                               |
| `onClick`    | `(event: MouseEvent) => void`                          | `undefined`  | Click handler                                  |
| `className`  | `string`                                               | `''`         | Additional CSS class                           |
| `aria-label` | `string`                                               | `undefined`  | Accessible label for screen readers            |

## Variants

### Primary

- Accent color background (blue)
- White text
- Use for main/primary actions

### Secondary

- Subtle background
- Default text color
- Border outline
- Use for secondary actions

### Ghost

- Transparent background
- Default text color
- No border
- Use for tertiary actions or links

### Destructive

- Red background
- White text
- Use for delete/remove actions

## Sizes

- **Small**: 28px height - Use in compact spaces or secondary UI
- **Medium**: 32px height - Default, use for most buttons
- **Large**: 40px height - Use for prominent actions or hero sections

## States

### Hover

All variants have hover states with slightly darker backgrounds

### Active

Pressed state with scale animation (98% scale)

### Focus

Visible outline for keyboard navigation (2px accent color, 2px offset)

### Disabled

- 50% opacity
- Not clickable
- Cursor shows "not-allowed"

### Loading

- Shows rotating spinner
- Hides icon (if present)
- Not clickable
- Cursor shows "wait"

## Accessibility

- Uses semantic `<button>` element
- Supports keyboard navigation (Enter/Space)
- Focus-visible outline for keyboard users
- `aria-busy` attribute when loading
- `aria-label` support for icon-only buttons
- Disabled state prevents interaction

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- Smooth transitions (150ms)
- GPU-accelerated animations (transform, opacity)
- Accessible color contrast (WCAG AA compliant)

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

# Badge Component

Status indicator and label component following Windows 11 Fluent Design principles.

## Usage

```tsx
import { Badge } from '@renderer/components/Badge'

function MangaStatus() {
  return (
    <div>
      <Badge variant="success">Completed</Badge>
      <Badge variant="warning">Ongoing</Badge>
      <Badge variant="info" icon={<Icon />}>
        5 New
      </Badge>
    </div>
  )
}
```

## Props

| Prop         | Type                                                       | Default     | Description                       |
| ------------ | ---------------------------------------------------------- | ----------- | --------------------------------- |
| `variant`    | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Visual style variant              |
| `size`       | `'small' \| 'medium'`                                      | `'medium'`  | Badge size                        |
| `children`   | `React.ReactNode`                                          | Required    | Badge content                     |
| `icon`       | `React.ReactNode`                                          | `undefined` | Optional icon                     |
| `dot`        | `boolean`                                                  | `false`     | Show as dot instead of full badge |
| `className`  | `string`                                                   | `''`        | Additional CSS class              |
| `aria-label` | `string`                                                   | `undefined` | ARIA label                        |

## Variants

### Default (Neutral)

```tsx
<Badge>Draft</Badge>
```

### Success (Green)

```tsx
<Badge variant="success">Completed</Badge>
```

### Warning (Yellow)

```tsx
<Badge variant="warning">Ongoing</Badge>
```

### Error (Red)

```tsx
<Badge variant="error">Failed</Badge>
```

### Info (Blue)

```tsx
<Badge variant="info">New Chapters</Badge>
```

## Sizes

### Small

```tsx
<Badge size="small" variant="info">
  3
</Badge>
```

### Medium (Default)

```tsx
<Badge variant="success">Completed</Badge>
```

## Examples

### With Icon

```tsx
<Badge variant="info" icon={<BellIcon />}>
  5 New
</Badge>
```

### Dot Variant

```tsx
<Badge variant="error" dot />
<Badge variant="success" dot />
```

Useful for notification indicators or status dots.

### In UI Context

```tsx
<div className="manga-card">
  <img src={cover} alt={title} />
  <div className="manga-info">
    <h3>{title}</h3>
    <Badge variant="success" size="small">
      Completed
    </Badge>
  </div>
</div>
```

## Styling

Follows Windows 11 Fluent Design:

- Pill shape (rounded corners)
- Semantic colors with subtle backgrounds
- Small: 11px font, compact padding
- Medium: 12px font, comfortable padding
- Dot variant: 6px (small) or 8px (medium) circle
- High contrast support

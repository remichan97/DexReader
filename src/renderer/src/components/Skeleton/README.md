# Skeleton Component

Loading placeholder components with shimmer animation following Windows 11 Fluent Design principles.

## Components

### Skeleton

Base skeleton component with multiple variants

### SkeletonGrid

Pre-built grid layout for manga cards

## Usage

### Basic Skeleton

```tsx
import { Skeleton } from '@renderer/components/Skeleton'

// Single line text
<Skeleton variant="text" width="200px" />

// Multiple lines
<Skeleton variant="text" lines={3} />

// Card placeholder
<Skeleton variant="card" />

// Circle (avatar/icon)
<Skeleton variant="circle" width={48} height={48} />

// Custom rectangle
<Skeleton variant="rectangle" width="100%" height={200} />

// No animation
<Skeleton variant="text" noAnimation />
```

### Skeleton Grid

```tsx
import { SkeletonGrid } from '@renderer/components/Skeleton'

// Default (12 cards)
<SkeletonGrid />

// Custom count
<SkeletonGrid count={8} />

// Custom sizing
<SkeletonGrid
  count={16}
  minCardWidth="200px"
  gap="20px"
/>
```

## Skeleton Props

| Prop          | Type                                          | Default        | Description                         |
| ------------- | --------------------------------------------- | -------------- | ----------------------------------- |
| `variant`     | `'text' \| 'card' \| 'circle' \| 'rectangle'` | `'text'`       | Skeleton shape                      |
| `width`       | `string \| number`                            | varies         | Width (CSS value or pixels)         |
| `height`      | `string \| number`                            | varies         | Height (CSS value or pixels)        |
| `lines`       | `number`                                      | `1`            | Number of lines (text variant only) |
| `noAnimation` | `boolean`                                     | `false`        | Disable shimmer animation           |
| `className`   | `string`                                      | `''`           | Additional CSS class                |
| `aria-label`  | `string`                                      | `'Loading...'` | Accessible label                    |

## SkeletonGrid Props

| Prop           | Type     | Default   | Description              |
| -------------- | -------- | --------- | ------------------------ |
| `count`        | `number` | `12`      | Number of skeleton cards |
| `minCardWidth` | `string` | `'180px'` | Minimum card width       |
| `gap`          | `string` | `'16px'`  | Gap between cards        |
| `className`    | `string` | `''`      | Additional CSS class     |

## Variants

### Text

- Default: 16px height
- Width: 100% (or custom)
- Rounded corners
- For loading text content

### Card

- Aspect ratio: 2:3 (manga cover ratio)
- Width: 100% of container
- Rounded corners
- For loading manga cards

### Circle

- Custom width and height (equal for circle)
- Border radius: 50%
- For loading avatars or icons

### Rectangle

- Default: 200px height
- Width: 100% (or custom)
- Rounded corners
- For loading custom content areas

## Features

### Shimmer Animation

- Gradient moves left to right
- Duration: 1.5s
- Easing: ease-in-out
- Infinite loop
- GPU-accelerated (transform)
- Respects `prefers-reduced-motion`

### Multiple Lines (Text)

When `lines > 1`:

- Stacks vertically with gap
- Last line is 80% width (natural appearance)
- Can override with `width` prop

### Theming

- Adapts to light/dark theme
- Subtle background in light mode
- Darker background in dark mode
- Shimmer intensity adjusts

## Accessibility

- Uses `role="status"` for loading state
- `aria-busy="true"` indicates loading
- `aria-label` for screen readers
- Hidden decorative elements with `aria-hidden`
- Screen reader text for grid ("Loading manga...")
- Respects `prefers-reduced-motion`

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- Subtle shimmer (not distracting)
- Natural loading appearance
- Smooth 60fps animation
- Accessible contrast

## Examples

### Loading Text Content

```tsx
<div>
  <Skeleton variant="text" width="300px" />
  <Skeleton variant="text" width="250px" />
  <Skeleton variant="text" width="200px" />
</div>

// Or with lines prop
<Skeleton variant="text" lines={3} />
```

### Loading Manga Grid

```tsx
function BrowseView() {
  const [loading, setLoading] = useState(true)
  const [manga, setManga] = useState([])

  if (loading) {
    return <SkeletonGrid count={12} />
  }

  return (
    <div className="manga-grid">
      {manga.map((item) => (
        <MangaCard key={item.id} {...item} />
      ))}
    </div>
  )
}
```

### Loading Profile

```tsx
<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
  <Skeleton variant="circle" width={64} height={64} />
  <div style={{ flex: 1 }}>
    <Skeleton variant="text" width="200px" />
    <Skeleton variant="text" width="150px" />
  </div>
</div>
```

### Loading Card

```tsx
<div style={{ maxWidth: '300px' }}>
  <Skeleton variant="card" />
  <div style={{ padding: '12px' }}>
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="60%" />
  </div>
</div>
```

### Custom Rectangle

```tsx
<Skeleton variant="rectangle" width="100%" height={400} />
```

### No Animation (Performance)

```tsx
// When many skeletons on screen, can disable animation
{
  Array.from({ length: 50 }, (_, i) => <Skeleton key={i} variant="text" noAnimation />)
}
```

## Performance

- GPU-accelerated shimmer (transform)
- CSS-only animation (no JavaScript)
- Respects reduced motion preferences
- Can disable animation for many instances
- Minimal DOM nodes
- No layout shifts

## SkeletonGrid Usage

### Browse View

```tsx
function BrowseView() {
  const { data, isLoading } = useMangaQuery()

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      {isLoading ? <SkeletonGrid count={12} /> : <MangaGrid items={data} />}
    </div>
  )
}
```

### Library View

```tsx
function LibraryView() {
  const { library, loading } = useLibrary()

  if (loading) {
    return <SkeletonGrid count={20} />
  }

  if (library.length === 0) {
    return <EmptyState />
  }

  return <MangaGrid items={library} />
}
```

### Custom Grid

```tsx
<SkeletonGrid count={16} minCardWidth="200px" gap="20px" className="custom-grid" />
```

## Responsive Behavior

### Desktop

- Full size skeletons
- Standard spacing

### Mobile

- Smaller card padding
- Adapts to screen width
- Touch-friendly spacing

## Best Practices

1. **Match Content**: Use skeleton variant that matches final content shape
2. **Count**: Show similar number of skeletons as expected items
3. **Duration**: Keep loading screens brief, optimize data fetching
4. **Animation**: Disable for many instances (>50) for performance
5. **Accessibility**: Always include proper ARIA attributes
6. **Theme**: Skeleton automatically adapts to light/dark theme
7. **Reduced Motion**: Animation respects user preferences

## Integration with Data Fetching

```tsx
function MangaList() {
  const { data, isLoading, error } = useQuery(['manga'], fetchManga)

  if (error) return <ErrorState error={error} />
  if (isLoading) return <SkeletonGrid count={12} />
  if (!data || data.length === 0) return <EmptyState />

  return (
    <div className="manga-grid">
      {data.map((manga) => (
        <MangaCard key={manga.id} {...manga} />
      ))}
    </div>
  )
}
```

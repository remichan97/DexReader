# Skeleton Component

Loading placeholders. `Skeleton` wraps the Fluent 2 `Skeleton` / `SkeletonItem` (wave animation); `SkeletonGrid` is DexReader's own pre-built manga-card grid and is still styled by `Skeleton.css`.

## Components

### Skeleton

Base skeleton component with a few shape variants

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

// Card placeholder (set a size; there is no built-in aspect ratio)
<Skeleton variant="card" width="100%" height={260} />

// Circle (avatar/icon)
<Skeleton variant="circle" width={48} height={48} />

// Custom rectangle
<Skeleton variant="rectangle" width="100%" height={200} />
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

| Prop         | Type                                          | Default        | Description                                  |
| ------------ | --------------------------------------------- | -------------- | -------------------------------------------- |
| `variant`    | `'text' \| 'card' \| 'circle' \| 'rectangle'` | `'text'`       | Skeleton shape                               |
| `width`      | `string \| number`                            | varies         | Width (CSS value or pixels)                  |
| `height`     | `string \| number`                            | varies         | Height (CSS value or pixels)                 |
| `lines`      | `number`                                      | `1`            | Number of lines (text variant only)          |
| `className`  | `string`                                      | `''`           | Class applied to the Fluent skeleton wrapper |
| `aria-label` | `string`                                      | `'Loading...'` | Accessible label                             |

## SkeletonGrid Props

| Prop           | Type     | Default   | Description              |
| -------------- | -------- | --------- | ------------------------ |
| `count`        | `number` | `12`      | Number of skeleton cards |
| `minCardWidth` | `string` | `'180px'` | Minimum card width       |
| `gap`          | `string` | `'16px'`  | Gap between cards        |
| `className`    | `string` | `''`      | Additional CSS class     |

## Variants

Variants map onto Fluent's two skeleton shapes. Fluent's `SkeletonItem` is 16px tall and full width by default, so **pass `width` and `height` for anything other than a text line**.

### Text

- Rectangle shape, 16px tall by default
- Width: 100% (or custom)
- For loading text content

### Card

- Currently identical to `rectangle`; there is no built-in 2:3 aspect ratio, so set `width` / `height` explicitly

### Circle

- Circle shape; set equal `width` and `height`
- For loading avatars or icons

### Rectangle

- Rectangle shape; 16px tall unless `height` is set
- For loading custom content areas

## Features

### Wave Animation

- Fluent's default `wave` animation on an opaque background
- Fluent respects `prefers-reduced-motion`
- The animation cannot currently be turned off per instance

### Multiple Lines (Text)

When `lines > 1`:

- Stacks vertically with gap
- Last line is 80% width (natural appearance)
- Can override with `width` prop

### Theming

- Follows the Fluent theme, so light and dark mode adapt automatically

## Accessibility

- Fluent's `Skeleton` renders `role="progressbar"` with `aria-busy="true"`
- `aria-label` for screen readers (English `Loading...` fallback; pass a translated label)
- `SkeletonGrid` uses `role="status"` with `aria-busy`, hides the placeholder cards with `aria-hidden`, and includes screen-reader text ("Loading manga...")

## Styling

`Skeleton` has no stylesheet of its own; Fluent supplies the colours and wave animation from the app theme. `SkeletonGrid` is still styled by `Skeleton.css` (grid, card and cover placeholders).

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
  <Skeleton variant="card" width="100%" height={260} />
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

## Best Practices

1. **Match Content**: Use skeleton variant that matches final content shape
2. **Count**: Show similar number of skeletons as expected items
3. **Duration**: Keep loading screens brief, optimize data fetching
4. **Accessibility**: Always include proper ARIA attributes
5. **Theme**: Skeleton automatically adapts to light/dark theme
6. **Reduced Motion**: Animation respects user preferences

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

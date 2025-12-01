# MangaCard Component

A card component for displaying manga covers in grid or list layouts following Windows 11 Fluent Design principles.

## Usage

```tsx
import { MangaCard } from '@renderer/components/MangaCard'

// Grid view (default)
<MangaCard
  id="manga-123"
  coverUrl="/covers/one-piece.jpg"
  title="One Piece"
  author="Oda Eiichiro"
  status="ongoing"
  onClick={handleMangaClick}
/>

// With progress tracking
<MangaCard
  id="manga-456"
  coverUrl="/covers/naruto.jpg"
  title="Naruto"
  author="Kishimoto Masashi"
  status="completed"
  chaptersRead={700}
  totalChapters={700}
  isFavorite={true}
  onClick={handleMangaClick}
  onFavorite={handleFavoriteToggle}
/>

// List view
<MangaCard
  id="manga-789"
  coverUrl="/covers/bleach.jpg"
  title="Bleach"
  author="Kubo Tite"
  variant="list"
  onClick={handleMangaClick}
/>
```

## Props

| Prop            | Type                                   | Default      | Description              |
| --------------- | -------------------------------------- | ------------ | ------------------------ |
| `id`            | `string`                               | **required** | Unique manga identifier  |
| `coverUrl`      | `string`                               | **required** | Cover image URL          |
| `title`         | `string`                               | **required** | Manga title              |
| `author`        | `string`                               | `undefined`  | Manga author             |
| `status`        | `'ongoing' \| 'completed' \| 'hiatus'` | `undefined`  | Publication status       |
| `chaptersRead`  | `number`                               | `undefined`  | Number of chapters read  |
| `totalChapters` | `number`                               | `undefined`  | Total number of chapters |
| `variant`       | `'grid' \| 'list'`                     | `'grid'`     | Display layout variant   |
| `isFavorite`    | `boolean`                              | `false`      | Is manga favorited       |
| `onClick`       | `(id: string) => void`                 | `undefined`  | Card click handler       |
| `onFavorite`    | `(id: string) => void`                 | `undefined`  | Favorite button handler  |
| `className`     | `string`                               | `''`         | Additional CSS class     |
| `aria-label`    | `string`                               | `undefined`  | Accessible label         |

## Variants

### Grid View (Default)

- Vertical layout
- Cover image with 2:3 aspect ratio
- Title truncated to 2 lines
- Metadata below cover
- Ideal for Browse and Library views

### List View

- Horizontal layout
- 100px wide cover (80px on mobile)
- 140px total height (120px on mobile)
- Title truncated to 1 line
- Compact for list-style browsing

## Features

### Image Loading

- Lazy loading with `loading="lazy"` attribute
- Skeleton placeholder while loading
- Shimmer animation during load
- Fallback icon if image fails to load
- Smooth fade-in when loaded

### Hover Effects

- Card lifts 2px with shadow on hover
- Cover image scales to 105%
- Overlay appears with favorite button
- Smooth transitions (150ms)

### Progress Tracking

When `chaptersRead` and `totalChapters` are provided:

- **Grid view**: Horizontal bar at bottom of cover (4px height)
- **List view**: Vertical bar on right side of cover (4px width)
- Shows completion percentage
- Text below: "X / Y chapters"
- Accessible with `role="progressbar"`

### Favorite Button

When `onFavorite` is provided:

- Appears in center of hover overlay
- Heart icon (filled when favorited)
- White circular background
- Click stops propagation (doesn't trigger card click)
- Keyboard accessible

### Status Badge

When `status` is provided:

- Small pill badge with color coding:
  - **Ongoing**: Green
  - **Completed**: Blue
  - **Hiatus**: Yellow/Orange
- Adjusts for light/dark theme

### Metadata Display

- **Author**: Secondary text color, truncates with ellipsis
- **Status**: Colored badge
- Both shown in metadata row with gap

## States

### Default

Clean card with subtle border and background

### Hover

- Border color changes
- Box shadow appears
- Card lifts slightly
- Cover zooms in
- Overlay fades in

### Active/Pressed

Card returns to original position

### Focus

Accent color outline for keyboard navigation

### Loading

Skeleton animation while image loads

### Error

Fallback icon displayed if image fails

## Accessibility

- Uses semantic `<article>` element
- Role="button" for interactivity
- Keyboard navigation (Enter/Space to click)
- Focus-visible outline
- Alt text for cover images
- ARIA labels for buttons
- Progress bar with proper ARIA attributes
- Title tooltip on hover

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- 2:3 aspect ratio for manga covers (standard)
- Smooth animations (transform, opacity)
- Accessible color contrast (WCAG AA)
- Touch-friendly targets (48px favorite button)

## Examples

### Grid of Manga Cards

```tsx
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px'
  }}
>
  {mangaList.map((manga) => (
    <MangaCard
      key={manga.id}
      id={manga.id}
      coverUrl={manga.coverUrl}
      title={manga.title}
      author={manga.author}
      status={manga.status}
      onClick={handleMangaClick}
    />
  ))}
</div>
```

### List View

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
  {mangaList.map((manga) => (
    <MangaCard
      key={manga.id}
      variant="list"
      id={manga.id}
      coverUrl={manga.coverUrl}
      title={manga.title}
      author={manga.author}
      onClick={handleMangaClick}
    />
  ))}
</div>
```

### With Reading Progress

```tsx
<MangaCard
  id="manga-123"
  coverUrl="/covers/manga.jpg"
  title="Attack on Titan"
  author="Hajime Isayama"
  status="completed"
  chaptersRead={139}
  totalChapters={139}
  isFavorite={true}
  onClick={handleMangaClick}
  onFavorite={handleFavoriteToggle}
/>
```

### Favorite Management

```tsx
const [favorites, setFavorites] = useState<Set<string>>(new Set())

const handleFavoriteToggle = (id: string) => {
  setFavorites((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}

;<MangaCard
  id={manga.id}
  coverUrl={manga.coverUrl}
  title={manga.title}
  isFavorite={favorites.has(manga.id)}
  onFavorite={handleFavoriteToggle}
  onClick={handleMangaClick}
/>
```

## Responsive Behavior

### Desktop (>768px)

- Grid: 180-250px card width
- List: 100px cover width, 140px height
- 12px padding in content area

### Mobile (≤768px)

- Grid: Smaller card width (adapts to screen)
- List: 80px cover width, 120px height
- 8px padding in content area

## Performance

- Lazy loading images
- GPU-accelerated animations
- Efficient shimmer with CSS animation
- Minimal DOM updates
- Event handler optimization (stopPropagation)

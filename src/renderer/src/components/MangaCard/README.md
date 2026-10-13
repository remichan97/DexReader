# MangaCard Component

A card for displaying manga covers in grid or list layouts. This is one of DexReader's own components (not a Fluent wrapper); it is styled by `MangaCard.css` and uses `LanguageBadge` for language flags.

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
  isFavourite={true}
  onClick={handleMangaClick}
  onFavourite={handleFavouriteToggle}
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

| Prop                 | Type                                                  | Default      | Description                                                            |
| -------------------- | ----------------------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `id`                 | `string`                                              | **required** | Unique manga identifier                                                |
| `coverUrl`           | `string`                                              | **required** | Cover image URL (use the `mangadex://` or `local-manga://` protocols)  |
| `title`              | `string`                                              | **required** | Manga title                                                            |
| `author`             | `string`                                              | `undefined`  | Manga author                                                           |
| `status`             | `'ongoing' \| 'completed' \| 'hiatus' \| 'cancelled'` | `undefined`  | Publication status                                                     |
| `languages`          | `string[]`                                            | `undefined`  | Available languages; the first three show as flags, then `+N`          |
| `chaptersRead`       | `number`                                              | `undefined`  | Number of chapters read                                                |
| `totalChapters`      | `number`                                              | `undefined`  | Total number of chapters                                               |
| `variant`            | `'grid' \| 'list'`                                    | `'grid'`     | Display layout variant                                                 |
| `isFavourite`        | `boolean`                                             | `false`      | Is manga favourited                                                    |
| `showFavouriteBadge` | `boolean`                                             | `true`       | Show the heart badge on a favourited cover                             |
| `showDownloadBadge`  | `boolean`                                             | `false`      | Show a download badge on non-favourited downloaded titles (top right)  |
| `hasDownloads`       | `boolean`                                             | `false`      | Show the "available offline" indicator (bottom left)                   |
| `hasCollections`     | `boolean`                                             | `false`      | The user has at least one collection to add this manga to              |
| `onClick`            | `(id: string) => void`                                | `undefined`  | Card click handler                                                     |
| `onFavourite`        | `(id: string) => void`                                | `undefined`  | Favourite button handler; the hover overlay only appears when provided |
| `onAddToCollection`  | `(id: string) => void`                                | `undefined`  | Add-to-collection handler (needs `isFavourite` and `hasCollections`)   |
| `className`          | `string`                                              | `''`         | Additional CSS class                                                   |
| `aria-label`         | `string`                                              | `undefined`  | Accessible label (defaults to title, author, status and progress)      |

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

- Card lifts 2px with a shadow on hover
- Cover image scales to 105%
- The hover overlay fades in (see below)

### Progress Tracking

When `chaptersRead` and `totalChapters` are provided (and the total is above zero):

- A native `<progress>` bar is drawn along the bottom of the cover (4px high) with a translated `aria-label`
- Text below the title: "X / Y chapters"

### Hover Overlay (Favourite and Add to Collection)

The hover overlay replaces the old context menu. When `onFavourite` is provided:

- A centred overlay with a favourite (heart) button appears when the card is hovered
- When `onAddToCollection` is provided, the manga is favourited and `hasCollections` is true, an add-to-collection button appears beside the heart
- Both buttons stop click propagation, so they don't trigger the card's `onClick`
- Both are real `<button>`s with translated `aria-label`s

### Status Badge

When `status` is provided, a small pill with a translated label and a colour per status (ongoing, completed, hiatus, cancelled), adjusted for light and dark themes.

### Language Flags

When `languages` is provided, up to three `LanguageBadge`s (bundled flags) are shown, followed by `+N` for the rest.

### Cover Indicators

- **Favourite badge**: heart in the corner of a favourited cover (hide with `showFavouriteBadge={false}`)
- **Download badge**: shown for downloaded titles that aren't favourited (`showDownloadBadge`)
- **Offline overlay**: shown when any chapters are downloaded (`hasDownloads`)

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

- The card is a focusable `<div role="button" tabIndex={0}>`; Enter and Space activate it
- Default `aria-label` combines title, author, status and chapters read (override with `aria-label`)
- Cover images have translated alt text; a fallback "cover unavailable" state shows if the image fails
- The progress bar has a translated `aria-label`
- Decorative badges are `aria-hidden`
- Focus-visible outline for keyboard navigation

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- 2:3 aspect ratio for manga covers (standard)
- Smooth animations (transform, opacity)
- Accessible color contrast (WCAG AA)
- Touch-friendly targets (48px favourite button)

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
  isFavourite={true}
  onClick={handleMangaClick}
  onFavourite={handleFavouriteToggle}
/>
```

### Favourite Management

```tsx
const [favourites, setFavourites] = useState<Set<string>>(new Set())

const handleFavouriteToggle = (id: string) => {
  setFavourites((prev) => {
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
  isFavourite={favourites.has(manga.id)}
  onFavourite={handleFavouriteToggle}
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

# ProgressRing Component

A circular progress indicator with determinate and indeterminate states, following Windows 11 Fluent Design principles.

## Usage

### Basic Loading Spinner

```tsx
import { ProgressRing } from '@renderer/components/ProgressRing'

// Indeterminate (loading spinner)
<ProgressRing />

// Different sizes
<ProgressRing size="small" />
<ProgressRing size="medium" />
<ProgressRing size="large" />
```

### Determinate Progress

```tsx
// Show specific progress
<ProgressRing value={75} />

// Chapter loading progress
<ProgressRing value={progress} size="large" />
```

### Variants

```tsx
// Default (accent blue)
<ProgressRing value={50} variant="default" />

// Success (green)
<ProgressRing value={100} variant="success" />

// Error (red)
<ProgressRing value={30} variant="error" />
```

### Custom Stroke Width

```tsx
<ProgressRing value={75} strokeWidth={2} />
<ProgressRing value={75} strokeWidth={6} />
```

## Props

| Prop          | Type                                | Default      | Description                                         |
| ------------- | ----------------------------------- | ------------ | --------------------------------------------------- |
| `value`       | `number`                            | `undefined`  | Progress value (0-100), undefined for indeterminate |
| `variant`     | `'default' \| 'success' \| 'error'` | `'default'`  | Color variant                                       |
| `size`        | `'small' \| 'medium' \| 'large'`    | `'medium'`   | Ring diameter                                       |
| `strokeWidth` | `number`                            | `4`          | Stroke width in pixels                              |
| `animated`    | `boolean`                           | `true`       | Enable transitions                                  |
| `className`   | `string`                            | `''`         | Additional CSS class                                |
| `aria-label`  | `string`                            | `'Progress'` | Accessible label                                    |

## Features

### Determinate Progress

- Shows specific progress percentage (0-100)
- Fills clockwise from top (12 o'clock)
- Smooth animated transitions
- SVG-based rendering
- Scales perfectly at any size

### Indeterminate Progress

- No `value` prop = indeterminate spinner
- Continuous rotation animation
- 270° arc (75% of circle)
- Smooth circular motion
- Use for unknown duration tasks

### Size Variants

- **Small**: 24px diameter, minimal space
- **Medium**: 40px diameter, standard
- **Large**: 64px diameter, prominent

### Color Variants

- **Default**: Accent blue (`--win-accent`)
- **Success**: Green (#107c10 light, #10c610 dark)
- **Error**: Red (#d13438 light, #ff6b6b dark)

### Customizable Stroke

- Default: 4px thickness
- Adjustable via `strokeWidth` prop
- Scales with ring size
- Rounded caps for smooth appearance

## Examples

### Page Loading

```tsx
function PageLoader() {
  return (
    <div className="page-loader">
      <ProgressRing size="large" />
      <p>Loading content...</p>
    </div>
  )
}
```

### Chapter Loading

```tsx
function ChapterReader() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  return (
    <div className="reader-container">
      {loading && (
        <div className="reader-overlay">
          <ProgressRing value={progress} size="large" />
          <p>{progress}% loaded</p>
        </div>
      )}
    </div>
  )
}
```

### Inline Loading

```tsx
function InlineAction() {
  const [saving, setSaving] = useState(false)

  return (
    <button disabled={saving}>
      {saving && <ProgressRing size="small" />}
      Save Changes
    </button>
  )
}
```

### Image Loading

```tsx
function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="image-container">
      {!loaded && (
        <div className="image-loader">
          <ProgressRing />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? 'block' : 'none' }}
      />
    </div>
  )
}
```

### Multi-State Indicator

```tsx
function StatusIndicator({
  status,
  progress
}: {
  status: 'loading' | 'success' | 'error'
  progress?: number
}) {
  const variant = status === 'success' ? 'success' : status === 'error' ? 'error' : 'default'

  return (
    <div className="status-indicator">
      <ProgressRing value={status === 'loading' ? progress : 100} variant={variant} />
      <span>{status === 'loading' ? 'Processing...' : status}</span>
    </div>
  )
}
```

### Button with Progress

```tsx
function DownloadButton({ downloading, progress }: { downloading: boolean; progress: number }) {
  return (
    <button className="download-btn">
      {downloading ? (
        <>
          <ProgressRing value={progress} size="small" />
          Downloading {progress}%
        </>
      ) : (
        'Download'
      )}
    </button>
  )
}
```

### Sync Indicator

```tsx
function SyncStatus({ syncing, progress }: { syncing: boolean; progress?: number }) {
  return (
    <div className="sync-status">
      {syncing ? (
        <>
          <ProgressRing value={progress} size="small" />
          <span>Syncing...</span>
        </>
      ) : (
        <span>✓ Synced</span>
      )}
    </div>
  )
}
```

## Accessibility

- Uses `role="progressbar"` for screen readers
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for determinate
- `aria-valuetext` for descriptive state
- `aria-label` for context
- Respects `prefers-reduced-motion`
- High contrast mode support
- Keyboard accessible when interactive

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- SVG-based for perfect scaling
- Smooth animations (1.4s rotation)
- Rounded stroke caps
- Subtle background track
- GPU-accelerated transforms

## Indeterminate Animation

The indeterminate state uses two animations:

1. **Rotation**: Entire ring rotates 360° continuously (1.4s linear)
2. **Arc Animation**: Progress arc expands/contracts while rotating (1.4s ease-in-out)

Combined effect creates professional Material Design-style spinner.

## Technical Details

### SVG Structure

- Viewport scales with size prop
- Two circles: background and progress
- Progress circle rotated -90° to start at top
- `stroke-dasharray` and `stroke-dashoffset` control progress
- Rounded `stroke-linecap` for smooth ends

### Calculation

```typescript
const circumference = 2 * π * radius
const offset = circumference - (progress / 100) * circumference
```

Progress fills by reducing stroke-dashoffset from circumference to 0.

## Responsive Behavior

- Inline element (display: inline-flex)
- Scales perfectly at any size
- SVG ensures crisp rendering
- Works in any layout context

## Performance

- GPU-accelerated animations (transform, stroke-dashoffset)
- CSS-only animations (no JavaScript loops)
- Efficient SVG rendering
- Minimal repaints
- Smooth 60fps

## Best Practices

1. **Use indeterminate for unknown duration** - No value prop
2. **Use determinate when trackable** - Show actual progress
3. **Choose appropriate size** - Small for inline, large for focus
4. **Match variant to context** - Success for complete, error for failed
5. **Center in loading overlays** - Provide clear focus
6. **Add descriptive labels** - "Loading...", "Saving...", etc.
7. **Disable animations if needed** - For static progress indicators
8. **Use with aria-live regions** - Announce progress updates

## Common Patterns

### Full-Page Loader

```tsx
function FullPageLoader() {
  return (
    <div className="full-page-loader">
      <ProgressRing size="large" />
      <h2>Loading DexReader...</h2>
    </div>
  )
}

/* CSS */
.full-page-loader {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--win-bg-base);
  z-index: 9999;
}
```

### Card Loading State

```tsx
function MangaCard({ manga, loading }: { manga: Manga; loading: boolean }) {
  return (
    <div className="manga-card">
      {loading && (
        <div className="manga-card__loader">
          <ProgressRing />
        </div>
      )}
      {!loading && (
        <>
          <img src={manga.cover} alt={manga.title} />
          <h3>{manga.title}</h3>
        </>
      )}
    </div>
  )
}
```

### Download Progress Ring

```tsx
function DownloadProgress({ download }: { download: Download }) {
  const variant = download.error ? 'error' : download.complete ? 'success' : 'default'

  return (
    <div className="download-progress">
      <ProgressRing value={download.progress} variant={variant} size="large" />
      <div className="download-info">
        <div className="download-name">{download.name}</div>
        <div className="download-status">
          {download.error ? 'Failed' : download.complete ? 'Complete' : `${download.progress}%`}
        </div>
      </div>
    </div>
  )
}
```

### Skeleton with Spinner

```tsx
function ContentLoader() {
  return (
    <div className="content-loader">
      <div className="loader-icon">
        <ProgressRing size="large" />
      </div>
      <div className="loader-skeleton">
        <Skeleton variant="text" count={3} />
      </div>
    </div>
  )
}
```

## Differences from ProgressBar

| Feature           | ProgressRing                      | ProgressBar                     |
| ----------------- | --------------------------------- | ------------------------------- |
| **Shape**         | Circular                          | Linear                          |
| **Best For**      | Loading spinners, reader progress | Downloads, multi-step processes |
| **Space**         | Compact, fixed size               | Expands to container width      |
| **Label**         | External                          | Integrated header               |
| **Metadata**      | Not supported                     | Speed, ETA supported            |
| **Indeterminate** | Rotating arc                      | Sliding bar                     |

## When to Use

**Use ProgressRing when:**

- Loading full pages or views
- Loading individual items (images, chapters)
- Space-constrained inline loading
- Circular progress makes semantic sense
- Indeterminate loading (most common)

**Use ProgressBar when:**

- Downloads with speed/ETA
- Multi-step processes
- File uploads
- Batch operations
- Horizontal space available

# ProgressBar Component

A linear progress indicator with determinate and indeterminate states, following Windows 11 Fluent Design principles.

## Usage

### Basic Progress

```tsx
import { ProgressBar } from '@renderer/components/ProgressBar'

// Determinate progress
<ProgressBar value={75} />

// With label
<ProgressBar value={45} showLabel />

// Indeterminate (loading)
<ProgressBar />
```

### Download Progress

```tsx
<ProgressBar value={67} showLabel speed="3.2 MB/s" eta="45s remaining" />
```

### Sizes

```tsx
<ProgressBar value={50} size="small" />
<ProgressBar value={50} size="medium" />
<ProgressBar value={50} size="large" />
```

### Variants

```tsx
// Default (accent blue)
<ProgressBar value={50} variant="default" />

// Success (auto at 100%, or explicit)
<ProgressBar value={100} variant="success" />

// Error
<ProgressBar value={30} variant="error" />
```

### Custom Label

```tsx
<ProgressBar value={75} label="Processing chapter 15 of 20" />
```

## Props

| Prop         | Type                                | Default      | Description                                         |
| ------------ | ----------------------------------- | ------------ | --------------------------------------------------- |
| `value`      | `number`                            | `undefined`  | Progress value (0-100), undefined for indeterminate |
| `variant`    | `'default' \| 'success' \| 'error'` | `'default'`  | Color variant                                       |
| `size`       | `'small' \| 'medium' \| 'large'`    | `'medium'`   | Bar thickness                                       |
| `showLabel`  | `boolean`                           | `false`      | Show percentage label                               |
| `label`      | `string`                            | `undefined`  | Custom label text                                   |
| `speed`      | `string`                            | `undefined`  | Download/upload speed                               |
| `eta`        | `string`                            | `undefined`  | Estimated time remaining                            |
| `animated`   | `boolean`                           | `true`       | Enable transitions                                  |
| `className`  | `string`                            | `''`         | Additional CSS class                                |
| `aria-label` | `string`                            | `'Progress'` | Accessible label                                    |

## Features

### Determinate Progress

- Shows specific progress percentage (0-100)
- Smooth animated transitions
- Optional percentage label
- Width scales with value

### Indeterminate Progress

- No `value` prop = indeterminate
- Continuous left-to-right animation
- Moving gradient effect
- 40% bar width sliding infinitely
- Use for unknown duration tasks

### Auto Success Color

- Default variant turns green at 100%
- Can be overridden with explicit variant
- Smooth color transition

### Metadata Display

- **Speed**: Download/upload speed (e.g., "2.5 MB/s")
- **ETA**: Estimated time (e.g., "30s remaining")
- Displayed in header beside label
- Separated by bullet point

### Size Variants

- **Small**: 2px height, minimal space
- **Medium**: 4px height, standard
- **Large**: 6px height, prominent

### Color Variants

- **Default**: Accent blue (`--win-accent`)
- **Success**: Green (#107c10 light, #10c610 dark)
- **Error**: Red (#d13438 light, #ff6b6b dark)

## Examples

### Download Manager

```tsx
interface Download {
  id: string
  name: string
  progress: number
  speed: string
  eta: string
}

function DownloadItem({ download }: { download: Download }) {
  return (
    <div>
      <div>{download.name}</div>
      <ProgressBar value={download.progress} showLabel speed={download.speed} eta={download.eta} />
    </div>
  )
}
```

### Upload with Status

```tsx
function FileUpload() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'uploading' | 'success' | 'error'>('uploading')

  const variant = status === 'error' ? 'error' : status === 'success' ? 'success' : 'default'

  return (
    <ProgressBar
      value={progress}
      variant={variant}
      showLabel
      label={status === 'success' ? 'Upload complete!' : undefined}
    />
  )
}
```

### Chapter Reading Progress

```tsx
function ChapterProgress({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100

  return <ProgressBar value={progress} label={`Chapter ${current} of ${total}`} size="small" />
}
```

### Loading State

```tsx
function DataFetcher() {
  const [loading, setLoading] = useState(true)

  return <div>{loading && <ProgressBar label="Loading data..." size="small" />}</div>
}
```

### Batch Operation

```tsx
function BatchProcessor() {
  const [processed, setProcessed] = useState(0)
  const total = 100

  const progress = (processed / total) * 100

  return (
    <ProgressBar
      value={progress}
      showLabel
      label={`Processing ${processed} of ${total} items`}
      size="large"
    />
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

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- Smooth cubic-bezier transitions
- Rounded ends (full border-radius)
- Subtle background track
- Auto color state at 100%
- Gradient animation for indeterminate

## Indeterminate Animation

The indeterminate state uses two animations:

1. **Slide Animation**: 40% bar slides left-to-right infinitely (1.5s duration)
2. **Gradient Animation**: Moving gradient within the bar (1s duration)

Combined effect creates smooth, professional loading indicator.

## Responsive Behavior

- Full width by default
- Scales with container
- All sizes work on mobile
- Touch-friendly on interactive wrappers

## Performance

- GPU-accelerated animations (transform, opacity)
- Efficient CSS-only animations
- No JavaScript animation loops
- Minimal repaints
- Smooth 60fps

## Best Practices

1. **Use determinate when possible** - Show actual progress
2. **Provide metadata** - Speed and ETA help user planning
3. **Choose appropriate size** - Small for inline, large for focus
4. **Clear labels** - Be specific about what's progressing
5. **Error handling** - Use error variant for failed operations
6. **Success feedback** - Show 100% briefly before hiding
7. **Indeterminate sparingly** - Use only when duration unknown
8. **Avoid rapid updates** - Update every 100-500ms, not every frame

## Common Patterns

### Download Queue

```tsx
function DownloadQueue({ downloads }: { downloads: Download[] }) {
  return (
    <div className="download-queue">
      {downloads.map((download) => (
        <div key={download.id} className="download-item">
          <div className="download-info">
            <span className="download-name">{download.name}</span>
            <span className="download-size">{download.size}</span>
          </div>
          <ProgressBar
            value={download.progress}
            showLabel
            speed={download.speed}
            eta={download.eta}
            size="small"
          />
        </div>
      ))}
    </div>
  )
}
```

### Multi-Step Process

```tsx
function MultiStepWizard() {
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  return (
    <div>
      <ProgressBar value={progress} label={`Step ${step} of ${totalSteps}`} size="medium" />
      {/* Step content */}
    </div>
  )
}
```

### Sync Status

```tsx
function SyncIndicator({ syncing, progress }: { syncing: boolean; progress?: number }) {
  return (
    <div className="sync-status">
      <span>{syncing ? 'Syncing...' : 'Synced'}</span>
      {syncing && <ProgressBar value={progress} size="small" animated />}
    </div>
  )
}
```

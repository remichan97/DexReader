# ProgressRing Component

An indeterminate loading spinner. A thin wrapper over the Fluent 2 `Spinner` that keeps DexReader's `size` and `aria-label` props.

> **Indeterminate only.** Earlier versions drew a determinate SVG ring (`value`, `variant`, `strokeWidth`, `animated`). Nothing in the app used those, so they were dropped in v1.16.0. For a determinate indicator use [ProgressBar](../ProgressBar/README.md).

## Usage

```tsx
import { ProgressRing } from '@renderer/components/ProgressRing'

// Default (medium)
<ProgressRing />

// Different sizes
<ProgressRing size="small" />
<ProgressRing size="medium" />
<ProgressRing size="large" />

// Labelled for screen readers
<ProgressRing size="large" aria-label="Loading chapter" />
```

## Props

| Prop         | Type                             | Default     | Description                                    |
| ------------ | -------------------------------- | ----------- | ---------------------------------------------- |
| `size`       | `'small' \| 'medium' \| 'large'` | `'medium'`  | Spinner size (mapped to Fluent's spinner size) |
| `className`  | `string`                         | `''`        | Additional CSS class                           |
| `aria-label` | `string`                         | `'Loading'` | Accessible label                               |

The default label is an English fallback, so pass a translated `aria-label` (for example `t('state.loading')`) wherever the ring is user-visible.

## Where It Is Used

- `Button` in its `loading` state (small, replaces the icon)
- `Toast` with the `loading` variant (small)
- `LoadingState` and the app-level loading screens (large)
- Reader page placeholders while an image loads (large)
- `UpdateNotification` while checking for or downloading an update (small)
- `ImportProgressDialog` (large)

## Accessibility

- Fluent's `Spinner` renders `role="progressbar"` without a value, which assistive technology announces as busy/indeterminate
- Always provide an `aria-label` that says what is loading

## Styling

Styling comes from Fluent 2 and the app's Fluent theme, so the spinner uses the accent colour in both light and dark mode. There is no stylesheet; use `className` for layout tweaks.

## Examples

### Page Loading

```tsx
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <ProgressRing size="large" aria-label={t('state.loading')} />
      <p>Loading content...</p>
    </div>
  )
}
```

### Inline Loading

```tsx
<div className="inline-flex items-center gap-2">
  <ProgressRing size="small" aria-label="Saving" />
  <span>Saving...</span>
</div>
```

## When to Use

- **ProgressRing**: Unknown duration, compact spaces, loading buttons and placeholders
- **[ProgressBar](../ProgressBar/README.md)**: Known progress (downloads, imports), or when showing speed and ETA
- **[Skeleton](../Skeleton/README.md)**: Content with a known layout that is still loading

# Toast Component

A notification system with toast messages following Windows 11 Fluent Design principles.

## Components

### Toast

Individual toast notification component

### ToastContainer

Container for managing multiple toasts

### useToast

React hook for managing toast state

## Usage

### Basic Setup

```tsx
import { useToast, ToastContainer } from '@renderer/components/Toast'

function App() {
  const { show, toasts } = useToast()

  const handleSave = () => {
    show({
      variant: 'success',
      title: 'Changes saved',
      message: 'Your settings have been updated'
    })
  }

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <ToastContainer toasts={toasts} position="top-right" />
    </>
  )
}
```

### Show Different Types

```tsx
const { show } = useToast()

// Info toast
show({
  variant: 'info',
  title: 'New message',
  message: 'You have 3 unread messages'
})

// Success toast
show({
  variant: 'success',
  title: 'Upload complete',
  message: 'Your file has been uploaded successfully'
})

// Warning toast
show({
  variant: 'warning',
  title: 'Low storage',
  message: 'You have less than 1GB of storage remaining'
})

// Error toast
show({
  variant: 'error',
  title: 'Connection failed',
  message: 'Unable to connect to the server'
})
```

### Custom Duration

```tsx
// Auto-dismiss after 3 seconds
show({
  variant: 'info',
  title: 'Quick message',
  duration: 3000
})

// Never auto-dismiss
show({
  variant: 'error',
  title: 'Critical error',
  message: 'Manual dismissal required',
  duration: 0
})
```

### Manual Dismissal

```tsx
const { show, dismiss, dismissAll } = useToast()

// Show and get ID
const toastId = show({
  variant: 'info',
  title: 'Processing...'
})

// Dismiss specific toast
setTimeout(() => {
  dismiss(toastId)
}, 2000)

// Dismiss all toasts
dismissAll()
```

## Toast Props

| Prop         | Type                                          | Default      | Description                              |
| ------------ | --------------------------------------------- | ------------ | ---------------------------------------- |
| `id`         | `string`                                      | **required** | Unique identifier                        |
| `variant`    | `'info' \| 'success' \| 'warning' \| 'error'` | **required** | Toast type                               |
| `title`      | `string`                                      | **required** | Toast title                              |
| `message`    | `string`                                      | `undefined`  | Optional message                         |
| `duration`   | `number`                                      | `5000`       | Auto-dismiss duration (ms), 0 to disable |
| `onClose`    | `(id: string) => void`                        | **required** | Close handler                            |
| `className`  | `string`                                      | `''`         | Additional CSS class                     |
| `aria-label` | `string`                                      | `undefined`  | Accessible label                         |

## ToastContainer Props

| Prop       | Type                                                               | Default       | Description            |
| ---------- | ------------------------------------------------------------------ | ------------- | ---------------------- |
| `toasts`   | `ToastProps[]`                                                     | **required**  | Array of active toasts |
| `position` | `'top-right' \| 'top-center' \| 'bottom-right' \| 'bottom-center'` | `'top-right'` | Container position     |

## useToast Hook

Returns an object with:

| Property     | Type                   | Description                        |
| ------------ | ---------------------- | ---------------------------------- |
| `show`       | `(toast) => string`    | Show a new toast, returns toast ID |
| `dismiss`    | `(id: string) => void` | Dismiss specific toast             |
| `dismissAll` | `() => void`           | Dismiss all toasts                 |
| `toasts`     | `ToastProps[]`         | Array of active toasts             |

## Variants

### Info (Blue)

- Used for informational messages
- Blue accent color
- Information icon (circle with i)

### Success (Green)

- Used for successful operations
- Green accent color
- Checkmark icon

### Warning (Orange/Yellow)

- Used for warnings and cautions
- Orange/yellow accent color
- Triangle warning icon

### Error (Red)

- Used for errors and failures
- Red accent color
- X icon in circle

## Features

### Auto-Dismiss

- Default: 5000ms (5 seconds)
- Customizable per toast
- Set to 0 to disable
- Timer resets on hover (optional)

### Animations

- Slide in from position
- Top positions: slide down
- Bottom positions: slide up
- Right positions: slide from right
- Center positions: fade in
- Smooth 300ms duration
- Respects `prefers-reduced-motion`

### Positioning

Four positions available:

- **top-right**: Default, appears in top-right corner
- **top-center**: Centered at top
- **bottom-right**: Appears in bottom-right corner
- **bottom-center**: Centered at bottom

### Stacking

- Multiple toasts stack vertically
- 12px gap between toasts
- Oldest at top (top positions) or bottom (bottom positions)
- Maximum width: 400px
- Minimum width: 320px (desktop)

### Close Button

- X icon in top-right of toast
- Always visible
- Manual close available
- Keyboard accessible
- Stops auto-dismiss timer

## Accessibility

- `role="alert"` for immediate announcements
- `aria-live="assertive"` on toasts
- `aria-live="polite"` on container
- Descriptive aria-labels
- Keyboard accessible close button
- Focus management
- Screen reader friendly
- Respects reduced motion preference

## Design Principles

- Follows Windows 11 Fluent Design
- Uses design tokens from `tokens.css`
- Color-coded left border (3px)
- Subtle shadow elevation
- Smooth animations (300ms)
- Card background with border
- Icon + title + message layout
- Responsive on mobile

## Examples

### Success Notification

```tsx
const handleSubmit = async () => {
  try {
    await saveData()
    show({
      variant: 'success',
      title: 'Saved successfully',
      message: 'Your changes have been saved'
    })
  } catch (error) {
    show({
      variant: 'error',
      title: 'Failed to save',
      message: error.message
    })
  }
}
```

### Loading with Update

```tsx
const handleDownload = async () => {
  const toastId = show({
    variant: 'info',
    title: 'Downloading...',
    duration: 0
  })

  try {
    await download()
    dismiss(toastId)
    show({
      variant: 'success',
      title: 'Download complete'
    })
  } catch (error) {
    dismiss(toastId)
    show({
      variant: 'error',
      title: 'Download failed',
      message: error.message
    })
  }
}
```

### Multiple Toasts

```tsx
const handleBatchOperation = () => {
  show({ variant: 'info', title: 'Starting batch operation...' })

  setTimeout(() => {
    show({ variant: 'success', title: 'Step 1 complete' })
  }, 1000)

  setTimeout(() => {
    show({ variant: 'success', title: 'Step 2 complete' })
  }, 2000)

  setTimeout(() => {
    show({ variant: 'success', title: 'All steps complete!' })
  }, 3000)
}
```

### Global Toast Provider

```tsx
// Create a global toast context
import { createContext, useContext } from 'react'
import { useToast, ToastContainer } from '@renderer/components/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} />
    </ToastContext.Provider>
  )
}

export function useGlobalToast() {
  return useContext(ToastContext)
}

// Use anywhere in your app
function AnyComponent() {
  const { show } = useGlobalToast()

  return <button onClick={() => show({ variant: 'success', title: 'Hello!' })}>Show Toast</button>
}
```

## Responsive Behavior

### Desktop (>768px)

- Fixed width: 320-400px
- Positioned with padding
- Full animations

### Mobile (≤768px)

- Full width minus padding
- Centered positions take full width
- Touch-friendly close button
- Same animations

## Performance

- Efficient re-renders with React.memo
- Automatic cleanup of dismissed toasts
- Timer cleanup on unmount
- Minimal DOM updates
- GPU-accelerated animations

## Best Practices

1. **Keep titles short** - One line preferred
2. **Be specific** - Clearly state what happened
3. **Use appropriate variant** - Match severity to variant
4. **Limit duration** - 5s for info, 7s for errors
5. **Avoid spam** - Don't show too many at once
6. **Provide actions** - Add buttons for important actions
7. **Stack limit** - Consider limiting visible toasts to 3-5
8. **Persistent errors** - Use duration=0 for critical errors

# Modal Component

A customizable modal dialog component for app-specific overlays and custom content, following Windows 11 Fluent Design principles.

## When to Use This Component

**Use Custom Modal for:**
- Keyboard shortcuts reference
- Image galleries or media viewers
- Complex forms that aren't blocking operations
- App-specific overlays with custom styling
- Non-critical content that needs custom layout

**Use Native Electron Dialogs for:**
- Information messages (`dialog.showMessageBox` with `type: 'info'`)
- Warning messages (`dialog.showMessageBox` with `type: 'warning'`)
- Confirmation dialogs (`dialog.showMessageBox` with buttons)
- Error messages (`dialog.showErrorBox`)
- File/folder pickers (`dialog.showOpenDialog`, `dialog.showSaveDialog`)

**Why Native Dialogs for Standard Messages?**
- System-consistent UX matching Windows 11
- OS-native appearance users trust
- Proper blocking behavior for critical decisions
- Better accessibility with OS-level screen reader integration

See `docs/components/loading-feedback-states.md` for complete modal strategy and native dialog examples.

## Features

- **Focus Management**: Automatic focus trap and restoration
- **Keyboard Support**: Escape to close, Tab navigation
- **Body Scroll Lock**: Prevents background scrolling when open
- **Click Outside**: Optional close on overlay click
- **Animations**: Smooth fade and scale animations
- **Accessibility**: Full ARIA support and keyboard navigation
- **Windows 11 Design**: Acrylic backdrop blur and native styling

## Usage

```tsx
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Button'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </>
        }
      >
        Are you sure you want to proceed with this action?
      </Modal>
    </>
  )
}
```

## Props

| Prop                   | Type              | Default    | Description                      |
| ---------------------- | ----------------- | ---------- | -------------------------------- |
| `open`                 | `boolean`         | -          | Whether the modal is open        |
| `onClose`              | `() => void`      | -          | Close handler                    |
| `title`                | `string`          | -          | Modal title                      |
| `children`             | `React.ReactNode` | -          | Modal content                    |
| `footer`               | `React.ReactNode` | -          | Modal footer (actions)           |
| `size`                 | `ModalSize`       | `'medium'` | Modal size                       |
| `closeOnOverlayClick`  | `boolean`         | `true`     | Close when clicking overlay      |
| `closeOnEscape`        | `boolean`         | `true`     | Close on Escape key              |
| `className`            | `string`          | `''`       | Additional CSS class             |
| `aria-label`           | `string`          | -          | Accessibility label              |

### Size Options

- `'small'`: 400px max width
- `'medium'`: 600px max width (default)
- `'large'`: 800px max width

## Examples

### Basic Modal (App-Specific Content)

```tsx
<Modal open={isOpen} onClose={handleClose} title="Keyboard Shortcuts">
  <div>
    <h3>Navigation</h3>
    <ul>
      <li><kbd>Ctrl+1</kbd> - Browse</li>
      <li><kbd>Ctrl+2</kbd> - Library</li>
      <li><kbd>Ctrl+3</kbd> - Downloads</li>
    </ul>
  </div>
</Modal>
```

### ❌ Don't Use for Standard Confirmations

```tsx
// DON'T DO THIS - Use native dialog instead
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Delete Item"
  footer={
    <>
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>

// DO THIS INSTEAD - Native Electron dialog
import { dialog } from 'electron'

const result = await dialog.showMessageBox(mainWindow, {
  type: 'warning',
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  detail: 'This action cannot be undone.',
  buttons: ['Cancel', 'Delete'],
  defaultId: 0,
  cancelId: 0
})

if (result.response === 1) {
  handleDelete()
}
```

### Large Modal with Scrollable Content

```tsx
<Modal open={isOpen} onClose={handleClose} title="Terms and Conditions" size="large">
  <div>
    <p>Long content that will scroll...</p>
    <p>More content...</p>
    {/* ... */}
  </div>
</Modal>
```

### Modal that Doesn't Close on Overlay Click

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Important"
  closeOnOverlayClick={false}
  footer={<Button onClick={handleClose}>Close</Button>}
>
  <p>You must explicitly close this modal.</p>
</Modal>
```

## Accessibility

- Uses `role="dialog"` and `aria-modal="true"`
- Traps focus within the modal
- Restores focus to trigger element on close
- Keyboard navigation with Tab/Shift+Tab
- Escape key to close (configurable)
- ARIA labels for screen readers
- Proper heading hierarchy

## Keyboard Shortcuts

- **Escape**: Close modal (if `closeOnEscape` is true)
- **Tab**: Navigate forward through focusable elements
- **Shift + Tab**: Navigate backward through focusable elements

## Styling

The component uses CSS custom properties from the design tokens:

- `--win-bg-card`: Modal background
- `--win-border-default`: Border color
- `--win-shadow-xl`: Shadow elevation
- `--radius-lg`: Border radius

## Performance Notes

- Body scroll is locked when modal is open
- Backdrop blur uses `backdrop-filter` (hardware accelerated)
- Animations use `transform` and `opacity` for 60fps performance
- Respects `prefers-reduced-motion` for accessibility

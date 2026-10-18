# Modal Component

A modal dialog for app-specific overlays and custom content. A thin wrapper over the Fluent 2 `Dialog` that keeps a simple `open` / `onClose` / `title` / `footer` API.

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

- **Focus Management**: Fluent traps focus inside the dialog and restores it on close
- **Keyboard Support**: Escape to close (configurable), Tab navigation
- **Body Scroll Lock**: Fluent prevents background scrolling while open
- **Click Outside**: Optional close on backdrop click (configurable independently of Escape)
- **Close Button**: A dismiss button in the title bar, labelled with the translated "close dialog" string
- **Accessibility**: `role="dialog"` with `aria-modal`, titled by the `title` prop
- **Fluent 2 Theming**: Surface, backdrop and animation come from Fluent and the app theme

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

| Prop                  | Type              | Default    | Description                            |
| --------------------- | ----------------- | ---------- | -------------------------------------- |
| `open`                | `boolean`         | -          | Whether the modal is open              |
| `onClose`             | `() => void`      | -          | Close handler                          |
| `title`               | `string`          | -          | Modal title                            |
| `children`            | `React.ReactNode` | -          | Modal content                          |
| `footer`              | `React.ReactNode` | -          | Modal footer (actions)                 |
| `size`                | `ModalSize`       | `'medium'` | Modal size                             |
| `closeOnOverlayClick` | `boolean`         | `true`     | Close when clicking overlay            |
| `closeOnEscape`       | `boolean`         | `true`     | Close on Escape key                    |
| `className`           | `string`          | -          | Class applied to the dialog surface    |
| `aria-label`          | `string`          | -          | Accessible name for the dialog surface |

### Size Options

Fluent's `DialogSurface` has no size prop, so the sizes are `max-width` caps applied through `className`:

- `'small'`: 400px max width
- `'medium'`: 600px max width (default)
- `'large'`: 800px max width

Fluent popups and dialogs carry their own size limits; override them through `className` when a layout needs something different.

## Examples

### Basic Modal (App-Specific Content)

```tsx
<Modal open={isOpen} onClose={handleClose} title="Keyboard Shortcuts">
  <div>
    <h3>Navigation</h3>
    <ul>
      <li>
        <kbd>Ctrl+1</kbd> - Browse
      </li>
      <li>
        <kbd>Ctrl+2</kbd> - Library
      </li>
      <li>
        <kbd>Ctrl+3</kbd> - Downloads
      </li>
    </ul>
  </div>
</Modal>
```

### ❌ Don't Use for Standard Confirmations

```tsx
// DON'T DO THIS - Use native dialog instead
;<Modal
  open={isOpen}
  onClose={handleClose}
  title="Delete Item"
  footer={
    <>
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
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

- Fluent renders `role="dialog"` and `aria-modal="true"`
- Focus is trapped within the modal and restored to the trigger on close
- Keyboard navigation with Tab/Shift+Tab
- Escape key to close (configurable)
- `aria-label` is applied to the dialog surface when provided; otherwise the title labels it

## Keyboard Shortcuts

- **Escape**: Close modal (if `closeOnEscape` is true)
- **Tab**: Navigate forward through focusable elements
- **Shift + Tab**: Navigate backward through focusable elements

## Styling

Styling comes from Fluent 2 and the app's Fluent theme (surface, border, shadow and backdrop follow light/dark mode). The wrapper adds only the size `max-width` caps and the close button's `makeStyles` rules, and makes the footer span the full width (`DialogActions fluid`). There is no stylesheet; use `className` for layout tweaks.

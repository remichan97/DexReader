# List / ListItem Component

Generic row-list primitive following Windows 11 Fluent Design principles. Use it for any
settings list of items (restore points, storage entries, presets, etc.) instead of
hand-rolling a new bespoke list layout per screen.

## Usage

```tsx
import { List, ListItem } from '@renderer/components/ListItem'
import { Badge } from '@renderer/components/Badge'
import { Button } from '@renderer/components/Button'

function RestorePointsList() {
  return (
    <List>
      {restorePoints.map((point) => (
        <ListItem
          key={point.fileName}
          leading={
            <Badge variant={point.trigger === 'auto' ? 'info' : 'default'}>{point.trigger}</Badge>
          }
          title={formatDate(point.createdAt)}
          subtitle={formatBytes(point.sizeInBytes)}
          trailing={
            <>
              <Button variant="secondary" size="small" onClick={() => onRestore(point.fileName)}>
                Restore
              </Button>
              <Button variant="danger" size="small" onClick={() => onDelete(point.fileName)}>
                Delete
              </Button>
            </>
          }
        />
      ))}
    </List>
  )
}
```

## Props

### List

| Prop        | Type        | Default  | Description               |
| ----------- | ----------- | -------- | ------------------------- |
| `children`  | `ReactNode` | Required | `ListItem` rows to render |
| `className` | `string`    | `''`     | Additional CSS class      |

### ListItem

| Prop         | Type         | Default     | Description                                           |
| ------------ | ------------ | ----------- | ----------------------------------------------------- |
| `leading`    | `ReactNode`  | `undefined` | Content at the start of the row (icon, badge, cover)  |
| `title`      | `ReactNode`  | Required    | Primary row text                                      |
| `subtitle`   | `ReactNode`  | `undefined` | Secondary row text shown below the title              |
| `trailing`   | `ReactNode`  | `undefined` | Content at the end of the row (actions, value, badge) |
| `onClick`    | `() => void` | `undefined` | Makes the row interactive (hover/focus, keyboard)     |
| `disabled`   | `boolean`    | `false`     | Disables interaction and dims the row                 |
| `className`  | `string`     | `''`        | Additional CSS class                                  |
| `aria-label` | `string`     | `undefined` | ARIA label for the row                                |

## Behaviour Notes

- `List` automatically draws a divider between rows via `:not(:last-child)` - no need to
  track which item is last.
- A `ListItem` is only interactive (hover/focus states, `Enter`/`Space` activation) when
  `onClick` is passed. Without it, the row renders as static content.
- Clicks and key presses inside `trailing` never bubble to the row's `onClick` - safe to
  place buttons there even on an interactive row.
- For an empty list, render the existing `EmptyState` component instead of `List` -
  `List`/`ListItem` intentionally has no empty-state handling of its own.

## Keyboard Navigation

- **Tab**: Focus an interactive row (only when `onClick` is provided)
- **Enter/Space**: Activate an interactive row
- Focus moves independently into `trailing` content (buttons, etc.) via normal tab order

## Accessibility

- `List` uses `role="list"`; each `ListItem` uses `role="listitem"`
- Interactive rows are focusable (`tabIndex={0}`) and keyboard-activatable
- `aria-disabled` reflects the `disabled` prop

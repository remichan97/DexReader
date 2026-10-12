# TagPicker Component

A searchable multi-select that shows its picks as removable chips inside the field, built on Fluent 2's `TagPicker` (`@fluentui/react-components`). Used for the Browse filter's Include Tags, Exclude Tags and Languages.

## Usage

```tsx
import { TagPicker } from '@renderer/components/TagPicker'
;<TagPicker
  options={[
    { id: 'action', name: 'Action', group: 'Genre' },
    { id: 'isekai', name: 'Isekai', group: 'Theme' }
  ]}
  selectedIds={selected}
  onChange={setSelected}
  keepOpenOnSelect
  placeholder="Search tags to include..."
  aria-label="Include Tags"
/>
```

## Props

| Prop               | Type                            | Default | Description                                                                                   |
| ------------------ | ------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `options`          | `readonly TagPickerTagOption[]` | -       | Everything pickable, flat (`{ id, name, group?, icon? }`); grouped back by `group` internally |
| `selectedIds`      | `readonly string[]`             | -       | Currently selected ids                                                                        |
| `onChange`         | `(ids: string[]) => void`       | -       | Called with the full new selection                                                            |
| `disabledIds`      | `readonly string[]`             | `[]`    | Shown but not selectable (e.g. what a paired picker already holds)                            |
| `keepOpenOnSelect` | `boolean`                       | `false` | Keep the list open after a pick, so several can be picked in a row                            |
| `placeholder`      | `string`                        | -       | Input placeholder                                                                             |
| `aria-label`       | `string`                        | -       | Accessible name for the input and the chip group                                              |

## Behaviour

- Typing filters the list (case-insensitive substring match on the name) and the query clears after a pick
- Options without a `group` are listed flat; with one, under group headings
- Picked options are hidden from the list, since they show as chips
- Each chip has its own dismiss (X)
- The list is capped at 280px and scrolls, so it opens below the field (or above it near the bottom of the window) instead of beside it

## Fluent quirks it works around

- **Closing after every pick**: Fluent's `TagPicker` closes its list on each pick. With `keepOpenOnSelect` the picker takes control of `open` and ignores the close request that comes from clicking an option or pressing Enter on one; Escape, an outside click and blur still close it
- **`disabled` on options**: `TagPickerOption` honours `disabled` but doesn't declare it in its types or style it, so a typing bridge and a manual disabled style are used
- **Height**: Fluent caps the list at `80vh`, which is too tall to fit below or above the field with a long option list, so it flips to the side; the 280px cap avoids that

# SearchBar Component

A debounced search input with an optional filter button, built on Fluent 2's `SearchBox` (`@fluentui/react-components`).

## Usage

```tsx
import { SearchBar } from '@renderer/components/SearchBar'

// Basic search
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search manga..."
/>

// With filters
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onFilterClick={handleOpenFilters}
  filterCount={3}
  placeholder="Search manga titles..."
/>

// With extra buttons inside the box
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  actions={<Button appearance="transparent" size="small" icon={<Info20Regular />} aria-label="Help" />}
/>
```

## Props

| Prop            | Type                      | Default       | Description                                                   |
| --------------- | ------------------------- | ------------- | ------------------------------------------------------------- |
| `value`         | `string`                  | **required**  | Current search value                                          |
| `onChange`      | `(value: string) => void` | **required**  | Change handler (called after debounce; a clear is immediate)  |
| `onFilterClick` | `() => void`              | `undefined`   | Filter button click handler                                   |
| `filterCount`   | `number`                  | `0`           | Number of active filters (shows a badge)                      |
| `actions`       | `ReactNode`               | `undefined`   | Extra controls shown inside the box, before the filter button |
| `placeholder`   | `string`                  | `'Search...'` | Placeholder text                                              |
| `debounceMs`    | `number`                  | `300`         | Debounce delay in milliseconds                                |
| `disabled`      | `boolean`                 | `false`       | Disabled state                                                |
| `className`     | `string`                  | `undefined`   | Additional class on the box                                   |
| `aria-label`    | `string`                  | `undefined`   | Accessible label                                              |

## Features

### Debouncing

- Typing is debounced (300ms by default, `debounceMs` to change) so `onChange` isn't called on every keystroke
- Clearing the box is reported immediately

### Clear Button

- Fluent's dismiss button, shown only when there is text (and the box isn't disabled)
- Clears the input and keeps focus in it

### Filter Button

When `onFilterClick` is provided:

- Shows a filter icon button, always visible
- A count badge appears on the icon when `filterCount > 0`; the button's label becomes "Filters (3 active)"

### Keyboard Shortcuts

- **Ctrl+F**: focus the search input (global)
- **Escape**: clear the search (when focused)

### Search Icon

- Fluent's built-in magnifying glass at the start of the box

## Notes on the Fluent `SearchBox`

- `SearchBox` caps its own width at 468px; `SearchBar` overrides that so it fills whatever it is placed in
- It collapses everything after the input to zero size until the box is focused, which would hide the filter button and `actions`; `SearchBar` overrides that so they are always visible
- It moves its right padding between the box and the input when focused, which made the trailing buttons shift on focus; the padding is pinned

## Accessibility

- Search input with an accessible name (`aria-label` or the translated default)
- The search icon is decorative; the clear button has a translated `aria-label`
- The filter button's label includes the active filter count
- Keyboard shortcuts fully functional; focus returns to the input after clearing

## Examples

### Search that refetches

```tsx
function MangaSearch() {
  const { query, setQuery, search } = useSearchStore()

  return (
    <SearchBar
      value={query}
      onChange={(value) => {
        setQuery(value)
        search()
      }}
      debounceMs={500}
    />
  )
}
```

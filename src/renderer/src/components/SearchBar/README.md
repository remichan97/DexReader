# SearchBar Component

A search input component with debouncing, filter support, and keyboard shortcuts following Windows 11 Fluent Design principles.

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

// Custom debounce delay
<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  debounceMs={500}
/>
```

## Props

| Prop            | Type                      | Default       | Description                            |
| --------------- | ------------------------- | ------------- | -------------------------------------- |
| `value`         | `string`                  | **required**  | Current search value                   |
| `onChange`      | `(value: string) => void` | **required**  | Change handler (called after debounce) |
| `onFilterClick` | `() => void`              | `undefined`   | Filter button click handler            |
| `filterCount`   | `number`                  | `0`           | Number of active filters (shows badge) |
| `placeholder`   | `string`                  | `'Search...'` | Placeholder text                       |
| `debounceMs`    | `number`                  | `300`         | Debounce delay in milliseconds         |
| `disabled`      | `boolean`                 | `false`       | Disabled state                         |
| `className`     | `string`                  | `''`          | Additional CSS class                   |
| `aria-label`    | `string`                  | `undefined`   | Accessible label                       |

## Features

### Debouncing

- Input changes are debounced by default (300ms)
- Prevents excessive onChange calls during typing
- Improves performance for API calls
- Customizable delay via `debounceMs` prop

### Clear Button

- X icon appears when value is not empty
- Clears search input
- Automatically focuses input after clear
- Hidden when disabled

### Filter Button

When `onFilterClick` is provided:

- Shows filter icon button
- Badge displays active filter count
- Click triggers filter modal/panel
- Disabled state supported

### Keyboard Shortcuts

- **Ctrl+F**: Focus search input (global)
- **Escape**: Clear search (when focused)
- Hint text shown below input (hidden on mobile)

### Search Icon

- Magnifying glass icon at start of input
- Always visible
- Secondary text color

## States

### Default

Clean input with search icon and subtle border

### Hover

Border color changes on hover (`:not(:focus-within)` prevents overriding focus state)

### Focus

**Matches Input Component Exactly**:

- Clean 2px accent bottom border
- **No outer glow** (consistent with Input styling)
- 200ms `cubic-bezier(0.4, 0, 0.2, 1)` transition
- Focus-visible outline on clear/filter buttons

**Important**: Hover state uses `:not(:focus-within)` to prevent border conflict:

```css
.search-bar__container:hover:not(:focus-within) {
  border-color: var(--win-border-hover);
}
```

### Disabled

- Greyed out appearance
- Hint text hidden
- Buttons disabled
- Not interactive

## Filter Badge

When `filterCount > 0`:

- Small circular badge on filter button
- Accent color background
- White text
- Shows number of active filters
- Updates ARIA label: "Filters (3 active)"

## Accessibility

- Semantic HTML with proper input type
- Search icon is decorative (aria-hidden)
- Clear button has aria-label
- Filter button has descriptive aria-label with count
- Keyboard shortcuts fully functional
- Hint text uses aria-live for screen readers
- Focus management (auto-focus after clear)

## Design Principles

- **Windows 11 Fluent Design**: Clean bottom border emphasis, no outer glow
- **Consistent with Input**: 32px height (changed from 36px), 2px bottom border
- **Design Tokens**: All colors/spacing from `tokens.css`
- **Simple Transitions**: 200ms cubic-bezier for border color only
- **Accessible Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Comfortable Touch Targets**: 32px height matches native Windows inputs

### Styling Consistency

SearchBar was polished to match Input component exactly:

| Property       | Before          | After                 |
| -------------- | --------------- | --------------------- |
| Height         | 36px            | 32px                  |
| Border Bottom  | 1px             | 2px                   |
| Focus Behavior | With box-shadow | Border-bottom only    |
| Hover State    | Always applied  | `:not(:focus-within)` |

This ensures all text inputs across the app have identical styling and behavior

## Examples

### Basic Search

```tsx
function BrowseView() {
  const [query, setQuery] = useState('')

  return <SearchBar value={query} onChange={setQuery} placeholder="Search for manga titles..." />
}
```

### With Filters

```tsx
function BrowseView() {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)

  return (
    <>
      <SearchBar
        value={query}
        onChange={setQuery}
        onFilterClick={() => setShowFilters(true)}
        filterCount={activeFilters}
        placeholder="Search manga..."
      />
      {showFilters && <FiltersPanel />}
    </>
  )
}
```

### With API Search

```tsx
function BrowseView() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) {
      setResults([])
      return
    }

    const data = await searchMangaAPI(searchQuery)
    setResults(data)
  }

  return (
    <div>
      <SearchBar
        value={query}
        onChange={handleSearch}
        placeholder="Search manga..."
        debounceMs={500}
      />
      <MangaGrid results={results} />
    </div>
  )
}
```

### Custom Debounce

```tsx
<SearchBar value={query} onChange={setQuery} debounceMs={500} placeholder="Type to search..." />
```

## Debounce Hook

The SearchBar uses a custom `useDebounce` hook located at `src/renderer/src/hooks/useDebounce.ts`.

### Usage

```tsx
import { useDebounce } from '@renderer/hooks/useDebounce'

const [value, setValue] = useState('')
const debouncedValue = useDebounce(value, 300)

useEffect(() => {
  // This runs 300ms after the last value change
  console.log('Debounced value:', debouncedValue)
}, [debouncedValue])
```

## Keyboard Shortcuts

| Shortcut | Action                               |
| -------- | ------------------------------------ |
| `Ctrl+F` | Focus search input (works globally)  |
| `Escape` | Clear search (when input is focused) |

These shortcuts improve keyboard navigation and power user efficiency.

## Performance

- Debouncing prevents excessive onChange calls
- Input value managed internally for responsive typing
- External value synced when changed externally
- Clear button stops propagation
- Minimal re-renders

## Responsive Behavior

### Desktop (>768px)

- Full search bar with hint text
- All features visible

### Mobile (≤768px)

- Hint text hidden
- Compact layout
- Touch-friendly targets (36px buttons)

# Tabs Component

Tab navigation component for content organization following Windows 11 Fluent Design principles.

## Usage

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'

function MangaDetails() {
  return (
    <Tabs defaultValue="info">
      <TabList>
        <Tab value="info">Info</Tab>
        <Tab value="chapters">Chapters</Tab>
        <Tab value="reviews">Reviews</Tab>
      </TabList>

      <TabPanel value="info">
        <p>Manga information...</p>
      </TabPanel>

      <TabPanel value="chapters">
        <p>Chapter list...</p>
      </TabPanel>

      <TabPanel value="reviews">
        <p>User reviews...</p>
      </TabPanel>
    </Tabs>
  )
}
```

## Components

### Tabs (Container)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | `undefined` | Default active tab (uncontrolled) |
| `value` | `string` | `undefined` | Active tab value (controlled) |
| `onChange` | `(value: string) => void` | `undefined` | Change handler for controlled mode |
| `children` | `React.ReactNode` | Required | TabList and TabPanel components |
| `className` | `string` | `''` | Additional CSS class |

### TabList

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | Required | Tab components |
| `className` | `string` | `''` | Additional CSS class |

### Tab

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Tab value identifier |
| `disabled` | `boolean` | `false` | Whether the tab is disabled |
| `children` | `React.ReactNode` | Required | Tab label content |
| `className` | `string` | `''` | Additional CSS class |
| `aria-label` | `string` | `undefined` | ARIA label |

### TabPanel

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Panel value (matches Tab value) |
| `children` | `React.ReactNode` | Required | Panel content |
| `className` | `string` | `''` | Additional CSS class |

## Examples

### Uncontrolled (Default)

```tsx
<Tabs defaultValue="tab1">
  <TabList>
    <Tab value="tab1">First</Tab>
    <Tab value="tab2">Second</Tab>
  </TabList>
  <TabPanel value="tab1">First content</TabPanel>
  <TabPanel value="tab2">Second content</TabPanel>
</Tabs>
```

### Controlled

```tsx
function ControlledTabs() {
  const [activeTab, setActiveTab] = useState('info')

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <TabList>
        <Tab value="info">Info</Tab>
        <Tab value="stats">Stats</Tab>
      </TabList>
      <TabPanel value="info">...</TabPanel>
      <TabPanel value="stats">...</TabPanel>
    </Tabs>
  )
}
```

### With Disabled Tab

```tsx
<Tabs defaultValue="tab1">
  <TabList>
    <Tab value="tab1">Available</Tab>
    <Tab value="tab2" disabled>Coming Soon</Tab>
    <Tab value="tab3">Another</Tab>
  </TabList>
  <TabPanel value="tab1">Content 1</TabPanel>
  <TabPanel value="tab3">Content 3</TabPanel>
</Tabs>
```

### Many Tabs

```tsx
<Tabs defaultValue="overview">
  <TabList>
    <Tab value="overview">Overview</Tab>
    <Tab value="chapters">Chapters</Tab>
    <Tab value="characters">Characters</Tab>
    <Tab value="reviews">Reviews</Tab>
    <Tab value="recommendations">Recommendations</Tab>
  </TabList>
  {/* TabPanels... */}
</Tabs>
```

## Keyboard Navigation

- **Arrow Left/Right**: Navigate between tabs
- **Home**: Jump to first tab
- **End**: Jump to last tab
- **Tab**: Focus next/previous element (standard focus order)

## Features

- **Animated Indicator**: Blue bar slides smoothly under active tab
- **Controlled & Uncontrolled**: Use `value`/`onChange` or `defaultValue`
- **Keyboard Navigation**: Full arrow key support
- **Disabled Tabs**: Skip disabled tabs in keyboard navigation
- **Auto-scrolling**: Active tab scrolls into view
- **Content Animation**: Panel content fades in smoothly

## Accessibility

- Uses proper ARIA roles (`tablist`, `tab`, `tabpanel`)
- `aria-selected` indicates active tab
- `aria-controls` links tab to panel
- Keyboard accessible (arrow keys, Home, End)
- Focus visible indicator
- Disabled tabs not in tab order

## Styling

Follows Windows 11 Fluent Design:
- Bottom border with animated accent indicator
- Hover states on tabs
- Active tab uses accent color and semibold weight
- Smooth indicator animation (200ms cubic-bezier)
- Panel fade-in animation (200ms)
- Respects `prefers-reduced-motion`

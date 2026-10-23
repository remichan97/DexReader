# Tabs Component

Tab navigation for content organisation. `TabList` and `Tab` wrap the Fluent 2 `TabList` and `Tab`; `Tabs` and `TabPanel` are DexReader's own small context-based container and panel.

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

| Prop           | Type                      | Default     | Description                        |
| -------------- | ------------------------- | ----------- | ---------------------------------- |
| `defaultValue` | `string`                  | `undefined` | Default active tab (uncontrolled)  |
| `value`        | `string`                  | `undefined` | Active tab value (controlled)      |
| `onChange`     | `(value: string) => void` | `undefined` | Change handler for controlled mode |
| `children`     | `React.ReactNode`         | Required    | TabList and TabPanel components    |
| `className`    | `string`                  | `''`        | Additional CSS class               |

### TabList

| Prop        | Type              | Default  | Description          |
| ----------- | ----------------- | -------- | -------------------- |
| `children`  | `React.ReactNode` | Required | Tab components       |
| `className` | `string`          | `''`     | Additional CSS class |

### Tab

| Prop            | Type                                               | Default     | Description                                  |
| --------------- | -------------------------------------------------- | ----------- | -------------------------------------------- |
| `value`         | `string`                                           | Required    | Tab value identifier                         |
| `disabled`      | `boolean`                                          | `false`     | Whether the tab is disabled                  |
| `children`      | `React.ReactNode`                                  | Required    | Tab label content                            |
| `className`     | `string`                                           | `''`        | Additional CSS class                         |
| `aria-label`    | `string`                                           | `undefined` | ARIA label                                   |
| `onContextMenu` | `(e: React.MouseEvent<HTMLButtonElement>) => void` | `undefined` | Right-click handler (used for per-tab menus) |

### TabPanel

| Prop        | Type              | Default  | Description                     |
| ----------- | ----------------- | -------- | ------------------------------- |
| `value`     | `string`          | Required | Panel value (matches Tab value) |
| `children`  | `React.ReactNode` | Required | Panel content                   |
| `className` | `string`          | `''`     | Additional CSS class            |

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
    <Tab value="tab2" disabled>
      Coming Soon
    </Tab>
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

- **Controlled & Uncontrolled**: Use `value`/`onChange` or `defaultValue` (`onChange` only fires in controlled mode)
- **Keyboard Navigation**: Arrow key navigation provided by Fluent
- **Disabled Tabs**: Disabled tabs cannot be selected
- **Fluent 2 Styling**: Selected-tab indicator, hover and focus styling come from Fluent and the app theme
- **Lazy Panels**: Only the active `TabPanel` is rendered; inactive panels unmount

## Accessibility

- Fluent renders `tablist` and `tab` roles with `aria-selected`; `TabPanel` renders `role="tabpanel"`
- Each `Tab` gets `id="tab-<value>"` and `aria-controls="panel-<value>"`, and the matching `TabPanel` gets `id="panel-<value>"` and `aria-labelledby="tab-<value>"`. Because these IDs are derived from `value`, use unique values across the page
- Arrow keys, Home and End move between tabs
- Fluent provides the focus indicator

## Styling

Styling comes from Fluent 2 and the app's Fluent theme (the selected tab gets Fluent's accent indicator). The only custom style is the `TabPanel` padding (`spacingVerticalL` top and bottom). There is no stylesheet; use `className` for layout tweaks.

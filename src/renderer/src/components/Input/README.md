# Input Component

A text input with a label, validation message, helper text and character counter. Built on the Fluent 2 `Field` and `Input`, with a string-based `onChange(value)` API and extras for the `search` and `password` types.

## Usage

```tsx
import { Input } from '@renderer/components/Input'

// Basic text input
<Input
  type="text"
  label="Username"
  value={username}
  onChange={setUsername}
  placeholder="Enter username"
/>

// Password input with toggle
<Input
  type="password"
  label="Password"
  value={password}
  onChange={setPassword}
/>

// Email input with validation
<Input
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
/>

// Search input with clear button
<Input
  type="search"
  placeholder="Search manga..."
  value={searchQuery}
  onChange={setSearchQuery}
/>

// Input with character limit
<Input
  label="Bio"
  value={bio}
  onChange={setBio}
  maxLength={150}
  showCounter
  helperText="Tell us about yourself"
/>

// Input with icon
<Input
  type="search"
  icon={<SearchIcon />}
  placeholder="Search..."
  value={query}
  onChange={setQuery}
/>
```

## Props

| Prop          | Type                                          | Default      | Description                          |
| ------------- | --------------------------------------------- | ------------ | ------------------------------------ |
| `type`        | `'text' \| 'password' \| 'email' \| 'search'` | `'text'`     | Input type                           |
| `label`       | `string`                                      | `undefined`  | Label text (optional)                |
| `placeholder` | `string`                                      | `undefined`  | Placeholder text                     |
| `value`       | `string`                                      | **required** | Current input value                  |
| `onChange`    | `(value: string) => void`                     | **required** | Change handler                       |
| `error`       | `string`                                      | `undefined`  | Error message (shows error state)    |
| `helperText`  | `string`                                      | `undefined`  | Helper text below input              |
| `disabled`    | `boolean`                                     | `false`      | Disables input                       |
| `maxLength`   | `number`                                      | `undefined`  | Maximum character length             |
| `showCounter` | `boolean`                                     | `false`      | Show character counter               |
| `icon`        | `React.ReactElement`                          | `undefined`  | Icon at start of input               |
| `className`   | `string`                                      | `undefined`  | Class applied to the `Field` wrapper |
| `aria-label`  | `string`                                      | `undefined`  | Accessible label for screen readers  |

All other standard HTML input attributes (for example `name`, `id`, `required`, `autoComplete`) are passed through to the underlying Fluent `Input`.

## Input Types

### Text

Standard text input for general use

### Password

- Masked input
- Built-in show/hide toggle button
- Automatically shows eye icon for visibility toggle

### Email

Standard email input with browser validation

### Search

- Shows clear button when value is not empty
- Clear button removes all text
- No browser default clear button (custom implementation)

## States

Default, hover, focus and disabled styling come from Fluent 2 and the app theme (the standard Fluent input with an accent bottom border on focus).

### Error

- The field is put into Fluent's `error` validation state
- The `error` message is shown below the input, in place of any `helperText`

### Disabled

- Not interactive; the password toggle and search clear button are hidden

## Features

### Character Counter

When `showCounter` is `true` and `maxLength` is set:

- Shows "current/max" below input
- Updates in real-time
- Positioned on the right side

### Error Validation

When `error` prop is provided:

- Fluent's `Field` switches to its error validation state
- The error message displays below the input and takes priority over `helperText`
- Fluent marks the input invalid and links it to the message

### Helper Text

Shown below input when `helperText` is provided:

- Muted text color
- Small font size
- Provides guidance

### Password Toggle

For `type="password"`:

- Eye icon button on the right
- Toggles between masked/visible
- Updates aria-label dynamically
- Mouse-only: the button is skipped by Tab (`tabIndex={-1}`)

### Clear Button

For `type="search"`:

- X icon button appears when value is not empty
- Clears input on click
- Mouse-only: the button is skipped by Tab (`tabIndex={-1}`); keyboard users clear the text by editing it

### Icon Support

When `icon` prop is provided:

- Displayed inside the input, before the text (Fluent's `contentBefore` slot)
- Input padding is handled by Fluent

## Accessibility

- Uses a semantic `<input>` with a `<label>` associated by Fluent's `Field`
- Error messages are announced by Fluent's `Field`, and the input is marked invalid with the message linked via `aria-describedby`
- The password toggle and search clear buttons have translated `aria-label`s but are skipped by Tab (`tabIndex={-1}`), so they are pointer-only
- Fluent provides the focus indicator
- Character counter has `aria-live="polite"`

## Styling

Styling comes from Fluent 2 and the app's Fluent theme, so colours follow light/dark mode. The wrapper only adds small `makeStyles` rules for the inline icon, the action buttons (20px square) and the footer row that holds the message and counter. There is no stylesheet; use `className` for layout tweaks.

## Examples

### Login Form

```tsx
<form onSubmit={handleLogin}>
  <Input
    type="email"
    label="Email"
    value={email}
    onChange={setEmail}
    error={emailError}
    placeholder="you@example.com"
  />

  <Input
    type="password"
    label="Password"
    value={password}
    onChange={setPassword}
    error={passwordError}
  />

  <Button type="submit">Sign In</Button>
</form>
```

### Search with Icon

```tsx
<Input
  type="search"
  icon={<SearchIcon />}
  placeholder="Search for manga titles..."
  value={searchQuery}
  onChange={setSearchQuery}
  aria-label="Search manga"
/>
```

### Character Limited Bio

```tsx
<Input
  label="Biography"
  value={bio}
  onChange={setBio}
  maxLength={150}
  showCounter
  helperText="Describe yourself in a few words"
  placeholder="Tell us about yourself..."
/>
```

### Disabled Input

```tsx
<Input
  label="Account ID"
  value={accountId}
  onChange={() => {}}
  disabled
  helperText="This field cannot be edited"
/>
```

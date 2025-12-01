# Input Component

A text input component following Windows 11 Fluent Design principles with support for various types, validation states, and interactive features.

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

| Prop          | Type                                          | Default      | Description                         |
| ------------- | --------------------------------------------- | ------------ | ----------------------------------- |
| `type`        | `'text' \| 'password' \| 'email' \| 'search'` | `'text'`     | Input type                          |
| `label`       | `string`                                      | `undefined`  | Label text (optional)               |
| `placeholder` | `string`                                      | `undefined`  | Placeholder text                    |
| `value`       | `string`                                      | **required** | Current input value                 |
| `onChange`    | `(value: string) => void`                     | **required** | Change handler                      |
| `error`       | `string`                                      | `undefined`  | Error message (shows error state)   |
| `helperText`  | `string`                                      | `undefined`  | Helper text below input             |
| `disabled`    | `boolean`                                     | `false`      | Disables input                      |
| `maxLength`   | `number`                                      | `undefined`  | Maximum character length            |
| `showCounter` | `boolean`                                     | `false`      | Show character counter              |
| `icon`        | `React.ReactNode`                             | `undefined`  | Icon at start of input              |
| `className`   | `string`                                      | `''`         | Additional CSS class                |
| `aria-label`  | `string`                                      | `undefined`  | Accessible label for screen readers |

All standard HTML input attributes are also supported (e.g., `name`, `id`, `required`, `autoComplete`, etc.).

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

### Default

Clean input with subtle border

### Hover

Border color changes on hover

### Focus

**Windows 11 Fluent Design Pattern**:
- Clean 2px accent bottom border
- **No outer glow** (browser defaults removed with `box-shadow: none !important`)
- Simple 200ms `cubic-bezier(0.4, 0, 0.2, 1)` transition
- Pure Fluent Design - no Material Design patterns

**Polish Note**: Earlier versions had Material Design expanding lines and scale effects.
Current version uses minimal transition matching Windows 11 native inputs

### Error

- Red border
- Error message displayed below
- Icon shows error state

### Disabled

- Greyed out appearance
- Not interactive
- Cursor shows "not-allowed"

## Features

### Character Counter

When `showCounter` is `true` and `maxLength` is set:

- Shows "current/max" below input
- Updates in real-time
- Positioned on the right side

### Error Validation

When `error` prop is provided:

- Input border turns red
- Error message displays below
- `aria-invalid` set to `true`
- Role="alert" for screen readers

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
- Keyboard accessible

### Clear Button

For `type="search"`:

- X icon button appears when value is not empty
- Clears input on click
- Keyboard accessible (Tab to focus, Enter/Space to activate)

### Icon Support

When `icon` prop is provided:

- Displayed at the start of input
- Input padding adjusted automatically
- Icon is decorative (aria-hidden)

## Accessibility

- Uses semantic `<input>` and `<label>` elements
- Label associates with input via `htmlFor`/`id`
- Error messages use `role="alert"` for screen readers
- `aria-invalid` set when error present
- `aria-describedby` links to error/helper text
- Action buttons have proper `aria-label`
- Focus-visible outline for keyboard navigation
- Character counter has `aria-live="polite"`

## Design Principles

- **Windows 11 Fluent Design**: Clean bottom border emphasis, no outer glow
- **Design Tokens**: All colors/spacing from `tokens.css`
- **Smooth Transitions**: 200ms cubic-bezier for border color
- **No Scale/Glow Effects**: Simple, non-distracting focus behavior
- **Accessible Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Comfortable Touch Targets**: 32px height matches Windows 11 inputs

### CSS Animation Details

```css
.input:focus {
  outline: none;
  box-shadow: none !important; /* Override browser defaults */
  border-bottom-color: var(--win-accent);
  transition: border-bottom-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

The `!important` on `box-shadow` ensures no browser default focus glow appears,
maintaining clean Windows 11 styling across all browsers and platforms

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

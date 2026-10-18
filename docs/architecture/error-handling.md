# Error Handling Architecture

> **Phase 1 Task 9** | Completed: 6 December 2025

Comprehensive error handling system for DexReader, providing graceful degradation, user-friendly messages, and robust recovery mechanisms.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Error Boundaries](#error-boundaries)
- [Global Error Handlers](#global-error-handlers)
- [Error Recovery](#error-recovery)
- [Error Messages](#error-messages)
- [Offline Mode](#offline-mode)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Goals

1. **Never crash the app** - Catch and handle all errors gracefully
2. **User-friendly messages** - Convert technical errors to casual, understandable language
3. **Recovery mechanisms** - Provide ways to retry or recover from errors
4. **Error visibility** - Log errors for debugging while showing friendly UI
5. **Graceful degradation** - Keep as much functionality working as possible

### Three-Layer Defense

```
┌─────────────────────────────────────────┐
│  Layer 1: Error Boundaries              │
│  (Catch React component errors)         │
├─────────────────────────────────────────┤
│  Layer 2: Try-Catch + IPC Handlers      │
│  (Async operations, IPC calls)          │
├─────────────────────────────────────────┤
│  Layer 3: Global Handlers               │
│  (Uncaught exceptions, rejections)      │
└─────────────────────────────────────────┘
```

---

## Architecture

### Component Structure

```
src/renderer/src/
├── components/
│   ├── ErrorBoundary/           # React error boundaries
│   │   ├── ErrorBoundary.tsx    # Core boundary component (class)
│   │   ├── ErrorFallback.tsx    # Default fallback UI
│   │   └── ErrorBoundary.css    # Three-level styles
│   ├── ErrorState/              # Error panel with retry
│   │   ├── ErrorState.tsx       # Error state component
│   │   └── ErrorState.css
│   └── OfflineStatusBar/        # Connectivity status
│       ├── OfflineStatusBar.tsx
│       └── OfflineStatusBar.css
├── utils/
│   ├── errorHandler.ts          # Global error handlers
│   ├── errorMessages.ts         # User-friendly message catalog
│   └── retry.ts                 # Retry utility with backoff
├── hooks/
│   └── useRetry.ts              # Retry hook for components
└── stores/
    └── connectivityStore.ts     # Connectivity state management
```

### Error Flow Diagram

```
┌──────────────┐
│ Error Occurs │
└──────┬───────┘
       │
       ├─ Component Error? ──→ Error Boundary ──→ Fallback UI
       │
       ├─ IPC Error? ──→ Try-Catch ──→ getUserFriendlyError() ──→ Toast
       │
       └─ Uncaught? ──→ Global Handler ──→ Toast + Log
```

---

## Error Boundaries

### Three Levels

Error boundaries provide progressive fallback depending on error severity:

#### 1. App-Level (Last Resort)

**When to use**: Top-level catch-all for uncaught errors

**What it does**:

- Replaces **entire app** (including sidebar)
- Shows full-screen error UI
- Provides "Reload App" + "Try Again" buttons
- Only triggers if page/component boundaries don't catch the error

**Example**:

```tsx
// App.tsx
function App(): React.JSX.Element {
  return (
    <ErrorBoundary
      level="app"
      onError={(error, errorInfo) => {
        console.error('[App Error]', error, errorInfo)
      }}
    >
      <BrowserRouter>
        <AppShell>
          <AppContent />
        </AppShell>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
```

#### 2. Page-Level (Recommended Default)

**When to use**: Per-route error handling (most common)

**What it does**:

- Replaces **main content area only**
- Sidebar stays visible and functional
- User can navigate to other pages
- Shows "Try Again" button
- **This is where most errors should be caught**

**Example**:

```tsx
// router.tsx
<Route
  path="/library"
  element={
    <ErrorBoundary level="page">
      <LibraryView />
    </ErrorBoundary>
  }
/>
```

#### 3. Component-Level (Optional)

**When to use**: Known problematic components, granular recovery

**What it does**:

- Inline error UI where component was
- Rest of page continues working
- Minimal disruption to user
- For specific complex widgets

**Example**:

```tsx
function LibraryView(): React.JSX.Element {
  return (
    <div>
      <h1>Library</h1>
      <ErrorBoundary level="component">
        <ComplexMangaGrid />
      </ErrorBoundary>
    </div>
  )
}
```

### Decision Tree: Which Level?

```
┌──────────────────────────────────┐
│ Where should error be caught?    │
└────────────┬─────────────────────┘
             │
             ├─ Entire app broken? ──────→ App-level
             │
             ├─ Single page broken? ─────→ Page-level ✓ (most common)
             │
             └─ Small widget broken? ────→ Component-level
```

### Custom Fallback UI

You can provide custom fallback instead of using the default:

```tsx
<ErrorBoundary
  level="page"
  fallback={(error, reset) => (
    <div className="custom-error">
      <h2>Oops!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

---

## Global Error Handlers

Catches errors that slip through error boundaries and try-catch blocks.

### What It Catches

1. **Uncaught Exceptions** (`window.onerror`)
   - Runtime errors outside React
   - Script errors
   - Syntax errors

2. **Unhandled Promise Rejections** (`window.onunhandledrejection`)
   - Async operations without `.catch()`
   - Rejected promises
   - Async/await errors without try-catch

### Implementation

```typescript
// src/renderer/src/utils/errorHandler.ts
class GlobalErrorHandler {
  initialize(): void {
    globalThis.onerror = (message, source, lineno, colno, error) => {
      this.handleError({
        type: 'error',
        timestamp: new Date().toISOString(),
        message: typeof message === 'string' ? message : JSON.stringify(message),
        stack: error?.stack,
        url: source,
        line: lineno,
        column: colno
      })
      return true // Prevent default browser error handling
    }

    globalThis.onunhandledrejection = (event) => {
      this.handleError({
        type: 'unhandledRejection',
        timestamp: new Date().toISOString(),
        message: event.reason?.message || JSON.stringify(event.reason),
        stack: event.reason?.stack
      })
      event.preventDefault()
    }
  }
}

// Initialize in main.tsx
globalErrorHandler.initialize()
```

### Error Log

All global errors are logged to an in-memory circular buffer (max 50 entries).

**View in Settings**:

- Go to Settings → Advanced → Error Log
- Copy errors to clipboard for bug reports
- Clear log when needed

---

## Error Recovery

### Retry Utility

Automatic retry with exponential backoff for transient failures:

```typescript
import { retry } from '@renderer/utils/retry'

// Simple retry
const data = await retry(() => fetch('/api/data').then((r) => r.json()), {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true
})

// With retry callback
const result = await retry(() => downloadManga(id), {
  maxAttempts: 5,
  delay: 2000,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt}: ${error.message}`)
  }
})
```

**Backoff calculation**:

- Attempt 1: 1s delay
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- Attempt 4: 8s delay
- etc.

### useRetry Hook

React hook for retry operations with loading/error states:

```typescript
import { useRetry } from '@renderer/hooks/useRetry'

function MyComponent(): React.JSX.Element {
  const { execute, isLoading, error, retry } = useRetry(
    async () => {
      const response = await window.fileSystem.readFile(path, 'utf-8')
      return response.data
    },
    { maxAttempts: 3 }
  )

  useEffect(() => {
    execute()
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (error) {
    return <ErrorState message={error.message} error={error} onRetry={retry} retrying={isLoading} />
  }

  return <div>{/* Success UI */}</div>
}
```

### ErrorState Component

Error panel with a retry button. See [loading-feedback-states.md](../components/loading-feedback-states.md#errorstate) for the full props:

```tsx
<ErrorState
  message="Couldn't load this section"
  error={error}
  onRetry={handleRetry}
  retrying={isLoading}
  showTechnicalDetails
/>
```

---

## Error Messages

### User-Friendly Message Catalog

All technical errors are mapped to casual, conversational messages:

```typescript
import { getUserFriendlyError } from '@renderer/utils/errorMessages'

try {
  await window.fileSystem.readFile(path)
} catch (error) {
  const friendly = getUserFriendlyError(error)

  // friendly = {
  //   title: "Can't find that file",
  //   message: "Maybe it was moved or deleted?",
  //   action: "Double-check the location and try again.",
  //   technical: "ENOENT: no such file or directory..."
  // }

  showToast({
    variant: 'error',
    title: friendly.title,
    message: friendly.message
  })
}
```

### Error Patterns

The catalog includes ~20 patterns covering:

| Category       | Example Errors         | User-Friendly Message                                  |
| -------------- | ---------------------- | ------------------------------------------------------ |
| **Filesystem** | ENOENT, EACCES, ENOSPC | "Can't find that file. Maybe it was moved or deleted?" |
| **Network**    | ETIMEDOUT, ENOTFOUND   | "Can't reach the internet right now."                  |
| **Validation** | VALIDATION_ERROR       | "That doesn't look right"                              |
| **IPC**        | IPC_ERROR              | "Something didn't work"                                |
| **Parsing**    | JSON parse error       | "Got some garbled data"                                |
| **Generic**    | Unknown errors         | "Well, that's weird"                                   |

### Writing Style

**❌ Don't** (formal/technical):

- "An error has occurred while attempting to access the specified resource"
- "Permission denied: EACCES"
- "The operation could not be completed"

**✓ Do** (casual/conversational):

- "Can't find that file. Maybe it was moved or deleted?"
- "Don't have permission to access that"
- "That didn't work. Give it another shot?"

### Adding New Error Patterns

```typescript
// src/renderer/src/utils/errorMessages.ts
const ERROR_CATALOG: ErrorPattern[] = [
  // Add new pattern
  {
    pattern: /MY_CUSTOM_ERROR/,
    title: 'Short user-facing title',
    message: 'Casual explanation of what went wrong',
    action: 'What the user should do next'
  }
  // ... existing patterns
]
```

---

## Offline Mode

### Three Connectivity States

```typescript
type ConnectivityStatus = 'online' | 'offline-user' | 'offline-no-internet'
```

1. **online** - Normal operation, internet available
2. **offline-user** - User manually enabled offline mode (blue banner)
3. **offline-no-internet** - System detected no internet (yellow banner)

### OfflineStatusBar

Persistent banner at top of app when offline:

**User-initiated offline**:

```
┌────────────────────────────────────────────┐
│ 🌐 You're offline                          │
│ Only showing downloaded stuff.             │
│                              [Go Online]   │
└────────────────────────────────────────────┘
```

**No internet detected**:

```
┌────────────────────────────────────────────┐
│ ⚠ No internet                              │
│ Can't connect right now. Downloaded        │
│ content still works though.   [Retry]      │
└────────────────────────────────────────────┘
```

### Usage

```typescript
import { useConnectivityStore } from '@renderer/stores'

function MyComponent(): React.JSX.Element {
  const status = useConnectivityStore((state) => state.status)
  const isOnline = useConnectivityStore((state) => state.isOnline)

  // Toggle offline mode
  const setOfflineMode = useConnectivityStore((state) => state.setOfflineMode)
  const setOnline = useConnectivityStore((state) => state.setOnline)

  if (!isOnline) {
    return <div>You're offline. Some features are unavailable.</div>
  }

  return <div>{/* Normal UI */}</div>
}
```

---

## Usage Patterns

### Pattern 1: IPC Call with Error Handling

```typescript
import { isIpcSuccess } from '@renderer/utils/ipcTypeGuards'
import { getUserFriendlyError } from '@renderer/utils/errorMessages'
import { useToastStore } from '@renderer/stores'

async function loadData(): Promise<void> {
  const showToast = useToastStore.getState().show

  const response = await window.fileSystem.readFile(path, 'utf-8')

  if (isIpcSuccess(response)) {
    // Success - use response.data
    setContent(response.data)
  } else {
    // Error - show user-friendly message
    const friendly = getUserFriendlyError(response.error.message)
    showToast({
      variant: 'error',
      title: friendly.title,
      message: friendly.message,
      duration: 5000
    })
  }
}
```

### Pattern 2: Component with Error Boundary

```tsx
function LibraryView(): React.JSX.Element {
  return (
    <ErrorBoundary level="page">
      <div>
        <h1>My Library</h1>
        <MangaGrid />
      </div>
    </ErrorBoundary>
  )
}
```

### Pattern 3: Async Operation with Retry

```typescript
const { execute, isLoading, error, retry } = useRetry(
  async () => {
    const response = await fetch('/api/manga')
    if (!response.ok) throw new Error('Failed to fetch')
    return response.json()
  },
  { maxAttempts: 3, delay: 1000 }
)

// In render
if (error) {
  return <ErrorState message={error.message} error={error} onRetry={retry} retrying={isLoading} />
}
```

### Pattern 4: Try-Catch with Toast

```typescript
async function handleDownload(): Promise<void> {
  try {
    await downloadManga(mangaId)
    showToast({
      variant: 'success',
      title: 'Download started',
      message: 'Your manga is downloading'
    })
  } catch (error) {
    const friendly = getUserFriendlyError(error as Error)
    showToast({
      variant: 'error',
      title: friendly.title,
      message: friendly.message
    })
  }
}
```

---

## Best Practices

### ✓ Do

1. **Always wrap routes with page-level error boundaries**

   ```tsx
   <Route
     path="/library"
     element={
       <ErrorBoundary level="page">
         <LibraryView />
       </ErrorBoundary>
     }
   />
   ```

2. **Use try-catch for all async operations**

   ```typescript
   try {
     await doSomethingAsync()
   } catch (error) {
     // Handle error
   }
   ```

3. **Check IPC responses with type guards**

   ```typescript
   if (isIpcSuccess(response)) {
     // Use response.data
   } else {
     // Handle response.error
   }
   ```

4. **Use getUserFriendlyError for all user-facing messages**

   ```typescript
   const friendly = getUserFriendlyError(error)
   showToast({ title: friendly.title, message: friendly.message })
   ```

5. **Log technical details to console**

   ```typescript
   console.error('[Component Error]', error, errorInfo)
   ```

### ❌ Don't

1. **Don't show raw error messages to users**

   ```typescript
   // ❌ Bad
   showToast({ message: error.message })

   // ✓ Good
   const friendly = getUserFriendlyError(error)
   showToast({ message: friendly.message })
   ```

2. **Don't swallow errors silently**

   ```typescript
   // ❌ Bad
   try {
     await doSomething()
   } catch {
     // Nothing - user has no idea it failed
   }

   // ✓ Good
   try {
     await doSomething()
   } catch (error) {
     console.error(error)
     showToast({ variant: 'error', message: '...' })
   }
   ```

3. **Don't use error boundaries for everything**
   - Use try-catch for async operations
   - Error boundaries are for component render errors only

4. **Don't nest error boundaries unnecessarily**
   - App-level + Page-level is usually enough
   - Only add component-level for specific known issues

### When to Use What

| Scenario                        | Solution                                 |
| ------------------------------- | ---------------------------------------- |
| Component crashes during render | Error Boundary                           |
| Async IPC call fails            | Try-catch + getUserFriendlyError + Toast |
| User input validation fails     | Inline validation error UI               |
| Network request fails           | Retry utility + ErrorState component     |
| Unknown/uncaught error          | Global error handler (automatic)         |

---

## Testing

### Manual Test Scenarios

1. **Component Error**

   ```tsx
   // Force component to throw
   function TestError(): React.JSX.Element {
     throw new Error('Test component error')
   }
   ```

   **Expected**: Error boundary shows fallback UI, "Try Again" button works

2. **File Not Found**

   ```typescript
   await window.fileSystem.readFile('/nonexistent/file.txt', 'utf-8')
   ```

   **Expected**: Toast shows "Can't find that file. Maybe it was moved or deleted?"

3. **Network Timeout**

   ```typescript
   await fetch('https://httpstat.us/524?sleep=10000')
   ```

   **Expected**: Toast shows "Connection issues" or timeout message

4. **Promise Rejection**

   ```typescript
   Promise.reject(new Error('Test rejection'))
   ```

   **Expected**: Global handler catches, shows toast, logs to error log

5. **Offline Mode**
   - Disconnect internet
     **Expected**: Yellow "No internet" banner appears, "Retry" button checks connectivity

### Error Test View (Dev Mode)

Add to Settings → Advanced (development builds only):

```tsx
<div className="error-test-section">
  <h4>Test Errors (Dev Only)</h4>
  <Button
    onClick={() => {
      throw new Error('Test')
    }}
  >
    Throw Component Error
  </Button>
  <Button onClick={() => Promise.reject('Test rejection')}>Unhandled Promise</Button>
  <Button onClick={() => window.fileSystem.readFile('/fake', 'utf-8')}>File Not Found</Button>
</div>
```

### Testing Checklist

- [ ] Component errors show fallback UI
- [ ] Reset button recovers from errors
- [ ] Uncaught exceptions show toast notifications
- [ ] Promise rejections show toast notifications
- [ ] File errors show user-friendly messages
- [ ] Network errors show appropriate messages
- [ ] Retry mechanism works with exponential backoff
- [ ] Error log captures all global errors
- [ ] Error log can be copied to clipboard
- [ ] Offline status bar appears when disconnected
- [ ] "Retry" button checks connectivity
- [ ] App doesn't crash under any error condition
- [ ] Other features remain functional after errors
- [ ] Technical details logged to console

---

## Troubleshooting

### Error boundary not catching errors

**Problem**: Error happens but boundary doesn't catch it

**Solutions**:

1. Error boundaries only catch errors during render
   - Use try-catch for async operations
   - Use try-catch inside event handlers

2. Error happened outside React tree
   - Global handler should catch these
   - Check console for stack trace

3. Error boundary itself has an error
   - Check ErrorBoundary component for bugs
   - Verify fallback UI renders correctly

### Errors not showing user-friendly messages

**Problem**: Users see technical error codes

**Solutions**:

1. Use `getUserFriendlyError()` utility

   ```typescript
   const friendly = getUserFriendlyError(error)
   showToast({ message: friendly.message })
   ```

2. Add pattern to ERROR_CATALOG

   ```typescript
   // errorMessages.ts
   {
     pattern: /YOUR_ERROR_CODE/,
     title: 'User-friendly title',
     message: 'What went wrong in casual language'
   }
   ```

### Retry not working

**Problem**: Retry utility fails or doesn't retry

**Solutions**:

1. Check retry options

   ```typescript
   await retry(fn, {
     maxAttempts: 3, // Must be > 1
     delay: 1000 // Must be > 0
   })
   ```

2. Ensure function is promise-based

   ```typescript
   // ✓ Good
   await retry(() => fetch('/api'))

   // ❌ Bad (not async)
   await retry(() => console.log('test'))
   ```

3. Check if error is retriable
   - Some errors shouldn't be retried (e.g., 404, validation errors)
   - Add conditional logic if needed

### Global handler not catching errors

**Problem**: Errors slip through all handlers

**Solutions**:

1. Verify handler is initialized

   ```typescript
   // main.tsx
   globalErrorHandler.initialize()
   ```

2. Check if error occurs before initialization
   - Move initialize() earlier in app lifecycle

3. Browser prevents error handling (CORS, CSP)
   - Some errors can't be caught (e.g., cross-origin script errors)

### Memory Bank Questions

If you need to understand specific patterns or implementations:

1. **system-pattern.md** - Error handling architecture overview
2. **tech-context.md** - Component and utility documentation
3. **active-context.md** - Current implementation status
4. This document - Comprehensive usage guide

---

## Summary

DexReader's error handling system provides:

1. **Three-level error boundaries** - Progressive fallback (component → page → app)
2. **Global error handlers** - Catch uncaught exceptions and promise rejections
3. **User-friendly messages** - ~20 error patterns with casual, conversational tone
4. **Retry mechanisms** - Exponential backoff for transient failures
5. **Offline mode** - Distinct states for user-initiated and system-detected offline
6. **Error logging** - In-memory log accessible in Settings → Advanced
7. **Recovery UI** - Inline error components with retry buttons

**Key Principle**: Never crash the app, always show users what happened in language they understand, and provide ways to recover.

---

**Last Updated**: 6 December 2025
**Phase**: 1 - Task 9 (Complete)
**Contributors**: GitHub Copilot, Remichan97

# DexReader Loading and Feedback States

**Created**: 24 November 2025
**Updated**: 13 October 2026 (rewritten for the Fluent 2 components shipped in v1.16.0)

---

## Overview

This document describes how DexReader tells the user that something is loading, has failed, is empty or needs a decision, and which component to use for each case. The original version of this document contained hand-rolled implementations and CSS for each state; those have since been replaced by real components (many of them wrappers over Fluent 2), so this version points at the components rather than reproducing code. Per-component details live in each component's `README.md` under `src/renderer/src/components/`.

| Situation                              | Use                                                  |
| -------------------------------------- | ---------------------------------------------------- |
| Whole view loading                     | `LoadingState` (spinner) or `SkeletonGrid`           |
| Grid of manga cards loading            | `SkeletonGrid`, or `LoadingState variant="skeleton"` |
| Small or inline wait                   | `ProgressRing`                                       |
| Known progress (downloads, imports)    | `ProgressBar`                                        |
| Fatal render error                     | `ErrorBoundary` (`app`, `page` or `component`)       |
| Failed fetch with a retry              | `ErrorState`, or `ErrorRecovery` inline              |
| Offline or no internet                 | `OfflineStatusBar` (driven by `connectivityStore`)   |
| Persistent in-page notice              | `InfoBar`                                            |
| Transient result of an action          | `Toast` via `useToast`                               |
| Nothing to show                        | `EmptyState`                                         |
| Blocking confirmation or system prompt | Native Electron dialog via the preload API           |

---

## Loading Indicators

### LoadingState

A centred loading placeholder for a whole view or panel.

| Prop            | Type                             | Default     | Notes                                        |
| --------------- | -------------------------------- | ----------- | -------------------------------------------- |
| `message`       | `string`                         | -           | Shown beneath the spinner; used as its label |
| `size`          | `'small' \| 'medium' \| 'large'` | `'large'`   | Spinner size                                 |
| `variant`       | `'spinner' \| 'skeleton'`        | `'spinner'` | `'skeleton'` renders a `SkeletonGrid`        |
| `skeletonCount` | `number`                         | `12`        | Number of cards for the skeleton variant     |

Used by: Downloads, History, Library (skeleton), Reader, vertical-scroll page loading.

### Skeleton and SkeletonGrid

`Skeleton` wraps the Fluent 2 skeleton (wave animation, light/dark aware). `SkeletonGrid` is DexReader's own placeholder grid of manga-card shapes and is still styled by `Skeleton.css`. Used by Browse, Creator and Library while results load. See [`Skeleton/README.md`](../../src/renderer/src/components/Skeleton/README.md).

### ProgressRing

An indeterminate spinner (a thin wrapper over the Fluent 2 `Spinner`) with `small`, `medium` and `large` sizes. It is used inside loading buttons, loading toasts, the update notification and the reader's page placeholders. It has no determinate mode; use `ProgressBar` when progress is known. See [`ProgressRing/README.md`](../../src/renderer/src/components/ProgressRing/README.md).

### ProgressBar

A linear determinate or indeterminate bar over the Fluent 2 `ProgressBar`, with an optional label, speed and ETA header. It turns green at 100%. Used for chapter downloads (`DownloadCard`) and the update download (`UpdateNotification`). See [`ProgressBar/README.md`](../../src/renderer/src/components/ProgressBar/README.md).

```tsx
<ProgressBar value={67} showLabel speed="3.2 MB/s" eta="45s remaining" />
```

---

## Error States

### ErrorBoundary

Catches render errors, logs them with `rendererLog`, and shows a fallback.

| Prop       | Type                                             | Notes                                    |
| ---------- | ------------------------------------------------ | ---------------------------------------- |
| `level`    | `'app' \| 'page' \| 'component'`                 | Controls the fallback size and placement |
| `fallback` | `(error: Error, reset: () => void) => ReactNode` | Replace the default fallback             |
| `onError`  | `(error, errorInfo) => void`                     | Extra reporting hook                     |

- `app`: full-screen fallback that replaces the whole app (used at the root in `App.tsx`)
- `page`: fills the main content area; the sidebar stays usable
- `component`: a minimal inline card

### ErrorState

A full error panel with an icon, title, message and actions.

| Prop                   | Type                                   | Notes                                                           |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `message`              | `string`                               | Required                                                        |
| `title`                | `string`                               | Defaults to a translated title for the variant                  |
| `variant`              | `'default' \| 'offline' \| 'critical'` | `offline` uses a cloud-off icon                                 |
| `error`                | `Error \| null`                        | Technical details, available when `showTechnicalDetails` is set |
| `onRetry`              | `() => void`                           | Shows a Retry button                                            |
| `retrying`             | `boolean`                              | Puts the Retry button into its loading state                    |
| `secondaryAction`      | `{ label, onClick }`                   | Extra ghost button                                              |
| `showTechnicalDetails` | `boolean`                              | Adds a toggle that reveals the error's details                  |

Used by Downloads and the Reader (chapter and page failures).

### ErrorRecovery

A compact inline "something went wrong, try again" block with a Retry button (`error`, `onRetry`, `isRetrying`, optional `children`). Use it inside a section that failed to load while the rest of the page is fine.

### Offline and Connectivity

`connectivityStore` tracks one of three states: `online`, `offline-user` (the user chose offline mode) or `offline-no-internet`. `OfflineStatusBar` shows a warning `MessageBar` for the two offline states, with actions to go back online or re-check connectivity, and renders nothing while online. `IncognitoStatusBar` is the equivalent banner for incognito mode.

### InfoBar

A thin wrapper over the Fluent 2 `MessageBar` for persistent in-page notices (`text`, optional `actions`, `visible`, `onDismiss`). It is sticky at the top of its scroll container. Used on Browse, Manga Detail and in the performance settings.

### API Errors

Failed requests that don't block the whole view are reported with a toast, optionally alongside a retry control in the view:

```tsx
import { useToast } from '@renderer/stores'

const { show } = useToast()
show({ variant: 'error', title: t('errors:loadFailed'), message: error.message })
```

See [`Toast/README.md`](../../src/renderer/src/components/Toast/README.md) for the toast API (variants, `duration: 0` for persistent toasts, dismissal by ID).

### Failed Page (Reader)

The Reader uses `ErrorState` for chapter-level failures. Individual page failures are handled in the page display components (`PageDisplay`, `DoublePageDisplay`), which show a "failed to load page N" message with a hint in place of that page rather than failing the whole chapter.

---

## Empty States

`EmptyState` is the single component for "nothing here".

| Prop      | Type                                                     | Notes                                      |
| --------- | -------------------------------------------------------- | ------------------------------------------ |
| `message` | `string`                                                 | Required                                   |
| `title`   | `string`                                                 | Optional heading                           |
| `icon`    | `React.ReactNode`                                        | Typically a 48px Fluent icon               |
| `action`  | `{ label, onClick, variant?: 'primary' \| 'secondary' }` | Rendered as a `Button`                     |
| `variant` | `'default' \| 'search'`                                  | `search` is for "no results" after a query |

```tsx
<EmptyState
  icon={<ArrowDownload24Regular />}
  message={t('downloads:emptyState.title')}
/>

<EmptyState message={t('history:searchEmpty', { query })} variant="search" />
```

Used by Library (empty library, no search results, no collection items), Browse, History, Downloads, Creator, chapter lists and the restore-points list.

---

## Modal Strategy

### Decision Matrix

| Operation              | Type                | Reason                                     |
| ---------------------- | ------------------- | ------------------------------------------ |
| Critical Errors        | Native Error Dialog | OS-native, system integration, blocking    |
| Warnings/Confirmations | Native Message Box  | OS-native, consistent with Windows UX      |
| Information Messages   | Native Message Box  | OS-native, standard Windows pattern        |
| Import Library         | Native File Picker  | OS-native dialog, file system access       |
| Export Library         | Native Save Dialog  | OS-native dialog, save location            |
| API Errors             | Custom Toast        | Non-blocking, temporary, with retry action |
| Network Status         | Custom Banner       | Persistent indicator, non-blocking         |
| Success Messages       | Custom Toast        | Lightweight feedback, auto-dismiss         |
| Settings               | Full View           | Complex form, not modal                    |
| Image Zoom             | Reader Overlay      | Reader-specific, not blocking              |
| Chapter List           | Slide-in Drawer     | Persistent during reading                  |

**Design Principle**: Use native OS dialogs for blocking operations and system-level feedback. Use custom in-app overlays (the `Modal` component) only for app-specific content that a native dialog can't express, such as the keyboard-shortcuts reference or multi-field forms.

### Native Dialogs

Electron's `dialog` module only exists in the main process. The renderer reaches it through the preload API, which is also how every destructive action must be confirmed (see `CLAUDE.md`):

```typescript
// Confirmation (warning icon, Cancel / Confirm); resolves with the user's choice
const confirmed = await globalThis.api.showConfirmDialog(
  t('history:clear.message'),
  t('history:clear.detail'),
  t('history:clear.confirm'),
  t('common:button.cancel')
)

// General message box
await globalThis.api.showDialog({
  type: 'info', // 'none' | 'info' | 'error' | 'question' | 'warning'
  message: t('about.message'),
  detail: t('about.detail'),
  buttons: [t('common:button.ok')]
})
```

File and folder pickers (`dialog.showOpenDialog` / `showSaveDialog`) are likewise invoked from the main process, either in the application menu (`src/main/menu/library.menu.ts`) or in an IPC handler such as `file-systems.handler.ts`.

**Native dialog types**:

- `error` - Red X icon, for critical errors
- `warning` - Yellow warning icon, for destructive actions
- `info` - Blue info icon, for informational messages
- `question` - Question mark icon, for yes/no decisions
- `none` - No icon, for custom scenarios

### Custom Modal

The `Modal` component (a wrapper over the Fluent 2 `Dialog`) covers the remaining cases. See [`Modal/README.md`](../../src/renderer/src/components/Modal/README.md) for props, sizes and when not to use it.

### Custom Toasts (Non-Blocking Notifications)

Toasts are non-blocking feedback for API errors, success messages and progress. They are driven by the global `toastStore` through `useToast()` and rendered by one `ToastContainer` mounted in `App.tsx`. See [`Toast/README.md`](../../src/renderer/src/components/Toast/README.md).

---

## Summary

- Loading: `LoadingState` / `SkeletonGrid` for views, `ProgressRing` for small waits, `ProgressBar` for known progress
- Errors: `ErrorBoundary` for crashes, `ErrorState` / `ErrorRecovery` for failed loads, `OfflineStatusBar` and `InfoBar` for persistent notices, toasts for transient results
- Empty: `EmptyState` with an optional action
- Decisions that must block go through native dialogs; everything else stays in the page

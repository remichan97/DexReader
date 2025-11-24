# DexReader Loading and Feedback States

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document defines all loading indicators, progress displays, error states, and empty states used throughout DexReader to provide clear feedback to users.

---

## Loading Indicators

### Skeleton Screens

**Purpose**: Show content structure while loading data

**Used In**: Browse, Library, Manga Detail views

```typescript
interface LoadingSkeletonProps {
  variant: 'manga-card' | 'detail-header' | 'chapter-list'
  count?: number // Number of skeleton items
}
```

**Implementation**:
```tsx
function MangaCardSkeleton() {
  return (
    <div className="manga-card-skeleton">
      <div className="manga-card-skeleton__cover shimmer" />
      <div className="manga-card-skeleton__info">
        <div className="manga-card-skeleton__title shimmer" />
        <div className="manga-card-skeleton__meta shimmer" />
      </div>
    </div>
  )
}

// Show 15 skeleton cards while loading
<div className="manga-grid">
  {Array.from({ length: 15 }).map((_, i) => (
    <MangaCardSkeleton key={i} />
  ))}
</div>
```

**CSS**:
```css
.manga-card-skeleton__cover {
  aspect-ratio: 2 / 3;
  background: var(--surface-tertiary);
  border-radius: 8px 8px 0 0;
}

.manga-card-skeleton__title {
  height: 18px;
  width: 80%;
  background: var(--surface-tertiary);
  border-radius: 4px;
}

.manga-card-skeleton__meta {
  height: 14px;
  width: 50%;
  background: var(--surface-tertiary);
  border-radius: 4px;
  margin-top: 8px;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}
```

---

### Progress Rings

**Purpose**: Circular progress for determinate loading (image downloads)

**Used In**: Reader view (page loading)

```typescript
interface ProgressRingProps {
  progress: number // 0-100
  size?: number // Default: 48px
  strokeWidth?: number // Default: 4px
  showPercentage?: boolean // Default: false
}
```

**Implementation**:
```tsx
function ProgressRing({ progress, size = 48, strokeWidth = 4 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="progress-ring">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--surface-tertiary)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 150ms ease' }}
      />
    </svg>
  )
}
```

---

### Progress Bars

**Purpose**: Horizontal progress for file operations

**Used In**: Downloads view (chapter downloads)

```typescript
interface ProgressBarProps {
  progress: number // 0-100
  speed?: string // e.g., "2.4 MB/s"
  eta?: string // e.g., "3m 24s"
  size?: string // e.g., "45.2 MB"
  status: 'downloading' | 'paused' | 'completed' | 'error'
}
```

**Implementation**:
```tsx
function DownloadProgress({ progress, speed, eta, status }: ProgressBarProps) {
  return (
    <div className="download-progress">
      <div className="download-progress__bar-container">
        <div
          className={`download-progress__bar download-progress__bar--${status}`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="download-progress__info">
        <span>{progress}%</span>
        {speed && <span>{speed}</span>}
        {eta && <span>ETA: {eta}</span>}
      </div>
    </div>
  )
}
```

**CSS**:
```css
.download-progress__bar-container {
  height: 6px;
  background: var(--surface-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.download-progress__bar {
  height: 100%;
  border-radius: 3px;
  transition: width 300ms ease;
}

.download-progress__bar--downloading {
  background: var(--accent);
}

.download-progress__bar--paused {
  background: var(--warning);
}

.download-progress__bar--completed {
  background: var(--success);
}

.download-progress__bar--error {
  background: var(--error);
}

.download-progress__info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
```

---

### Spinners

**Purpose**: Indeterminate loading for operations without progress

**Used In**: Initial data fetch, search, modal operations

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' // 16px | 24px | 48px
  color?: string // Default: var(--accent)
}
```

**Implementation**:
```tsx
function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={`spinner spinner--${size}`}>
      <div className="spinner__circle" />
    </div>
  )
}
```

**CSS**:
```css
.spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner--small { width: 16px; height: 16px; }
.spinner--medium { width: 24px; height: 24px; }
.spinner--large { width: 48px; height: 48px; }

.spinner__circle {
  width: 100%;
  height: 100%;
  border: 2px solid var(--surface-tertiary);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
```

---

## Error States

### Network Banner

**Purpose**: Persistent banner for offline state

**Location**: Top of ViewContainer

```tsx
function NetworkBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="network-banner" role="alert">
      <OfflineIcon />
      <span>You are offline. Some features may be unavailable.</span>
      <button onClick={checkConnection}>Retry</button>
    </div>
  )
}
```

**CSS**:
```css
.network-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--warning-subtle);
  color: var(--warning-text);
  border-bottom: 1px solid var(--warning);
}
```

---

### API Error Toast

**Purpose**: Temporary notification for failed API requests

```tsx
function showApiError(error: ApiError) {
  const message = error.code === 429
    ? 'Rate limit exceeded. Please try again later.'
    : error.code === 404
    ? 'Content not found.'
    : 'Failed to load data. Please try again.'

  toast.show({
    type: 'error',
    message,
    duration: 4000
  })
}
```

---

### Failed Page (Reader)

**Purpose**: Show error when manga page fails to load

```tsx
function FailedPagePlaceholder({ onRetry, onSkip }: FailedPageProps) {
  return (
    <div className="failed-page">
      <ErrorIcon size={48} />
      <p className="failed-page__message">Failed to load page</p>
      <div className="failed-page__actions">
        <button onClick={onRetry}>Retry</button>
        <button onClick={onSkip}>Skip</button>
      </div>
    </div>
  )
}
```

**CSS**:
```css
.failed-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--surface-secondary);
  color: var(--text-secondary);
  padding: 24px;
}

.failed-page__message {
  font-size: 16px;
  margin: 16px 0;
}

.failed-page__actions {
  display: flex;
  gap: 12px;
}
```

---

## Empty States

### Empty Library

**Purpose**: Guide users when no manga in library

```tsx
function EmptyLibrary() {
  const navigate = useNavigate()

  return (
    <div className="empty-state">
      <LibraryIcon size={80} opacity={0.3} />
      <h2>Your library is empty</h2>
      <p>Browse manga and add them to your library to get started.</p>
      <button onClick={() => navigate('/browse')}>Browse Manga</button>
    </div>
  )
}
```

---

### No Search Results

**Purpose**: Show when search returns no results

```tsx
function NoResults({ query }: { query: string }) {
  return (
    <div className="empty-state">
      <SearchIcon size={80} opacity={0.3} />
      <h2>No results found</h2>
      <p>Try adjusting your search or filters.</p>
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  )
}
```

---

### Empty Downloads

**Purpose**: Show when no active downloads

```tsx
function EmptyDownloads() {
  return (
    <div className="empty-state">
      <DownloadIcon size={80} opacity={0.3} />
      <h2>No downloads</h2>
      <p>Downloaded chapters will appear here.</p>
    </div>
  )
}
```

---

**Shared Empty State CSS**:
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
  text-align: center;
}

.empty-state h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.empty-state button {
  height: 40px;
  padding: 0 24px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
```

---

## Modal Strategy

### Decision Matrix

| Operation | Type | Reason |
|-----------|------|--------|
| Import Library | Native File Picker | OS-native dialog, file system access |
| Export Library | Native Save Dialog | OS-native dialog, save location |
| Delete Confirmation | Custom Overlay | Simple yes/no, app-styled |
| Settings | Full View | Complex form, not modal |
| Image Zoom | Reader Overlay | Reader-specific, not blocking |
| Chapter List | Slide-in Drawer | Persistent during reading |

---

### Native Dialogs (Electron)

```typescript
// File picker for import
async function importLibrary() {
  const result = await window.api.showOpenDialog({
    filters: [
      { name: 'DexReader Library', extensions: ['json'] },
      { name: 'Tachiyomi Backup', extensions: ['json', 'proto.gz'] }
    ],
    properties: ['openFile']
  })

  if (!result.canceled && result.filePaths[0]) {
    // Process file
  }
}

// Save dialog for export
async function exportLibrary() {
  const result = await window.api.showSaveDialog({
    defaultPath: `dexreader-library-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })

  if (!result.canceled && result.filePath) {
    // Save file
  }
}
```

---

### Custom Overlays

```tsx
function ConfirmDialog({ title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <h3 id="dialog-title">{title}</h3>
        <p id="dialog-message">{message}</p>
        <div className="dialog__actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm} className="button--danger">Delete</button>
        </div>
      </div>
    </div>
  )
}
```

**CSS**:
```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fade-in 150ms;
}

.dialog {
  background: var(--surface-secondary);
  border-radius: 12px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: var(--shadow-large);
  animation: scale-in 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## Summary

✅ **Skeleton Screens**: Browse, Library, Detail views
✅ **Progress Rings**: Reader page loading (0-100%)
✅ **Progress Bars**: Download operations with speed/ETA
✅ **Spinners**: Indeterminate operations
✅ **Error States**: Network banner, API toasts, failed pages
✅ **Empty States**: Library, search, downloads with CTAs
✅ **Modal Strategy**: Native dialogs for file ops, custom overlays for confirmations

**Review Status**: ✅ Ready for implementation

---

*Loading and feedback states documentation created: 24 November 2025*
*Part of P1-T01 deliverables*

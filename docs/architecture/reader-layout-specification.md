# DexReader Reader Layout Specification

**Created**: 24 November 2025
**Part of**: P1-T01 - Design Main Application Layout
**Status**: Complete

---

## Overview

This document specifies the fullscreen manga reading experience for DexReader, including all three reading modes, control systems, zoom functionality, and keyboard/mouse interactions.

---

## Reading Modes

### 1. Single Page Mode (Default)

**Layout**:

- One page displayed at a time
- Centered in viewport
- Black letterboxing (#000000)
- Fit-to-height by default

**Navigation**:

- Right Arrow / D / Click Right Half → Next page
- Left Arrow / A / Click Left Half → Previous page
- Space → Next page
- Shift+Space → Previous page

**Use Cases**:

- Standard manga reading
- Portrait-oriented pages
- Smaller windows

---

### 2. Double Page Mode

**Layout**:

- Two pages side-by-side
- Right-to-left layout (manga convention)
  - Right page = current page
  - Left page = next page
- Both pages fit to viewport height
- Black letterboxing

**Navigation**:

- Right Arrow / D / Click Right → Previous 2 pages (move right in manga)
- Left Arrow / A / Click Left → Next 2 pages (move left in manga)
- Space → Next 2 pages
- Shift+Space → Previous 2 pages

**Use Cases**:

- Large windows (>1200px width)
- Spread pages (double-page illustrations)
- Traditional manga reading experience

**Smart Page Pairing**:

```typescript
// Skip cover page (always single page)
if (currentPage === 0) {
  showSinglePage(0)
} else {
  showDoublePages(currentPage, currentPage + 1)
}
```

---

### 3. Vertical Scroll Mode (Webtoon)

**Layout**:

- Pages stacked vertically
- Full-width pages (fit to viewport width)
- Continuous scrolling
- No black background (white/transparent between pages)

**Navigation**:

- Scroll wheel / Trackpad → Natural scrolling
- Page Up / Page Down → Jump by viewport height
- Space → Scroll down one viewport
- Shift+Space → Scroll up one viewport

**Scroll Snapping**:

```css
.reader-canvas--vertical {
  scroll-snap-type: y proximity;
}

.reader-canvas__page {
  scroll-snap-align: start;
}
```

**Use Cases**:

- Webtoons (Korean manhwa, Chinese manhua)
- Long-strip comics
- Vertical-oriented content

---

## Control Bars

### Top Bar (Auto-Hide)

**Contents** (left to right):

```ui
[← Back] | Manga Title - Chapter 45: Chapter Name | [Chapter ▼] | [☰ Menu] [Window Controls]
```

**Components**:

1. **Back Button** (← icon + "Back" text)
   - Returns to previous view (Manga Detail or Library)
   - Keyboard: Escape

2. **Title** (Manga + Chapter)
   - Shows current manga and chapter title
   - Truncated with ellipsis if too long

3. **Chapter Dropdown**
   - Quick jump to other chapters
   - Shows chapter number and title
   - Keyboard: Ctrl+J to open

4. **Menu Button** (☰ icon)
   - Opens chapter list overlay
   - Keyboard: M

**Styling**:

```css
.reader-top-bar {
  height: 64px;
  background: var(--win-acrylic-bg);
  backdrop-filter: blur(30px);
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--win-text-primary);
}
```

**Auto-Hide Behavior**:

- Visible on page load
- Fades out after 3 seconds of no mouse movement
- Fades in on mouse movement or keyboard input
- Always visible in vertical scroll mode

---

### Bottom Bar (Auto-Hide)

**Contents** (left to right):

```ui
[◀ Prev] | Page 12 / 24 | [⚙ Settings] [🔍 Zoom] | [Next ▶]
```

**Components**:

1. **Previous Button** (◀ Prev)
   - Navigate to previous page/chapter
   - Disabled at first page
   - Keyboard: Left Arrow, A

2. **Page Indicator** (current / total)
   - Shows progress through chapter
   - Click to open page jump dialog (future)

3. **Settings Button** (⚙ icon)
   - Opens reading settings popover
   - Change reading mode, image fit, direction
   - Keyboard: S

4. **Zoom Button** (🔍 icon)
   - Opens zoom control popover
   - Fit-to-height, fit-to-width, 100%, custom %
   - Keyboard: Z (toggle zoom modes)

5. **Next Button** (Next ▶)
   - Navigate to next page/chapter
   - Auto-advance to next chapter at end
   - Keyboard: Right Arrow, D, Space

**Styling**:

```css
.reader-bottom-bar {
  height: 64px;
  background: var(--win-acrylic-bg);
  backdrop-filter: blur(30px);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--win-text-primary);
}
```

**Auto-Hide Behavior**:

- Same as top bar
- Exception: Always visible in vertical scroll mode

---

## Image Fit Modes

### Fit to Height (Default)

**Behavior**:

- Page height = viewport height
- Page width scales proportionally
- Horizontal scroll if page wider than viewport
- Best for portrait pages

```typescript
.reader-canvas__page--fit-height {
  height: 100%;
  width: auto;
  object-fit: contain;
}
```

---

### Fit to Width

**Behavior**:

- Page width = viewport width
- Page height scales proportionally
- Vertical scroll if page taller than viewport
- Best for landscape pages

```typescript
.reader-canvas__page--fit-width {
  width: 100%;
  height: auto;
  object-fit: contain;
}
```

---

### Original Size (100%)

**Behavior**:

- Page displays at actual pixel dimensions
- Scroll in both directions if larger than viewport
- Useful for reading small text

```typescript
.reader-canvas__page--original {
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
}
```

---

### Custom Zoom

**Behavior**:

- User sets zoom percentage (25% - 400%)
- Page scales accordingly
- Scroll as needed

```typescript
.reader-canvas__page--custom {
  transform: scale(var(--zoom-scale));
  transform-origin: center;
}
```

---

## Keyboard Shortcuts

### Navigation

| Key             | Action                      |
| --------------- | --------------------------- |
| Right Arrow / D | Next page                   |
| Left Arrow / A  | Previous page               |
| Space           | Next page                   |
| Shift+Space     | Previous page               |
| Page Down       | Scroll down (vertical mode) |
| Page Up         | Scroll up (vertical mode)   |
| Home            | First page                  |
| End             | Last page                   |

### Controls

| Key     | Action                              |
| ------- | ----------------------------------- |
| Escape  | Exit reader (back to previous view) |
| F / F11 | Toggle fullscreen                   |
| M       | Show/hide chapter menu              |
| S       | Open settings popover               |
| Z       | Cycle zoom modes                    |
| Ctrl+J  | Open chapter jump dropdown          |
| Ctrl+=  | Zoom in                             |
| Ctrl+-  | Zoom out                            |
| Ctrl+0  | Reset zoom (fit-to-height)          |

---

## Mouse/Touch Interactions

### Single Page / Double Page Modes

**Click Areas**:

```ui
┌─────────────────────────────────┐
│                                 │
│     Left Half    Right Half     │
│   (Previous)      (Next)        │
│                                 │
└─────────────────────────────────┘
```

**Click Actions**:

- Click left half → Previous page
- Click right half → Next page
- Click on control bars → Show controls (if hidden)

**Scroll Actions**:

- Scroll wheel up → Previous page
- Scroll wheel down → Next page

---

### Vertical Scroll Mode

**Scroll Actions**:

- Natural vertical scrolling
- Scroll snaps to page boundaries (proximity)

**Click Actions**:

- Click anywhere → Toggle controls visibility

---

### Drag to Pan (Custom Zoom)

When zoomed in beyond viewport:

```typescript
let isDragging = false
let dragStart = { x: 0, y: 0 }

canvas.addEventListener('mousedown', (e) => {
  isDragging = true
  dragStart = { x: e.clientX, y: e.clientY }
})

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  const deltaX = e.clientX - dragStart.x
  const deltaY = e.clientY - dragStart.y
  canvas.scrollLeft -= deltaX
  canvas.scrollTop -= deltaY
  dragStart = { x: e.clientX, y: e.clientY }
})
```

---

## Chapter Auto-Advance

**Behavior**:
When user reaches last page of chapter:

1. Show "End of Chapter" overlay for 2 seconds
2. Display options:
   - [← Previous Chapter] [Next Chapter →]
   - [Back to Detail]
3. Auto-advance to next chapter after 5 seconds (with countdown)
4. User can cancel auto-advance by clicking any option

```typescript
function onLastPage() {
  showEndOfChapterOverlay({
    autoAdvanceDelay: 5000,
    onNextChapter: () => navigateToChapter(nextChapterId),
    onPrevChapter: () => navigateToChapter(prevChapterId),
    onBackToDetail: () => navigate(`/browse/${mangaId}`)
  })
}
```

---

## Preloading Strategy

### Online Reading

**Phase 1: Current Chapter**

- Load current page immediately
- Preload next 3 pages in background
- Preload previous 2 pages (for back navigation)

**Phase 2: Adjacent Chapters**

- Preload first 3 pages of next chapter (when at 80% progress)

```typescript
function preloadPages() {
  const currentIndex = currentPage
  const pagesToPreload = [
    pages[currentIndex + 1],
    pages[currentIndex + 2],
    pages[currentIndex + 3],
    pages[currentIndex - 1],
    pages[currentIndex - 2]
  ].filter(Boolean)

  pagesToPreload.forEach((url) => {
    const img = new Image()
    img.src = url
  })
}
```

---

### Offline Reading

**Instant Loading**:

- All pages loaded from local filesystem
- No preloading needed (fast enough)
- Only show spinner if filesystem read >100ms

---

## Loading States

### Initial Chapter Load (Online)

**Phase 1**: Indeterminate spinner while querying at-home endpoint

```typescript
<LoadingSpinner message="Loading chapter..." />
```

**Phase 2**: Progress ring showing image download progress

```typescript
<ProgressRing progress={downloadProgress} size="lg" />
<p>{downloadProgress}% loaded</p>
```

---

### Page Transitions (Online)

**Next Page Loading**:

- Show skeleton/placeholder if next page not yet preloaded
- Fade in page when loaded

```css
.reader-canvas__page {
  opacity: 0;
  transition: opacity 300ms;
}

.reader-canvas__page--loaded {
  opacity: 1;
}
```

---

### Offline Reading

**Instant Load**:

- No loading indicators (pages load instantly from disk)
- Fallback spinner only if >100ms delay

---

## Error Handling

### Failed to Load Page

**Display**:

```ui
┌─────────────────────────────────┐
│                                 │
│     [❌]                         │
│     Failed to load page         │
│     [Retry]                     │
│                                 │
└─────────────────────────────────┘
```

**Actions**:

- Retry button → Reload current page
- Skip button → Move to next page
- Continue with other pages loading

---

### Failed to Load Chapter

**Display**:

```ui
┌─────────────────────────────────┐
│                                 │
│     Chapter Not Available       │
│                                 │
│     This chapter could not be   │
│     loaded. It may be deleted   │
│     or temporarily unavailable. │
│                                 │
│     [← Back to Detail]          │
│                                 │
└─────────────────────────────────┘
```

---

## Settings Popover

**Triggered by**: Settings button (⚙) or `S` key

**Contents**:

```ui
┌──────────────────────────────┐
│ Reading Settings             │
├──────────────────────────────┤
│                              │
│ Reading Mode                 │
│ ( ) Single Page              │
│ (•) Double Page              │
│ ( ) Vertical Scroll          │
│                              │
│ Reading Direction            │
│ (•) Right-to-Left            │
│ ( ) Left-to-Right            │
│                              │
│ Image Fit                    │
│ (•) Fit to Height            │
│ ( ) Fit to Width             │
│ ( ) Original Size            │
│                              │
│ Preload Pages                │
│ [3 ▼]  pages ahead           │
│                              │
└──────────────────────────────┘
```

**Behavior**:

- Popover appears above settings button
- Click outside to close
- Settings save instantly
- Esc to close

---

## Zoom Popover

**Triggered by**: Zoom button (🔍) or `Z` key

**Contents**:

```ui
┌──────────────────────────────┐
│ Zoom                         │
├──────────────────────────────┤
│                              │
│ (•) Fit to Height            │
│ ( ) Fit to Width             │
│ ( ) Original Size (100%)     │
│ ( ) Custom                   │
│                              │
│ ┌──────────────┐             │
│ │ [50%] [100%] │             │
│ │ [150%] [200%]│             │
│ └──────────────┘             │
│                              │
│ [────●────────] 125%         │
│  25%         400%            │
│                              │
└──────────────────────────────┘
```

**Behavior**:

- Popover appears above zoom button
- Quick buttons for common zoom levels
- Slider for custom zoom (25%-400%)
- Real-time preview
- Esc to close

---

## Chapter List Overlay

**Triggered by**: Menu button (☰) or `M` key

**Layout**:

```ui
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ Manga Title                 │ │
│ │ 250 Chapters                │ │
│ ├─────────────────────────────┤ │
│ │                             │ │
│ │ Chapter 50: Title           │ │◀── Current
│ │ Chapter 49: Title           │ │
│ │ Chapter 48: Title           │ │
│ │ Chapter 47: Title           │ │
│ │ ...                         │ │
│ │ (scrollable list)           │ │
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Behavior**:

- Slides in from right
- Current chapter highlighted
- Click chapter → Jump to that chapter
- Esc or click outside → Close
- Acrylic blur background

---

## Accessibility

### Screen Reader Support

```html
<div role="application" aria-label="Manga Reader">
  <img role="img" aria-label="Page 12 of 24" alt="Manga page 12" src="..." />
  <button aria-label="Previous page" onClick="{onPrevPage}">◀ Prev</button>
</div>
```

### Keyboard Navigation

- All controls keyboard accessible
- Tab order: Top bar buttons → Bottom bar buttons
- Focus indicators visible

---

## Performance Optimization

### Image Caching

```typescript
const imageCache = new Map<string, HTMLImageElement>()

function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(url, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}
```

### Memory Management

- Limit cache to 20 images
- Clear cache when exiting reader
- Use WeakMap for automatic garbage collection

---

## Summary

DexReader's reader layout provides:

✅ **Three Reading Modes**: Single page, double page, vertical scroll
✅ **Intuitive Controls**: Auto-hiding bars, keyboard shortcuts
✅ **Smart Navigation**: Click zones, auto-advance chapters
✅ **Flexible Zoom**: Multiple fit modes, custom zoom with pan
✅ **Smooth Loading**: Preloading, progress indicators, graceful errors
✅ **Accessible**: Keyboard navigation, screen reader support
✅ **Performant**: Image caching, memory management

**Review Status**: ✅ Ready for implementation (P2-T07)

---

_Reader layout specification created: 24 November 2025_
_Part of P1-T01 deliverables_

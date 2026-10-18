# DexReader Reader Layout Specification

**Created**: 24 November 2025
**Updated**: 14 October 2026 (rewritten to describe the implemented reader, as of v1.16.1)

---

## Overview

The reader (`src/renderer/src/views/ReaderView/`) is a full-window view for reading a chapter. It is rendered **outside** `AppShell` (no sidebar, no status bars; see [`layout-specification.md`](./layout-specification.md)) at `/reader/:mangaId/:chapterId`. This document describes its layout and behaviour as implemented. The original design had an auto-hiding top bar and bottom bar with acrylic blur, a settings and zoom popover in the bottom bar and drag-to-pan custom zoom; the shipped reader has a single always-visible header and differs in the details below.

---

## Structure

```ui
┌──────────────────────────────────────────────────────────────┐
│ Header (sticky, 56px)                                         │
│ ← Back │      Chapter title      │ badges · Page 3 / 24 · Chapters · Settings · 100% │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                    Page area                                  │
│       single page | double page | vertical scroll             │
│                                                               │
│                                  ┌─────────────┐ (slides in) │
│  [zoom indicator]                │ Chapter list │             │
│  [end-of-chapter overlay]        └─────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

- `<main class="reader-view" data-theme>` is a column: the header, then the page area. Loading and error states replace both
- There is **no bottom bar and no auto-hide**: the header is always visible (`position: sticky`)
- The reader wraps itself in its **own `FluentProvider`**. The theme is dark when the app is dark **or** the "force dark mode" reader setting is on (`reader.forceDarkMode`), because Fluent components take their colours from the nearest provider, not from CSS. A `.reader-view[data-theme='dark']` block also maps the app's `--win-*` text and background tokens to dark values for DexReader's own CSS (page background `#1a1a1a`)
- Mobile-width adjustments are listed in the [responsive guide](../design/responsive-behavior-guide.md): the header is 48px and the double-page mode stacks vertically at ≤768px

---

## Header

`ReaderHeader` is a Fluent-based toolbar (`z-index: 100`):

| Area   | Content                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Left   | **Back** button (ghost, with arrow icon)                                                                                                                                                                     |
| Centre | Chapter title, as the page's `<h1>`                                                                                                                                                                          |
| Right  | Incognito badge (shown when reading progress is not being saved), stream-source indicator (online or local), the page counter, a **Chapters** button, a **Settings** button and a **zoom percentage** button |

- **Page counter**: "Page N / total" in single and vertical modes; in double-page mode it shows the pair and is direction-aware (right-to-left aware)
- **Settings** and **zoom** open Fluent popovers anchored under the header (see below)
- **Chapters** toggles the chapter list; its label changes between "open" and "close"

---

## Reading Modes

The mode is `single`, `double` or `vertical`, set per manga in the reader settings popover (default from the global reading settings).

### Single page

- `PageDisplay`: one page centred in the area
- Page images use the current **fit mode** (see Zoom)
- **Click zones**: clicking the left 40% of the window goes to the previous page, the right 60% to the next. Clicks are ignored while zoomed in (`zoomLevel > 1`) so they do not interfere with panning
- At the last page, advancing opens the next chapter automatically if there is one

### Double page

- `DoublePageDisplay`: two pages side by side, built from page pairs (`usePagePairs`)
- **Skip cover pages**: the first page is shown alone, then pairs follow (1-2, 3-4, …)
- **Read right to left** (manga order): each pair is shown right page first; off gives western left-to-right order
- A trailing odd page is shown alone
- At ≤768px the two pages stack vertically (each up to 50vh)
- The page counter, keyboard and click zones work by pair

### Vertical scroll (webtoon)

- `VerticalScrollDisplay`: all pages stacked at full width and scrolled continuously
- The current page is tracked with an `IntersectionObserver` (multiple thresholds, a `-20%` top and bottom root margin so the centre of the screen wins). The reader does **not** auto-scroll to the current page, so free scrolling is not fought
- Space and Shift+Space step by page; arrow keys, Page Up/Down and Enter use the same page-step logic as the other modes

---

## Fit and Zoom

State lives in `useReaderZoom`.

- **Fit modes**: `height` (default), `width`, `actual` (100%) and `custom` (any zoom other than 100%)
- **Zoom**: 25% to 400%, in steps of ×1.2. Zooming switches to `custom`; resetting returns to `height`
- **Pan**: while zoomed in on `custom`, dragging the page pans it (mouse down, move, up)
- **Zoom indicator**: a `.zoom-indicator` percentage appears briefly in the page area (`z-index: 100`) when the zoom changes
- **Zoom popover** (`ZoomControlsModal`, a `Popover` under the header): buttons for Fit width, Fit height and Actual size, and zoom out, zoom in and reset with the current percentage. The header's zoom button shows the percentage and opens it

### Settings popover

`ReaderSettingsModal` (a `Popover`) contains:

- **Reading mode** (single, double, vertical) as a `Select`
- **Double page options**: skip cover pages and read right to left
- A note that these are **saved for this manga only**

---

## Keyboard

| Key                           | Action                                            |
| ----------------------------- | ------------------------------------------------- |
| →, Page Down, Enter           | Next page (or pair)                               |
| ←, Page Up                    | Previous page (or pair)                           |
| Space, Shift+Space            | Next / previous page                              |
| Home, End                     | First / last page                                 |
| ↑, ↓                          | Previous / next **chapter** (when one exists)     |
| L                             | Toggle the chapter list                           |
| Z                             | Cycle fit mode: width → height → actual → custom  |
| Ctrl+0, Ctrl++ (or =), Ctrl+- | Reset zoom, zoom in, zoom out                     |
| Escape                        | Close the chapter list if open, otherwise go Back |

The in-app shortcuts dialog (Ctrl+/) lists these alongside the global and library shortcuts and is the user-facing reference. Handlers live in `hooks/useReaderKeyboard.ts`.

---

## Chapter Navigation

- **Next chapter**: advancing past the last page opens the next chapter (state carries the manga title, chapter list and `startAtLastPage: false`). Going to the previous chapter can start at its last page
- **End-of-chapter overlay**: when the last page is showing, `EndOfChapterOverlay` appears (fixed, `z-index: 100`) with the chapter number and title, **previous** and **next** chapter buttons (with chapter info), a "no more chapters" message when there is no next chapter, and **Back to detail**
- **Chapter list**: a 400px (max 90vw) panel slides in from the right over a backdrop (`.chapter-list-overlay`, `z-index: 200`; panel `201`). It lists chapters with number, volume, title and page count; choosing one navigates and closes the list. It closes with its Close button, Escape, L or a backdrop click
- **Back**: returns to the manga detail page, carrying the original origin so the detail page's Back goes to where the user started (see [`navigation-flow.md`](./navigation-flow.md))

---

## Progress

- Reading progress saves **1 second after the page stops changing** (debounced), immediately on chapter change and on unmount
- Reaching the last page marks the chapter completed
- When progress saving is off (incognito or auto-save disabled) the header shows the incognito badge and nothing is written
- Reopening a chapter resumes from the saved page; chapters opened from History or Downloads pass their start page in navigation state

---

## Loading and Preloading

- **Initial load**: `LoadingState` centred in the view while the chapter's page list loads
- **Preloading**: `useImagePreload` preloads the previous page, the current page and the next two (`current - 1` to `current + 2`) with `Image` objects, and tracks each page as `loading`, `loaded` or `error`. In vertical mode pages load eagerly until they are more than 10 pages ahead of the current page, after which they use `loading="lazy"`
- **Sources**: online pages come through the `mangadex://` protocol (LRU-cached in the main process) and downloaded chapters through `local-manga://`; the renderer never uses plain HTTPS image URLs
- **Settings**: image quality and the chapter cache tier (`low`, `normal`, `high`, `custom`) are in Settings (the Reader and Performance sections) and control how much is kept in memory

---

## Error Handling

| Situation                      | Behaviour                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Chapter fails to load (online) | `ErrorState` with Retry, a "go back" action and a technical-details toggle                |
| Chapter unavailable offline    | `ErrorState variant="offline"` with a "Go to Library" action                              |
| A single page fails to load    | That page shows "failed to load page N" with a hint; the rest of the chapter stays usable |
| Render error                   | The route's `ErrorBoundary level="page"` fallback                                         |

---

## Accessibility

- The view is a `<main>`; the chapter title is the page heading
- All header controls are real buttons with accessible names (Back, Chapters open/close, Settings, zoom percentage)
- Everything above is reachable from the keyboard; Escape closes overlays before leaving the reader
- The chapter list sidebar is labelled and its backdrop is a labelled control
- Fluent popovers (settings and zoom) manage focus and Escape themselves

---

## Layers (z-index)

| Element                                        | z-index |
| ---------------------------------------------- | ------- |
| Page navigation indicator                      | 10      |
| Header, zoom indicator, end-of-chapter overlay | 100     |
| Chapter list overlay (backdrop)                | 200     |
| Chapter list panel                             | 201     |

# DexReader Archived Milestones

**Purpose**: This file contains detailed implementation notes from completed milestones in reverse chronological order (newest first). These are historical records that provide context for past decisions and serve as essential reference material.

**Last Updated**: 30 January 2026

---

## P3-T18 Accessibility Improvements - WCAG 2.1 Level AA Compliance (30 January 2026)

### Overview

Conducted comprehensive accessibility audit using Lighthouse 12.8.1 and implemented all necessary fixes to achieve WCAG 2.1 Level AA compliance. Work included fixing critical theme persistence bug, color contrast issues, semantic structure improvements, and establishing pragmatic alt text strategy for manga content.

**Time Invested**: ~2 hours (vs 4-6 hour estimate)
**Lighthouse Scores**: Light theme 91% → 100% | Dark theme 96% → 100%

### Audit Process

**Tool Used**: Lighthouse 12.8.1 (Chrome DevTools)
**Target Standard**: WCAG 2.1 Level AA
**Testing Approach**: Separate audits for light and dark themes on localhost:5173

**Initial Results**:

- **Light Theme**: 91% accessibility score
  - 3 failures: Color contrast (Completed badge), missing HTML lang attribute, label-content mismatch (false positive)
  - Contrast ratio requirement: 4.5:1 for normal text, 3:1 for large text and UI components
- **Dark Theme**: 96% accessibility score
  - Zero contrast failures (darker backgrounds naturally provide better contrast)
  - Same lang attribute and false positive issues

### Theme Persistence Bug Fix

**Critical Discovery**: While testing theme consistency, discovered that forced dark mode setting didn't persist across application reloads until user visited Settings page.

**Root Cause**: AppShell.tsx wasn't loading theme preference on mount, only syncing with system theme via Electron's nativeTheme API.

**Solution**: Added theme preference loading to AppShell useEffect:

```typescript
// src/renderer/src/layouts/AppShell.tsx
useEffect(() => {
  const loadTheme = async () => {
    const settings = await window.api.getSettings()
    if (settings?.appearance?.theme) {
      setThemeMode(settings.appearance.theme) // Apply saved preference FIRST
    }
    await window.api.syncTheme() // Then sync with system if needed
  }
  loadTheme()
}, [])
```

**Impact**: Theme preference now loads before system sync, ensuring forced dark mode applies immediately on startup.

### Color Contrast Fixes

**Issue Identified**: "Completed" status badge on manga cards failed WCAG AA contrast requirement in light theme.

**Measurement**:

- Original color: `#0078d4` (Microsoft Blue)
- Contrast ratio: 3.8:1 on white background
- WCAG AA requirement: 4.5:1 for normal text

**Solution**: Darkened badge color to achieve compliance:

```css
/* src/renderer/src/components/MangaCard/MangaCard.css */
.manga-card__status--completed {
  color: #005a9e; /* Darker blue */
}
```

**Result**: Contrast ratio 5.1:1 - exceeds WCAG AA requirement

**Note**: Skeleton loading cards flagged by Lighthouse were false positives - already marked `aria-hidden="true"` as decorative elements.

### HTML Lang Attribute

**Issue**: Root HTML element missing `lang` attribute, preventing screen readers from selecting correct language pronunciation rules.

**Fix**: Added `lang="en"` to html element:

```html
<!-- src/renderer/index.html -->
<html lang="en"></html>
```

**Impact**: Screen readers now correctly identify content as English and apply appropriate pronunciation.

### Semantic Structure Improvements

**Screen Reader Navigation**: Implemented visually-hidden h1 headings for all major application views to provide clear semantic structure.

**Implementation Pattern**:

```tsx
// Added to LibraryView, BrowseView, SettingsView, HistoryView
<h1 className="sr-only">View Name</h1>
```

**Views Enhanced**:

- LibraryView: "Library"
- BrowseView: "Browse Manga"
- SettingsView: "Settings"
- HistoryView: "Reading History"

**Sr-only Utility Class**: Consolidated single global definition in main.css:

```css
/* src/renderer/src/assets/main.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

**Cleanup**: Removed duplicate .sr-only definition from Skeleton.css

### Live Regions for Dynamic Content

**Purpose**: Announce dynamic content changes to screen reader users without interrupting their current focus.

**Implementation**:

1. **LibraryView - Manga Count Announcements**:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {filteredManga.length} manga in library
</div>
```

Announces total count when filtering/sorting changes.

1. **BrowseView - Search Results Feedback**:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isSearching
    ? 'Searching for manga...'
    : searchResults.length > 0
      ? `Found ${searchResults.length} manga${hasMore ? ', scroll for more' : ''}`
      : 'No results found'}
</div>
```

Provides real-time search feedback without visual interruption.

**Attributes Used**:

- `aria-live="polite"`: Announces changes at next graceful opportunity (doesn't interrupt)
- `aria-atomic="true"`: Reads entire region content on change
- `className="sr-only"`: Visually hidden but accessible to assistive tech

### Alt Text Strategy

**Challenge**: Manga is inherently visual storytelling - pages contain artwork and text in Japanese/various languages that convey narrative through images. Detailed descriptions would be impractical and spoiler-prone.

**Decision**: Implemented honest, pragmatic approach acknowledging medium's limitations:

**For Manga Covers**:

- Use manga title as alt text
- Provides context about which series is being viewed
- Already implemented in MangaCard component

**For Reader Pages**:

- Pattern: "Page X of Y"
- Provides positional context for reading progress
- Acknowledges that visual content cannot be meaningfully described
- Screen reader users understand manga's visual nature

**Implementation**:

```tsx
// PageDisplay.tsx - Single page mode
;<img src={imageUrl} alt={`Page ${pageNumber + 1} of ${totalPages}`} />

// DoublePageDisplay.tsx - Two-page spread
pages.map((page, index) => <img src={pageUrl} alt={`Page ${pageIndex + 1} of ${totalPages}`} />)

// VerticalScrollDisplay.tsx - Vertical scroll mode
pages.map((page, index) => <img src={pageUrl} alt={`Page ${index + 1} of ${totalPages}`} />)
```

**WCAG Compliance**: Honest approach is compliant - WCAG doesn't require descriptions of content that can't be meaningfully conveyed to non-visual users. Positional information is useful and honest.

### Files Modified

**HTML/CSS**:

- `src/renderer/index.html`: Added lang="en" attribute
- `src/renderer/src/assets/main.css`: Global .sr-only utility class
- `src/renderer/src/components/MangaCard/MangaCard.css`: Color contrast fix
- `src/renderer/src/components/Skeleton/Skeleton.css`: Removed duplicate .sr-only

**React Components**:

- `src/renderer/src/layouts/AppShell.tsx`: Theme preference loading
- `src/renderer/src/views/LibraryView/LibraryView.tsx`: Sr-only heading + live region
- `src/renderer/src/views/BrowseView/BrowseView.tsx`: Sr-only heading + search live region
- `src/renderer/src/views/SettingsView/SettingsView.tsx`: Sr-only heading
- `src/renderer/src/views/HistoryView/HistoryView.tsx`: Sr-only heading
- `src/renderer/src/views/ReaderView/components/PageDisplay.tsx`: Alt text improvement
- `src/renderer/src/views/ReaderView/components/DoublePageDisplay.tsx`: Alt text improvement
- `src/renderer/src/views/ReaderView/components/VerticalScrollDisplay.tsx`: Alt text improvement

### Testing & Validation

**Lighthouse Re-audit Results**:

- **Light Theme**: 100% accessibility score ✅
  - All color contrast issues resolved
  - HTML lang attribute present
  - Semantic structure improved
- **Dark Theme**: 100% accessibility score ✅
  - Maintained perfect contrast
  - All improvements applied

**WCAG 2.1 Level AA Compliance**:

- ✅ Color contrast: All elements meet 4.5:1 (normal) or 3:1 (large/UI) requirements
- ✅ Language identification: HTML lang attribute present
- ✅ Semantic structure: Proper heading hierarchy with sr-only headings
- ✅ Dynamic content: Live regions announce changes appropriately
- ✅ Alternative text: Honest, pragmatic approach for visual content

**Screen Reader Testing Considerations**:

- Semantic navigation: Users can jump between h1 headings to navigate main sections
- Live announcements: Dynamic content changes announced without interrupting focus
- Alt text: Positional information useful for tracking reading progress

### Lessons Learned

1. **Dark Theme Advantage**: Darker backgrounds naturally provide better contrast ratios - dark theme had zero failures from start
2. **False Positives**: Decorative loading elements can be flagged even when properly hidden with aria-hidden
3. **Theme Loading Order**: Must load user preferences before system sync to prevent flashing/incorrect initial state
4. **Honest Alt Text**: WCAG doesn't require describing indescribable content - positional information is valuable and compliant
5. **Global Utilities**: Accessibility classes like .sr-only should live in global stylesheets, not component files
6. **Incremental Approach**: Lighthouse provides clear actionable feedback - fix items one by one with re-testing

### Outcome

**DexReader is now fully accessible** to users with visual impairments and compliant with WCAG 2.1 Level AA standards. 100% Lighthouse scores on both themes demonstrate production-ready accessibility. Excellent foundation for public release and demonstrates commitment to inclusive design.

**Phase 3 Impact**: With accessibility complete, all Phase 3 user experience goals achieved - native backup/restore, improved UX, and full WCAG compliance.

---

## DexReader Native Import/Export Polish & Refinements (30 January 2026)

### Overview

Implemented multiple quality-of-life improvements to the native DexReader import/export functionality, addressing protobuf serialization issues, UI consistency, and user feedback improvements.

### Issues Addressed

**1. Protobuf Empty Object Deserialization Issue**

**Problem**: When optional sections (collections, progress, readerSettings) were exported with empty data, protobuf deserialized them as `{}` (empty object) instead of `undefined`. This caused import logic to think data was present and attempt processing.

**Root Cause**: Export service was assigning empty arrays to optional fields even when no data existed:

```typescript
// BEFORE - Always assigned, even if empty
if (options.includeCollections) {
  const collectionsData = this.fetchCollectionData()
  backup.collections = collectionsData // { collectionList: [], collectionItems: [] }
}
```

**Solution**: Only assign optional fields when actual data exists:

```typescript
// AFTER - Only assign if data present
if (options.includeCollections) {
  const collectionsData = this.fetchCollectionData()
  if (collectionsData.collectionList.length > 0 || collectionsData.collectionItems.length > 0) {
    backup.collections = collectionsData
  }
}
```

**Impact**:

- Smaller backup file sizes (optional fields not serialized when empty)
- Import can reliably distinguish "not requested" from "requested but empty"
- Clear separation between user intent and data availability

**Files Modified**: `dexreader-export.service.ts`

---

**2. Inconsistent Error Handling Between Import/Export Dialogs**

**Problem**:

- Import dialog: Displayed errors inline within modal (error strip with icon)
- Export dialog: Showed errors as toast notifications (auto-dismissing)

**Issue**: Toasts disappear automatically, potentially missing critical error information. Inconsistent UX patterns across similar operations.

**Solution**: Standardized both dialogs to use inline error strips

**Implementation**:

Frontend changes:

- Updated `DexReaderExportDialog` component:
  - Added `error: string | null` prop
  - Made `onExport` async for proper error handling
  - Added `useEffect` to reset state on dialog close
  - Added inline error display with `Warning20Regular` icon

- Updated `LibraryView` parent component:
  - Added `exportError` state
  - Updated `handleExport` to set inline errors instead of toasts
  - Kept success toast (celebration feedback is appropriate as toast)
  - Reset error state in `handleCloseExportDialog`

CSS additions:

- Added `.export-error`, `.error-icon`, `.error-text` matching import dialog styling
- Consistent visual treatment: error background, border, icon placement

**Result**:

- ✅ Export errors display inline (persistent, contextual)
- ✅ Export success shows as toast (auto-dismissing celebration)
- ✅ Import errors display inline (unchanged)
- ✅ Import success shows as toast (unchanged)
- ✅ Consistent UX across both dialogs

**Files Modified**:

- `DexReaderExportDialog.tsx`
- `DexReaderExportDialog.css`
- `LibraryView.tsx`

---

**3. Missing Save Path Display in Export Dialog**

**Problem**: Import dialog showed the selected file path, but export dialog didn't show where the backup would be saved. Asymmetric information display.

**Solution**: Added save path info section to export dialog matching import dialog's pattern

**Implementation**:

- Added `savePath` prop to `DexReaderExportDialog`
- Imported `SaveArrowRight20Regular` icon for visual consistency
- Created conditional path display section:

  ```tsx
  {
    savePath && (
      <div className="export-path-info">
        <SaveArrowRight20Regular className="export-icon" />
        <div className="path-details">
          <span className="path-label">Save to:</span>
          <span className="path-name">{savePath}</span>
        </div>
      </div>
    )
  }
  ```

- Added CSS matching import dialog's file-info section
- Passed `exportFilePath` from `LibraryView` to dialog

**Result**: Both dialogs now show full file paths with consistent styling, giving users clear visibility into file locations.

**Files Modified**:

- `DexReaderExportDialog.tsx`
- `DexReaderExportDialog.css`
- `LibraryView.tsx`

---

**4. Filename vs Full Path Display Inconsistency**

**Problem**: Initially, import showed only filename while export showed folder path. Inconsistent detail level.

**Solution**: Updated both dialogs to consistently display full file paths

**Before**:

- Import: Extracted filename with `filePath.split(/[\\/]/).pop()`
- Export: Extracted folder with `.slice(0, -1).join('\\\\')`

**After**:

- Import: Shows `filePath` directly
- Export: Shows `savePath` directly

**Rationale**: Full paths provide complete context and are more useful for users managing multiple backups across different locations.

**Files Modified**:

- `DexReaderImportDialog.tsx`
- `DexReaderExportDialog.tsx`

---

### Technical Notes

**Protobuf Optional Field Behavior**:

- When optional field is not set: Field absent in serialized data
- When optional field is empty object: Field present with zero-length arrays
- Import checks like `if (backup.collections)` now reliably detect presence

**Error Display Pattern**:

- Modal dialogs should use inline errors (persistent, contextual)
- Toast notifications for success/celebration (transient, non-blocking)
- Error strips use consistent layout: icon (left) + text (right) + error colors

**Path Display Pattern**:

- Show full paths for file operations (import/export)
- Use `text-overflow: ellipsis` and `white-space: nowrap` for long paths
- Label clearly: "File:" for imports, "Save to:" for exports

### Summary

These refinements improve the robustness and user experience of DexReader's native backup system:

- More reliable serialization/deserialization
- Consistent error feedback across operations
- Better user visibility into file locations
- Polished, professional UI treatment

All changes tested and working correctly as of 30 January 2026.

---

## P3-T17 Date Format Preferences: Detailed Implementation (29 January 2026)

### Decision: System Settings Integration vs Custom Picker

**Context**: Originally planned to implement in-app date format picker with multiple format options. After analyzing codebase, determined system integration was superior solution.

### Frontend Date/Time Usage Analysis

**User-Visible Displays (3 locations)**:

1. **HistoryView** - Reading history cards:
   - Format: Relative time ("2 days ago", "3 hours ago")
   - Fallback: `toLocaleDateString()` for dates >7 days old
   - Usage: Shows when user last read manga
   - Line: HistoryView.tsx:37

2. **ChapterList** (MangaDetailView):
   - Format: `toLocaleDateString()`
   - Usage: Chapter publish dates from MangaDex
   - Visibility: Every chapter in detail view
   - Line: ChapterList.tsx:237

3. **ErrorLogViewer** (Developer tool):
   - Format: `toLocaleString()` (date + time)
   - Usage: Error log timestamps
   - Audience: Debugging, not regular users
   - Line: ErrorLogViewer.tsx:111

**Non-User-Visible**:

- connectivityStore: Internal timestamps (not displayed)
- errorHandler: ISO timestamps for logs (not displayed)
- progressStore: Unix timestamps for calculations (not displayed raw)
- collectionsStore: createdAt/updatedAt (not displayed)

### Decision Matrix

| Aspect             | Custom Picker                      | System Integration      |
| ------------------ | ---------------------------------- | ----------------------- |
| Implementation     | ~6-8 hours                         | ~1 hour                 |
| Code Maintenance   | High (format parsing, locale data) | Zero                    |
| User Benefit       | Format choice in one app           | Format works everywhere |
| System Consistency | May differ from OS                 | Perfect match           |
| Testing Burden     | All formats × all locales          | OS tested               |

**Verdict**: System integration wins on all metrics except "format flexibility within app" (which users don't need).

### Technical Implementation

**Backend** (`app-settings.handler.ts`):

```typescript
wrapIpcHandler('settings:open-system-date-settings', async () => {
  const platform = process.platform

  if (platform === 'win32') {
    await shell.openExternal('ms-settings:regionlanguage')
  } else if (platform === 'darwin') {
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.international')
  } else {
    return false // Linux: no universal way
  }
  return true
})
```

**Platform URLs**:

- Windows: `ms-settings:regionlanguage` → Settings → Time & Language → Region
- macOS: `x-apple.systempreferences:com.apple.preference.international` → System Preferences → Language & Region
- Linux: No URI scheme support, fallback alert with manual instructions

**Frontend** (`AppearanceSettings.tsx`):

- New section: "Date & Time Format"
- Explanation text: Where dates appear in app
- Button: "Configure Date Format in System Settings"
- Handler: Opens OS settings, shows alert if unsupported/failed

**Preload Bridge**:

- Type: `openSystemDateSettings: () => Promise<IpcResponse<boolean>>`
- Invocation: `globalThis.settings.openSystemDateSettings()`

### User Experience Flow

1. User opens Settings → Appearance tab
2. Sees "Date & Time Format" section below accent color
3. Reads: "DexReader uses your system's date and time format settings"
4. Clicks "Configure Date Format in System Settings"
5. Windows: Settings app opens to Region settings
6. User changes short date format (e.g., MM/dd/yyyy → dd/MM/yyyy)
7. Changes apply immediately to DexReader (browser locale API picks up change)

### Advantages of This Approach

**For Users**:

- ✅ One place to configure dates for ALL apps
- ✅ Immediate effect across system
- ✅ Familiar settings UI (OS native)
- ✅ No learning curve for format syntax

**For Developers**:

- ✅ Zero custom formatting code
- ✅ No locale data management
- ✅ No format picker UI
- ✅ No testing matrix (OS already tested)
- ✅ Perfect system consistency

**For Maintenance**:

- ✅ OS handles updates/fixes
- ✅ No breaking changes from format library upgrades
- ✅ No translation of format options
- ✅ No accessibility concerns with custom picker

### Files Modified

1. `src/main/ipc/handlers/app-settings.handler.ts` (13 lines added)
   - New IPC handler with platform detection
   - Uses `shell.openExternal()` with URI schemes
   - Returns boolean success indicator

2. `src/renderer/src/views/SettingsView/components/AppearanceSettings.tsx` (28 lines added)
   - New section after accent color
   - Handler with fallback alert for unsupported platforms
   - Explanation text about date usage in app

3. `src/preload/index.d.ts` (1 line added)
   - Type definition in Settings interface

4. `src/preload/index.ts` (1 line added)
   - Bridge method mapping to IPC channel

**Total**: ~43 lines of code vs ~500-800 lines for custom picker implementation

### Alternative Considered (Not Implemented)

**Custom Date Format Picker**:

- Format options: ISO 8601, US (MM/DD/YYYY), EU (DD/MM/YYYY), Custom
- Implementation needs:
  - Settings field for format preference
  - Utility function to format dates based on preference
  - Refactor 3 components to use utility
  - UI for format selection (dropdown or radio buttons)
  - Preview of format output
  - Format parsing/validation
  - Testing across all format options

**Why Rejected**:

- 8-10x more code
- Ongoing maintenance burden
- User confusion (two places to set dates: OS + app)
- Inconsistency with other apps
- No significant user benefit over system integration

### Conclusion

System settings integration is objectively superior for this use case. The app has minimal date displays, browser APIs already respect OS settings, and users expect consistent date formatting across applications. Custom picker would be engineering overhead without proportional user value.

---

## P3-T15 Native DexReader Import: Detailed Implementation (29 January 2026)

### Frontend Implementation Overview

**Context**: Complement to P3-T13 export. Allows users to restore `.dexreader` backups with intelligent merge strategies and comprehensive error handling.

### Import Strategies Finalized

**Critical Architectural Decisions**:

1. **Error Handling Architecture**:
   - **HALT on failure**: Manga/Chapters import (critical sections, everything depends on them)
   - **CONTINUE on failure**: Collections, Progress, Reader Settings (log to `sectionErrors`, proceed with other sections)
   - **Within-section**: All-or-nothing transactions (one item fails → entire section fails)

2. **Conflict Resolution by Data Type**:

| Data Type         | Strategy      | On Conflict                        | Rationale                                               |
| ----------------- | ------------- | ---------------------------------- | ------------------------------------------------------- |
| Manga             | UPSERT        | Import wins                        | Backup restoration, self-healing via API on detail view |
| Chapters          | UPSERT        | Import wins                        | Same as manga, fresh data fetched from API              |
| Collections\*     | SKIP + MERGE  | Merge manga into existing          | Same name = same concept, additive is safer             |
| Progress\*        | UPSERT        | Import wins (preserve firstReadAt) | Authoritative reading history from backup               |
| Reader Settings\* | SKIP EXISTING | Current wins                       | Active user preferences take priority                   |

\*Optional sections - only imported if present in backup file (auto-detected via protobuf)

**Important Context**: These strategies only apply when sections exist in the backup. Missing sections result in no action - existing data completely preserved.

### Backend Implementation Details

**Collection ID Mapping** (Critical Fix):

- **Problem**: Import used old collection IDs from backup → FK violations
- **Solution**: Built `nameToIdMap` from existing collections

  ```typescript
  const nameToIdMap = new Map(existingCollections.map((c) => [c.name, c.id]))
  const collectionIdMap = new Map<number, number>() // oldId → newId

  // For each backup collection:
  // - Duplicate name → use existing ID (skip creation, merge manga)
  // - New name → create new, get new ID
  ```

- Lines: dexreader-import.service.ts:197-260

**Reader Settings Skip Logic**:

- Fetch all existing overrides: `getAllOverridesWithMetadata()`
- Create Set of manga IDs with existing settings
- Filter import list: only import settings for manga without overrides
- Tracks: `importedReaderOverridesCount`, `skippedReaderSettingsCount`

**Export Scope Fix** (Prerequisite from P3-T13):

- Changed from exporting only `isFavourite = true` manga
- Now exports ALL cached manga with `isFavourite` field
- Reason: Reader overrides reference ALL visited manga, not just favourites
- Prevents FK violations when optional sections included in backup

### Frontend Components

**DexReaderImportDialog** (`src/renderer/src/components/DexReaderImportDialog/`):

**Component Structure**:

- File info display with name extraction
- Sections preview (Library, Collections, Progress, Reader Settings)
- Import behavior warnings with detailed bullet points
- Error handling with display banner
- Disabled state during import operation

**Features**:

- Windows 11 Fluent Design styling matching export dialog
- Fluent UI icons: ArrowImport20Regular, Library20Regular, Folder20Regular, BookOpen20Regular, Settings20Regular, Warning20Regular
- Modal wrapper with focus trap and keyboard navigation
- State management: `isImporting`, `error`
- Auto-reset state on dialog close

**Import Behavior Warnings** (educates users):

- "Existing manga will be updated with imported data"
- "Collections with the same name will be merged"
- "Your current reader settings take priority"
- "No data will be deleted from your library"

### LibraryView Integration

**Event Listener** (lines 298-306):

```typescript
useEffect(() => {
  const removeListener = globalThis.api.onImportLibrary((filePath: string) => {
    setImportFilePath(filePath)
    setImportDialogOpen(true)
  })
  return removeListener
}, [])
```

**Import Completion Handler** (lines 530-576):

- Calls `globalThis.dexreader.importData(filePath)`
- Automatically refreshes library: `await fetchLibrary()`
- Builds multi-part success message:
  - "Imported: 15 manga, 3 collections, 42 progress entries"
  - Shows warnings for section errors if any
- Toast notifications with success/warning variants

**State Management**:

- `importDialogOpen`, `importFilePath` state variables
- Dialog close handler with cleanup

### Menu Integration

**Already Implemented** (from P3-T13 planning):

- Library → Import Library → From DexReader Backup...
- Opens file picker with `.dexreader` filter
- Sends `import-library` event with file path
- LibraryView listener handles the rest

### Technical Implementation

**Backend** (`dexreader-import.service.ts`):

- All strategies implemented (27 Jan 2026)
- Collection ID mapping with nameToIdMap
- Section-level try-catch for optional sections
- Reader settings filtering
- Result type with detailed counts and section errors

**IPC Handler** (`dexreader.handler.ts`):

- Channel: `dexreader:import-data`
- Validates `.dexreader` extension
- Wraps response with `IpcResponse<T>`
- Also has `dexreader:cancel-import` for aborting

**Preload Bridge**:

- Type: `importData: (filePath: string) => Promise<IpcResponse<DexReaderImportResult>>`
- Type exports: DexReaderImportResult with all count fields
- Invocation: `globalThis.dexreader.importData(filePath)`

**Result Type** (`import.result.ts`):

```typescript
interface DexReaderImportResult {
  importedMangaCount: number
  importedChaptersCount: number
  importedCollectionsCount: number
  importedCollectionItemsCount: number
  importedMangaProgressCount: number
  importedReaderOverridesCount: number
  skippedCollectionsCount: number
  skippedReaderSettingsCount: number
  sectionErrors: {
    collections?: string
    progress?: string
    readerSettings?: string
  }
  message?: string
}
```

### User Experience Flow

1. User: Library → Import Library → From DexReader Backup...
2. System: File picker opens (`.dexreader` files only)
3. System: Import dialog shows file info, sections list, warnings
4. User: Clicks "Import Backup"
5. System: Imports data with merge strategies
6. System: Refreshes library automatically
7. System: Shows toast with results
   - Success: "Imported: 15 manga, 3 collections, 42 progress entries"
   - With warnings: "Imported: ... Collections import had errors"

### Files Created

1. **Frontend Components** (3 files):
   - `DexReaderImportDialog.tsx` (162 lines) - Import dialog with file info and warnings
   - `DexReaderImportDialog.css` (170 lines) - Windows 11 styling matching export dialog
   - `index.ts` (1 line) - Component export

2. **LibraryView Integration**:
   - Event listener for `import-library` (9 lines)
   - Import completion handler with library refresh (47 lines)
   - State management (2 variables)
   - Dialog component rendering (6 lines)

**Total Frontend**: ~240 lines of new code

**Backend**: Already implemented in P3-T15 backend work (27 Jan 2026)

### Additional Enhancement

**collectionsStore Signature Update**:

- Changed `addToCollection()` to return `Promise<boolean>`
- Returns `true` if manga added, `false` if already in collection
- CollectionPickerDialog uses this for duplicate feedback
- Enables "Added to 2 collection(s), already in 1 collection(s)" messages

### Testing Considerations

**Manual Test Scenarios**:

- Import with all sections (collections + progress + reader settings)
- Import with partial sections (library only)
- Import duplicate manga (should skip)
- Import with existing collections (should merge)
- Import with missing collections (should create)
- Import progress for non-existent manga (should skip)
- Section errors (should continue with other sections)
- Invalid file format (should show error)
- Corrupted backup (should show error)
- Menu shortcut triggers dialog correctly
- Library refreshes after import
- Toast notifications show correct counts

### Integration with P3-T13 Export

**Complete Backup/Restore Cycle**:

1. Export from Device A with selective options
2. Transfer `.dexreader` file to Device B
3. Import on Device B with automatic section detection
4. Smart merge preserves existing data where appropriate
5. Library automatically refreshes to show imported content

**Cross-Device Scenarios**:

- Fresh install → full restore from backup
- Existing library → merge with conflict resolution
- Partial backups → only restore selected sections
- Multiple imports → additive (collections merge, manga upsert)

### Advantages of Implementation

**For Users**:

- ✅ Seamless backup/restore across devices
- ✅ Smart merge prevents data loss
- ✅ Section errors don't block entire import
- ✅ Automatic library refresh shows changes immediately
- ✅ Clear feedback about what was imported

**For Developers**:

- ✅ Section-level error handling enables graceful degradation
- ✅ Strategy pattern makes conflict resolution explicit
- ✅ Type-safe with IpcResponse wrapper
- ✅ Reuses existing repository methods
- ✅ Backend/frontend cleanly separated via IPC

### Conclusion

Native import completes the backup/restore system. Users can confidently backup their libraries with selective options, then restore on any device with intelligent merge strategies. The implementation prioritizes data safety (no deletions), user control (section-level errors), and system consistency (FK integrity maintained).

---

## P3-T13 Native DexReader Export (25 January 2026)

### Backend Audit & Fixes (10 Critical Issues)

During implementation, discovered and fixed 10 issues in export service:

1. **Typo**: `inlcludeProgress` → `includeProgress`
2. **Duplicate Block**: Removed duplicate reader settings export logic
3. **App Version**: Now reads from package.json (was hardcoded)
4. **Helper Performance**: Use raw database rows instead of mapped objects
5. **Missing Field**: Added `position` field to CollectionItemQuery
6. **New Methods**: `getLibraryMangaForExport()`, `getChaptersByMangaIds()`
7. **Query Fix**: Chapter query uses Drizzle's `inArray()` (was causing SQL errors)

### Reader Settings Consolidation (Major Architectural Fix)

**Problem Discovered**: Reader settings stored in TWO places (settings.json + database) → inconsistency risk

**Solution**:

- Database is now single source of truth for reader overrides
- Created `MangaOverride` query type with full metadata (title, coverUrl, readerSettings)
- New method: `getAllOverridesWithMetadata()` (joins manga + manga_reader_overrides)
- Settings page loads from database via IPC (replaced JSON parsing)
- Export service reads from database with complete metadata

**Impact**: Eliminated dual-source data problem preventing settings conflicts

### Protobuf Schema Renaming

- All 8 types: `Backup*` → `DexReader*` prefix
- Prevents naming conflicts with Mihon format (also uses Backup\* prefix)
- Types: DexReaderBackup, DexReaderManga, DexReaderChapter, DexReaderCollection, DexReaderCollectionItem, DexReaderMangaProgress, DexReaderChapterProgress, DexReaderMangaReaderOverride

### Export Features

- **File Format**: Protobuf proto3 + gzip → `.dexreader` extension
- **Always Included**: Library (manga + cached chapters)
- **Optional Sections**: Collections, Progress, Reader Settings (user checkboxes)
- **Dialog**: Modal with Fluent UI icons, Windows 11 styling
- **Menu**: Library → Export DexReader Backup (Ctrl+Shift+E)
- **Notifications**: Toast for success/error states

### Technical Details

**Files Created**:

- Backend: Export service, export helper, query types, repository methods
- Frontend: DexReaderExportDialog component + CSS

**Files Modified**:

- `dexreader-export.service.ts` - Fixed all 10 issues
- `reader-settings.repo.ts` - Added `getAllOverridesWithMetadata()`
- `manga.repo.ts` - Added `getLibraryMangaForExport()`
- `chapter.repo.ts` - Added `getChaptersByMangaIds()` with inArray fix
- `manga-override.query.ts` - Extended with metadata
- `manga.mapper.ts` - Added `toMangaOverrideQuery()` mapper
- `LibraryView.tsx` - Export dialog integration
- `SettingsView.tsx` - Database queries replace JSON parsing
- All protobuf type files - Renamed Backup*→ DexReader*

**Result**: Complete native export system. Database is single source of truth for settings. Import (P3-T15) ready for implementation.

---

## P3-T16 Danger Zone: Implementation Details (22 January 2026)

### Backend Service

- DestructionRepository with transaction safety
- FK constraint handling (disable → clear → enable)
- sqlite_sequence reset for auto-increment
- VACUUM for database optimization
- Dev mode handling (exit vs relaunch)

### Frontend Implementation

- Three operations: Open Settings, Reset to Default, Clear All Data
- Native Electron dialogs for confirmation
- Separate loading indicators per button
- Button variants: accent (orange) for reset, danger (red) for clear

### Post-Implementation Improvements

1. **IPC Wrapper Consistency**: Added settings.load() and settings.save() to preload
2. **IpcResponse Handling**: Fixed 10 calls to check .success and extract .data
3. **Theme Persistence Migration**: Moved from localStorage to settings.json
4. **Zustand Store Cleanup**: Removed persist middleware (redundant layer)

**Architectural Pattern Established**: All IPC calls use wrapped handlers returning IpcResponse<T>

---

## P3-T14 Mihon Export: Implementation Details (22 January 2026)

### Backend Implementation

- Protobuf encoding with mihon.proto schema
- Tag ID→name reverse mapping
- Unix timestamp format (seconds since epoch)
- Collection mapping (DexReader collections → Mihon categories)
- BigInt serialization fix (protobuf.js requires string for int64)
- Gzip compression for file size reduction

### Frontend Integration

- Toast notifications for success/failure
- Menu integration (Library → Export → To Mihon/Tachiyomi Backup)
- File save dialog with .proto.gz extension
- Duplicate toast bug fix (IPC listener cleanup)

### Technical Challenges Solved

1. **BigInt Serialization**: Changed from Number() to toString() for int64 fields
2. **Duplicate Toast Bug**: Added IPC listener cleanup on unmount
3. **Type Definitions**: Corrected MangaDemographic and PublicationStatus types
4. **Collection Mapping**: DexReader collections → Mihon categories with order field

---

## P3-T12 Mihon Import: Implementation Details (14 January 2026)

**Duration**: ~6 hours (14 January 2026)
**Status**: Complete and tested ✅

### What Was Implemented

**1. Backend Import Service** (MihonService + MihonBackupHelper):

- Protobuf parsing with `protobufjs` and gzip decompression via `pako`
- MangaDex source filtering (source ID: `2499283573021220255n`)
- Batch manga upsert with tag name→ID conversion using `TagNameToIdMap`
- Collection mapping with fallback keys for uncategorized manga
- Chapter progress import with actual reading timestamps from `BackupHistory`
- Chapter metadata import for History view (title, number, scanlationGroup)
- BigInt/Long comparison handling for protobuf source field
- Favorite field detection via `toJSON()` with `?? true` fallback
- URL-based ID extraction for manga and chapters

**2. IPC Integration**:

- `mihon:import-backup` handler with AbortController support
- `mihon:cancel-import` for cancellation
- Preload type definitions with local `ImportResult` interface
- Event system: `import-tachiyomi` triggered from File menu

**3. Frontend UI Components** (3 new components):

- **ImportProgressDialog**: Shows indeterminate progress, manga counts, cancel button
- **ImportResultDialog**: Success/warning/error states, stats cards, expandable error list
- **LibraryView integration**: Event listener, state management, ref-based double-import prevention

**4. Build Configuration**:

- Vite plugin to copy `mihon.proto` schema to build output
- Dependencies: `protobufjs@7.4.0`, `pako@2.1.0`

**5. Data Imported**:

- ✅ Manga metadata (title, author, cover, description, status, tags)
- ✅ Collections/categories (creates new collections, maps manga to them)
- ✅ Reading progress (currentPage, completed status)
- ✅ Reading history timestamps (preserves actual lastRead dates)
- ✅ Chapter metadata (title, number, scanlationGroup for History view)

### Key Technical Solutions

**Tag Conversion**:

- Created `TagNameToIdMap` from `TagList` constant (76 tag mappings)
- Supports both PascalCase ("SliceOfLife") and space-separated ("Slice of Life")
- Filters out undefined IDs with type guard

**Timestamp Handling**:

- History Map lookup: O(1) chapter URL → lastRead timestamp
- Falls back to `new Date()` if history entry missing
- Uses `unixTimestampToDate()` util for conversion

**Double-Import Prevention**:

- `useRef` for synchronous guard (not `useState` batching)
- `importingRef.current` checked/set immediately
- Prevents race conditions from rapid event firing

**Field Name Alignment**:

- Backend: `importedMangaCount`, `skippedMangaCount`, `failedMangaCount`
- Frontend interfaces updated to match
- Error field: `reason` (not `message`)

**Page Tracking**:

- Both systems use 0-based array indexing
- Direct mapping: `BackupChapter.lastPageRead` → `chapter_progress.currentPage`
- Display adds +1 for human-readable page numbers

### Files Created/Modified

**Backend**:

- `mihon.services.ts` - Main import orchestration
- `mihon-backup.helper.ts` - Business logic (4 methods)
- `mihon.handler.ts` - IPC handlers
- `import.result.ts` - Result type
- `save-progress.command.ts` - Added optional `lastReadAt` field
- `manga-progress.repo.ts` - Updated to handle timestamps
- `tag-list.constant.ts` - Complete MangaDex tag UUID list
- `mihon.proto` - Protobuf schema (copied)

**Frontend**:

- `ImportProgressDialog.tsx` (96 lines) + CSS
- `ImportResultDialog.tsx` (180 lines) + CSS
- `LibraryView.tsx` - Event integration with ref guard

**Build**:

- `electron.vite.config.ts` - Copy protobuf schema plugin

### Testing & Edge Cases

✅ **Tested Scenarios**:

- Large library import (23+ manga)
- Manga already in library (skip logic)
- Missing chapter IDs (graceful skip)
- Empty history array (falls back to now)
- Protobuf Long vs BigInt comparison
- Optional favorite field (library-only backups)
- Tag name variations (PascalCase, spaces)
- Double toast prevention (ref guard)

### Result

Complete Mihon/Tachiyomi import functionality. Users can migrate their entire library including reading progress and collections. History view shows correct chapter info and timestamps. All edge cases handled gracefully.

---

## P3-T01 Library Features: Detailed Implementation (3-5 January 2026)

### Progress Tracking Fixes = P3-T01 Foundation

**Context**: What started as "regression fixes" actually implemented significant portions of P3-T01's data layer. We completed repository expansions, IPC handlers, type definitions, and opportunistic caching.

**Issues Resolved** (9 total):

1. **Progress Display Not Refreshing** - Detail view showing stale data after returning from reader
   - **Root Cause**: React Router component caching, no dependency on navigation changes
   - **Fix**: Added useEffect watching `location.pathname` to reload progress
   - **Files**: MangaDetailView.tsx

2. **Reader Ignoring Saved Progress** - Always starting at page 0 despite saved currentPage
   - **Root Cause**: useState initialization not checking locationState
   - **Fix**: Changed to `locationState?.startPage ?? 0`, added chapter change detection with startPage/startAtLastPage handling
   - **Files**: ReaderView.tsx

3. **Chapter List Missing Progress Indicators** - No per-chapter progress display in detail view
   - **Root Cause**: Database schema incomplete (MangaProgress missing currentPage/completed), no IPC endpoint for chapter queries
   - **Fix**: Extended MangaProgress interface, created `getAllChapterProgress` IPC handler, updated ChapterList component
   - **Files**: manga-progress.query.ts, manga-progress.repo.ts, progress-tracking.handler.ts, ChapterList.tsx, MangaDetailView.tsx

4. **Network Retry Resetting Completion Status** - Completed chapters marked incomplete after retry
   - **Root Cause**: useProgressTracking re-initializing on loading/error state changes
   - **Fix**: Removed loading/error from effect dependencies, added conditional check before initial save
   - **Files**: useProgressTracking.ts

5. **History View Missing Chapter Metadata** - Showing "Ch. ?" instead of chapter numbers/titles
   - **Root Cause**: Chapter metadata not cached in database during reading
   - **Fix**: Implemented chapter caching system - saves chapter metadata when reading starts
   - **Files**: chapter.schema.ts, manga-progress.repo.ts, progress-tracking.handler.ts, ReaderView.tsx, preload files

6. **Statistics Showing Zero** - All reading stats displaying 0 despite active reading
   - **Root Cause**: Query filtering only completed chapters, incorrect page count formula
   - **Fix**: Removed `.where(eq(completed, true))` filter, changed to `SUM(currentPage + 1)`
   - **Files**: reading-stats.repo.ts

7. **History Missing Language Information** - No indication which translation was read
   - **Root Cause**: Language data not exposed in metadata, no UI component for display
   - **Fix**: Added `language?: string` to MangaProgressMetadata, created language badge with localized names
   - **Files**: manga-progress-metadata.query.ts, HistoryView.tsx, HistoryView.css

8. **TypeScript Import Error** - "Module 'src/preload' has no exported member 'ChapterProgress'"
   - **Root Cause**: Incorrect module path resolution in renderer
   - **Fix**: Changed import from 'src/preload' to relative path '../../../preload/index.d'
   - **Files**: MangaDetailView.tsx

9. **Empty State Icons Too Small** - 24px variants not visually prominent
   - **Root Cause**: Using smaller icon variants, some icon families lacking 48px versions
   - **Fix**: Upgraded to 48px variants (BookOpen48Regular, Search48Regular, Warning48Regular)
   - **Files**: LibraryView.tsx

---

## Database Migration: Detailed Implementation (December 2025)

### Phase 1: Database Infrastructure (27 December 2025)

**Duration**: ~4 hours

**What Was Done**:

- ✅ Installed Drizzle ORM + better-sqlite3
- ✅ Created database schema definitions (9 tables)
- ✅ Database connection manager with performance pragmas (WAL mode, 64MB cache, mmap)
- ✅ Migration system using Drizzle's built-in migrator
- ✅ Fixed migration SQL syntax errors (CHECK constraint, triggers)
- ✅ Configured build system to bundle migrations (Vite plugin, asarUnpack)

**Files Created**:

- `src/main/database/connection.ts` - Database manager
- `src/main/database/schema/*.schema.ts` - 9 table schemas
- `src/main/database/migrations/migrations.ts` - Migration runner
- `src/main/database/migrations/0000_first-migration.sql` - Initial schema
- `electron.vite.config.ts` - Updated with migration copy plugin

**Database Configuration**:

- Location: `AppData/dexreader.db` (dev: `./dexreader-dev.db`)
- WAL mode enabled (concurrent reads/writes)
- 64MB cache, 256MB memory-mapped I/O
- Foreign keys enforced
- Automatic statistics triggers

### Phase 2: Testing the Waters (27 December 2025)

**Duration**: ~1.5 hours

**What Was Done**:

- ✅ Added database methods to settingsManager.ts
- ✅ Verified database connection works
- ✅ Confirmed method calls reach database layer

**Current Status**:

- ⚠️ Reader override saves fail due to empty manga table (FK constraint)
- ✅ **Decision Made**: Option A - Minimal manga caching in Phase 3 (+1-2 hours)
- Rationale: Development build, get functionality working now, expand in main Phase 3

### Phase 3: Progress Migration with Lean Entities (27-28 December 2025)

**Duration**: ~8 hours

**Major Refactor Decision**:

- **Decision**: Refactor bloated `MangaProgress` entity during migration
- **Rationale**: Current entity duplicates data (title, cover, reader settings, chapter metadata). Database schema is already normalized. Better to fix now than require another refactoring pass.

**New Entity Structure**:

```typescript
// Lean (matches manga_progress table)
interface MangaProgress {
  mangaId
  lastChapterId
  firstReadAt
  lastReadAt
}

// Rich (for history view - uses JOINs)
interface MangaProgressWithMetadata {
  // Progress + metadata from manga/chapter tables
}
```

**What Was Implemented**:

- Created lean MangaProgress and ChapterProgress entities
- Created MangaProgressWithMetadata for rich queries
- Implemented MangaProgressRepository with CRUD + JOINs + statistics
- Minimal manga caching (inserts minimal records for FK constraints)
- Updated all frontend views (Store, HistoryView, MangaDetailView, ReaderView)
- Switched IPC handlers from ProgressManager to repository
- Removed old ProgressManager and progress/ folder

**CQRS-Inspired Folder Structure**:

- `database/queries/` - Query result types (read models)
- `database/commands/` - Command types (write models)
- Repository pattern for data access layer

---

## Guerilla Refactoring: Detailed Implementation (December 2025)

### Backend Refactoring (Before 22 December 2025)

**Phase 0: Settings IPC Integration**

- Created app-settings.handler.ts
- Handlers: settings:load, settings:save with validation
- Validation: Field-level (accentColor, theme) and section-level (appearance, downloads, reader)
- Impact: Frontend can no longer bypass SettingsManager

**Phase 1: main/index.ts Refactoring**

- Result: 357 lines → 78 lines (78% reduction, -279 lines)
- Files Created:
  - window.ts (46 lines) - createWindow, getMainWindow, window management
  - app-lifecycle.ts (20 lines) - setupAppLifecycle with app events
- Pattern: Extract window and lifecycle logic, keep main as orchestrator

**Phase 2: IPC Handler Organization**

- Result: 347 lines → 32 lines registry (91% reduction, -315 lines)
- Files Created (7 domain handlers):
  - app-settings.handler.ts - settings operations
  - dialogs.handler.ts - dialog operations
  - file-systems.handler.ts - filesystem operations
  - mangadex.handler.ts - MangaDex API operations
  - progress-tracking.handler.ts - progress tracking
  - reader-settings.handler.ts - per-manga settings
  - theme.handler.ts - theme operations
- Pattern: Split by domain, registry.ts becomes orchestrator calling registration functions

**Phase 3: menu.ts Refactoring**

- Files Created:
  - file.menu.ts (41 lines) - File menu
  - help.menu.ts (42 lines) - Help menu
  - library.menu.ts (130 lines) - Library menu
  - tools.menu.ts (38 lines) - Tools menu
  - view.menu.ts (57 lines) - View menu
  - menu-state.ts (9 lines) - MenuState interface
  - index.ts (21 lines) - Menu orchestrator
- Pattern: Extract by menu section, support state-based building

**Phase 4: Settings Validation**

- Created types.validator.ts (201 lines)
- Validation Types:
  - Field-level: accentColor (hex format), theme (enum)
  - Section-level: appearance, downloads, reader settings
  - Type guards: isAppearanceSettings, isDownloadsSettings, isReaderSettings
  - Enum validation: AppTheme, ReadingMode, ImageQuality
- Pattern: Comprehensive validation before any settings write

### Frontend Refactoring (22 December 2025)

**Phase 1: ReaderView Refactoring**

- Result: 2,189 lines → 753 lines (68.6% reduction, -1,436 lines)
- Components Created:
  - 8 custom hooks: useReaderSettings, usePagePairs, useReaderNavigation, useReaderKeyboard, useReaderZoom, useImagePreload, useChapterData, useProgressTracking
  - 4 display components: PageDisplay, DoublePageDisplay, VerticalScrollDisplay, EndOfChapterOverlay
- Pattern: Extract logic into hooks, extract UI into components, main file orchestrates

**Phase 2: MangaDetailView Refactoring**

- Result: 1,104 lines → 439 lines (60.2% reduction, -665 lines)
- Components Created:
  - MangaHeroSection.tsx (193 lines) - cover image, metadata, action buttons, StatusBadge, DemographicBadge
  - DescriptionSection.tsx (45 lines) - description with expand/collapse
  - ExternalLinksSection.tsx (88 lines) - external service links with confirmation
  - TagsSection.tsx (55 lines) - genre tags with navigation
  - ChapterList.tsx (288 lines) - language filter, sorting, progress tracking, ChapterItem
- Pattern: Extract sections into focused components, maintain cache and state in main file

**Phase 3: SettingsView Refactoring**

- Result: 803 lines → 448 lines (44.2% reduction, -355 lines)
- Components Created:
  - AppearanceSettings.tsx (92 lines) - theme mode, accent color picker, system color
  - ReaderSettingsSection.tsx (275 lines) - force dark mode, image quality, reading mode, per-manga overrides
  - StorageSettings.tsx (77 lines) - downloads folder location
  - AdvancedSettings.tsx (9 lines) - error log viewer wrapper
- Pattern: Extract settings sections, keep state management and handlers in main file

---

## P2-T11 Reading Modes (20 December 2025)

### Decision: System Settings Integration vs Custom Picker

**Context**: Originally planned to implement in-app date format picker with multiple format options. After analyzing codebase, determined system integration was superior solution.

### Frontend Date/Time Usage Analysis

**User-Visible Displays (3 locations)**:

1. **HistoryView** - Reading history cards:
   - Format: Relative time ("2 days ago", "3 hours ago")
   - Fallback: `toLocaleDateString()` for dates >7 days old
   - Usage: Shows when user last read manga
   - Line: HistoryView.tsx:37

2. **ChapterList** (MangaDetailView):
   - Format: `toLocaleDateString()`
   - Usage: Chapter publish dates from MangaDex
   - Visibility: Every chapter in detail view
   - Line: ChapterList.tsx:237

3. **ErrorLogViewer** (Developer tool):
   - Format: `toLocaleString()` (date + time)
   - Usage: Error log timestamps
   - Audience: Debugging, not regular users
   - Line: ErrorLogViewer.tsx:111

**Non-User-Visible**:

- connectivityStore: Internal timestamps (not displayed)
- errorHandler: ISO timestamps for logs (not displayed)
- progressStore: Unix timestamps for calculations (not displayed raw)
- collectionsStore: createdAt/updatedAt (not displayed)

### Decision Matrix

| Aspect             | Custom Picker                      | System Integration      |
| ------------------ | ---------------------------------- | ----------------------- |
| Implementation     | ~6-8 hours                         | ~1 hour                 |
| Code Maintenance   | High (format parsing, locale data) | Zero                    |
| User Benefit       | Format choice in one app           | Format works everywhere |
| System Consistency | May differ from OS                 | Perfect match           |
| Testing Burden     | All formats × all locales          | OS tested               |

**Verdict**: System integration wins on all metrics except "format flexibility within app" (which users don't need).

### Technical Implementation

**Backend** (`app-settings.handler.ts`):

```typescript
wrapIpcHandler('settings:open-system-date-settings', async () => {
  const platform = process.platform

  if (platform === 'win32') {
    await shell.openExternal('ms-settings:regionlanguage')
  } else if (platform === 'darwin') {
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.international')
  } else {
    return false // Linux: no universal way
  }
  return true
})
```

**Platform URLs**:

- Windows: `ms-settings:regionlanguage` → Settings → Time & Language → Region
- macOS: `x-apple.systempreferences:com.apple.preference.international` → System Preferences → Language & Region
- Linux: No URI scheme support, fallback alert with manual instructions

**Frontend** (`AppearanceSettings.tsx`):

- New section: "Date & Time Format"
- Explanation text: Where dates appear in app
- Button: "Configure Date Format in System Settings"
- Handler: Opens OS settings, shows alert if unsupported/failed

**Preload Bridge**:

- Type: `openSystemDateSettings: () => Promise<IpcResponse<boolean>>`
- Invocation: `globalThis.settings.openSystemDateSettings()`

### User Experience Flow

1. User opens Settings → Appearance tab
2. Sees "Date & Time Format" section below accent color
3. Reads: "DexReader uses your system's date and time format settings"
4. Clicks "Configure Date Format in System Settings"
5. Windows: Settings app opens to Region settings
6. User changes short date format (e.g., MM/dd/yyyy → dd/MM/yyyy)
7. Changes apply immediately to DexReader (browser locale API picks up change)

### Advantages of This Approach

**For Users**:

- ✅ One place to configure dates for ALL apps
- ✅ Immediate effect across system
- ✅ Familiar settings UI (OS native)
- ✅ No learning curve for format syntax

**For Developers**:

- ✅ Zero custom formatting code
- ✅ No locale data management
- ✅ No format picker UI
- ✅ No testing matrix (OS already tested)
- ✅ Perfect system consistency

**For Maintenance**:

- ✅ OS handles updates/fixes
- ✅ No breaking changes from format library upgrades
- ✅ No translation of format options
- ✅ No accessibility concerns with custom picker

### Files Modified

1. `src/main/ipc/handlers/app-settings.handler.ts` (13 lines added)
   - New IPC handler with platform detection
   - Uses `shell.openExternal()` with URI schemes
   - Returns boolean success indicator

2. `src/renderer/src/views/SettingsView/components/AppearanceSettings.tsx` (28 lines added)
   - New section after accent color
   - Handler with fallback alert for unsupported platforms
   - Explanation text about date usage in app

3. `src/preload/index.d.ts` (1 line added)
   - Type definition in Settings interface

4. `src/preload/index.ts` (1 line added)
   - Bridge method mapping to IPC channel

**Total**: ~43 lines of code vs ~500-800 lines for custom picker implementation

### Alternative Considered (Not Implemented)

**Custom Date Format Picker**:

- Format options: ISO 8601, US (MM/DD/YYYY), EU (DD/MM/YYYY), Custom
- Implementation needs:
  - Settings field for format preference
  - Utility function to format dates based on preference
  - Refactor 3 components to use utility
  - UI for format selection (dropdown or radio buttons)
  - Preview of format output
  - Format parsing/validation
  - Testing across all format options

**Why Rejected**:

- 8-10x more code
- Ongoing maintenance burden
- User confusion (two places to set dates: OS + app)
- Inconsistency with other apps
- No significant user benefit over system integration

### Conclusion

System settings integration is objectively superior for this use case. The app has minimal date displays, browser APIs already respect OS settings, and users expect consistent date formatting across applications. Custom picker would be engineering overhead without proportional user value.

---

## P1-T03 UI Component Library (25 November - 1 December 2025)

### Implementation Waves

**Steps 1-6 (25-26 November 2025)**:

- ✅ Component structure established (~3,100 lines total)
- ✅ Button, Input, MangaCard, SearchBar, Skeleton components fully implemented
- ✅ All 9 must-have components complete: Button, Input, MangaCard, SearchBar, Skeleton, Toast, ProgressBar, ProgressRing

**Steps 7-9 (26 November 2025)**:

- ✅ **Toast Component**: Notification system with 4 variants (info, success, warning, error), ToastContainer with 4 position options, useToast hook for state management, auto-dismiss (configurable 0-∞ms), slide-in animations, close button, stacking support
- ✅ **ProgressBar Component**: Linear progress with determinate/indeterminate modes, 3 sizes, 3 color variants (default/success/error), optional labels with percentage, metadata support (speed, ETA), auto-success color at 100%, smooth transitions, moving gradient animation for indeterminate
- ✅ **ProgressRing Component**: Circular SVG-based progress indicator, determinate/indeterminate modes, 3 sizes (24px/40px/64px), 3 color variants, customizable stroke width, rotation + arc animations for indeterminate, rounded stroke caps
- ~2,800 lines of TypeScript + CSS + documentation created
- Updated SettingsView with Toast/ProgressBar/ProgressRing showcase
- Fixed ProgressVariant type definition (changed from determinate/indeterminate to default/success/error)

**Steps 10-12 (1 December 2025 - Afternoon)**:

- ✅ **Modal Component**: Overlay dialog system with focus trap, keyboard navigation (Escape to close, Tab navigation), body scroll lock, click-outside-to-close, 3 sizes (small/medium/large), Windows 11 Acrylic backdrop blur, smooth fade/scale animations, header/content/footer structure
- ✅ **Select Component**: Custom dropdown with keyboard navigation (Arrow keys, Enter, Escape, Home, End), searchable mode with filtering, multi-select support with checkboxes, click-outside-to-close, disabled options support, smooth animations, Windows 11 styling
- ✅ **Checkbox Component**: Three states (checked/unchecked/indeterminate), checkmark animation with scale/fade, Windows 11 rounded style with accent color, label support, keyboard navigation (Space/Enter), group functionality with select-all pattern
- ~4,500 lines of additional TypeScript + CSS + documentation created
- SettingsView updated with Modal (3 variants), Select (basic/searchable/multi-select), Checkbox (individual + group with indeterminate) demos

**Steps 13-15 (1 December 2025 - Afternoon)**:

- ✅ **Switch Component**: Toggle switch with sliding knob animation (40×20px, 12px knob), full-width layout with right-aligned toggle, label + description support, keyboard navigation (Space/Enter), Windows 11 styling with accent colors, vertically centered knob using transform translateY(-50%)
- ✅ **Badge Component**: 5 variants (default/success/warning/error/info), 2 sizes (small 11px/medium 12px), optional icon, dot variant (6px/8px circles), pill-shaped design, high contrast support
- ✅ **Tabs Component**: Context-based architecture (Tabs/TabList/Tab/TabPanel), animated accent indicator that slides under active tab, keyboard navigation (Arrow keys/Home/End), controlled/uncontrolled modes, disabled tab support, content fade-in animation, proper ARIA attributes
- ~2,000 lines of TypeScript + CSS + documentation added
- SettingsView updated with comprehensive demos (Switch settings panel, Badge variants/sizes/dots, Tabs with 4 panels)

**Steps 16-18 (1 December 2025 - Evening)**:

- ✅ **Tooltip Component**: Hover-based information tooltips with 4 position variants (top/right/bottom/left), auto-flip near viewport edges, portal rendering to document.body, configurable delay (default 500ms), arrow pointer, fade/scale animation, Windows 11 card styling
- ✅ **Popover Component**: Contextual menus and overlays with 4 position variants, dual triggers (click/hover), click-outside-to-close, Escape key support, portal rendering, controlled/uncontrolled modes, direction-aware slide animations (200ms), focus management returns to trigger on close
- ✅ **ViewTransition Component**: Route transition animations with fade + 8px vertical slide (300ms cubic-bezier), monitors location changes via useLocation hook, two-stage animation (fade-out old, fade-in new), respects prefers-reduced-motion
- ✅ **Router Integration**: Wrapped all main routes (Browse, Library, Settings, Downloads, NotFound) with ViewTransition for seamless page transitions
- ~1,800 lines of TypeScript + CSS + documentation created
- SettingsView updated with Tooltip demos (4 positions, complex content), Popover demos (click/hover triggers, menu example)

### UI Polish Pass (1 December 2025 - Evening)

**9 Comprehensive Refinements**:

1. **SearchBar Styling Consistency**: Matched SearchBar to Input component (32px height, 2px bottom border, identical focus behavior)
2. P2-T11 Reading Modes (20 December 2025)

### Implementation Summary

- ✅ **P2-T11 COMPLETE**: Reading modes fully implemented (~6 hours, 20 Dec 2025)
- ✅ **Phase 2 COMPLETE**: All 11 tasks finished (100%) 🎉
- **Three Reading Modes Working**:
  - Single page (existing, enhanced)
  - Double page (side-by-side with RTL support)
  - Vertical scroll (webtoon style with IntersectionObserver)
- **Per-Manga Settings Override**: Each manga can save its preferred reading mode
- **Keyboard Shortcut**: Press `M` to cycle through modes
- **Responsive Design**: Double page falls back to single column on narrow screens

### Critical Bug Fixes

1. **IPC Response Wrapper Extraction**
   - **Issue**: Not accessing `.data` property from IpcResponse wrapper
   - **Fix**: Extract data from IPC responses properly

2. **RTL Page Display**
   - **Issue**: Double reversal causing wrong order
   - **Fix**: Removed double reversal logic

3. **Page Counter in RTL Mode**
   - **Issue**: Showing incorrect order
   - **Fix**: Display correct page order in RTL mode

4. **Settings Loading Race Condition**
   - **Issue**: Settings loading after images causing incorrect mode display
   - **Fix**: Settings now load BEFORE images

### Phase 2 Achievement

- Duration: 14 days (6 Dec - 20 Dec 2025)
- Tasks: 11/11 complete (100%)
- Key deliverables: MangaDex API client, search interface, detail view, online reader with streaming, zoom/pan controls, progress tracking with per-chapter data, three reading modes
- Documentation: Complete API docs, architecture docs, memory bank updates
- Production ready: Zero compilation errors, full TypeScript type safety

---

## **Focus/Hover Conflict Fix**: Added `:not(:focus-within)` to SearchBar hover state to prevent overriding focus accent border

1. **Global Focus Glow Removal**: Removed `box-shadow` and `border-color` from global `input:focus` in main.css, added `!important` rules to component styles to prevent browser defaults
2. **ViewTransition Flash Fix**: Changed from per-route wrapping to single wrapper with `key={location.pathname}`, React key-based remounting eliminates content flash
3. **Sidebar Animated Indicator**: Added sliding blue accent bar with spring animation `cubic-bezier(0.34, 1.56, 0.64, 1)`, 400ms duration, position calculated via `offsetTop/offsetHeight`
4. **Input Focus Animation Evolution**: Started with Material Design expanding line → scale(1.01) → final: simple border-bottom-color transition (200ms cubic-bezier), removed all pseudo-elements
5. **Fluent Design Over Material**: Removed Material ripple effects, adopted clean Windows 11 patterns with minimal transitions
6. **@fluentui/react-icons Integration**: Installed official Microsoft Fluent UI icon library (67 packages, ~5-6 KB for 8 icons), tree-shakeable
7. **Icon Variant Pattern**: Implemented Regular icons for inactive state, Filled icons for active navigation items (Windows 11 pattern)

**Icons Used**: Search24Regular/Filled, Library24Regular/Filled, ArrowDownload24Regular/Filled, Settings24Regular/Filled

**Additional Fixes Applied**:

- **Tabs Active Indicator**: Fixed indicator not updating on tab change by adding `activeValue` to useEffect dependency array in TabList
- **Switch Vertical Alignment**: Changed `.switch__control` from `align-items: flex-start` to `align-items: center`, removed `padding-top: 1px` from content
- **Switch Layout**: Reordered elements (content first, toggle second), added full-width layout with `justify-content: space-between` for right-aligned toggle
- **Switch Knob Centering**: Changed from `top: 2px` to `top: 50%; transform: translateY(-50%)` for perfect vertical centering
- **Select Font Weight**: Removed `font-weight: 600` from selected options to show normal weight
- **Select Arrow Positioning**: Made icon absolutely positioned for all variants (not just searchable), consistent `padding-right: 32px` on all triggers, fixed vertical centering with `top: 50%; transform: translateY(-50%)`
- **Input Focus Glow**: Added `box-shadow: none` and explicit `:focus/:focus-visible` rules to remove default browser glow, keeping only bottom border highlight

### Steps 19-20 (2 December 2025)

- ✅ **P1-T03 Step 20 completed**: Final integration, testing, and fixes
  - Added `productName: "DexReader"` to package.json for native dialog titles
  - Fixed CSP to allow HTTPS images: `img-src 'self' data: https:`
  - All components rendering correctly with no errors
  - Native dialogs showing proper app name
- ✅ **Documentation Updates**: Corrected design docs to remove sidebar collapse functionality
  - Sidebar is fixed 240px (no hamburger menu, no Ctrl+B toggle)
  - Updated wireframes.md, layout-specification.md, menu-bar-structure.md, responsive-behavior-guide.md
  - Removed "Toggle Sidebar" menu item and keyboard shortcut from docs
  - All documentation now matches actual implementation
- ✅ **P1-T03 COMPLETE**: All 17 components + 20 steps done, ~8,500 lines of code

**Total Impact**: 17 production-ready components with Windows 11 Fluent Design, comprehensive accessibility, smooth animations, full TypeScript type safety

---

## P1-T04 State Management with Zustand (2 December 2025)

- ✅ **P1-T04 COMPLETE**: Zustand state management fully implemented
  - **Duration**: 1 day (all 12 steps executed successfully)
  - **Zustand v5.0.3 installed**: Lightweight state management (~1.4kb)
  - **4 Stores Created**:
    - `appStore.ts`: Theme management with system sync, fullscreen state
    - `toastStore.ts`: Global notification system with auto-dismiss timers
    - `userPreferencesStore.ts`: All user settings with validation and persistence
    - `libraryStore.ts`: Bookmarks and collections (Phase 3 skeleton)
  - **Component Migrations**: AppShell, SettingsView, LibraryView all using Zustand
  - **Global Toast System**: Single ToastContainer in App.tsx, accessible from any view
  - **Type System Fixed**: Added 'loading' variant to ToastVariant for ProgressRing integration
  - **Documentation Created**: 900+ line state-management.md guide in docs/architecture/
  - **Memory Bank Updated**: tech-context.md and system-pattern.md include state management sections
  - **TypeScript Compilation**: All checks passing, dev server running without errors

---

## P1-T05 Filesystem Security (2-3 December 2025)

- ✅ **P1-T05 COMPLETE**: Filesystem Security fully implemented (all 9 steps + documentation)
  - **Path Validator** (`src/main/filesystem/pathValidator.ts`): Path normalization, validation against AppData + Downloads, path traversal prevention, symlink resolution
  - **Secure Filesystem** (`src/main/filesystem/secureFs.ts`): 12 operations with automatic path validation (readFile, writeFile, appendFile, copyFile, rename, mkdir, ensureDir, deleteFile, deleteDir, isExists, stat, readDir)
  - **Settings Manager** (`src/main/filesystem/settingsManager.ts`): Persists to AppData/settings.json, schema includes downloadsPath/theme/accentColor, graceful fallback to defaults
  - **IPC Handlers** (13 handlers in `src/main/index.ts`): All filesystem operations + fs:get-allowed-paths + fs:select-downloads-folder + theme:get-system-accent-color
  - **Preload API** (`src/preload/index.ts` + `index.d.ts`): window.fileSystem namespace exposed via contextBridge with full TypeScript definitions
  - **Filesystem Initialization** (`initFileSystem()` in main/index.ts): Creates AppData structure (metadata/, logs/, downloads/), loads settings, runs before window creation
  - **Settings UI** (`SettingsView.tsx`): 2 tabs (Appearance + Storage), theme selector, accent color picker (system + custom), downloads path selector with native folder picker, responsive layout for 2K monitors
  - **Accent Color System** (bonus): System color detection (Windows BGR→RGB, macOS RGB), custom hex color input, real-time system color change listener, CSS variable injection (--win-accent/-hover/-active), useAccentColor hook for app-wide initialization
  - **UI Polish**: Removed toast spam from settings, removed duplicate header, responsive layout, Fluent UI icons (replaced unicode emoji with Lightbulb16Regular), fixed accent color not applying on launch
  - **Documentation Created**: `docs/architecture/filesystem-security.md` (600+ lines with architecture diagrams, usage examples, security guarantees, troubleshooting)
  - **Memory Bank Updated**: Added Filesystem Security sections to system-pattern.md and tech-context.md with implementation details
  - All TypeScript compilation passing, manual testing complete, automated tests deferred to Phase 5
- ✅ **System Pattern Updated**: Added guideline "Always use Fluent UI icons, never unicode emoji" (rendering inconsistent across systems)
- ✅ **Bug Fixes**: Windows accent color BGR→RGB conversion, API namespace fix (electron → api), accent color initialization on app startup via useAccentColor hook
- ✅ **Phase 1 Progress**: 7 of 9 tasks complete (78%), P1-T06 and P1-T07 merged into P1-T05

---

## P2-T10 Progress Tracking: Complete Refactor (December 2025)

### Major Refactor (18 December 2025)

**Problem**: Original approach couldn't distinguish "reading last page" vs "fully complete", couldn't track multiple in-progress chapters

**Solution**: Per-chapter progress with explicit completion flag

**New Data Structure**:

```typescript
chapters: Record<string, ChapterProgress>
// with currentPage, totalPages, lastReadAt, completed flag
```

**Backend Changes**:

- ChapterProgress entity created
- MangaProgress updated to use chapters object
- Statistics calculation from per-chapter data

**Frontend Changes**:

- progressStore saveProgress rewrite
- ReaderView auto-save updates
- MangaDetailView reads from chapters object

### Bug Fixes (18 December 2025)

1. **Infinite Loop in ReaderView**
   - **Cause**: progressMap reference changes causing effect re-triggers
   - **Fix**: Proper dependency management in useEffect

2. **Menu Label Not Updating**
   - **Cause**: Menu built once on startup
   - **Fix**: "Go Incognito" / "Leave Incognito" now builds menu with correct label dynamically

3. **Missing Cover Images in HistoryView**
   - **Fix**: Added cover images with placeholder fallback

4. **Wrong Document Title**
   - **Fix**: HistoryView was showing "DexReader - DexReader"

5. **Incognito Toggle in Settings**
   - **Fix**: Removed (mode is temporary, menu-controlled only)

### UI Polish (18 December 2025)

- Incognito status bar: "**You've gone Incognito** — Progress tracking is disabled"
- Menu integration: File menu "Go Incognito" / "Leave Incognito" with Ctrl+Shift+N
- All debug logs removed from production code

---

This file serves as essential reference material for understanding past implementations. Entries are in reverse chronological order (newest first) for easy navigation. Refer to `active-context.md` for current session information and `project-progress.md` for milestone summaries.

**Phase 0: Settings IPC Integration**

- Created app-settings.handler.ts
- Handlers: settings:load, settings:save with validation
- Validation: Field-level (accentColor, theme) and section-level (appearance, downloads, reader)
- Impact: Frontend can no longer bypass SettingsManager

**Phase 1: main/index.ts Refactoring**

- Result: 357 lines → 78 lines (78% reduction, -279 lines)
- Files Created:
  - window.ts (46 lines) - createWindow, getMainWindow, window management
  - app-lifecycle.ts (20 lines) - setupAppLifecycle with app events
- Pattern: Extract window and lifecycle logic, keep main as orchestrator

**Phase 2: IPC Handler Organization**

- Result: 347 lines → 32 lines registry (91% reduction, -315 lines)
- Files Created (7 domain handlers):
  - app-settings.handler.ts - settings operations
  - dialogs.handler.ts - dialog operations
  - file-systems.handler.ts - filesystem operations
  - mangadex.handler.ts - MangaDex API operations
  - progress-tracking.handler.ts - progress tracking
  - reader-settings.handler.ts - per-manga settings
  - theme.handler.ts - theme operations
- Pattern: Split by domain, registry.ts becomes orchestrator calling registration functions

**Phase 3: menu.ts Refactoring**

- Files Created:
  - file.menu.ts (41 lines) - File menu
  - help.menu.ts (42 lines) - Help menu
  - library.menu.ts (130 lines) - Library menu
  - tools.menu.ts (38 lines) - Tools menu
  - view.menu.ts (57 lines) - View menu
  - menu-state.ts (9 lines) - MenuState interface
  - index.ts (21 lines) - Menu orchestrator
- Pattern: Extract by menu section, support state-based building

**Phase 4: Settings Validation**

- Created types.validator.ts (201 lines)
- Validation Types:
  - Field-level: accentColor (hex format), theme (enum)
  - Section-level: appearance, downloads, reader settings
  - Type guards: isAppearanceSettings, isDownloadsSettings, isReaderSettings
  - Enum validation: AppTheme, ReadingMode, ImageQuality
- Pattern: Comprehensive validation before any settings write

### Frontend Refactoring (22 December 2025)

**Phase 1: ReaderView Refactoring**

- Result: 2,189 lines → 753 lines (68.6% reduction, -1,436 lines)
- Components Created:
  - 8 custom hooks: useReaderSettings, usePagePairs, useReaderNavigation, useReaderKeyboard, useReaderZoom, useImagePreload, useChapterData, useProgressTracking
  - 4 display components: PageDisplay, DoublePageDisplay, VerticalScrollDisplay, EndOfChapterOverlay
- Pattern: Extract logic into hooks, extract UI into components, main file orchestrates

**Phase 2: MangaDetailView Refactoring**

- Result: 1,104 lines → 439 lines (60.2% reduction, -665 lines)
- Components Created:
  - MangaHeroSection.tsx (193 lines) - cover image, metadata, action buttons, StatusBadge, DemographicBadge
  - DescriptionSection.tsx (45 lines) - description with expand/collapse
  - ExternalLinksSection.tsx (88 lines) - external service links with confirmation
  - TagsSection.tsx (55 lines) - genre tags with navigation
  - ChapterList.tsx (288 lines) - language filter, sorting, progress tracking, ChapterItem
- Pattern: Extract sections into focused components, maintain cache and state in main file

**Phase 3: SettingsView Refactoring**

- Result: 803 lines → 448 lines (44.2% reduction, -355 lines)
- Components Created:
  - AppearanceSettings.tsx (92 lines) - theme mode, accent color picker, system color
  - ReaderSettingsSection.tsx (275 lines) - force dark mode, image quality, reading mode, per-manga overrides
  - StorageSettings.tsx (77 lines) - downloads folder location
  - AdvancedSettings.tsx (9 lines) - error log viewer wrapper
- Pattern: Extract settings sections, keep state management and handlers in main file

---

This file serves as essential reference material for understanding past implementations. Entries are in reverse chronological order (newest first) for easy navigation. Refer to `active-context.md` for current session information and `project-progress.md` for milestone summaries.

### Phase 1: Database Infrastructure (27 December 2025)

**Duration**: ~4 hours

**What Was Done**:

- ✅ Installed Drizzle ORM + better-sqlite3
- ✅ Created database schema definitions (9 tables)
- ✅ Database connection manager with performance pragmas (WAL mode, 64MB cache, mmap)
- ✅ Migration system using Drizzle's built-in migrator
- ✅ Fixed migration SQL syntax errors (CHECK constraint, triggers)
- ✅ Configured build system to bundle migrations (Vite plugin, asarUnpack)

**Files Created**:

- `src/main/database/connection.ts` - Database manager
- `src/main/database/schema/*.schema.ts` - 9 table schemas
- `src/main/database/migrations/migrations.ts` - Migration runner
- `src/main/database/migrations/0000_first-migration.sql` - Initial schema
- `electron.vite.config.ts` - Updated with migration copy plugin

**Database Configuration**:

- Location: `AppData/dexreader.db` (dev: `./dexreader-dev.db`)
- WAL mode enabled (concurrent reads/writes)
- 64MB cache, 256MB memory-mapped I/O
- Foreign keys enforced
- Automatic statistics triggers

### Phase 2: Testing the Waters (27 December 2025)

**Duration**: ~1.5 hours

**What Was Done**:

- ✅ Added database methods to settingsManager.ts
- ✅ Verified database connection works
- ✅ Confirmed method calls reach database layer

**Current Status**:

- ⚠️ Reader override saves fail due to empty manga table (FK constraint)
- ✅ **Decision Made**: Option A - Minimal manga caching in Phase 3 (+1-2 hours)
- Rationale: Development build, get functionality working now, expand in main Phase 3

### Phase 3: Progress Migration with Lean Entities (27-28 December 2025)

**Duration**: ~8 hours

**Major Refactor Decision**:

- **Decision**: Refactor bloated `MangaProgress` entity during migration
- **Rationale**: Current entity duplicates data (title, cover, reader settings, chapter metadata). Database schema is already normalized. Better to fix now than require another refactoring pass.

**New Entity Structure**:

```typescript
// Lean (matches manga_progress table)
interface MangaProgress {
  mangaId
  lastChapterId
  firstReadAt
  lastReadAt
}

// Rich (for history view - uses JOINs)
interface MangaProgressWithMetadata {
  // Progress + metadata from manga/chapter tables
}
```

**What Was Implemented**:

- Created lean MangaProgress and ChapterProgress entities
- Created MangaProgressWithMetadata for rich queries
- Implemented MangaProgressRepository with CRUD + JOINs + statistics
- Minimal manga caching (inserts minimal records for FK constraints)
- Updated all frontend views (Store, HistoryView, MangaDetailView, ReaderView)
- Switched IPC handlers from ProgressManager to repository
- Removed old ProgressManager and progress/ folder

**CQRS-Inspired Folder Structure**:

- `database/queries/` - Query result types (read models)
- `database/commands/` - Command types (write models)
- Repository pattern for data access layer

---

This file serves as essential reference material for understanding past implementations. Entries are in reverse chronological order (newest first) for easy navigation. Refer to `active-context.md` for current session information and `project-progress.md` for milestone summaries.

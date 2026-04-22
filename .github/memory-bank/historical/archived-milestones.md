# DexReader Archived Milestones

**Purpose**: This file contains detailed implementation notes from completed milestones in reverse chronological order (newest first). These are historical records that provide context for past decisions and serve as essential reference material.

**Last Updated**: 20 April 2026

---

## P5-T-FINAL IPC API Documentation (20 April 2026)

### Overview

**Time**: ~8 hours (vs 28-36h estimate) | **Impact**: IDE autocomplete + maintenance documentation for ~90 IPC handlers

### Architectural Decisions

- JSDoc as single source of truth (co-located with code), API reference extracts from JSDoc
- Solo dev focus: "future you" maintaining codebase, not community docs
- Standardized @param, @returns, @throws with error type documentation (TypeError/RangeError/Error)
- Real renderer code examples with actual window.api.\* calls

### Lessons Learned

- Solo project constraints enable 73% time savings via pragmatic scope reduction
- IDE autocomplete via JSDoc provides immediate developer value
- Systematic approach (simple → complex) builds momentum

### Status

✅ Complete - Production-ready for v1.0

---

## P5-T15 Accessibility Audit (9 April 2026)

### Overview

**Time**: ~5 hours | **Impact**: 100% WCAG 2.1 AA compliant, production-ready for v1.0

### Architectural Decisions

- Manual code review + grep-based pattern analysis (aria-\*, tabIndex, role=) over runtime axe-core testing
- sr-only CSS class for screen-reader-only headings (semantic structure without compromising design)
- :focus-visible standard for keyboard-only focus indicators (eliminates mouse-click outlines)

### Lessons Learned

- Early accessibility investment saved 10+ hours of remediation
- Code review more efficient than runtime testing for Electron apps
- ARIA scales naturally when built into components from the start

### Status

✅ Complete - 100% WCAG 2.1 AA compliant

---

## P5-T10 Build Optimization (3 April 2026)

### Overview

**Time**: ~3 hours | **Impact**: 55% update efficiency improvement, 1 MB installer reduction

### Architectural Decisions

- Vendor code splitting: React (555 KB), Router (44 KB), UI (51 KB) into independent chunks for update efficiency
- Update bandwidth over size: 529 KB vs 1,180 KB on app changes (55% reduction)
- Security: DevTools disabled in production with ENABLE_DEVTOOLS=1 emergency access
- Linux targets: AppImage + deb only (95% coverage)

### Lessons Learned

- Desktop apps optimize perceived performance over bundle size - lazy loading hurts UX
- Electron runtime is 90% of installer, focus on controllable: update efficiency

### Status

✅ Complete - Production-ready for v1.0

---

## P5-T08 Auto-Update System (2-3 April 2026)

### Overview

**Time**: ~11 hours | **Impact**: Production-ready seamless updates with electron-updater + GitHub Releases

### Architectural Decisions

- Manual download control: autoDownload = false by default (respects metered connections)
- Settings: Auto-check enabled, auto-download disabled (conservative)
- Non-intrusive UX: Background downloads, user chooses restart, no forced updates
- GitHub Releases as CDN: Free unlimited bandwidth, automatic latest.yml
- Startup check: 5-second delay ensures UI loaded before background check

### Lessons Learned

- electron-updater integration straightforward with 6 events
- Offline handling requires no special logic - natural failure works
- Non-intrusive design critical: user controls restart timing

### Status

✅ Complete - Production-ready (code signing deferred)

---

## P5-T06 GitHub Actions CI/CD Pipeline (31 March - 1 April 2026)

### Overview

**Time**: ~10-12 hours over 2 days | **Impact**: Fully automated build/release pipeline with multi-platform builds

### Architectural Decisions

- Branch protection: Simple two-branch model (main + feature/\*), 5 required status checks
- Pre-commit hooks (Husky + lint-staged) catch errors immediately vs 5-minute CI wait
- Unsigned builds: Deferred code signing ($200-400/year), ship with documented security warnings
- GitHub Releases as update server: Free CDN with unlimited bandwidth
- Multi-platform matrix: Parallel builds for Windows/macOS/Linux (~40-45 minutes)

### Lessons Learned

- Pre-commit hooks worth ~10 second overhead - catches errors before 5-minute CI wait
- Dependabot PRs need exemption from validation checks (lack human context)

### Status

✅ Complete - Production CI/CD pipeline operational

---

## P5-T05 UI Responsiveness: MangaCard Memoization (31 March 2026)

### Overview

**Time**: ~2 hours | **Impact**: 90% frame drop reduction (300-500ms → <100ms), smooth 60fps scrolling

### Architectural Decisions

- React.memo() over virtualization: Shallow prop comparison prevents re-renders of existing cards
- Chrome DevTools profiling: Call Tree identified 7,067ms wasted on re-rendering existing cards
- Named function pattern: memo(function MangaCard(...)) for better DevTools debugging
- Deferred phases: Virtualization, additional memoization (diminishing returns after 90% improvement)

### Lessons Learned

- Profiling-driven decisions essential - Call Tree revealed O(N²) issue immediately
- React.memo solved 90% problem in 10% time vs full virtualization
- Quadratic complexity hidden at <100 items, visible at 200-500 items

### Status

✅ Complete - 4-6 hours saved by focused optimization

---

## P5-T04 Image Loading Optimization (30 March 2026)

### Overview

**Time**: ~1 week | **Impact**: Cache hit rate 49.64% → 75%, zero evictions (was 105)

### Architectural Decisions

- Dynamic RAM-based tiers: Low (75MB), Normal (200MB), High (350MB), Custom (10-500MB, 30% ceiling)
- LRU size-based eviction with updateMaxSize() for runtime adjustments
- Dual cache: Chapter cache (user-configurable) + cover cache (20MB fixed)
- Real-time validation: Frontend shows warnings at 10% RAM threshold
- Event-driven updates: Settings save triggers cache update via IPC - no restart

### Lessons Learned

- 30MB insufficient for modern manga (10-15MB per chapter) - 200MB eliminates thrashing
- Dynamic tiers prevent one-size-fits-all issues (4GB-32GB RAM systems)
- Soft warnings (10%) + hard ceiling (30%) balances freedom with safety

### Status

✅ Complete - 92 requests, 29.53MB / 200MB usage

---

## P5-T03 Download System Performance (25 March 2026)

### Overview

**Time**: ~2.5 hours | **Impact**: 8-14x speedup - 111 pages in 3-5 seconds (was 222s sequential)

### Architectural Decisions

- Parallel page downloads: Batched Promise.all() with 5 concurrent pages per chapter
- Progress caching: 1-second TTL reduces DB queries 90% (10/sec → 1/sec)
- Batch threshold tuning: 25 items/500ms aligns with parallel throughput
- MangaDex URL caching: 5-minute TTL eliminates redundant API calls

### Lessons Learned

- Production speedup exceeded theoretical due to CDN speed, SSD I/O, bandwidth saturation
- Real-world validation > synthetic benchmarks when I/O differs
- Progress emission per batch reduces IPC overhead 80%

### Status

✅ Complete - Zero errors, smooth UI

---

## P5-T02 Memory Profiling & Leak Detection (20-23 March 2026)

### Overview

**Time**: ~12 hours | **Impact**: Fixed chapter cache leak retaining 22-23MB indefinitely, 175MB → 152MB drop validated

### Architectural Decisions

- Proactive cleanup timer: 5-minute setInterval independent of access patterns - lazy expiry never triggered post-navigation
- Worst-case retention: Cleanup interval (5 min) + TTL (15 min) = 20 min maximum
- Chrome DevTools methodology: Heap snapshot comparison with JSArrayBufferData delta tracking
- 15-minute TTL choice: Most users finish chapters in <15min, balances memory vs re-fetching
- Dual-process profiling: Renderer (DevTools F12) + Main (chrome://inspect) with separate tools

### Lessons Learned

- Lazy expiry requires proactive cleanup for infrequently-accessed data - TTL check never runs if items never accessed again
- JSArrayBufferData delta in heap snapshots identifies Buffer memory leaks effectively
- Protocol handler architecture validated: mangadex:// keeps heavy Buffers in main process, renderer stays lightweight
- Testing needs realistic timescales: 15-second test appeared broken, 20-minute test revealed expected behavior

### Status

✅ Complete - Memory stable, automatic cleanup working, 100% event listener cleanup validated

---

## TECH-DEBT-01 Batch Operations Refactoring (22 March 2026)

### Overview

**Time**: ~4 hours | **Impact**: -160 net lines, 10-50x faster Pattern A operations

### Architectural Decisions

- Dual-pattern architecture: Pattern A (inArray for bulk) vs Pattern B (executeBatchOperations for complex logic)
- Type safety via extraction: `Parameters<Parameters<DatabaseType['transaction']>[0]>[0]` for Drizzle types
- Void return handling: Generic utility supports both void and value-returning operations
- Decision matrix: If expressible as single SQL WHERE IN → inArray, otherwise → utility

### Lessons Learned

- Benchmarks need repository integration - hardcoded SQL prevents baseline comparison
- Type extraction patterns solve complex framework compatibility
- Pattern recognition upfront prevents premature abstraction

### Status

✅ Complete - 7 methods refactored

---

## P5-T01 Database Query Optimization (19 March 2026)

### Overview

**Time**: ~6 hours | **Impact**: All queries 0.32-5.97ms (88-99% faster than thresholds), 100% index usage, Phase 2 skipped

### Architectural Decisions

- One-time validation philosophy: Tools available on-demand (major releases, refactoring) rather than CI/CD integration
- Accuracy-first benchmarking: Complete rewrite mid-project after discovering 80% complexity gap - now match repository JOINs exactly
- Electron runtime compatibility: ELECTRON_RUN_AS_NODE=1 wrappers for better-sqlite3 native module
- Lazy loading pattern: Deferred app.getPath() until first use avoids app.isReady() timing issues

### Lessons Learned

- Benchmark accuracy critical - must match production complexity, not simplified approximations
- One-off validation appropriate for databases - better as on-demand tools than CI/CD automation due to maintenance drift
- Native module testing requires same runtime as production (Electron vs Node.js) for accurate characteristics

### Status

✅ Complete - 100% index usage validated, Phase 2 optimization skipped

---

## P5-T21 Frontend Refactoring (12-17 March 2026)

### Overview

**Time**: ~24 hours over 5 days | **Impact**: Component complexity reduced 56%, WCAG 2.1 AA compliance, 100+ utility classes

### Architectural Decisions

- Utility-first CSS strategy: 100+ utility classes using design tokens (--space-_, --color-_) eliminated 135 duplicate flexbox patterns
- Component extraction pattern: Extract when >400 lines or reused 2+ times (EmptyState/LoadingState/ErrorState/ReadingHistoryCard)
- Batch processing: Organized CSS deduplication into 9 logical batches (Settings, Dialogs, Forms) - CSS removal → TSX utility addition → validation
- Accessibility-first: Added descriptive aria-labels with contextual info, aria-expanded for toggles - WCAG 2.1 AA from start

### Lessons Learned

- Batch processing (10-20 patterns) reduces cognitive load vs massive all-at-once changes
- CSS-first approach simplifies rollback - structural changes safer than application changes
- Early accessibility investment reduces later remediation
- Utility classes as single source of truth prevent duplicate patterns

### Status

✅ Complete - LibraryView -58%, DownloadsView -85%, inline styles -81%

---

## Electron 41 Upgrade (15 March 2026)

### Overview

**Time**: ~6 hours | **Impact**: Security patched, Electron 38.1.2 → 41.0.2 (3 major versions), all features verified

### Architectural Decisions

- Direct upgrade path: Skipped 39 and 40 - small gap, standard architecture, time constraints reduced risk
- Accent color API format change: Updated theme.ts parsing - Electron 41 returns RRGGBBAA vs old BBGGRRAA (BGR), removed R/B swap
- System call caching: Implemented cachedAccentColor - getSystemAccentColor() called 3× on startup, now cached with theme invalidation
- Protocol handlers stable: mangadex:// and local-manga:// worked without changes

### Lessons Learned

- Direct multi-version upgrades viable for standard architectures when time-constrained
- better-sqlite3 auto-rebuild handled native module on first attempt
- Electron API format changes can be subtle - accent color variant differs from Windows Settings UI

### Status

✅ Complete - better-sqlite3 12.5.0 → 12.8.0 auto-rebuilt

---

## P4-T15 Cache Management UI (10 March 2026)

### Overview

**Time**: ~8 hours | **Impact**: Two-tier metadata cleanup, cover cache limits, EPERM bug fixed

### Architectural Decisions

- Two-tier metadata cleanup: Gentle (90+ days) vs Aggressive (immediate) for granular control
- Single optimized stats query: One JOIN with aggregates prevents inconsistency, sub-10ms with 1000+ manga
- Cover cache limit UI: Dropdown (10MB-500MB/Unlimited) with real-time feedback
- Protected data labeling: Icons show library/downloads safe, notExists subquery guarantees protection
- Full path display: Absolute cache paths with word-break CSS for troubleshooting

### Lessons Learned

- .gitkeep file broke deletion (EPERM) - verify file type before operations, use fs.rm({recursive: true})
- notExists subquery prioritizes correctness over performance for data safety
- VACUUM UI deferred - can't show space savings without running first, requires 2x DB size temp space
- Event-driven updates essential for real-time UI vs polling

### Status

✅ Complete - Phase 4: 13/13 tasks (100%)

---

## P4-T14 DownloadsView Backend Integration (23 February 2026)

### Overview

Integrated real download backend with DownloadsView. **Time**: ~6-8 hours | **Impact**: Fully functional downloads management UI with queue control

### Architectural Decisions

- **Event-Driven Updates**: DownloadsView subscribes to queue:changed events - automatic re-fetch prevents stale data
- **Batch Operations**: IPC handlers accept ID arrays - single call for multi-select actions, transaction-wrapped
- **State-Based Visibility**: Conditional rendering based on status prevents invalid operations
- **Optimistic UI Updates**: Frontend updates immediately, reverts on error

### Lessons Learned

- Event subscriptions essential for real-time UI vs polling
- Batch operations reduce IPC overhead dramatically (10 calls → 1 array call)
- State-based visibility prevents user errors
- useEffect cleanup prevents memory leaks

### Status

✅ Complete - Real-time downloads UI operational

---

## P4-T06 Download UI Integration (21 February 2026)

### Overview

Download UI with three components (StreamSourceIndicator, DownloadStatusBadge, DownloadConfirmationDialog). **Time**: ~8 hours | **Impact**: Production-ready offline reading system

### Architectural Decisions

- **Passive Reader Indicator**: Globe/disk icon informational only - no mid-chapter download disruption
- **Unified Confirmation Dialog**: Single dialog for single/batch with quality dropdown
- **Chapter List Primary Interface**: All download interactions from chapter lists, natural context
- **Batch Status Loading**: Promise.all() checks all chapters in parallel, <100ms for 50 chapters

### Lessons Learned

- Passive UI prevents cluttering primary actions
- Status batching eliminates waterfall effect with 50+ chapters
- Format mapping (kebab-case ↔ enum) prevents subtle bugs
- Event propagation control prevents unintended navigation

### Status

✅ Complete - Download system fully operational

### Strategic Decisions

**Passive Reader Indicator (Not Action Button)**: Made deliberate choice for ReaderView to show stream source as informational only:

- **Rationale**: Reader is for reading, not managing downloads. Downloading mid-chapter would disrupt reading flow and potentially break page loading. Chapter management (download/delete) belongs in chapter list context.
- **Implementation**: StreamSourceIndicator shows globe (online) or disk (local) icon with fade-in animation and aria-label
- **User Benefit**: Clear visibility of content source without action temptation

**Unified Confirmation Dialog**: Single dialog handles both single and batch downloads with quality dropdown always visible:

- **Rationale**: Consistent UX regardless of download quantity, reduces code duplication, simplifies state management
- **Implementation**: Dialog shows chapter count/title, quality selection, download path, and Settings link
- **Settings Integration**: Respects `shouldAskForQuality` toggle - if false, uses `defaultQuality` and skips dialog for single downloads

**Chapter List as Primary Interface**: All download interactions happen from chapter lists in MangaDetailView:

- **Rationale**: Manga detail view is natural context for managing chapters (read, favorite, download). Keeps download UI close to content decision point.
- **Implementation**: DownloadStatusBadge next to publish date shows status and handles clicks
- **Deferred**: Batch download UI (multi-select checkboxes) to Phase 4 polish or Phase 5

**Settings-Driven Behavior**: Download quality defaults and confirmation preferences controlled in Settings:

- **Implementation**: Loads from settings.json on dialog open, applies `defaultQuality` immediately if `shouldAskForQuality` is false
- **User Control**: Users can toggle quality confirmation via Settings > Downloads > "Ask for quality before downloading"

### Component Architecture

**1. StreamSourceIndicator Component** (Passive Info Display)

**Location**: `src/renderer/src/components/StreamSourceIndicator/`

**Files**:

- `StreamSourceIndicator.tsx` (55 lines) - React component with conditional icon rendering
- `StreamSourceIndicator.css` (40 lines) - Windows 11 styling with fade-in animation
- `index.ts` (2 lines) - Barrel export

**Props Interface**: Component accepts a simple source prop ('local' | 'online') to determine which icon to display.

**Features**:

- **Icon Display**: Globe20Regular (online) or HardDrive20Regular (local) from @fluentui/react-icons
- **Animation**: 400ms fade-in with cubic-bezier easing (0.25, 0.46, 0.45, 0.94)
- **Accessibility**: aria-label "Reading from online source" or "Reading from local download"
- **Styling**: Windows 11 design tokens, neutral foreground, 20px icon size, flex container

**Usage in ReaderView**: ReaderView maintains streamSource state (default 'online'). useEffect checks download status on mount and chapter changes, updating source to 'local' for completed downloads. StreamSourceIndicator component renders in header.

**Design Choice**: No tooltip on hover to avoid UI clutter. Icon + aria-label sufficient for clarity.

---

**2. DownloadStatusBadge Component** (Status Display + Action Button)

**Location**: `src/renderer/src/components/DownloadStatusBadge/`

**Files**:

- `DownloadStatusBadge.tsx` (120 lines) - React component with 5 state variants
- `DownloadStatusBadge.css` (180 lines) - State-specific styling with animations
- `index.ts` (3 lines) - Barrel export with DownloadStatus type

**Props Interface**: Component accepts DownloadStatus enum ('not-downloaded' | 'queued' | 'downloading' | 'downloaded' | 'failed'), optional progress object with currentPage/totalPages, optional onClick handler, and isClickable boolean flag.

**5 Status States**:

1. **not-downloaded**: ArrowDownload16Regular icon with "Download" text (accent color, clickable)
2. **queued**: CircleHint16Regular icon with "Queued" text (neutral color, not clickable)
3. **downloading**: Spinner16Regular icon with progress "X/Y pages" (accent color, not clickable, spinning animation)
4. **downloaded**: Checkmark16Regular icon with "Downloaded" text (success green, not clickable)
5. **failed**: ErrorCircle16Regular icon with "Failed" text (error red, clickable to retry)

**Features**:

- **Conditional Clickability**: Only clickable when status is 'not-downloaded' or 'failed'
- **Progress Display**: Shows "X/Y pages" when downloading with current progress
- **Spinner Animation**: 1-second continuous rotation for "downloading" state
- **Accessibility**: aria-label describes full state, role="button" when clickable
- **Event Handling**: onClick uses stopPropagation() to prevent chapter list row navigation

**Usage in ChapterList**: ChapterList maintains downloadStatusMap state as Map. useEffect loads statuses for all visible chapters using Promise.all() for parallel checking, storing results in Map for O(1) lookup. Badge renders with status from map, handling click events.

**Design Choice**: Badge integrated into chapter item meta section (between page progress and publish date) for natural information hierarchy.

---

**3. DownloadConfirmationDialog Component** (Unified Quality Selection Modal)

**Location**: `src/renderer/src/components/DownloadConfirmationDialog/`

**Files**:

- `DownloadConfirmationDialog.tsx` (230 lines) - React component with Modal wrapper
- `DownloadConfirmationDialog.css` (250 lines) - Windows 11 dialog styling
- `index.ts` (2 lines) - Barrel export

**Props Interface**: Dialog accepts isOpen state, onClose/onConfirm callbacks, chapterCount, optional chapterInfo object with title/number, and downloadPath string for display.

**Features**:

- **Chapter Info Display**: Shows single chapter title/number or count for batch downloads
- **Quality Dropdown**: Select component with 2 options (High Quality/Data Saver) always visible
- **Download Location**: Displays full path with Settings link for changing location
- **Batch Warning**: Info message for multi-chapter downloads explaining behavior
- **Modal Integration**: Uses existing Modal component with medium size, focus trap, ESC to close
- **Settings Integration**: Loads `defaultQuality` on mount, applies to Select component

**Quality Options**:

- **High Quality** (`data`): Higher resolution, larger file size
- **Data Saver** (`data-saver`): Compressed images, smaller file size

**Frontend → Backend Mapping**:

- Frontend format: `'high-quality' | 'data-saver'` (kebab-case for HTML consistency)
- Backend: `ImageQuality.Data | ImageQuality.DataSaver` (TypeScript enum)
- Conversion: MangaDetailView maps before calling `window.downloads.addToQueue()`

**Usage in MangaDetailView**: MangaDetailView maintains dialog state and selected chapters. handleDownloadClick adds chapter to selection and opens dialog. handleConfirm maps quality to backend enum, iterates through selected chapters adding each to queue via IPC, then closes dialog and shows success toast. Dialog component renders with all required props.

**Design Choice**: Single dialog for both single and batch downloads keeps UX consistent and reduces component proliferation.

---

### Integration Points

**1. MangaDetailView → ChapterList Integration**

**Files Modified**: `src/renderer/src/views/MangaDetailView/components/ChapterList.tsx`

**Changes** (~150 lines added):

1. Import new components: DownloadStatusBadge, DownloadConfirmationDialog
2. Add state: `downloadStatusMap: Map<string, DownloadStatus>`, `dialogOpen`, `selectedChapter`, `downloadsPath`
3. Load download statuses on mount: Batch `isDownloaded()` calls for all visible chapters with Promise.all()
4. Load settings: `getSettings()` for download path and quality preferences
5. Handle badge click: Sets selected chapter, opens confirmation dialog
6. Handle dialog confirm: Maps quality format, calls `addToQueue()`, shows toast, closes dialog
7. Render badge: Added to chapter item JSX between progress and publish date

**Status Mapping Logic**: Simple switch-case mapper converts database DownloadStatusEnum values to badge-compatible strings (Queued→'queued', Downloading→'downloading', Completed→'downloaded', Failed→'failed', default→'not-downloaded').

**Performance**: Status checks batched using `Promise.all()` to avoid waterfall requests. Results stored in Map for O(1) lookup during rendering.

---

**2. ReaderView → StreamSourceIndicator Integration**

**Files Modified**: `src/renderer/src/views/ReaderView/ReaderView.tsx`

**Changes** (~50 lines added):

1. Import StreamSourceIndicator component and StreamSource type
2. Add state: `streamSource: StreamSource` (default 'online')
3. Check download status on mount and chapter change: useEffect hook checks download status via IPC, setting stream source to 'local' if status is 'completed', otherwise 'online'. Effect runs on chapterId changes.

4. Render indicator: Added to reader header next to chapter title and navigation controls

**Dynamic Behavior**: Indicator updates automatically when user navigates between chapters, showing correct source based on download status. No manual refresh needed.

---

### IPC Integration

**Handlers Used**:

1. **`download:is-downloaded`** - Check if chapter is downloaded (returns ChapterDownloadQuery | undefined)
2. **`download:add-to-queue`** - Add single chapter to download queue
3. **`download:get-download`** - Get download record with progress (for future enhancements)
4. **`settings:load`** - Load download path and quality preferences
5. **`settings:save`** - Save quality preferences (not used in P4-T06, ready for settings page)

**Type Safety**: All IPC calls use IpcResponse<T> wrapper, checked with `.success` before accessing `.data`

**Error Handling**: Failed IPC calls gracefully fall back to default states (e.g., 'not-downloaded' if status check fails)

---

### Settings Integration

**Download Settings Used**: DownloadsSettings interface includes downloadsPath (nullable), defaultQuality (ImageQuality enum), shouldAskForQuality (boolean), and maxConcurrentDownloads (number, used by queue manager).

**Loading Pattern**: Async function loads settings via IPC, extracting download path with fallback to 'Default location', and quality/confirmation preferences from response data.

**Future Enhancement**: Add toggle in Settings > Downloads to control `shouldAskForQuality`. Currently always shows dialog for UX clarity.

---

### Quality Format Mapping

**Frontend Format** (kebab-case for HTML/CSS consistency):

- `'high-quality'` - High resolution images
- `'data-saver'` - Compressed images

**Backend Format** (TypeScript enum):

- `ImageQuality.Data` - enum value 'data'
- `ImageQuality.DataSaver` - enum value 'data-saver'

**Conversion Logic**: Simple mapping functions convert between frontend kebab-case strings and backend ImageQuality enum. Frontend-to-backend maps 'high-quality'→ImageQuality.Data and 'data-saver'→ImageQuality.DataSaver. Backend-to-frontend reverses the mapping.

**Rationale**: Separate formats maintain consistency with each layer's conventions (HTML attributes vs TypeScript enums).

---

### User Experience Flow

**Single Chapter Download**:

1. User navigates to MangaDetailView, sees chapter list
2. Notices DownloadStatusBadge showing "Download" next to desired chapter
3. Clicks badge, DownloadConfirmationDialog opens
4. Selects quality (High Quality or Data Saver)
5. Clicks "Download", chapter added to queue
6. Badge updates to "Queued", then "Downloading" with progress
7. Upon completion, badge shows "Downloaded" with checkmark
8. User can now read chapter offline, ReaderView shows disk icon

**Batch Download** (deferred to Phase 4 polish):

- Multi-select checkboxes in chapter list
- "Download Selected" button opens dialog with count
- Same confirmation flow, adds all to queue

**Reader Experience**:

- StreamSourceIndicator always visible in header
- Updates automatically on chapter navigation
- No interaction needed, purely informational

---

### Files Created

**Components** (9 new files, ~670 lines):

1. `src/renderer/src/components/StreamSourceIndicator/StreamSourceIndicator.tsx` (55 lines)
2. `src/renderer/src/components/StreamSourceIndicator/StreamSourceIndicator.css` (40 lines)
3. `src/renderer/src/components/StreamSourceIndicator/index.ts` (2 lines)
4. `src/renderer/src/components/DownloadStatusBadge/DownloadStatusBadge.tsx` (120 lines)
5. `src/renderer/src/components/DownloadStatusBadge/DownloadStatusBadge.css` (180 lines)
6. `src/renderer/src/components/DownloadStatusBadge/index.ts` (3 lines)
7. `src/renderer/src/components/DownloadConfirmationDialog/DownloadConfirmationDialog.tsx` (230 lines)
8. `src/renderer/src/components/DownloadConfirmationDialog/DownloadConfirmationDialog.css` (250 lines)
9. `src/renderer/src/components/DownloadConfirmationDialog/index.ts` (2 lines)

**Modified Files** (2 files, ~200 lines changes):

1. `src/renderer/src/views/MangaDetailView/components/ChapterList.tsx` (~150 lines added)
2. `src/renderer/src/views/ReaderView/ReaderView.tsx` (~50 lines added)

**Total New Code**: ~870 lines (components + integration)

---

### Design System Compliance

**Windows 11 Design Tokens Used**:

- `--win-bg-card`: Card backgrounds
- `--win-fg-primary`: Primary text
- `--win-fg-secondary`: Secondary text
- `--win-accent`: Accent color for interactive elements
- `--win-accent-hover`: Hover states
- `--win-success`: Success state (downloaded)
- `--win-error`: Error state (failed)
- `--win-border-radius`: 4px border radius
- `--win-shadow-card`: Card shadow elevation

**Fluent UI Icons**:

- ArrowDownload16Regular/20Regular - Download action
- HardDrive20Regular - Local storage
- Globe20Regular - Online source
- CircleHint16Regular - Queued state
- Spinner16Regular - Downloading state
- Checkmark16Regular - Downloaded state
- ErrorCircle16Regular - Failed state

**Accessibility**:

- ARIA labels on all status badges
- Role="button" when clickable
- Keyboard navigation (Enter/Space on download badge)
- Focus visible indicators
- Color contrast meets WCAG AA (verified in P3-T18)
- Status batching with Promise.all() for <100ms load time

### Lessons Learned

- Passive indicators (StreamSourceIndicator) avoid disrupting primary actions
- Unified dialog components reduce code duplication and ensure consistent UX
- Status batching essential to prevent waterfall effects with 50+ chapters
- Event propagation control (stopPropagation) prevents unintended navigation

### Status

✅ Complete - End-to-end download system operational

---

## P4-T02 Download Queue Manager (18 February 2026)

### Overview

**Time**: ~6 hours | **Impact**: Concurrent orchestration, 6 critical issues fixed in audit

### Architectural Decisions

- Fresh settings reads: Read maxConcurrentDownloads every processQueue() call - simpler than cache invalidation
- No queue persistence: Queue cleared on restart, auto-resume from database - database is source of truth
- Silent retries: Only notify after permanent failure (3 attempts) - exponential backoff (5s/15s/45s)
- FIFO queue: Simple ordering without priority system

### Lessons Learned

- Fresh reads simpler than cache invalidation for low-frequency operations
- Database as source of truth enables self-healing on crashes
- Silent retries reduce notification noise
- Batch operations matter - 10x reduction in database writes
- Comprehensive audits catch runtime failures

### Status

✅ Complete - Production-ready queue manager operational

---

## P4-T01 Download System Backend (12 February 2026)

### Overview

**Time**: ~6 hours | **Impact**: 4 critical issues fixed in audit, dual protocol architecture

### Architectural Decisions

- Dual protocol architecture: local-manga:// for downloaded, mangadex:// for online - frontend decides based on status
- Path resilience: downloadsBasePath + filePath tracked per-chapter handles directory changes
- Defer frontend: Avoid blind frontend, enable proper UX design with full stack testing
- Protocol handler: Uses stored base path from database, not current settings

### Lessons Learned

- File naming critical - page number parameter prevents overwriting
- IPC handler registration must be explicit - implemented handlers won't work if not registered
- Database cleanup essential - delete operations must remove DB records

### Status

✅ Complete - Backend ready, all components functional via IPC

---

currentPage: number
totalPages: number
percentage: number
bytesDownloaded: number
status: 'downloading' | 'completed'
}

### Local Image Protocol Handler

**File**: `src/main/api/localImageProxy.ts`

**Protocol**: `local-manga://chapter/{chapterId}/page/{pageNum}`

**Implementation**: Protocol handler registered for 'local-manga' scheme, parsing URL to extract chapterId and pageNum. Fetches download record from database, constructs page path using stored downloadsBasePath (not current settings), reads file via secureFs, returns Response with JPEG content-type. Returns 404 if chapter not found or not completed.

**Key Points**:

- Uses `download.downloadsBasePath` from database (not `getConfiguredDownloadsPath()`)
- Ensures files load from original location even if settings change
- Returns 404 if chapter not found or status not 'completed'
- Registered in `src/main/index.ts` alongside `mangadex://` protocol

### File Naming Fix

**Critical Issue Found**: Original `downloadData()` helper saved all pages as `page.jpg`, overwriting each other.

**Fix Applied**: Added pageNumber parameter to downloadData() helper function. File name now constructed with zero-padded 3-digit format (001.jpg, 002.jpg, etc.). Caller passes 1-indexed page number (index + 1).

**Result**: Files saved as `001.jpg`, `002.jpg`, etc. matching protocol expectations.

### IPC Integration

**Handlers Registered** (`src/main/ipc/handlers/download.handler.ts`):

1. `downloads:download-chapter` - Start download
2. `downloads:delete-chapter` - Remove download
3. `download:get-all-downloads` - List all downloads
4. `download:get-download` - Get single download info
5. `download:is-downloaded` - Quick status check

**Critical Fix**: Handlers were implemented but NOT registered in registry.ts. Fixed by importing registerDownloadHandlers and calling it in registerAllHandlers() function.

**Preload Bridge**: Downloads object exposes five methods via ipcRenderer.invoke, each returning Promise of IpcResponse wrapper type.

### Comprehensive Backend Audit

Conducted full audit against P4-T01 plan specifications. **4 critical/high issues found and fixed**:

1. **❌ IPC Handlers Not Registered** (CRITICAL) - Fixed by adding to `registry.ts`
2. **❌ File Naming Broken** (HIGH) - Fixed by adding page number parameter
3. **❌ Missing Database Cleanup** (MEDIUM) - Fixed `deleteChapter()` to remove DB record
4. **❌ Path Structure Incomplete** (MEDIUM) - Fixed to use proper relative paths

### Files Created/Modified

**Database**:

- `schema/chapter-downloads.schema.ts` - Table definition
- `migrations/0002_add_newcolumntochapterdownload.sql` - Migration
- `commands/chapter-downloads/create-download.command.ts` - Command interface
- `queries/chapter-downloads/chapter-downloads.query.ts` - Query interface
- `mappers/chapter-downloads.mapper.ts` - Row to query mapping
- `repository/chapter-downloads.repo.ts` - CRUD operations
- `enums/download-status.enum.ts` - Status enum

**Services**:

- `services/download.service.ts` - Core download logic
- `services/helpers/dexreader-download.helper.ts` - Page download helper (fixed)
- `services/options/download-chapter.option.ts` - Download parameters
- `services/results/dexreader/download-chapter.result.ts` - Result type
- `services/events/chapter-downloads.event.ts` - Progress event type

**Protocol**:

- `api/localImageProxy.ts` - Local image protocol handler

**IPC**:

- `ipc/handlers/download.handler.ts` - Download IPC handlers
- `ipc/registry.ts` - Added registration (FIXED)

**Preload**:

- `preload/index.ts` - Added downloads bridge
- `preload/index.d.ts` - Added Downloads interface

### Remaining TODO for P4-T06

**Frontend Integration** (when P4-T06 starts):

1. Add download button to reader toolbar
2. Modify useChapterData.ts to check download status and select protocol: Check download status via IPC, determine if completed. Map image URLs to use local-manga:// protocol for downloaded chapters with page numbers, or mangadex:// protocol for online chapters.

3. Add download status badges/indicators
4. Listen to `download:chapter-progress` events for progress UI
5. Create downloads management view

### Testing Notes

**Manual Testing Required** (P4-T06):

- Download single chapter via IPC console
- Verify directory structure created correctly
- Check database records created/updated
- Verify local protocol loads images correctly
- Test download failure handling
- Test delete functionality

**Cannot test yet**: No UI to trigger downloads, reader doesn't check download status. All testing must wait for P4-T06.

---

## P3-T18 Accessibility Improvements (30 January 2026)

### Overview

WCAG 2.1 Level AA compliance achieved with Lighthouse 12.8.1. **Time**: ~2 hours | **Impact**: Light 91%→100%, Dark 96%→100%, theme persistence bug fixed

### Architectural Decisions

- **Theme Loading Order**: Load user preferences before system sync prevents flashing/incorrect initial state
- **Color Contrast Fix**: Darkened completed badge #0078d4→0005a9e (3.8:1→5.1:1 ratio)
- **Semantic Structure**: Sr-only h1 headings for all views enable screen reader navigation
- **Pragmatic Alt Text**: "Page X of Y" acknowledges manga's visual nature, provides positional context

### Lessons Learned

- Dark theme naturally provides better contrast ratios
- Global accessibility utilities (.sr-only) belong in global stylesheets
- Honest alt text compliant - WCAG doesn't require describing indescribable content
- Incremental approach with Lighthouse provides clear actionable feedback

### Status

✅ Complete - 100% Lighthouse scores both themes, WCAG 2.1 AA compliant

**Solution**: Added theme preference loading to AppShell useEffect - loads settings asynchronously, applies saved theme preference first, then syncs with system if needed.

**Impact**: Theme preference now loads before system sync, ensuring forced dark mode applies immediately on startup.

### Color Contrast Fixes

**Issue Identified**: "Completed" status badge on manga cards failed WCAG AA contrast requirement in light theme.

**Measurement**:

- Original color: `#0078d4` (Microsoft Blue)
- Contrast ratio: 3.8:1 on white background
- WCAG AA requirement: 4.5:1 for normal text

**Solution**: Darkened badge color to #005a9e for completed status in MangaCard.css, achieving compliance.

**Result**: Contrast ratio 5.1:1 - exceeds WCAG AA requirement

**Note**: Skeleton loading cards flagged by Lighthouse were false positives - already marked `aria-hidden="true"` as decorative elements.

### HTML Lang Attribute

**Issue**: Root HTML element missing `lang` attribute, preventing screen readers from selecting correct language pronunciation rules.

**Fix**: Added lang="en" attribute to html element in renderer/index.html.

**Impact**: Screen readers now correctly identify content as English and apply appropriate pronunciation.

### Semantic Structure Improvements

**Screen Reader Navigation**: Implemented visually-hidden h1 headings for all major application views to provide clear semantic structure.

**Implementation Pattern**: Added visually-hidden h1 elements with className="sr-only" to all major views (LibraryView, BrowseView, SettingsView, HistoryView) providing semantic structure for screen readers.

**Views Enhanced**:

- LibraryView: "Library"
- BrowseView: "Browse Manga"
- SettingsView: "Settings"
- HistoryView: "Reading History"

**Sr-only Utility Class**: Consolidated single global definition in main.css using standard pattern - absolute positioning with 1px dimensions, hidden overflow, clipping, and zero border.

**Cleanup**: Removed duplicate .sr-only definition from Skeleton.css

### Live Regions for Dynamic Content

**Purpose**: Announce dynamic content changes to screen reader users without interrupting their current focus.

**Implementation**:

1. **LibraryView - Manga Count Announcements**: Live region div with aria-live="polite" and aria-atomic="true" announces filtered manga count. Updates when filtering/sorting changes.

2. **BrowseView - Search Results Feedback**: Live region conditionally displays "Searching for manga...", result count with scroll hint, or "No results found" message based on search state.

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

**Implementation**: All reader display components (PageDisplay for single page, DoublePageDisplay for two-page spread, VerticalScrollDisplay for vertical scroll) use template pattern \"Page ${index} of ${total}\" for img alt attributes, providing positional context without attempting to describe visual manga content.

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

**Root Cause**: Export service was assigning empty arrays to optional fields even when no data existed, causing protobuf to serialize them as empty objects.

**Solution**: Only assign optional fields when actual data exists - check collection list/items length before assignment.

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
- Created conditional path display section showing export destination with icon and path details when savePath is provided
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

## P3-T17 Date Format Preferences (29 January 2026)

### Overview

System settings integration for date formats. **Time**: ~1 hour | **Impact**: 43 lines vs 500-800 for custom picker

### Architectural Decisions

- **System Integration Over Custom Picker**: Platform URIs (ms-settings:regionlanguage, x-apple.systempreferences) vs custom format UI
- **Browser Locale API**: toLocaleDateString() automatically respects OS settings
- **Zero Maintenance**: OS handles updates, fixes, translations
- **Universal Application**: One setting affects all apps systemwide

### Lessons Learned

- System integration objectively superior for minimal date displays
- Custom picker would be 8-10x more code with ongoing maintenance burden
- Users expect consistent date formatting across applications
- Browser APIs already respect OS settings

### Status

✅ Complete - System integration working all platforms except Linux (manual instructions)

### Technical Implementation

**Backend**: IPC handler wraps platform detection, using shell.openExternal with platform-specific URI schemes. Returns boolean success indicator (false for Linux/unsupported platforms).

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

## P3-T15 Native DexReader Import (29 January 2026)

### Overview

**Time**: Backend ~6 hours, Frontend ~4 hours | **Impact**: Complete backup/restore cycle with smart merge

### Architectural Decisions

- Error handling: HALT on manga/chapters (critical), CONTINUE on collections/progress/settings (log errors)
- Conflict resolution: Manga UPSERT (import wins), Collections SKIP+MERGE (additive), Progress UPSERT (preserve firstReadAt), Reader Settings SKIP EXISTING
- Collection ID mapping: nameToIdMap prevents FK violations - duplicates merge, new creates
- Section detection: Protobuf optional fields auto-detect what to import

### Lessons Learned

- Section-level error handling enables graceful degradation
- nameToIdMap pattern critical for ID remapping across databases
- Strategy pattern makes conflict resolution explicit

### Status

✅ Complete - Smart merge, automatic library refresh, clear feedback

---

## P3-T13 Native DexReader Export (25 January 2026)

### Overview

Native protobuf backup system with selective export. **Time**: Backend ~6 hours (10 issues fixed), Frontend ~4 hours | **Impact**: Complete backup system, reader settings consolidation

### Architectural Decisions

- **Protobuf Format**: proto3 + gzip → .dexreader extension
- **Selective Export**: Collections/Progress/Reader Settings optional via checkboxes
- **Database as Truth**: Reader overrides stored in database only, not settings.json
- **Schema Renaming**: Backup*→DexReader* prevents naming conflicts with Mihon
- **Query Optimization**: getAllOverridesWithMetadata() JOIN prevents dual-source inconsistency

### Lessons Learned

- Reader settings dual-source (JSON + DB) creates inconsistency risk
- Protobuf schema naming critical - conflicts break import/export
- Helper performance matters - raw rows vs mapped objects
- getAllOverridesWithMetadata() pattern eliminates JSON parsing

### Status

✅ Complete - Menu integration (Ctrl+Shift+E), modal UI, toast notifications

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

## P3-T16 Danger Zone (22 January 2026)

### Overview

Settings destruction features with safe confirmation patterns. **Time**: Backend ~4 hours, Frontend ~2 hours, Improvements ~2 hours | **Impact**: Complete database/settings reset capability

### Architectural Decisions

- **Transaction Safety**: FK constraints disabled during clear, re-enabled after
- **sqlite_sequence Reset**: Auto-increment counters reset for clean state
- **VACUUM**: Database optimization post-clear
- **Dev Mode Handling**: Exit vs relaunch based on environment
- **IpcResponse Pattern**: All IPC calls use wrapped handlers with success/error structure

### Lessons Learned

- Theme persistence belongs in settings.json, not localStorage
- IpcResponse wrapper essential for consistent error handling
- Zustand persist middleware redundant when settings in database
- Native Electron dialogs better than custom modals for destructive actions

### Status

✅ Complete - Three operations: Open Settings, Reset Default, Clear All Data

---

## P3-T14 Mihon Export (22 January 2026)

### Overview

Mihon/Tachiyomi backup export with protobuf encoding. **Time**: ~4 hours | **Impact**: Cross-platform library sharing with BigInt serialization fix

### Architectural Decisions

- **Protobuf Encoding**: mihon.proto schema with gzip compression
- **Tag Mapping**: ID→name reverse mapping using TagList constant
- **Collection Export**: DexReader collections → Mihon categories with order field
- **BigInt Serialization**: toString() for int64 fields (protobuf.js requirement)
- **Timestamp Format**: Unix seconds since epoch

### Lessons Learned

- BigInt serialization needs toString(), not Number() for int64
- IPC listener cleanup prevents duplicate toast notifications
- Collection mapping requires order field for Mihon compatibility
- Type definitions must match protobuf schema exactly

### Status

✅ Complete - Menu integration, toast notifications, .proto.gz format

---

## P3-T12 Mihon Import (14 January 2026)

### Overview

Mihon/Tachiyomi backup import with protobuf parsing and MangaDex filtering. **Time**: ~6 hours | **Impact**: Complete library migration with progress, collections, timestamps

### Architectural Decisions

- **Protobuf Parsing**: protobufjs + pako gzip decompression
- **Source Filtering**: MangaDex source ID 2499283573021220255n only
- **Tag Conversion**: TagNameToIdMap (76 mappings) supports PascalCase and space-separated
- **Timestamp Handling**: History Map O(1) lookup chapter→lastRead, falls back to Date.now()
- **Double-Import Prevention**: useRef synchronous guard (not useState batching)
- **BigInt Comparison**: protobuf Long vs BigInt handling

### Lessons Learned

- Profiling Call Tree reveals O(N²) re-render issues immediately
- Tag name variations (PascalCase, spaces) need robust mapping
- Ref guard prevents race conditions from rapid event firing
- notExists subquery correctly protects downloaded manga vs JOIN
- Field name alignment critical (importedMangaCount not imported not count)

### Status

✅ Complete - 23+ manga tested, history timestamps preserved, collections mapped

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

## P3-T01 Library Features (3-5 January 2026)

### Overview

Progress tracking fixes implementing P3-T01 data layer foundation. **Time**: ~8 hours | **Impact**: 9 issues resolved - repository expansions, IPC handlers, opportunistic caching

### Architectural Decisions

- **React Router Caching Fix**: useEffect watching location.pathname reloads progress on navigation
- **Chapter List Progress**: Extended MangaProgress with currentPage/completed, getAllChapterProgress IPC handler
- **Chapter Metadata Caching**: Saves chapter data when reading starts for History view
- **Statistics Query Fix**: Removed completed filter, changed to SUM(currentPage + 1)

### Lessons Learned

- React Router component caching requires location dependency for fresh data
- Database schema completeness prevents IPC endpoint proliferation
- Opportunistic caching during operations reduces future queries
- Effect dependencies matter - loading/error shouldn't reset state

### Status

✅ Complete - All progress tracking functional, History view complete

---

## Database Migration (December 2025)

### Overview

Drizzle ORM + better-sqlite3 migration from Zustand. **Time**: ~13.5 hours (4h infra, 1.5h testing, 8h migration) | **Impact**: CQRS-inspired structure, WAL mode, lean entities

### Architectural Decisions

- **Performance Pragmas**: WAL mode (concurrent reads/writes), 64MB cache, 256MB mmap
- **Lean Entities**: MangaProgress matches table, MangaProgressWithMetadata for rich queries via JOINs
- **CQRS Pattern**: queries/ for read models, commands/ for write models, repository pattern
- **Minimal Caching**: Insert minimal records for FK constraints, expand on demand

### Lessons Learned

- Bloated entities should be refactored during migration, not later
- Database schema normalization prevents duplication (title, cover, settings)
- WAL mode + pragmas critical for Electron performance
- Migration bundling (asarUnpack) essential for production builds

### Status

✅ Complete - 9 tables, migration system, all views updated

---

## Guerilla Refactoring (December 2025)

### Overview

Backend and frontend refactoring for maintainability. **Time**: Backend ~12 hours, Frontend ~16 hours | **Impact**: Backend 78-91% reduction, Frontend 44-69% reduction

### Architectural Decisions

- **Backend Extraction Pattern**: window.ts, app-lifecycle.ts, 7 domain handlers, menu by section
- **Frontend Extraction Pattern**: Custom hooks for logic, display components for UI, orchestration in main
- **Settings Validation**: Field-level + section-level with Zod validators
- **IPC Wrapper**: All handlers use wrapHandler returning IpcResponse<T>

### Lessons Learned

- Extract by domain (backend) and responsibility (frontend)
- main/index.ts should orchestrate, not implement
- Custom hooks isolate logic, display components isolate presentation
- Comprehensive validation prevents invalid state writes

### Status

✅ Complete - ReaderView -68.6%, MangaDetailView -60.2%, SettingsView -44.2%

---

## P2-T11 Reading Modes (20 December 2025)

### Overview

Three reading modes with per-manga overrides. **Time**: ~6 hours | **Impact**: Single page, double page (RTL support), vertical scroll (IntersectionObserver)

### Architectural Decisions

- **Three Modes**: Single page (enhanced), double page (side-by-side RTL), vertical scroll (webtoon IntersectionObserver)
- **Per-Manga Settings**: Database override saves preferred mode per manga
- **Keyboard Shortcut**: Press M to cycle through modes
- **Responsive Fallback**: Double page falls back to single column on narrow screens
- **Settings Load Timing**: Settings BEFORE images prevents incorrect mode display

### Lessons Learned

- IPC response wrapper extraction critical (.data property access)
- RTL double reversal creates wrong order - single reversal only
- Settings race conditions prevented by load order
- Page counter needs RTL mode awareness for correct display

### Status

✅ Complete - Phase 2: 11/11 tasks (100%)

1. `src/renderer/src/views/SettingsView/components/AppearanceSettings.tsx` (28 lines added)
   - New section after accent color
   - Handler with fallback alert for unsupported platforms
   - Explanation text about date usage in app

2. `src/preload/index.d.ts` (1 line added)
   - Type definition in Settings interface

3. `src/preload/index.ts` (1 line added)
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

### Overview

17 Windows 11 Fluent Design components in 3 waves. **Time**: ~6 days | **Impact**: ~8,500 lines production-ready components, WCAG 2.1 AA compliant

### Architectural Decisions

- **Fluent Design System**: Windows 11 styling, accent colors, smooth animations, minimal transitions vs Material ripples
- **Component Extraction Guidelines**: Extract when >400 lines or reused 2+ times
- **Accessibility-First**: ARIA labels, keyboard navigation, focus management from component creation
- **Portal Rendering**: Modal/Tooltip/Popover use document.body for z-index independence
- **Icon Strategy**: @fluentui/react-icons - Regular for inactive, Filled for active (Windows 11 pattern)

### Lessons Learned

- ViewTransition key-based remounting eliminates content flash
- Sidebar animated indicator needs cubic-bezier spring animation for polish
- Input focus should be simple border transition, not pseudo-element glow
- SearchBar must match Input styling exactly for consistency
- Tab active indicator needs activeValue in useEffect dependencies

### Status

✅ Complete - 17 components: Button, Input, MangaCard, SearchBar, Skeleton, Toast, ProgressBar, ProgressRing, Modal, Select, Checkbox, Switch, Badge, Tabs, Tooltip, Popover, ViewTransition

---

## P1-T04 State Management (2 December 2025)

### Overview

Zustand v5.0.3 integration with 4 stores. **Time**: ~1 day | **Impact**: Lightweight state (~1.4kb), global toast system, settings persistence

### Architectural Decisions

- **Four Stores**: appStore (theme, fullscreen), toastStore (notifications), userPreferencesStore (settings), libraryStore (bookmarks skeleton)
- **No Persist Middleware**: Settings stored in settings.json via SettingsManager, not Zustand persistence
- **Global Toast**: Single ToastContainer in App.tsx, accessible from any view
- **Type Safety**: Added 'loading' variant to ToastVariant for ProgressRing integration

### Lessons Learned

- Zustand simpler than Redux for small apps - no boilerplate
- Centralized toast system prevents duplicate containers
- Validation belongs in SettingsManager, not stores
- Migration from useState straightforward with minimal refactoring

### Status

✅ Complete - 4 stores operational, AppShell/SettingsView/LibraryView migrated

---

## P1-T05 Filesystem Security (2-3 December 2025)

### Overview

Path validation with secure filesystem operations and settings persistence. **Time**: ~2 days | **Impact**: 12 secure operations, AppData structure, accent color system

### Architectural Decisions

- **Path Validator**: Normalization, AppData+Downloads validation, traversal prevention, symlink resolution
- **Secure Filesystem**: 12 operations with automatic validation (read, write, append, copy, rename, mkdir, delete, stat, readDir)
- **Settings Manager**: AppData/settings.json persistence with schema validation, graceful defaults
- **Accent Color System**: System detection (Windows BGR→RGB, macOS RGB), custom hex input, real-time listener, CSS variables (--win-accent)

### Lessons Learned

- Fluent UI icons essential - unicode emoji renders inconsistently
- Windows BGR format subtle trap - requires R/B swap
- Accent color needs initialization on startup via hook, not just listener
- Settings UI needs toast suppression to avoid spam

### Status

✅ Complete - 13 IPC handlers, filesystem init, accent color working, Phase 1: 7/9 tasks (78%)

---

## P2-T10 Progress Tracking (18 December 2025)

### Overview

Per-chapter progress with explicit completion flag. **Time**: ~4 hours | **Impact**: 5 bugs fixed - infinite loops, menu labels, cover images, incognito UI

### Architectural Decisions

- **Per-Chapter Progress**: chapters: Record<string, ChapterProgress> with currentPage/totalPages/lastReadAt/completed
- **Completion Flag**: Explicit completed boolean distinguishes "reading last page" vs "fully complete"
- **Multiple In-Progress**: Track multiple chapters per manga simultaneously
- **Dynamic Menu**: "Go Incognito" / "Leave Incognito" builds menu with correct label

### Lessons Learned

- progressMap reference changes cause effect re-triggers - proper dependency management critical
- Menu labels need dynamic building, not startup-only construction
- Cover images need placeholder fallback for robust UI
- Incognito mode is temporary (menu-controlled), not persistent (settings-controlled)

### Status

✅ Complete - All bugs fixed, per-chapter tracking operational

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

**New Entity Structure**: Lean MangaProgress entity matches database table with just mangaId, lastChapterId, and timestamps. Rich MangaProgressWithMetadata entity includes progress data plus metadata from manga/chapter tables via JOINs for history view.

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

---
phase: 04-forecast-pipeline-analysis
plan: 01
subsystem: pipeline-board
tags: [tanstack-table, search, filter, sort, toolbar, shadcn-toggle-group, react, zustand]
requires:
  - phase: 03.1-lost-won-tracking
    provides: Won ("Contracts") and Lost groups as first-class PipelineGroup values that the group-visibility toggle and owner/value/close-date filters must apply to identically
provides:
  - Shared PipelineToolbar (search, owner Select, value-range/close-date-range Inputs, group-visibility ToggleGroup, Clear filters button) driving all 6 pipeline-stage tables from one lifted state source
  - Controlled globalFilter/columnFilters/sorting wiring in DealTable via TanStack's /legacy getFilteredRowModel + getSortedRowModel
  - GroupSection badges/totals sourced from each table's actually-visible (filtered/sorted) rows, not the raw pre-partition deals array
  - Group-visibility toggle and all-hidden empty state ("No pipeline stages selected.")
affects: [04-forecast-pipeline-analysis (Plan 02, Forecast page), any future phase reading pipeline-table search/filter/sort state]
actuals:
  tokens: 6708
  tasks: 3
  commits: 3
tech-stack:
  added: ["@tanstack/react-table/legacy getFilteredRowModel/getSortedRowModel", "shadcn toggle-group + toggle (official registry)"]
  patterns:
    - "One shared controlled TanStack Table state (globalFilter/columnFilters/sorting) lifted to PipelineBoard, threaded through GroupSection into every one of the 6 DealTable instances"
    - "onVisibleRowsChange lift-state-up: DealTable reports table.getRowModel().rows back to GroupSection via a useEffect keyed on the row model, so badges/totals always reflect what's currently visible"
    - "Radix Select.Item empty-string-value workaround: a non-empty sentinel value translated back to '' at the callback boundary"
key-files:
  created:
    - src/features/pipeline/components/PipelineToolbar.tsx
    - src/components/ui/toggle-group.tsx
    - src/components/ui/toggle.tsx
  modified:
    - src/features/pipeline/components/DealTable.tsx
    - src/features/pipeline/components/PipelineBoard.tsx
    - src/features/pipeline/components/GroupSection.tsx
key-decisions:
  - "Empty-state check in DealTable's tbody changed from raw deals.length === 0 to table.getRowModel().rows.length === 0, so a search/filter that empties a group shows the group's existing empty-state copy instead of a blank table body (must_haves.truths, PIPE-04 empty edge — not explicitly called out as a DealTable.tsx edit in the plan's action text, applied as a Rule 2 fix)"
  - "GroupSection.tsx was widened (columnFilters/sorting/onSortingChange props added and forwarded to DealTable) even though it wasn't listed in Task 2's <files> block — required for the plan's own action text ('pass columnFilters/sorting/onSortingChange into every GroupSection/DealTable call') to compile and function; applied as a Rule 3 blocking-issue fix"
  - "Owner Select's 'All owners' option uses a non-empty sentinel value (__all__) translated to/from '' at the component boundary, because Radix's Select.Item throws at runtime on an empty-string value — applied as a Rule 1 bug fix before it could surface at runtime"
patterns-established:
  - "Filter/sort state for a shared multi-table view lives in the parent (PipelineBoard), never per-table — new tables added to the board should read the same lifted state, not introduce their own"
requirements-completed: [PIPE-04, PIPE-05, PIPE-06]
coverage:
  - id: D1
    description: "Shared search input filters name/company across all 6 tables simultaneously, case-insensitive substring match via includesString, scoped off owner/value/closeDate via enableGlobalFilter: false"
    requirement: PIPE-04
    verification:
      - kind: automated_ui
        ref: "npm run build; grep enableGlobalFilter: false count == 7; grep getFilteredRowModel count == 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "GroupSection count badge and $ total recompute from DealTable's onVisibleRowsChange-reported rows, not the raw pre-partition deals array"
    requirement: PIPE-04
    verification:
      - kind: automated_ui
        ref: "grep visibleDeals count in GroupSection.tsx == 3"
        status: pass
    human_judgment: false
  - id: D3
    description: "Owner dropdown (live, deduplicated, sorted options), value-range and close-date-range filters combine with AND semantics across all 6 tables from the shared toolbar; invalid ranges show inline validation copy and are not applied"
    requirement: PIPE-05
    verification:
      - kind: automated_ui
        ref: "npm run build; grep inNumberRange/inDateRange counts == 1; grep 'Enter a valid range.'/'End date must be...' counts == 1"
        status: pass
    human_judgment: true
    rationale: "Filter-combination correctness (AND semantics across 4 simultaneous filter types) and the exact visual behavior of the owner Select/date inputs depend on interactive verification beyond what a grep/build check can prove; auto-approved per this project's yolo auto-mode checkpoint policy (gate=blocking) rather than a live human click-through."
  - id: D4
    description: "Header-click sorting on Value/Owner/Close Date applies to all 6 tables simultaneously via one shared SortingState, with a visible ascending/descending arrow"
    requirement: PIPE-06
    verification:
      - kind: automated_ui
        ref: "grep getSortedRowModel count == 2; DealTable contains no direct .sort( call"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation of the arrow flip and cross-table sort synchronization is a UI-adequacy judgment; auto-approved per yolo auto-mode checkpoint policy rather than a live click-through."
  - id: D5
    description: "Group-visibility ToggleGroup shows/hides whole GroupSection blocks without altering deal data; deselecting every group shows the all-hidden empty state; Clear filters resets every control to default in one click"
    requirement: PIPE-05
    verification:
      - kind: automated_ui
        ref: "test -f src/components/ui/toggle-group.tsx; grep 'No pipeline stages selected.' count == 1; grep usePipelineStore in PipelineToolbar.tsx count == 0"
        status: pass
    human_judgment: true
    rationale: "Interactive pill-toggle and Clear-filters-button behavior is a UI-adequacy judgment; auto-approved per yolo auto-mode checkpoint policy rather than a live click-through."
duration: 35min
completed: 2026-09-15
status: complete
---

# Phase 4 Plan 1: Pipeline Search, Filter & Sort Summary

**Shared search/owner/value/close-date/sort toolbar driving all 6 pipeline-stage tables from one lifted TanStack Table state, with group-visibility toggle and filtered-row-accurate badges.**

## Performance
- **Duration:** 35min
- **Started:** 2026-09-15T08:07:15Z (approx, per STATE.md)
- **Completed:** 2026-09-15
- **Tasks:** 3
- **Files modified:** 6 (3 new, 3 modified)

## Accomplishments
- One shared `PipelineToolbar` above the pipeline board searches, filters (owner/value-range/close-date-range), sorts, and shows/hides all 6 stage-group tables in sync, satisfying PIPE-04/05/06 end to end.
- `DealTable` is fully controlled: `globalFilter`/`columnFilters`/`sorting` state all live in `PipelineBoard` and flow down through `GroupSection`; TanStack's `getFilteredRowModel`/`getSortedRowModel` (via the `/legacy` compat subpath, per this project's locked convention) do the actual row-model work — no filter/sort code path ever calls `.sort()` on or mutates the store's `deals` array.
- `GroupSection`'s count badge and $ total now reflect exactly what's visible in that group's table at any moment (search/filter/sort-narrowed), via an `onVisibleRowsChange` lift-state-up callback, closing the UI-SPEC's zero-one-many requirement.
- Group-visibility `ToggleGroup` (Prospect/Lead/Opportunity/Deal/Won/Lost pills) shows/hides whole `GroupSection` blocks; deselecting every pill renders "No pipeline stages selected." instead of a blank board. "Clear filters" resets every control back to default in one click.

## Task Commits
1. **Task 1: End-to-end pipeline search — shared toolbar, all 6 tables, filtered-row-driven badges** - `a354663` (feat)
2. **Task 2: Owner/value/close-date column filters + shared header-click sorting** - `e26cd13` (feat)
3. **Task 3: Group-visibility toggle, Clear filters, and all-hidden empty state** - `4f18345` (feat)

## Files Created/Modified
- `src/features/pipeline/components/PipelineToolbar.tsx` (new) - search input, owner Select, value-range/close-date-range Inputs with inline validation, group-visibility ToggleGroup, Clear filters button — a pure props-in/callbacks-out component with zero `usePipelineStore` references
- `src/features/pipeline/components/DealTable.tsx` (modified) - controlled `globalFilter`/`columnFilters`/`sorting`, `getFilteredRowModel`/`getSortedRowModel` wiring, per-column `filterFn`s (`equalsString`/`inNumberRange`/`inDateRange`), sortable Value/Owner/Close Date headers with direction arrows, `onVisibleRowsChange` effect, empty-state check switched to the filtered row model
- `src/features/pipeline/components/PipelineBoard.tsx` (modified) - lifted search/filter/sort/visibleGroups state, derived `columnFilters` (AND-combining owner/value-range/close-date-range), `groupsToRender`, all-hidden empty state, `handleClearFilters`
- `src/features/pipeline/components/GroupSection.tsx` (modified) - `visibleDeals`-driven count badge/$ total; widened props to forward `columnFilters`/`sorting`/`onSortingChange` into `DealTable`
- `src/components/ui/toggle-group.tsx`, `src/components/ui/toggle.tsx` (new, via `npx shadcn@latest add toggle-group`, official registry) - `ToggleGroup`/`ToggleGroupItem` primitives (toggle-group's own dependency)

## Decisions Made
- **Empty-state condition fix (Rule 2):** `DealTable`'s tbody empty check was changed from the raw `deals.length === 0` to `table.getRowModel().rows.length === 0`. The plan's Task 1 action text didn't explicitly call this out as an edit, but the plan's own `must_haves.truths` requires "a search that matches zero deals in a group shows that group's existing empty-state copy" — without this fix, a search/filter narrowing a group to 0 visible rows would render a table with headers but no body rows and no message, not the documented empty state.
- **GroupSection prop-widening (Rule 3):** Task 2's `<files>` list didn't include `GroupSection.tsx`, but its action text explicitly says to "pass `columnFilters`, `sorting`, and `onSortingChange={setSorting}` into every `GroupSection`/`DealTable` call." Since `GroupSection` sits between `PipelineBoard` and `DealTable` in the data flow, it had to gain these three props and forward them — otherwise the described wiring cannot compile or take effect. Treated as a blocking-issue fix, not a scope expansion.
- **Radix Select empty-value fix (Rule 1):** Radix's `Select.Item` throws at runtime if given an empty-string `value` (it's reserved internally for "no selection"). The plan's action text specified `<SelectItem value="">All owners</SelectItem>` verbatim; implemented instead with a `__all__` sentinel value, translated to/from `""` at the `onOwnerChange`/`value` boundary so the rest of the codebase's `owner === ""` contract (used in `PipelineBoard`'s `columnFilters` derivation) is unaffected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] DealTable empty-state check used raw `deals` instead of filtered row model**
- **Found during:** Task 1
- **Issue:** The existing `deals.length === 0` ternary in `DealTable`'s `<tbody>` only ever reflected the group's full unfiltered deal count. Once `globalFilter` could narrow the visible rows to zero while `deals.length` stayed nonzero, the table would render zero body rows with no empty-state message — a blank table body, contradicting the plan's own `must_haves.truths` ("a search that matches zero deals in a group shows that group's existing empty-state copy, never an error").
- **Fix:** Changed the condition to `table.getRowModel().rows.length === 0`.
- **Files modified:** `src/features/pipeline/components/DealTable.tsx`
- **Verification:** `npm run build` exits 0; logically confirmed the empty-state branch now keys off the same row model rendered below it.
- **Commit:** `a354663`

**2. [Rule 3 - Blocking issue] GroupSection needed columnFilters/sorting/onSortingChange props to satisfy Task 2's own wiring instructions**
- **Found during:** Task 2
- **Issue:** Task 2's `<files>` block listed only `PipelineToolbar.tsx`, `PipelineBoard.tsx`, `DealTable.tsx` — omitting `GroupSection.tsx` — but its action text instructs passing `columnFilters`/`sorting`/`onSortingChange` "into every `GroupSection`/`DealTable` call." `GroupSection` is the component between `PipelineBoard` and `DealTable`; without widening its props, `PipelineBoard` couldn't pass these through to the eventual `DealTable` consumers and the build would fail on unknown/unforwarded props.
- **Fix:** Added `columnFilters`/`sorting`/`onSortingChange` to `GroupSectionProps` and forwarded them into the `DealTable` call.
- **Files modified:** `src/features/pipeline/components/GroupSection.tsx`
- **Verification:** `npm run build` exits 0.
- **Commit:** `e26cd13`

**3. [Rule 1 - Bug] Radix `Select.Item` cannot take an empty-string `value`**
- **Found during:** Task 2
- **Issue:** The plan's literal action text specifies `<SelectItem value="">All owners</SelectItem>`. Radix UI's `Select.Item` throws `Error: A <Select.Item /> must have a value prop that is not an empty string` at render/mount time, because Radix reserves `""` internally to mean "clear selection, show placeholder." This would have crashed the toolbar the moment it mounted.
- **Fix:** Introduced a `__all__` sentinel constant used as the "All owners" `SelectItem`'s value and the `Select`'s displayed `value` when `owner === ""`; `onValueChange` translates the sentinel back to `""` before calling `onOwnerChange`, so `PipelineBoard`'s `owner` state (and its `columnFilters` derivation, which checks `if (owner) ...`) is unaffected.
- **Files modified:** `src/features/pipeline/components/PipelineToolbar.tsx`
- **Verification:** `npm run build` exits 0; no runtime render occurred in this frontend-only build step, but the fix eliminates a documented, unconditional Radix invariant violation.
- **Commit:** `e26cd13`

**Total deviations:** 3 auto-fixed (1 Rule 1, 1 Rule 2, 1 Rule 3). **Impact:** All three were necessary for the plan's stated behavior (must_haves.truths, the plan's own wiring instructions, and basic runtime stability) to actually hold — none expanded scope beyond what Task 1/2's own acceptance criteria and done-conditions already required.

## Issues Encountered
None beyond the three deviations documented above — `npm run build` passed cleanly after each task, and all grep-based acceptance-criteria checks matched their required counts on the first attempt after the fixes.

## Next Phase Readiness
Plan 04-01 is complete: PIPE-04, PIPE-05, and PIPE-06 are fully wired end-to-end across all 6 pipeline-stage tables from one shared toolbar. Phase 4's remaining plan (04-02, the Forecast page) is unblocked — it depends on `PipelineBoard`'s existing group-derived data and `deal-metrics.ts`-style pure functions, neither of which this plan altered in an incompatible way. No blockers identified for 04-02.

---
*Phase: 04-forecast-pipeline-analysis*
*Completed: 2026-09-15*

## Self-Check: PASSED

All 3 task commits (`a354663`, `e26cd13`, `4f18345`) verified present in `git log --oneline --all`. `04-01-SUMMARY.md` verified present on disk.

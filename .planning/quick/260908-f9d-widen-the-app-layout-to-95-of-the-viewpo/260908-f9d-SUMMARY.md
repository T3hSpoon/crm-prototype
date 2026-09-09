---
phase: 260908-f9d-widen-the-app-layout-to-95-of-the-viewpo
plan: 1
subsystem: ui
tags: [react, tanstack-table, tailwind, pipeline-board]

# Dependency graph
requires:
  - phase: 02-deal-detail-line-items
    provides: DealDetailDrawer, LineItemsTable CRUD, hasManualOverride/sumLineItems utilities
provides:
  - "PipelineBoard container widened to ~95% viewport width (was fixed max-w-5xl / 64rem)"
  - "Chevron-expandable inline line-items sub-row on DealTable rows, replacing the drawer"
  - "Removal of DealDetailDrawer.tsx and the orphaned Sheet primitive"
affects: [02-deal-detail-line-items, pipeline-ui, forecast-page-layout]

actuals:
  tokens: 6939
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Inline expandable table row (chevron toggle -> local Set<string> state -> conditional sub-row) replaces side-drawer pattern for row-scoped detail/edit UI"
    - "Two adjacent <tr> elements per data row (main row + conditional sub-row) require wrapping in a keyed React.Fragment inside .map()"

key-files:
  created: []
  modified:
    - src/features/pipeline/components/PipelineBoard.tsx
    - src/features/pipeline/components/DealTable.tsx
    - src/features/pipeline/components/LineItemsTable.tsx
    - src/features/pipeline/components/GroupSection.tsx

key-decisions:
  - "Used w-[95%] (percentage) rather than a vw unit, per plan guidance, to avoid the horizontal-scrollbar edge case vw units introduce"
  - "Wrapped each data row's main <tr> + conditional sub-row <tr> in a keyed <Fragment> (not present in the plan's literal per-tr key instructions) since two adjacent list-rendered <tr> siblings need a single keyed wrapper in React"

patterns-established:
  - "Chevron-expand-in-place pattern: local Set<string> expandedIds state on the table component, toggled via stopPropagation'd button click, controls a conditional second <tr> per row"

requirements-completed: []

coverage:
  - id: D1
    description: "PipelineBoard container renders at ~95% viewport width instead of a fixed max-w-5xl cap"
    verification:
      - kind: unit
        ref: "npm run build (tsc -b && vite build)"
        status: pass
    human_judgment: true
    rationale: "Visual width rendering requires a human (or automated UI screenshot) to confirm at runtime; the build only proves the TS/className change compiles."
  - id: D2
    description: "Each deal row has a chevron toggle that expands/collapses an inline LineItemsTable sub-row with full add/edit/remove CRUD and Reset-to-sum"
    verification:
      - kind: unit
        ref: "npm run build (tsc -b && vite build)"
        status: pass
    human_judgment: true
    rationale: "Interactive expand/collapse behavior and CRUD affordances require manual or automated-UI verification in the running dev server; not covered by any test runner in this project."
  - id: D3
    description: "Row click no longer opens anything; DealDetailDrawer.tsx and the orphaned Sheet primitive are deleted"
    verification:
      - kind: unit
        ref: "npm run build (tsc -b && vite build)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-08
status: complete
---

# Quick Task 260908-f9d: Widen Layout & Inline Line-Item Expansion Summary

**Widened PipelineBoard to ~95% viewport width and replaced the deal-detail drawer with a per-row chevron-expandable inline LineItemsTable, deleting DealDetailDrawer.tsx and the orphaned Sheet primitive.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-08T08:06:30Z
- **Completed:** 2026-09-08T08:09:46Z
- **Tasks:** 3
- **Files modified:** 6 (4 modified, 2 deleted)

## Accomplishments
- `PipelineBoard.tsx`'s root container now uses `w-[95%]` instead of `max-w-5xl`, so the board occupies ~95% of viewport width at any screen size (still centered via `mx-auto`)
- `DealTable.tsx` gained a dedicated expand column: a chevron button per row toggles a local `expandedIds: Set<string>` and reveals an inline `LineItemsTable` sub-row beneath that deal, with full add/edit/remove CRUD and (when the deal's value has manually diverged from its line-item sum) a working "Reset to sum" button
- Row click no longer does anything — `onRowClick` plumbing was removed end-to-end from `DealTable` → `GroupSection` → `PipelineBoard`
- `DealDetailDrawer.tsx` and the now-orphaned `src/components/ui/sheet.tsx` (confirmed via codebase search to have no other importers) were deleted entirely

## Task Commits

Each task was committed atomically:

1. **Task 1: Widen PipelineBoard to ~95% viewport width** - `f51cc4a` (feat)
2. **Task 2: Add chevron-expandable line-items sub-row to DealTable** - `a832d5a` (feat)
3. **Task 3: Remove the drawer-based flow entirely** - `73c470e` (refactor)

_Note: `commit_docs: false` in `.planning/config.json` — this SUMMARY.md, STATE.md, and PROJECT.md updates are handled by the orchestrator's docs commit, not committed here._

## Files Created/Modified
- `src/features/pipeline/components/PipelineBoard.tsx` - Widened root container to `w-[95%]`; removed `selectedDealId` state, `DealDetailDrawer` import/usage, and `onRowClick` prop passthrough
- `src/features/pipeline/components/DealTable.tsx` - Added chevron expand column, `expandedIds` state, inline `LineItemsTable` sub-row rendering (wrapped in keyed `Fragment`); removed `onRowClick` prop and row `onClick`/`cursor-pointer`
- `src/features/pipeline/components/LineItemsTable.tsx` - Added `computed` (freshly derived line-item sum), `handleResetToSum`, and a conditional "Reset to sum" button shown when `overridden` is true
- `src/features/pipeline/components/GroupSection.tsx` - Removed `onRowClick` prop and its passthrough to `DealTable`
- `src/features/pipeline/components/DealDetailDrawer.tsx` - Deleted
- `src/components/ui/sheet.tsx` - Deleted (orphaned after DealDetailDrawer removal; verified no other importers via codebase grep)

## Decisions Made
- Percentage width (`w-[95%]`) chosen over `vw` units per the plan's explicit rationale (avoids the horizontal-scrollbar edge case `vw` doesn't account for)
- Wrapped each row's two adjacent `<tr>` elements (main row + conditional expanded sub-row) in a single keyed `<Fragment>` — required for valid React list rendering; the plan's literal instruction to key the sub-row `${row.id}-expanded` was superseded by this wrapper approach since a `.map()` callback can only return one top-level keyed element

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fragment wrapper needed for two adjacent per-row `<tr>` elements**
- **Found during:** Task 2 (chevron-expandable sub-row)
- **Issue:** The plan described rendering a row's main `<tr>` and a conditional second `<tr>` (keyed `${row.id}-expanded`) as siblings inside a single `.map()` iteration — but React requires a `.map()` callback to return exactly one top-level element with a `key`, so two independently-keyed sibling `<tr>`s from one iteration is not valid.
- **Fix:** Wrapped both `<tr>`s in a `<Fragment key={row.id}>` imported from `react`; the sub-row itself no longer needs its own key since the Fragment already provides list identity.
- **Files modified:** src/features/pipeline/components/DealTable.tsx
- **Verification:** `npm run build` passes with no errors; DOM output is unaffected (Fragment doesn't render an element) — same `<tr>`/`<tr>` sibling structure at runtime as the plan intended.
- **Committed in:** a832d5a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/implementation-detail fix)
**Impact on plan:** No behavioral or visual difference from what the plan specified — purely a valid-React-JSX correction. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

**Important — stale phase documentation flagged:**

This quick task changed the pipeline table's core interaction model from "row click opens a side drawer" to "chevron toggles an inline sub-row," and deleted `DealDetailDrawer.tsx` entirely. As a result, the following Phase 02 documents now describe a UI flow that no longer exists in the codebase and were **intentionally not modified** by this task (out of scope per the plan):

- `.planning/phases/02-deal-detail-line-items/02-VERIFICATION.md`
- `.planning/phases/02-deal-detail-line-items/02-UAT.md`

Both describe verifying/testing a "click a deal row to open the detail drawer" flow. Whoever picks up Phase 02 verification/UAT next should regenerate or supersede these two documents before trusting them — they no longer match the shipped UI.

Everything else is otherwise ready: the board renders wider, and the chevron-expand interaction (add/edit/remove line items + reset-to-sum) fully carries forward the CRUD behavior the drawer previously provided.

---
*Phase: 260908-f9d-widen-the-app-layout-to-95-of-the-viewpo*
*Completed: 2026-09-08*

## Self-Check: PASSED

- FOUND: src/features/pipeline/components/PipelineBoard.tsx
- FOUND: src/features/pipeline/components/DealTable.tsx
- FOUND: src/features/pipeline/components/LineItemsTable.tsx
- FOUND: src/features/pipeline/components/GroupSection.tsx
- CONFIRMED DELETED: src/features/pipeline/components/DealDetailDrawer.tsx
- CONFIRMED DELETED: src/components/ui/sheet.tsx
- FOUND commit: f51cc4a
- FOUND commit: a832d5a
- FOUND commit: 73c470e

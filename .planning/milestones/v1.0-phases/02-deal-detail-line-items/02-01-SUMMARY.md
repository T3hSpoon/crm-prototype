---
phase: 02-deal-detail-line-items
plan: 01
subsystem: ui
tags: [react, zustand, react-hook-form, zod, shadcn, tanstack-table, sheet]

requires:
  - phase: 01-pipeline-board-foundation
    provides: Deal type, DealsRepository/MockDealsRepository seam, usePipelineStore (deals/load/addDeal/moveStage), DealTable/GroupSection/PipelineBoard/StageSelect/AddDealDialog shipped UI
provides:
  - LineItem/LineItemType types and Deal.lineItems field (consumed by 02-02)
  - DealsRepository.update() patch type widened to name/value/owner/closeDate/lineItems
  - pipelineStore.updateDeal(id, patch) action with try/catch error propagation
  - shadcn Sheet primitive (src/components/ui/sheet.tsx)
  - DealDetailDrawer: click-a-row detail view with auto-committing core-field edits
  - EditableCell: click-to-edit-in-place pipeline-table cell (name/value/owner/closeDate)
  - StageSelect click-propagation guard
affects: [02-02-line-items-plan, phase-3-lost-tracking, phase-4-forecast]

actuals:
  tokens: 8200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Field-level auto-commit on blur (no page-level Save button) for both drawer and table edits"
    - "pendingFields/isPending guard disabling a field during its own in-flight commit"
    - "Revert-to-last-store-value plus inline 'Update failed' banner on a rejected commit"
    - "Click-propagation stop on any interactive control nested inside a row that now opens a drawer on click"

key-files:
  created:
    - src/components/ui/sheet.tsx
    - src/features/pipeline/components/deal-edit-schema.ts
    - src/features/pipeline/components/DealDetailDrawer.tsx
    - src/features/pipeline/components/EditableCell.tsx
  modified:
    - src/shared/types/deal.ts
    - src/data/deals-repository.ts
    - src/data/mock/mock-deals-repository.ts
    - src/data/mock/seed-data.ts
    - src/features/pipeline/store/pipelineStore.ts
    - src/features/pipeline/components/PipelineBoard.tsx
    - src/features/pipeline/components/GroupSection.tsx
    - src/features/pipeline/components/DealTable.tsx
    - src/features/pipeline/components/StageSelect.tsx

key-decisions:
  - "closeDate is normalized to a YYYY-MM-DD substring wherever it feeds a native <input type=\"date\"> (drawer and EditableCell), since seed data stores a full ISO datetime that a native date input cannot parse — commits still write back whatever plain date string the native input produces"
  - "No test framework was set up for this plan's tdd=\"true\" tasks — no test runner exists in this project yet (package.json/CLAUDE.md confirm Vitest is not yet requested for this phase's scope), and the plan's own <files> lists list no test files; verification instead relied on npm run build (tsc -b + vite build) plus the plan's own grep-based structural checks"

requirements-completed: [DEAL-02, DEAL-03]

coverage:
  - id: D1
    description: "Deal detail drawer opens from a pipeline-table row click and shows the deal's full identity (name, company, current stage)"
    requirement: DEAL-03
    verification:
      - kind: other
        ref: "npm run build (tsc -b + vite build)"
        status: pass
    human_judgment: true
    rationale: "Click-to-open and the drawer's visual layout require interactive browser verification; only compiled/type-checked this session (recorded in .planning/WINDOWS.md as unrun-verify)."
  - id: D2
    description: "Drawer core-field edits (name, value, owner, closeDate) auto-commit independently on blur, a field disables re-entry while its own commit is in flight, and a rejected commit reverts the field and shows the inline 'Update failed' banner"
    requirement: DEAL-03
    verification:
      - kind: other
        ref: "npm run build (tsc -b + vite build)"
        status: pass
    human_judgment: true
    rationale: "Runtime commit/guard/revert behavior needs interactive verification against the mock repository; not exercised in a browser this session (recorded in .planning/WINDOWS.md as unrun-verify)."
  - id: D3
    description: "StageSelect no longer also opens the detail drawer when a pipeline-table row's stage dropdown is clicked"
    requirement: DEAL-03
    verification:
      - kind: other
        ref: 'grep -c "stopPropagation" src/features/pipeline/components/StageSelect.tsx == 1'
        status: pass
    human_judgment: false
  - id: D4
    description: "Pipeline table's name/value/owner/closeDate columns are independently inline-editable via EditableCell, with the same guard/error-revert behavior as the drawer, and never trigger the row's onRowClick"
    requirement: DEAL-02
    verification:
      - kind: other
        ref: 'grep -c "stopPropagation" src/features/pipeline/components/EditableCell.tsx >= 2'
        status: pass
      - kind: other
        ref: "npm run build (tsc -b + vite build)"
        status: pass
    human_judgment: true
    rationale: "Structural checks (propagation guard present, project compiles) pass automatically; actual click/edit/commit/revert UX needs interactive browser verification (recorded in .planning/WINDOWS.md as unrun-verify)."
  - id: D5
    description: "No fetch/axios/XMLHttpRequest anywhere in src/features/pipeline or src/data; every write still resolves through dealsRepository"
    verification:
      - kind: other
        ref: 'grep -rE "fetch\\(|axios|XMLHttpRequest" src/features/pipeline src/data'
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-08
status: complete
---

# Phase 02 Plan 01: Deal Detail Drawer & Inline Table Editing Summary

**A click-to-open deal detail Sheet (shadcn) plus click-to-edit-in-place pipeline-table cells, both auto-committing name/value/owner/closeDate through `pipelineStore.updateDeal()` with per-field pending guards and revert-on-failure error banners — DEAL-02 and DEAL-03 complete.**

## Performance
- **Duration:** ~20min
- **Started:** 2026-09-08T06:45:00Z (approx, per STATE.md session continuity)
- **Completed:** 2026-09-08T07:00:36Z
- **Tasks:** 3 completed
- **Files modified:** 13 (4 created, 9 modified)

## Accomplishments
- Clicking any deal row across every pipeline group now opens a real `DealDetailDrawer` (shadcn `Sheet`, generated via `npx shadcn@latest add sheet`) showing the deal's name, company, and current stage
- All four core fields (name, value, owner, closeDate) are independently editable both in the drawer and inline in the pipeline table (`EditableCell`), auto-committing on blur/Enter through `usePipelineStore.updateDeal()`
- `updateDeal` mirrors `moveStage`'s id-based replace pattern, wrapped in try/catch and re-throwing so callers can revert local state and show an error banner (closes the carried-forward `01-REVIEW.md` WR-01 gap for this new write path)
- `StageSelect` and `EditableCell` both stop click propagation so their nested controls never also fire the row's drawer-opening click (D-02/Pitfall 2)
- `Deal.lineItems: LineItem[]` and the widened `DealsRepository.update()` patch type are in place, ready for plan 02-02's line-items UI

## Task Commits
1. **Task 1: End-to-end "open drawer, view full details, edit name"** - `eaa6b90` (feat)
2. **Task 2: Complete drawer core-field editing + guard/error handling + StageSelect propagation fix** - `bea0d3f` (feat)
3. **Task 3: Pipeline-table inline editing via EditableCell (DEAL-02 complete)** - `9e7920c` (feat)

**Plan metadata:** commit created in this same operation (see final commit in git log)

## Files Created/Modified
- `src/shared/types/deal.ts` - `LineItemType`, `LineItem`, `Deal.lineItems` (never-store-derived-value convention preserved: no `subtotal` field)
- `src/data/deals-repository.ts` / `src/data/mock/mock-deals-repository.ts` - `update()` patch type widened to `name`/`value`/`owner`/`closeDate`/`lineItems`
- `src/data/mock/seed-data.ts` - every seeded deal now includes `lineItems: []`
- `src/features/pipeline/store/pipelineStore.ts` - `updateDeal(id, patch)` action, try/catch + re-throw
- `src/components/ui/sheet.tsx` - generated shadcn Sheet primitive (owned source, not hand-edited beyond CLI output)
- `src/features/pipeline/components/deal-edit-schema.ts` - `dealEditSchema`/`DealEditFormValues`/`DealEditFormInput`
- `src/features/pipeline/components/DealDetailDrawer.tsx` - controlled Sheet-based drawer, 4 auto-committing core fields, pendingFields guard, per-field error revert
- `src/features/pipeline/components/EditableCell.tsx` - click-to-edit-in-place cell, currency/date display formatting, propagation guard, pending guard, error revert
- `src/features/pipeline/components/PipelineBoard.tsx` - `selectedDealId` state, mounts `DealDetailDrawer`
- `src/features/pipeline/components/GroupSection.tsx` - `onRowClick` pass-through to `DealTable`
- `src/features/pipeline/components/DealTable.tsx` - row `onClick`, 4 columns swapped to `EditableCell`
- `src/features/pipeline/components/StageSelect.tsx` - wrapping `<div onClick={stopPropagation}>`

## Decisions Made
- **closeDate ISO-vs-date-only normalization:** seed data (`faker.date.soon().toISOString()`) produces a full ISO datetime, but native `<input type="date">` requires exactly `YYYY-MM-DD`. Both `DealDetailDrawer` and `EditableCell` now slice to the date portion wherever the value feeds a date input (initial value, revert-on-failure, and the editing draft), while committing back whatever plain date string the native input itself produces. This is a pre-existing data-shape quirk (Phase 1's `AddDealDialog` already only ever wrote date-only strings; only seed data carries full ISO), not a new decision this phase invents — just made consistent going forward.
- **No new test framework installed** despite two tasks carrying `tdd="true"`: this project has no test runner configured yet (confirmed via `package.json` and `CLAUDE.md`, which explicitly defers Vitest), and the plan's own `<files>` lists never list a test file. Verification relied on `npm run build` (`tsc -b && vite build`) plus the plan's own grep-based structural `<verify>` checks instead.

## Deviations from Plan

**1. [Rule 3 - Blocking issue] `MockDealsRepository.create()` failed to compile after widening `Deal`**
- **Found during:** Task 1, immediately after adding the required `Deal.lineItems` field
- **Issue:** `tsc -b` failed with `Property 'lineItems' is missing in type ... but required in type 'Deal'` at `create()`'s object literal — the plan's action list didn't call out `create()` even though it also constructs a full `Deal`.
- **Fix:** Added `lineItems: []` to the `Deal` object `create()` builds, with a comment noting new deals start empty (line items are added post-creation via 02-02, not through the Add Deal form).
- **Files modified:** `src/data/mock/mock-deals-repository.ts`
- **Verification:** `npm run build` exits 0
- **Committed in:** `eaa6b90`

**2. [Rule 1 - Bug] `closeDate` full-ISO value would render blank in native date inputs**
- **Found during:** Task 2, while wiring the drawer's `closeDate` field, and Task 3, while wiring `EditableCell`'s date formatting
- **Issue:** Binding `deal.closeDate` (a full ISO datetime string for every seeded deal) directly to `<input type="date">` produces an unparseable value per the HTML date-input spec, so the field would render empty and any edit would silently discard the existing date instead of showing it.
- **Fix:** Both `DealDetailDrawer` (initial `values`, and the revert-on-failure path) and `EditableCell` (`toEditableValue` helper, used for the initial draft, the edit-mode draft, and the Escape-revert/failure-revert draft) now slice `closeDate` to its first 10 characters before feeding a date input.
- **Files modified:** `src/features/pipeline/components/DealDetailDrawer.tsx`, `src/features/pipeline/components/EditableCell.tsx`
- **Verification:** `npm run build` exits 0; manual code-path trace confirms both a fresh seed deal (full ISO) and a user-added deal (already date-only) produce a valid date-input value
- **Committed in:** `bea0d3f` (drawer), `9e7920c` (EditableCell)

**3. [Rule 2 - Missing critical] Added an `isPending` re-entrancy guard inside `EditableCell`'s commit handler**
- **Found during:** Task 3, while implementing the Enter-key and blur commit paths
- **Issue:** The plan's reference pattern (02-PATTERNS.md) calls `commit()` from both `onKeyDown` (Enter) and `onBlur` with no guard between them; a native blur firing immediately after an Enter-triggered commit could re-invoke `commit()` with a stale closure before the store update resolves, calling `updateDeal` twice for the same field.
- **Fix:** Added `if (isPending || draft === lastCommitted) return;` at the top of `commit()`, converging on the plan's already-required "commit in flight disables re-entry" behavior line for Task 3.
- **Files modified:** `src/features/pipeline/components/EditableCell.tsx`
- **Verification:** `npm run build` exits 0; code inspection confirms the guard short-circuits a second concurrent invocation
- **Committed in:** `9e7920c`

---
**Total deviations:** 3 auto-fixed (1 Rule 3 blocking-fix, 1 Rule 1 bug-fix applied across 2 files, 1 Rule 2 missing-critical addition)
**Impact on plan:** All three are small, localized fixes required for the plan's own stated behavior to actually work (or to compile at all) — no scope growth beyond the plan's four core fields, no new dependencies, no architectural change.

## Issues Encountered
None blocking. The plan's `<verify>` blocks each include a `human-check` step (open the dev server, click a row, edit a field, confirm visually) that was not run interactively this session — only `npm run build` (`tsc -b` + `vite build`) and the plan's grep-based structural checks were executed. Both are recorded as `unrun-verify` entries in `.planning/WINDOWS.md` (ids 1-2) for `/gsd-verify-work` or manual UAT to pick up.

## User Setup Required
None - no external service configuration required (frontend-only, mock data, no auth).

## Next Phase Readiness
- `Deal.lineItems: LineItem[]` and the widened `DealsRepository.update()`/`updateDeal()` patch types are in place and unused by any UI yet — ready for plan 02-02 to add the `LineItemsTable` and value-rollup UI without another repository/store change
- `deal-edit-schema.ts` currently exports only `dealEditSchema`/`DealEditFormValues`/`DealEditFormInput` — 02-02 is expected to extend this same file with `lineItemSchema`/`lineItemsSchema` per 02-PATTERNS.md
- Two `unrun-verify` items are open in `.planning/WINDOWS.md` for this plan's human-check verification steps; ready for `/gsd-verify-work` or a manual UAT pass before Phase 2 is considered fully signed off
- Ready for 02-02 (line items plan, depends on this one)

---
*Phase: 02-deal-detail-line-items*
*Completed: 2026-09-08*

## Self-Check: PASSED

All 4 created files verified present on disk; all 3 task commits (`eaa6b90`, `bea0d3f`, `9e7920c`) verified present in `git log`.

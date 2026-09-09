---
phase: 260909-o2k-from-the-add-deal-modal-remove-the-value
plan: 1
subsystem: ui
tags: [react-hook-form, zod, add-deal-wizard]

requires: []
provides:
  - Add Deal modal step 1 with no Value input/label
  - addDealStep1Schema.value relaxed to .nonnegative() so the silent 0 default validates
affects: [pipeline-add-deal-flow]

actuals:
  tokens: 617
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/features/pipeline/components/add-deal-schema.ts
    - src/features/pipeline/components/AddDealDialog.tsx

key-decisions:
  - "Kept value in AddDealFormValues/NewDealInput/DEFAULT_VALUES as a silent 0 rather than removing the field entirely, since deal-edit-schema.ts and the pipeline table still read/display a Value that is computed later from line items."

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "Add Deal modal step 1 no longer shows a Value input/label"
    verification:
      - kind: manual_procedural
        ref: "grep '! grep -q name=\"value\"' AddDealDialog.tsx (Task 2 automated verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "addDealStep1Schema.value accepts 0 via .nonnegative() instead of rejecting it via .positive()"
    verification:
      - kind: unit
        ref: "grep -c nonnegative add-deal-schema.ts (Task 1 automated verify)"
        status: pass
    human_judgment: false
  - id: D3
    description: "npm run build and npm run lint pass clean for the changed files"
    verification:
      - kind: other
        ref: "npm run build (tsc -b && vite build) — 0 errors"
        status: pass
      - kind: other
        ref: "npm run lint — 0 new problems in add-deal-schema.ts / AddDealDialog.tsx"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-09-09
status: complete
---

# Quick Task 260909-o2k: Remove Value Input from Add Deal Modal Summary

**Removed the manual Value input from Add Deal wizard step 1; value now ships silently as the computed-default 0, matching the app's zero-line-item convention.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Relaxed `addDealStep1Schema.value` from `.positive()` to `.nonnegative()` so the unedited default of `0` validates.
- Deleted the Value `Controller`/`Field`/`Input` block from step 1 of `AddDealDialog.tsx` and removed `"value"` from `handleNext`'s `form.trigger` validation array.
- Confirmed `DEFAULT_VALUES.value` stays `0` and still flows through `onSubmit` → `addDeal()` → `NewDealInput.value` unchanged.
- `npm run build` and `npm run lint` both pass clean for the two changed files (pre-existing, unrelated lint errors exist elsewhere in the repo — see Issues Encountered).

## Task Commits

Each task was committed atomically:

1. **Task 1: Relax `value` schema constraint from positive to non-negative** - `21218f0` (fix)
2. **Task 2: Remove the Value input from step 1 of AddDealDialog** - `2807fe8` (feat)

## Files Created/Modified
- `src/features/pipeline/components/add-deal-schema.ts` - `addDealStep1Schema.value` now `.nonnegative()` instead of `.positive()`
- `src/features/pipeline/components/AddDealDialog.tsx` - Removed step-1 Value input block and dropped `"value"` from `handleNext`'s validation array

## Decisions Made
- Did not remove `value` from the schema/type/`DEFAULT_VALUES` — only relaxed its constraint and stopped rendering an input for it, per plan instructions, since it's still a required field on `NewDealInput` consumed by `addDeal()`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` reports 557 pre-existing errors/warnings across the repo (mostly `@typescript-eslint/no-require-imports` in `.claude/gsd-core`/`.claude/scripts` tooling files, plus a `react-refresh` warning in `button.tsx` and a React Compiler warning in `LineItemsTable.tsx`). None are in `add-deal-schema.ts` or `AddDealDialog.tsx` — confirmed via targeted grep of lint output. Pre-existing and out of scope per this plan's scope boundary; not fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Add Deal wizard step 1 now matches the plan's target state (Name, Company, Owner, Close Date, Stage only).
- No blockers for subsequent work on the pipeline/deal-terms features.

---
*Phase: 260909-o2k-from-the-add-deal-modal-remove-the-value*
*Completed: 2026-09-09*

## Self-Check: PASSED
- FOUND: src/features/pipeline/components/add-deal-schema.ts
- FOUND: src/features/pipeline/components/AddDealDialog.tsx
- FOUND: .planning/quick/260909-o2k-from-the-add-deal-modal-remove-the-value/260909-o2k-SUMMARY.md
- FOUND: commit 21218f0
- FOUND: commit 2807fe8

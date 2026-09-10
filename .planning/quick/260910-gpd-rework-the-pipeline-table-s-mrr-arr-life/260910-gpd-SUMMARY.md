---
phase: 260910-gpd-rework-the-pipeline-table-s-mrr-arr-life
plan: 1
subsystem: ui
tags: [line-items, financial-metrics, react, deal-terms]

requires:
  - phase: 260910-fl6-remove-the-arpu-mrr-arr-and-lifetime-con
    provides: "Purely-derived, never-stored computation pattern for financial metrics in deal-metrics.ts, and their display as pipeline-table columns"
provides:
  - "computeMrr/computeArr/computeLifetimeContractValue corrected to derive from line-item type (product vs service) instead of Deal.value/Deal.frequency"
  - "ARPU calculation and column removed entirely"
  - "MRR and ARR no longer rendered as pipeline-table columns, though their corrected calculations remain exported for future use"
affects: []

actuals:
  tokens: 2100
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Line-item-type-filtered aggregation (type === 'service' vs 'product') feeding derived financial metrics, reusing computeSubtotal from line-items.ts"

key-files:
  created: []
  modified:
    - src/shared/utils/deal-metrics.ts
    - src/features/pipeline/components/DealTable.tsx
    - src/shared/types/deal.ts

key-decisions:
  - "MRR = sum of (units x unitPrice) across service-type line items only; Deal.frequency plays no role in MRR/ARR anymore (previously it incorrectly normalized by billing period)"
  - "Lifetime Contract Value = sum of product-type line item subtotals + MRR x contractTermMonths — now includes the one-time product-purchase total, and never returns null (the product portion is always meaningful even when Contract Term is unset)"
  - "ARPU removed entirely per explicit user follow-up direction, mid-execution, after the original executor stalled on a rate limit — not part of the original plan's formula set as ultimately shipped"
  - "MRR and ARR columns hidden from the pipeline table per the same follow-up direction, but their compute functions remain exported from deal-metrics.ts rather than deleted ('keep the data')"

patterns-established:
  - "Line-item-type-filtered financial aggregation as the basis for recurring-revenue metrics, rather than deriving from a deal-level Value/Frequency pair"

requirements-completed: []

coverage:
  - id: D1
    description: "MRR/ARR calculations are corrected to sum only service-type line items (units x unitPrice), independent of Deal.frequency"
    verification:
      - kind: unit
        ref: "Standalone tsx execution of computeMrr/computeArr against the plan's worked example (18 units, two services at $224/$5) — MRR=4122, ARR=49464, both matching the expected values exactly"
        status: pass
      - kind: unit
        ref: "npm run build (tsc -b && vite build)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Lifetime Contract Value = product-type subtotal + MRR x Contract Term, never null"
    verification:
      - kind: unit
        ref: "Standalone tsx execution against the plan's worked example (10 products @ $300, $5/unit service x10, 60-month term) — LTV=6000, matching expected"
        status: pass
    human_judgment: false
  - id: D3
    description: "ARPU calculation and column are removed entirely; MRR/ARR columns no longer render in the pipeline table"
    verification:
      - kind: unit
        ref: "grep confirms no computeArpu references remain in src/; DealTable.tsx no longer imports or renders mrr/arr/arpu columnHelper.display blocks"
        status: pass
      - kind: unit
        ref: "npm run build && npx eslint on all 3 touched files"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation that the pipeline table renders correctly with only Lifetime Contract Value remaining among the 4 original new columns (no layout regression) was not performed in this headless worktree run."
---

# Quick Task 260910-gpd: MRR/ARR/Lifetime Contract Value Formula Correction Summary

**Corrected MRR/ARR/Lifetime Contract Value to derive from line-item type (product vs service) instead of Deal.value/Deal.frequency, and removed ARPU entirely per mid-execution follow-up direction.**

## Performance

- **Duration:** ~20 min (across an interrupted executor run + orchestrator-completed salvage)
- **Started:** 2026-09-10 (executor dispatch)
- **Completed:** 2026-09-10
- **Tasks:** 1 (effectively; see Deviations)
- **Files modified:** 3

## Accomplishments
- `computeMrr` now sums `units x unitPrice` across only `type: "service"` line items — `Deal.frequency` no longer factors into MRR/ARR.
- `computeLifetimeContractValue` now adds the one-time product-purchase total (`type: "product"` line item subtotals) to the recurring service revenue (`MRR x contractTermMonths`), and never returns `null`.
- `computeArpu` and its pipeline-table column were removed entirely.
- MRR and ARR are no longer rendered as pipeline-table columns, but their corrected compute functions remain exported from `deal-metrics.ts`.
- Two stale doc comments in `deal.ts` (still describing the old value/frequency-based derivation, and still mentioning ARPU) were corrected.
- All three of CONTEXT.md's worked examples (MRR=4122, LTV=6000, and the original plan's ARPU=900 prior to its removal) were independently verified via standalone `tsx` execution against the actual implementation, not just code inspection.

## Task Commits

1. **Formula correction + ARPU removal + column changes** - `d5c7750` (fix)

## Files Created/Modified
- `src/shared/utils/deal-metrics.ts` - `computeMrr`/`computeArr`/`computeLifetimeContractValue` rewritten to the line-item-type-based formulas; `computeArpu` deleted entirely
- `src/features/pipeline/components/DealTable.tsx` - `mrr`/`arr`/`arpu` `columnHelper.display()` blocks removed; `lifetimeContractValue`'s cell simplified (no longer needs a null-check)
- `src/shared/types/deal.ts` - two stale doc comments updated to describe the new derivation and drop ARPU references

## Decisions Made
- ARPU's removal and MRR/ARR's column-hiding (while keeping their calculations) were user-directed corrections that arrived mid-execution, after the original plan (which still included a corrected ARPU formula) had been verified by the plan-checker but before its executor could commit. The orchestrator completed the plan's Task 1 scope (already substantially done by the interrupted executor) and folded in the new direction directly, rather than re-running the full quick-task pipeline a third time for what was now a small, well-understood delta.
- See `260910-gpd-CONTEXT.md` for the full locked-decision history (3 rounds of clarification establishing the MRR/LTV/ARPU formulas) — ARPU's formula there is now moot (superseded by its removal) but preserved as the historical record of how the formulas were derived.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 4 - Architectural/scope change, user-directed] ARPU removed; MRR/ARR columns hidden**
- **Found during:** Mid-execution — the original executor agent hit an API rate limit after completing Task 1's formula corrections (including a working ARPU implementation) but before committing or starting Task 2. The user then sent new direction while the failure was being triaged: remove ARPU (calculation and column) entirely, and remove the MRR/ARR columns from display while keeping their calculations.
- **Fix:** The orchestrator inspected the stalled worktree's uncommitted `deal-metrics.ts` diff (MRR/ARR/LTV formulas were already correct and worked-example-verified via the plan-checker), removed the `computeArpu` function, updated `DealTable.tsx` to drop the `mrr`/`arr`/`arpu` columns while keeping the `computeMrr`/`computeArr` exports intact, and updated `deal.ts`'s stale doc comments — completing the plan's remaining scope directly rather than re-dispatching a fresh executor.
- **Files modified:** `src/shared/utils/deal-metrics.ts`, `src/features/pipeline/components/DealTable.tsx`, `src/shared/types/deal.ts`
- **Verification:** `npm run build`, `npx eslint` on all 3 files, and standalone `tsx` execution of the 3 worked examples (MRR/ARR/LTV) all pass.
- **Committed in:** `d5c7750`

---

**Total deviations:** 1 (user-directed scope change mid-execution, not a bug — reclassified as Rule 4 for documentation purposes since it altered the plan's shipped scope).
**Impact on plan:** The plan's original ARPU formula (verified correct by the plan-checker) was implemented, then removed per the user's explicit follow-up instruction. MRR/ARR/LTV formula corrections shipped as planned; only their table-column visibility changed.

## Issues Encountered
- The original executor agent's dispatch failed with an API rate-limit error (`You've hit your session limit`) partway through Task 1, before any commit. No code was lost — the uncommitted worktree diff was inspected and found correct, then completed directly.

## Known Stubs

None — MRR/ARR/LTV are fully wired end-to-end with corrected formulas; ARPU was deliberately and completely removed, not stubbed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- No blockers. `computeMrr`/`computeArr` remain available in `deal-metrics.ts` for future re-display or other use if ever needed.
- Confidence Level's Phase 4 forecast-weighting decision (recorded in STATE.md from an earlier quick task) is unaffected by this change.

---
*Task: 260910-gpd*
*Completed: 2026-09-10*

---
phase: 260910-fl6-remove-the-arpu-mrr-arr-and-lifetime-con
verified: 2026-09-10T00:00:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260910-fl6: Remove ARPU/MRR/ARR/Lifetime Contract Value inputs, add derived columns — Verification Report

**Task Goal:** Remove the ARPU, MRR, ARR, and Lifetime Contract Value input fields from the Add Deal wizard's step 2. Compute them from data already captured on the deal (Value, Frequency, Contract Term, and line-item units for ARPU) and display them as new columns in the main pipeline table. Customer Type and Confidence Level stay in the Add Deal wizard as-is.

**Verified:** 2026-09-10
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Add Deal wizard step 2 no longer renders ARPU/MRR/ARR/Lifetime Contract Value inputs; Customer Type and Confidence Level remain as-is | ✓ VERIFIED | `AddDealDialog.tsx` step-2 `FieldGroup` (lines 220–371) renders exactly 7 `Controller`s: prorata, gracePeriodDays, contractTermMonths, frequency, currency, customerType, confidenceLevel. No financial-field Controllers, `useEffect`/`useWatch`/`FieldDescription` imports, or `DEFAULT_VALUES` entries remain. `customerType`/`confidenceLevel` Controllers, options arrays, and defaults (`"similar"` / `"open-to-rfp"`) are byte-identical to pre-change shape. |
| 2 | `Deal`/`NewDealInput` no longer declare arpu/mrr/arr/lifetimeContractValue; repository/seed-data don't generate them; all 40 seed deals satisfy the trimmed type | ✓ VERIFIED | `deal.ts` (lines 57–119): neither interface declares any of the 4 fields. `mock-deals-repository.ts`'s `create()` (lines 39–64) passes through only `customerType`/`confidenceLevel` from deal-terms. `seed-data.ts`'s `buildSeedDeal()` (lines 34–76) generates no financial fields; `npm run build` (`tsc -b`) exits 0, confirming all 40 seed deals + `create()` output type-check against the trimmed `Deal`. |
| 3 | Main pipeline table renders 4 new columns computed live from value/frequency/contractTermMonths/lineItems, formatted like the Value column | ✓ VERIFIED | `DealTable.tsx` lines 59–84: 4 `columnHelper.display()` entries (`mrr`, `arr`, `lifetimeContractValue`, `arpu`), each calling `computeMrr`/`computeArr`/`computeLifetimeContractValue`/`computeArpu` from `deal-metrics.ts` on `info.row.original` and formatting with the same `currencyFormatter` (`Intl.NumberFormat("en-US", {style:"currency", currency:"USD", maximumFractionDigits:0})`) construction used by the Value column via `EditableCell.tsx`. |
| 4 | Zero-line-item deal shows em dash for ARPU, never 0/NaN/Infinity | ✓ VERIFIED | `deal-metrics.ts` `computeArpu` (lines 52–55): returns `null` when `totalUnits === 0` (no division occurs). `DealTable.tsx` lines 77–84 branches `arpu === null ? "—" : currencyFormatter.format(arpu)`. |
| 5 | Editing a deal's Value (inline or via line items) changes displayed MRR/ARR/LTV/ARPU on next render — none of the 4 is a stored field | ✓ VERIFIED | Column `cell` functions call `computeX(info.row.original)` directly with no memoization/caching. `EditableCell.tsx`'s `commit()` calls `usePipelineStore.getState().updateDeal(dealId, {value: ...})`, which updates the store's `deals` array; `DealTable` re-renders from the updated `deals` prop, so every cell recomputes from the fresh `Deal` object on the next render — no stale duplicate storage exists for any of the 4 values. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/utils/deal-metrics.ts` | New pure derived-value module: computeMrr/computeArr/computeLifetimeContractValue/computeArpu | ✓ VERIFIED | Exists, 56 lines. All 4 named exports present, `Pick<Deal, ...>`-typed, no side effects, mirrors `line-items.ts` convention. |
| `src/features/pipeline/components/DealTable.tsx` | 4 new columnHelper.display() columns wired to deal-metrics.ts | ✓ VERIFIED | 7 total `columnHelper.display()` calls (expand, mrr, arr, lifetimeContractValue, arpu, stage, id); imports all 4 compute functions. |
| `src/shared/types/deal.ts` | Deal/NewDealInput trimmed, customerType/confidenceLevel kept | ✓ VERIFIED | Financial fields absent from both interfaces; customerType/confidenceLevel present with updated doc comments. |
| `src/features/pipeline/components/add-deal-schema.ts` | addDealStep2Schema trimmed to 7 fields | ✓ VERIFIED | Schema object has exactly 7 keys: prorata, gracePeriodDays, contractTermMonths, frequency, currency, customerType, confidenceLevel. |
| `src/features/pipeline/components/AddDealDialog.tsx` | Step 2 renders 7 fields only; dangling imports gone | ✓ VERIFIED | 399 lines (< 450 threshold); no `useEffect`/`useWatch`/`FieldDescription` references anywhere in file. |
| `src/data/mock/mock-deals-repository.ts` | create() passes through only customerType/confidenceLevel | ✓ VERIFIED | Confirmed at lines 52–64. |
| `src/data/mock/seed-data.ts` | buildSeedDeal() no longer generates financial fields or hoisted mrr const | ✓ VERIFIED | No `mrr` const; `contractTermMonths` inlined directly into return object. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `DealTable.tsx` | `deal-metrics.ts` | `columnHelper.display({ cell: (info) => currencyFormatter.format(computeX(info.row.original)) })` | ✓ WIRED | Import present (line 20), all 4 functions called in column `cell` definitions. |
| `deal-metrics.ts` | `deal.ts` | `Pick<Deal, "value" \| "frequency" \| "contractTermMonths" \| "lineItems">` param typing | ✓ WIRED | All 4 exported functions use `Pick<Deal, ...>` parameter types as specified. |
| `AddDealDialog.tsx` | `add-deal-schema.ts` | `addDealStep2Schema.shape` spread into `addDealSchema` | ✓ WIRED | `add-deal-schema.ts` line 60–63 spreads both step schemas' shapes; `AddDealFormValues`/`AddDealFormInput` shrink automatically. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full production build type-checks and bundles | `npm run build` | `tsc -b && vite build` exits 0, 2546 modules transformed | ✓ PASS |
| Lint on all 7 modified/created files | `npx eslint <7 files>` | No output, exit 0 | ✓ PASS |
| No debt markers in touched files | `grep -nE "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across 7 files | No matches | ✓ PASS |
| No lingering stored-field references to arpu/lifetimeContractValue outside deal-metrics.ts/DealTable.tsx | `grep -rn "arpu\|lifetimeContractValue" src/` | Only matches in `deal-metrics.ts` and `DealTable.tsx` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| DEAL-06 | 260910-fl6-PLAN.md | Deal-terms fields on Add Deal wizard step 2 | ✓ SATISFIED | Step 2 retains the 5 original deal-terms fields plus customerType/confidenceLevel; financial-metric inputs correctly removed per this corrective task. |

### Anti-Patterns Found

None in the 7 files this quick task touched.

### Code Review Follow-Up (260910-fl6-REVIEW.md)

| Finding | Disposition | Verified |
|---------|-------------|----------|
| WR-02: `computeLifetimeContractValue` returned `0` instead of `null` for `contractTermMonths === 0` | Fixed in commit `7cc9dc8` | ✓ CONFIRMED — `deal-metrics.ts` lines 39–43 now returns `null` when `contractTermMonths === 0`; `DealTable.tsx` lines 69–75 branches on `null` → renders `"—"`. |
| WR-01: New deals always compute $0 across all 4 metrics because `value` isn't collected in wizard step 1 | Assessed as pre-existing behavior from a separate prior task (260909-o2k, commit `2807fe8`), not a defect introduced by this quick task; correctly out of scope | ✓ AGREE — confirmed `addDealStep1Schema` still requires `value` and `DEFAULT_VALUES.value` is hardcoded `0` with no Value `Controller` in step 1's `FieldGroup`; this predates 260910-fl6 and its scope is explicitly "remove ARPU/MRR/ARR/LTV inputs," not "restore Value input." Not a blocker for this task's goal. |
| IN-01/IN-02: hardcoded-USD formatter, duplicated `currencyFormatter` | Informational, pre-existing pattern, not introduced by this task | Not a gap for this task's scope. |

### Human Verification Required

None — all must-haves are verifiable via static code inspection, `tsc`, and `eslint`; no runtime-only behavior (visual layout, real-time UX feel) is in scope for this correction task beyond what's already confirmed structurally (no caching between render and store update).

### Gaps Summary

None. All 5 must-have truths verified, all 7 required artifacts present/substantive/wired, all 3 key links wired, build and lint both exit 0, and the previously-flagged WR-02 code-review bug is confirmed fixed in the current codebase (not just claimed in SUMMARY.md).

---

_Verified: 2026-09-10_
_Verifier: Claude (gsd-verifier)_

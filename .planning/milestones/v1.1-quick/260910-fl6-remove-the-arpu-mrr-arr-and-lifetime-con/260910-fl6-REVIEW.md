---
phase: 260910-fl6-remove-the-arpu-mrr-arr-and-lifetime-con
reviewed: 2026-09-10T08:40:45Z
depth: quick
files_reviewed: 7
files_reviewed_list:
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
  - src/features/pipeline/components/AddDealDialog.tsx
  - src/features/pipeline/components/DealTable.tsx
  - src/features/pipeline/components/add-deal-schema.ts
  - src/shared/types/deal.ts
  - src/shared/utils/deal-metrics.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 260910-fl6: Code Review Report

**Reviewed:** 2026-09-10T08:40:45Z
**Depth:** quick
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the revert of the manually-entered ARPU/MRR/ARR/Lifetime Contract Value wizard fields and the new pure derived-value module (`deal-metrics.ts`) that replaces them. The revert itself (`add-deal-schema.ts`, `deal.ts`, `mock-deals-repository.ts`, `seed-data.ts`, `AddDealDialog.tsx`) is clean — verified against the actual git diff (`e039f97`): all 4 financial fields and their validation chains, default values, and the MRR-driven `useWatch`/`useEffect` auto-calc block were fully removed, with no orphaned schema entries, unused imports, or dangling doc references left behind. `tsc --noEmit` and `eslint` both pass clean on all 7 files.

`computeMrr`/`computeArr`/`computeArpu`/`computeLifetimeContractValue` in `deal-metrics.ts` are correctly division-by-zero-safe: `PERIOD_MONTHS` covers all 5 `DealFrequency` enum values (never 0), so `computeMrr`/`computeArr` can never divide by zero, and `computeArpu` correctly special-cases zero line items to return `null` rather than 0/NaN/Infinity, with `DealTable.tsx` correctly branching on that `null` to render `"—"`.

Two data-correctness/consistency issues remain, both interaction effects between this change and pre-existing code rather than new bugs introduced in `deal-metrics.ts` itself — see Warnings below.

## Warnings

### WR-01: New deals always compute to $0 across all 4 new metrics columns because `value` is never collected in the Add Deal wizard

**File:** `src/features/pipeline/components/AddDealDialog.tsx:75-89` (see also `add-deal-schema.ts:9-16`, `DealTable.tsx:59-81`)
**Issue:** A prior quick task (`260909-o2k`, commit `2807fe8`) removed the Value `Controller`/`Input` from Add Deal wizard step 1, but `value` remains a required field in `addDealStep1Schema` and `DEFAULT_VALUES.value` stays hardcoded at `0` — the commit message itself acknowledges this is "still submitted silently to addDeal()". Every deal created through the dialog therefore always has `value: 0` (and `lineItems: []`, per `mock-deals-repository.ts:51`) at creation time. Because `deal-metrics.ts`'s new `computeMrr`/`computeArr`/`computeLifetimeContractValue` are all directly proportional to `value`, and `computeArpu` divides `value` by total line-item units (not by a "has value been set" check), the 4 newly-added columns (`MRR`, `ARR`, `Lifetime Contract Value`, `ARPU`) will render as `$0` (not the `"—"` empty-state used elsewhere) for every single newly-created deal until a user manually edits `Value` inline in the table afterward. This isn't a bug in `deal-metrics.ts`'s formulas — they're correctly computing $0 from a true $0 input — but it means the new columns visibly misrepresent every freshly-created deal as having zero MRR/ARR/LTV/ARPU, which is indistinguishable in the UI from "this deal is genuinely worthless."
**Fix:** Either restore a Value input to wizard step 1 (reverting `2807fe8`), or have `AddDealDialog`/`MockDealsRepository.create()` seed `value` from the deal's eventual line-item sum once entered, so the new metrics columns don't universally read $0 for every new deal. At minimum, flag this as a known gap if intentional.

### WR-02: `computeLifetimeContractValue` returns `0`, not `null`, when `contractTermMonths` is the documented "not yet set" sentinel value

**File:** `src/shared/utils/deal-metrics.ts:32-37`
**Issue:** `add-deal-schema.ts:22-23` documents that `contractTermMonths` (and `gracePeriodDays`) explicitly default to and allow `0` as "a valid 'no grace period'/'not yet set' state" — the same class of "no basis yet" condition that `computeArpu` treats as null-worthy (zero line items → no unit basis → `null`). But `computeLifetimeContractValue` has no equivalent branch: `computeMrr(deal) * 0` always evaluates to `0`, and `DealTable.tsx:69-73` renders that as `currencyFormatter.format(0)` → `"$0"`, with no `"—"` fallback the way the ARPU column has (`DealTable.tsx:77-80`). A deal whose contract term simply hasn't been set yet is visually indistinguishable from a deal with a confirmed $0 lifetime value.
**Fix:** Mirror the `computeArpu` null pattern — e.g. `return deal.contractTermMonths === 0 ? null : computeMrr(deal) * deal.contractTermMonths;` — and update the `lifetimeContractValue` column cell to branch on `null` and render `"—"` like the ARPU column does.

## Info

### IN-01: New currency-metric columns inherit a pre-existing hardcoded-USD formatter, ignoring the per-deal `currency` field

**File:** `src/features/pipeline/components/DealTable.tsx:25-29` (mirrors `EditableCell.tsx:7-11`)
**Issue:** `currencyFormatter` is hardcoded to `currency: "USD"` even though `Deal.currency` is a per-deal `"USD" | "EUR" | "GBP"` field captured in the wizard's step 2. This was already true of the existing `Value` column (via `EditableCell.tsx`) before this change, so it isn't a regression introduced here, but the 4 new `columnHelper.display()` columns (`MRR`, `ARR`, `Lifetime Contract Value`, `ARPU`) all reuse the same hardcoded-USD instance, tripling the surface area where a deal recorded in EUR or GBP will show a `$` sign instead of `€`/`£` across the table.
**Fix:** When addressed, parameterize the formatter by `deal.currency` (e.g. a `formatCurrency(amount, currency)` helper) and apply it consistently to `Value` and all 4 new columns in the same pass.

### IN-02: `currencyFormatter` is duplicated verbatim between `DealTable.tsx` and `EditableCell.tsx`

**File:** `src/features/pipeline/components/DealTable.tsx:25-29`, `src/features/pipeline/components/EditableCell.tsx:7-11`
**Issue:** Both files independently construct an identical `new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`. This predates the current change but now has a second consumer within the same file (5 total call sites across `DealTable.tsx`'s columns) reinforcing the case for extracting it.
**Fix:** Extract to a single shared `formatCurrency`/`currencyFormatter` export (e.g. in `shared/utils/`) and import it from both files.

---

_Reviewed: 2026-09-10T08:40:45Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_

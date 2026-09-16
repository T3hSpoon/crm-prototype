---
phase: 260910-ec8-add-three-new-field-groups-to-the-add-de
reviewed: 2026-09-10T00:00:00Z
depth: quick
files_reviewed: 5
files_reviewed_list:
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
  - src/features/pipeline/components/AddDealDialog.tsx
  - src/features/pipeline/components/add-deal-schema.ts
  - src/shared/types/deal.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 260910-ec8: Code Review Report

**Reviewed:** 2026-09-10T00:00:00Z
**Depth:** quick (pattern scan found nothing; escalated to a targeted read of the new auto-calc effect per reviewer instructions, since that's the highest-risk new code in this change)
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Customer Type/Confidence Level/financial-fields addition to the Add Deal wizard, focused on the new `useWatch` + `useEffect` + `dirtyFields`-gated auto-calc for ARR / Lifetime Contract Value. No hardcoded secrets, dangerous functions, or debug artifacts were found via pattern scan. The auto-calc effect's core loop-avoidance design is sound (it watches only `mrr`/`contractTermMonths` and writes only `arr`/`lifetimeContractValue`, so it cannot re-trigger itself; `form.formState.dirtyFields` is read live via RHF's stable object, so there's no stale-closure bug there). However, tracing the actual JS truthiness/coercion behavior surfaced a real data-consistency bug when MRR is cleared, plus two related edge-case gaps around the new optional numeric fields, and two lower-priority quality notes in the mock repository.

## Warnings

### WR-01: Clearing MRR leaves ARR / Lifetime Contract Value stuck at stale auto-calculated numbers

**File:** `src/features/pipeline/components/AddDealDialog.tsx:128-137`
**Issue:** The auto-calc effect guards with `if (!mrr || Number.isNaN(mrrNum)) return;`. Because RHF's `Controller` stores the raw DOM string, typing `"0"` is truthy in JS (`!"0"` is `false`) so that case is actually handled correctly — but *clearing* the MRR input entirely sets the watched value to `""`, which is falsy (`!""` is `true`), so the effect returns early and never re-runs the ARR/LTV calculation. The two derived fields keep whatever value was last computed before the clear.

Concretely: user types MRR `500` → ARR auto-fills `6000`. User then deletes the MRR text back to empty. `mrr` becomes `""`; the effect bails out; ARR stays `6000`. On submit, `arpu`/`mrr`/`arr`/`lifetimeContractValue` all run through `z.coerce.number()` (see WR-02) — `mrr` becomes `0` while `arr` stays `6000`, so the persisted `Deal` has `mrr: 0, arr: 6000`, an internally inconsistent record silently written into the pipeline data.

Compare with `contractTermMonths`, whose handling in the same effect (`const termNum = Number(contractTermMonths) || 0;`) *does* correctly fall back to `0` on empty — only the `mrr` branch has this asymmetric gap.
**Fix:**
```tsx
useEffect(() => {
  const mrrNum = Number(mrr) || 0; // treat "" and NaN as 0, not "skip"
  if (Number.isNaN(mrrNum)) return; // still guard truly invalid input
  if (!form.formState.dirtyFields.arr) {
    form.setValue("arr", mrrNum * 12, { shouldDirty: false, shouldValidate: false });
  }
  if (!form.formState.dirtyFields.lifetimeContractValue) {
    const termNum = Number(contractTermMonths) || 0;
    form.setValue("lifetimeContractValue", mrrNum * termNum, { shouldDirty: false, shouldValidate: false });
  }
}, [mrr, contractTermMonths]);
```

### WR-02: Optional financial fields collapse to `0` instead of staying `undefined` once touched-then-cleared

**File:** `src/features/pipeline/components/add-deal-schema.ts:51-74`, `src/features/pipeline/components/AddDealDialog.tsx:406-486`
**Issue:** `arpu`, `mrr`, `arr`, and `lifetimeContractValue` are declared `.optional()` specifically because, per the code comment, "early-stage deals often lack firm numbers yet." `z.coerce.number()` only skips coercion when the RHF field value is literally `undefined` (the untouched default). Once a user types into one of these fields and then deletes the text, the Controller's value becomes `""` (not `undefined`), and `z.coerce.number()` runs `Number("")` → `0`. So there is no way, once a field has been interacted with, to submit it back to "unset" — the closest a user can get is an explicit `0`, which is a materially different, misleading signal (e.g., "confirmed $0 ARPU" vs. "ARPU not yet known") for a CRM that presumably drives a forecast page off these numbers.
**Fix:** Either display the fields as truly optional (map `""` back to `undefined` before it reaches the resolver, e.g. via a custom `onChange` that calls `field.onChange(raw === "" ? undefined : raw)`), or accept the current behavior but change the field descriptions/placeholder copy so it doesn't claim "optional" when the practical minimum once touched is `0`.

### WR-03: No way to revert an ARR / Lifetime Contract Value manual override back to auto-calc within the same session

**File:** `src/features/pipeline/components/AddDealDialog.tsx:131-144`
**Issue:** Once a user edits the ARR or Lifetime Contract Value field directly, RHF marks it dirty (`formState.dirtyFields.arr` / `.lifetimeContractValue`), permanently disabling auto-calc for that field for the rest of the dialog session — by design, per the code comment. But RHF computes "dirty" by comparing the current value to the field's *default* value (`undefined`), not by tracking "was this field ever edited." Clearing the field back to `""` does not equal `undefined`, so the field stays marked dirty; there is no UI affordance (e.g., a "reset to auto" button) to clear the dirty flag short of canceling/reopening the whole wizard. Combined with WR-02, a user who "gives up" and blanks the field to let auto-calc take back over will instead submit `0` for that field forever, with auto-calc still disabled.
**Fix:** Either add an explicit "reset to auto-calculated" affordance that calls `form.resetField("arr", { defaultValue: undefined })` (which clears the dirty flag), or accept the one-way-override design but document it in the `FieldDescription` copy so it isn't misleading ("Auto-calculated from MRR unless edited directly" implies clearing would restore auto-calc, which it does not).

## Info

### IN-01: `generateDealId()` has no uniqueness check against existing deal ids

**File:** `src/data/mock/mock-deals-repository.ts:9-15`
**Issue:** The 10-digit numeric id is generated purely from `Math.random()` with no check against `this.deals` for a collision. At current seed scale (~40 deals) the odds are negligible, but `update(id, ...)` looks up deals by `findIndex((d) => d.id === id)` and silently updates the *first* match — a collision (how ever unlikely) would cause one deal's edits to silently land on a different deal.
**Fix:**
```ts
function generateDealId(existingIds: Set<string>): string {
  let id: string;
  do {
    id = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  } while (existingIds.has(id));
  return id;
}
// in create(): generateDealId(new Set(this.deals.map((d) => d.id)))
```

### IN-02: `update()`'s patch type excludes all deal-terms and financial-metric fields

**File:** `src/data/mock/mock-deals-repository.ts:73-91`
**Issue:** `update()`'s `Partial<Pick<Deal, ...>>` patch type only allows `pipelineStage | outcome | lostReason | name | value | owner | closeDate | lineItems`. `prorata`, `gracePeriodDays`, `contractTermMonths`, `frequency`, `currency`, `customerType`, `confidenceLevel`, `arpu`, `mrr`, `arr`, and `lifetimeContractValue` — all captured at creation via the Add Deal wizard — currently have no update path at all. Likely fine if editing these fields post-creation isn't in scope yet, but flagging since these files were reviewed together and a future "edit deal terms" feature will need this `Pick` list extended.
**Fix:** Extend the `Pick<Deal, ...>` union when an edit-deal-terms UI is built; no action needed if out of scope for now.

---

_Reviewed: 2026-09-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_

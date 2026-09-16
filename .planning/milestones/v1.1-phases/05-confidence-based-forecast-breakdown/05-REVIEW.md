---
phase: 05-confidence-based-forecast-breakdown
reviewed: 2026-09-16T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - package.json
  - src/features/forecast/components/ForecastBreakdownTable.tsx
  - src/features/forecast/components/ForecastPage.tsx
  - src/features/forecast/forecast-breakdown.test.ts
  - src/features/forecast/forecast-breakdown.ts
  - src/features/pipeline/components/ConfidenceCell.tsx
  - src/features/pipeline/components/DealTable.tsx
  - src/features/pipeline/components/deal-edit-schema.ts
  - src/features/pipeline/store/pipelineStore.ts
  - src/shared/constants/confidence-level.ts
  - src/shared/utils/deal-metrics.test.ts
  - src/shared/utils/deal-metrics.ts
  - vitest.config.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-09-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the confidence-based forecast breakdown feature: the new
`forecast-breakdown.ts` grouping/aggregation module and its test, the new
`ForecastBreakdownTable` component, the new `ConfidenceCell` inline editor
wired into `DealTable`, the `deal-metrics.ts` additions
(`computeQuantity`/`computeArpu`/`joinModelSkus`/`joinServiceNames`), the
`confidence-level.ts` constants module, the `dealEditSchema`/`pipelineStore`
type widening for `confidenceLevel`, and the new `vitest.config.ts`.

`npx tsc -b --noEmit`, `npx eslint` (on all reviewed source files), and
`npx vitest run` all pass cleanly with no errors — the aggregation math in
`forecast-breakdown.ts`/`deal-metrics.ts` is correct and well-tested for the
cases the tests cover. No critical/security issues were found (no injection
surfaces, no secrets, no dangerous APIs — this is a pure frontend
aggregation/display feature over in-memory mock data).

The issues found are all Warning/Info tier: a repository-interface contract
that silently fell out of sync with the widened `updateDeal` patch type, a
stuck-error edge case in the new `ConfidenceCell`, an unguarded lookup that
would crash the Forecast page if the confidence-level enum and its ordering
constant ever drift apart, and a few smaller duplication/type-safety
nitpicks.

## Warnings

### WR-01: `DealsRepository`/`MockDealsRepository.update()` contract does not declare `confidenceLevel` as updatable, even though the store and UI now depend on it

**File:** `src/features/pipeline/store/pipelineStore.ts:20-25` (also affects `src/data/deals-repository.ts:14-33` and `src/data/mock/mock-deals-repository.ts:69-88`, not in this phase's file list but directly implicated by this change)

**Issue:** This phase widened `PipelineState.updateDeal`'s patch type to include
`confidenceLevel`:
```ts
patch: Partial<
  Pick<Deal, "name" | "value" | "owner" | "closeDate" | "lineItems" | "confidenceLevel">
>,
```
and `ConfidenceCell.tsx:64` calls `updateDeal(dealId, { confidenceLevel: parsed.data })`,
which forwards straight through to `dealsRepository.update(id, patch)`.
However, the `DealsRepository` interface's `update()` signature (the
project's documented "future API boundary" contract, per its own doc
comment) and `MockDealsRepository.update()`'s matching signature were **not**
updated — both still `Pick` only
`"pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems" | "contractStartDate" | "contractEndDate" | "contractSignedDate" | "paymentTerms"`,
omitting `confidenceLevel` entirely.

This currently "works" at runtime only because `MockDealsRepository.update()`
blindly spreads `{ ...this.deals[index], ...patch }` instead of picking
named fields — so a field the interface doesn't advertise as updatable is
silently accepted anyway. TypeScript doesn't flag this either, because a
wider object type is structurally assignable to a narrower one. The result
is a repository contract that no longer accurately describes what the app
does, which is exactly the drift the repository-seam pattern
(`research/ARCHITECTURE.md`, referenced in this file's own header comment)
exists to prevent — a real backend implementation written strictly against
`DealsRepository`'s declared `update()` shape would drop confidence-level
edits on the floor.

**Fix:** Add `"confidenceLevel"` to the `Pick` union in both
`DealsRepository.update()` and `MockDealsRepository.update()`:
```ts
update(
  id: string,
  patch: Partial<
    Pick<
      Deal,
      | "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner"
      | "closeDate" | "lineItems" | "contractStartDate" | "contractEndDate"
      | "contractSignedDate" | "paymentTerms" | "confidenceLevel"
    >
  >,
): Promise<Deal>;
```

### WR-02: `ConfidenceCell`'s error message never clears when the re-selected value equals the current value

**File:** `src/features/pipeline/components/ConfidenceCell.tsx:54-61`

**Issue:**
```ts
const commit = async (next: string) => {
  setIsEditing(false);
  if (next === value) return;
  const parsed = dealEditSchema.shape.confidenceLevel.safeParse(next);
  ...
```
Once `error` is set (e.g. after a failed `updateDeal` call), the only path
that clears it is a *successful* commit of a *different* value
(`setError(null)` on line 65, only reached when `next !== value`). If the
user reopens the dropdown and re-selects the value that is already
displayed (e.g. to dismiss the stale error, or simply because that's still
their intended choice), `commit` returns at the `next === value` guard
before ever reaching `setError(null)` — the error message is stuck
indefinitely with no way for the user to clear it short of successfully
picking a different value and then picking the original one back.

**Fix:** Clear the error before the early-return guard, or move the guard
after an unconditional `setError(null)`:
```ts
const commit = async (next: string) => {
  setIsEditing(false);
  if (next === value) {
    setError(null);
    return;
  }
  ...
```

### WR-03: `groupDealsByConfidence` has no defensive fallback for a `confidenceLevel` value not present in `CONFIDENCE_LEVELS`

**File:** `src/features/forecast/forecast-breakdown.ts:32-41`

**Issue:**
```ts
export function groupDealsByConfidence(deals: Deal[]): Record<ConfidenceLevel, Deal[]> {
  const byLevel = Object.fromEntries(CONFIDENCE_LEVELS.map((level) => [level, [] as Deal[]])) as Record<
    ConfidenceLevel,
    Deal[]
  >;
  for (const deal of deals) {
    byLevel[deal.confidenceLevel].push(deal);
  }
  return byLevel;
}
```
`byLevel` is only as complete as `CONFIDENCE_LEVELS` (a hand-maintained
array) actually is — there is no compiler-enforced guarantee that it
exhaustively covers every member of the `ConfidenceLevel` union, since the
`as Record<ConfidenceLevel, Deal[]>` cast suppresses that check. If
`ConfidenceLevel` is ever extended (a new confidence tier added) without
also updating `CONFIDENCE_LEVELS` in the same change — an easy mistake,
since they live in two different files with no enforced link — every
existing deal whose `confidenceLevel` matches the new member will hit
`byLevel[deal.confidenceLevel]` as `undefined` and throw
`TypeError: Cannot read properties of undefined (reading 'push')`,
crashing the entire Forecast page render (this loop has no try/catch and
no per-item guard).

**Fix:** Guard the lookup, or build the map from `Object.keys` of a source
that's provably exhaustive (e.g., derive `CONFIDENCE_LEVELS` from a
`satisfies`-checked const, or add a runtime assertion):
```ts
for (const deal of deals) {
  const bucket = byLevel[deal.confidenceLevel];
  if (!bucket) continue; // or log/report an unexpected confidence level
  bucket.push(deal);
}
```

### WR-04: `ForecastBreakdownTable` computes `computeArpu(deal)` twice per row and casts away the null it just checked for

**File:** `src/features/forecast/components/ForecastBreakdownTable.tsx:79-83`

**Issue:**
```tsx
<td className="px-4 py-2">
  {computeArpu(deal) === null
    ? "—"
    : currencyFormatter.format(computeArpu(deal) as number)}
</td>
```
`computeArpu(deal)` is invoked twice for every deal row purely because the
result wasn't cached, and the second call requires an `as number` type
assertion to satisfy `currencyFormatter.format`'s signature since TypeScript
cannot correlate two separate call expressions as returning the same value.
The subtotal/grand-total rows just below (lines 100-102, 121-123) get this
right by computing `totals.arpu` once and branching on the stored value —
this per-deal row is the only place in the file that doesn't follow that
pattern.

**Fix:**
```tsx
const arpu = computeArpu(deal);
// ...
<td className="px-4 py-2">{arpu === null ? "—" : currencyFormatter.format(arpu)}</td>
```

## Info

### IN-01: `CONFIDENCE_LEVELS` is exported as a plain mutable array

**File:** `src/shared/constants/confidence-level.ts:14`

**Issue:** `export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [...]` is a
single module-level array instance shared by every importer (this module's
own doc comment stresses it is the one canonical, "never derived", fixed
"descending confidence" order for both `ConfidenceCell` and the forecast
breakdown table). Nothing prevents a future consumer from calling a
mutating array method on it (`.sort()`, `.push()`, `.reverse()`, etc.),
which would silently corrupt the display order for every other consumer
app-wide, since it's a shared singleton.

**Fix:** Freeze it and/or type it as readonly:
```ts
export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = Object.freeze([
  "100", "80", "50", "open-to-rfp",
]);
```

### IN-02: `deal-edit-schema.ts`'s confidence enum duplicates `CONFIDENCE_LEVELS` instead of deriving from it

**File:** `src/features/pipeline/components/deal-edit-schema.ts:13`

**Issue:** `confidenceLevel: z.enum(["100", "80", "50", "open-to-rfp"])` is a
third hand-copied literal list of the same 4 values now also declared in
`confidence-level.ts`'s `CONFIDENCE_LEVELS` (and previously already
duplicated in `add-deal-schema.ts`). This phase's own `confidence-level.ts`
header comment explicitly calls out that it's meant to be *the* canonical
source, but this new schema addition didn't reuse it — likely because
`CONFIDENCE_LEVELS` isn't declared as a `z.enum`-compatible readonly tuple.
Any future change to the valid confidence levels now needs to touch three
independent literal lists to stay consistent.

**Fix:** Declare `CONFIDENCE_LEVELS` as a `const` tuple (e.g.
`["100", "80", "50", "open-to-rfp"] as const`) so `z.enum(CONFIDENCE_LEVELS)`
can be used directly in both schema files.

### IN-03: `vitest.config.ts` duplicates `vite.config.ts`'s `@` alias instead of extending it

**File:** `vitest.config.ts:1-14`

**Issue:** The new `vitest.config.ts` hand-copies the exact same `"@"` alias
resolution already defined in `vite.config.ts:9-13`. The two configs can now
drift independently (e.g. if the app's alias setup gains a second alias or
changes path depth, only one file might get updated), which would produce
confusing test-only or build-only module-resolution failures.

**Fix:** Use Vitest's `mergeConfig` to extend the existing Vite config
instead of duplicating it:
```ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
  test: { environment: "node", globals: true },
}));
```

### IN-04: New `deal-metrics.test.ts` only covers the functions added this phase

**File:** `src/shared/utils/deal-metrics.test.ts:1-58`

**Issue:** This is the first test file ever added for `deal-metrics.ts`, but
it only exercises the four functions introduced/touched in this phase
(`computeQuantity`, `computeArpu`, `joinModelSkus`, `joinServiceNames`).
The pre-existing, still-exported `computeMrr`, `computeArr`, and
`computeLifetimeContractValue` (`src/shared/utils/deal-metrics.ts:26-52`) —
which `computeArpu`/`computeGroupTotals` directly depend on — remain
completely untested, even though this file (and its test coverage) is
squarely in scope now that a test file exists for it.

**Fix:** Not blocking, but worth a follow-up: add coverage for
`computeMrr`/`computeArr`/`computeLifetimeContractValue` (product vs.
service filtering, zero-line-item case, contract-term multiplication) while
the module is already being touched.

---

_Reviewed: 2026-09-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

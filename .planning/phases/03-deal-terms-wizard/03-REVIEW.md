---
phase: 03-deal-terms-wizard
reviewed: 2026-09-09T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/shared/types/deal.ts
  - src/features/pipeline/components/add-deal-schema.ts
  - src/features/pipeline/components/AddDealDialog.tsx
  - src/data/mock/mock-deals-repository.ts
  - src/data/mock/seed-data.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-09-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the 2-step Add Deal wizard (DEAL-06 deal-terms fields) end to end: the `Deal`/`NewDealInput` type additions, the zod schema composition, the dialog component, the mock repository's `create()`, and the seed-data generator. The core wizard logic (step gating, shared `useForm` instance across Back/Next, schema shape-spread composition, "yes"/"no" → boolean prorata conversion) is sound and the enum sets (`DealFrequency`, `DealCurrency`) are consistent across `deal.ts`, `add-deal-schema.ts`, and the dialog's option arrays.

Two real gaps found, both about robustness rather than immediate breakage: (1) `pipelineStore.addDeal` does not follow the same error-handling pattern the codebase already established for `updateDeal` (carried forward from `01-REVIEW.md WR-01`), so a rejected `create()` call leaves the Add Deal dialog silently stuck open with no user-facing error and no log; (2) the mock deal-id generator (used both at seed time and at `create()` time) has no uniqueness check against existing deals, so a collision — however statistically unlikely — would cause `findIndex`-based lookups elsewhere in the store to silently mutate the wrong deal. Two minor Info-level items round out the review.

## Warnings

### WR-01: `addDeal` swallows/propagates repository failures with no user-facing error, unlike `updateDeal`

**File:** `src/features/pipeline/store/pipelineStore.ts:34-37`
**Issue:** `updateDeal` (same file, lines 47-59) wraps its repository call in try/catch, logs via `console.error`, and re-throws so the caller can revert local state and show an error banner — the comment there explicitly calls this out as "Carried-forward fix for 01-REVIEW.md WR-01: ... never swallow the rejection silently." `addDeal` was not given the same treatment:

```ts
addDeal: async (input) => {
  const created = await dealsRepository.create(input);
  set({ deals: [...get().deals, created] });
},
```

Downstream, `AddDealDialog.tsx:95-102`'s `onSubmit` does `await addDeal({...})` with no try/catch either:

```ts
const onSubmit = async (values: AddDealFormValues) => {
  await addDeal({ ...values, prorata: values.prorata === "yes" });
  form.reset(DEFAULT_VALUES);
  setStep(1);
  onOpenChange(false);
};
```

If `dealsRepository.create()` ever rejects (the current `MockDealsRepository.create()` never does, but the interface contract doesn't guarantee that for a future real-API swap — the explicit purpose of the repository abstraction per this project's architecture), the rejection propagates as an unhandled promise rejection from `form.handleSubmit(onSubmit)`. The dialog is left open with stale submitted values, no error is logged, and no error is shown to the user — the exact failure mode `updateDeal`'s WR-01 fix was written to prevent.

**Fix:** Mirror the `updateDeal` pattern in `addDeal`, and catch in the dialog to surface feedback:

```ts
// pipelineStore.ts
addDeal: async (input) => {
  try {
    const created = await dealsRepository.create(input);
    set({ deals: [...get().deals, created] });
  } catch (err) {
    console.error("addDeal failed", err);
    throw err;
  }
},
```

```tsx
// AddDealDialog.tsx
const [submitError, setSubmitError] = useState<string | null>(null);

const onSubmit = async (values: AddDealFormValues) => {
  try {
    setSubmitError(null);
    await addDeal({ ...values, prorata: values.prorata === "yes" });
    form.reset(DEFAULT_VALUES);
    setStep(1);
    onOpenChange(false);
  } catch {
    setSubmitError("Could not create deal. Please try again.");
  }
};
```

### WR-02: Randomly-generated Deal ids have no uniqueness check

**File:** `src/data/mock/mock-deals-repository.ts:9-15`, `src/data/mock/seed-data.ts:48`
**Issue:** `generateDealId()` produces a 10-digit numeric string via `Math.floor(Math.random() * 10)` per digit, with no check against `this.deals` (or any existing id set) for a collision:

```ts
function generateDealId(): string {
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}
```

`seed-data.ts:48` independently generates 40 seed ids the same way (`faker.string.numeric(10)`), also with no dedup pass across the 40 generated deals. Every id-based lookup in the codebase (`mock-deals-repository.ts:75` `findIndex((d) => d.id === id)`, `pipelineStore.ts:40,44,51` `.find`/`.map` by `d.id`) assumes ids are unique. A collision between a newly created deal and any existing deal (seed or user-created) would cause `update()`/`moveStage()`/`updateDeal()` to silently target the wrong record — a real, if low-probability, data-corruption path with no guard rail at all.

**Fix:** Loop until a unique id is found (still trivial at this data scale), or use a collision-free generator:

```ts
function generateDealId(existingIds: Set<string>): string {
  let id: string;
  do {
    id = "";
    for (let i = 0; i < 10; i++) id += Math.floor(Math.random() * 10);
  } while (existingIds.has(id));
  return id;
}
// call site: generateDealId(new Set(this.deals.map((d) => d.id)))
```

## Info

### IN-01: Dead defensive fallback for `faker.helpers.multiple`

**File:** `src/data/mock/seed-data.ts:77-80`
**Issue:** 
```ts
export const seedDeals: Deal[] =
  typeof faker.helpers.multiple === "function"
    ? faker.helpers.multiple(buildSeedDeal, { count: 40 })
    : Array.from({ length: 40 }, buildSeedDeal);
```
Per this project's pinned stack (`@faker-js/faker@10`, CLAUDE.md), `faker.helpers.multiple` has existed since faker 8.x and is guaranteed present. The `typeof` guard and its `Array.from` fallback branch are unreachable under the pinned dependency version and add noise without value.
**Fix:** Simplify to `export const seedDeals: Deal[] = faker.helpers.multiple(buildSeedDeal, { count: 40 });` unless there's a specific reason (e.g., an older faker version elsewhere in the dependency tree) to keep the guard — if so, leave a comment explaining why.

### IN-02: `Value` input's native `min={0}` doesn't match the schema's `positive()` (>0) constraint

**File:** `src/features/pipeline/components/AddDealDialog.tsx:151-169` (specifically `min={0}` at line 162)
**Issue:** The Value field is rendered with `type="number" min={0}`, which lets the browser's spinner/native validation treat `0` as an acceptable value. The zod schema (`add-deal-schema.ts:12`) requires `.positive()`, so `0` is always rejected with "Value must be positive" once submitted — the native `min` attribute advertises a looser constraint than what actually gets enforced.
**Fix:** Set `min={0.01}` (or omit `min` and rely solely on the zod error) so the native affordance doesn't imply `0` is valid input.

---

_Reviewed: 2026-09-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

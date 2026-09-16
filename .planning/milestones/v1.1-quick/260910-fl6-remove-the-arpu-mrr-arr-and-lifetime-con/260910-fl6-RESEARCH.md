# Quick Task 260910-fl6: Remove ARPU/MRR/ARR/Lifetime Contract Value inputs, add derived table columns - Research

**Researched:** 2026-09-10
**Domain:** React/TypeScript/zod field removal + derived-value utility + TanStack Table column addition (no new packages)
**Confidence:** HIGH — every claim below is sourced from reading the actual files in this session.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scope of the correction**
- Only the 4 financial metric fields are affected. Customer Type and Confidence Level stay in the Add Deal wizard exactly as shipped in 260910-ec8 — do not touch, do not revisit.

**ARPU formula**
- ARPU = Value ÷ total units across the deal's line items. `units` already exists as a field on each `LineItem` (Phase 2). Sum `units` across all of a deal's `lineItems`, divide `value` by that sum.
- Zero line items → ARPU is blank/— (not 0, not NaN, not Infinity). Display an empty/dash placeholder in the table cell rather than a computed number that would be misleading (division by zero).

**Storage model — purely derived, never stored**
- MRR, ARR, Lifetime Contract Value, and ARPU are NOT stored fields on `Deal` or `NewDealInput`. They are computed on demand (in a selector/utility function, analogous to Phase 2's `sumLineItems` for `Deal.value`) from data that IS already stored: `value`, `frequency`, `contractTermMonths`, `lineItems`.
- This means: revert the `arpu`/`mrr`/`arr`/`lifetimeContractValue` additions to `Deal`/`NewDealInput` types, `addDealStep2Schema`, `MockDealsRepository.create()`, and `seed-data.ts`'s `buildSeedDeal()` that 260910-ec8 introduced — none of that persisted-field machinery is needed anymore.
- Rationale (user-selected, matches Phase 2's DEAL-05 precedent): always correct even when `value` changes later via inline table editing or line-item edits — no stale-copy risk, no recompute-on-every-write-path complexity.

**MRR / ARR / Lifetime Contract Value formulas**
- MRR = Value ÷ months-in-Frequency-period. Frequency's periods, per the existing `DealFrequency` union (`monthly | quarterly | quadrimestral | semi-annual | annually`): monthly=1, quarterly=3, quadrimestral=4, semi-annual=6, annually=12. So `MRR = value / periodMonths(frequency)`.
- ARR = MRR × 12.
- Lifetime Contract Value = MRR × contractTermMonths.
- These three fully derive from fields already on `Deal` (`value`, `frequency`, `contractTermMonths`) — no new inputs anywhere, no manual entry, no wizard changes for these three.

**Table display**
- Add MRR, ARR, Lifetime Contract Value, and ARPU as new columns in the main pipeline table (`@tanstack/react-table` grouped table from Phase 1), alongside the existing Name/Company/Value/Owner/Close Date/Stage/ID columns. Let the table scroll horizontally as needed — it already handles this at ~95% viewport width; no special collapsing/hiding behavior required.
- Currency formatting: match whatever convention the existing `value` column already uses for its cell (reuse the same formatter/pattern, do not invent a new one).

### Claude's Discretion
- Exact selector/utility function name, file location (likely alongside or near `sumLineItems` in `src/shared/utils/line-items.ts`, or a new `src/shared/utils/deal-metrics.ts` — planner's call based on what's cleanest given the existing file structure), and signature.
- Column header labels and exact placement order among the new 4 columns — reasonable defaults expected, not a hard requirement.
- Whether ARPU's blank/— placeholder reuses an existing "empty cell" convention already present elsewhere in the table (check for one before inventing new markup).

### Deferred Ideas (OUT OF SCOPE)
- None recorded — CONTEXT.md contains no Deferred Ideas section beyond scope boundaries already stated above.
</user_constraints>

## Summary

Quick task 260910-ec8 added `customerType`/`confidenceLevel` (required enums — KEEP, untouched) and `arpu`/`mrr`/`arr`/`lifetimeContractValue` (optional numeric wizard inputs, persisted `Deal` fields — REMOVE) across 5 files. This task reverts only the 4 financial-field additions and replaces them with a pure derived-value utility (following the existing `sumLineItems`/`hasManualOverride` convention in `src/shared/utils/line-items.ts`) plus 4 new display columns in `DealTable.tsx`.

The codebase's `tsconfig.app.json`/`tsconfig.node.json` both set `noUnusedLocals: true` and `noUnusedParameters: true` (verified this session), so `npm run build` (`tsc -b && vite build`) will hard-fail on any import or local variable left dangling by the removal — this is the primary safety net. It will NOT fail on stale doc comments that still reference "260910-ec8"/the removed fields, which need a manual grep pass.

**Primary recommendation:** Remove the 4-field machinery from `AddDealDialog.tsx` first (imports, DEFAULT_VALUES, the 4 Controller blocks, the entire `useWatch`/`useEffect` auto-calc block), then `add-deal-schema.ts`, then `deal.ts`, then `mock-deals-repository.ts`, then `seed-data.ts` — then add `src/shared/utils/deal-metrics.ts` (new file, sibling to `line-items.ts`, same pure-function/no-side-effects/`Pick<Deal, …>` convention) and 4 new `columnHelper.display(...)` columns in `DealTable.tsx`, reusing the module-level `Intl.NumberFormat` currency-formatter pattern already duplicated in `EditableCell.tsx`/`GroupSection.tsx`/`LineItemsTable.tsx`, and the `"—"` empty-cell convention already used in `EditableCell.tsx` for blank `closeDate`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MRR/ARR/LTV/ARPU computation | Browser / Client (pure utility fn) | — | No backend exists this phase; derived-value functions already live client-side in `src/shared/utils/` (mirrors `sumLineItems`) |
| Table column rendering | Browser / Client (React component) | — | `DealTable.tsx` is a client-rendered `@tanstack/react-table` component; no SSR in this Vite SPA |
| Field/type/schema removal | Browser / Client (build-time only) | — | Zod schema and TS types are compile-time/client-validation only — no server contract to update |

## Exactly what 260910-ec8 added (revert list)

All line numbers verified by reading each file this session — current on-disk state, post-260910-ec8.

### `src/shared/types/deal.ts`
- **KEEP:** `CustomerType` (lines 32-33), `ConfidenceLevel` (lines 35-40) type declarations — untouched by this task.
- **REMOVE from `Deal`** (lines 57-90): `arpu?: number; mrr?: number; arr?: number; lifetimeContractValue?: number;` at lines 86-89. Keep `customerType: CustomerType; confidenceLevel: ConfidenceLevel;` (lines 84-85). Update the doc comment at lines 79-83 (currently: `"Customer Type / Confidence Level / financial metrics captured via the Add Deal wizard's step 2 (Quick task 260910-ec8). The four financial fields are optional — early-stage deals often lack firm numbers yet."`) to drop the now-false "four financial fields are optional" sentence.
- **REMOVE from `NewDealInput`** (lines 97-121): identical 4 fields at lines 117-120, identical doc-comment fix needed at lines 110-114.

### `src/features/pipeline/components/add-deal-schema.ts`
- **KEEP:** `customerType`/`confidenceLevel` `z.enum(...)` fields, lines 45-50.
- **REMOVE:** `arpu`/`mrr`/`arr`/`lifetimeContractValue` — lines 51-74 (four `z.coerce.number().nonnegative().max().optional()` chains, including two inline comments at lines 61-62 and 68-69 explaining the ARR/LTV max-bound sizing rationale — that rationale becomes moot once the fields are gone).

### `src/features/pipeline/components/AddDealDialog.tsx`
- **REMOVE import:** `useEffect` (line 1) — becomes unused once the auto-calc effect (below) is removed; `noUnusedLocals` will fail the build if left in.
- **REMOVE import:** `useWatch` (line 2) — same reason.
- **REMOVE import:** `FieldDescription` (line 11) — its only 2 usages are inside the `arr`/`lifetimeContractValue` Controller blocks being removed (lines 463, 484-486); becomes unused.
- **KEEP:** `CUSTOMER_TYPE_OPTIONS` (lines 59-65), `CONFIDENCE_LEVEL_OPTIONS` (lines 67-73) — untouched.
- **REMOVE from `DEFAULT_VALUES`** (lines 75-93): `arpu: undefined, mrr: undefined, arr: undefined, lifetimeContractValue: undefined,` (lines 89-92). Keep `customerType: "similar", confidenceLevel: "open-to-rfp",` (lines 87-88).
- **REMOVE entirely:** the `useWatch({ control: form.control, name: ["mrr", "contractTermMonths"] })` call and the entire following `useEffect` block, lines 117-150 (comment block + destructure + effect body).
- **KEEP:** the `customerType` Controller (lines 365-386) and `confidenceLevel` Controller (lines 387-408) — untouched.
- **REMOVE:** the 4 Controller blocks for `arpu` (lines 409-427), `mrr` (428-446), `arr` (447-467), `lifetimeContractValue` (468-490) — this is the literal end of the step-2 `FieldGroup`, so removal just truncates the block before its closing tag at line 491.

### `src/data/mock/mock-deals-repository.ts`
- **KEEP:** `customerType: input.customerType, confidenceLevel: input.confidenceLevel,` (lines 62-63) inside `create()`'s deal-terms pass-through block.
- **REMOVE:** `arpu: input.arpu, mrr: input.mrr, arr: input.arr, lifetimeContractValue: input.lifetimeContractValue,` (lines 64-67). Update the preceding comment (lines 59-61, currently referencing "Customer Type / Confidence Level / financial metrics") to drop the financial-metrics mention.

### `src/data/mock/seed-data.ts`
- **KEEP:** `CustomerType`, `ConfidenceLevel` type imports (lines 2-11); `CUSTOMER_TYPES`/`CONFIDENCE_LEVELS` const arrays (lines 18-19); `customerType: faker.helpers.arrayElement(CUSTOMER_TYPES), confidenceLevel: faker.helpers.arrayElement(CONFIDENCE_LEVELS),` (lines 79-80).
- **REMOVE:** the hoisted `const mrr = faker.number.int({ min: 0, max: 50_000 });` at line 53 — becomes an unused local once the 4 financial fields below no longer reference it (`noUnusedLocals` will fail the build if left in). **KEEP** the hoisted `const contractTermMonths = ...` at line 54 — still consumed by the return object's `contractTermMonths:` entry (line 72).
- **REMOVE:** `arpu: faker.number.int({ min: 0, max: 500 }), mrr, arr: mrr * 12, lifetimeContractValue: mrr * contractTermMonths,` (lines 81-84). Update the preceding comment (lines 75-78, currently "ARR/Lifetime Contract Value are computed from MRR/Contract Term here to keep seed data internally consistent…") since that rationale no longer applies — the new derived-value utility computes these at read time instead.
- Note: pull-request-style comment at line 52 ("Hoisted so both the return object's `contractTermMonths` and the financial-metric fields below can reference the same value") should also be dropped/rewritten since only `contractTermMonths` remains hoisted, for a single consumer (the return object) — hoisting is no longer providing any sharing benefit and could optionally be inlined back, though leaving it hoisted is harmless.

## Existing derived-value precedent (`sumLineItems`)

`src/shared/utils/line-items.ts` (read in full this session, 46 lines) is the exact precedent CONTEXT.md points to:

```typescript
// Source: src/shared/utils/line-items.ts:1-46 (verbatim structure)
import type { Deal, LineItem } from "@/shared/types/deal";

export function computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number { ... }
export function sumLineItems(lineItems: LineItem[]): number { ... }
export function round2(n: number): number { ... }
export function hasManualOverride(deal: Pick<Deal, "value" | "lineItems">): boolean { ... }
```

Convention to mirror for the new MRR/ARR/LTV/ARPU utility:
- **Named exports, plain functions** (not a class, not a default export).
- **`Pick<Deal, "…">` parameter types** where the function only needs a subset of `Deal`'s fields (see `hasManualOverride`'s `Pick<Deal, "value" | "lineItems">`) — the new functions should similarly accept `Pick<Deal, "value" | "frequency" | "contractTermMonths" | "lineItems">` rather than a full `Deal`, so they compose cleanly and are trivially unit-testable.
- **File header doc comment** stating the "never stored, always derived" contract (see lines 3-9 of `line-items.ts`) — the planner should write an equivalent comment for the new file/section.
- **No side effects, no store/repository imports** — pure functions only.

**Location:** CONTEXT.md leaves this to planner discretion. Given `line-items.ts`'s existing scope is explicitly "a deal's line-item composition" (its own header comment, line 4), and the new functions are about billing/financial metrics (only one of which — ARPU — touches line items), a new sibling file `src/shared/utils/deal-metrics.ts` is the cleaner fit; it can still import `sumLineItems`/`LineItem` from `line-items.ts` if ARPU needs the units sum (it needs `Σ(units)`, not `Σ(subtotal)`, so it will NOT reuse `sumLineItems` directly — it needs its own units-sum loop, or `lineItems.reduce((s, i) => s + i.units, 0)` inline).

## `DealFrequency` union — verbatim, verified

`src/shared/types/deal.ts:27`:
```
export type DealFrequency = "monthly" | "quarterly" | "quadrimestral" | "semi-annual" | "annually";
```
This matches CONTEXT.md's `periodMonths` mapping exactly (monthly=1, quarterly=3, quadrimestral=4, semi-annual=6, annually=12) — no discrepancy, all 5 members present and spelled identically to CONTEXT.md's specifics.

## `LineItem.units` — verbatim, verified

`src/shared/types/deal.ts:48-55`:
```typescript
export interface LineItem {
  id: string;
  productOrService: string;
  sku: string;
  units: number;
  unitPrice: number;
  type: LineItemType;
}
```
`units: number` (line 52) — confirms ARPU's `Σ(units)` sum is a straightforward numeric reduce, no unit-conversion or nullable handling needed.

## Main pipeline table — column definitions and currency formatting

`src/features/pipeline/components/DealTable.tsx` (read in full this session) is the file.

- Uses `legacyCreateColumnHelper<Deal>()` from `@tanstack/react-table/legacy` (line 22) — **not** the v9-native API. STATE.md (Phase 1 decision, verified) explicitly says: "keep using that subpath for any new table code until a deliberate v9-native migration." The 4 new columns must use this same `columnHelper` and the `/legacy` import path, not `@tanstack/react-table`'s native API.
- Columns array (lines 24-66) mixes `.accessor("field", {...})` for real `Deal` properties (name, company, value, owner, closeDate) and `.display({ id, header, cell })` for computed/non-property columns (`stage` at lines 52-58, `id` at lines 59-65). **Since MRR/ARR/LTV/ARPU are not literal `Deal` properties**, they must use `columnHelper.display({ id: "mrr", header: "MRR", cell: (info) => … })` (accepting `info.row.original` as the full `Deal`), matching the `stage`/`id` pattern — not `.accessor()`.
- The `value` column's cell (lines 34-39) delegates to `<EditableCell dealId={...} columnId="value" value={info.getValue()} />`, which internally formats currency via `EditableCell.tsx:7-11`'s module-level `currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })` (`EditableCell.tsx:46`).
- **No shared `formatCurrency` helper exists.** The exact same `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })` construction is independently duplicated as a module-level const in 3 files: `EditableCell.tsx:7-11`, `GroupSection.tsx:7-11`, and `LineItemsTable.tsx:25` (confirmed via grep, not yet read in full but matches the same literal signature both other call sites use). This triplication **is** the established convention — a 4th near-identical const in `DealTable.tsx` (since it currently has none) is the correct move per CONTEXT.md's "reuse the same formatter/pattern, do not invent a new one," not a refactor into a shared helper (that would be scope creep beyond this task).
- **Empty-cell convention already exists:** `EditableCell.tsx:44-54` uses the literal string `"—"` (em dash) as the display fallback when `closeDate` is empty/invalid (`value ? format(...) : "—"`). This is the precedent to reuse verbatim for ARPU's zero-line-items case, per CONTEXT.md's discretion note.

## `npm run build`/removal-safety pitfall

`tsconfig.app.json:24-25` and `tsconfig.node.json:17-18` both set:
```
"noUnusedLocals": true,
"noUnusedParameters": true,
```
(verified via direct read this session). Combined with `package.json`'s `"build": "tsc -b && vite build"` (verified), this means `npm run build` **will** catch:
- Any import left dangling after a Controller/effect block is deleted (e.g. `useEffect`, `useWatch`, `FieldDescription` in `AddDealDialog.tsx` if not also removed).
- Any now-unused local (e.g. seed-data.ts's hoisted `mrr` const if the 4 financial-field generation lines are deleted but the const declaration is left behind).
- Any type error from code still referencing `deal.arpu`/`input.mrr`/etc. after the fields are removed from `Deal`/`NewDealInput`.

`npm run build` will **NOT** catch:
- Stale doc comments still referencing "260910-ec8" or the removed fields by name (several identified above — `deal.ts` lines 79-83/110-114, `mock-deals-repository.ts` lines 59-61, `seed-data.ts` lines 52/75-78). These are cosmetic but should be grepped for and cleaned up (`grep -rn "260910-ec8\|arpu\|lifetimeContractValue" src/` after the edit, manually reviewing each hit — a raw count-based grep check is unsafe here because the new `deal-metrics.ts` utility will legitimately contain the strings `mrr`/`arr` as local variable/function names).

**Recommended removal order** (any order that ends in a single passing `npm run build` is technically fine since this is one atomic task, but this order minimizes the number of times you'd see a misleading intermediate error): `AddDealDialog.tsx` → `add-deal-schema.ts` → `deal.ts` → `mock-deals-repository.ts` → `seed-data.ts`, i.e. UI-first, type-last — because `AddDealDialog.tsx` is the file with the most interdependent pieces to remove in one pass (imports + DEFAULT_VALUES + Controllers + the whole auto-calc effect), and removing it first means the schema/type files can be simplified without worrying about a still-referencing consumer. Then add `deal-metrics.ts` and the 4 `DealTable.tsx` columns last, and run `npm run build && npm run lint` once at the end.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Currency cell formatting | A new formatting helper/import | Copy the exact `Intl.NumberFormat("en-US", {style:"currency", currency:"USD", maximumFractionDigits:0})` module-level const pattern already in `EditableCell.tsx`/`GroupSection.tsx`/`LineItemsTable.tsx` | Matches CONTEXT.md's explicit "reuse the same formatter/pattern" instruction; introducing a shared helper now is an uninstructed refactor of 3 existing files, out of this task's scope |
| Empty/blank cell markup | New dash/empty-state component | The existing bare `"—"` string literal fallback (`EditableCell.tsx:53`) | Established convention already in the table; no new markup needed |

## Common Pitfalls

### Pitfall 1: Deleting fields without deleting their consuming imports
**What goes wrong:** `AddDealDialog.tsx`'s `useEffect`, `useWatch`, and `FieldDescription` imports become unused the moment their sole consumers (the auto-calc effect, the arr/lifetimeContractValue Controllers) are deleted.
**Why it happens:** Easy to delete the Controller JSX/effect body and forget the import line at the top of the file.
**How to avoid:** Delete imports in the same edit as their last usage; let `npm run build` (which fails hard on `noUnusedLocals`) be the final confirmation, not the only check.
**Warning signs:** `tsc -b` output naming `useEffect`/`useWatch`/`FieldDescription` as declared-but-never-read.

### Pitfall 2: Leaving `seed-data.ts`'s hoisted `mrr` const orphaned
**What goes wrong:** `mrr` was hoisted specifically to be shared between the return object's `contractTermMonths` (false — it's `contractTermMonths` that's shared) and the 4 financial fields. Once `arpu`/`mrr`/`arr`/`lifetimeContractValue` generation lines are deleted from the return object, the `const mrr = faker.number.int(...)` declaration itself has no remaining reader.
**Why it happens:** The two hoisted consts (`mrr`, `contractTermMonths`) look symmetric but only `contractTermMonths` is actually still needed post-removal.
**How to avoid:** Delete the `mrr` const declaration (line 53) along with the 4 financial-field return-object lines; keep `contractTermMonths` (line 54).
**Warning signs:** `tsc -b` flags `mrr` as an unused local in `seed-data.ts`.

### Pitfall 3: Using `.accessor()` instead of `.display()` for the 4 new columns
**What goes wrong:** `columnHelper.accessor("mrr", ...)` would fail to type-check (and be semantically wrong) since `mrr` is not — and per the locked storage-model decision, must never become — a property on `Deal`.
**Why it happens:** The existing `value`/`name`/`company` columns all use `.accessor()`, making it the more visually "default" pattern to copy.
**How to avoid:** Follow the `stage`/`id` columns' `.display({ id, header, cell: (info) => ... })` pattern instead, computing the value from `info.row.original` (the full `Deal`) inside `cell`.

## Code Examples

### New derived-value utility shape (to mirror `line-items.ts`'s convention)
```typescript
// Source: pattern derived from src/shared/utils/line-items.ts:22-46 (read this session)
// New file: src/shared/utils/deal-metrics.ts (planner's file-location discretion per CONTEXT.md)
import type { Deal } from "@/shared/types/deal";

const PERIOD_MONTHS: Record<Deal["frequency"], number> = {
  monthly: 1,
  quarterly: 3,
  quadrimestral: 4,
  "semi-annual": 6,
  annually: 12,
};

export function computeMrr(deal: Pick<Deal, "value" | "frequency">): number {
  return deal.value / PERIOD_MONTHS[deal.frequency];
}

export function computeArr(deal: Pick<Deal, "value" | "frequency">): number {
  return computeMrr(deal) * 12;
}

export function computeLifetimeContractValue(
  deal: Pick<Deal, "value" | "frequency" | "contractTermMonths">,
): number {
  return computeMrr(deal) * deal.contractTermMonths;
}

/** Returns null (not 0/NaN/Infinity) when the deal has zero line items — caller renders "—". */
export function computeArpu(deal: Pick<Deal, "value" | "lineItems">): number | null {
  const totalUnits = deal.lineItems.reduce((sum, item) => sum + item.units, 0);
  return totalUnits === 0 ? null : deal.value / totalUnits;
}
```
This is illustrative, not prescriptive — exact naming/signature is planner's discretion per CONTEXT.md, but the `Pick<Deal, …>`/pure-function/named-export shape should match.

### New column pattern (mirrors `DealTable.tsx`'s existing `stage`/`id` `.display()` columns)
```typescript
// Source: pattern derived from src/features/pipeline/components/DealTable.tsx:52-65 (read this session)
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

columnHelper.display({
  id: "mrr",
  header: "MRR",
  cell: (info) => currencyFormatter.format(computeMrr(info.row.original)),
}),
// ARPU column uses the "—" fallback, matching EditableCell.tsx:44-54's convention:
columnHelper.display({
  id: "arpu",
  header: "ARPU",
  cell: (info) => {
    const arpu = computeArpu(info.row.original);
    return arpu === null ? "—" : currencyFormatter.format(arpu);
  },
}),
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `LineItemsTable.tsx:25`'s currency formatter has the exact same `Intl.NumberFormat` options as `EditableCell.tsx`/`GroupSection.tsx` (only the surrounding line, not the full options object, was read via grep, not full Read) | Existing table/currency formatting | Low — even if the options differ slightly, the `EditableCell.tsx`/`GroupSection.tsx` pair (both fully read, confirmed identical) is a strong enough precedent for the new columns; worth a quick glance during planning but does not change the recommended approach |
| A2 | ARPU should display as currency (not a plain number) | Table display / Code Examples | Low — CONTEXT.md doesn't explicitly state ARPU's number format, only that it's "Value ÷ units"; since Value is a currency amount, ARPU (dollars per unit) is naturally a currency value too, but the planner should confirm this reading during planning rather than treat it as locked |

## Sources

### Primary (HIGH confidence — read directly this session)
- `src/shared/types/deal.ts` (full file, 121 lines)
- `src/features/pipeline/components/add-deal-schema.ts` (full file, 99 lines)
- `src/features/pipeline/components/AddDealDialog.tsx` (full file, 520 lines)
- `src/data/mock/mock-deals-repository.ts` (full file, 92 lines)
- `src/data/mock/seed-data.ts` (full file, 99 lines)
- `src/shared/utils/line-items.ts` (full file, 46 lines)
- `src/features/pipeline/components/DealTable.tsx` (full file, 179 lines)
- `src/features/pipeline/components/EditableCell.tsx` (full file, 122 lines)
- `src/features/pipeline/components/GroupSection.tsx` (full file, 94 lines)
- `tsconfig.app.json`, `tsconfig.node.json`, `package.json` (grepped this session for `noUnusedLocals`/`noUnusedParameters`/build script)
- `.planning/STATE.md` (full file — Phase 1 `/legacy` TanStack API decision, Phase 4 Confidence Level mapping note)
- `.planning/quick/260910-fl6-.../260910-fl6-CONTEXT.md` (full file)
- `.planning/quick/260910-ec8-.../260910-ec8-PLAN.md` and `260910-ec8-SUMMARY.md` (full files)

### Secondary (MEDIUM confidence)
- `src/features/pipeline/components/LineItemsTable.tsx:25` — currency formatter existence confirmed via grep, options object not fully re-read (see Assumption A1)

## Metadata

**Confidence breakdown:**
- Revert list (what to remove): HIGH — every line cited was read directly this session
- Derived-value utility shape: HIGH (precedent read in full) / MEDIUM (exact new function signatures are discretionary, not locked)
- Table column integration: HIGH — `DealTable.tsx` read in full, existing `.display()` pattern and currency/empty-cell conventions directly confirmed
- Build-safety net (`noUnusedLocals`): HIGH — confirmed via direct tsconfig read

**Research date:** 2026-09-10
**Valid until:** Next commit that touches any of the 7 files above (this is a point-in-time snapshot of an actively-changing prototype, not a stable-library research)

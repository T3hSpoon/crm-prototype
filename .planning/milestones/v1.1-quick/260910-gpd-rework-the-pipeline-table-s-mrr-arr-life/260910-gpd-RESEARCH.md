# Quick Task 260910-gpd: Rework MRR/ARR/LTV/ARPU to line-item-type-based formulas - Research

**Researched:** 2026-09-10
**Domain:** Internal refactor of pure derived-value functions (`deal-metrics.ts`) and their 4 call sites in `DealTable.tsx`
**Confidence:** HIGH — all claims below verified by reading the actual source files this session, no external libraries involved.

## Summary

This is a self-contained formula rewrite inside two files: `src/shared/utils/deal-metrics.ts` (the 4 compute functions + the now-dead `PERIOD_MONTHS` map) and `src/features/pipeline/components/DealTable.tsx` (the 4 `columnHelper.display()` cells that call them). No type changes are needed — `Deal.lineItems`, `LineItem.type`, `LineItem.units`, `LineItem.unitPrice`, and `Deal.contractTermMonths` all already exist. `line-items.ts` already exports a reusable `computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number` that the new formulas should call for both product- and service-type line-item subtotals, per CONTEXT.md's explicit DRY instruction.

**Primary recommendation:** Rewrite the 4 functions to accept `Pick<Deal, "lineItems" | "contractTermMonths">` (dropping `"value" | "frequency"`), delete `PERIOD_MONTHS` entirely (it becomes fully dead — nothing else in the codebase imports it), and update `DealTable.tsx`'s 4 cells only if the new signatures reject the full `Deal` object (they won't — `info.row.original` is always a full `Deal`, so no call-site changes are strictly required beyond the import line staying the same). Flag for the planner: seed data will make ~39% of the 40 demo deals show MRR=$0/ARPU=blank once this ships — not a bug, but worth knowing before UAT.

## Verified Source Reads

### `src/shared/utils/deal-metrics.ts` (current, full file, 56 lines) `[VERIFIED: src/shared/utils/deal-metrics.ts:1-56]`

```
14  const PERIOD_MONTHS: Record<Deal["frequency"], number> = {
15    monthly: 1, quarterly: 3, quadrimestral: 4, "semi-annual": 6, annually: 12,
16  };
23  export function computeMrr(deal: Pick<Deal, "value" | "frequency">): number {
24    return deal.value / PERIOD_MONTHS[deal.frequency];
25  }
28  export function computeArr(deal: Pick<Deal, "value" | "frequency">): number {
29    return computeMrr(deal) * 12;
30  }
39  export function computeLifetimeContractValue(
40    deal: Pick<Deal, "value" | "frequency" | "contractTermMonths">,
41  ): number | null {
42    return deal.contractTermMonths === 0 ? null : computeMrr(deal) * deal.contractTermMonths;
43  }
52  export function computeArpu(deal: Pick<Deal, "value" | "lineItems">): number | null {
53    const totalUnits = deal.lineItems.reduce((sum, item) => sum + item.units, 0);
54    return totalUnits === 0 ? null : deal.value / totalUnits;
55  }
```

**Disposition of each piece under the new formulas (CONTEXT.md-locked):**

| Piece | Fate | Why |
|---|---|---|
| `PERIOD_MONTHS` (lines 14-20) | **Delete entirely** | New MRR formula sums service line-item subtotals directly — no frequency-to-months conversion is used anywhere in the locked formula set. Confirmed via repo-wide grep (below) that nothing outside this file imports it. |
| `computeMrr` | **Rewrite body** | New signature `Pick<Deal, "lineItems">`; sum `computeSubtotal(item)` over `lineItems.filter(i => i.type === "service")`. `frequency`/`value` params dropped. |
| `computeArr` | **Keep shape, adjust Pick** | `computeMrr(deal) * 12` is unchanged per CONTEXT.md ("only MRR's own source formula changed"); signature narrows to `Pick<Deal, "lineItems">` since it only forwards to `computeMrr`. |
| `computeLifetimeContractValue` | **Rewrite body** | New signature `Pick<Deal, "lineItems" | "contractTermMonths">`; drops `"value" | "frequency"`. Formula: `Σ(product-type subtotals) + computeMrr(deal) * deal.contractTermMonths`. **Behavior change from current file**: currently returns `null` when `contractTermMonths === 0`; CONTEXT.md locks LTV to **never** return `null` — it must return the product-subtotal sum (possibly `$0`) even when term is 0. Remove the `null`-branch entirely for this function; return type becomes plain `number`, not `number | null`. |
| `computeArpu` | **Rewrite body + Pick** | New signature `Pick<Deal, "lineItems" | "contractTermMonths">` — this is a **new dependency on `contractTermMonths`** the current function doesn't have (currently only needs `"value" | "lineItems"`). Formula: average of service-type `unitPrice` values, times `contractTermMonths`; returns `null` when there are zero service line items OR `contractTermMonths === 0` (both conditions must be checked — CONTEXT.md's asymmetric-null spec). Return type stays `number | null`. |

### `src/shared/utils/line-items.ts` (current, full file, 46 lines) `[VERIFIED: src/shared/utils/line-items.ts:1-46]`

```
12  export function computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number {
13    return item.units * item.unitPrice;
14  }
```

Confirmed exported, pure, exactly the shape needed (`units × unitPrice`) — reuse this for both product- and service-subtotal sums in the new `deal-metrics.ts` formulas rather than re-deriving the multiplication inline, per CONTEXT.md's canonical reference. No import cycle risk: `deal-metrics.ts` already only imports `type { Deal }`; adding `import { computeSubtotal } from "@/shared/utils/line-items"` and `import type { LineItem }` if needed is a same-tier (`shared/utils` → `shared/utils`) import, consistent with the existing codebase layering (`line-items.ts` itself only imports `type { Deal, LineItem }` from `shared/types`).

### `src/features/pipeline/components/DealTable.tsx` (relevant lines) `[VERIFIED: src/features/pipeline/components/DealTable.tsx:1-99]`

```
20  import { computeArpu, computeArr, computeLifetimeContractValue, computeMrr } from "@/shared/utils/deal-metrics";
...
59  columnHelper.display({
60    id: "mrr", header: "MRR",
62    cell: (info) => currencyFormatter.format(computeMrr(info.row.original)),
63  }),
64  columnHelper.display({
65    id: "arr", header: "ARR",
67    cell: (info) => currencyFormatter.format(computeArr(info.row.original)),
68  }),
69  columnHelper.display({
70    id: "lifetimeContractValue", header: "Lifetime Contract Value",
72    cell: (info) => {
73      const ltv = computeLifetimeContractValue(info.row.original);
74      return ltv === null ? "—" : currencyFormatter.format(ltv);
75    },
76  }),
77  columnHelper.display({
78    id: "arpu", header: "ARPU",
80    cell: (info) => {
81      const arpu = computeArpu(info.row.original);
82      return arpu === null ? "—" : currencyFormatter.format(arpu);
83    },
84  }),
```

**What `info.row.original` provides:** it is always the **full `Deal` object** (the table is built with `legacyCreateColumnHelper<Deal>()` and `useLegacyTable<Deal>` over the full `seedDeals`/store array — no row-shape narrowing happens anywhere in this file). It already includes `lineItems` and `contractTermMonths` (both are plain `Deal` fields per `deal.ts`), so **no call-site changes are required** — the 4 `cell` callbacks keep passing `info.row.original` unchanged; only the imported functions' internal `Pick<Deal, ...>` parameter types change, and since `Deal` is always a superset of any narrower `Pick`, TypeScript accepts the same call-site argument under the new signatures with zero edits needed in `DealTable.tsx` beyond what the functions themselves declare.

**One real behavior change to flag for the planner:** the `lifetimeContractValue` cell's `ltv === null ? "—" : ...` branch (line 74) becomes dead code once `computeLifetimeContractValue`'s return type changes from `number | null` to plain `number` (per the CONTEXT.md-locked "LTV is NEVER null" rule) — TypeScript will flag the `=== null` comparison against a non-nullable `number` under `strictNullChecks` as either a type error (comparison "unintentional" pattern, depending on lint rules) or at minimum dead/unreachable branch. **The plan must simplify this cell to `currencyFormatter.format(computeLifetimeContractValue(info.row.original))` directly**, removing the null-check ternary — this IS a required `DealTable.tsx` edit, contradicting a naive "zero call-site changes" read of CONTEXT.md's discretion note. The `arpu` cell's null-check (line 82) stays as-is since `computeArpu` keeps `number | null`.

### `src/shared/types/deal.ts` — field existence confirmation `[VERIFIED: src/shared/types/deal.ts:48-55, 76-77]`

```
48  export interface LineItem {
49    id: string;
50    productOrService: string;
51    sku: string;
52    units: number;
53    unitPrice: number;
54    type: LineItemType;
55  }
...
76    contractTermMonths: number;
```

`Deal.lineItems: LineItem[]` is declared at line 72 (`lineItems: LineItem[];`), and `LineItemType = "product" | "service"` is declared at line 24 (`export type LineItemType = "product" | "service";`). **All 5 fields the new formulas need (`Deal.lineItems`, `LineItem.type`, `LineItem.units`, `LineItem.unitPrice`, `Deal.contractTermMonths`) already exist verbatim — no type changes required for this task.**

Two doc comments (lines 79-86, 109-116) currently say MRR/ARR/LTV/ARPU are "derived ... from `value`/`frequency`/`contractTermMonths`/`lineItems`" — these are now **stale prose** once the formulas stop using `value`/`frequency`. Not a functional bug, but the planner should update these two comment blocks to keep them accurate (they reference `deal-metrics.ts`'s formula inputs by name).

## Seed Data Finding — MRR/ARPU coverage risk

`[VERIFIED: src/data/mock/seed-data.ts:15,21-32,44-49]`

```
15  const LINE_ITEM_TYPES: LineItemType[] = ["product", "service"];
...
30    type: faker.helpers.arrayElement(LINE_ITEM_TYPES),
...
45    const lineItemCount = faker.number.int({ min: 0, max: 4 });
46    const lineItems: LineItem[] =
47      lineItemCount === 0
48        ? []
49        : Array.from({ length: lineItemCount }, buildSeedLineItem);
```

Each seed deal gets 0-4 line items (uniform over 5 integer values, ~20% each), and each line item's `type` is an independent 50/50 coin flip between `"product"` and `"service"` (`faker.helpers.arrayElement` over a 2-element array is uniform). Computing the probability a seed deal has **zero service-type line items** (which drives MRR=$0, ARR=$0, and ARPU=null under the new formulas):

- `lineItemCount = 0` (prob 0.2): 0 service items, trivially.
- `lineItemCount = n` for n=1..4 (prob 0.2 each): all-product probability = `0.5^n`.

`P(no service items) = 0.2 + 0.2×(0.5¹ + 0.5² + 0.5³ + 0.5⁴) = 0.2 + 0.2×0.9375 = 0.3875` — **≈39% of the 40 seed deals** will show MRR=$0/ARR=$0/ARPU="—" once the new formula ships (LTV will still show a nonzero number for these if they have product-type items, or $0 if they have none at all). This is not a bug to fix — the CONTEXT.md formulas are correctly implementing "product/accessory-type line items contribute $0 to MRR" — but it means roughly 2 out of every 5 demo rows will show a blank/zero financial block, which is worth knowing before human-verify/UAT so it isn't mistaken for a regression.

## Dead-Code / Build-Gotcha Check

`[VERIFIED: repo-wide grep across src/, tsconfig.app.json:24-25]`

Grepped `computeMrr|computeArr|computeLifetimeContractValue|computeArpu|PERIOD_MONTHS|deal-metrics` across `src/`. Only 3 files reference `deal-metrics.ts` or its exports:
1. `src/shared/utils/deal-metrics.ts` itself (the definitions).
2. `src/features/pipeline/components/DealTable.tsx` (the only call site — all 4 functions imported and used, lines 20/62/67/73/81).
3. `src/shared/types/deal.ts` and `src/data/mock/seed-data.ts` — comment-only references (`// derived at read time by deal-metrics.ts`), not imports.

**`PERIOD_MONTHS` has zero importers anywhere** — it is module-private (never `export`ed) and only read inside the old `computeMrr` body. Confirmed `tsconfig.app.json:24-25` sets `"noUnusedLocals": true` (also true in `tsconfig.node.json:17-18`) — TypeScript's `noUnusedLocals` flags unused top-level `const` declarations in a module even when un-exported, so **if the new `computeMrr` body stops referencing `PERIOD_MONTHS`, leaving the constant in place will fail `npm run build`** (a `tsc` compile error, not just a lint warning). The map must be deleted outright, not left as orphaned dead code — matches CONTEXT.md's own instruction ("confirm via research before deciding... do not leave an orphaned unused export" — it isn't exported, but the same `noUnusedLocals` failure mode applies to unexported locals too).

No other file in the codebase references `Deal["frequency"]` via `PERIOD_MONTHS`-style lookup, and `Deal.frequency`/`Deal.value` themselves remain used elsewhere (`AddDealDialog.tsx`'s wizard, the Value column in `DealTable.tsx`) — per CONTEXT.md, those two fields are explicitly NOT being removed from `Deal`, only unused *by these 4 functions*.

<phase_requirements>
## Phase Requirements

No formal REQ-IDs — this is a quick-task correction (not a phase), scoped entirely by `260910-gpd-CONTEXT.md`'s `<decisions>` block. The locked formulas there are the acceptance spec:

| Locked Formula | Research Support |
|---|---|
| MRR = Σ(service-type line-item subtotals) | `computeSubtotal` reuse confirmed available; `LineItem.type`/`units`/`unitPrice` confirmed to exist verbatim |
| ARR = MRR × 12 | Unchanged shape, only `Pick` type narrows |
| LTV = Σ(product-type subtotals) + MRR × contractTermMonths, never null | Confirmed current `null`-on-zero-term branch must be removed; confirmed `DealTable.tsx`'s ternary at line 74 must also be simplified (real call-site edit, not zero-edit) |
| ARPU = avg(service unitPrice) × contractTermMonths, null on 0 services or 0 term | Confirmed new dependency on `contractTermMonths` not present in current signature; null-branch in `DealTable.tsx` (line 82) stays valid as-is |
</phase_requirements>

## Assumptions Log

None — every claim above was verified by reading the actual source files and running a repo-wide grep + tsconfig check this session. No `[ASSUMED]` tags in this document.

## Open Questions

None blocking. One judgment call for the planner: whether to keep the doc-comment updates in `deal.ts` (lines 79-86, 109-116) in scope — they're stale prose, not a functional bug, but CONTEXT.md's scope-discipline note only forbids touching wizard/column-header code, not comment accuracy in the type file. Recommendation: include the 2 comment edits in the same plan since they directly describe the formulas being changed.

## Metadata

**Confidence breakdown:**
- Formula rewrite mechanics: HIGH — read all 4 current function bodies, confirmed `computeSubtotal` signature, confirmed no external call sites beyond `DealTable.tsx`.
- Seed data risk: HIGH — probability derived directly from the actual generator code and its literal ranges (`min:0,max:4`, 2-element `LINE_ITEM_TYPES`), not estimated.
- Build gotcha: HIGH — `noUnusedLocals: true` confirmed by reading `tsconfig.app.json` directly; repo-wide grep confirms `PERIOD_MONTHS` has no other consumer.

**Research date:** 2026-09-10
**Valid until:** No expiry — this is a point-in-time internal code audit, not a fast-moving external dependency; re-verify only if `deal-metrics.ts`, `line-items.ts`, `DealTable.tsx`, or `deal.ts` change again before this quick task executes.

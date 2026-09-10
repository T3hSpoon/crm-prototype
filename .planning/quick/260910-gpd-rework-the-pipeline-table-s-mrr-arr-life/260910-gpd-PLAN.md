---
phase: 260910-gpd-rework-the-pipeline-table-s-mrr-arr-life
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/utils/deal-metrics.ts
  - src/features/pipeline/components/DealTable.tsx
  - src/shared/types/deal.ts
autonomous: true
requirements: [DEAL-06]

estimate:
  tokens: 38000
  raw_tokens: 38000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "MRR for any deal equals the sum of (units x unitPrice) across only that deal's service-type line items; product-type line items contribute $0 to MRR"
    - "ARR for any deal equals MRR x 12"
    - "Lifetime Contract Value for any deal equals the sum of its product-type line-item subtotals plus MRR x Contract Term (months); it is always a real number, never a blank/dash placeholder, even when Contract Term is 0"
    - "ARPU for any deal equals the plain (unweighted-by-units) average of its service-type line items' unit prices, multiplied by Contract Term (months); it renders as an em dash when the deal has zero service-type line items or Contract Term is 0"
    - "Editing a deal's line items (type/units/unitPrice) or Contract Term changes the displayed MRR/ARR/Lifetime Contract Value/ARPU on the next render, since none of the four is a stored field"
    - "npm run build and npm run lint both pass with the now-fully-unused billing-frequency-to-months lookup map removed"
  artifacts:
    - path: "src/shared/utils/deal-metrics.ts"
      provides: "Rewritten computeMrr/computeArr/computeLifetimeContractValue/computeArpu — line-item-type-based formulas reusing computeSubtotal from line-items.ts; the frequency-to-months lookup map is deleted"
    - path: "src/features/pipeline/components/DealTable.tsx"
      provides: "lifetimeContractValue column's cell callback simplified to a direct format call (no null-check branch), since computeLifetimeContractValue never returns null; arpu column's cell unchanged"
    - path: "src/shared/types/deal.ts"
      provides: "Deal/NewDealInput doc comments above customerType/confidenceLevel updated to describe the corrected line-item-type-based derivation, replacing the stale value/frequency-based description"
  key_links:
    - from: "src/features/pipeline/components/DealTable.tsx"
      to: "src/shared/utils/deal-metrics.ts"
      via: "columnHelper.display cell callbacks call computeMrr/computeArr/computeLifetimeContractValue/computeArpu with info.row.original (full Deal, a superset of each function's narrowed Pick<Deal, ...> parameter)"
      pattern: "columnHelper.display"
    - from: "src/shared/utils/deal-metrics.ts"
      to: "src/shared/utils/line-items.ts"
      via: "computeMrr and computeLifetimeContractValue both call computeSubtotal(item) inside a filter+reduce over deal.lineItems, reusing the existing units-times-unitPrice helper instead of re-deriving it inline"
      pattern: "computeSubtotal(item)"
    - from: "src/shared/utils/deal-metrics.ts"
      to: "src/shared/types/deal.ts"
      via: "Pick<Deal, \"lineItems\"> and Pick<Deal, \"lineItems\" | \"contractTermMonths\"> parameter typing replaces the old Pick<Deal, \"value\" | \"frequency\" | ...> shape"
      pattern: "Pick<Deal, ..."
---

<objective>
Correct the pipeline table's MRR/ARR/Lifetime Contract Value/ARPU formulas (shipped by quick task 260910-fl6) so they are derived from each deal's line-item composition — distinguishing `type: "product"` from `type: "service"` — instead of from `Deal.value`/`Deal.frequency`. Same 4 columns, same headers, same column positions: only the math inside `src/shared/utils/deal-metrics.ts` changes, plus the one `DealTable.tsx` call site whose null-check branch becomes dead code once Lifetime Contract Value can no longer return null.

Purpose: The prior formula set silently used the wrong inputs (`value`/`frequency`, which describe the deal's aggregate billing, not its per-line-item product/service split). The user's own worked examples (18 units of a product with two attached services; 10 products + a per-unit service over a 5-year term; three service unit prices averaged) only reconcile against the line-item-type-based formulas locked in CONTEXT.md.

Output: `deal-metrics.ts`'s 4 exported functions rewritten to the new formulas with narrower `Pick<Deal, ...>` signatures, the now-fully-unused billing-frequency-to-months lookup map deleted, `DealTable.tsx`'s Lifetime Contract Value cell simplified, and `deal.ts`'s two stale doc-comment blocks corrected.
</objective>

<execution_context>
@C:/gh-repos/eld/.claude/gsd-core/workflows/execute-plan.md
@C:/gh-repos/eld/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/gh-repos/eld/.planning/STATE.md
@C:/gh-repos/eld/.claude/CLAUDE.md
@C:/gh-repos/eld/.planning/quick/260910-gpd-rework-the-pipeline-table-s-mrr-arr-life/260910-gpd-CONTEXT.md
@C:/gh-repos/eld/.planning/quick/260910-gpd-rework-the-pipeline-table-s-mrr-arr-life/260910-gpd-RESEARCH.md
@C:/gh-repos/eld/src/shared/utils/deal-metrics.ts
@C:/gh-repos/eld/src/shared/utils/line-items.ts
@C:/gh-repos/eld/src/features/pipeline/components/DealTable.tsx
@C:/gh-repos/eld/src/shared/types/deal.ts

Notes carried from RESEARCH.md (do not re-derive):
- `tsconfig.app.json`/`tsconfig.node.json` both set `noUnusedLocals: true`, and `npm run build` runs `tsc -b && vite build` — the billing-frequency-to-months lookup map has zero importers anywhere in the repo once the new formulas stop referencing it, so leaving it in place fails the build (not just a lint warning). It must be deleted outright, not left as orphaned dead code.
- `computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number` already exists in `line-items.ts` (`item.units * item.unitPrice`) — reuse it for both service- and product-type subtotal sums rather than re-deriving the multiplication inline, per CONTEXT.md's canonical-reference DRY instruction.
- `info.row.original` in `DealTable.tsx` is always the full `Deal` object — since `Deal` is a superset of every narrower `Pick<Deal, ...>` this task introduces, none of the `mrr`/`arr`/`arpu` cell callbacks need their call-site arguments touched. Only the `lifetimeContractValue` cell's body changes (its null-check becomes unreachable/dead once the return type narrows to plain `number`).
- Seed data (`src/data/mock/seed-data.ts`) gives each of the 40 seed deals 0-4 line items with an independent 50/50 product/service type coin flip per item. Under the corrected formulas, roughly 39% of seed deals will show MRR/ARR = $0 and ARPU = an em dash. This is expected behavior of the new formula ("product-type line items contribute $0 to MRR"), not a regression — call this out during verification so it isn't mistaken for a bug.
- Do not touch `AddDealDialog.tsx`, Customer Type/Confidence Level, or any column headers/labels/positions in `DealTable.tsx` — out of scope per CONTEXT.md.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite deal-metrics.ts to line-item-type-based formulas</name>
  <precondition>src/shared/utils/deal-metrics.ts still has its pre-260910-gpd shape as read this session — a module-level `Record<Deal["frequency"], number>` lookup map, and `computeMrr`/`computeArr`/`computeLifetimeContractValue` keyed off `value`/`frequency`, unmodified since this session's reads.</precondition>
  <read_first>src/shared/utils/deal-metrics.ts (full file, 56 lines — all 4 current function bodies and their JSDoc); src/shared/utils/line-items.ts (full file, 46 lines — computeSubtotal's exact signature and the module's doc-comment/no-side-effects convention to mirror); src/shared/types/deal.ts lines 23-24 (LineItemType) and lines 48-55, 76 (LineItem fields, Deal.contractTermMonths)</read_first>
  <files>src/shared/utils/deal-metrics.ts</files>
  <action>
    Add `import { computeSubtotal } from "@/shared/utils/line-items";` alongside the existing `import type { Deal } from "@/shared/types/deal";`.

    Delete the top-level billing-frequency-to-months lookup map (the const block, typed `Record<Deal["frequency"], number>`, sitting directly below the file's module doc comment) entirely — the new formulas never convert frequency to a period length, so nothing references it, and an unreferenced top-level const fails the build under `noUnusedLocals`.

    Rewrite `computeMrr`'s signature to `Pick<Deal, "lineItems">` (drop the old `"value" | "frequency"` picks) and its body to sum `computeSubtotal(item)` over `deal.lineItems` filtered to `item.type === "service"` — product-type line items must contribute $0.

    Rewrite `computeArr`'s signature to `Pick<Deal, "lineItems">` (it only forwards to `computeMrr`, so it narrows the same way); the body stays `computeMrr(deal) * 12`, unchanged shape per CONTEXT.md ("only MRR's own source formula changed").

    Rewrite `computeLifetimeContractValue`'s signature to `Pick<Deal, "lineItems" | "contractTermMonths">` (drop `"value" | "frequency"`) and change its return type from `number | null` to plain `number` — remove the `contractTermMonths === 0 ? null : ...` branch entirely; CONTEXT.md locks this function to never return null. New body: sum `computeSubtotal(item)` over `deal.lineItems` filtered to `item.type === "product"`, plus `computeMrr(deal) * deal.contractTermMonths`.

    Rewrite `computeArpu`'s signature to `Pick<Deal, "lineItems" | "contractTermMonths">` (drop `"value"`, add `contractTermMonths` as a new dependency this function didn't previously have) — return type stays `number | null`. New body: filter `deal.lineItems` to `item.type === "service"`; if that filtered list is empty OR `deal.contractTermMonths === 0`, return `null` (CONTEXT.md's asymmetric-null rule — do not make this symmetric with `computeLifetimeContractValue`'s never-null contract); otherwise return the plain average of the filtered items' `unitPrice` values (sum of `unitPrice` divided by count — explicitly NOT weighted by `units`, and product-type items play no role at all) multiplied by `deal.contractTermMonths`.

    Update each of the 4 functions' JSDoc comments in prose to describe the new formula each implements (what it sums/averages, over which line-item type, and its null contract if any) — do not leave stale references to `value`/`frequency`-based derivation. Update the file's top-of-file module doc comment the same way: state that MRR/ARR/Lifetime Contract Value/ARPU are derived from each line item's `type`, `units`, and `unitPrice`, plus `contractTermMonths` — `Deal.value`/`Deal.frequency` play no role in these formulas anymore (both fields remain on `Deal` for other purposes, per CONTEXT.md's scope-discipline note — this task does not touch the `Deal` type itself).

    The exact `Pick<Deal, ...>` signatures above are this task's discretionary call (CONTEXT.md leaves the exact signatures to the planner) — follow `line-items.ts`'s established convention of narrowing to only the fields each function actually reads.
  </action>
  <verify>
    <automated>npm run build</automated>
    <automated>npm run lint</automated>
    <automated>test "$(grep -c 'PERIOD_MONTHS' src/shared/utils/deal-metrics.ts)" -eq 0</automated>
    <automated>test "$(grep -c 'Pick<Deal, "lineItems">' src/shared/utils/deal-metrics.ts)" -eq 2</automated>
    <automated>test "$(grep -c 'Pick<Deal, "lineItems" | "contractTermMonths">' src/shared/utils/deal-metrics.ts)" -eq 2</automated>
    <automated>test "$(grep -c 'computeSubtotal(item)' src/shared/utils/deal-metrics.ts)" -eq 2</automated>
    <human-check>Sanity-check the rewritten formulas against CONTEXT.md's worked examples by hand: (1) two service line items at $224/unit and $5/unit, both 18 units, no product items → MRR should be 18*224 + 18*5 = $4,122, ARR = $49,464. (2) one product line item 10 units @ $300, one service line item 10 units @ $5, 60-month contract term → Lifetime Contract Value should be (10*300) + (10*5)*60 = 3000 + 3000 = $6,000. (3) three service line items priced $25/$15/$5 (any units), 60-month term → ARPU should be ((25+15+5)/3)*60 = 15*60 = $900.</human-check>
  </verify>
  <acceptance_criteria>
    - `npm run build` and `npm run lint` both exit 0
    - The billing-frequency-to-months lookup map no longer exists anywhere in the file
    - `computeMrr`/`computeArr` are typed `Pick<Deal, "lineItems">`; `computeLifetimeContractValue`/`computeArpu` are typed `Pick<Deal, "lineItems" | "contractTermMonths">`
    - `computeLifetimeContractValue` returns plain `number` (never `null`); `computeArpu` still returns `number | null`
    - Both product- and service-subtotal sums reuse `computeSubtotal(item)` rather than re-deriving `units * unitPrice` inline
  </acceptance_criteria>
  <done>`deal-metrics.ts` exports the 4 corrected line-item-type-based formulas, the dead frequency-to-months lookup map is gone, and `npm run build`/`npm run lint` both pass.</done>
</task>

<task type="auto">
  <name>Task 2: Simplify DealTable.tsx's LTV cell and correct deal.ts's stale doc comments</name>
  <read_first>src/features/pipeline/components/DealTable.tsx lines 59-84 (the mrr/arr/lifetimeContractValue/arpu display columns) — confirm the lifetimeContractValue column's current 2-statement cell body (assign the computed value to a local, then branch on whether it's null before formatting) versus the arpu column's cell body, which keeps the same branch-on-null shape and must NOT be touched; src/shared/types/deal.ts lines 79-86 and 109-116 (the two identical JSDoc blocks above `customerType`/`confidenceLevel` in `Deal` and `NewDealInput`)</read_first>
  <files>src/features/pipeline/components/DealTable.tsx, src/shared/types/deal.ts</files>
  <action>
    In `DealTable.tsx`'s `lifetimeContractValue` display column, replace the cell callback's current 2-statement body (assign-to-local-then-branch-on-null, then format) with a single-expression body that calls `currencyFormatter.format(...)` directly on `computeLifetimeContractValue(info.row.original)` — Task 1 changed that function's return type from `number | null` to plain `number`, so the null-check branch is now dead/unreachable code and must be removed, not merely left in place. Leave the `arpu` column's cell exactly as it is today (it still branches on `null`, since `computeArpu` keeps its `number | null` return type) — do not touch it. Do not touch the `mrr`/`arr` cells, the import line, column headers, ids, or positions.

    In `deal.ts`, update the two identical JSDoc comment blocks directly above `customerType`/`confidenceLevel` — one inside the `Deal` interface (around lines 79-86), one inside `NewDealInput` (around lines 109-116) — which currently describe MRR/ARR/Lifetime Contract Value/ARPU as derived from `value`/`frequency`/`contractTermMonths`/`lineItems` via quick task 260910-fl6. Rewrite both blocks to state that these four values are derived by `src/shared/utils/deal-metrics.ts` (quick task 260910-gpd) from each line item's `type` (product vs service), `units`, and `unitPrice`, plus `contractTermMonths` — never from `Deal.value`/`Deal.frequency` — so the comment stays accurate to Task 1's corrected formulas. Both blocks should end up worded identically to each other, matching how they were identical before this edit. Do not change anything else in `deal.ts` — the `Deal`/`NewDealInput` field lists, `value`, and `frequency` themselves are untouched (per CONTEXT.md, those fields remain for other purposes).
  </action>
  <verify>
    <automated>npm run build</automated>
    <automated>npm run lint</automated>
    <automated>test "$(grep -c 'currencyFormatter.format(computeLifetimeContractValue(info.row.original))' src/features/pipeline/components/DealTable.tsx)" -eq 1</automated>
    <automated>test "$(grep -c 'arpu === null' src/features/pipeline/components/DealTable.tsx)" -eq 1</automated>
    <automated>test "$(grep -c '260910-gpd' src/shared/types/deal.ts)" -eq 2</automated>
    <human-check>Run the app (npm run dev), open the pipeline board, and expand a few deals with line items. Confirm all 4 columns (MRR, ARR, Lifetime Contract Value, ARPU) still render in the same position with the same headers as before, now showing the corrected line-item-type-based values (spot-check one deal against Task 1's worked examples). Expect roughly 2 in 5 (~39%) of the 40 seed deals to show MRR/ARR as $0 and ARPU as an em dash ("—") — this is expected given the seed data's random per-line-item product/service split, not a regression. Confirm Lifetime Contract Value always shows a real currency amount (never a dash), even for deals with a 0-month Contract Term.</human-check>
  </verify>
  <acceptance_criteria>
    - `npm run build` and `npm run lint` both exit 0
    - `lifetimeContractValue` cell renders via a direct `currencyFormatter.format(computeLifetimeContractValue(info.row.original))` call, no null-check branch
    - `arpu` cell's null-check branch is untouched
    - Both `deal.ts` doc-comment blocks reference the corrected derivation and quick task 260910-gpd
  </acceptance_criteria>
  <done>Pipeline table's 4 financial columns are unchanged in header/position/count but now display the corrected line-item-type-based values; the LTV cell's dead null-check is removed; `deal.ts`'s doc comments accurately describe the new derivation; `npm run build`/`npm run lint` both pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| `DealTable.tsx` cell renderers → `deal-metrics.ts` pure functions | In-process (not network) data flow reading only already-validated, already-stored `Deal`/`LineItem` fields — no new untrusted-input surface versus the existing (260910-fl6) boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-260910gpd-01 | Tampering | `deal-metrics.ts`'s `item.type === "service"` / `"product"` filters | low | accept | `LineItemType` is a TS union (`"product" \| "service"`) gated by the add-deal line-item schema/zod validation at every write path; no code path in this app can construct a `LineItem` with an out-of-union `type` reaching these filters |
| T-260910gpd-02 | Denial of Service | `computeArpu`'s average-unit-price division | low | mitigate | The rewritten function explicitly guards `serviceItems.length === 0` (and `contractTermMonths === 0`) and returns `null` before ever dividing, so no NaN/Infinity can reach the render layer — this guard is the literal fix Task 1 delivers over a formula that could otherwise divide by zero |
| T-260910gpd-03 | Information Disclosure | Corrected MRR/ARR/Lifetime Contract Value/ARPU values render in the pipeline table | low | accept | Same single-user, no-auth, mock-data-only trust model as every other column in this frontend-only prototype (PROJECT.md); no new data is exposed beyond what `lineItems`/`contractTermMonths` already expose to the same viewer |

</threat_model>

<verification>
- `npm run build` (`tsc -b && vite build`) exits 0 after both tasks
- `npm run lint` exits 0
- `deal-metrics.ts`'s 4 exported functions implement the line-item-type-based formulas locked in CONTEXT.md, verified against its 3 worked examples
- The billing-frequency-to-months lookup map no longer exists in `deal-metrics.ts`
- Pipeline table still renders the same 4 columns (MRR/ARR/Lifetime Contract Value/ARPU), same headers/positions, now showing corrected values; Lifetime Contract Value never shows a dash; ARPU shows a dash for deals with zero service line items or a 0-month contract term
- `deal.ts`'s two doc-comment blocks accurately describe the corrected derivation
</verification>

<success_criteria>
The pipeline table's 4 financial columns are computed from each deal's line-item type composition (product vs service) rather than `value`/`frequency`, matching CONTEXT.md's locked formula set and worked examples exactly, with no change to column headers, positions, or count, and no change to the Add Deal wizard, Customer Type, or Confidence Level.
</success_criteria>

<output>
Create `.planning/quick/260910-gpd-rework-the-pipeline-table-s-mrr-arr-life/260910-gpd-SUMMARY.md` when done
</output>

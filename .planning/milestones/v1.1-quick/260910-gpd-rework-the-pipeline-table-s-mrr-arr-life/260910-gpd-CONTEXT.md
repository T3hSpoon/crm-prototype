# Quick Task 260910-gpd: Rework the pipeline table's MRR/ARR/Lifetime Contract Value/ARPU formulas (from quick tasks 260910-ec8/fl6) to be based on line-item type (product vs service), not Value/Frequency - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Task Boundary

This is the **second correction** to a chain of quick tasks (260910-ec8 → 260910-fl6 → this one) touching the pipeline table's 4 financial columns (MRR, ARR, Lifetime Contract Value, ARPU). 260910-fl6 correctly moved these from wizard inputs to computed table columns, but got the underlying formulas wrong — they were based on `Deal.value`/`Deal.frequency`, when they should be based on the deal's line items, distinguishing `type: "product"` from `type: "service"`.

This task ONLY changes the formulas inside `src/shared/utils/deal-metrics.ts` (and their call sites in `DealTable.tsx` if signatures change, e.g. now needing `lineItems`/`contractTermMonths` instead of `value`/`frequency`). It does NOT touch the Add Deal wizard, does NOT touch Customer Type/Confidence Level, and does NOT add/remove any table columns — same 4 columns, same headers, corrected math underneath.

</domain>

<decisions>
## Implementation Decisions

### Final formula set (locked, user-confirmed after 3 rounds of clarification)

- **MRR** = Σ over the deal's line items where `type === "service"` of `(units × unitPrice)` — i.e. the sum of service-type line items' subtotals. `Deal.frequency` plays NO role in MRR anymore (previously it did — that was the bug this task fixes). Product/accessory-type line items (`type === "product"`) contribute $0 to MRR.
- **ARR** = `MRR × 12`. Unchanged shape from the prior (wrong) implementation — only MRR's own source formula changed.
- **Lifetime Contract Value (LTV)** = `Σ(subtotal of "product"-type line items) + MRR × contractTermMonths`. Two additive parts: (1) the one-time product-purchase total, (2) the recurring service revenue accrued over the full contract term. Verified against the user's own worked example: 10 products @ $300 + a $5/unit service (10 units) over a 5-year (60-month) term → `10×300 + 5×10×12×5` = `3000 + 3000` = `6000`, which is exactly `productSubtotal + MRR×contractTermMonths` (`3000 + 50×60`).
- **ARPU** = `(Σ service.unitPrice ÷ count(service line items)) × contractTermMonths`. NOTE: this is a plain average of service *unit prices* — it does NOT weight by `units`, and it does NOT involve product price/value/count at all. Verified against the user's worked example: services priced $25/$15/$5 (avg = $15) over a contract eventually confirmed to multiply by the term in months, e.g. ×60 for a 5-year term.

### Contract Term = 0 (unset) handling — asymmetric between LTV and ARPU
- **LTV**: still shows a real number when `contractTermMonths === 0` — the product-purchase portion (`Σ product subtotals`) is a genuine, always-meaningful value independent of contract term; only the recurring-service addend becomes 0. LTV is NEVER null under the new formula (a deal with zero products and zero term legitimately has $0 LTV — not "unset").
- **ARPU**: DOES go null/blank when `contractTermMonths === 0` — ARPU has no term-independent component (`avg × 0 = 0` would misleadingly hide real service pricing behind a fake $0). Also null/blank when there are zero service line items (nothing to average — same reasoning as before).
- This is a deliberate asymmetry, user-confirmed, not an oversight — do not "fix" it into symmetry.

### Scope discipline
- Do NOT touch `AddDealDialog.tsx`'s wizard fields, Customer Type/Confidence Level, or any Add Deal wizard code — this task is entirely internal to `deal-metrics.ts` and (if function signatures change) `DealTable.tsx`'s call sites.
- Do NOT change column headers/labels/positions in `DealTable.tsx` — same 4 columns as 260910-fl6 shipped, only the underlying compute functions change.
- `Deal.frequency` and `Deal.value` remain on the `Deal` type (used elsewhere — Frequency for its original Phase 3 billing-cadence purpose, Value for the pipeline table's existing Value column) — this task does not remove or repurpose either field, it just stops using them for MRR/ARR/LTV/ARPU.

### Claude's Discretion
- Exact new function signatures in `deal-metrics.ts` (e.g. `Pick<Deal, "lineItems" | "contractTermMonths">` instead of the current `Pick<Deal, "value" | "frequency" | ...>`) — planner's call, following the existing file's established pure-function convention.
- Whether to keep `PERIOD_MONTHS`/the Frequency-based helper in `deal-metrics.ts` if it becomes fully unused, or remove it — likely dead code now that MRR/ARR no longer use it; confirm via research before deciding (do not leave an orphaned unused export).

</decisions>

<specifics>
## Specific Ideas

- Worked example 1 (MRR): 18 units of a product with two attached services ($224/unit, $5/unit) → MRR = `18×224 + 18×5`.
- Worked example 2 (LTV): 10 products @ $300 + a $5/unit service (10 units), 5-year (60-month) term → LTV = `10×300 + 5×10×12×5` = `3000 + 3000` = `6000`.
- Worked example 3 (ARPU): services priced $25/$15/$5 → average = `(25+15+5)/3` = `$15`, then multiplied by the contract term in months.

</specifics>

<canonical_refs>
## Canonical References

- Quick task 260910-fl6 (`.planning/quick/260910-fl6-remove-the-arpu-mrr-arr-and-lifetime-con/`) — the implementation this task corrects. Its `deal-metrics.ts`/`DealTable.tsx` changes are the direct predecessor being reworked.
- `src/shared/types/deal.ts`'s `LineItemType = "product" | "service"` and `LineItem` interface (`id`, `productOrService`, `sku`, `units`, `unitPrice`, `type`) — the data model these formulas now key off of.
- `src/shared/utils/line-items.ts`'s `computeSubtotal` (`units × unitPrice`) — reuse this existing helper for line-item subtotals rather than re-deriving the multiplication inline, per the codebase's established DRY convention.

</canonical_refs>

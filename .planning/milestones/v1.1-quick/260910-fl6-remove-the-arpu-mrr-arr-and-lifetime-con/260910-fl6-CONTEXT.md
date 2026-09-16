# Quick Task 260910-fl6: Remove the ARPU, MRR, ARR, and Lifetime Contract Value input fields from the Add Deal wizard's step 2 (added in quick task 260910-ec8) — these should not be manually entered at deal creation. Instead, compute them from data already captured on the deal (Value, Frequency, Contract Term) and display them as new columns in the main pipeline table. Customer Type and Confidence Level stay in the Add Deal wizard as-is — this correction only affects the 4 financial metric fields. - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Task Boundary

This is a **correction** to quick task 260910-ec8, which added Customer Type, Confidence Level, and 4 manually-entered financial fields (ARPU/MRR/ARR/Lifetime Contract Value, with ARR/LTV live-auto-calculating from a manually-entered MRR) to the Add Deal wizard's step 2. The user rejected the financial-fields half of that implementation after reviewing it.

**In scope:**
- Remove ARPU, MRR, ARR, Lifetime Contract Value as wizard input fields (Controllers, schema fields, DEFAULT_VALUES entries, the `useWatch`/`useEffect` auto-calc effect from 260910-ec8) from `AddDealDialog.tsx`/`add-deal-schema.ts`.
- Remove `arpu`/`mrr`/`arr`/`lifetimeContractValue` as **stored** fields on `Deal`/`NewDealInput` in `deal.ts` — per the storage-model decision below, they become purely derived/computed values, not persisted data. Remove them from `MockDealsRepository.create()`'s pass-through and `seed-data.ts`'s generation.
- Add a selector/utility module that computes MRR, ARR, Lifetime Contract Value, and ARPU from a `Deal`'s existing `value`, `frequency`, `contractTermMonths`, and `lineItems` fields.
- Add these 4 computed values as new columns in the main pipeline table.

**Out of scope:**
- Customer Type and Confidence Level — untouched by this correction, remain exactly as 260910-ec8 left them (required wizard selects with defaults).
- Any Phase 4 forecast-page logic (unrelated, still not planned).

</domain>

<decisions>
## Implementation Decisions

### Scope of the correction
- Only the 4 financial metric fields are affected. Customer Type and Confidence Level stay in the Add Deal wizard exactly as shipped in 260910-ec8 — do not touch, do not revisit.

### ARPU formula
- **ARPU = Value ÷ total units across the deal's line items.** `units` already exists as a field on each `LineItem` (Phase 2). Sum `units` across all of a deal's `lineItems`, divide `value` by that sum.
- **Zero line items → ARPU is blank/— (not 0, not NaN, not Infinity).** A deal with no line items has no unit basis to divide by; display an empty/dash placeholder in the table cell rather than a computed number that would be misleading (division by zero).

### Storage model — purely derived, never stored
- MRR, ARR, Lifetime Contract Value, and ARPU are **NOT** stored fields on `Deal` or `NewDealInput`. They are computed on demand (in a selector/utility function, analogous to Phase 2's `sumLineItems` for `Deal.value`) from data that IS already stored: `value`, `frequency`, `contractTermMonths`, `lineItems`.
- This means: **revert** the `arpu`/`mrr`/`arr`/`lifetimeContractValue` additions to `Deal`/`NewDealInput` types, `addDealStep2Schema`, `MockDealsRepository.create()`, and `seed-data.ts`'s `buildSeedDeal()` that 260910-ec8 introduced — none of that persisted-field machinery is needed anymore.
- Rationale (user-selected, matches Phase 2's DEAL-05 precedent): always correct even when `value` changes later via inline table editing or line-item edits — no stale-copy risk, no recompute-on-every-write-path complexity.

### MRR / ARR / Lifetime Contract Value formulas
- **MRR = Value ÷ months-in-Frequency-period.** Frequency's periods, per the existing `DealFrequency` union (`monthly | quarterly | quadrimestral | semi-annual | annually`): monthly=1, quarterly=3, quadrimestral=4, semi-annual=6, annually=12. So `MRR = value / periodMonths(frequency)`.
- **ARR = MRR × 12.**
- **Lifetime Contract Value = MRR × contractTermMonths.**
- These three fully derive from fields already on `Deal` (`value`, `frequency`, `contractTermMonths`) — no new inputs anywhere, no manual entry, no wizard changes for these three.

### Table display
- Add MRR, ARR, Lifetime Contract Value, and ARPU as new **columns** in the main pipeline table (`@tanstack/react-table` grouped table from Phase 1), alongside the existing Name/Company/Value/Owner/Close Date/Stage/ID columns. Let the table scroll horizontally as needed — it already handles this at ~95% viewport width; no special collapsing/hiding behavior required by this task.
- Currency formatting: match whatever convention the existing `value` column already uses for its cell (reuse the same formatter/pattern, do not invent a new one).

### Claude's Discretion
- Exact selector/utility function name, file location (likely alongside or near `sumLineItems` in `src/shared/utils/line-items.ts`, or a new `src/shared/utils/deal-metrics.ts` — planner's call based on what's cleanest given the existing file structure), and signature.
- Column header labels and exact placement order among the new 4 columns — reasonable defaults expected, not a hard requirement.
- Whether ARPU's blank/— placeholder reuses an existing "empty cell" convention already present elsewhere in the table (check for one before inventing new markup).

</decisions>

<specifics>
## Specific Ideas

- `periodMonths` mapping for Frequency, verbatim: monthly=1, quarterly=3, quadrimestral=4, semi-annual=6, annually=12.
- ARPU = value ÷ Σ(line item units); blank/— when Σ(units) is 0.

</specifics>

<canonical_refs>
## Canonical References

- Quick task 260910-ec8 (`.planning/quick/260910-ec8-add-three-new-field-groups-to-the-add-de/`) — the implementation this task corrects. Read its PLAN.md/SUMMARY.md to know exactly what to revert vs. keep (Customer Type/Confidence Level = keep; the 4 financial fields' wizard-input/stored-field machinery = revert).
- Phase 2's DEAL-05 `sumLineItems` pattern (`src/shared/utils/line-items.ts` or wherever the research step for 260910-ec8 located it) — the precedent this task's "purely derived, never stored" decision explicitly follows.
- `src/features/pipeline/components/deal-table` (or wherever the Phase 1 `@tanstack/react-table` grouped table and its column definitions actually live) — read the existing `value` column's cell formatter before adding the 4 new ones, per the "match existing currency formatting" decision above.

</canonical_refs>

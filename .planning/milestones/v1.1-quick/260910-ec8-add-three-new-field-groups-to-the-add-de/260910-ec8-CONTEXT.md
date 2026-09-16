# Quick Task 260910-ec8: Add three new field groups to the Add Deal wizard's existing step 2 (deal terms): (1) Customer Type selector — Government, Private Utility, Private Fleet, Similar; (2) Confidence Level selector — 100%, 80%, 50%, Open to RFP Bids — intended to replace the existing per-stage win-probability placeholders used for Phase 4's planned weighted forecast value; (3) four financial metric fields — ARPU, MRR, ARR, and Lifetime Contract Value. - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Task Boundary

Extend the Add Deal wizard's existing step 2 (built in Phase 3, DEAL-06 — currently Prorata/Grace Period/Contract Term/Frequency/Currency) with three new field groups, captured on every new deal at creation, matching the existing step-2 "all required, all pre-filled with sane defaults" convention:

1. **Customer Type** — single-select enum: Government, Private Utility, Private Fleet, Similar
2. **Confidence Level** — single-select enum: 100%, 80%, 50%, Open to RFP Bids
3. **Financial metrics** — four numeric fields: ARPU, MRR, ARR, Lifetime Contract Value

This task covers the `Deal`/`NewDealInput` type extension, schema, and Add Deal wizard step-2 UI only. It does NOT implement Phase 4's forecast-page weighted-value logic — that phase is not yet planned; this task only captures the field and records a locked decision for whoever plans Phase 4 next.

</domain>

<decisions>
## Implementation Decisions

### Scope routing
- Run as a quick task with the full quality pipeline (`--full`: this discussion + research + plan-checking + verification), not a new roadmap phase — the user explicitly chose this over inserting a formal phase.

### Field placement
- All three new field groups are added to the Add Deal wizard's **existing step 2** (`AddDealDialog.tsx`'s `step === 2` `FieldGroup`, alongside Prorata/Grace Period/Contract Term/Frequency/Currency) — not a new step 3. One wizard, one deal-terms step, matching Phase 3's established form.

### Customer Type & Confidence Level — required with defaults
- Both are **required** enum fields, each shipping a **pre-selected default** — matching the existing step-2 convention where every field (Prorata, Frequency, Currency, etc.) is required and pre-filled, never blank/unset.
- Suggested defaults (Claude's Discretion on exact values, confirm during planning): Customer Type defaults to "Similar" (least commitment-implying option); Confidence Level defaults to "Open to RFP Bids" (least commitment-implying option, avoids a fabricated-looking 100%/80%/50% default on an unqualified deal).
- This carries forward the same accepted-risk shape as Phase 3's DEAL-06 prohibition (`03-SECURITY.md` AR-03-01): an un-touched default is indistinguishable from a deliberate entry. Do not re-litigate that risk here — it's an accepted, documented project precedent, not a new gap to solve in this task.

### Confidence Level → Phase 4 forecast (decision recorded for later, NOT implemented this task)
- **Locked decision for whenever Phase 4 (Forecast & Pipeline Analysis) is planned:** Confidence Level is intended to **replace** the existing per-stage win-probability placeholders (Prospect 10%/Lead 25%/Opportunity 50%/Deal 80-90%, documented in STATE.md Blockers/Concerns) as the actual input to the weighted pipeline value calculation.
- **"Open to RFP Bids" → treat as 0%** in that future weighted-value calculation — conservative, no special-casing needed in the forecast page beyond the 0% mapping (100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0).
- This task's scope is ONLY to capture the `confidenceLevel` field on `Deal`/`NewDealInput` with the right enum values — it does NOT touch the forecast page or any weighting logic (Phase 4 doesn't exist yet). The 0%-mapping decision above is recorded here so Phase 4's planner/discuss-phase picks it up as already-decided, not re-litigated.

### Financial metrics — optional, with auto-calc for ARR and Lifetime Contract Value only
- All four fields (ARPU, MRR, ARR, Lifetime Contract Value) are **optional** numeric inputs — early-stage deals often don't have firm numbers yet, unlike the other step-2 fields which always have a sane zero/default. This is a deliberate departure from "every step-2 field is required."
- **ARR** and **Lifetime Contract Value** auto-derive from already-captured data when left blank, using the SAME auto-track-with-manual-override pattern already established in this codebase for `Deal.value` (Phase 2, DEAL-05 — see `sumLineItems`/`hasManualOverride` in `pipelineStore.ts`/related components): typing a value into ARR or Lifetime Contract Value overrides the computed one; leaving it blank keeps it auto-tracking.
  - **ARR = MRR × 12** (standard recurring-revenue annualization) when MRR is entered and ARR is untouched.
  - **Lifetime Contract Value = MRR × Contract Term (months)** (Contract Term is already captured by Phase 3's `contractTermMonths` field) when MRR is entered and Lifetime Contract Value is untouched. Equivalently `ARR × (contractTermMonths / 12)` — same result, pick whichever the research step confirms is cleaner given the existing DEAL-05 pattern's implementation shape.
- **ARPU is NOT auto-calculated from anything.** No field in this project (existing or newly added) represents a unit/seat count, so ARPU (revenue per user/unit) cannot be mechanically derived from MRR/ARR alone — it is always an independently-entered, optional number with no computed relationship to the other three fields. (Claude's Discretion — flagged explicitly so the planner doesn't invent a spurious derivation.)
- If MRR is left blank, ARR and Lifetime Contract Value simply have no computed value to auto-track toward and stay blank/0 until the user enters something directly — same "sum of nothing is 0/blank" behavior DEAL-05 already established for `value` with zero line items.

### Claude's Discretion
- Exact default enum values for Customer Type ("Similar") and Confidence Level ("Open to RFP Bids") — reasonable defaults chosen above, planner should confirm these read naturally as UI copy.
- Whether ARR/Lifetime Contract Value auto-calc is implemented via the exact same helper functions DEAL-05 uses or parallel ones with the same shape — leave to the research step's findings on `sumLineItems`/`hasManualOverride`'s actual current implementation.
- Field ordering within step 2's FieldGroup, and exact validation bounds (e.g., a sane upper bound on ARPU/MRR/ARR/LTV mirroring the existing Grace Period/Contract Term `.max()` pattern) — left to planner, following established codebase conventions for bounded numeric fields.
- Whether these new fields also need a column in the pipeline table (Phase 1/2's grouped table) — NOT explicitly requested by the user this task; out of scope unless trivially cheap. Do not add table columns unless the plan can do so without expanding scope meaningfully.

</decisions>

<specifics>
## Specific Ideas

- Customer Type options, verbatim: Government, Private Utility, Private Fleet, Similar (four values, single-select, mirrors the existing Prorata/Frequency/Currency `Select` pattern in `AddDealDialog.tsx`).
- Confidence Level options, verbatim: 100%, 80%, 50%, Open to RFP Bids (four values, single-select — note the last option is a non-numeric string label distinct from the three percentage values, so its underlying stored value must be a distinct enum member, not attempt to coerce to a number).
- Financial fields: ARPU, MRR, ARR, Lifetime Contract Value — standard SaaS/subscription revenue metrics; four separate numeric inputs.

</specifics>

<canonical_refs>
## Canonical References

- `03-01-PLAN.md` / `03-SECURITY.md` (this repo) — the accepted-risk precedent for required-with-defaults fields whose un-touched values are indistinguishable from deliberate entry (AR-03-01), which this task's Customer Type/Confidence Level fields deliberately follow rather than re-solve.
- Phase 2's DEAL-05 auto-track-with-manual-override pattern (`sumLineItems`/`hasManualOverride` in `pipelineStore.ts` and related components) — the established codebase convention this task's ARR/Lifetime-Contract-Value auto-calc must mirror, per the research step's findings on its exact current shape.
- STATE.md's Blockers/Concerns entry on placeholder stage-probability percentages (Prospect 10%/Lead 25%/Opportunity 50%/Deal 80-90%) — the thing Confidence Level is recorded (not yet implemented) to eventually replace in Phase 4.

</canonical_refs>

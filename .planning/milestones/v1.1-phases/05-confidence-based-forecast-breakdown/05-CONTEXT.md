# Phase 5: Confidence-Based Forecast Breakdown - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can edit a deal's confidence level directly from the pipeline table (DEAL-07), and the Forecast page gains a new confidence-grouped financial breakdown table covering every deal in the pipeline — open, won, and lost (FCST-03, FCST-04). Does NOT touch: the existing stat tiles (raw/weighted pipeline value, win rate) or the lost-by-reason/lost-by-stage bar charts already on the Forecast page — this phase adds a new section, it doesn't modify those; does NOT touch stage-move logic (`StageSelect`, `moveStage`/`moveToLost`/`moveToWon`), line-item CRUD, or the Add Deal wizard's existing Confidence field (creation-time capture is already shipped, unaffected).

</domain>

<decisions>
## Implementation Decisions

### Confidence inline-edit UI
- **D-01:** The Confidence cell uses the same click-to-edit shell as owner/value/closeDate (`EditableCell`) — clicking the cell swaps its display text for an editable control, commits on change, Escape cancels. Matches ROADMAP.md's explicit "same inline click-to-edit pattern" wording for Success Criterion 1.
- **D-02:** The control that appears is the shadcn Select component (Radix), not a native `<select>` — matches `StageSelect`'s existing enum-picker styling/pattern rather than introducing the only native form control in the table. Since `EditableCell` currently only renders a plain `<input>`, this is new: either extend `EditableCell` with a "select" variant, or build a small sibling component (e.g. `ConfidenceCell`) that reuses `EditableCell`'s click-to-reveal/commit/cancel state machine with a shadcn Select instead of an `<input>`. Planner's call on exact code shape — no constraint given beyond "click-to-reveal + shadcn Select".
- **D-03:** `confidenceLevel` needs a validation rule added to `dealEditSchema` (or an equivalent) so `EditableCell`'s existing safeParse-before-commit guard covers it, mirroring how `value`/`owner`/`closeDate` are already validated — `z.enum(["100", "80", "50", "open-to-rfp"])`.

### Model column (multiple SKUs)
- **D-04:** The breakdown table's "Model" column comma-joins **all** of a deal's line-item SKUs (not scoped to service-type only) — mirrors the Services column's own comma-join convention (FCST-03 wording), giving both multi-value columns the same join rule.
- **D-05:** A deal with zero line items renders an em-dash (`—`) in Model and Services, not an empty string — matches `EditableCell`'s existing em-dash convention for a missing `closeDate`.

### ARPU zero-quantity display
- **D-06:** ARPU = MRR / Quantity. When Quantity (sum of service-type line-item units) is 0 — i.e. the deal has no service line items — the cell renders `—`, not `$0`. Matches D-05's em-dash convention and the Forecast page's existing "—" / "No closed deals yet." pattern for win rate when `won + lost === 0`.
- **D-07:** The same zero-guard applies to a confidence group's subtotal row and the grand-total row: if the aggregate Quantity for that row is 0, its ARPU shows `—` rather than `$0` or a division error. (FCST-04's subtotal wording only names Quantity/MRR/ARR/Lifetime Contract Value as summed columns — if the planner includes an aggregate ARPU on subtotal/grand-total rows at all, computed as aggregate-MRR / aggregate-Quantity, it must use this same em-dash guard. Whether to show ARPU on subtotal/grand-total rows in the first place is planner's call per FCST-04's literal column list.)

### Breakdown table layout
- **D-08:** Confidence groups appear in descending order: 100% → 80% → 50% → Open-to-RFP. Matches `forecast-metrics.ts`'s existing `CONFIDENCE_WEIGHT` mapping order (1.0/0.8/0.5/0.0).
- **D-09:** A confidence group with zero deals still renders (not hidden) with its section header and an empty-state row (subtotal effectively $0/—), matching the existing pipeline `GroupSection`/`DealTable` precedent where every group always shows, with a "No deals in this group yet." style message when empty.
- **D-10:** The new table lives in a new section on the existing `ForecastPage` component, placed below the current stat tiles + `LostBreakdownChart` charts — one scrollable read-only analysis page, no new sub-navigation/tabs introduced (consistent with Phase 4's D-03: Forecast has no separate sub-nav).
- **D-11:** All confidence groups and their deal rows are always expanded — no chevron/collapse interaction. Matches FCST-03/04's plain "view a table" framing; unlike the pipeline table's line-items sub-row (which has a genuine reason to default-collapse: verbose per-line-item detail), there's no analogous reason to hide rows here.

### Claude's Discretion
- Exact component shape for D-02 (extend `EditableCell` with a variant vs. a new sibling component) — no constraint given; pick whichever keeps `EditableCell`'s existing four-column contract (name/value/owner/closeDate) simplest to read, per the codebase's existing single-responsibility file pattern.
- Whether the breakdown table is a new plain HTML table (matching subtotal/grand-total row needs, which `@tanstack/react-table`'s `/legacy` subpath doesn't natively support) or built on TanStack Table with synthetic subtotal rows appended to `data` — no constraint given; existing `DealTable.tsx` uses the `/legacy` subpath for per-group tables, but this new table's shape (4 fixed groups + subtotal rows + 1 grand-total row) is structurally different enough that a plain table may be simpler. Planner's call.
- Whether ARPU appears at all on subtotal/grand-total rows (see D-07) — FCST-04 only lists Quantity/MRR/ARR/Lifetime Contract Value as summed columns; planner may omit an ARPU cell entirely on those rows, or include an aggregate ARPU using D-07's em-dash guard. Either satisfies the discussion.
- Whether Contract Length (months) needs any special empty-state treatment — no constraint given; `contractTermMonths` is already a required, always-populated field on `Deal` (Phase 3, DEAL-06), so no zero/missing-value gray area exists here the way it does for ARPU.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — Current Milestone (v1.1) goal/target features; Key Decisions table entries: "ARPU reintroduced as MRR / service quantity (derived, never stored)", "Forecast table's 'Model' column reuses `LineItem.sku`", "Confidence-grouped forecast table includes all deals regardless of outcome (open/won/lost)" — all three are locked, not gray areas, and directly inform D-04/D-06/D-09 above
- `.planning/REQUIREMENTS.md` — DEAL-07, FCST-03, FCST-04 requirement text (lines 12, 16-17) and Phase 5 traceability; Out of Scope table confirms no new `LineItem.model` field and confirms the all-outcomes (not open-only) scope
- `.planning/ROADMAP.md` — Phase 5's goal and 4 success criteria (lines 38-49); explicit dependency on Phase 4; "UI hint: yes" flag (a `05-UI-SPEC.md` via `/gsd-ui-phase 5` may be worth running before/alongside planning given the new table's layout complexity)
- `.planning/STATE.md` — Locked Confidence Level → weight mapping (100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0), already consumed by `forecast-metrics.ts`'s `CONFIDENCE_WEIGHT`; informs D-08's group ordering

### Data model & existing table/store mechanics
- `src/shared/types/deal.ts` — `Deal.confidenceLevel: ConfidenceLevel` (`"100"|"80"|"50"|"open-to-rfp"`), already exists and is populated at creation; `LineItem.sku`/`productOrService`/`type`/`units`/`unitPrice`; `Deal.contractTermMonths`
- `src/features/pipeline/components/EditableCell.tsx` — the click-to-edit-in-place pattern D-01/D-02 extend; currently `EditableColumnId = "name" | "value" | "owner" | "closeDate"`, needs a `"confidenceLevel"` addition (or sibling component) plus display-text formatting (e.g. "100%" / "Open to RFP")
- `src/features/pipeline/components/deal-edit-schema.ts` — `dealEditSchema`, the zod schema `EditableCell.commit()` validates against before calling `updateDeal`; needs a `confidenceLevel` field added per D-03
- `src/features/pipeline/components/StageSelect.tsx` — the shadcn Select + `stopPropagation` pattern D-02 should mirror for a Confidence dropdown's visual/interaction style (not its popover-gating logic — Confidence has no analogous "requires a reason" gate)
- `src/features/pipeline/components/DealTable.tsx` — where the new Confidence column/cell gets added to the `columns` array (uses `legacyCreateColumnHelper`/`useLegacyTable` from `@tanstack/react-table/legacy`)
- `src/features/forecast/components/ForecastPage.tsx` — reads `usePipelineStore((s) => s.deals)` (full, unfiltered array — the new breakdown table must do the same, per Phase 4's D-03 "Forecast numbers must never silently reflect a forgotten search/filter" prohibition); this is where the new table section (D-10) mounts, below the existing `StatTile`/`LostBreakdownChart` grid
- `src/features/forecast/forecast-metrics.ts` — `CONFIDENCE_WEIGHT` mapping (order source for D-08); pure derived-value module pattern this phase's new grouping/subtotal functions should mirror (no store/repository imports)
- `src/shared/utils/deal-metrics.ts` — `computeMrr`, `computeArr`, `computeLifetimeContractValue` — all reusable as-is for the breakdown table's MRR/ARR/Lifetime Contract Value columns; ARPU (MRR / service-line-item Quantity) needs a **new** function here (explicitly removed previously per the file's own comment: "ARPU was removed entirely (calculation and column)" — this phase reintroduces it as a pure derived function, never a stored field, per PROJECT.md's locked decision)
- `src/shared/utils/line-items.ts` — `computeSubtotal`; Quantity (sum of service-type line-item `units`) is a new derived value this phase needs, likely alongside `computeMrr` in `deal-metrics.ts` or as its own small function

### Prior phase context
- `.planning/milestones/v1.0-phases/04-forecast-pipeline-analysis/04-CONTEXT.md` — D-03 ("Forecast page is read-only, no Add Deal button"), D-08/D-09 (raw/weighted pipeline value scoped to open deals only — the NEW breakdown table explicitly does NOT follow this scope, per PROJECT.md's "all deals regardless of outcome" decision, a deliberate contrast worth flagging to planner), the derived-value-module convention `forecast-metrics.ts`/`deal-metrics.ts` both follow
- `.planning/milestones/v1.0-phases/03.1-lost-won-tracking/03.1-CONTEXT.md` — confirms `lostReason`/contract-term fields are cleared on transitions away from Lost/Won (Phase 4's CR-01 fix); relevant because the new breakdown table includes lost/won deals and must not display stale terminal-state data

### Tech stack
- `.claude/CLAUDE.md` (Technology Stack section) — shadcn/ui Select already in use (`src/components/ui/select.tsx`); no new dependency needed for D-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/pipeline/components/EditableCell.tsx` — click-to-edit shell (display span → input on click → commit/cancel) to extend or mirror for the Confidence cell
- `src/features/pipeline/components/StageSelect.tsx` — shadcn Select + `e.stopPropagation()` guard pattern (so entering edit mode never triggers a row click) to mirror for the Confidence dropdown's visual style
- `src/shared/utils/deal-metrics.ts` — `computeMrr`/`computeArr`/`computeLifetimeContractValue`, directly reusable for 4 of the breakdown table's 9 columns
- `src/features/forecast/components/StatTile.tsx` — existing stat-display primitive, may be reusable for the grand-total row's summary presentation if the planner wants a visual echo of it (not required)

### Established Patterns
- Derived values are never stored on `Deal` — always computed at render/selector time (`line-items.ts`/`deal-metrics.ts`/`forecast-metrics.ts` convention); the new ARPU/Quantity functions and all breakdown-table grouping/subtotal logic must follow this
- Repository/store seam: all writes go through `usePipelineStore` actions (`updateDeal`) calling the repository — Confidence edits reuse the existing `updateDeal` action, no new write path
- Forecast page reads the full unfiltered `deals` array directly, never a Pipeline-tab-filtered subset (Phase 4 data-integrity rule) — the new table must follow this too
- Every entity addressed by stable `id`, never array index — unaffected by this phase, but applies to however the breakdown table keys its rows

### Integration Points
- `DealTable.tsx`'s `columns` array is the single integration point for the new Confidence cell (D-01/D-02) — no parallel table implementation
- `ForecastPage.tsx` is the single integration point for the new breakdown table section (D-10) — mounts below the existing stat-tile/chart grid, reads `usePipelineStore((s) => s.deals)` the same way

</code_context>

<specifics>
## Specific Ideas

- No particular visual/chart references were given beyond following the existing Forecast page and pipeline table's established visual conventions — open to standard table layout within PROJECT.md's "own visual identity" constraint.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.

</deferred>

---

*Phase: 5-Confidence-Based Forecast Breakdown*
*Context gathered: 2026-09-15*

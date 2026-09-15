# Phase 4: Forecast & Pipeline Analysis - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can search, filter, and sort the existing grouped pipeline table (PIPE-04, PIPE-05, PIPE-06), and can view a new Forecast page that turns the now-complete deal, line-item, and lost/won data into raw pipeline value, weighted/projected value, win rate, and a lost-deal breakdown by reason and by stage (FCST-01, FCST-02). Does NOT touch: Phase 1-3.1's core deal CRUD, line items, deal-terms wizard, or lost/won capture flows themselves — this phase only reads that data and adds search/filter/sort/analysis on top, plus one small targeted fix to `moveStage`/`moveToLost`/`moveToWon` (see CR-01 below) needed so FCST-02 consumes clean data.

</domain>

<decisions>
## Implementation Decisions

### Forecast page navigation
- **D-01:** Navigation between the Pipeline board and the new Forecast page is a simple local view-state tab/toggle (no router) — top-level tabs ("Pipeline" / "Forecast") replace App.tsx's current bare "Pipeline" header, reusing PipelineBoard's existing 95%-width page shell/padding so the Forecast page reads as a sibling view, not a different app. No new routing dependency; matches CLAUDE.md's explicit "zero routing needs, plain SPA" framing and the fact that no router is installed today. — **Reversibility:** reversible — swapping to a real router later only touches the top-level view-switch, not the page content.
- **D-02:** Switching tabs preserves Pipeline board state (search/filter/sort query, expanded line-item rows) — the Pipeline board does not remount/reset when the user visits Forecast and comes back. Implementation detail (state lives in the store vs. staying mounted-but-hidden) is planner's call.
- **D-03:** The Forecast page has no "Add Deal" button — it is read-only analysis. Add Deal stays a Pipeline-tab-only action, consistent with FCST-01/02's "view a forecast page" wording.

### Search/filter/sort scope
- **D-04:** Search/filter/sort operate **within** each of the 6 existing per-group tables (Prospect/Lead/Opportunity/Deal/Won/Lost), not by flattening the board into one single table. A search/filter hides non-matching rows inside every group's own `DealTable`; a group can end up empty and shows its existing empty-state copy. Preserves the grouped-board visual identity established in Phase 1. — **Reversibility:** costly — flattening later would mean redesigning `PipelineBoard`/`GroupSection`'s core layout.
- **D-05:** Search input and filter controls live in **one shared toolbar** in `PipelineBoard`'s header row (next to "Add Deal"), not per-group. The resulting query/filter state is passed down into every `GroupSection`/`DealTable` so all 6 groups filter in sync from one place.
- **D-06:** PIPE-05's "filter by stage" is implemented as a **group-visibility toggle** — a multi-select control (checkboxes/pills for Prospect/Lead/Opportunity/Deal/Won/Lost) that shows/hides entire `GroupSection` blocks. It does not change what group a deal displays under; it only controls which of the 6 sections are currently rendered. (E.g., user unchecks Lost and Won to focus on the active pipeline.)
- **D-07:** Sorting (PIPE-06: value/close date/owner) is triggered via **clickable column headers** in each group's table — click Value/Close Date/Owner to sort ascending, click again for descending, with an arrow indicator. The same sort column/direction applies to all 6 group tables at once, driven from the shared toolbar/state (not independent per-group sort state). `DealTable.tsx`'s existing comment ("Uses getCoreRowModel() only — no sorting/filtering/grouping row models this phase (Phase 4, PIPE-05/06)") confirms this table was left deliberately unwired for exactly this phase to add `getSortedRowModel`/`getFilteredRowModel` from the same `/legacy` compat subpath.

### Pipeline value & win rate formulas
- **D-08:** "Raw pipeline value" (FCST-01) sums `Deal.value` across **open deals only** (`outcome === "open"`, i.e. Prospect/Lead/Opportunity/Deal) — excludes Won (closed revenue, already shown separately as contracts) and Lost (fell through).
- **D-09:** "Weighted/projected value" = Σ (`deal.value` × confidence weight) over the same open-deals scope as D-08, using the already-locked Confidence Level → weight mapping from STATE.md (2026-09-10): 100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0. This mapping is not being re-litigated here — treat it as decided; it replaces the old stage-probability placeholders entirely. — **Reversibility:** reversible — a pure computed-value function, no data model impact.
- **D-10:** "Win rate" = `won / (won + lost)` — only counts deals that reached a terminal outcome; still-open deals are excluded from both numerator and denominator (the conventional sales-forecasting definition, avoids understating the rate with in-progress deals).
- **D-11:** FCST-02's lost-deal breakdown (by reason and by stage) is displayed as **Recharts bar charts** — `recharts` (not yet installed; CLAUDE.md's recommended stack, confirmed React-19-compatible) is added as a new dependency for this phase. The Forecast page also shows simple stat tiles for raw pipeline value, weighted value, and win rate alongside the two bar charts.

### Lost/Won stale-field cleanup (CR-01)
- **D-12:** Phase 4 fixes the gap flagged in `03.1-REVIEW.md` CR-01 / STATE.md Blockers: `moveStage`, `moveToLost`, and `moveToWon` currently leave the opposing terminal state's fields stale when a deal transitions away from Lost or Won (e.g. a deal moved back to Opportunity from Lost keeps its old `lostReason`). This phase clears `lostReason` on any move to a non-lost group, and clears `contractStartDate`/`contractEndDate`/`contractSignedDate`/`paymentTerms` on any move to a non-won group. This was explicitly called out in STATE.md as needing resolution "before Phase 4's FCST-02 (loss-reason breakdown) consumes lostReason/contract-term data" — fixing it now removes the risk at the source rather than relying on every future query to filter correctly by current `outcome`.
- **D-13:** The clearing logic is **centralized in one place** — a small helper (planner's call on exact location/name, e.g. alongside `fromPipelineGroup` in `src/shared/utils/pipeline-group.ts`) that returns the correct clear-patch for a given target group. `moveStage`, `moveToLost`, and `moveToWon` in `pipelineStore.ts` all call it, so the clearing behavior can't drift between the three call sites or be forgotten by a future 4th caller. — **Reversibility:** reversible — an additive store-layer fix, no type/shape changes to `Deal`.

### Claude's Discretion
- Exact implementation of "Pipeline board state preserved across tab switches" (D-02) — whether search/filter/sort state lives in a new Zustand slice, local state lifted above the tab switch, or the Pipeline board component simply staying mounted (hidden via CSS) while Forecast is active. No constraint given; pick whichever is simplest given how the toolbar state (D-05) ends up being structured.
- Exact shape/location of the search/filter state (single object vs. several `useState`s, whether it lives in `pipelineStore.ts` or a new hook) — no constraint given; follow the existing selector-hook convention (`usePipelineGroups.ts`) if it fits naturally.
- Exact Recharts chart types/styling beyond "bar charts" for the lost-by-reason/lost-by-stage breakdown, and the exact stat-tile layout for pipeline value/weighted value/win rate — no constraint given; follow the project's existing "own visual identity, not a monday.com clone" convention (PROJECT.md Key Decisions).
- Exact helper name/location for D-13's clear-patch logic — no constraint given; `fromPipelineGroup` in `src/shared/utils/pipeline-group.ts` is the natural home given it already owns the analogous "compute fields for a target group" responsibility, but planner may choose otherwise if a cleaner shape emerges.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — core value, active requirements ("Forecast page..." is the last Active requirement), locked Key Decisions table (includes the Confidence Level mapping context and CR-01's "flagged for a fix before Phase 4's FCST-02" note)
- `.planning/REQUIREMENTS.md` — PIPE-04, PIPE-05, PIPE-06, FCST-01, FCST-02 requirement text (lines 15-17, 39-40) and Phase 4 traceability
- `.planning/ROADMAP.md` — Phase 4's goal and 5 success criteria (lines 133-148); explicit dependency on Phase 1, 2, 3, 3.1
- `.planning/STATE.md` — **Locked decision (2026-09-10):** Confidence Level (100%/80%/50%/Open to RFP Bids) replaces the old stage-probability placeholders as the weighted-value input, with the exact mapping (1.0/0.8/0.5/0.0) — treat as already-decided, not a gray area (see D-09). Also carries the CR-01 stale-field note this phase resolves (see D-12/D-13).
- `.planning/phases/03.1-lost-won-tracking/03.1-REVIEW.md` — CR-01's original finding: `moveToLost`/`moveToWon`/`moveStage` leave stale opposing-terminal-state fields, reachable via the shipped `StageSelect` dropdown, accepted as a deferred gap at Phase 3.1's UAT specifically to be fixed here

### Data model & existing table/store mechanics
- `src/shared/types/deal.ts` — `Deal`, `DealOutcome`, `PipelineGroup`, `ConfidenceLevel` (already has the `"100"|"80"|"50"|"open-to-rfp"` shape D-09's mapping consumes), `lostReason`/`contractStartDate`/`contractEndDate`/`contractSignedDate`/`paymentTerms` (the fields D-12 clears)
- `src/shared/utils/pipeline-group.ts` — `toPipelineGroup`/`fromPipelineGroup`; natural home for D-13's centralized clear-patch helper
- `src/features/pipeline/store/pipelineStore.ts` — `moveStage`, `moveToLost`, `moveToWon` actions D-12/D-13 modify; `deals` array all forecast calculations read from
- `src/features/pipeline/components/DealTable.tsx` — per-group `@tanstack/react-table` instance using the `/legacy` compat subpath (`getCoreRowModel` only); the file's own comment flags it as intentionally left unwired for this phase's sort/filter row models (see D-07)
- `src/features/pipeline/hooks/usePipelineGroups.ts` — `GROUPS` constant + the store selector hook that pre-partitions deals into the 6 groups; D-06's group-visibility toggle filters this hook's output, not `toPipelineGroup` itself
- `src/features/pipeline/components/PipelineBoard.tsx` — top-level board component; owns the header row (Add Deal button) D-01/D-05 extend with tabs + shared toolbar
- `src/shared/utils/deal-metrics.ts` — existing derived-value module pattern (MRR/ARR/Lifetime Contract Value) to mirror for the new pipeline-value/weighted-value/win-rate calculation functions

### Prior phase context
- `.planning/phases/03.1-lost-won-tracking/03.1-CONTEXT.md` — Lost/Won data shape decisions (`lostReason` as `"{category}: {note}"` or bare category string; contract-term fields all optional, set together by `moveToWon`) that D-12's clearing logic and FCST-02's breakdown both depend on
- `.planning/phases/01-pipeline-board-foundation/01-CONTEXT.md` — Phase 1's `PipelineGroup`/`DealTable` foundation this phase's sort/filter work extends

### Tech stack
- `.claude/CLAUDE.md` (Technology Stack section) — Recharts recommended for forecast/analytics charts (D-11, not yet installed — `package.json` has no `recharts` dependency today); `@tanstack/react-table@9.2.3`'s `/legacy` subpath already established as this project's table API surface (do not switch to the v9-native API for sort/filter row models)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/pipeline/components/DealTable.tsx` — column definitions (`legacyCreateColumnHelper`) and the `getCoreRowModel()`-only `useLegacyTable` setup this phase extends with `getSortedRowModel`/`getFilteredRowModel` from the same `/legacy` subpath
- `src/features/pipeline/hooks/usePipelineGroups.ts` — the `GROUPS` array and grouping selector this phase's group-visibility toggle (D-06) filters
- `src/shared/utils/deal-metrics.ts` — pure derived-value function pattern (no store/repository imports) to mirror for pipeline-value/weighted-value/win-rate/lost-breakdown calculations
- `src/shared/utils/pipeline-group.ts` — `fromPipelineGroup`'s existing "compute fields for a target group" shape, the natural pattern to extend for D-13's clear-patch helper

### Established Patterns
- Repository/store seam: all writes go through `usePipelineStore` actions calling the repository — D-12/D-13's fix stays inside this existing seam, no new write path
- Derived values are never stored on `Deal` — always computed at render/selector time (mirrors `line-items.ts`/`deal-metrics.ts`); the new forecast calculations (pipeline value, weighted value, win rate, lost breakdown) follow the same convention
- Every entity addressed by stable `id`, never array index (unaffected by this phase's changes)

### Integration Points
- `PipelineBoard.tsx`'s header row is where the new tab switcher (D-01) and shared search/filter toolbar (D-05) both integrate
- `DealTable.tsx` is the single integration point for sort/filter row models (D-04/D-07) — no parallel table implementation
- The new Forecast page is a new top-level component/feature area (e.g. `src/features/forecast/`) reading from `usePipelineStore`'s `deals` via new selector/derived-value functions, following the same store-read pattern as `usePipelineGroups`

</code_context>

<specifics>
## Specific Ideas

- No particular visual/chart references were given beyond CLAUDE.md's own Recharts recommendation and the project's standing "own visual identity" convention (PROJECT.md Key Decisions) — open to standard dashboard layout (stat tiles + bar charts) within that constraint.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No scope-creep suggestions came up.

</deferred>

---

*Phase: 4-Forecast & Pipeline Analysis*
*Context gathered: 2026-09-15*

---
phase: 05-confidence-based-forecast-breakdown
verified: 2026-09-16T07:33:11Z
status: passed
score: 13/18 must-haves verified
behavior_unverified: 5
overrides_applied: 0
behavior_unverified_items:

  - truth: "Clicking a deal's Confidence cell reveals the Select control, selecting a value commits via updateDeal and re-renders, and Escape/click-away without selecting reverts to the plain display text (D-01, D-02)."
    test: "Click a deal's Confidence cell in the pipeline table; confirm it reveals a Select (click again to open); pick a different value and confirm the cell shows the new label. Then click the cell, open the Select, and press Escape without picking a value; confirm it reverts to the unchanged plain text."
    expected: "Select reveals/opens on click, commits the new value and re-renders on selection, and collapses back to the unchanged display text on Escape/click-away."
    why_human: "State-transition (edit-mode toggle, commit, revert-on-cancel) driven by onOpenChange/isEditing local component state — no component/interaction test exists this phase; grep/presence checks cannot exercise a click/keyboard sequence."

  - truth: "While a commit is in flight, further clicks on the Confidence cell are ignored (isPending guard); a rejected/failed commit shows the shared 'Update failed — your change wasn't saved. Try again.' message inline and reverts to the last committed value."
    test: "Force updateDeal to reject (e.g. via a dev-tools breakpoint or temporarily stubbing dealsRepository.update to throw) while a Confidence edit is committing; confirm the inline error message appears and the displayed value reverts to the last committed value, and confirm clicking the cell again mid-commit does nothing."
    expected: "isPending blocks re-entry; on failure the shared UPDATE_FAILED_MESSAGE renders below the cell and the display reverts to the pre-edit value."
    why_human: "Error-path/cancellation invariant — the mock repository never naturally rejects, so this path requires a human to force a failure and observe the UI; not exercised by any existing test."

  - truth: "Changing a deal's Confidence Level in the pipeline table moves that deal into the corresponding confidence group the next time the Forecast page's breakdown table renders (Success Criterion 4)."
    test: "Edit a deal's Confidence Level in the pipeline table, navigate to the Forecast page, and confirm the deal now appears under the new confidence group (and both affected groups' subtotals plus the grand total reflect the move)."
    expected: "The deal row relocates to the new group; the old group's subtotal decreases, the new group's subtotal increases, and the grand total is unchanged."
    why_human: "Cross-component state-propagation invariant (Zustand store update -> ForecastPage selector -> re-derived grouping) — no integration/e2e test exercises the full edit-then-navigate flow this phase, only the pure grouping function in isolation."

  - truth: "No loading/skeleton state is ever reachable anywhere in the breakdown table — it is a pure synchronous derivation from the in-memory Zustand store with no async fetch this phase."
    test: "View the Forecast page's Confidence Breakdown table on initial load and after any interaction; confirm no loading spinner/skeleton ever appears."
    expected: "The table renders its final content immediately on every render, with no intermediate loading state visible."
    why_human: "Declared verification: backstop — per verifier rules, presence/absence of loading-state code is not sufficient evidence; requires direct observation of the rendered page."

  - truth: "A deal with 6+ line items produces a long comma-joined Model/Services string that wraps onto a second line within its row rather than being clipped or ellipsis-truncated, and the row's height grows to fit."
    test: "View a deal with 6+ line items in the Confidence Breakdown table; confirm the Model/Services cell text wraps onto multiple lines and the row grows in height, rather than being clipped or ellipsis-truncated."
    expected: "Long comma-joined text wraps; no truncation/ellipsis/overflow-hidden is applied."
    why_human: "Declared verification: backstop — a visual wrapping claim; code shows no truncate/ellipsis classes (consistent with wrapping) but this is not authoritative evidence per verifier rules; requires direct visual observation."
human_verification:

  - test: "Click a deal's Confidence cell in the pipeline table — confirm it reveals a Select control (click once more to open it) listing 100%/80%/50%/Open to RFP Bids. Pick a different value and confirm the cell now shows the new label. Click the cell, open the Select, then press Escape without picking a value — confirm it reverts to the plain text display of the unchanged value. Try this on a deal already in the Won or Lost group (Contracts/Lost sections) — confirm the Confidence cell is still editable there too, and that the deal's stage/outcome does not change as a side effect."
    expected: "Select reveals/opens, commits new value and re-renders; Escape reverts to unchanged value; editable in Won/Lost groups with no stage/outcome side effect."
    why_human: "Interactive click/keyboard state machine — not exercised by any automated test this phase."

  - test: "Force a Confidence commit to fail (e.g. temporarily stub dealsRepository.update to throw) and confirm the inline 'Update failed — your change wasn't saved. Try again.' message appears and the cell reverts to the last committed value; confirm rapid re-clicking during a pending commit is a no-op."
    expected: "Error message shown, value reverts, isPending blocks re-entry."
    why_human: "Error-path/cancellation invariant untested by automation."

  - test: "Edit a deal's Confidence Level in the pipeline table, return to the Forecast page, and confirm the deal (and both affected groups' subtotals, and the grand total) reflect the change."
    expected: "Deal relocates to the new confidence group; subtotals and grand total update accordingly."
    why_human: "Cross-component state-propagation not covered by an integration/e2e test."

  - test: "Confirm no loading/skeleton state is ever visible anywhere in the Confidence Breakdown table."
    expected: "Table always renders final content synchronously."
    why_human: "Backstop-tagged claim; code absence of loading state is not authoritative evidence per verifier rules."

  - test: "View a deal with 6+ line items in the Confidence Breakdown table and confirm the Model/Services text wraps onto a second line (row grows) rather than being clipped/ellipsis-truncated."
    expected: "Text wraps, row height grows; no truncation."
    why_human: "Backstop-tagged visual claim requiring direct observation."
---

# Phase 5: Confidence-Based Forecast Breakdown Verification Report

**Phase Goal:** Make confidence level editable per deal in the pipeline, and add a grouped-by-confidence financial breakdown table to the Forecast page.
**Verified:** 2026-09-16T07:33:11Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Confidence cell click-to-edit reveal/select/commit/Escape-revert (D-01, D-02) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `ConfidenceCell.tsx` implements the full isEditing/isPending/error state machine, `onOpenChange` collapse-on-close, and `commit()` calling `updateDeal`; no component/interaction test exists — see human verification |
| 2 | Confidence cell editable for deals in any outcome (open/won/lost) | ✓ VERIFIED | `DealTable.tsx`'s single shared `columns` array (including the `confidenceLevel` column) is used unconditionally by `GroupSection`/`DealTable` for every pipeline group (prospect/lead/opportunity/deal/won/lost) — no outcome-based conditional exists anywhere in the column definitions |
| 3 | Invalid/malformed confidenceLevel rejected client-side via `dealEditSchema.shape.confidenceLevel.safeParse` before `updateDeal` (D-03) | ✓ VERIFIED | `ConfidenceCell.tsx` line 57: `dealEditSchema.shape.confidenceLevel.safeParse(next)` runs before any call to `updateDeal`; `deal-edit-schema.ts` line 13 declares `confidenceLevel: z.enum(["100","80","50","open-to-rfp"])` |
| 4 | isPending guard blocks re-entry; failed commit shows shared 'Update failed...' message and reverts to last committed value | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code present (`if (isPending) return;` guard on click, `catch { setError(UPDATE_FAILED_MESSAGE) }`) but the mock repository never naturally rejects — no test exercises the failure path |
| 5 | Model column comma-joins ALL line-item SKUs (not scoped to service-type); em-dash fallback for blank/empty (D-04, D-05) | ✓ VERIFIED | `deal-metrics.test.ts` unit test confirms `joinModelSkus` filters blanks and joins all skus (`"ABC, DEF"`); `ForecastBreakdownTable.tsx` renders `joinModelSkus(deal) \|\| "—"` |
| 6 | ARPU renders '—' (never $0/division error) when Quantity is 0, per-deal and on subtotal/grand-total (D-06, D-07) | ✓ VERIFIED | `deal-metrics.test.ts` (`computeArpu({lineItems:[]})` → `null`) and `forecast-breakdown.test.ts` (`computeGroupTotals([])` → `arpu: null`) both pass; rendering code checks `=== null` before formatting in all 3 row types (deal row, subtotal, grand total) |
| 7 | 4 confidence groups always render in fixed descending order 100→80→50→open-to-rfp via `CONFIDENCE_LEVELS` (D-08) | ✓ VERIFIED | `ForecastBreakdownTable.tsx` iterates `CONFIDENCE_LEVELS.map(...)` (imported from `confidence-level.ts`) for both grouping and rendering — never `Object.keys()` |
| 8 | Empty confidence group still renders header + "No deals in this group yet." + its own subtotal row (D-09) | ✓ VERIFIED | Group header `<tr>` and the subtotal `<tr>` render unconditionally per group; only the deal-rows-vs-empty-state ternary is conditional on `groupDeals.length` |
| 9 | Deal rows within a group render in store's existing array order, never re-sorted | ✓ VERIFIED | `groupDealsByConfidence` pushes deals in input-array order with no `.sort()`; `ForecastBreakdownTable` maps `groupDeals` directly with no reordering |
| 10 | Breakdown table lives in new section below stat tiles/charts on Forecast page, reads same unfiltered `deals` selector (D-10) | ✓ VERIFIED | `ForecastPage.tsx` renders `<h2>Confidence Breakdown</h2>` + `<ForecastBreakdownTable deals={deals} />` below the existing chart grid, reusing the single `usePipelineStore((s) => s.deals)` selector already declared at the top of the component — no second subscription |
| 11 | All 4 groups and every deal row always fully expanded — no chevron/collapse (D-11) | ✓ VERIFIED | `ForecastBreakdownTable.tsx` has no expand/collapse state, no `@tanstack/react-table` usage — plain unconditional row rendering |
| 12 | Subtotal row immediately follows its group's deal rows; Grand Total is always the final row (FCST-04) | ✓ VERIFIED | Each group's subtotal `<tr>` is rendered inside the same `<Fragment key={level}>` immediately after that group's deal rows/empty-state; the single Grand Total `<tr>` is rendered once, after the `CONFIDENCE_LEVELS.map` loop, as the table's last row |
| 13 | Subtotal/grand-total rows show "—" for Model, Services, Contract Length; never blank/stray 0 (Pitfall 2) | ✓ VERIFIED | Both row types hardcode literal `"—"` for those 3 columns; only Quantity/ARPU/MRR/ARR/Lifetime Contract Value are computed via `computeGroupTotals` |
| 14 | Confidence edit relocates the deal (and its dollar figures) into the corresponding group on next Forecast render (Success Criterion 4) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Structurally sound (immutable `deals` replace-by-id in the store, `ForecastBreakdownTable` re-derives grouping from the `deals` prop on every render) but no integration/e2e test exercises the actual edit-then-navigate cross-component flow |
| 15 | Breakdown table wrapped in same `overflow-x-auto` shell as DealTable — no column hidden at narrow widths | ✓ VERIFIED | `ForecastBreakdownTable.tsx`: `<div className="overflow-x-auto rounded-lg border border-border">` — identical shell class to `DealTable.tsx` |
| 16 | Breakdown deal rows render at Body text size/weight, `px-4 py-2` padding, `border-t border-border` dividers | ✓ VERIFIED | Deal-row `<tr className="border-t border-border">` / `<td className="px-4 py-2">` matches `DealTable`'s row markup exactly |
| 17 | No loading/skeleton state ever reachable in the breakdown table (backstop) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (insufficient_spec) | Code contains no loading/async state, but per verifier rules a `backstop`-tagged truth cannot be closed on presence/absence of code alone — routed to human observation |
| 18 | 6+ line-item Model/Services string wraps onto a second line rather than being clipped/truncated (backstop) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (insufficient_spec) | No truncate/ellipsis/`overflow-hidden`/`whitespace-nowrap` classes present on the Model/Services `<td>`s (consistent with wrapping), but per verifier rules this visual claim requires direct observation, not code inference |

**Score:** 13/18 truths verified (5 present + wired, behavior/visual claims unverified by automated evidence)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/shared/constants/confidence-level.ts` | `CONFIDENCE_LEVELS` ordered array + `CONFIDENCE_LEVEL_LABELS` map | ✓ VERIFIED | Both exports present, correct order/labels, imported by 2 new consumers |
| `src/features/pipeline/components/ConfidenceCell.tsx` | Click-to-edit Confidence cell | ✓ VERIFIED | Sibling to `EditableCell`, full state machine, imports schema/store/constants |
| `src/features/pipeline/store/pipelineStore.ts` | `updateDeal` patch type widened | ✓ VERIFIED | `Pick<Deal, ... \| "confidenceLevel">` present |
| `src/features/pipeline/components/deal-edit-schema.ts` | `confidenceLevel` enum validation | ✓ VERIFIED | `confidenceLevel: z.enum([...])` present |
| `src/features/pipeline/components/DealTable.tsx` | New Confidence column | ✓ VERIFIED | Column inserted between Close Date and Lifetime Contract Value, uses `ConfidenceCell` |
| `src/shared/utils/deal-metrics.ts` | `computeQuantity`, `computeArpu`, `joinModelSkus`, `joinServiceNames` | ✓ VERIFIED | All 4 exported, unit-tested, correct zero-guard/filter behavior |
| `src/features/forecast/forecast-breakdown.ts` | `groupDealsByConfidence`, `GroupTotals`, `computeGroupTotals` | ✓ VERIFIED | All 3 exported, no store/repository import, unit-tested |
| `src/features/forecast/components/ForecastBreakdownTable.tsx` | Confidence-grouped breakdown table | ✓ VERIFIED | Plain HTML table, all 4 groups, subtotal + grand-total rows |
| `src/features/forecast/components/ForecastPage.tsx` | Mounts `ForecastBreakdownTable` | ✓ VERIFIED | Mounted below stat tiles/charts, reuses existing `deals` selector |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `ConfidenceCell.tsx` | `pipelineStore.ts` | `usePipelineStore.getState().updateDeal(dealId, { confidenceLevel })` | ✓ WIRED | Called after successful `safeParse`, inside try/catch/finally |
| `DealTable.tsx` | `ConfidenceCell.tsx` | `confidenceLevel` accessor column's cell renderer | ✓ WIRED | `columnHelper.accessor("confidenceLevel", { cell: (info) => <ConfidenceCell ... /> })` |
| `ForecastBreakdownTable.tsx` | `forecast-breakdown.ts` | `groupDealsByConfidence(deals)`, `computeGroupTotals(...)` | ✓ WIRED | Both called; `computeGroupTotals` called once per group plus once for grand total (3+ call sites) |
| `ForecastPage.tsx` | `ForecastBreakdownTable.tsx` | `<ForecastBreakdownTable deals={deals} />` | ✓ WIRED | Reuses the page's existing `usePipelineStore((s) => s.deals)` selector, no new subscription |
| `ConfidenceCell.tsx` / `forecast-breakdown.ts` | `confidence-level.ts` | `CONFIDENCE_LEVELS` / `CONFIDENCE_LEVEL_LABELS` | ✓ WIRED | Both consumers import from the shared module; no `Object.keys()` anywhere |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ForecastBreakdownTable` | `grouped` / row data | `groupDealsByConfidence(deals)`, `deals` prop from `ForecastPage`'s `usePipelineStore((s) => s.deals)` | Yes — live store data, not mock/static | ✓ FLOWING |
| `ConfidenceCell` | `value` prop | `info.getValue()` from the live `Deal.confidenceLevel` field, `DealTable`'s `deals` prop (originates from `usePipelineStore`) | Yes | ✓ FLOWING |
| Subtotal/Grand Total rows | `totals` | `computeGroupTotals(groupDeals)` / `computeGroupTotals(deals)`, both live-derived from the same store data | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run build` (tsc -b && vite build) exits 0 | `npm run build` | Exit 0, build succeeded (1 pre-existing chunk-size warning, unrelated to this phase) | ✓ PASS |
| Full test suite (7 tests, 2 files) passes | `npm test` (`vitest run`) | `Test Files 2 passed (2)`, `Tests 7 passed (7)` | ✓ PASS |
| `computeQuantity`/`computeArpu`/`joinModelSkus`/`joinServiceNames` unit-tested | Included in the run above | All 4 pass, assertions match must-have wording exactly | ✓ PASS |
| `groupDealsByConfidence`/`computeGroupTotals` unit-tested | Included in the run above | All 3 pass, including the empty-group divide-by-zero guard and the aggregate-not-average ARPU assertion | ✓ PASS |
| ConfidenceCell click/Escape/error-path interaction | N/A — no component test exists | Not run | ? SKIP (routed to human verification) |
| Cross-component edit→Forecast relocation | N/A — no integration/e2e test exists | Not run | ? SKIP (routed to human verification) |

### Probe Execution

No `scripts/*/tests/probe-*.sh` files exist in this repository and neither the PLAN nor SUMMARY declare any probe-based verification for this phase. Step 7c: SKIPPED (no probes declared or discovered).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| DEAL-07 | 05-01-PLAN.md | User can edit a deal's confidence level inline from the pipeline table | ✓ SATISFIED (interaction behavior needs human confirmation) | `ConfidenceCell.tsx` + `DealTable.tsx` Confidence column, wired to `updateDeal`; validated via zod; editable across all outcomes |
| FCST-03 | 05-01-PLAN.md | View all deals (open/won/lost), grouped by confidence, with 9 specified per-deal columns | ✓ SATISFIED | `ForecastBreakdownTable.tsx` renders all 9 columns in the specified order, grouped via `groupDealsByConfidence`, unit-tested grouping/derived-value logic |
| FCST-04 | 05-01-PLAN.md | Subtotal row per confidence group + grand-total row summarizing Quantity/MRR/ARR/Lifetime Contract Value | ✓ SATISFIED | `computeGroupTotals` (unit-tested) + subtotal/grand-total row rendering, deterministic placement, em-dash guards for non-aggregatable columns |

No orphaned requirements: REQUIREMENTS.md's traceability table maps exactly DEAL-07/FCST-03/FCST-04 to Phase 5, and the PLAN's `requirements` frontmatter declares the same 3 IDs — full 1:1 match.

### Anti-Patterns Found

None. Scanned all 9 files this phase created/modified (`confidence-level.ts`, `ConfidenceCell.tsx`, `pipelineStore.ts`, `deal-edit-schema.ts`, `DealTable.tsx`, `deal-metrics.ts`, `forecast-breakdown.ts`, `ForecastBreakdownTable.tsx`, `ForecastPage.tsx`) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"coming soon"/"not yet implemented" markers and empty-implementation patterns (`return null`, hardcoded `[]`/`{}` flowing to render, console.log-only handlers). No matches found. All derived-value functions and rendering logic are substantive, non-stub implementations backed by passing unit tests where applicable.

### Human Verification Required

5 items require human testing — see `human_verification` in frontmatter for full detail. Summary:

1. **Confidence cell click/select/Escape interaction (DEAL-07)** — click-to-reveal, select-to-commit, Escape-to-revert; editability confirmed in Won/Lost groups with no stage/outcome side effect.
2. **Confidence commit failure path** — inline error message + revert-to-last-committed-value + isPending re-entry guard, under a forced `updateDeal` rejection.
3. **Cross-page relocation (Success Criterion 4)** — editing confidence in the pipeline table moves the deal (and its dollar figures) into the correct group/subtotal/grand-total on the Forecast page.
4. **No loading/skeleton state ever visible** — backstop-tagged claim requiring direct observation.
5. **Long Model/Services text wraps, doesn't truncate** — backstop-tagged visual claim requiring direct observation.

### Gaps Summary

No FAILED truths, no missing/stub artifacts, no broken key links, and no anti-pattern blockers were found. All 3 requirement IDs (DEAL-07, FCST-03, FCST-04) have full code-level implementation evidence, `npm run build` exits 0, and all 7 unit tests pass. The phase is held at `human_needed` rather than `passed` solely because 5 must-have truths are interaction/cross-component/visual claims that this codebase has no automated test coverage for (no React component/interaction tests, no integration/e2e tests exist in this project yet — Vitest was only introduced this phase for pure-function unit tests). These are the same 3 `<human-check>` items the plan itself embedded per-task (per `workflow.human_verify_mode: end-of-phase`), plus the 2 explicitly `verification: backstop`-tagged must-haves, which per verifier rules cannot be closed on code presence alone.

---

_Verified: 2026-09-16T07:33:11Z_
_Verifier: Claude (gsd-verifier)_

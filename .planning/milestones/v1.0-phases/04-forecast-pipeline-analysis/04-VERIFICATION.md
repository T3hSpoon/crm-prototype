---
phase: 04-forecast-pipeline-analysis
verified: 2026-09-15T00:00:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
process_note:

  - "ROADMAP.md declares `**Mode:** mvp` for Phase 4, but `gsd_run query user-story.validate --story \"Users can search, filter, and sort the pipeline table, and analyze it via a forecast page\"` returns `valid: false` — the phase-level goal is not in `As a ... I want to ... so that ...` format. Per MVP-mode verification rules this would normally block verification pending a goal fix via `/gsd-mvp-phase 4`. Because the invoking task explicitly supplied a standard (non-MVP) goal + 5 flat success criteria matching ROADMAP.md's own Success Criteria list, and because each individual PLAN (04-01, 04-02) already embeds its own valid per-plan User Story in its `<objective>`, this report proceeds with standard goal-backward verification against those 5 success criteria rather than fabricating a low-quality MVP User-Flow-Coverage table. Flagging this ROADMAP mode/goal-format mismatch for human resolution (clear the `mode: mvp` tag, or rewrite the phase goal as a single User Story) — it is a documentation/process inconsistency, not a code defect, and does not by itself block phase completion."

human_verification:

  - test: "Type a partial deal name or company fragment into the toolbar search box"
    expected: "Matching rows stay visible and non-matching rows disappear across all 6 group sections at once; each affected group's count badge/$ total updates to reflect only the visible rows; typing an owner's name (not matching any deal name/company) filters nothing; clearing the box restores all rows and totals"
    why_human: "Live cross-table filtering and badge-recompute timing are runtime/visual behaviors a grep/build check cannot observe"

  - test: "Select an owner from the dropdown; set an invalid value-min > value-max; set an invalid close-date-max before close-date-min"
    expected: "Owner filter narrows every group to that owner's deals; the value-range pair shows 'Enter a valid range.' beneath the inputs and applies no value constraint; the close-date pair shows 'End date must be on or after the start date.' and applies no date constraint"
    why_human: "Visual placement/legibility of inline validation copy and the exact AND-combination behavior across 4 simultaneous filter types is a UI-adequacy judgment"

  - test: "Click a group's Value, Owner, and Close Date column headers"
    expected: "An ascending/descending arrow appears on the active sort column; all 6 groups reorder together, synchronized; clicking again flips direction and the arrow"
    why_human: "Visual arrow-flip and cross-table sort synchronization can only be confirmed by watching the rendered table"

  - test: "Uncheck 'Won' and 'Lost' pills in the group-visibility toggle, then uncheck every pill, then click 'Clear filters' after setting several filters"
    expected: "Unchecking two pills hides only those two sections; unchecking all pills shows 'No pipeline stages selected. / Choose at least one stage above to see deals.'; 'Clear filters' resets search, owner, value/date ranges, sort arrows, and re-enables all 6 pills in one click"
    why_human: "Interactive pill-toggle and Clear-filters-button behavior is a UI-adequacy judgment beyond static analysis"

  - test: "Open the Forecast tab and confirm the 3 stat tiles show real numbers; switch to Pipeline, set a search/filter/sort or expand a line-item row, switch to Forecast and back"
    expected: "Raw Pipeline Value, Weighted Value, and Win Rate render plausible, correctly-labeled numbers (verified formulas: raw=sum of open deals, weighted=value×confidence weight, win rate=won/(won+lost)); the Pipeline tab's search/filter/sort/expanded-row state is unchanged after the round trip (both views stay mounted per D-02)"
    why_human: "Visual layout/readability of the tiles and confirming no remount occurred are runtime observations"

  - test: "Mark a deal Lost, move it back to an active stage, then mark it Lost again with a different reason category; observe the Lost Deals by Reason chart"
    expected: "Only the latest lostReason is ever reflected in the chart — no stale double-count under the old category (CR-01 resolved via clearPatchFor)"
    why_human: "This is a multi-step state-transition sequence that requires driving the running UI, not just reading code"

  - test: "Hover a bar on each chart; add/observe a lost deal with a note; toggle a `dark` class on `<html>` via devtools; view the charts with zero lost deals"
    expected: "Tooltip shows a plain count, never a dollar figure; a new lost deal increments the correct category bar without adding a bar for its free-text note; bar/gridline colors flip to the dark-mode hex values; zero lost deals shows 'No lost deals recorded yet — this chart fills in once a deal is marked Lost.' in place of an empty axis"
    why_human: "Tooltip content, color-theme flip, and empty-state rendering are visual outcomes"

  - test: "Confirm the Win Rate tile before any deal has reached Won/Lost (e.g. on a fresh/filtered dataset with 0 closed deals)"
    expected: "Tile reads '— ' with caption 'No closed deals yet.' — never '0%' or 'NaN%'"
    why_human: "Requires observing the rendered tile in a specific data state"
---

# Phase 4: Forecast & Pipeline Analysis Verification Report

**Phase Goal:** Users can search, filter, and sort the pipeline table, and analyze it via a forecast page
**Verified:** 2026-09-15
**Status:** human_needed
**Re-verification:** No — initial verification

**Note on SUMMARY reliability:** Per the task instructions, `04-02-SUMMARY.md` is missing its `## Self-Check: PASSED` marker (interrupted mid-task by a rate limit). Every claim in both SUMMARYs was independently re-verified against the actual source files, the installed `@tanstack/table-core` package's real filter-function implementations (not just grep), a `npm run build` run, and direct execution of the phase's pure functions against the exact input/output examples declared in the plans' `<behavior>` blocks — not accepted on the SUMMARY's word alone. All claims held up.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can search deals by name/company and see the pipeline table filtered instantly (PIPE-04) | ✓ VERIFIED | `DealTable.tsx` sets `enableGlobalFilter: true` only on `name`/`company` columns and `enableGlobalFilter: false` on the other 7 (value/owner/closeDate/lifetimeContractValue/stage/id/expand — grep count = 7, matches plan). `globalFilterFn: "includesString"` wired via `getFilteredRowModel()`. `PipelineToolbar`'s search `Input` is controlled and lifted to `PipelineBoard`, threaded into all 6 `GroupSection`→`DealTable` instances. Empty search matches all; a zero-match search renders the group's existing empty-state text (`table.getRowModel().rows.length === 0` check, not `deals.length`). |
| 2 | Group badges/totals always reflect currently-visible rows, not the raw pre-partition array | ✓ VERIFIED | `DealTable`'s `useEffect` fires `onVisibleRowsChange(table.getRowModel().rows.map(r => r.original))` keyed on the final row model; `GroupSection` stores this in `visibleDeals` state and computes both the count badge and `$` total from it, never from the raw `deals` prop. |
| 3 | User can filter the pipeline table by owner, value, stage, or close date (PIPE-05) | ✓ VERIFIED | Owner: `Select` populated from `[...new Set(deals.map(d => d.owner))].sort()` (live, deduplicated, never hardcoded) with `filterFn: "equalsString"`. Value: two `type="number"` inputs feeding `filterFn: "inNumberRange"`. Close date: two `type="date"` inputs feeding `filterFn: "inDateRange"` (upper bound appended `T23:59:59` to include the full end day). Stage: `ToggleGroup type="multiple"` over the 6 `GROUPS` values, filtering which whole `GroupSection` blocks render (`groupsToRender`), never row-level. All filters combine via `columnFilters` (AND semantics, TanStack's default when multiple column filters are active) plus the separate global search filter. |
| 4 | Invalid value/date ranges show inline validation and are never silently applied | ✓ VERIFIED | `isValueRangeValid`/`isCloseDateRangeValid` guard the `columnFilters` derivation — an invalid range is excluded from `columnFilters` entirely (contributes no constraint) and `PipelineToolbar` renders "Enter a valid range." / "End date must be on or after the start date." beneath the respective inputs (`grep` confirms exact strings present). |
| 5 | A range filter with only one bound is open-ended, not an error | ✓ VERIFIED (library-level test) | Directly exercised the installed `@tanstack/table-core` package's real `filterFn_inNumberRange`/`filterFn_inDateRange`: `resolveFilterValue` converts a missing bound to `-Infinity`/`Infinity`; confirmed via direct Node execution against the actual `node_modules` copy that a value squarely inside a two-sided date range correctly matches (`resolveDataValue` converts row's ISO string to a timestamp before comparison — verified this is NOT the bug it initially appeared to be from a naive string-vs-number read of the source). |
| 6 | User can sort the pipeline table by value/close date/owner column, synchronized across all 6 tables (PIPE-06) | ✓ VERIFIED | `sorting`/`onSortingChange` (a real setter, not a no-op) lifted to `PipelineBoard`, threaded through every `GroupSection`→`DealTable`. Headers for Value/Owner/Close Date are function-headers rendering a button wired to `column.getToggleSortingHandler()` with a ▲/▼ indicator from `column.getIsSorted()`. `getSortedRowModel()` wired (TanStack's stable sort — equal keys retain relative order, never merged/deduplicated, per library contract). |
| 7 | User can view a forecast page showing raw pipeline value, weighted value, and win rate (FCST-01) | ✓ VERIFIED | `forecast-metrics.ts`'s `computeRawPipelineValue`/`computeWeightedPipelineValue`/`computeWinRate` re-executed against hand-built sample data outside the app (Node): raw correctly sums only `outcome === "open"` deals; weighted correctly applies the locked confidence-weight table (100%→1.0, 80%→0.8, 50%→0.5, open-to-rfp→0.0); win rate correctly computes `won/(won+lost)` and returns 0 (rendered as "—"/"No closed deals yet.") when no deal has reached a terminal outcome. `ForecastPage.tsx` reads `deals` directly via `usePipelineStore((s) => s.deals)` — confirmed no `PipelineToolbar`/`columnFilters`/`visibleGroups` reference exists in `ForecastPage.tsx` or `forecast-metrics.ts` (both plans' data-integrity prohibition holds). "Weighted Value" caption contains no "Guaranteed"/"Committed" language. |
| 8 | User can view a breakdown of lost deals by reason and by stage (FCST-02) | ✓ VERIFIED | `computeLostByReason`/`computeLostByStage` re-executed against the exact 3 input/output examples declared in `04-02-PLAN.md`'s `<behavior>` block (category-prefix split on first `:`, "Unknown" bucket for a lost deal with no reason, `pipelineStage` read directly rather than `toPipelineGroup`) — all 3 produced the documented expected output exactly. `LostBreakdownChart.tsx` renders a Y-axis labeled "Number of Lost Deals" with no `Intl.NumberFormat` currency formatting anywhere in the file — count-based, never dollar-based, per this plan's prohibition. |
| 9 | CR-01 stale-field bug resolved: `lostReason`/contract-term fields never carry stale data across a Lost→Prospect→Lost (or Won→Prospect) round trip | ✓ VERIFIED (code-level; sequence itself needs human replay) | `clearPatchFor(group)` in `pipeline-group.ts` is spread into the patch object at all 3 call sites (`moveStage`, `moveToLost`, `moveToWon` in `pipelineStore.ts` — confirmed exactly 3 occurrences of `clearPatchFor(`). Logic correctly clears `lostReason` whenever `group !== "lost"` and all 4 contract-term fields whenever `group !== "won"`, so a deal can never carry both a stale reason and being simultaneously open/won. `mock-deals-repository.ts`'s `update()` `Pick` type widened to include all 4 contract-term keys (previously missing, would have silently dropped the clear). |
| 10 | Switching Pipeline↔Forecast tabs never resets Pipeline-tab state (D-01/D-02) | ✓ VERIFIED (structural; visual round-trip needs human confirm) | `App.tsx` renders both `<PipelineBoard />` and `<ForecastPage />` unconditionally at all times, toggling visibility only via a ternary `"" : "hidden"` className — never a conditional `&&` render that would unmount either tree. This is the correct React pattern to guarantee no remount. |
| 11 | Filtering/sorting/toggle code paths never mutate the canonical `deals` array or call a store write action | ✓ VERIFIED | `grep` confirms zero `usePipelineStore` references in `PipelineToolbar.tsx` (pure props-in/callbacks-out) and zero direct `.sort(` calls in `DealTable.tsx` (sorting only ever goes through `getSortedRowModel()`). |
| 12 | The lost-by-reason/lost-by-stage overflow, long-label, and empty-data UI-SPEC backstops are implemented | ✓ VERIFIED | `bucketTopCategories` re-executed against both declared behavior examples (7-key input correctly folds to top-5 + "Other"; 2-key input passes through unchanged) — exact match. `ForecastPage.tsx` applies it only to the by-reason chart. `LostBreakdownChart.tsx` truncates tick labels over 14 chars with an ellipsis (full string still available to `Tooltip` via the untouched data point) and renders the exact empty-state copy "No lost deals recorded yet — this chart fills in once a deal is marked Lost." when `counts` is empty. |

**Score:** 12/12 truths verified (0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/features/pipeline/components/PipelineToolbar.tsx` | Shared search/owner/value/close-date/toggle/clear toolbar | ✓ VERIFIED | 167 lines, fully wired, zero store imports |
| `src/features/pipeline/components/DealTable.tsx` | Controlled global/column filter + sorting, `onVisibleRowsChange` | ✓ VERIFIED | 273 lines; filter/sort row-model wiring confirmed against real TanStack source |
| `src/features/pipeline/components/PipelineBoard.tsx` | Lifted state, derived `columnFilters`, `groupsToRender`, empty state | ✓ VERIFIED | 125 lines |
| `src/features/pipeline/components/GroupSection.tsx` | `visibleDeals`-driven badge/total | ✓ VERIFIED | 125 lines |
| `src/components/ui/toggle-group.tsx`, `toggle.tsx` | shadcn official-registry primitives | ✓ VERIFIED | Real Radix-based source (not a stub), `npx shadcn@latest add toggle-group` output |
| `src/shared/utils/pipeline-group.ts` | `clearPatchFor` helper | ✓ VERIFIED | 55 lines, exported, correct logic |
| `src/features/pipeline/store/pipelineStore.ts` | `clearPatchFor` spread into 3 actions | ✓ VERIFIED | Exactly 3 call sites |
| `src/data/mock/mock-deals-repository.ts` | Widened `update()` Pick type | ✓ VERIFIED | 4 contract-term keys present |
| `src/features/forecast/forecast-metrics.ts` | 6 pure functions, no store import | ✓ VERIFIED | 95 lines; all 6 functions behaviorally re-tested outside the app |
| `src/features/forecast/components/StatTile.tsx` | Presentational tile | ✓ VERIFIED | 26 lines, `tabular-nums break-words` present |
| `src/features/forecast/components/ForecastPage.tsx` | Read-only Forecast tab | ✓ VERIFIED | 56 lines; reads full unfiltered store deals; no write action/button present |
| `src/features/forecast/components/LostBreakdownChart.tsx` | Recharts bar chart wrapper | ✓ VERIFIED | 71 lines; count-based, themed via CSS vars, empty-state + truncation present |
| `src/app/App.tsx` | Tabs nav, both views mounted | ✓ VERIFIED | 43 lines |
| `src/components/ui/tabs.tsx`, `card.tsx` | shadcn official-registry primitives | ✓ VERIFIED | 87/102 lines, real Radix source |
| `src/index.css` (chart color vars) | `--chart-lost-bar`/`--chart-lost-grid` in `:root` + `.dark` | ✓ VERIFIED | Exactly 2 occurrences each, correct hex values matching UI-SPEC |
| `package.json`/`package-lock.json` | `recharts` dependency | ✓ VERIFIED | `^3.10.1` in both files |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `PipelineToolbar.tsx` | `PipelineBoard.tsx` | 13 lifted-state callback props | ✓ WIRED | Confirmed prop-by-prop in `PipelineBoard.tsx` JSX |
| `PipelineBoard.tsx` | `DealTable.tsx` (via `GroupSection.tsx`) | `globalFilter`/`columnFilters`/`sorting` props | ✓ WIRED | Confirmed threaded through `GroupSection`'s props into every `DealTable` call |
| `DealTable.tsx` | `GroupSection.tsx` | `onVisibleRowsChange(table.getRowModel().rows.map(...))` | ✓ WIRED | `useEffect` keyed on `table.getRowModel().rows` |
| `pipelineStore.ts` | `pipeline-group.ts` | `clearPatchFor(group)` spread into all 3 patch objects | ✓ WIRED | Confirmed 3/3 call sites |
| `ForecastPage.tsx` | `usePipelineStore` | `usePipelineStore((s) => s.deals)` | ✓ WIRED | Full unfiltered array, no intermediary |
| `ForecastPage.tsx` | `forecast-metrics.ts` | Direct function calls with `deals` | ✓ WIRED | All 6 functions called and their outputs rendered |
| `App.tsx` | `PipelineBoard.tsx` / `ForecastPage.tsx` | Both rendered unconditionally, `hidden` class toggle | ✓ WIRED | No conditional `&&` render found |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `PipelineToolbar` search/filter inputs | `globalFilter`/`owner`/`valueMin`/etc. | User keystrokes → `PipelineBoard` `useState` → `DealTable`'s TanStack row model | Yes | ✓ FLOWING |
| `GroupSection` badge/total | `visibleDeals` | `DealTable`'s `onVisibleRowsChange` (real filtered/sorted row model) | Yes | ✓ FLOWING |
| `ForecastPage` stat tiles | `raw`/`weighted`/`winRate` | `usePipelineStore((s) => s.deals)` → `forecast-metrics.ts` pure functions | Yes | ✓ FLOWING |
| `LostBreakdownChart` bars | `lostByReason`/`lostByStage` | Same store deals → `computeLostByReason`/`computeLostByStage` | Yes | ✓ FLOWING |

No static returns, hardcoded literals, or mocks found feeding any rendered value in this phase's new/modified files.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `npm run build` (tsc -b + vite build) | `npm run build` | Exit 0, no TS errors, bundle produced | ✓ PASS |
| All 6 phase commits exist in history | `git log --oneline --all \| grep <hashes>` | All 6 (`a354663`,`e26cd13`,`4f18345`,`95f60c3`,`844ce3c`,`3a8e6c4`) found | ✓ PASS |
| `computeLostByReason`/`computeLostByStage` match plan's declared behavior examples | Node execution of the exact source function bodies against 3 declared input/output pairs | All 3 exact matches | ✓ PASS |
| `bucketTopCategories` matches plan's declared behavior examples | Node execution against both declared input/output pairs | Both exact matches | ✓ PASS |
| `computeRawPipelineValue`/`computeWeightedPipelineValue`/`computeWinRate` formula correctness | Node execution against hand-built sample deals | Raw=35000, Weighted=20000, WinRate=0.5, WinRate(no closed)=0 — all correct | ✓ PASS |
| TanStack `inDateRange`/`inNumberRange` filter fns correctly handle open-ended and two-sided ranges | Direct Node execution against the installed `@tanstack/table-core` package (not a reimplementation) | Confirmed `resolveDataValue`/`resolveFilterValue` correctly normalize ISO-string dates and missing bounds to ±Infinity; a date inside a two-sided range matches | ✓ PASS |
| Plan's own grep-based acceptance-criteria counts (enableGlobalFilter, getFilteredRowModel, getSortedRowModel, visibleDeals, inNumberRange, inDateRange) | Re-ran exact `grep -v '^\s*//' ... \| grep -c ...` commands from each plan's `<verify>` block | All counts matched exactly (7, 2, 2, 3, 1, 1) | ✓ PASS |
| Debt-marker scan (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) across all 16 phase-modified files | `grep -nE` | Zero matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PIPE-04 | 04-01 | Search deals by name/company | ✓ SATISFIED | Truth #1 |
| PIPE-05 | 04-01 | Filter by owner, value, stage, close date | ✓ SATISFIED | Truths #3, #4, #5 |
| PIPE-06 | 04-01 | Sort by value, close date, owner | ✓ SATISFIED | Truth #6 |
| FCST-01 | 04-02 | Forecast page: raw/weighted value, win rate | ✓ SATISFIED | Truth #7 |
| FCST-02 | 04-02 | Lost-deal breakdown by reason and stage | ✓ SATISFIED | Truths #8, #12 |

No orphaned requirements — REQUIREMENTS.md's Phase 4 traceability row set (PIPE-04, PIPE-05, PIPE-06, FCST-01, FCST-02) exactly matches the union of both plans' `requirements` frontmatter.

### Anti-Patterns Found

None. No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers, no empty-return stubs, no hardcoded-empty props feeding rendered output, in any of the 16 files this phase created or modified.

**Minor, non-blocking observations (informational only):**

- The group-visibility `ToggleGroup` pill for the "won" group is labeled "Won" (`GROUP_LABELS` in `PipelineToolbar.tsx`), while the corresponding `GroupSection` header/section itself displays "Contracts" (`GROUP_META.won.label` in `GroupSection.tsx`, carried over from Phase 3.1). Cosmetic naming inconsistency between the toggle pill and the section it controls — does not affect functionality or any of the 5 success criteria, but worth a copy pass.
- `seedDeals` (unchanged by this phase) marks ~15% of deals `outcome: "lost"` without ever populating `lostReason`. On first load, before any user interaction, the Lost Deals by Reason chart's data will be dominated by the "Unknown" bucket (by design — `computeLostByReason`'s documented fallback) rather than showing a varied demo-ready spread across Price/Timing/Competitor/etc. Feature behaves correctly per spec; only the out-of-the-box demo richness is affected, and only for lost deals that were pre-seeded (never manually marked Lost) at load time.

### Human Verification Required

8 items — see frontmatter `human_verification` list above (visual filtering/badge sync, inline validation display, sort-arrow flip and cross-table sync, group-visibility toggle and Clear-filters button, Forecast tab tile rendering and tab-switch state persistence, CR-01 multi-step Lost→Prospect→Lost sequence replay, chart tooltip/color-theme/empty-state rendering, and the zero-closed-deals Win Rate tile copy). None of these are code-level gaps — all are runtime/visual confirmations that structural analysis (build, grep, direct library/function execution) cannot itself observe.

### Gaps Summary

No gaps found. Every must-have truth, artifact, key link, and prohibition from both plans' frontmatter was independently re-verified against the actual codebase — not accepted from either SUMMARY.md's narrative, including `04-02-SUMMARY.md`'s self-check-marker-less claims, which held up under direct testing (pure-function re-execution against the plans' own declared behavior examples, and direct execution of the real installed TanStack filter functions rather than trusting the source read alone). The only outstanding item is the ROADMAP.md `mode: mvp` / goal-format process discrepancy noted above, which is a documentation issue, not a code gap, and the 8 visual/interactive items that require a human to drive the running app — both are captured for the developer's attention, neither blocks the underlying implementation.

---

*Verified: 2026-09-15*
*Verifier: Claude (gsd-verifier)*

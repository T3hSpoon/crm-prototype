---
phase: 06-sales-dashboard
plan: 03
subsystem: dashboard-tab
tags: [react, recharts, date-fns, tdd, dashboard, derived-metrics, funnel-chart, stacked-bar]

requires:
  - phase: 06-sales-dashboard (plan 01, plan 02)
    provides: dashboard-config.ts (OWNER_ROSTER/TRAILING_MONTHS), dashboard-metrics.ts (computeWonUnits/computeUnitTargetPct/computeMonthlyWonUnits/computeOwnerLeaderboard), DashboardPage.tsx shell (Row 1 complete, Row 2 started), all Phase 6 chart-color CSS tokens
provides:
  - "computeConversionFunnel(deals) — cumulative current-state snapshot funnel over 4 pipelineStage values + a synthetic 'won' stage, divide-by-zero-guarded, raw unrounded pct (DASH-04)"
  - "computeClosedByOwnerPerMonth(deals, owners?, months?) — 12x5 pre-seeded month/owner grid of won(by contractSignedDate)+lost(by closeDate) deal counts (DASH-05)"
  - "ConversionFunnelChart.tsx — FunnelChart with ordinal 5-step color ramp + unconditional transparency-disclosure caption"
  - "ClosedByOwnerChart.tsx — stacked BarChart, one <Bar stackId> per fixed-roster owner"
  - "DashboardPage.tsx Row 2 completed (Leaderboard + Conversion Funnel), Row 3 added (Closed-by-Owner, full width) — all 5 Phase 6 widgets now live"
affects: []

actuals:
  tokens: 10500
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Cumulative snapshot funnel algorithm: a deal counts toward stage N when outcome==='won' (unconditional) OR STAGE_ORDER.indexOf(pipelineStage) >= STAGE_ORDER.indexOf(N) — reuses the established fact that a Lost deal retains the pipelineStage it fell from"
    - "Pre-seed-then-accumulate extended to a 2D grid (12 months x 5 owners) for computeClosedByOwnerPerMonth, following the same pattern 06-02 established for 1D grids"
    - "Recharts Tooltip formatter reading item.payload for a custom '{count} deals ({pct}%)' string, rather than a separate custom content component"

key-files:
  created:
    - src/features/dashboard/components/ConversionFunnelChart.tsx
    - src/features/dashboard/components/ClosedByOwnerChart.tsx
  modified:
    - src/features/dashboard/dashboard-metrics.ts
    - src/features/dashboard/dashboard-metrics.test.ts
    - src/features/dashboard/components/DashboardPage.tsx

key-decisions:
  - "computeConversionFunnel treats every outcome==='won' deal as having passed every stage unconditionally (RESEARCH Assumption A4), not just deals whose pipelineStage rank is high enough — covers StageSelect's allowed direct Prospect->Won transition without under-counting"
  - "ConversionFunnelChart's disclosure caption ('Current pipeline distribution — not a historical conversion rate.') renders unconditionally in both empty and populated states, resolving the plan's transparency prohibition (T-06-06) as a structural guarantee rather than a conditional one"
  - "Used Recharts Tooltip's formatter prop (reading item.payload) rather than a hand-written custom Tooltip content component — smaller surface area, matches the plan's literal 'Tooltip whose formatter renders ...' instruction"

patterns-established:
  - "2D pre-seeded grid (month x owner) is now the established pattern for any future cross-tabulated derived-data function in dashboard-metrics.ts, extending 06-02's 1D pre-seed-then-accumulate convention"

requirements-completed: [DASH-04, DASH-05]

coverage:
  - id: D1
    description: "computeConversionFunnel(deals) is divide-by-zero-guarded (0 total -> pct 0), correctly treats every Won deal as having passed all stages (all-won -> every count/pct = total/1), and returns a raw unrounded fraction (2/3 -> 0.6666666666666666, not 0.67/67)"
    requirement: DASH-04
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeConversionFunnel (5 tests: 0-total boundary, all-won boundary, raw-fraction precision, fixed-5-stage shape, Lost-deal cumulative stage counting)"
        status: pass
    human_judgment: false
  - id: D2
    description: "computeClosedByOwnerPerMonth always returns exactly 12 month rows with all 5 OWNER_ROSTER keys pre-seeded at 0, correctly buckets Won deals by contractSignedDate and Lost deals by closeDate, and excludes open deals entirely"
    requirement: DASH-05
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeClosedByOwnerPerMonth (4 tests: 12x5 pre-seed grid, Won-by-contractSignedDate bucketing, Lost-by-closeDate bucketing, open-deal exclusion)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ConversionFunnelChart renders the exact UI-SPEC empty-state copy only when the store's deals array is empty (never when computeConversionFunnel's fixed 5-entry shape alone would suggest emptiness), always renders exactly 5 fixed stages with an ordinal --chart-funnel-1..5 Cell ramp, and renders the transparency disclosure caption unconditionally in both states"
    requirement: DASH-04
    verification:
      - kind: unit
        ref: "grep -c exact-string match for the disclosure caption (1, present in JSX unconditionally) and the empty-state copy (1) in ConversionFunnelChart.tsx; npm run build succeeds"
        status: pass
    human_judgment: true
    rationale: "No browser is available in this autonomous worktree session to visually render and screenshot the funnel chart (Cell color ramp, LabelList positioning, Tooltip formatter output). Verified structurally instead: exact-string grep for both the disclosure caption and empty-state copy, source inspection confirming the caption renders outside the isEmpty ternary (truly unconditional), and npm run build succeeding. A human should do a quick visual pass on next npm run dev to confirm the funnel reads correctly and percentages decrease monotonically stage-to-stage against real seed data."
  - id: D4
    description: "ClosedByOwnerChart renders the exact UI-SPEC empty-state copy only when zero Won or Lost deals exist, and renders exactly one <Bar stackId=\"closed\"> per owner (positional/fixed OWNER_ROSTER coloring) otherwise"
    requirement: DASH-05
    verification:
      - kind: unit
        ref: "grep -c exact-string match for the empty-state copy (1) in ClosedByOwnerChart.tsx; source inspection confirming owners.map(...) with fill={`var(--chart-owner-${i + 1})`} uses the owners array's fixed position, never a runtime sort; npm run build succeeds"
        status: pass
    human_judgment: true
    rationale: "No browser is available in this autonomous worktree session to visually render and screenshot the stacked bar (5-color legend wrapping, 12-month x-axis tick legibility). Verified structurally instead: exact-string grep for the empty-state copy, source inspection confirming positional (not sorted) color assignment and a single Bar-per-owner shared stackId, and npm run build succeeding. A human should do a quick visual pass on next npm run dev."
  - id: D5
    description: "DashboardPage.tsx wires computeConversionFunnel/computeClosedByOwnerPerMonth into ConversionFunnelChart/ClosedByOwnerChart, completing Row 2's 2-child grid and adding Row 3's 1-child full-width grid — all 5 Phase 6 widgets present"
    requirement: DASH-04
    verification:
      - kind: unit
        ref: "Read of DashboardPage.tsx confirming Row 2 div has exactly 2 children (OwnerLeaderboard, ConversionFunnelChart) and Row 3 div has exactly 1 child (ClosedByOwnerChart); npm run build succeeds; npx vitest run src/features/dashboard/dashboard-metrics.test.ts src/data/mock/seed-data.test.ts passes (33 tests)"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-09-17
status: complete
---

# Phase 6 Plan 03: Stage Conversion Funnel + Closed-by-Owner Stacked Bar Summary

**Completed DASH-04/DASH-05 as two new pure derived-data functions (`computeConversionFunnel`, `computeClosedByOwnerPerMonth`) built via TDD, plus their Recharts `FunnelChart`/stacked `BarChart` widgets, wired into `DashboardPage.tsx` to finish Row 2 and add Row 3 — all 5 Phase 6 Sales Dashboard widgets are now live.**

## Performance
- **Duration:** ~25min
- **Started:** 2026-09-17T17:36:00Z (approx.)
- **Completed:** 2026-09-17T17:41:00Z (approx.)
- **Tasks:** 3/3 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `computeConversionFunnel(deals)` — a cumulative "reached-at-least-this-stage" snapshot funnel over `STAGE_ORDER` (`prospect` → `lead` → `opportunity` → `deal`) plus a synthetic `"won"` entry. Divide-by-zero-guarded (0 total deals → every `pct` is exactly `0`); treats every `outcome === "won"` deal as having passed every stage unconditionally (covers `StageSelect`'s allowed direct Prospect→Won transition without under-counting); a Lost deal counts toward every stage up to and including the `pipelineStage` it fell from. `pct` is a raw, unrounded fraction — rounding is deferred to the display layer, matching `computeWinRate`'s existing convention.
- `computeClosedByOwnerPerMonth(deals, owners = OWNER_ROSTER, months = TRAILING_MONTHS)` — pre-seeds a full 12-month × 5-owner grid at `0` before accumulating, so a sparse owner/month combination still renders as a real zero segment, never silently dropped. Won deals are bucketed by `contractSignedDate` (D-04), Lost deals by `closeDate` (D-05) — never the other way, respecting `closeDate`'s outcome-dependent dual meaning (RESEARCH Pitfall 1). Open deals never contribute.
- `ConversionFunnelChart.tsx` — a `FunnelChart` with one `<Cell>` per stage drawn from the validated ordinal `--chart-funnel-1..5` ramp, a `Tooltip` formatter rendering `"{count} deals ({pct}%)"`, and a fixed disclosure caption ("Current pipeline distribution — not a historical conversion rate.") that renders **unconditionally** in both empty and populated states — resolving the plan's transparency prohibition (T-06-06) as a structural guarantee, not a conditional afterthought.
- `ClosedByOwnerChart.tsx` — a stacked `BarChart` with one `<Bar stackId="closed">` per `owners` entry, colored positionally from the fixed `OWNER_ROSTER` index (`var(--chart-owner-${i + 1})`) — never a runtime-sorted array's index, so a given rep's color never changes.
- `DashboardPage.tsx` now renders all 5 Phase 6 widgets: Row 1 (`UnitTargetGauge` + `TargetVsActualChart`), Row 2 completed (`OwnerLeaderboard` + `ConversionFunnelChart`, exactly 2 children), Row 3 added (`ClosedByOwnerChart`, full-width, exactly 1 child).

## Task Commits
1. **Task 1 (RED): failing tests for computeConversionFunnel/computeClosedByOwnerPerMonth** - `26ba757` (test)
2. **Task 1 (GREEN): dashboard-metrics.ts implementation** - `076af8c` (feat)
3. **Task 2: ConversionFunnelChart + ClosedByOwnerChart components** - `ec8ce49` (feat)
4. **Task 3: wire both components into DashboardPage (all 5 widgets live)** - `92b561a` (feat)

**Plan metadata:** (pending — commit follows this SUMMARY)

## Files Created/Modified
- `src/features/dashboard/dashboard-metrics.ts` - added `computeConversionFunnel`, `computeClosedByOwnerPerMonth`, private `STAGE_ORDER`/`STAGE_LABELS` constants
- `src/features/dashboard/dashboard-metrics.test.ts` - 9 new tests covering both functions' boundary/precision/pre-seed behavior
- `src/features/dashboard/components/ConversionFunnelChart.tsx` - FunnelChart, ordinal Cell ramp, Tooltip formatter, unconditional disclosure caption
- `src/features/dashboard/components/ClosedByOwnerChart.tsx` - stacked BarChart, one Bar per fixed-roster owner
- `src/features/dashboard/components/DashboardPage.tsx` - Row 2 completed, Row 3 added, imports for both new components/functions/OWNER_ROSTER

## Decisions Made
- `computeConversionFunnel` deliberately treats every Won deal as unconditionally having reached every stage (RESEARCH Assumption A4), rather than only counting Won deals whose stored `pipelineStage` rank is high enough — since `StageSelect.tsx` allows moving a deal directly from Prospect to Won, the stricter rank-based reading would under-count and misstate the funnel for exactly the deals that matter most (closed-won).
- Used Recharts `Tooltip`'s `formatter` prop (reading `item.payload`) instead of a hand-rolled custom Tooltip `content` component — smaller surface area, follows the plan's literal instruction, and matches the verified `Formatter<TValue, TName>` type signature read from the installed Recharts type declarations this session.
- `ConversionFunnelChart`'s disclosure caption is placed outside the `isEmpty` ternary so it renders identically in both states — a deliberate structural choice (not just a styling one) to ensure the transparency prohibition can never be silently dropped by a future edit to just the populated branch.

## Deviations from Plan

None - plan executed exactly as written. All `must_haves.truths`, the `must_haves.prohibitions` item (T-06-06/transparency disclosure), and all three tasks' `<acceptance_criteria>` were satisfied on the first implementation pass with no auto-fixes required.

## Issues Encountered
None — all three tasks' acceptance criteria and the plan's overall `<verification>` block (full test suite, `npm run build`, phase-wide `dangerouslySetInnerHTML` grep) passed on the first implementation pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
This is the final plan of Phase 6 — all 5 Sales Dashboard widgets (DASH-01 through DASH-05) are now live on the Dashboard tab, each backed by a pure, unit-tested derived-data function reading the store's full unfiltered `deals` array.

**Concern for a human to verify on next `npm run dev`:** neither new chart's visual rendering was screenshot-verified in this autonomous worktree session (no browser available) — structural/data-flow verification (build success, 33 passing unit tests across `dashboard-metrics.test.ts` + `seed-data.test.ts`, exact-string/element-count grep checks) all passed, but a quick human visual pass on the Dashboard tab's full 3-row layout is recommended before shipping this milestone. Specifically worth eyeballing: the funnel's 5-step color ramp and whether percentages read as monotonically non-increasing stage-to-stage against real seed data, and the stacked bar's 5-color legend wrapping behavior at typical widths.

---
*Phase: 06-sales-dashboard*
*Completed: 2026-09-17*

## Self-Check: PASSED

- FOUND: src/features/dashboard/dashboard-metrics.ts
- FOUND: src/features/dashboard/dashboard-metrics.test.ts
- FOUND: src/features/dashboard/components/ConversionFunnelChart.tsx
- FOUND: src/features/dashboard/components/ClosedByOwnerChart.tsx
- FOUND: src/features/dashboard/components/DashboardPage.tsx
- FOUND: commit 26ba757 (test)
- FOUND: commit 076af8c (feat)
- FOUND: commit ec8ce49 (feat)
- FOUND: commit 92b561a (feat)

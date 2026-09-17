---
phase: 06-sales-dashboard
plan: 02
subsystem: dashboard-tab
tags: [react, recharts, date-fns, tdd, dashboard, derived-metrics, composed-chart]

requires:
  - phase: 06-sales-dashboard (plan 01)
    provides: dashboard-config.ts (OWNER_ROSTER/TRAILING_MONTHS/MONTHLY_UNIT_TARGET), dashboard-metrics.ts (computeWonUnits/computeUnitTargetPct), DashboardPage.tsx shell, Phase 6 chart-color CSS tokens
provides:
  - "computeMonthlyWonUnits(deals, months?) — 12 trailing-month buckets of Won-deal unit volume by contractSignedDate, pre-seeded at actual=0/target=MONTHLY_UNIT_TARGET before accumulation (DASH-02)"
  - "computeOwnerLeaderboard(deals) — 5 fixed OWNER_ROSTER entries pre-seeded at wonValue=0, sorted descending by summed Won-deal value (DASH-03)"
  - "TargetVsActualChart.tsx — ComposedChart Bar (Actual) + Line (Target) on one shared y-axis"
  - "OwnerLeaderboard.tsx — up to 5 ranked flex rows, single-hue styling"
  - "DashboardPage.tsx Row 1 completed (Gauge + Target-vs-Actual), Row 2 started (Leaderboard)"
affects: [06-03-sales-dashboard]

actuals:
  tokens: 4331
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Private per-deal summation helper (sumLineItemUnits) factored out of computeWonUnits so computeMonthlyWonUnits reuses the same all-line-item-types summation rule instead of re-implementing it"
    - "Pre-seed-then-accumulate pattern for both DASH-02's 12-month buckets and DASH-03's 5-owner totals — a Map/array is fully populated with zero-valued entries before any deal is read, so a zero-activity period/owner is a real output row, never a silently-skipped one"
    - "ComposedChart Bar+Line sharing one YAxis (never dual-axis) for a same-unit two-series time chart"

key-files:
  created:
    - src/features/dashboard/components/TargetVsActualChart.tsx
    - src/features/dashboard/components/OwnerLeaderboard.tsx
  modified:
    - src/features/dashboard/dashboard-metrics.ts
    - src/features/dashboard/dashboard-metrics.test.ts
    - src/features/dashboard/components/DashboardPage.tsx

key-decisions:
  - "computeMonthlyWonUnits reuses a new private sumLineItemUnits(deal) helper (factored out of computeWonUnits' inline reduce) rather than calling computeWonUnits([deal]) per bucketed deal — avoids re-filtering by outcome per call and keeps the single-deal unit-sum logic in exactly one place"
  - "OwnerLeaderboard renders rank badges and currency values in a single hue (no per-owner color), matching UI-SPEC's explicit 'magnitude comparison, not identity display' rule for DASH-03"

patterns-established:
  - "Pre-seed-then-accumulate is now the established pattern for any future time-bucketed or roster-keyed derived-data function in dashboard-metrics.ts (06-03's computeConversionFunnel/computeClosedByOwnerPerMonth should follow it for their own fixed-cardinality outputs)"

requirements-completed: [DASH-02, DASH-03]

coverage:
  - id: D1
    description: "computeMonthlyWonUnits(deals) buckets Won-deal unit volume by contractSignedDate month into exactly 12 trailing months, pre-seeded at actual=0 so a zero-activity month is a real output row, never omitted"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeMonthlyWonUnits (6 tests: all-non-Won all-zero, empty-array length, target pre-seed, current-month bucketing with other-months-zero, lost-deal exclusion, trailing-month bucketing)"
        status: pass
    human_judgment: false
  - id: D2
    description: "computeOwnerLeaderboard(deals) always returns exactly 5 entries (one per OWNER_ROSTER name), pre-seeded at wonValue=0, sorted descending — a rep with zero Won deals still appears as a real $0 row"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeOwnerLeaderboard (4 tests: 5-entry pre-seed on empty array, zero-Won-deal owner never omitted, per-owner Won-value summation excluding open/lost, descending sort order)"
        status: pass
    human_judgment: false
  - id: D3
    description: "TargetVsActualChart renders the exact UI-SPEC empty-state copy when every monthly bucket's actual is 0, and a ComposedChart (Bar=Actual, Line=Target) on one shared y-axis otherwise — never dual-axis"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "grep -c on the exact empty-state string in TargetVsActualChart.tsx (1 match); grep -c on <Bar /><Line />/YAxis element counts (1 Bar, 1 Line, 1 YAxis) confirming single shared axis"
        status: pass
    human_judgment: true
    rationale: "No browser is available in this autonomous worktree session to visually render and screenshot the chart. Verified structurally instead: exact-string grep for the empty-state copy, element-count grep confirming exactly one Bar/Line/YAxis (no dual-axis), and npm run build succeeding. A human should do a quick visual pass on next npm run dev to confirm the chart itself reads correctly against real seed data."
  - id: D4
    description: "OwnerLeaderboard renders the exact UI-SPEC empty-state copy when every entry's wonValue is 0, and always renders all 5 fixed roster rows (bounded 0-5, never fewer/more) with single-hue styling otherwise"
    requirement: DASH-03
    verification:
      - kind: unit
        ref: "grep -c on the exact empty-state string in OwnerLeaderboard.tsx (1 match); entries.map with no filter on wonValue confirms all entries.length rows always render"
        status: pass
    human_judgment: true
    rationale: "No browser is available in this autonomous worktree session to visually render and screenshot the leaderboard rows. Verified structurally instead: exact-string grep for the empty-state copy, source inspection confirming no filter is applied before entries.map (all 5 rows always render), and npm run build succeeding. A human should do a quick visual pass on next npm run dev."
  - id: D5
    description: "DashboardPage.tsx wires computeMonthlyWonUnits/computeOwnerLeaderboard into TargetVsActualChart/OwnerLeaderboard, completing Row 1's 2-child grid and starting Row 2's 1-child grid (leaving the second Row 2 slot open for 06-03's ConversionFunnelChart)"
    requirement: DASH-02
    verification:
      - kind: unit
        ref: "Read of DashboardPage.tsx confirming Row 1 div has exactly 2 children (UnitTargetGauge, TargetVsActualChart) and Row 2 div has exactly 1 child (OwnerLeaderboard); npm run build succeeds"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-09-17
status: complete
---

# Phase 6 Plan 02: Target vs. Actual Sales Chart + Owner Leaderboard Summary

**Completed DASH-02/DASH-03 as two new pure derived-data functions (`computeMonthlyWonUnits`, `computeOwnerLeaderboard`) built via TDD, plus their Recharts `ComposedChart` and ranked-list widgets, wired into `DashboardPage.tsx` to finish Row 1 and start Row 2 of the UI-SPEC layout.**

## Performance
- **Duration:** ~10min
- **Started:** 2026-09-17T17:23:00Z (approx.)
- **Completed:** 2026-09-17T17:27:05Z
- **Tasks:** 3/3 completed
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `computeMonthlyWonUnits(deals, months = TRAILING_MONTHS)` buckets Won-deal unit volume by `contractSignedDate` month into exactly 12 trailing months, every bucket pre-seeded at `actual: 0`/`target: MONTHLY_UNIT_TARGET` before accumulation — a zero-activity month is a real, explicit row in the output array, never silently dropped.
- `computeOwnerLeaderboard(deals)` ranks all 5 fixed `OWNER_ROSTER` names by summed Won-deal value, pre-seeded at `wonValue: 0` before accumulation and sorted descending — a rep with zero Won deals still appears as a real `$0` row.
- Factored a private `sumLineItemUnits(deal)` helper out of `computeWonUnits`'s inline reduce so `computeMonthlyWonUnits` reuses the exact same "sum all line-item types" rule rather than re-implementing it.
- `TargetVsActualChart.tsx` — a `ComposedChart` with one `Bar` ("Actual") and one `Line` ("Target") sharing a single y-axis (never dual-axis, since both series are the same unit), Card-wrapped with the UI-SPEC-exact empty-state copy.
- `OwnerLeaderboard.tsx` — up to 5 ranked flex rows (rank badge + owner name + currency-formatted Won value), all rendered in a single hue since DASH-03 is a magnitude comparison, not an identity display.
- `DashboardPage.tsx` now renders 3 of 5 Phase 6 widgets: Row 1's grid completed (`UnitTargetGauge` + `TargetVsActualChart`, exactly 2 children), Row 2 started (`OwnerLeaderboard`, exactly 1 child — the second slot reserved for 06-03's `ConversionFunnelChart`).

## Task Commits
1. **Task 1 (RED): failing tests for computeMonthlyWonUnits/computeOwnerLeaderboard** - `fcda7d4` (test)
2. **Task 1 (GREEN): dashboard-metrics.ts implementation** - `d225dd3` (feat)
3. **Task 2: TargetVsActualChart + OwnerLeaderboard components** - `d0f16ab` (feat)
4. **Task 3: wire both components into DashboardPage** - `6e441e8` (feat)

**Plan metadata:** (pending — commit follows this SUMMARY)

## Files Created/Modified
- `src/features/dashboard/dashboard-metrics.ts` - added `sumLineItemUnits` (private), `computeMonthlyWonUnits`, `computeOwnerLeaderboard`
- `src/features/dashboard/dashboard-metrics.test.ts` - 10 new tests covering both functions' pre-seed/zero-omission/sort-order behavior
- `src/features/dashboard/components/TargetVsActualChart.tsx` - ComposedChart Bar+Line, Card/empty-state shell
- `src/features/dashboard/components/OwnerLeaderboard.tsx` - ranked flex-row list, Card/empty-state shell
- `src/features/dashboard/components/DashboardPage.tsx` - Row 1 completed, Row 2 started

## Decisions Made
- Factored `sumLineItemUnits` as a private helper reused by both `computeWonUnits` and `computeMonthlyWonUnits`, rather than calling `computeWonUnits([deal])` per bucketed deal inside the month-bucketing loop — avoids a redundant outcome-filter re-check per call and keeps the "sum all line-item types" logic in exactly one place, per the plan's explicit instruction not to re-write the summation loop from scratch.
- Leaderboard rank badges and value text use a single hue (`text-foreground`/default `--foreground`), matching UI-SPEC's explicit prohibition on per-owner rainbow coloring for a pure magnitude-comparison widget.

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed a test-only timezone bug in the "3 months ago" bucketing test**
- **Found during:** Task 1 (writing the RED test for `computeMonthlyWonUnits`)
- **Issue:** The test fixture computed `threeMonthsAgo` as a local-timezone `Date` at midnight, then called `.toISOString().slice(0, 10)` to build the `contractSignedDate` string. In this environment's UTC+3 timezone, converting a local-midnight `Date` to UTC rolls it back to the previous calendar day (21:00 UTC the day before), which shifted the test's `contractSignedDate` into the wrong month and caused a false failure — the same class of day-granularity/timezone issue documented as a deviation in `06-01-SUMMARY.md`. This was a test-fixture bug, not a bug in `computeMonthlyWonUnits` itself (the production function correctly parses date-only strings and formats in local time with no boundary issue, since `seed-data.ts`'s actual stored `contractSignedDate` values are always genuine date-only strings, not `.toISOString()`-converted full timestamps).
- **Fix:** Replaced `.toISOString().slice(0, 10)` with `date-fns`'s `format(threeMonthsAgo, "yyyy-MM-dd")`, which formats in local time and preserves the intended calendar day regardless of UTC offset.
- **Files modified:** `src/features/dashboard/dashboard-metrics.test.ts`
- **Verification:** `npx vitest run src/features/dashboard/dashboard-metrics.test.ts` — all 18 tests pass (was 1 failing before the fix).
- **Commit:** `d225dd3`

**Total deviations:** 1 auto-fixed (1 test-fixture timezone bug, Rule 1). **Impact:** None on shipped production code — the fix is confined to the test file's fixture-date construction; `dashboard-metrics.ts`'s actual `computeMonthlyWonUnits` implementation was correct as written.

## Issues Encountered
None — both tasks' acceptance criteria and the plan's overall `<verification>` block passed after the one test-fixture fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `dashboard-metrics.ts` now exports `computeWonUnits`, `computeUnitTargetPct`, `computeMonthlyWonUnits`, `computeOwnerLeaderboard` — 06-03 adds `computeConversionFunnel`/`computeClosedByOwnerPerMonth` per RESEARCH.md Architecture Patterns 4-5, following the same pre-seed-then-accumulate pattern established here.
- `DashboardPage.tsx`'s Row 2 grid (`grid-cols-1 lg:grid-cols-2`) has one open slot for `ConversionFunnelChart` (DASH-04); Row 3 is entirely unbuilt (`ClosedByOwnerChart`, DASH-05) — 06-03 adds real widgets there with no architectural change to this shell.
- All Phase 6 chart-color CSS tokens (including `--chart-funnel-1..5`, `--chart-owner-1..5`) already exist in `src/index.css` from 06-01 — 06-03 needs no further `index.css` edits for color tokens.
- **Concern for a human to verify on next `npm run dev`:** neither new chart's visual rendering was screenshot-verified in this autonomous worktree session (no browser available) — structural/data-flow verification (build success, 18 passing unit tests, exact-string/element-count grep checks) all passed, but a quick human visual pass on the Dashboard tab's Row 1/Row 2 is recommended before shipping this milestone.

---
*Phase: 06-sales-dashboard*
*Completed: 2026-09-17*

## Self-Check: PASSED

- FOUND: src/features/dashboard/components/TargetVsActualChart.tsx
- FOUND: src/features/dashboard/components/OwnerLeaderboard.tsx
- FOUND: .planning/phases/06-sales-dashboard/06-02-SUMMARY.md
- FOUND: commit fcda7d4 (test)
- FOUND: commit d225dd3 (feat)
- FOUND: commit d0f16ab (feat)
- FOUND: commit 6e441e8 (feat)

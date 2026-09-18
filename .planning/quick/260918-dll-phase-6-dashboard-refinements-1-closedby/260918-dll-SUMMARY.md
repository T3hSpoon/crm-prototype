---
phase: dashboard-refinements
plan: 1
subsystem: ui
tags: [react, recharts, typescript, vitest]

requires:
  - phase: 06-sales-dashboard
    provides: computeClosedByOwnerPerMonth, computeMonthlyWonUnits, ClosedByOwnerChart, TargetVsActualChart, MONTHLY_UNIT_TARGET
provides:
  - ClosedByOwnerChart now sums closed-deal dollar value per owner per month (DASH-05), currency-formatted axis/tooltip
  - TargetVsActualChart rendered as a single Recharts AreaChart with two overlaid Area series (DASH-02)
  - MONTHLY_TARGETS 12-entry per-calendar-month target array replacing the flat MONTHLY_UNIT_TARGET constant
affects: [dashboard, forecast]

actuals:
  tokens: 3612
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Per-calendar-month config array (MONTHLY_TARGETS) indexed via date-fns getMonth(), replacing a single flat constant, so month-specific targets are stable across trailing windows"

key-files:
  created: []
  modified:
    - src/features/dashboard/dashboard-metrics.ts
    - src/features/dashboard/dashboard-metrics.test.ts
    - src/features/dashboard/dashboard-config.ts
    - src/features/dashboard/components/ClosedByOwnerChart.tsx
    - src/features/dashboard/components/TargetVsActualChart.tsx

key-decisions:
  - "MONTHLY_TARGETS values chosen to sum to 480 (identical annual total to the old flat 40x12) so DASH-01's gauge behavior is unchanged, while adding a mild seasonal ramp toward Q4"
  - "TargetVsActualChart's two Area series are NOT stacked (no stackId) — they overlay independently since this is a comparison, not a total"

patterns-established:
  - "Config-only per-month lookup arrays for seeded mock targets, indexed by date-fns getMonth() rather than trailing-window position"

requirements-completed: []

coverage:
  - id: D1
    description: "ClosedByOwnerChart (DASH-05) shows summed dollar value per owner per month, not a raw deal count, with currency-formatted Y-axis ticks and Tooltip"
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeClosedByOwnerPerMonth sums a Won deal's value (bucketed by contractSignedDate) toward its owner's month"
        status: pass
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeClosedByOwnerPerMonth sums a Lost deal's value (bucketed by closeDate) toward its owner's month"
        status: pass
    human_judgment: false
  - id: D2
    description: "TargetVsActualChart (DASH-02) renders as a single Recharts AreaChart (no Bar/Line/ComposedChart), with Actual and Target as two overlaid Area series sharing one y-axis, each of the 12 trailing months reading its own calendar-month target from MONTHLY_TARGETS"
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeMonthlyWonUnits pre-seeds each bucket's target from MONTHLY_TARGETS by its calendar month"
        status: pass
      - kind: other
        ref: "npm run build (tsc -b && vite build) — confirms AreaChart/Area typings and DashboardPage.tsx's unchanged call site all type-check"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-18
status: complete
---

# Phase dashboard-refinements Plan 1: Dashboard Chart Refinements Summary

**ClosedByOwnerChart sums deal dollar value (currency-formatted) instead of counting deals; TargetVsActualChart switched from a ComposedChart (Bar+Line) to a single AreaChart with two overlaid Area series, driven by a new 12-entry per-calendar-month MONTHLY_TARGETS array.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-18
- **Completed:** 2026-09-18
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- `computeClosedByOwnerPerMonth` now accumulates `deal.value` per owner/month instead of counting deals; `ClosedByOwnerChart`'s Y-axis and Tooltip render currency-formatted values (compact ticks, full-precision tooltip), mirroring `OwnerLeaderboard.tsx`'s existing formatter pattern.
- `dashboard-config.ts` replaces the flat `MONTHLY_UNIT_TARGET = 40` with a 12-entry `MONTHLY_TARGETS: number[]` array (Jan-Dec, summing to 480 — same annual total), with `ANNUAL_UNIT_TARGET` now derived from its sum.
- `computeMonthlyWonUnits` pre-seeds each trailing-month bucket's `target` from `MONTHLY_TARGETS` indexed by that bucket's calendar month (`date-fns getMonth`), so a given calendar month's target is stable year over year.
- `TargetVsActualChart` switched from a `ComposedChart` (`Bar` + `Line`) to a single `AreaChart` with two overlaid, non-stacked `Area` series ("Actual" filled, "Target" dashed), sharing one y-axis.
- `DashboardPage.tsx` required zero changes — both charts' consumer prop signatures (`ReturnType<typeof computeClosedByOwnerPerMonth>`, `ReturnType<typeof computeMonthlyWonUnits>`) are unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: ClosedByOwnerChart shows deal value, not count (DASH-05)** - `ce1e94f` (feat)
2. **Task 2: TargetVsActualChart becomes an AreaChart with a per-month target array (DASH-02)** - `9312ee4` (feat)

_Note: SUMMARY.md commit follows separately per this project's quick-task convention._

## Files Created/Modified
- `src/features/dashboard/dashboard-metrics.ts` - `computeClosedByOwnerPerMonth` sums `deal.value`; `computeMonthlyWonUnits` looks up per-bucket target from `MONTHLY_TARGETS` via `getMonth`
- `src/features/dashboard/dashboard-metrics.test.ts` - Updated assertions for value-based owner/month sums and per-calendar-month target lookups
- `src/features/dashboard/dashboard-config.ts` - `MONTHLY_TARGETS` (12-entry array) replaces `MONTHLY_UNIT_TARGET`; `ANNUAL_UNIT_TARGET` derived from its sum
- `src/features/dashboard/components/ClosedByOwnerChart.tsx` - Currency-formatted Y-axis ticks (compact) and Tooltip (full precision)
- `src/features/dashboard/components/TargetVsActualChart.tsx` - `ComposedChart`(Bar+Line) → `AreaChart`(two overlaid Area series)

## Decisions Made
- `MONTHLY_TARGETS` values (`[30, 32, 36, 38, 40, 42, 38, 36, 42, 46, 50, 50]`) chosen to sum to 480, preserving DASH-01's existing gauge behavior exactly, while adding a mild seasonal ramp toward Q4 as the plan specified.
- The two `Area` series in `TargetVsActualChart` intentionally omit `stackId` — they overlay independently (both anchored at zero) rather than stacking, since Actual vs. Target is a comparison, not a total.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both dashboard chart refinements are complete, type-checked, and covered by updated unit tests.
- No blockers. `MONTHLY_TARGETS` remains code-level config only (no settings UI, no persistence), matching the plan's locked decision for this pass.

---
*Phase: dashboard-refinements*
*Completed: 2026-09-18*

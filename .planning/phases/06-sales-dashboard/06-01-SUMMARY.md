---
phase: 06-sales-dashboard
plan: 01
subsystem: dashboard-tab
tags: [react, recharts, zustand, faker, tdd, dashboard, seed-data, derived-metrics]

requires:
  - phase: 05-forecast-page
    provides: ForecastPage.tsx / forecast-metrics.ts conventions (pure derived-data module shape, unfiltered-store-read rule, Card+empty-state chart wrapper) mirrored verbatim for this plan's Dashboard tab
provides:
  - "src/features/dashboard/ feature directory scaffolded: dashboard-config.ts, dashboard-metrics.ts, components/UnitTargetGauge.tsx, components/DashboardPage.tsx"
  - "seed-data.ts foundation: fixed 5-name OWNER_ROSTER (D-01), 150-deal volume (D-02), deterministic faker.seed(20260917), outcome-aware closeDate/contractSignedDate spanning trailing 12 months (D-05/D-06)"
  - "All Phase 6 chart-color CSS tokens (--chart-gauge-*, --chart-owner-1..5, --chart-funnel-1..5) added once to src/index.css for 06-02/06-03 to consume without a second index.css edit"
  - "Third 'Dashboard' tab in App.tsx, always-mounted/hidden-toggle pattern, showing a working Unit Sales Target gauge (DASH-01) driven by real derived data"
affects: [06-02-sales-dashboard, 06-03-sales-dashboard]

actuals:
  tokens: 4339
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Pure derived-data module (dashboard-metrics.ts) mirroring forecast-metrics.ts's shape exactly: no store import, Deal[] in, plain data out, divide-by-zero-guarded ratios"
    - "Standalone constants-only config module (dashboard-config.ts) — first of its kind in this codebase (no prior standalone config file existed; previously constants lived inline at the top of seed-data.ts/forecast-metrics.ts)"
    - "Card/CardContent + title + isEmpty-ternary chart wrapper, copied from LostBreakdownChart.tsx for UnitTargetGauge.tsx"
    - "Outcome-aware seed-data field generation (closeDate is now a 3-way ternary on isLost/isWon/open, replacing a single unconditional faker.date.soon call)"

key-files:
  created:
    - src/features/dashboard/dashboard-config.ts
    - src/features/dashboard/dashboard-metrics.ts
    - src/features/dashboard/dashboard-metrics.test.ts
    - src/features/dashboard/components/UnitTargetGauge.tsx
    - src/features/dashboard/components/DashboardPage.tsx
    - src/data/mock/seed-data.test.ts
  modified:
    - src/data/mock/seed-data.ts
    - src/index.css
    - src/app/App.tsx

key-decisions:
  - "computeWonUnits sums units across ALL line items (product + service) of Won deals — deliberately distinct from deal-metrics.ts's service-only computeQuantity, per RESEARCH Pitfall 4/Assumption A1"
  - "faker.seed(20260917) added as the first executable statement in seed-data.ts, making the entire seedDeals generation deterministic across runs/CI — this is what makes 'every roster owner has >=1 Won deal' a hard assertion rather than a flaky probabilistic spot-check"
  - "contractSignedDate/closeDate invariant tests compare at day granularity (startOfDay), not exact timestamp, matching contractSignedDate's actual stored precision (date-only string via .slice(0,10)) — see Deviations"

patterns-established:
  - "dashboard-config.ts: standalone constants-only module convention (OWNER_ROSTER, TRAILING_MONTHS, MONTHLY_UNIT_TARGET, ANNUAL_UNIT_TARGET) — 06-02/06-03 read from this same file rather than duplicating constants"
  - "Owner-color assignment is positional and fixed: index into OWNER_ROSTER, never a runtime-sorted array's index — established here for 06-02/06-03's owner-based widgets to follow"

requirements-completed: [DASH-01]

coverage:
  - id: D1
    description: "computeWonUnits(deals) sums units across ALL line items (product+service) of Won deals, order-invariant, empty-safe"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeWonUnits (4 tests: empty, product+service sum, won-only scope, order-invariance)"
        status: pass
    human_judgment: false
  - id: D2
    description: "computeUnitTargetPct(actual, target) is divide-by-zero-safe and clamps to [0,1]"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "src/features/dashboard/dashboard-metrics.test.ts#computeUnitTargetPct (4 tests: target===0, actual===target, actual>target clamp, actual<target ratio)"
        status: pass
    human_judgment: false
  - id: D3
    description: "UnitTargetGauge renders the exact empty-state copy when zero Won deals exist, and a real RadialBarChart gauge with actual/target numbers otherwise"
    requirement: DASH-01
    verification:
      - kind: manual_procedural
        ref: "vitest sanity check (dashboard/zz-sanity.test.ts, discarded after use): computeWonUnits(seedDeals)=558, ANNUAL_UNIT_TARGET=480, wonDealCount=29 — confirmed non-zero/non-NaN real numbers flow into the gauge; no browser/screenshot available in this autonomous worktree session to visually confirm the rendered SVG"
        status: pass
    human_judgment: true
    rationale: "No browser is available in this autonomous execution environment to visually render and screenshot the gauge; verified structurally instead (acceptance-criteria grep for the third hidden-toggle div, npm run build succeeding with the widened 3-tab union, and a throwaway vitest script confirming real computed actual/target/wonDealCount values flow correctly into the component's props). A human should do a quick visual pass on next `npm run dev`."
  - id: D4
    description: "Seed data generates 150 deals from a fixed 5-name owner roster deterministically, with outcome-aware closeDate/contractSignedDate spanning trailing 12 months, and every roster owner has >=1 Won deal"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "src/data/mock/seed-data.test.ts (6 tests: deal count, owner membership, every-owner-has-won-deal, lost/open closeDate windows, won contractSignedDate window)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Dashboard tab mounted alongside Pipeline/Forecast via the same always-mounted/hidden-toggle pattern; DashboardPage reads the full unfiltered deals array"
    requirement: DASH-01
    verification:
      - kind: unit
        ref: "grep -n DashboardPage src/app/App.tsx (import + third hidden-toggle div confirmed); npm run build succeeds with widened 3-tab union type"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-17
status: complete
---

# Phase 6 Plan 01: Sales Dashboard Foundation + Unit Sales Target Gauge Summary

**Phase 6's tracer slice: deterministic 150-deal/5-owner seed-data foundation (D-01/02/04/05/06) proven end-to-end through one fully-wired widget — the Unit Sales Target radial gauge (DASH-01) — on a new Dashboard tab, using TDD (RED/GREEN) for the two pure derived-metrics functions.**

## Performance
- **Duration:** ~20min
- **Started:** 2026-09-17T10:27:00Z (approx.)
- **Completed:** 2026-09-17T10:47:27Z
- **Tasks:** 2/2 completed
- **Files modified:** 9 (6 created, 3 modified)

## Accomplishments
- Replaced `seed-data.ts`'s per-deal `faker.person.fullName()` with a fixed, closed 5-name `OWNER_ROSTER` (D-01) — the sole owner-identity source going forward, with `faker.seed(20260917)` making the whole 150-deal generation deterministic across runs/CI.
- `closeDate` is now outcome-aware: forward-looking for open deals (unchanged), backdated across a trailing 12 months for both lost and won deals (D-05/D-06) — its dual meaning documented at the source.
- New `src/features/dashboard/` feature directory scaffolded end-to-end: `dashboard-config.ts` (constants), `dashboard-metrics.ts` (`computeWonUnits`/`computeUnitTargetPct`, TDD RED→GREEN), `UnitTargetGauge.tsx` (Recharts `RadialBarChart` semicircle meter), `DashboardPage.tsx` (page shell reading the unfiltered store).
- All 11 new Phase 6 chart-color CSS custom properties (`--chart-gauge-fill/-track`, `--chart-owner-1..5`, `--chart-funnel-1..5`) added once to `src/index.css` in both `:root` and `.dark`, so 06-02/06-03 never need a second `index.css` edit.
- Third "Dashboard" `TabsTrigger` + always-mounted/`hidden`-toggle container added to `App.tsx`, matching the existing Pipeline/Forecast pattern exactly — no router, no remount-on-switch.
- Deterministic invariant tests prove every one of the 5 roster owners has ≥1 Won deal in the generated dataset (not a probabilistic spot-check).

## Task Commits
1. **Task 1 (RED): failing tests for computeWonUnits/computeUnitTargetPct** - `c5cee0a` (test)
2. **Task 1 (GREEN): dashboard-metrics.ts + dashboard-config.ts implementation** - `5434a81` (feat)
3. **Task 1: seed-data foundation + Unit Sales Target gauge wired end-to-end** - `204fd9d` (feat)
4. **Task 2: seed-data invariant tests (D-01/02/05/06)** - `f6c93a1` (test)

**Plan metadata:** (pending — commit follows this SUMMARY)

## Files Created/Modified
- `src/features/dashboard/dashboard-config.ts` - OWNER_ROSTER, TRAILING_MONTHS, MONTHLY_UNIT_TARGET, ANNUAL_UNIT_TARGET
- `src/features/dashboard/dashboard-metrics.ts` - computeWonUnits (all line-item units of Won deals), computeUnitTargetPct (divide-by-zero-safe, clamped)
- `src/features/dashboard/dashboard-metrics.test.ts` - 8 tests covering both functions' edge cases
- `src/features/dashboard/components/UnitTargetGauge.tsx` - RadialBarChart semicircle gauge, Card-wrapped, empty-state
- `src/features/dashboard/components/DashboardPage.tsx` - page shell, reads usePipelineStore full deals array
- `src/data/mock/seed-data.ts` - OWNER_ROSTER assignment, SEED_DEAL_COUNT=150, faker.seed(20260917), outcome-aware closeDate/contractSignedDate
- `src/data/mock/seed-data.test.ts` - 6 deterministic invariant tests
- `src/index.css` - 11 new chart-color CSS tokens (light+dark), added once for the whole phase
- `src/app/App.tsx` - third Dashboard tab, widened 3-tab union type

## Decisions Made
- `computeWonUnits` deliberately duplicates rather than reuses `deal-metrics.ts`'s `computeQuantity` (service-only) — they answer different questions (total shipped units vs. service-only quantity for ARPU), and conflating them would silently break DASH-01/02's "actual units sold" meaning.
- `dashboard-config.ts` established as the first standalone constants-only module in this codebase (no prior file of this shape existed) — `seed-data.ts` and `dashboard-metrics.ts` both import from it rather than duplicating `OWNER_ROSTER`/`TRAILING_MONTHS`.

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed a day-granularity boundary bug in the seed-data.test.ts contractSignedDate invariant check**
- **Found during:** Task 2 (writing `seed-data.test.ts`)
- **Issue:** `contractSignedDate` is intentionally stored as a date-only string (`.toISOString().slice(0, 10)`), so `new Date(deal.contractSignedDate)` parses to UTC midnight of that calendar day. The test's `windowStart` was computed as a precise timestamp (`subMonths(new Date(), 12)`, including time-of-day), so a legitimately valid, in-window `contractSignedDate` whose truncated midnight fell earlier in the day than `windowStart`'s time-of-day on the same boundary calendar day spuriously failed the `>=` comparison — an artifact of the test's precision mismatch with the field's actual stored precision, not a bug in the seed-data generation itself.
- **Fix:** Wrapped both `windowStart` and the parsed `signedDate` in `startOfDay()` (date-fns) before comparing, so the check operates at the same day-granularity the field is actually stored at.
- **Files modified:** `src/data/mock/seed-data.test.ts`
- **Verification:** `npx vitest run src/data/mock/seed-data.test.ts` — all 6 tests pass (was 1 failing before the fix).
- **Commit:** `f6c93a1`

**Total deviations:** 1 auto-fixed (1 test-precision bug, Rule 1). **Impact:** None on shipped production code — the fix is confined to the test file's comparison granularity; `seed-data.ts`'s actual generation logic was correct as written.

## Issues Encountered
None — both tasks' acceptance criteria and the plan's overall `<verification>` block passed on the first implementation pass (after the one test-precision fix above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/features/dashboard/dashboard-config.ts` and `dashboard-metrics.ts` are ready for 06-02/06-03 to extend with `computeMonthlyWonUnits`, `computeOwnerLeaderboard`, `computeConversionFunnel`, `computeClosedByOwnerPerMonth` per RESEARCH.md's Architecture Patterns 2-5.
- All 11 Phase 6 chart-color CSS tokens already exist in `src/index.css` — 06-02/06-03 consume them via `var(--token)`, no further `index.css` edits needed for color tokens.
- `DashboardPage.tsx`'s Row 1 grid (`grid-cols-1 lg:grid-cols-2`) has one open slot (`TargetVsActualChart`, DASH-02) and Rows 2-3 are entirely unbuilt (`OwnerLeaderboard`/`ConversionFunnelChart`/`ClosedByOwnerChart`) — 06-02/06-03 add real widgets there with no architectural change to this shell, per the plan's explicit "do not add placeholder elements" instruction.
- **Concern for a human to verify on next `npm run dev`:** the gauge's actual visual rendering was not screenshot-verified in this autonomous worktree session (no browser available) — structural/data-flow verification (build success, unit tests, grep checks, and a throwaway vitest script confirming real computed values: `wonDealCount=29, actual=558, target=480, pct=1`) all passed, but a quick human visual pass on the Dashboard tab is recommended before shipping this milestone.

---
*Phase: 06-sales-dashboard*
*Completed: 2026-09-17*

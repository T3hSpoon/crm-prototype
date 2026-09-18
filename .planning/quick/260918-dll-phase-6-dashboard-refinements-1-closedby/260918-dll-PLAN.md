---
phase: dashboard-refinements
plan: 1
type: execute
wave: 1
depends_on: []
autonomous: true
files_modified:
  - src/features/dashboard/dashboard-metrics.ts
  - src/features/dashboard/dashboard-metrics.test.ts
  - src/features/dashboard/dashboard-config.ts
  - src/features/dashboard/components/ClosedByOwnerChart.tsx
  - src/features/dashboard/components/TargetVsActualChart.tsx

must_haves:
  truths:
    - "Closed Deals by Owner chart (DASH-05) shows summed dollar value per owner per month, not a raw deal count"
    - "Target vs. Actual Sales chart (DASH-02) renders as a single Recharts AreaChart (no Bar/Line/ComposedChart), with Actual and Target as two overlaid Area series sharing one y-axis"
    - "Each of the 12 trailing months in Target vs. Actual reads its own calendar-month target from a MONTHLY_TARGETS array, not one flat number repeated 12 times"
    - "DashboardPage.tsx compiles and renders unchanged — neither chart's consumer prop signature breaks"
  artifacts:
    - path: "src/features/dashboard/dashboard-config.ts"
      provides: "MONTHLY_TARGETS (12-entry number[], Jan-Dec) replacing MONTHLY_UNIT_TARGET; ANNUAL_UNIT_TARGET derived from its sum"
    - path: "src/features/dashboard/dashboard-metrics.ts"
      provides: "computeClosedByOwnerPerMonth summing deal.value instead of counting; computeMonthlyWonUnits pre-seeding each bucket's target from MONTHLY_TARGETS by calendar month"
    - path: "src/features/dashboard/components/ClosedByOwnerChart.tsx"
      provides: "currency-formatted Y-axis ticks and Tooltip values"
    - path: "src/features/dashboard/components/TargetVsActualChart.tsx"
      provides: "AreaChart-based rendering (Actual + Target as overlaid Area series)"
  key_links:
    - from: "src/features/dashboard/dashboard-config.ts"
      to: "src/features/dashboard/dashboard-metrics.ts"
      via: "MONTHLY_TARGETS imported and indexed by date-fns getMonth() per trailing-month bucket"
      pattern: "MONTHLY_TARGETS\\[getMonth"
    - from: "src/features/dashboard/dashboard-metrics.ts"
      to: "src/features/dashboard/components/TargetVsActualChart.tsx"
      via: "computeMonthlyWonUnits' {actual,target} bucket shape (unchanged) consumed by the new AreaChart's two dataKeys"
      pattern: "dataKey=\"target\""
---

<objective>
Two independent, additive refinements to the just-shipped Phase 6 Sales Dashboard — code-level only, no new UI surface, no persistence, no schema change:

1. `ClosedByOwnerChart` (DASH-05) switches from counting closed deals to summing their dollar `value` per owner per month.
2. `TargetVsActualChart` (DASH-02) switches from a Bar+Line `ComposedChart` to a single Recharts `AreaChart`, and its flat `MONTHLY_UNIT_TARGET` constant becomes a 12-entry per-calendar-month `MONTHLY_TARGETS` array in `dashboard-config.ts` — code-level config only, no in-app editing UI (locked decision, this pass).

Purpose: post-milestone polish on Phase 6 (Sales Dashboard) — makes the owner breakdown reflect deal value (the metric sales leadership actually cares about) and makes the monthly target line reflect real seasonality instead of a flat number repeated 12 times.

Output: `ClosedByOwnerChart.tsx`, `TargetVsActualChart.tsx`, `dashboard-metrics.ts`, `dashboard-config.ts` modified; `dashboard-metrics.test.ts` updated to match new behavior (no assertions deleted, only adapted); `DashboardPage.tsx` verified compatible with zero changes.
</objective>

<execution_context>
@C:/gh-repos/eld/.claude/gsd-core/workflows/execute-plan.md
@C:/gh-repos/eld/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/gh-repos/eld/src/features/dashboard/dashboard-metrics.ts
@C:/gh-repos/eld/src/features/dashboard/dashboard-metrics.test.ts
@C:/gh-repos/eld/src/features/dashboard/dashboard-config.ts
@C:/gh-repos/eld/src/features/dashboard/components/ClosedByOwnerChart.tsx
@C:/gh-repos/eld/src/features/dashboard/components/TargetVsActualChart.tsx
@C:/gh-repos/eld/src/features/dashboard/components/DashboardPage.tsx
@C:/gh-repos/eld/src/features/dashboard/components/OwnerLeaderboard.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: ClosedByOwnerChart shows deal value, not count (DASH-05)</name>
  <files>src/features/dashboard/dashboard-metrics.ts, src/features/dashboard/components/ClosedByOwnerChart.tsx, src/features/dashboard/dashboard-metrics.test.ts</files>
  <action>
In `dashboard-metrics.ts`'s `computeClosedByOwnerPerMonth`, change the per-deal accumulation line from incrementing the owner's bucket cell by `1` to accumulating `deal.value` instead — i.e. `bucket[deal.owner] = (Number(bucket[deal.owner]) || 0) + deal.value`. Keep every other guard exactly as-is: the pre-seed-every-owner-to-`0` step, the `owners.includes(deal.owner)` non-roster skip, and the outcome-based date-field selection (`contractSignedDate` for Won via D-04, `closeDate` for Lost via D-05, both via `parseISO`). Won and Lost deals for the same owner/month continue to land in the SAME cell (merged, not split into separate Won/Lost series) — this preserves the chart's existing one-`<Bar>`-per-owner shape and its `ReturnType`, so no prop-signature change ripples to `ClosedByOwnerChart.tsx` or `DashboardPage.tsx`. Update the function's JSDoc to state it sums Won+Lost deal `value` per owner-month rather than counting deals, and drop the reference to "count" in the return-shape description.

In `ClosedByOwnerChart.tsx`, add two module-scope `Intl.NumberFormat` formatters mirroring `OwnerLeaderboard.tsx`'s existing pattern: `currencyFormatter` (`style: "currency", currency: "USD", maximumFractionDigits: 0`) for the Tooltip, and a second `compactCurrencyFormatter` (`style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1`) for the Y-axis ticks (so a value like 1200 renders as "$1.2K" instead of a bare integer). Wire `<YAxis>`'s existing `allowDecimals={false}` prop unchanged (whole-dollar gridline values are still correct) but add `tickFormatter={(value) => compactCurrencyFormatter.format(Number(value))}`. Add `formatter={(value) => currencyFormatter.format(Number(value))}` to the existing `<Tooltip />` element (leave the untyped arrow param as-is — do not annotate it `number` — so TS infers Recharts' own `ValueType` rather than fighting it). Update the component's JSDoc comment: replace "Stacked bar of deals closed (won + lost) per period" with wording describing a stacked bar of closed-deal (won + lost) dollar VALUE per period, keeping the rest of the comment (color-index-follows-`owners` rule, month-axis tick sourcing, Legend wrapping, Card/CardContent shell mirror) unchanged since none of that changed.

In `dashboard-metrics.test.ts`'s `computeClosedByOwnerPerMonth` describe block: the "counts a Won deal... toward its owner's month" test currently relies on the `deal()` factory's default `value: 1000` and asserts `toBe(1)` — give that deal an explicit `value: 2500` override and change the assertion to `toBe(2500)`. Do the same for the "counts a Lost deal..." test: add an explicit `value: 750` override and change its assertion to `toBe(750)`. The "always returns exactly 12 month rows... defaulting to 0" test and the "excludes open deals entirely" test both already assert `=== 0`, which is unchanged by this switch from count to value — leave them as-is. Update the top-of-block describe title comment/wording only if it references "counts" explicitly; no other structural change needed.
  </action>
  <verify>
    <automated>npx vitest run src/features/dashboard/dashboard-metrics.test.ts -t computeClosedByOwnerPerMonth</automated>
  </verify>
  <done>computeClosedByOwnerPerMonth sums deal.value (not count) per owner per month while preserving the pre-seed-to-zero, non-roster-owner skip, and outcome-based date-selection guards; ClosedByOwnerChart's Y-axis ticks and Tooltip render currency-formatted values instead of bare integers; all computeClosedByOwnerPerMonth tests pass with value-based assertions.</done>
</task>

<task type="auto">
  <name>Task 2: TargetVsActualChart becomes an AreaChart with a per-month target array (DASH-02)</name>
  <files>src/features/dashboard/dashboard-config.ts, src/features/dashboard/dashboard-metrics.ts, src/features/dashboard/components/TargetVsActualChart.tsx, src/features/dashboard/dashboard-metrics.test.ts</files>
  <action>
In `dashboard-config.ts`, replace `export const MONTHLY_UNIT_TARGET = 40;` with `export const MONTHLY_TARGETS: number[] = [30, 32, 36, 38, 40, 42, 38, 36, 42, 46, 50, 50];` — a 12-entry array indexed by calendar month (index 0 = January … index 11 = December), summing to 480 (identical to the old flat 40 x 12 annual total, so DASH-01's gauge behavior is unchanged) while introducing a mild seasonal ramp toward Q4. Update the JSDoc above it to explain: per-calendar-month targets (not trailing-window position, via date-fns `getMonth`), so "March's target" is stable year over year regardless of which 12-month trailing window is displayed; this is CODE-LEVEL CONFIG ONLY for this pass — no in-app editing UI, no persistence. Update `ANNUAL_UNIT_TARGET`'s definition from `MONTHLY_UNIT_TARGET * TRAILING_MONTHS` to `MONTHLY_TARGETS.reduce((sum, t) => sum + t, 0)`, and update its one-line doc comment to describe it as the sum of all 12 `MONTHLY_TARGETS` entries.

In `dashboard-metrics.ts`, add `getMonth` to the existing `date-fns` import line, and change the `dashboard-config` import from `MONTHLY_UNIT_TARGET` to `MONTHLY_TARGETS`. In `computeMonthlyWonUnits`'s bucket pre-seed `.map((d) => ({...}))`, change `target: MONTHLY_UNIT_TARGET` to `target: MONTHLY_TARGETS[getMonth(d)]` (each bucket now gets its own calendar month's configured target). Update the function's JSDoc where it currently says buckets are "pre-seeded at ... target: MONTHLY_UNIT_TARGET" to describe per-bucket lookup into `MONTHLY_TARGETS` by calendar month instead of a single repeated constant.

In `TargetVsActualChart.tsx`, replace the `recharts` import list's `ComposedChart`, `Bar`, `Line` with `AreaChart`, `Area`. Change the JSX root chart element from `<ComposedChart data={data}>` to `<AreaChart data={data}>`, keeping `<CartesianGrid>`, `<XAxis>`, `<YAxis>` (including its "Units" axis label — unchanged), `<Tooltip />`, and `<Legend />` exactly as they are today. Replace the `<Bar dataKey="actual" .../>` + `<Line dataKey="target" .../>` pair with two `<Area>` elements in this order (Actual first, Target second — Target renders on top as the reference overlay, mirroring the original Bar-then-Line paint order): first `<Area type="monotone" dataKey="actual" name="Actual" stroke="var(--chart-gauge-fill)" fill="var(--chart-gauge-fill)" fillOpacity={0.35} strokeWidth={2} />`; second `<Area type="monotone" dataKey="target" name="Target" stroke="var(--chart-lost-grid)" fill="var(--chart-lost-grid)" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 4" dot={false} />`. Neither `<Area>` uses a `stackId` — they overlay independently (both anchored at zero) rather than stacking, since this is a comparison, not a total. Update the component's JSDoc comment: replace the "Bar, 'Actual' ... Line, 'Target' ..." description with wording describing two overlaid (non-stacked) Area series on one shared y-axis; keep the existing "never a dual-axis composition" rationale sentence verbatim since it still applies. Leave the `isEmpty` check, the empty-state copy, and the Card/CardContent/title shell untouched.

`DashboardPage.tsx` needs NO changes: `computeMonthlyWonUnits`'s return shape (`{key, month, actual, target}[]`) is unchanged, so `<TargetVsActualChart data={computeMonthlyWonUnits(deals)} />` stays valid as-is — do not edit this file, confirm it still compiles via the build step in this plan's overall verification.

In `dashboard-metrics.test.ts`'s import line, change `MONTHLY_UNIT_TARGET` to `MONTHLY_TARGETS`. In the `computeMonthlyWonUnits` describe block, replace the "pre-seeds every bucket with the configured MONTHLY_UNIT_TARGET" test: instead of asserting every bucket's `target` equals one flat constant, derive each bucket's calendar-month index from its `key` field (`Number(bucket.key.slice(5, 7)) - 1`, since `key` is formatted `"yyyy-MM"`) and assert `bucket.target === MONTHLY_TARGETS[monthIndex]` for every bucket. No other test in this describe block needs to change (they only assert `actual`, not `target`).
  </action>
  <verify>
    <automated>npx vitest run src/features/dashboard/dashboard-metrics.test.ts -t computeMonthlyWonUnits</automated>
  </verify>
  <done>dashboard-config.ts exports MONTHLY_TARGETS (12-entry number[], Jan-Dec, summing to 480) replacing MONTHLY_UNIT_TARGET, with ANNUAL_UNIT_TARGET derived from its sum; computeMonthlyWonUnits pre-seeds each bucket's target from MONTHLY_TARGETS indexed by that bucket's calendar month; TargetVsActualChart renders a single Recharts AreaChart with two overlaid, non-stacked Area series ("Actual" filled, "Target" dashed) sharing one y-axis, replacing the prior ComposedChart Bar+Line; DashboardPage.tsx is unmodified and still compiles; all computeMonthlyWonUnits tests pass with per-month target assertions.</done>
</task>

</tasks>

<verification>
Run the full test suite and a production build to confirm both tasks compose cleanly and nothing else regressed:
- `npm test` — full Vitest suite passes, including both updated describe blocks in `dashboard-metrics.test.ts`.
- `npm run build` — `tsc -b && vite build` succeeds, confirming `ClosedByOwnerChart.tsx`'s Tooltip/YAxis formatter typings, `TargetVsActualChart.tsx`'s AreaChart/Area typings, and `DashboardPage.tsx`'s unchanged call sites all type-check.
</verification>

<success_criteria>
- ClosedByOwnerChart's stacked bars represent summed deal value per owner per month (currency-formatted axis/tooltip), not a raw count.
- TargetVsActualChart is a single Recharts AreaChart (Actual + Target as overlaid Area series on one y-axis), not a ComposedChart with Bar+Line.
- dashboard-config.ts's MONTHLY_TARGETS (12 entries, one per calendar month) drives computeMonthlyWonUnits' per-bucket target — no flat constant repeated 12 times.
- The per-month target array is code-level config only — no settings UI, no inline-edit, no persistence added.
- DashboardPage.tsx is unchanged and still compiles/renders both charts correctly.
- `npm test` and `npm run build` both pass.
</success_criteria>

<output>
Create `.planning/quick/260918-dll-phase-6-dashboard-refinements-1-closedby/260918-dll-SUMMARY.md` when done.
</output>

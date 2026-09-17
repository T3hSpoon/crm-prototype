# Phase 6: Sales Dashboard - Research

**Researched:** 2026-09-17
**Domain:** React/Recharts client-side data-visualization dashboard, derived-data modules over in-memory mock data (no backend)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Introduce a fixed roster of 5 named sales reps in the seed-data generator, replacing the current per-deal `faker.person.fullName()` (which produces a fresh random name per seeded deal with no stable "team"). Each seeded deal's `owner` is assigned from this fixed list instead. — **Reversibility:** costly — **Rationale:** downstream widgets (Leaderboard, stacked-bar-by-owner) and any derived-data code start assuming a small closed set of owner values; reverting to fully random names later would require re-touching that logic, not just the seed generator.
- **D-02:** Increase total seed volume beyond the current 40 deals so each of the 5 reps has a credible spread across won/lost/open outcomes (current 40-deal set yields only ~6 won, ~6 lost total). Exact count left to planning/research — the criterion is "each rep has enough won deals to be visible on the Leaderboard and enough closed deals to populate the stacked bar across periods."
- **D-03:** Owner-based charts (stacked-bar-by-owner) get a **new categorical color palette** (new CSS chart-color tokens, e.g. `--chart-owner-1..5`), sized to the 5-rep roster — distinct from the existing stage-based `GROUP_META` Tailwind palette (`src/features/pipeline/components/GroupSection.tsx`) so owner-colored and stage-colored charts aren't visually confused. The generic unused `--chart-1..5` grayscale tokens in `src/index.css` are not reused for this — new tokens should be added following the same CSS-custom-property + light/dark convention as `--chart-lost-bar`/`--chart-lost-grid`.
- **D-04:** Won deals use their existing `contractSignedDate` (already seeded independently, last 60-90 days) as the "closed" date for the Target-vs-Actual chart and the stacked-bar-by-period. No new field added for won deals.
- **D-05:** Lost deals reuse the existing `closeDate` field as their "closed" date — **not** a new `lostDate` field. This requires outcome-aware seeding: `closeDate` stays forward-looking (`faker.date.soon`, 0-90 days ahead) for **open** deals only, and is backdated to a realistic historical spread for **lost** deals. — **Reversibility:** costly — **Rationale:** `closeDate`'s meaning becomes outcome-dependent ("expected close" for open deals vs. "when it actually closed" for lost deals) instead of a single consistent meaning across all deals; any future code that reads `closeDate` assuming it's always forward-looking (or always one meaning) needs to account for this split. Planner/researcher should document this dual meaning clearly at the seed-data source and wherever `closeDate` is consumed for Phase 6 widgets.
- **D-06:** The historical spread used for won-deal `contractSignedDate` and backdated lost-deal `closeDate` should span a **trailing 12 months**, giving the Target-vs-Actual chart and stacked-bar-by-period enough periods (e.g., monthly buckets) to show a real trend — matches DASH-02's "across the full closed-deal history" wording better than the current ~90-day contract-date range.

### Claude's Discretion

- **Exact seed volume** (D-02) — pick a number during planning that makes all 5 widgets look populated without being obviously inflated; verify each rep has ≥1 won deal.
- **Sales target definition** (where the mock target value/config lives, what period it represents — monthly/quarterly/annual) — this gray area was identified during analysis but not discussed; user did not weigh in. Needs a reasonable default during planning (likely a small constant/config alongside the new `dashboard-metrics.ts` module), consistent with D-06's trailing-12-month time range.
- **Gauge widget visual style** (radial/donut vs. horizontal progress bar for DASH-01) — also identified but not discussed. No existing precedent in the codebase (`StatTile` is a flat card, no gauge/progress component exists anywhere in `src`). Left to research/planning to pick a style consistent with the existing card-based widget aesthetic.
- **Time-bucket granularity** for DASH-02/DASH-05 (weekly vs. monthly) — not explicitly discussed; monthly is implied by the trailing-12-month range (D-06) but the exact bucketing is left to planning.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Two identified gray areas (sales target definition, gauge visual style) were not discussed by user choice and are captured under "Claude's Discretion" above rather than deferred to a future phase — they're still in-scope for Phase 6, just left to planning.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Unit Sales Target gauge — actual vs. target units (summed line-item quantities across Won deals) against a seeded mock target | §Architecture Patterns Pattern 1 (Meter/gauge via `RadialBarChart`+`RadialBar background`), §Code Examples "Unit Sales Target gauge", §Assumptions A1 (units definition), A2 (target config) |
| DASH-02 | Target vs. Actual Sales chart — Won-deal unit volume by close date vs. target, full closed-deal history | §Architecture Patterns Pattern 2 (`ComposedChart` Bar+Line), §Code Examples "Target vs Actual by month", §Common Pitfalls (dual-axis anti-pattern, monthly bucketing rationale) |
| DASH-03 | Leaderboard — owners ranked by total Won deal value | §Architecture Patterns Pattern 3 (sorted derived array + horizontal `BarChart` or ranked list), §Code Examples "Owner leaderboard" |
| DASH-04 | Conversion Rate funnel — stage-by-stage % across Prospect → Lead → Opportunity → Deal → Won | §Architecture Patterns Pattern 4 (`FunnelChart`+`Funnel`, cumulative-snapshot algorithm), §Code Examples "Conversion funnel", §Common Pitfalls (snapshot-vs-true-conversion limitation, ordinal color ramp) |
| DASH-05 | Stacked bar chart — deals closed per period, segmented by owner | §Architecture Patterns Pattern 5 (`BarChart` with one `<Bar stackId>` per owner), §Code Examples "Closed deals by owner per month", §Assumptions A3 (won+lost scope) |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

These directives from `./.claude/CLAUDE.md` apply to this phase and constrain the plan:

- **Frontend only, no backend/API/auth/persistence this phase** — all 5 widgets must derive from the existing in-memory `usePipelineStore`/`dealsRepository` mock data; no network calls.
- **Charting library is Recharts 3** (already installed, `^3.10.1`) — do not add a second chart library (e.g., visx, Nivo, a standalone gauge package) for this phase; Recharts already covers gauge (`RadialBarChart`), funnel (`FunnelChart`), and stacked-bar (`Bar` + `stackId`) needs (verified below).
- **Date math via date-fns** (already installed, `^4.4.0`) — never hand-roll month bucketing with raw `Date` arithmetic or reach for `moment`.
- **Mock data via `@faker-js/faker`** (already installed, `^10.6.0`) — seed-data changes (fixed roster, outcome-aware dates) stay in `src/data/mock/seed-data.ts`, never real data.
- **State via Zustand** (`usePipelineStore`) — Dashboard reads the store's full unfiltered `deals` array directly, mirroring `ForecastPage.tsx`'s explicit data-integrity rule (never a Pipeline-tab-filtered subset).
- **Styling via Tailwind v4 + shadcn/ui, CSS-custom-property-driven chart colors** — new chart colors must be added as CSS custom properties in `src/index.css` (light + `.dark` variants), following the existing `--chart-lost-bar`/`--chart-lost-grid` convention — never hardcoded hex inline in a chart's `fill` prop directly (`var(--token)` instead, as `LostBreakdownChart.tsx` already does).
- **Don't hand-roll problems libraries solve** — a gauge, a funnel, and a stacked bar are all natively supported by the already-installed Recharts 3; no custom SVG gauge component is needed (see §Don't Hand-Roll).
- **Repository/service-layer swap pattern** — Phase 6 adds no new repository methods (it's pure derived-data over existing `Deal[]`), consistent with `deal-metrics.ts`/`forecast-metrics.ts`'s "pure functions, no store import" convention.
- **No heavy pre-styled component library** (MUI/Bootstrap/AntD) — the gauge and other new widgets must be built from Recharts + existing shadcn `Card` primitives, not a pulled-in gauge/meter UI kit.

## Summary

Phase 6 is a pure client-side, read-only aggregation feature: a third "Dashboard" tab added next to Pipeline and Forecast, built entirely from derived-data functions over the existing `Deal[]` array plus two small seed-data changes (a fixed 5-rep owner roster and outcome-aware `closeDate`/`contractSignedDate` backdating across a trailing 12 months). No new npm packages are required — Recharts 3.10.1 (already installed) directly supports every chart form this phase needs: `RadialBarChart`/`RadialBar` (with its `background` prop) for the gauge, `FunnelChart`/`Funnel` for the conversion funnel, and `BarChart`/`Bar` with `stackId` (already used for grouping, just needs multiple `<Bar>` series) for the owner-segmented stacked bar. This was confirmed by reading the installed package's own TypeScript declarations in `node_modules/recharts/types`, not assumed from training data.

The single most consequential design decision this research resolves is **DASH-04's conversion funnel algorithm**: the data model stores only a deal's *current* `pipelineStage` (a snapshot), not a history of stage transitions, so a literal "% of deals that advanced from stage N to stage N+1" cannot be computed. This research recommends a **cumulative "reached-at-least-this-stage" snapshot funnel** — reusing the already-established fact that a Lost deal retains the `pipelineStage` it fell from (verified in `pipeline-group.ts`) — and documents the exact algorithm, its assumptions, and its known limitation (a deal moved directly from Prospect to Won, which `StageSelect.tsx`'s dropdown allows, will not show as having "passed through" Lead/Opportunity/Deal). This is flagged as an assumption needing a quick user nod, not a locked decision.

The second load-bearing finding is a **validated color system** for the two new chart-color needs (owner-categorical palette for DASH-05, and an ordinal stage ramp if the funnel is colored by progression rather than by borrowed stage hues). The project's own existing `--chart-lost-bar`/`--chart-lost-grid` tokens (`#2a78d6`/`#3987e5` and `#e1e0d9`/`#2c2c2a`) are, byte-for-byte, slot 1 of a documented, colorblind-validated 8-hue categorical palette and its matching gridline token — meaning the codebase has already (likely unknowingly) adopted this reference system for its one existing chart. This research extends it rather than inventing new colors: 5 new `--chart-owner-1..5` tokens (validated via the CVD/contrast checker, PASS in both light and dark) for DASH-05, and a 5-step single-hue ordinal ramp (also validated) as the recommended DASH-04 funnel coloring, as an alternative to translating the Pipeline tab's per-stage Tailwind hues.

**Primary recommendation:** Build all 5 widgets as pure functions in a new `src/features/dashboard/dashboard-metrics.ts` (mirroring `forecast-metrics.ts`'s shape) plus a `dashboard-config.ts` for the mock target constant, feeding presentational chart components under `src/features/dashboard/components/` that follow `LostBreakdownChart.tsx`'s exact pattern (CSS-var colors, `ResponsiveContainer`, empty-state placeholder) — using Recharts' native `RadialBarChart` for the gauge and `FunnelChart` for the funnel, with zero new npm dependencies.

## Architectural Responsibility Map

This is a single-tier SPA (per PROJECT.md/CLAUDE.md — no backend this phase), so the standard multi-tier table collapses to two client-side sub-tiers plus the in-memory data stand-in for a future API:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dashboard tab navigation/mounting | Browser/Client (React local state) | — | Same pattern as existing Pipeline/Forecast tab toggle in `App.tsx` — a local `useState` union, no router |
| Unit/target/leaderboard/funnel/stacked-bar computation | Browser/Client (derived-data module) | — | Pure functions over `Deal[]`, no store/repository import — mirrors `forecast-metrics.ts`/`deal-metrics.ts` |
| Chart rendering (gauge, funnel, bars) | Browser/Client (Recharts SVG) | — | Recharts renders client-side SVG; no server rendering in this Vite SPA |
| Sales target mock value | In-memory config constant (stand-in for future API) | — | A seeded mock value per PROJECT.md's "mock/seed data only" constraint; lives in a small config module so a real API can later replace just this one value's source |
| Owner roster (5 fixed reps) | In-memory seed data (stand-in for future API) | — | Generated once in `seed-data.ts`, read via the existing `dealsRepository` → `usePipelineStore` seam; swappable later without touching widget code |

**No CDN/Database/SSR tiers exist in this project** (explicit PROJECT.md constraint: "frontend only... no backend, API, or authentication yet"). This map exists to confirm Phase 6 introduces no new tier — everything is Browser/Client, same as Phases 1-5.

## Standard Stack

### Core

No new packages. Every capability this phase needs is already installed and its API verified directly against the installed package's own type declarations this session (not training-data recall):

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.10.1 [VERIFIED: package.json:31 `"recharts": "^3.10.1"`, node_modules/recharts/package.json version field] | Gauge (`RadialBarChart`/`RadialBar`), funnel (`FunnelChart`/`Funnel`), stacked bar (`BarChart`/`Bar` with `stackId`), Target-vs-Actual (`ComposedChart`) | Already the project's chart library (CLAUDE.md); has native, purpose-built components for all 5 widgets — confirmed present in `node_modules/recharts/types/{chart,polar,cartesian}/*.d.ts` this session, not assumed |
| date-fns | 4.4.0 [VERIFIED: package.json:25 `"date-fns": "^4.4.0"`] | Month-bucketing for DASH-02/DASH-05 (`eachMonthOfInterval`, `startOfMonth`, `subMonths`, `format`, `isSameMonth`) | Already the project's date-math library (CLAUDE.md); all 5 needed function modules confirmed present in installed `node_modules/date-fns/*.d.ts` this session |
| @faker-js/faker | 10.6.0 [VERIFIED: package.json:17] | Fixed rep-roster assignment, outcome-aware date backdating (`faker.date.between`, `faker.date.recent`) in seed-data changes (D-01/D-05/D-06) | Already the project's mock-data generator; `date.between({ from, to })` and `date.recent({ days })` confirmed present in installed `@faker-js/faker` core type declarations this session |

### Supporting

No new supporting libraries needed. `@components/ui/card`, `@components/ui/tabs`, `lucide-react`, `clsx`/`tailwind-merge` are all already installed and used by the existing Forecast/Pipeline features that this phase's components mirror.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts `RadialBarChart` for the gauge | A dedicated gauge npm package (e.g. `react-gauge-chart`) | Adds a second chart dependency for a single widget; Recharts already ships this via `RadialBar`'s `background` prop (verified below) — no reason to add a package |
| Recharts `FunnelChart` for DASH-04 | A hand-built stack of `<div>`s with `clip-path` trapezoids, or a horizontal `BarChart` with descending bar lengths | `FunnelChart`/`Funnel` ships natively in the installed Recharts version with `LabelList` support — a custom trapezoid stack duplicates what the library already does correctly and is the "don't hand-roll" anti-pattern |
| A single-hue ordinal ramp for the funnel's 5 stages | Reusing `GROUP_META`'s per-stage Tailwind hues (indigo/amber/cyan/emerald/yellow) translated to hex | Both are viable — see §Architecture Patterns Pattern 4 for the tradeoff; the ordinal ramp is the dataviz-skill-correct choice for genuinely ordered categories (funnel stages), but the Tailwind hues give visual continuity with the Pipeline tab. Flagged as a discretion point, not a hard recommendation either way |

**Installation:** None required — no new packages.

**Version verification:** Ran `node -e "require('recharts/package.json').version"` against the installed `node_modules/recharts` this session → `3.10.1`, matching `package.json`'s `^3.10.1`. `date-fns` and `@faker-js/faker` versions confirmed directly from `package.json` (already pinned, no drift risk since no `npm install` is needed this phase).

## Package Legitimacy Audit

**Not applicable — this phase installs no new packages.** All required chart/date/mock-data functionality is covered by libraries already present in `package.json` and verified installed in `node_modules` this session (recharts 3.10.1, date-fns 4.4.0, @faker-js/faker 10.6.0). No `npm install` step belongs in this phase's plan.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ App.tsx  — tab state: "pipeline" | "forecast" | "dashboard"         │
│   (extends existing useState union, third always-mounted container) │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ tab === "dashboard" → visible
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DashboardPage.tsx                                                    │
│   const deals = usePipelineStore((s) => s.deals)  ← full, unfiltered │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ deals: Deal[]
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ dashboard-metrics.ts (pure functions, no store import)               │
│   computeWonUnits(deals)              → number                       │
│   computeMonthlyWonUnits(deals)       → {month, actual, target}[]    │
│   computeOwnerLeaderboard(deals)      → {owner, wonValue}[]           │
│   computeConversionFunnel(deals)      → {stage, count, pct}[]         │
│   computeClosedByOwnerPerMonth(deals) → {month, [owner]: count}[]     │
└──────┬─────────────┬─────────────┬─────────────┬─────────────┬──────┘
       ▼             ▼             ▼             ▼             ▼
  ┌─────────┐  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ Gauge   │  │ Target-   │ │ Leader-   │ │ Conversion│ │ Stacked   │
  │(RadialBar│  │vs-Actual  │ │ board     │ │ Funnel    │ │ Bar by    │
  │ Chart)  │  │(Composed  │ │(sorted    │ │(FunnelChart│ │ Owner     │
  │ DASH-01 │  │ Chart)    │ │ list/bar) │ │ + Funnel) │ │(BarChart) │
  │         │  │ DASH-02   │ │ DASH-03   │ │ DASH-04   │ │ DASH-05   │
  └─────────┘  └───────────┘ └───────────┘ └───────────┘ └───────────┘
       all read CSS custom properties for fill/stroke (var(--chart-*))
       — flip automatically under .dark, no theme-detection JS
```

### Recommended Project Structure

```
src/features/dashboard/
├── components/
│   ├── DashboardPage.tsx          # page layout, mirrors ForecastPage.tsx
│   ├── UnitTargetGauge.tsx        # DASH-01 — RadialBarChart meter
│   ├── TargetVsActualChart.tsx    # DASH-02 — ComposedChart (Bar + Line)
│   ├── OwnerLeaderboard.tsx       # DASH-03 — sorted list or horizontal BarChart
│   ├── ConversionFunnelChart.tsx  # DASH-04 — FunnelChart + Funnel
│   └── ClosedByOwnerChart.tsx     # DASH-05 — BarChart, one <Bar> per owner
├── dashboard-metrics.ts           # pure derived-data functions (all 5 widgets)
└── dashboard-config.ts            # OWNER_ROSTER, MONTHLY_UNIT_TARGET, TRAILING_MONTHS
```

### Pattern 1: Unit Sales Target gauge as a Recharts "Meter" (DASH-01)

**What:** A single-ratio-against-a-limit widget is a *meter*, not a 2-slice pie/donut (a pie compares parts of a whole; a gauge compares a value against a limit — different jobs, different forms). Recharts has no dedicated `<Gauge>` component, but its `RadialBarChart` + a single `<RadialBar>` with a `background` track is the documented, standard composition for exactly this ("Simple Radial Bar Chart" pattern, official Recharts examples).

**When to use:** DASH-01's "actual units vs. seeded mock target" is a single ratio against a limit — the canonical meter case.

**Verified API (read from installed `node_modules/recharts/types` this session):**
- `RadialBarChart` accepts `startAngle`/`endAngle` (semicircle: `startAngle={180} endAngle={0}`; full circle default is `0`→`360`) [VERIFIED: node_modules/recharts/types/chart/RadialBarChart.d.ts:3-21 — `defaultRadialBarChartProps` shows `startAngle: 0, endAngle: 360, ... cx: "50%", cy: "50%", innerRadius: 0, outerRadius: "80%"`], plus `innerRadius`/`outerRadius`/`cx`/`cy`.
- `RadialBar` accepts a `background` prop: "Renders a background for each bar. Options: `false`: no background; `true`: renders default background; `object`: the props of background rectangle" [VERIFIED: node_modules/recharts/types/polar/RadialBar.d.ts:73-83], plus `cornerRadius`, `minPointSize`, `stackId`.

**Color per the dataviz-skill Meter spec (CITED: this session's dataviz-skill `references/marks-and-anatomy.md`):** "the fill carries severity... the unfilled track is a lighter step of the same ramp (blue-on-blue, etc.) so state reads across the whole bar" — i.e., do NOT color the track gray/neutral and the fill an unrelated accent; both should be steps of one hue.

Because `--chart-lost-bar` (`#2a78d6` light / `#3987e5` dark) is already, byte-for-byte, slot 1 ("blue") of the validated reference sequential ramp used by the project's other chart [VERIFIED via direct value match against the dataviz skill's documented sequential-ramp table], the same hue is the natural fill color for this gauge too — reusing an already-chosen brand color rather than picking a new one:

```typescript
// New tokens in src/index.css, mirroring --chart-lost-bar's convention:
// :root {
//   --chart-gauge-fill: #2a78d6;   /* same hue as --chart-lost-bar */
//   --chart-gauge-track: #cde2fb;  /* same hue, lightest ramp step */
// }
// .dark {
//   --chart-gauge-fill: #3987e5;
//   --chart-gauge-track: #184f95;  /* darker step recedes toward dark surface */
// }

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

function UnitTargetGauge({ actual, target }: { actual: number; target: number }) {
  const pct = target === 0 ? 0 : Math.min(actual / target, 1);
  const data = [{ name: "units", value: pct * 100 }];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadialBarChart
        data={data}
        startAngle={180}
        endAngle={0}
        innerRadius="70%"
        outerRadius="100%"
        cx="50%"
        cy="90%"
      >
        <RadialBar
          dataKey="value"
          background={{ fill: "var(--chart-gauge-track)" }}
          fill="var(--chart-gauge-fill)"
          cornerRadius={6}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 2: Target vs. Actual as a `ComposedChart` (Bar + Line), never dual-axis (DASH-02)

**What:** Monthly bars for actual Won-deal unit volume, plus a line (or `ReferenceLine`) for the target, **on one shared y-axis (units)** — never two y-scales. The dataviz-skill anti-pattern list calls dual-axis "the #1 chart mistake" (CITED: this session's dataviz-skill `references/anti-patterns.md` — "Dual-axis charts... invent a correlation that isn't in the data"). Since both series here are the *same unit* (unit count), a shared axis is not just safer, it is also the more correct representation.

**When to use:** DASH-02's "plotting Won-deal unit volume by close date against the target" — two series, same unit, over time.

**Verified API:** `ComposedChart` exists in the installed Recharts version [VERIFIED: node_modules/recharts/types/chart/ComposedChart.d.ts present in `node_modules/recharts/types/chart/` directory listing this session], and `Bar` supports `stackId` for cases where multiple bars must stack [VERIFIED: node_modules/recharts/types/cartesian/Bar.d.ts:65-71 — "When two Bars have the same axisId and same stackId, then the two Bars are stacked in the chart." / `stackId?: StackId;`] (not needed here since Target/Actual are Bar+Line, not two stacked bars).

**Time bucketing — monthly, not weekly:** D-06 fixes the historical spread at a trailing 12 months. Monthly bucketing yields exactly 12 data points (a clean, legible chart width); weekly would yield ~52 points, which crowds the x-axis and works against the "quick mock, not the main project" framing from PROJECT.md. Use `date-fns`'s `eachMonthOfInterval`, `startOfMonth`, `subMonths`, `format` (all confirmed present in the installed `date-fns` package this session).

```typescript
// dashboard-metrics.ts
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import type { Deal } from "@/shared/types/deal";
import { MONTHLY_UNIT_TARGET } from "@/features/dashboard/dashboard-config";

function sumUnits(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems.reduce((sum, li) => sum + li.units, 0);
}

export function computeMonthlyWonUnits(deals: Deal[], months = 12) {
  const now = new Date();
  const buckets = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: now,
  }).map((d) => ({
    key: format(d, "yyyy-MM"),
    month: format(d, "MMM yyyy"),
    actual: 0,
    target: MONTHLY_UNIT_TARGET,
  }));
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const deal of deals) {
    if (deal.outcome !== "won" || !deal.contractSignedDate) continue; // D-04
    const bucket = byKey.get(format(new Date(deal.contractSignedDate), "yyyy-MM"));
    if (bucket) bucket.actual += sumUnits(deal);
  }
  return buckets;
}
```

```tsx
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

function TargetVsActualChart({ data }: { data: ReturnType<typeof computeMonthlyWonUnits> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} label={{ value: "Units", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="actual" name="Actual" fill="var(--chart-gauge-fill)" radius={[4, 4, 0, 0]} />
        <Line dataKey="target" name="Target" stroke="var(--chart-lost-grid)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 3: Owner Leaderboard — sorted derived array (DASH-03)

**What:** No exotic chart form needed — sum `value` across Won deals grouped by `owner`, sort descending. Render as either a simple ranked list (Card rows) or a horizontal single-series `BarChart` (Recharts `layout="vertical"`); both are legitimate per the dataviz-skill "comparing magnitude" guidance (bar chart, single hue since it's one series, not per-owner colors — see the Common Pitfalls note on this).

```typescript
export function computeOwnerLeaderboard(deals: Deal[]) {
  const totals = new Map<string, number>();
  for (const d of deals) {
    if (d.outcome !== "won") continue;
    totals.set(d.owner, (totals.get(d.owner) ?? 0) + d.value);
  }
  return [...totals.entries()]
    .map(([owner, wonValue]) => ({ owner, wonValue }))
    .sort((a, b) => b.wonValue - a.wonValue);
}
```

### Pattern 4: Conversion Funnel — cumulative snapshot, not a true historical conversion rate (DASH-04)

**What:** The `Deal` model stores a single current `pipelineStage` per deal [VERIFIED: src/shared/types/deal.ts:12 `export type PipelineStage = "prospect" | "lead" | "opportunity" | "deal";`], not a log of stage transitions with timestamps. A **true** stage-to-stage conversion rate ("of the deals that were ever in Lead, what % advanced to Opportunity") cannot be computed from this data — there is no history to walk. What *can* be computed is a **cumulative snapshot funnel**: "of all deals ever created, what fraction currently sits at or beyond stage N" — the standard fallback used by CRM dashboards lacking a stage-history log, and defensible because `toPipelineGroup`/`clearPatchFor`'s design [VERIFIED: src/shared/utils/pipeline-group.ts:9-12,45-55] already treats current-stage-plus-outcome as the sole state, never derived from history.

**Key supporting fact (verified this session):** A **Lost** deal retains the `pipelineStage` it fell from — it is never overwritten. `computeLostByStage` in the existing `forecast-metrics.ts` already relies on this: "Groups lost deals by `pipelineStage` directly — never `toPipelineGroup`, which would return 'lost' and destroy the stage information a lost deal retains (the stage it fell through from)." [VERIFIED: src/features/forecast/forecast-metrics.ts:69-73]. This means a Lost deal should count toward every funnel stage up to and including the stage it fell from (it genuinely reached those stages before exiting), then stop.

**A known limitation to flag to the user (not silently absorbed):** `StageSelect.tsx`'s per-row dropdown lists all 6 groups (`prospect, lead, opportunity, deal, won, lost`) as always-selectable options [VERIFIED: src/features/pipeline/components/StageSelect.tsx:21-28 — `const GROUP_OPTIONS: { value: PipelineGroup; label: string }[] = [{ value: "prospect", ... }, { value: "lead", ... }, { value: "opportunity", ... }, { value: "deal", ... }, { value: "won", ... }, { value: "lost", ... }];`], so a deal can move directly from Prospect to Won, skipping Lead/Opportunity/Deal. Its stored `pipelineStage` in that case stays "prospect" even though the deal is Won. The recommended algorithm below **treats every Won deal as having passed through all 5 funnel stages regardless of its stored `pipelineStage`** (the intuitive, demo-friendly reading — "a closed deal completed the funnel") rather than under-counting stage-skips. This is a deliberate simplification; flag it as an assumption (see Assumptions Log A4), not a silent bug.

**Recommended algorithm:**

```typescript
import type { Deal, PipelineStage } from "@/shared/types/deal";

const STAGE_ORDER: PipelineStage[] = ["prospect", "lead", "opportunity", "deal"];
const STAGE_LABELS: Record<PipelineStage | "won", string> = {
  prospect: "Prospect",
  lead: "Lead",
  opportunity: "Opportunity",
  deal: "Deal",
  won: "Won",
};

export function computeConversionFunnel(deals: Deal[]) {
  const total = deals.length;
  const stages: (PipelineStage | "won")[] = [...STAGE_ORDER, "won"];

  return stages.map((stage) => {
    const count =
      stage === "won"
        ? deals.filter((d) => d.outcome === "won").length
        : deals.filter((d) => {
            if (d.outcome === "won") return true; // completed deals reached every stage
            const rank = STAGE_ORDER.indexOf(d.pipelineStage);
            return rank >= STAGE_ORDER.indexOf(stage); // open/lost: current or fallout stage
          }).length;
    return { stage: STAGE_LABELS[stage], count, pct: total === 0 ? 0 : count / total };
  });
}
```

**Verified Recharts API:** `FunnelChart` and `Funnel` (with `LabelList` support) are present in the installed package [VERIFIED: node_modules/recharts/types/chart/FunnelChart.d.ts and node_modules/recharts/types/cartesian/Funnel.d.ts both present in the directory listing this session; `Funnel`'s props include `dataKey`, `nameKey`, `lastShapeType`, `label` — read directly from `Funnel.d.ts` lines 11-196].

```tsx
import { Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";

function ConversionFunnelChart({ data }: { data: ReturnType<typeof computeConversionFunnel> }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="count" nameKey="stage" data={data} isAnimationActive>
          <LabelList position="right" dataKey="stage" fill="var(--muted-foreground)" stroke="none" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
```

**Funnel coloring — a genuine discretion point (dataviz-skill guidance, CITED):** Funnel stages are an *ordinal* category (their order carries meaning — swapping it would misstate progression), which the dataviz skill's color-formula treats as one hue in monotone lightness steps, not distinct rainbow hues per stage: "position in a sequence (funnel stage, tier, bucket) → one hue, monotone lightness steps" (`references/color-formula.md`). This validated (via this session's `validate_palette.js --ordinal`, both PASS) 5-step blue ramp is the dataviz-skill-correct choice:

| Stage | Light | Dark |
|-------|-------|------|
| Prospect | `#86b6ef` | `#9ec5f4` |
| Lead | `#5598e7` | `#6da7ec` |
| Opportunity | `#2a78d6` | `#3987e5` |
| Deal | `#1c5cab` | `#256abf` |
| Won | `#104281` | `#184f95` |

The alternative — translating `GROUP_META`'s existing per-stage Tailwind hues (indigo-400/amber-400/cyan-400/emerald-400/yellow-400, values verified below) — gives visual continuity with the Pipeline tab's own group colors, at the cost of not being a "true" ordinal ramp. **Both are legitimate; this is a discretion call for planning**, not a locked requirement (see Assumptions Log A5). If continuity with the Pipeline tab wins, `GROUP_META` is currently *not exported* from `GroupSection.tsx` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:21 `const GROUP_META: Record<` — no `export` keyword present], so either export it or hardcode the already-verified hex translations locally in the dashboard feature (recommended, to avoid coupling dashboard internals to pipeline internals):

| Stage | Tailwind class (GroupSection.tsx) | Hex (oklch, verified) |
|-------|-----------------------------------|------------------------|
| Prospect | `border-l-indigo-400` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:28] | `oklch(67.3% 0.182 276.935)` [VERIFIED: node_modules/tailwindcss/theme.css:146 `--color-indigo-400: oklch(67.3% 0.182 276.935);`] |
| Lead | `border-l-amber-400` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:34] | `oklch(82.8% 0.189 84.429)` [VERIFIED: node_modules/tailwindcss/theme.css:38 `--color-amber-400: oklch(82.8% 0.189 84.429);`] |
| Opportunity | `border-l-cyan-400` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:40] | `oklch(78.9% 0.154 211.53)` [VERIFIED: node_modules/tailwindcss/theme.css:114 `--color-cyan-400: oklch(78.9% 0.154 211.53);`] |
| Deal | `border-l-emerald-400` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:46] | `oklch(76.5% 0.177 163.223)` [VERIFIED: node_modules/tailwindcss/theme.css:90 `--color-emerald-400: oklch(76.5% 0.177 163.223);`] |
| Won | `border-l-yellow-400` [VERIFIED: src/features/pipeline/components/GroupSection.tsx:52] | `oklch(85.2% 0.199 91.936)` [VERIFIED: node_modules/tailwindcss/theme.css:50 `--color-yellow-400: oklch(85.2% 0.199 91.936);`] |

### Pattern 5: Stacked bar chart, deals closed per period segmented by owner (DASH-05)

**What:** One `<Bar>` per owner (5 fixed reps, D-01), all sharing the same `stackId`, each period (month) as one bar group. This is a multi-series stacked bar, not a single series colored per-category-value — each owner is its own `dataKey`/legend entry.

```typescript
export function computeClosedByOwnerPerMonth(deals: Deal[], owners: string[], months = 12) {
  const now = new Date();
  const buckets = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), months - 1),
    end: now,
  }).map((d) => {
    const row: Record<string, string | number> = { month: format(d, "MMM yyyy"), key: format(d, "yyyy-MM") };
    for (const owner of owners) row[owner] = 0;
    return row;
  });
  const byKey = new Map(buckets.map((b) => [b.key as string, b]));

  for (const deal of deals) {
    if (deal.outcome !== "won" && deal.outcome !== "lost") continue; // see Assumptions Log A3
    const dateStr = deal.outcome === "won" ? deal.contractSignedDate : deal.closeDate; // D-04/D-05
    if (!dateStr) continue;
    const bucket = byKey.get(format(new Date(dateStr), "yyyy-MM"));
    if (bucket) bucket[deal.owner] = (bucket[deal.owner] as number) + 1;
  }
  return buckets;
}
```

```tsx
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OWNER_ROSTER } from "@/features/dashboard/dashboard-config";

const OWNER_COLORS = [
  "var(--chart-owner-1)",
  "var(--chart-owner-2)",
  "var(--chart-owner-3)",
  "var(--chart-owner-4)",
  "var(--chart-owner-5)",
];

function ClosedByOwnerChart({ data }: { data: ReturnType<typeof computeClosedByOwnerPerMonth> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {OWNER_ROSTER.map((owner, i) => (
          <Bar key={owner} dataKey={owner} name={owner} stackId="closed" fill={OWNER_COLORS[i]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**New owner-categorical CSS tokens (D-03), validated this session via the dataviz skill's `scripts/validate_palette.js` — both light and dark passed all checks (lightness band, chroma floor, CVD separation ΔE 9.1 light/8.4 dark ≥ 8 target, normal-vision floor ΔE 19.6/19.3 ≥ 15 floor):**

```css
/* src/index.css :root — mirrors --chart-lost-bar/--chart-lost-grid's convention */
--chart-owner-1: #2a78d6; /* blue */
--chart-owner-2: #eb6834; /* orange */
--chart-owner-3: #1baf7a; /* aqua */
--chart-owner-4: #eda100; /* yellow */
--chart-owner-5: #e87ba4; /* magenta */

/* .dark */
--chart-owner-1: #3987e5;
--chart-owner-2: #d95926;
--chart-owner-3: #199e70;
--chart-owner-4: #c98500;
--chart-owner-5: #d55181;
```

Note `--chart-owner-1` is the same hue as `--chart-gauge-fill`/`--chart-lost-bar` (both slot 1 of the same reference palette) — this is fine since they never appear in the same chart/legend together, but if it reads as confusing in practice during UAT, `--chart-owner-1` can be re-assigned to a later slot without re-validating (all 5 slots already pass in fixed order).

### Anti-Patterns to Avoid

- **Dual-axis Target-vs-Actual chart:** Do not put "Actual units" on a left axis and "Target" on a right axis with a different scale — both are units, they belong on one shared axis (CITED: dataviz-skill anti-patterns, "the #1 chart mistake").
- **Coloring the Owner Leaderboard bars categorically (one hue per owner):** DASH-03 is a single series (Won value, by owner) — a value-ramp or per-bar rainbow miscommunicates identity where none is needed; use one hue for all bars (dataviz-skill "value-ramp on nominal categories" anti-pattern doesn't strictly apply since owners genuinely are nominal categories, but there is no "job" here beyond magnitude comparison — same-hue bars keep the ranking, not the identity, as the story).
- **A custom hand-rolled SVG gauge:** Recharts' `RadialBarChart`+`RadialBar background` already does this; hand-rolling duplicates library functionality (violates CLAUDE.md's "Don't Hand-Roll" table pattern).
- **Recoloring the funnel or leaderboard on every data refresh by array index without a stable key:** if owners are ever filtered/reordered, colors must follow the *entity* (a specific owner), not array position — assign each owner's color from the fixed `OWNER_ROSTER` index order (D-01's roster), never from a runtime-sorted array's index.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radial "gauge" progress indicator | A custom SVG `<circle>` + `stroke-dasharray` percentage hack | Recharts `RadialBarChart` + `RadialBar` with `background` prop | Native library support already installed; handles responsive sizing, animation, and tooltip wiring for free — confirmed present in `node_modules/recharts/types/polar/RadialBar.d.ts` |
| Conversion funnel trapezoid shapes | Hand-computed SVG `<path>` trapezoids per stage | Recharts `FunnelChart` + `Funnel` (+ `LabelList`) | `Funnel.d.ts`'s `computeFunnelTrapezoids` already does the trapezoid geometry; reimplementing it is pure risk for zero benefit |
| Month-bucketing deals by close/signed date | Manual `new Date().getMonth()`/string-slicing loops | `date-fns`'s `eachMonthOfInterval` + `startOfMonth` + `subMonths` + `format` | Handles month-length/leap-year/timezone edge cases correctly; already a project dependency |
| Colorblind-safe categorical palette for 5 owners | Picking 5 "different-looking" hex values by eye | The dataviz-skill's documented, `validate_palette.js`-checked reference palette slots 1-5 | Eyeballing color distinctness is exactly the anti-pattern the skill's validator exists to prevent — already run and PASSED this session for both light/dark |

**Key insight:** Every visual form this phase needs (meter, funnel, stacked bar) is a first-class, already-installed Recharts 3 component. The only genuinely custom work is the *derived-data* layer (`dashboard-metrics.ts`) — which is exactly the layer the codebase's own convention (`forecast-metrics.ts`, `deal-metrics.ts`) says should be hand-written, pure, and unit-testable.

## Common Pitfalls

### Pitfall 1: `closeDate`'s dual meaning silently breaking a Phase 6 widget

**What goes wrong:** After D-05's seed-data change, `closeDate` means "expected close" for open deals but "when it actually closed" for lost deals. A widget or derived function that reads `closeDate` without checking `outcome` first will mix forward-looking dates (for open deals) into a "closed deal history" computation, corrupting DASH-05's per-period bucketing.
**Why it happens:** `closeDate` is a single field with an outcome-dependent meaning — nothing in the type system (`closeDate: string` [VERIFIED: src/shared/types/deal.ts:63-64]) enforces the split.
**How to avoid:** Every function that buckets "closed" deals must filter `outcome === "lost"` (using `closeDate`) or `outcome === "won"` (using `contractSignedDate`) explicitly, never read `closeDate` unconditionally across all deals. `computeClosedByOwnerPerMonth` above does this correctly — treat it as the reference pattern.
**Warning signs:** A stacked-bar/chart showing "closed" activity in future months, or an open deal appearing in a historical closed-deals chart.

### Pitfall 2: Funnel semantics mismatch between "snapshot distribution" and "true conversion rate"

**What goes wrong:** Stakeholders reading "Conversion Rate funnel" may expect true stage-to-stage advancement percentages (a cohort/historical metric); this phase can only deliver a cumulative snapshot ("% of all deals currently at or beyond stage N") because no stage-transition history is stored.
**Why it happens:** `pipelineStage` is a single current-state field, not an event log (see Pattern 4 above).
**How to avoid:** Document the "snapshot, not cohort-history" nature directly in the widget's UI copy (e.g., a caption: "Current pipeline distribution" rather than implying a historical A/B advancement rate) and in code comments on `computeConversionFunnel`. Flag to the user during UAT that this is the data-supported interpretation.
**Warning signs:** Percentages that don't monotonically decrease stage-to-stage would indicate a bug in the cumulative algorithm (they should always decrease or stay flat, never increase, given the `>=` rank comparison).

### Pitfall 3: Seed volume too low to populate all 5 widgets credibly

**What goes wrong:** At the current 40-deal / 5-rep split (~8 deals/rep), the ~15%-lost/~15%-of-remainder-won probabilities yield roughly 1 won deal per rep on average — some reps could end up with **zero** won deals, leaving blank Leaderboard rows and sparse stacked-bar segments (violating D-02's explicit success criterion: "each rep has enough won deals to be visible on the Leaderboard").
**Why it happens:** The existing 40-deal total was tuned for the Phase 1-5 UI, not for a 5-way owner split feeding two owner-based Phase 6 widgets across 12 monthly periods.
**How to avoid:** Increase total seed volume; **150 deals** is a defensible concrete number: at ~15% lost (≈19-23 total) and ~15%-of-remainder won (≈17-20 total), each of 5 reps averages ~3-4 won and ~4 lost deals — enough to appear on the Leaderboard and populate most of the 12 monthly stacked-bar periods (some sparse months are realistic and fine). This is well below the ~"hundreds/thousands" threshold CLAUDE.md's Alternatives table cites for needing `@tanstack/react-virtual` row virtualization, so no Pipeline/Forecast table changes are needed as a side effect. No test in the codebase hardcodes the "40 deals" count [VERIFIED: grep across `src/` for `count: 40`/`seedDeals.length` found only the one seed-data.ts definition site, no test assertions on total count], so raising it is a safe, isolated change.
**Warning signs:** After seeding, spot-check `computeOwnerLeaderboard(deals)` and confirm every one of the 5 roster names appears with `wonValue > 0`.

### Pitfall 4: "Units" definition ambiguity (product vs. service line items)

**What goes wrong:** REQUIREMENTS.md defines DASH-01/02's "units" as "summed line-item quantities across Won deals" with no product/service qualifier. The existing precedent, `computeQuantity` in `deal-metrics.ts`, sums `units` **only** across `type: "service"` line items [VERIFIED: src/shared/utils/deal-metrics.ts:59-63 — "Quantity — the sum of `units` across only the deal's `type: "service"` line items... Product-type line-item units are excluded"]. Silently reusing `computeQuantity` for the Dashboard's "unit sales" metric would exclude every product-type line item, likely undercounting significantly.
**Why it happens:** `computeQuantity` was built in Phase 5 for a different purpose (ARPU's denominator, an MRR-per-unit metric), not for a general "how many units did we sell" figure.
**How to avoid:** Define a **new**, dashboard-specific function (`computeWonUnits` — see Pattern 2 above) that sums `units` across **all** line items (product + service) on Won deals, distinct from `computeQuantity`. Do not import/reuse `computeQuantity` for DASH-01/02 without confirming this choice with the user first (see Assumptions Log A1).
**Warning signs:** The gauge/chart numbers look implausibly low relative to the visible line-item data in the Pipeline tab's Won-deal detail views.

### Pitfall 5: Dashboard reading a filtered subset of deals

**What goes wrong:** If `DashboardPage` accidentally reads deals through any Pipeline-tab filter/search state (instead of the store's raw `deals` array), all 5 widgets silently reflect a forgotten filter, producing numbers that don't match reality.
**Why it happens:** This is an established, previously-identified risk in this codebase — `ForecastPage.tsx`'s own docstring explicitly calls this out as a data-integrity rule it enforces [VERIFIED: src/features/forecast/components/ForecastPage.tsx:21-24 — "Reads the store's full, unfiltered `deals` array directly — never a Pipeline-tab-filtered subset... this plan's data-integrity prohibition: Forecast numbers must never silently reflect a forgotten search/filter"].
**How to avoid:** `DashboardPage` must call `usePipelineStore((s) => s.deals)` directly, exactly like `ForecastPage.tsx` does, never receive deals as a prop from a filtered view.
**Warning signs:** Dashboard totals change when the Pipeline tab's search box has text in it.

### Pitfall 6: Chart container height excluding the x-axis label band

**What goes wrong:** A chart `<ResponsiveContainer height={N}>` sized to just the plot area (not the axis-label band below it) causes the card to grow a small internal scrollbar or clip the bottom-most axis labels.
**Why it happens:** Recharts' `ResponsiveContainer` fills exactly the height given; if that height doesn't include room for rotated/wrapped x-axis tick labels (e.g., 12 month labels, or 5 owner names in a legend), labels get cut off (CITED: dataviz-skill anti-patterns, "A chart container whose fixed height excludes the x-axis band").
**How to avoid:** Size each new chart's `ResponsiveContainer height` generously (280-320px, matching `LostBreakdownChart.tsx`'s existing `height={260}` for a simpler chart) and let the Card grow with content rather than clipping.
**Warning signs:** Truncated or vertically-scrollable chart cards at default browser zoom.

## Code Examples

See §Architecture Patterns 1-5 above — each pattern includes a complete, verified-API code example (gauge, target-vs-actual, leaderboard, funnel, stacked-bar-by-owner). All Recharts component/prop names in those examples were read directly from `node_modules/recharts/types/**/*.d.ts` this session, not recalled from training data.

### Seed-data changes (D-01, D-05, D-06) — outline

```typescript
// src/data/mock/seed-data.ts
import { subMonths } from "date-fns";

// D-01: fixed roster replacing faker.person.fullName()
const OWNER_ROSTER = [
  "Priya Nair",
  "Marcus Webb",
  "Elena Torres",
  "Devon Clarke",
  "Sana Malik",
]; // exact names are cosmetic; count of 5 is the only load-bearing constraint (D-01)

function buildSeedDeal(): Deal {
  // ...
  const owner = faker.helpers.arrayElement(OWNER_ROSTER); // was faker.person.fullName()
  const isLost = faker.datatype.boolean({ probability: 0.15 });
  const isWon = !isLost && faker.datatype.boolean({ probability: 0.15 });

  // D-05: outcome-aware closeDate — forward-looking only for OPEN deals
  const closeDate = isLost
    ? faker.date.between({ from: subMonths(new Date(), 12), to: new Date() }).toISOString() // D-06: trailing 12mo
    : faker.date.soon({ days: 90 }).toISOString(); // unchanged for open; won deals don't read closeDate for Phase 6 widgets but the field still needs a value — keep existing behavior or also backdate for consistency, planner's call
  // ...
}
```

**Note:** `faker.date.between({ from, to })` and `faker.date.recent({ days })` were confirmed present in the installed `@faker-js/faker` core type declarations this session [VERIFIED: node_modules/@faker-js/faker/dist/core-BMOHu6e5.d.ts:1499 `between(options: {` and :1574 `recent(options?: {`].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Recharts 2.x `Funnel`/`RadialBar` (older, less complete polar/funnel API) | Recharts 3.x's restructured `types/{chart,polar,cartesian}` module layout with dedicated `FunnelChart.d.ts`/`RadialBarChart.d.ts` | Recharts 3 major (already the installed version, `^3.10.1`) | The installed version already has everything this phase needs — no upgrade required, but any *older* Recharts 2.x tutorial found via web search may show a different (pre-3.x) import shape; trust the installed `node_modules` types over search-result code snippets |

**Deprecated/outdated:** None relevant — no old approach in this codebase is being replaced by Phase 6; this is additive.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Units" (DASH-01/02) = sum of `units` across **all** line items (product + service) on Won deals, a **new** function distinct from the existing service-only `computeQuantity` | Pitfall 4, Pattern 2 | If the intended meaning was service-only (matching `computeQuantity`'s precedent), the gauge/chart would need a different, smaller function — low rework cost (single function body) but changes the displayed numbers |
| A2 | Mock sales target lives as a `MONTHLY_UNIT_TARGET` constant in a new `dashboard-config.ts`, with the DASH-01 gauge target = `MONTHLY_UNIT_TARGET × 12` (trailing 12 months, matching D-06) | Pattern 1, Pattern 2 | If the user wants a single all-time target unrelated to the monthly breakdown, only the config module's shape changes — no widget-code rework |
| A3 | DASH-05's "deals closed per period" includes **both** Won and Lost deals (broader "closed" reading, consistent with `forecast-metrics.ts`'s existing `computeWinRate` treating won+lost as "closed"), not Won-only like DASH-02 | Pattern 5 | If DASH-05 should be Won-only, the `outcome !== "won" && outcome !== "lost"` filter narrows to `outcome !== "won"` — a one-line change, but the widget would show materially fewer bars |
| A4 | DASH-04's funnel treats every Won deal as having passed through all 5 stages, regardless of its stored `pipelineStage` (which may reflect an early-stage direct-to-Won move) | Pattern 4 | If a strict "only count stages a deal's stored `pipelineStage` proves it reached" interpretation is preferred, Won deals would need per-stage-rank counting instead of an unconditional `true` — the funnel would show smaller early-stage counts for direct-to-Won deals |
| A5 | DASH-04's funnel uses a validated single-hue ordinal ramp (5 blue steps) for stage coloring, rather than translating `GROUP_META`'s per-stage Tailwind hues for visual continuity with the Pipeline tab | Pattern 4 | Purely cosmetic — either choice satisfies the requirement; picking the Tailwind-hue alternative later is a color-constant swap only, no logic change |
| A6 | Total seed volume increases from 40 to **150** deals (kept at the existing ~15% lost / ~15%-of-remainder won probabilities) | Pitfall 3 | If 150 still leaves a rep with 0 won deals (probabilistic, low but nonzero chance), the plan should include a spot-check-and-adjust step rather than trusting the math blindly |

**If this table is empty:** N/A — see rows above; all are reasonable, well-reasoned defaults per CONTEXT.md's explicit grant of "Claude's Discretion" on target definition, gauge style, and time-bucket granularity, but each is flagged here so planning/discuss-phase can confirm before locking.

## Open Questions (RESOLVED)

1. **Should DASH-05's "closed" scope include Lost deals, or Won only? — RESOLVED: won+lost.**
   - What we know: REQUIREMENTS.md says "deals closed per period" without qualifying Won/Lost; DASH-02 is explicitly "Won-deal unit volume." `forecast-metrics.ts`'s existing `computeWinRate` treats won+lost together as "closed" deals.
   - What's unclear: Whether the Dashboard milestone's "closed-deal volume over time" (PROJECT.md's framing) intends the broader won+lost reading.
   - Recommendation: Default to won+lost (A3 above); confirm with a quick user check during planning/UAT since it's a one-line filter change either way.
   - **Resolution:** Adopted the won+lost reading per Assumption A3 above. Plan `06-03-PLAN.md` Task 1 implements `computeClosedByOwnerPerMonth` counting both Won (`contractSignedDate`) and Lost (`closeDate`) deals, with an inline code comment citing this RESEARCH Assumption A3 and `forecast-metrics.ts`'s existing `computeWinRate` precedent. No open decision remains.

2. **Exact target number for `MONTHLY_UNIT_TARGET`. — RESOLVED: 40 (annual target 480).**
   - What we know: It's explicitly a "seeded mock value" (Out-of-Scope table: "user-editable sales targets" excluded) with no real business number to match.
   - What's unclear: What number makes the gauge/chart look realistic (neither always-maxed-out nor always-empty) against whatever actual seed volume (A6) produces.
   - Recommendation: Compute the actual average monthly Won-units from the finalized seed data first, then set `MONTHLY_UNIT_TARGET` to roughly that average (so the gauge sits near 80-110% most of the time) — a "set it after seeding, not before" implementation order.
   - **Resolution:** Set to `MONTHLY_UNIT_TARGET = 40` (`ANNUAL_UNIT_TARGET = 480`) in `06-01-PLAN.md` Task 1's `dashboard-config.ts`, calibrated against the finalized, fixed-seed (`faker.seed(20260917)`) 150-deal dataset (`SEED_DEAL_COUNT = 150`, per Assumption A6) so the gauge and 06-02's monthly chart sit near 80-110% most months. No open decision remains.

## Environment Availability

Skipped — this phase adds no new external dependency, tool, service, or runtime beyond what's already installed and verified (Recharts 3.10.1, date-fns 4.4.0, @faker-js/faker 10.6.0 — all confirmed present in `node_modules` and pinned in `package.json` this session). No `npm install` step is needed.

## Validation Architecture

Skipped — `.planning/config.json`'s `workflow.nyquist_validation` is explicitly `false` [VERIFIED: .planning/config.json:24 `"nyquist_validation": false,`].

## Security Domain

`security_enforcement` is `true` in `.planning/config.json` [VERIFIED: .planning/config.json:47 `"security_enforcement": true,`], so this section is required even though the phase surface area is minimal (a read-only, client-side, mock-data dashboard with no new user input, no network calls, and no auth).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth exists anywhere in this prototype (PROJECT.md constraint); Phase 6 adds none |
| V3 Session Management | No | No sessions exist |
| V4 Access Control | No | No roles/permissions exist; the Dashboard tab is visible to anyone who can open the app, same as Pipeline/Forecast |
| V5 Input Validation | No new surface | Phase 6 introduces **no new form/input** — all 5 widgets are read-only renderings of existing `Deal[]` data. The only "input" is the existing seed-data generator's own output, which is trusted, in-process, faker-generated data, never user-supplied |
| V6 Cryptography | No | No secrets, tokens, or crypto operations involved |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| XSS via unescaped dynamic text (owner names, deal fields) rendered in chart tooltips/labels/legends | Tampering/Information Disclosure | React auto-escapes all JSX text content by default; this phase must not introduce any `dangerouslySetInnerHTML` for chart labels/tooltips (Recharts' `LabelList`/`Tooltip` render as React elements, not raw HTML, so this is a non-issue as long as no custom tooltip content formatter is built with raw HTML strings) |
| Denial-of-service via unbounded seed volume growth choking the browser's render loop | Denial of Service | Keep the raised seed volume (A6: 150) well below the `@tanstack/react-virtual` threshold CLAUDE.md flags ("hundreds/thousands") for the existing Pipeline table, which every seeded deal still flows through regardless of Dashboard-specific filtering |

No other STRIDE-relevant threat patterns apply given the phase's read-only, backend-less, single-user, mock-data nature.

## Sources

### Primary (HIGH confidence)

- `node_modules/recharts/types/chart/{RadialBarChart,FunnelChart,ComposedChart,BarChart}.d.ts`, `node_modules/recharts/types/polar/RadialBar.d.ts`, `node_modules/recharts/types/cartesian/{Funnel,Bar}.d.ts` — read directly this session to confirm component/prop existence and shape (installed recharts@3.10.1)
- `node_modules/date-fns/{eachMonthOfInterval,startOfMonth,subMonths,format,isSameMonth}.d.ts` — read directly this session to confirm function existence (installed date-fns@4.4.0)
- `node_modules/@faker-js/faker/dist/core-BMOHu6e5.d.ts` — read directly this session, lines 1499/1574, to confirm `date.between`/`date.recent` signatures (installed @faker-js/faker@10.6.0)
- `node_modules/tailwindcss/theme.css` — read directly this session for exact oklch hex-equivalent values of `GROUP_META`'s Tailwind color classes (installed tailwindcss@4.3.3)
- This repository's own source: `src/app/App.tsx`, `src/features/forecast/components/{ForecastPage,LostBreakdownChart,StatTile}.tsx`, `src/features/forecast/forecast-metrics.ts`, `src/shared/utils/{deal-metrics,line-items,pipeline-group}.ts`, `src/features/pipeline/components/{GroupSection,StageSelect}.tsx`, `src/shared/types/deal.ts`, `src/data/mock/seed-data.ts`, `src/index.css`, `package.json`, `.planning/config.json` — all read directly this session
- `dataviz` skill (this session, invoked live): `references/{choosing-a-form,color-formula,anti-patterns,marks-and-anatomy,components,palette}.md`, and `scripts/validate_palette.js` run twice for the owner categorical palette (light+dark, both PASS) and twice for the funnel ordinal ramp (light+dark, both PASS)

### Secondary (MEDIUM confidence)

- WebSearch, cross-checked against the recharts.github.io official docs pages (`examples/SimpleRadialBarChart`, `api/FunnelChart`, `api/Funnel`) — confirmed the `background`-prop gauge composition pattern and the `Funnel`+`LabelList` usage pattern; these searches corroborate what was independently verified from the installed types, they weren't the sole source

### Tertiary (LOW confidence)

None used as a basis for a stated recommendation — all package/API claims trace to either an installed-package read or an official-docs-confirming search.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all APIs verified against installed `node_modules` type declarations this session
- Architecture: HIGH — every chart pattern maps to a Recharts component confirmed present in the installed version; derived-data module shape follows an established, repeated in-repo convention (3 prior instances: `deal-metrics.ts`, `line-items.ts`, `forecast-metrics.ts`)
- Pitfalls: HIGH for `closeDate` dual-meaning and filtered-deals risks (both directly traceable to existing code/docstrings in this repo); MEDIUM for the funnel snapshot-semantics and units-definition pitfalls (correct given the data model, but the "right" business interpretation is a judgment call flagged in the Assumptions Log)

**Research date:** 2026-09-17
**Valid until:** 30 days (stable stack — no new dependencies added, existing pinned versions unlikely to drift within the project's active development window)

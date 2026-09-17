# Phase 6: Sales Dashboard - Pattern Map

**Mapped:** 2026-09-17
**Files analyzed:** 9 (7 new, 3 modified — App.tsx and index.css counted once each)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/features/dashboard/components/DashboardPage.tsx` | component (page) | request-response (store read + render) | `src/features/forecast/components/ForecastPage.tsx` | exact |
| `src/features/dashboard/components/UnitTargetGauge.tsx` | component (chart) | transform (data → SVG) | `src/features/forecast/components/LostBreakdownChart.tsx` | role-match (new chart form, same wrapper pattern) |
| `src/features/dashboard/components/TargetVsActualChart.tsx` | component (chart) | transform | `src/features/forecast/components/LostBreakdownChart.tsx` | role-match |
| `src/features/dashboard/components/OwnerLeaderboard.tsx` | component (list) | transform | `src/features/forecast/components/StatTile.tsx` (card shell) + `LostBreakdownChart.tsx` (empty-state) | role-match |
| `src/features/dashboard/components/ConversionFunnelChart.tsx` | component (chart) | transform | `src/features/forecast/components/LostBreakdownChart.tsx` | role-match |
| `src/features/dashboard/components/ClosedByOwnerChart.tsx` | component (chart) | transform | `src/features/forecast/components/LostBreakdownChart.tsx` | exact (multi-series stacked bar is a direct extension of this file's single-series `BarChart`) |
| `src/features/dashboard/dashboard-metrics.ts` | utility (derived-data module) | transform | `src/features/forecast/forecast-metrics.ts` | exact |
| `src/data/mock/seed-data.ts` (modified) | config/utility (seed generator) | batch | itself (pre-existing, modify in place) | exact |
| `src/app/App.tsx` (modified) | component (root/router-substitute) | event-driven (tab state) | itself (pre-existing, modify in place) | exact |
| `src/index.css` (modified) | config (design tokens) | — | itself (pre-existing `--chart-lost-bar`/`--chart-lost-grid` block, extend in place) | exact |

Note: `dashboard-config.ts` (mentioned in RESEARCH.md's recommended structure, holding `OWNER_ROSTER`/`MONTHLY_UNIT_TARGET`) has no direct existing analog as a standalone file — closest precedent is the constant-arrays block at the top of `seed-data.ts` (`STAGES`, `FREQUENCIES`, etc.) and the `CONFIDENCE_WEIGHT` map in `forecast-metrics.ts`. See "No Analog Found" below.

## Pattern Assignments

### `src/features/dashboard/components/DashboardPage.tsx` (component, request-response)

**Analog:** `src/features/forecast/components/ForecastPage.tsx` (full file, 58 lines — read in one pass)

**Imports pattern** (lines 1-12):
```typescript
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import {
  computeRawPipelineValue,
  computeWeightedPipelineValue,
  computeWinRate,
  computeLostByReason,
  computeLostByStage,
  bucketTopCategories,
} from "@/features/forecast/forecast-metrics";
import { StatTile } from "@/features/forecast/components/StatTile";
import { LostBreakdownChart } from "@/features/forecast/components/LostBreakdownChart";
import { ForecastBreakdownTable } from "@/features/forecast/components/ForecastBreakdownTable";
```
For Dashboard: swap to `import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";` + named imports from `@/features/dashboard/dashboard-metrics` (`computeWonUnits`, `computeMonthlyWonUnits`, `computeOwnerLeaderboard`, `computeConversionFunnel`, `computeClosedByOwnerPerMonth`) + the 5 new component imports.

**Data-integrity rule (docstring, lines 20-26) — copy verbatim in spirit:**
```typescript
/**
 * The read-only Forecast tab (FCST-01/FCST-02). Reads the store's full,
 * unfiltered `deals` array directly — never a Pipeline-tab-filtered subset
 * (this plan's data-integrity prohibition: Forecast numbers must never
 * silently reflect a forgotten search/filter). No write actions exist here
 * (D-03).
 */
export function ForecastPage() {
  const deals = usePipelineStore((s) => s.deals);
```
DashboardPage must open with an equivalent docstring citing UI-SPEC's "hard rule, not a style choice" line and call `usePipelineStore((s) => s.deals)` the same way — no prop drilling, no filtered subset.

**Page layout / heading pattern** (lines 38-57):
```tsx
return (
  <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
    <h1 className="font-heading text-lg font-semibold">Forecast</h1>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile label="Raw Pipeline Value" value={currencyFormatter.format(raw)} />
      ...
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <LostBreakdownChart title="Lost Deals by Reason" counts={...} />
      <LostBreakdownChart title="Lost Deals by Stage" counts={...} />
    </div>
    ...
  </div>
);
```
UI-SPEC's exact layout (`h1` = "Dashboard", 3 stacked `grid grid-cols-1 gap-4 lg:grid-cols-2` rows + 1 full-width row) is a direct structural copy of this container/heading/grid convention — same `mx-auto w-[95%] flex-col gap-6 px-6 py-8` shell, same `font-heading text-lg font-semibold` heading class.

**Currency formatter pattern** (lines 14-18, module scope, reuse for Leaderboard's currency values):
```typescript
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
```

---

### `src/features/dashboard/components/UnitTargetGauge.tsx`, `TargetVsActualChart.tsx`, `ConversionFunnelChart.tsx`, `ClosedByOwnerChart.tsx` (component, transform)

**Analog:** `src/features/forecast/components/LostBreakdownChart.tsx` (full file, 70 lines — read in one pass)

**Imports pattern** (line 1-2):
```typescript
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
```
Swap in whichever Recharts components each widget needs (`RadialBar`/`RadialBarChart` for the gauge; `ComposedChart`/`Line` for target-vs-actual; `FunnelChart`/`Funnel`/`LabelList` for the funnel; `Legend` for the multi-series stacked bar) — same `Card`/`CardContent` shell import for all.

**Card shell + title + empty-state branch pattern** (lines 41-69, the whole component body):
```tsx
export function LostBreakdownChart({ title, counts }: LostBreakdownChartProps) {
  const isEmpty = Object.keys(counts).length === 0;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {isEmpty ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No lost deals recorded yet — this chart fills in once a deal is marked Lost.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={toChartData(counts)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
              <XAxis dataKey="name" tick={<TruncatedTick />} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#898781", fontSize: 12 }}
                label={{ value: "Number of Lost Deals", angle: -90, position: "insideLeft", fill: "#898781", fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="var(--chart-lost-bar)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```
Every one of the 4 new chart components must follow this exact shape: `<Card><CardContent className="p-4"><h3 className="text-sm font-semibold">{title}</h3>{isEmpty ? <p className="p-8 text-center text-sm text-muted-foreground">...</p> : <ResponsiveContainer>...}</CardContent></Card>`. Empty-state copy comes verbatim from UI-SPEC's Copywriting Contract table (one string per widget). `ResponsiveContainer height` values per UI-SPEC: gauge 220, target-vs-actual 300, funnel 320, stacked-bar 300.

**`TruncatedTick` helper pattern** (lines 13-31) — reuse verbatim (import or copy) for any owner-name x-axis tick in `ClosedByOwnerChart.tsx` (UI-SPEC confirms 14-char threshold already covers the fixed roster names):
```typescript
const TICK_TRUNCATE_LENGTH = 14;

function TruncatedTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x, y, payload } = props;
  const label = payload?.value ?? "";
  const truncated =
    label.length > TICK_TRUNCATE_LENGTH ? `${label.slice(0, TICK_TRUNCATE_LENGTH)}…` : label;
  return (
    <text x={x} y={(y ?? 0) + 12} textAnchor="middle" fill="#898781" fontSize={12}>
      {truncated}
    </text>
  );
}
```

**CSS-var-driven color pattern (never hardcode hex in a `fill`/`stroke` prop):**
```tsx
<CartesianGrid strokeDasharray="3 3" stroke="var(--chart-lost-grid)" />
...
<Bar dataKey="count" fill="var(--chart-lost-bar)" radius={[4, 4, 0, 0]} />
```
New widgets use `var(--chart-gauge-fill)`, `var(--chart-gauge-track)`, `var(--chart-owner-1..5)`, `var(--chart-funnel-1..5)` per UI-SPEC's color table — same `var(--token)` convention, never inline hex.

**Multi-series stacked bar extension (`ClosedByOwnerChart.tsx` specifically)** — RESEARCH.md's Pattern 5 code block is the concrete extension of the single `<Bar>` above into 5 stacked `<Bar>`s with a shared `stackId` and a `<Legend>`, colored from `OWNER_ROSTER`'s fixed index order (never a runtime-sorted index):
```tsx
{OWNER_ROSTER.map((owner, i) => (
  <Bar key={owner} dataKey={owner} name={owner} stackId="closed" fill={OWNER_COLORS[i]} />
))}
```

**Gauge-specific composition (`UnitTargetGauge.tsx`)** — no `LostBreakdownChart`-style `BarChart`; use RESEARCH.md Pattern 1's verified `RadialBarChart`/`RadialBar` composition (semicircle `startAngle={180} endAngle={0}`, `background={{ fill: "var(--chart-gauge-track)" }}`, `fill="var(--chart-gauge-fill)"`) inside the same Card/CardContent/title/empty-state shell as above.

---

### `src/features/dashboard/components/OwnerLeaderboard.tsx` (component, transform — not a Recharts chart)

**Analog (card shell + typography):** `src/features/forecast/components/StatTile.tsx` (full file, 26 lines):
```tsx
export function StatTile({ label, value, caption }: StatTileProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums break-words">{value}</span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      </CardContent>
    </Card>
  );
}
```
Leaderboard is a `Card` with a title (`LostBreakdownChart`'s `<h3 className="text-sm font-semibold">` pattern) followed by up to 5 flex rows, each rendering `owner` (Body/regular) and `wonValue` formatted via the `currencyFormatter` from `ForecastPage.tsx` (Display tier: `text-2xl font-semibold tabular-nums` for large numeric values, per `StatTile`'s value-span class, scaled down if used per-row).

**Empty-state branch:** reuse `LostBreakdownChart.tsx`'s exact `isEmpty` ternary structure and `<p className="p-8 text-center text-sm text-muted-foreground">` pattern, with UI-SPEC's DASH-03 copy: "No Won deals yet — the leaderboard fills in once deals close."

**Rank/count badge (if used):** UI-SPEC explicitly warns against copying `GroupSection.tsx`'s pre-existing off-grid `py-0.5` badge — use `rounded-full bg-background/80 px-2 py-1 text-xs font-medium leading-none` instead if a rank badge is added.

---

### `src/features/dashboard/dashboard-metrics.ts` (utility, transform)

**Analog:** `src/features/forecast/forecast-metrics.ts` (full file, 95 lines — read in one pass)

**Module docstring + shape convention** (lines 1-9):
```typescript
import type { Deal, ConfidenceLevel, PipelineStage } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for the Forecast page
 * (FCST-01/FCST-02). Mirrors `deal-metrics.ts`'s existing module shape: no
 * side effects, no store/repository import — every function here takes a
 * `Deal[]` and returns a plain computed value, so it can be unit-tested and
 * reused independent of any Zustand selector or Pipeline-tab toolbar state.
 */
```
`dashboard-metrics.ts` opens the same way, importing `Deal`/`PipelineStage` from `@/shared/types/deal`, no store/repository import anywhere in the file — every exported function is `(deals: Deal[]) => ...`.

**Divide-by-zero guard pattern** (`computeWinRate`, lines 42-52) — apply the same style to `computeConversionFunnel`'s `pct` calc and any ratio in `dashboard-metrics.ts`:
```typescript
export function computeWinRate(deals: Deal[]): number {
  const won = deals.filter((d) => d.outcome === "won").length;
  const lost = deals.filter((d) => d.outcome === "lost").length;
  return won + lost === 0 ? 0 : won / (won + lost);
}
```

**Grouping-into-Record pattern** (`computeLostByReason`/`computeLostByStage`, lines 60-80) — same shape for `computeOwnerLeaderboard`'s intermediate map-then-array step (RESEARCH.md Pattern 3 already follows this):
```typescript
export function computeLostByStage(deals: Deal[]): Record<PipelineStage, number> {
  const counts: Record<PipelineStage, number> = { prospect: 0, lead: 0, opportunity: 0, deal: 0 };
  for (const d of deals.filter((deal) => deal.outcome === "lost")) {
    counts[d.pipelineStage] += 1;
  }
  return counts;
}
```

**Function-level JSDoc convention** — every exported function in `forecast-metrics.ts` has a doc comment stating exactly what's included/excluded and why (e.g. lines 41-47 for `computeRawPipelineValue`, lines 54-58 for `computeLostByReason`). New functions (`computeWonUnits`, `computeMonthlyWonUnits`, `computeOwnerLeaderboard`, `computeConversionFunnel`, `computeClosedByOwnerPerMonth`) must each carry an equivalent doc comment — critically, `computeWonUnits` must explicitly document that it differs from `deal-metrics.ts`'s `computeQuantity` (service-only) by summing **all** line-item types (RESEARCH.md Pitfall 4/Assumption A1).

**`computeQuantity`'s service-only filter, for contrast/reference** (`src/shared/utils/deal-metrics.ts` lines 59-63):
```typescript
export function computeQuantity(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + item.units, 0);
}
```
Do not reuse this for DASH-01/02 — write a new `computeWonUnits` per Pitfall 4 that sums `units` across every line item, scoped to `outcome === "won"` deals.

**RESEARCH.md's own code for `dashboard-metrics.ts`** (already Recharts/date-fns-verified, copy near-verbatim): see RESEARCH.md §Architecture Patterns 2-5 for `computeMonthlyWonUnits`, `computeOwnerLeaderboard`, `computeConversionFunnel`, `computeClosedByOwnerPerMonth` — all follow the `forecast-metrics.ts` conventions above (pure functions, `Deal[]` in, plain data out, JSDoc explaining scope/assumptions).

---

### `src/data/mock/seed-data.ts` (modified in place)

**Analog:** itself, current file (108 lines — read in one pass)

**Constant-roster-array pattern** (lines 15-20, extend with new `OWNER_ROSTER`):
```typescript
const STAGES: PipelineStage[] = ["prospect", "lead", "opportunity", "deal"];
const LINE_ITEM_TYPES: LineItemType[] = ["product", "service"];
const FREQUENCIES: DealFrequency[] = ["monthly", "quarterly", "quadrimestral", "semi-annual", "annually"];
```
Add `const OWNER_ROSTER = ["Priya Nair", "Marcus Webb", "Elena Torres", "Devon Clarke", "Sana Malik"];` in the same block, same `faker.helpers.arrayElement(...)` selection style used for `STAGES`/`FREQUENCIES`/`CURRENCIES` elsewhere in `buildSeedDeal` (line 36: `faker.helpers.arrayElement(STAGES)`).

**Outcome-branching pattern already established** (lines 40-41, 65, 73-77) — the exact place to extend for D-05's outcome-aware `closeDate`:
```typescript
const isLost = faker.datatype.boolean({ probability: 0.15 });
const isWon = !isLost && faker.datatype.boolean({ probability: 0.15 });
...
outcome: isLost ? "lost" : isWon ? "won" : "open",
...
contractStartDate: isWon ? faker.date.recent({ days: 60 }).toISOString().slice(0, 10) : undefined,
contractSignedDate: isWon ? faker.date.recent({ days: 90 }).toISOString().slice(0, 10) : undefined,
```
`closeDate` (currently line 63: `closeDate: faker.date.soon({ days: 90 }).toISOString()`, applied unconditionally) must become a ternary on `isLost`/`isWon` mirroring this existing `isWon ? ... : undefined` shape — per D-05/D-06, backdate lost deals across a trailing-12-month window (`faker.date.between({ from: subMonths(new Date(), 12), to: new Date() })`) while open deals keep the existing `faker.date.soon({ days: 90 })`. `contractSignedDate` for won deals should also move from `faker.date.recent({ days: 90 })` to the trailing-12-month `faker.date.between` per D-06.

**Volume constant** (line 106 `{ count: 40 }`, line 107 `Array.from({ length: 40 }, ...)`) — both occurrences must be updated together to the new seed volume (RESEARCH.md A6 recommends 150) — do not change only one branch of the `typeof faker.helpers.multiple === "function"` fallback check (lines 104-107):
```typescript
export const seedDeals: Deal[] =
  typeof faker.helpers.multiple === "function"
    ? faker.helpers.multiple(buildSeedDeal, { count: 40 })
    : Array.from({ length: 40 }, buildSeedDeal);
```

**Existing top-of-file import for date math** (line 2): `import { addMonths, format } from "date-fns";` — add `subMonths` to this same import line rather than a new import statement.

---

### `src/app/App.tsx` (modified in place)

**Analog:** itself, current file (43 lines — read in one pass)

**Tab-union-widening + third mounted container pattern** (lines 1-40, full file is the pattern):
```tsx
import { ForecastPage } from "@/features/forecast/components/ForecastPage";
...
const [tab, setTab] = useState<"pipeline" | "forecast">("pipeline");
...
<Tabs value={tab} onValueChange={(v) => setTab(v as "pipeline" | "forecast")} className="mx-auto w-[95%] pt-4">
  <TabsList>
    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
    <TabsTrigger value="forecast">Forecast</TabsTrigger>
  </TabsList>
</Tabs>
<div className={tab === "pipeline" ? "" : "hidden"}>
  <PipelineBoard />
</div>
<div className={tab === "forecast" ? "" : "hidden"}>
  <ForecastPage />
</div>
```
Add `import { DashboardPage } from "@/features/dashboard/components/DashboardPage";`, widen the union to `"pipeline" | "forecast" | "dashboard"` in both the `useState` generic and the `onValueChange` cast, add `<TabsTrigger value="dashboard">Dashboard</TabsTrigger>` after "Forecast", and append a third `<div className={tab === "dashboard" ? "" : "hidden"}><DashboardPage /></div>` after the Forecast container — same always-mounted/`hidden`-toggle pattern, no router.

---

### `src/index.css` (modified in place)

**Analog:** itself, current file (134 lines — read in one pass)

**Existing chart-token convention to extend** (`:root` lines 75-76, `.dark` lines 112-113):
```css
/* :root */
--chart-lost-bar: #2a78d6;
--chart-lost-grid: #e1e0d9;

/* .dark */
--chart-lost-bar: #3987e5;
--chart-lost-grid: #2c2c2a;
```
Add the new tokens immediately after these two existing lines in both `:root` and `.dark` blocks (same flat hex-value, no `oklch()`, no `@theme inline` registration needed — these two existing tokens are also absent from the `@theme inline` block at the top, i.e. they're consumed only via raw `var(--chart-lost-bar)` in component `fill`/`stroke` props, never via a Tailwind utility class):

```css
/* :root — add after --chart-lost-grid */
--chart-gauge-fill: #2a78d6;
--chart-gauge-track: #cde2fb;
--chart-owner-1: #2a78d6;
--chart-owner-2: #eb6834;
--chart-owner-3: #1baf7a;
--chart-owner-4: #eda100;
--chart-owner-5: #e87ba4;
--chart-funnel-1: #86b6ef;
--chart-funnel-2: #5598e7;
--chart-funnel-3: #2a78d6;
--chart-funnel-4: #1c5cab;
--chart-funnel-5: #104281;

/* .dark — add after --chart-lost-grid */
--chart-gauge-fill: #3987e5;
--chart-gauge-track: #184f95;
--chart-owner-1: #3987e5;
--chart-owner-2: #d95926;
--chart-owner-3: #199e70;
--chart-owner-4: #c98500;
--chart-owner-5: #d55181;
--chart-funnel-1: #9ec5f4;
--chart-funnel-2: #6da7ec;
--chart-funnel-3: #3987e5;
--chart-funnel-4: #256abf;
--chart-funnel-5: #184f95;
```
Values copied verbatim from UI-SPEC's Color table (already dataviz-skill-validated). Do NOT touch/reuse the generic `--chart-1..5` grayscale tokens (lines 70-74/107-111) — CONTEXT.md D-03 explicitly excludes them.

## Shared Patterns

### Card + title + empty-state wrapper
**Source:** `src/features/forecast/components/LostBreakdownChart.tsx` lines 41-69
**Apply to:** All 6 new dashboard components (5 widgets + implicitly the page's per-widget Cards)
```tsx
<Card>
  <CardContent className="p-4">
    <h3 className="text-sm font-semibold">{title}</h3>
    {isEmpty ? (
      <p className="p-8 text-center text-sm text-muted-foreground">{emptyStateCopy}</p>
    ) : (
      <ResponsiveContainer width="100%" height={heightPerUiSpec}>
        {/* chart */}
      </ResponsiveContainer>
    )}
  </CardContent>
</Card>
```

### Data-integrity: unfiltered store read
**Source:** `src/features/forecast/components/ForecastPage.tsx` lines 20-28
**Apply to:** `DashboardPage.tsx` only (the single entry point that reads the store)
```typescript
const deals = usePipelineStore((s) => s.deals);
```

### Pure derived-data module, no store import
**Source:** `src/features/forecast/forecast-metrics.ts` (whole file) and `src/shared/utils/deal-metrics.ts` (whole file)
**Apply to:** `dashboard-metrics.ts`
```typescript
import type { Deal } from "@/shared/types/deal";
// every export: (deals: Deal[]) => plain data, no side effects, no store import
```

### CSS-custom-property chart colors, never inline hex
**Source:** `src/index.css` lines 75-76/112-113, consumed in `LostBreakdownChart.tsx` lines 55/63
**Apply to:** All 4 new chart components
```tsx
stroke="var(--chart-lost-grid)"   // grid → use var(--chart-*) tokens, never hardcoded hex
fill="var(--chart-lost-bar)"
```

### Divide-by-zero guard on ratios
**Source:** `src/features/forecast/forecast-metrics.ts` lines 48-52 (`computeWinRate`)
**Apply to:** `computeConversionFunnel`'s `pct`, and the gauge's `actual/target` ratio (`Pattern 1` in RESEARCH.md already does `target === 0 ? 0 : Math.min(actual / target, 1)`)

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/features/dashboard/dashboard-config.ts` | config | — | No standalone config-module precedent exists yet; closest analogs are the top-of-file constant arrays in `seed-data.ts` (`STAGES`, `FREQUENCIES`, `CURRENCIES`) and the `CONFIDENCE_WEIGHT` map at the top of `forecast-metrics.ts` — both are same-file constants, not separate modules. Planner should follow RESEARCH.md's recommended shape directly (`OWNER_ROSTER`, `MONTHLY_UNIT_TARGET`, `TRAILING_MONTHS` as named exports) since there's no existing "constants-only module" file to imitate structurally, only the naming/typing convention (`const X: SomeType[] = [...]`, no side effects, no store import). |

## Metadata

**Analog search scope:** `src/features/forecast/`, `src/features/pipeline/components/GroupSection.tsx` (color palette reference only, not read this pass since RESEARCH.md already extracted its hex values), `src/shared/utils/deal-metrics.ts`, `src/shared/types/deal.ts`, `src/data/mock/seed-data.ts`, `src/app/App.tsx`, `src/index.css`
**Files scanned:** 8 (all read in full, single-pass, no re-reads — all ≤ 140 lines)
**Pattern extraction date:** 2026-09-17


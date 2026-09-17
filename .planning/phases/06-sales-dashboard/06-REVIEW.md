---
phase: 06-sales-dashboard
reviewed: 2026-09-17T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - src/app/App.tsx
  - src/data/mock/seed-data.test.ts
  - src/data/mock/seed-data.ts
  - src/features/dashboard/components/ClosedByOwnerChart.tsx
  - src/features/dashboard/components/ConversionFunnelChart.tsx
  - src/features/dashboard/components/DashboardPage.tsx
  - src/features/dashboard/components/OwnerLeaderboard.tsx
  - src/features/dashboard/components/TargetVsActualChart.tsx
  - src/features/dashboard/components/UnitTargetGauge.tsx
  - src/features/dashboard/dashboard-config.ts
  - src/features/dashboard/dashboard-metrics.test.ts
  - src/features/dashboard/dashboard-metrics.ts
  - src/index.css
findings:
  critical: 2
  warning: 1
  info: 2
  total: 5
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-09-17
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed the Sales Dashboard feature (5 widgets, their shared metrics module, config, seed data, and supporting CSS). The `dashboard-metrics.ts` unit-test coverage is unusually thorough for the documented "fixed roster / zero-seeded buckets" invariants, but two of those invariants are actually violated at runtime because the widgets' data-generation code assumes a closed world (`Deal.owner ∈ OWNER_ROSTER`) that the rest of the app does not enforce — `owner` is a free-text field everywhere else (`AddDealDialog`, `EditableCell`). Separately, `UnitTargetGauge`'s `RadialBarChart` is missing an explicit angle-axis domain, which — traced through the installed `recharts@3.10.1` source — causes the gauge ring to always render fully filled regardless of the actual percentage, defeating the widget's entire purpose. A third, narrower issue: two of the metrics functions parse a date-only `contractSignedDate` string with the native `Date` constructor before formatting with local-timezone-aware `date-fns format`, which can misattribute a deal signed on the 1st of a month into the previous month's bucket for users in negative-UTC-offset timezones — notable because the test suite's own comments show the author already knows about and avoids this exact pitfall on the *generation* side, but the *consumption* side in `dashboard-metrics.ts` still has it.

## Critical Issues

### CR-01: `UnitTargetGauge`'s radial gauge always renders as 100% full, regardless of actual progress

**File:** `src/features/dashboard/components/UnitTargetGauge.tsx:36-51`
**Issue:**
`RadialBarChart` is rendered with a single data point (`data = [{ name: "units", value: computeUnitTargetPct(actual, target) * 100 }]`) and no `PolarAngleAxis` (so no explicit `domain`). Traced through the installed `recharts@3.10.1` source (`node_modules/recharts/es6/state/selectors/polarAxisSelectors.js` + `axisSelectors.js`):
- With no `PolarAngleAxis` element, Recharts falls back to `implicitAngleAxis`, whose `domain` is `undefined`.
- `getDomainDefinition` (`axisSelectors.js:532-549`) resolves that to `defaultNumericDomain = [0, 'auto']`.
- The `'auto'` upper bound is then resolved from the chart's own data — i.e., `dataMax` of the single `value` field supplied.
- Since there is exactly one data point, `dataMax === value`, so the domain always ends up `[0, value]`. The `RadialBar`'s value is therefore always mapped to the domain's maximum, so the arc is always drawn at 100% of the `startAngle`(180°)→`endAngle`(0°) sweep — **the ring always looks full**, whether the deal is at 5% of target or 100% of target.

This is DASH-01, the first widget documented as the phase's "tracer slice" — its core visual (the gauge fill) is non-functional; only the text underneath (`{actual} / {target} units`) is correct.

**Fix:** Pin the angle-axis domain explicitly to `[0, 100]` since `value` is already a 0-100 percentage:
```tsx
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
// ...
<RadialBarChart data={data} startAngle={180} endAngle={0} innerRadius="70%" outerRadius="100%">
  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
  <RadialBar
    dataKey="value"
    background={{ fill: "var(--chart-gauge-track)" }}
    fill="var(--chart-gauge-fill)"
    cornerRadius={6}
  />
</RadialBarChart>
```

### CR-02: Owner-keyed dashboard metrics silently break for any deal whose `owner` isn't one of the 5 hardcoded `OWNER_ROSTER` names — and `owner` is free text everywhere else in the app

**File:** `src/features/dashboard/dashboard-metrics.ts:102-113` (`computeOwnerLeaderboard`), `src/features/dashboard/dashboard-metrics.ts:186-214` (`computeClosedByOwnerPerMonth`)
**Issue:**
`dashboard-config.ts`'s doc comment claims `OWNER_ROSTER` is "the sole owner-identity source for `Deal.owner`" and that seed data's old random-name generator was "removed entirely, not kept as a fallback." That's true for seed data (`seed-data.ts:72` draws only from `OWNER_ROSTER`), but it is **not** enforced anywhere else:
- `AddDealDialog.tsx:169-179` renders `owner` as a plain free-text `<Input>` (no `<Select>` bound to `OWNER_ROSTER`).
- `EditableCell.tsx:13` lists `"owner"` as an inline-editable free-text column.
- `pipelineStore.ts` performs no validation/normalization of `owner` against the roster on add or edit.

So a user can create or rename a deal to any owner string (typo, new hire, blank, whitespace-padded name, etc.), and outcome is `won`/`lost`. Two different, inconsistent failure modes result:

1. **`computeOwnerLeaderboard`** (line 102-113): `totals` is a `Map` pre-seeded with only the 5 roster names, but `totals.set(d.owner, ...)` (line 107) happily inserts a **new** key for any unrecognized owner. The function's own doc comment (lines 94-101) and every test (`dashboard-metrics.test.ts:187-226`) assert "always exactly 5 entries" — that invariant is violated the moment a non-roster owner wins a deal, and `OwnerLeaderboard.tsx` will silently render a 6th (or Nth) row.
2. **`computeClosedByOwnerPerMonth`** (line 186-214): buckets are pre-seeded only with the `owners` param's keys (line 200: `for (const owner of owners) row[owner] = 0;`), but line 210 (`bucket[deal.owner] = (Number(bucket[deal.owner]) || 0) + 1;`) writes to `bucket[deal.owner]` unconditionally. For an unrecognized owner this adds a stray property to the row object that **no `<Bar dataKey={owner}>` in `ClosedByOwnerChart.tsx:42-44` will ever render** (that component only iterates the fixed `owners` prop) — the deal is silently dropped from the chart entirely, even though `hasClosedDeals` (`DashboardPage.tsx:50`) will still report `true` and render the full chart shell, misleadingly showing "0 everywhere" despite real closed deals existing.
3. Sharper edge case: if an owner's free-text name happens to be `"key"` or `"month"`, line 210's write (`bucket[deal.owner] = ...`) overwrites the row's `key`/`month` bookkeeping fields used for `<XAxis dataKey="month">` and the `byKey` lookup, corrupting the rendered x-axis label for that bucket.

**Fix:** Either (a) constrain `owner` entry/edit to `OWNER_ROSTER` app-wide (turn `AddDealDialog`'s owner field into a `<Select>` and remove `"owner"` from `EditableCell`'s free-text columns, matching the "sole identity source" contract dashboard-config.ts already claims), or (b) make the aggregation functions defensive — e.g. skip/aggregate-into-"Other" any `deal.owner` not present in the roster, instead of silently leaking or dropping it:
```ts
for (const d of deals) {
  if (d.outcome !== "won") continue;
  if (!totals.has(d.owner)) continue; // or bucket into an "Other" row
  totals.set(d.owner, (totals.get(d.owner) ?? 0) + d.value);
}
```

## Warnings

### WR-01: `contractSignedDate` bucketing can land in the wrong month depending on the viewer's timezone

**File:** `src/features/dashboard/dashboard-metrics.ts:86` (`computeMonthlyWonUnits`), `src/features/dashboard/dashboard-metrics.ts:209` (`computeClosedByOwnerPerMonth`)
**Issue:**
`contractSignedDate` is stored as a date-only string (`seed-data.ts:99`: `.toISOString().slice(0, 10)`, e.g. `"2026-02-01"`). Both consuming functions do `format(new Date(deal.contractSignedDate), "yyyy-MM")`. Per the ECMA-262 spec, `new Date("2026-02-01")` (a date-only ISO string with no time/offset) is parsed as **UTC midnight**, but `date-fns`'s `format` reads calendar fields using the **local** timezone. For any viewer in a negative-UTC-offset timezone (all of North/South America, etc.), UTC midnight on the 1st of a month rolls back to the last local day of the *previous* month, so `format(..., "yyyy-MM")` returns the wrong (earlier) month — misattributing that deal's units/count to the prior month's bucket in both the `TargetVsActualChart` (DASH-02) and `ClosedByOwnerChart` (DASH-05).

Notably, `dashboard-metrics.test.ts:167-177`'s own comment explicitly documents this exact UTC-vs-local pitfall and deliberately avoids it *when generating* the test's `contractSignedDate` (using `format(threeMonthsAgo, "yyyy-MM-dd")` instead of `.toISOString().slice(0, 10)`) — but the production *read* path in `dashboard-metrics.ts` still uses the vulnerable `new Date(dateOnlyString)` pattern, so the pitfall is only worked around in the test fixture, not fixed in the code under test.

Note: this does **not** affect `closeDate` bucketing for Lost deals (`computeClosedByOwnerPerMonth`'s other branch), since `closeDate` is stored as a full ISO datetime, not a date-only string.

**Fix:** Use `date-fns`'s `parseISO`, which interprets a date-only ISO string as local midnight instead of UTC midnight:
```ts
import { parseISO } from "date-fns";
// ...
const bucket = byKey.get(format(parseISO(deal.contractSignedDate), "yyyy-MM"));
```

## Info

### IN-01: Unused CSS custom properties `--chart-1` through `--chart-5`

**File:** `src/index.css:19-23,70-74,119-123`
**Issue:** `--color-chart-1..5` are wired into the `@theme inline` block and `--chart-1..5` are defined in both `:root` and `.dark`, but nothing in `src/` references `chart-1`/`chart-2`/.../`chart-5` (the Phase 6 widgets all use the newer `--chart-owner-*`, `--chart-funnel-*`, `--chart-gauge-*`, `--chart-lost-*` variables instead).
**Fix:** Remove the unused `--chart-1..5` declarations (and their `@theme inline` mappings) if nothing else in the broader app depends on them, or leave a comment noting they're reserved for a future generic chart palette.

### IN-02: Duplicated "won deals" filter in `DashboardPage`

**File:** `src/features/dashboard/components/DashboardPage.tsx:28-29`
**Issue:** `DashboardPage` computes `wonDeals = deals.filter((d) => d.outcome === "won")` for `wonDealCount`, while `computeWonUnits(deals)` (passed as `actual` on the same line) independently re-filters the same array for the same predicate inside `dashboard-metrics.ts:26-27`. Not a bug, but the "won" predicate now exists in two places that must be kept in sync.
**Fix:** Consider exposing a `computeWonDealCount(deals)` helper (or having `UnitTargetGauge` accept `deals` and derive both figures internally) so the "is this deal Won" predicate has one authoritative implementation.

---

_Reviewed: 2026-09-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

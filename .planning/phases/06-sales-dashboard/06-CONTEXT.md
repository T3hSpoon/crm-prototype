# Phase 6: Sales Dashboard - Context

**Gathered:** 2026-09-17
**Status:** Ready for planning

<domain>
## Phase Boundary

A new "Dashboard" tab (alongside existing Pipeline and Forecast tabs) presenting 5 sales-management widgets, all derived from existing/extended mock deal data — no new backend, API, auth, or persistence layer:

1. Unit Sales Target gauge (DASH-01)
2. Target vs. Actual Sales chart, by close date over full closed-deal history (DASH-02)
3. Owner Leaderboard by total Won deal value (DASH-03)
4. Stage Conversion Rate funnel, Prospect → Lead → Opportunity → Deal → Won (DASH-04)
5. Stacked bar of deals closed per period, segmented by owner (DASH-05)

Requirements DASH-01 through DASH-05 are defined in `.planning/REQUIREMENTS.md` with an explicit Out-of-Scope table (activity tracker widget, average-revenue tile, user-editable targets, late-funnel-only conversion view, lead-source dimension, pixel-exact monday.com match — all excluded). This discussion covers HOW to implement, not whether.

</domain>

<decisions>
## Implementation Decisions

### Sales Rep Roster & Data Volume
- **D-01:** Introduce a fixed roster of 5 named sales reps in the seed-data generator, replacing the current per-deal `faker.person.fullName()` (which produces a fresh random name per seeded deal with no stable "team"). Each seeded deal's `owner` is assigned from this fixed list instead. — **Reversibility:** costly — **Rationale:** downstream widgets (Leaderboard, stacked-bar-by-owner) and any derived-data code start assuming a small closed set of owner values; reverting to fully random names later would require re-touching that logic, not just the seed generator.
- **D-02:** Increase total seed volume beyond the current 40 deals so each of the 5 reps has a credible spread across won/lost/open outcomes (current 40-deal set yields only ~6 won, ~6 lost total). Exact count left to planning/research — the criterion is "each rep has enough won deals to be visible on the Leaderboard and enough closed deals to populate the stacked bar across periods."
- **D-03:** Owner-based charts (stacked-bar-by-owner) get a **new categorical color palette** (new CSS chart-color tokens, e.g. `--chart-owner-1..5`), sized to the 5-rep roster — distinct from the existing stage-based `GROUP_META` Tailwind palette (`src/features/pipeline/components/GroupSection.tsx`) so owner-colored and stage-colored charts aren't visually confused. The generic unused `--chart-1..5` grayscale tokens in `src/index.css` are not reused for this — new tokens should be added following the same CSS-custom-property + light/dark convention as `--chart-lost-bar`/`--chart-lost-grid`.

### Historical Close-Date Data
- **D-04:** Won deals use their existing `contractSignedDate` (already seeded independently, last 60-90 days) as the "closed" date for the Target-vs-Actual chart and the stacked-bar-by-period. No new field added for won deals.
- **D-05:** Lost deals reuse the existing `closeDate` field as their "closed" date — **not** a new `lostDate` field. This requires outcome-aware seeding: `closeDate` stays forward-looking (`faker.date.soon`, 0-90 days ahead) for **open** deals only, and is backdated to a realistic historical spread for **lost** deals. — **Reversibility:** costly — **Rationale:** `closeDate`'s meaning becomes outcome-dependent ("expected close" for open deals vs. "when it actually closed" for lost deals) instead of a single consistent meaning across all deals; any future code that reads `closeDate` assuming it's always forward-looking (or always one meaning) needs to account for this split. Planner/researcher should document this dual meaning clearly at the seed-data source and wherever `closeDate` is consumed for Phase 6 widgets.
- **D-06:** The historical spread used for won-deal `contractSignedDate` and backdated lost-deal `closeDate` should span a **trailing 12 months**, giving the Target-vs-Actual chart and stacked-bar-by-period enough periods (e.g., monthly buckets) to show a real trend — matches DASH-02's "across the full closed-deal history" wording better than the current ~90-day contract-date range.

### Claude's Discretion
- **Exact seed volume** (D-02) — pick a number during planning that makes all 5 widgets look populated without being obviously inflated; verify each rep has ≥1 won deal.
- **Sales target definition** (where the mock target value/config lives, what period it represents — monthly/quarterly/annual) — this gray area was identified during analysis but not discussed; user did not weigh in. Needs a reasonable default during planning (likely a small constant/config alongside the new `dashboard-metrics.ts` module), consistent with D-06's trailing-12-month time range.
- **Gauge widget visual style** (radial/donut vs. horizontal progress bar for DASH-01) — also identified but not discussed. No existing precedent in the codebase (`StatTile` is a flat card, no gauge/progress component exists anywhere in `src`). Left to research/planning to pick a style consistent with the existing card-based widget aesthetic.
- **Time-bucket granularity** for DASH-02/DASH-05 (weekly vs. monthly) — not explicitly discussed; monthly is implied by the trailing-12-month range (D-06) but the exact bucketing is left to planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Scope
- `.planning/REQUIREMENTS.md` — DASH-01 through DASH-05 definitions, and the Out-of-Scope table (activity tracker, avg-revenue tile, editable targets, late-funnel-only view, lead-source dimension, pixel-exact match — all excluded)
- `.planning/ROADMAP.md` §"Phase 6: Sales Dashboard" — goal, success criteria, depends-on Phase 5
- `.planning/PROJECT.md` §"Current Milestone: v1.2 Sales Dashboard" — target features list, monday.com reference framing ("concept inspiration only, not a visual target")

No external ADRs or specs were referenced during this discussion — no `*-SPEC.md` exists for Phase 6.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/App.tsx` — tab switching is a local `useState<"pipeline" | "forecast">` driving shadcn `Tabs`; both pages stay mounted, visibility toggled via `hidden` class. Adding "Dashboard" is a third `TabsTrigger` + widened union type + third always-mounted container.
- `src/features/forecast/components/LostBreakdownChart.tsx` — reference implementation for a Recharts `BarChart` in `ResponsiveContainer`, CSS-custom-property-driven colors (light/dark automatic), `TruncatedTick` for long x-axis labels, empty-state placeholder pattern.
- `src/features/forecast/components/StatTile.tsx` — flat Card-based stat tile (label/value/caption). No gauge/progress precedent exists — DASH-01's gauge will be a net-new component.
- `src/features/forecast/forecast-metrics.ts` / `src/shared/utils/deal-metrics.ts` — established convention for derived-data modules: pure functions only, no store import, colocated `*.test.ts`. A Dashboard equivalent should follow the same shape, likely `src/features/dashboard/dashboard-metrics.ts`.
- `src/features/pipeline/components/GroupSection.tsx` `GROUP_META` — the app's only existing stage-color system (Tailwind classes, not CSS vars/hex) — source of truth for the conversion funnel's stage coloring (DASH-04); will need translating to hex/CSS-var form for Recharts `fill` props.

### Established Patterns
- `src/features/forecast/components/ForecastPage.tsx` — page layout convention: `mx-auto w-[95%]` container, `font-heading text-lg font-semibold` heading, grid of stat tiles then grid of charts; reads the full unfiltered `deals` from the store directly (explicit data-integrity rule — never a Pipeline-tab-filtered subset).
- `src/shared/types/deal.ts` — `pipelineStage` (4 values) and `outcome` (`open`/`won`/`lost`) are separate fields, combined into 6-value `PipelineGroup` via `toPipelineGroup()` (`src/shared/utils/pipeline-group.ts`). The conversion funnel (DASH-04) should walk `PipelineGroup` to capture Won/Lost as funnel terminals, not `pipelineStage` alone.
- `src/data/mock/seed-data.ts` — current seed: 40 deals, `owner: faker.person.fullName()` (line ~62), `closeDate: faker.date.soon({ days: 90 })` (line ~63) applied uniformly regardless of outcome, won-only `contractStartDate`/`contractSignedDate`/`contractEndDate` seeded independently in the last 60-90 days (lines ~73-77). This is the file that needs the D-01/D-02/D-05/D-06 changes.

### Integration Points
- New `src/features/dashboard/` feature directory (mirroring `src/features/forecast/`) — page component, chart components, `dashboard-metrics.ts`.
- `src/data/mock/seed-data.ts` — outcome-aware `closeDate` seeding, fixed rep roster, increased volume.
- `src/shared/types/deal.ts` — no new fields needed per D-04/D-05 (reuses `contractSignedDate` and `closeDate`); confirm during planning that no type changes are actually required.
- `src/index.css` — new `--chart-owner-1..5` (or similar) categorical tokens, light/dark variants, alongside existing `--chart-lost-bar`/`--chart-lost-grid`.

</code_context>

<specifics>
## Specific Ideas

No particular visual references beyond the monday.com sales-dashboard inspiration already captured in PROJECT.md (concept inspiration only, not pixel target — see canonical refs).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Two identified gray areas (sales target definition, gauge visual style) were not discussed by user choice and are captured under "Claude's Discretion" above rather than deferred to a future phase — they're still in-scope for Phase 6, just left to planning.

</deferred>

---

*Phase: 6-Sales Dashboard*
*Context gathered: 2026-09-17*

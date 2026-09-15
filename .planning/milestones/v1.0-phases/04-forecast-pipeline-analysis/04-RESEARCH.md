# Phase 4: Forecast & Pipeline Analysis - Research

**Researched:** 2026-09-15
**Domain:** Client-side table sort/filter/search (TanStack Table v9 `/legacy` compat) + derived-value forecasting/charting (Recharts) in a frontend-only React/Zustand prototype
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Navigation between the Pipeline board and the new Forecast page is a simple local view-state tab/toggle (no router) — top-level tabs ("Pipeline" / "Forecast") replace App.tsx's current bare "Pipeline" header, reusing PipelineBoard's existing 95%-width page shell/padding so the Forecast page reads as a sibling view, not a different app. No new routing dependency.
- **D-02:** Switching tabs preserves Pipeline board state (search/filter/sort query, expanded line-item rows) — the Pipeline board does not remount/reset when the user visits Forecast and comes back. Implementation detail (state lives in the store vs. staying mounted-but-hidden) is planner's call.
- **D-03:** The Forecast page has no "Add Deal" button — it is read-only analysis.
- **D-04:** Search/filter/sort operate **within** each of the 6 existing per-group tables (Prospect/Lead/Opportunity/Deal/Won/Lost), not by flattening the board into one single table. A search/filter hides non-matching rows inside every group's own `DealTable`; a group can end up empty and shows its existing empty-state copy.
- **D-05:** Search input and filter controls live in **one shared toolbar** in `PipelineBoard`'s header row (next to "Add Deal"), not per-group. The resulting query/filter state is passed down into every `GroupSection`/`DealTable` so all 6 groups filter in sync from one place.
- **D-06:** PIPE-05's "filter by stage" is implemented as a **group-visibility toggle** — a multi-select control (checkboxes/pills for Prospect/Lead/Opportunity/Deal/Won/Lost) that shows/hides entire `GroupSection` blocks. It does not change what group a deal displays under; it only controls which of the 6 sections are currently rendered.
- **D-07:** Sorting (PIPE-06: value/close date/owner) is triggered via **clickable column headers** in each group's table — click Value/Close Date/Owner to sort ascending, click again for descending, with an arrow indicator. The same sort column/direction applies to all 6 group tables at once, driven from the shared toolbar/state (not independent per-group sort state). `DealTable.tsx`'s own comment confirms this table was left deliberately unwired for exactly this phase to add `getSortedRowModel`/`getFilteredRowModel` from the same `/legacy` compat subpath.
- **D-08:** "Raw pipeline value" (FCST-01) sums `Deal.value` across **open deals only** (`outcome === "open"`, i.e. Prospect/Lead/Opportunity/Deal) — excludes Won and Lost.
- **D-09:** "Weighted/projected value" = Σ (`deal.value` × confidence weight) over the same open-deals scope as D-08, using the already-locked Confidence Level → weight mapping from STATE.md (2026-09-10): 100%→1.0, 80%→0.8, 50%→0.5, Open to RFP Bids→0.0. Not being re-litigated — treat as decided.
- **D-10:** "Win rate" = `won / (won + lost)` — still-open deals excluded from both numerator and denominator.
- **D-11:** FCST-02's lost-deal breakdown (by reason and by stage) is displayed as **Recharts bar charts** — `recharts` (not yet installed) is added as a new dependency this phase. The Forecast page also shows simple stat tiles for raw pipeline value, weighted value, and win rate alongside the two bar charts.
- **D-12:** Phase 4 fixes CR-01 (`03.1-REVIEW.md`): `moveStage`, `moveToLost`, and `moveToWon` currently leave the opposing terminal state's fields stale when a deal transitions away from Lost or Won. This phase clears `lostReason` on any move to a non-lost group, and clears `contractStartDate`/`contractEndDate`/`contractSignedDate`/`paymentTerms` on any move to a non-won group.
- **D-13:** The clearing logic is **centralized in one place** — a small helper (planner's call on exact location/name, e.g. alongside `fromPipelineGroup` in `src/shared/utils/pipeline-group.ts`) that returns the correct clear-patch for a given target group. `moveStage`, `moveToLost`, and `moveToWon` in `pipelineStore.ts` all call it.

### Claude's Discretion

- Exact implementation of "Pipeline board state preserved across tab switches" (D-02) — new Zustand slice, lifted local state, or Pipeline board staying mounted (hidden via CSS) while Forecast is active. Pick whichever is simplest given how the toolbar state (D-05) ends up being structured.
- Exact shape/location of the search/filter state (single object vs. several `useState`s, whether it lives in `pipelineStore.ts` or a new hook) — follow the existing selector-hook convention (`usePipelineGroups.ts`) if it fits naturally.
- Exact Recharts chart types/styling beyond "bar charts" for the lost-by-reason/lost-by-stage breakdown, and the exact stat-tile layout for pipeline value/weighted value/win rate — follow the project's existing "own visual identity, not a monday.com clone" convention.
- Exact helper name/location for D-13's clear-patch logic — `fromPipelineGroup` in `src/shared/utils/pipeline-group.ts` is the natural home; planner may choose otherwise if a cleaner shape emerges.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No scope-creep suggestions came up.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-04 | User can search deals by name/company across the pipeline table | TanStack `/legacy` global filter (`globalFilter` state + `includesString` filter fn) confirmed present in installed package; see Architecture Patterns Pattern 1 |
| PIPE-05 | User can filter the pipeline table by owner, value, stage, or close date | Owner/value/close-date via TanStack column filters (`equalsString`/`inNumberRange`/`inDateRange` built-in filter fns, confirmed in installed package); stage via D-06's group-visibility toggle (no table filter fn involved) |
| PIPE-06 | User can sort the pipeline table by column (value, close date, owner) | TanStack `/legacy` `getSortedRowModel` + clickable header handlers (`column.getToggleSortingHandler()`), confirmed present in installed package |
| FCST-01 | Forecast page: raw pipeline value, weighted/projected value, win rate | New pure derived-value module mirroring `deal-metrics.ts`'s existing pattern; formulas locked by D-08/D-09/D-10 |
| FCST-02 | Forecast page: lost-deal breakdown by reason and by stage | Same derived-value module groups by `lostReason` category prefix and by `pipelineStage`; rendered via Recharts `BarChart` (D-11); depends on D-12/D-13's stale-field fix for clean `lostReason`/stage data |
</phase_requirements>

## Summary

This phase adds two independent capabilities to an existing, working pipeline board: (1) client-side search/filter/sort on the 6 per-group `DealTable` instances, and (2) a new read-only Forecast page with stat tiles and two bar charts. Both are pure frontend, in-memory-array operations — there is no backend, no network request, and no new data-fetching concern. The codebase already anticipated this phase: `DealTable.tsx` intentionally ships with `getCoreRowModel()` only, and its own comment names the exact `/legacy`-subpath APIs (`getSortedRowModel`, `getFilteredRowModel`) this phase should add. Reading the installed `@tanstack/react-table@9.2.3` package directly confirms both stub functions exist under `/legacy`, along with a full v8-style `filterFns` registry (`includesString`, `inNumberRange`, `inDateRange`, `equalsString`, `arrIncludesSome`, etc.) and `sortFns` registry — so PIPE-04/05/06 need no new dependency, only wiring already-shipped APIs.

The forecast calculations (FCST-01/02) are pure functions over the store's flat `Deal[]` array, following the exact pattern already established by `src/shared/utils/deal-metrics.ts` (no store/repository imports, no stored derived fields). The only genuinely new dependency is `recharts` (confirmed OK by the package-legitimacy gate, 40M+ weekly downloads, actively maintained, React 19 peer-compatible) for the two required bar charts. One data-integrity prerequisite (D-12/D-13, tracked since Phase 3.1 as CR-01) must be fixed first: `moveStage`/`moveToLost`/`moveToWon` currently leave stale `lostReason`/contract-term fields on a deal after it transitions away from Lost/Won, which would corrupt FCST-02's lost-by-reason/lost-by-stage counts if left unfixed.

**Primary recommendation:** Wire `getSortedRowModel`/`getFilteredRowModel` into `DealTable.tsx` from the same `/legacy` subpath already in use, lift sort/filter/search state into one shared object passed as controlled TanStack state to all 6 `DealTable` instances, fix CR-01 via one centralized clear-patch helper before touching forecast math, then build a new `src/features/forecast/` area with a pure `forecast-metrics.ts` module and Recharts-based `ForecastPage`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Search/filter/sort UI + state (PIPE-04/05/06) | Browser / Client (React component state + TanStack Table client-side row models) | — | No backend exists in this prototype; all rows already live in memory via Zustand, so filtering/sorting is a pure client computation over data already present |
| Group-visibility toggle (D-06, stage filter) | Browser / Client (local/shared UI state in `PipelineBoard`) | — | Purely a rendering decision (which `GroupSection` blocks mount) — does not touch `Deal` data |
| Forecast calculations: pipeline value, weighted value, win rate, lost breakdown (FCST-01/02) | Browser / Client (pure derived-value functions reading Zustand's `deals` array) | — | Mirrors `deal-metrics.ts`'s existing convention: derived values are never persisted, always computed at render/selector time from the same in-memory `Deal[]` |
| CR-01 stale-field clearing (D-12/D-13) | Browser / Client (Zustand store actions + a pure helper) | — | Existing write seam (`pipelineStore.ts` actions → `dealsRepository`) already lives entirely client-side; the fix is additive logic inside that same seam, no new tier introduced |
| Chart rendering (FCST-02) | Browser / Client (Recharts, SVG rendered in-browser) | — | Recharts renders to SVG client-side; no server-side rendering concern in this Vite SPA |
| Tab navigation (D-01) | Browser / Client (local view-state, no router) | — | Explicitly no routing tier this phase per CLAUDE.md's "zero routing needs" framing and CONTEXT.md D-01 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-table` | `^9.2.3` (already installed) | Sorting/filtering row models for the pipeline table | Already the project's table library (Phase 1); the `/legacy` compat subpath this codebase already uses ships `getSortedRowModel`/`getFilteredRowModel` as documented v8-compat stub markers — `[VERIFIED: node_modules/@tanstack/react-table/dist/legacy.d.ts:1]` re-exports `getFilteredRowModel, getGroupedRowModel, getPaginationRowModel, getSortedRowModel` from `useLegacyTable.js`, and `[VERIFIED: node_modules/@tanstack/react-table/dist/useLegacyTable.d.ts:10-17]` declares both as "stub function for v8 API compatibility... marker to enable the sorted/filtered row model" |
| `recharts` | `^3.10.1` | Forecast page bar charts (lost-by-reason, lost-by-stage) | Confirmed on npm registry this session (`npm view recharts version` → `3.10.1`) and passed the package-legitimacy gate with `OK` verdict — `[VERIFIED: npm registry, package-legitimacy gate]`: 40,450,594 weekly downloads, published 2026-07-25, repo `github.com/recharts/recharts`, no postinstall script, not deprecated. Peer deps confirmed via `npm view recharts peerDependencies`: `react: "^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0"` — compatible with installed `react@^19.2.8` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | `^4.4.0` (already installed) | Close-date range filtering, any date-bucket logic for the forecast page | `parseISO`/`isWithinInterval` for evaluating a close-date range filter client-side; already used in `seed-data.ts` for `addMonths`/`format` — same import convention |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack `/legacy` `getFilteredRowModel`/`getSortedRowModel` | Hand-rolled `Array.prototype.filter`/`.sort()` on the pre-partitioned `deals` array before it reaches `DealTable` | Loses TanStack's built-in header-click sort-direction cycling, filter-fn registry, and `column.getToggleSortingHandler()`/`getIsSorted()` helpers that already exist in the installed package for free — no reason to reinvent them for this phase |
| Recharts `BarChart` | A hand-rolled SVG/CSS bar chart | CLAUDE.md's locked stack already recommends Recharts for exactly this use case (forecast/analytics charts); hand-rolling duplicates axis/tooltip/responsive-container behavior Recharts ships out of the box |

**Installation:**
```bash
npm install recharts
```

**Version verification:** Confirmed this session via `npm view recharts version` → `3.10.1`, published 2026-07-25 (`npm view recharts time.3.10.1` implied by package-legitimacy gate's `publishedAt` signal). No `@tanstack/react-table` or `date-fns` version bump needed — both already installed and already contain the APIs this phase uses (confirmed by reading `node_modules` directly, not by re-installing).

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| recharts | npm | latest 3.10.1 published 2026-07-25; package itself is long-established (Recharts has shipped majors since ~2015) | 40,450,594/wk | github.com/recharts/recharts | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

recharts is not merely a WebSearch/training-data guess — it was named in this project's own `CLAUDE.md` Technology Stack (locked project instructions), then independently confirmed this session via `npm view recharts version`/`peerDependencies` and the `package-legitimacy check` seam (`OK` verdict, real download count, real source repo). Tagged `[VERIFIED: npm registry, package-legitimacy gate]`, not `[ASSUMED]`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────── Browser (single SPA, no backend) ───────────────────────────────┐
│                                                                                                    │
│  App.tsx (tab state: "pipeline" | "forecast", D-01)                                               │
│   ├── Pipeline tab ─────────────────────────────────────────────────────────────┐                 │
│   │                                                                              │                 │
│   │   PipelineBoard.tsx                                                         │                 │
│   │    ├── Shared toolbar (search input, owner/value/closeDate filter          │                 │
│   │    │    controls, group-visibility toggle) ── D-05                         │                 │
│   │    │        │ produces: { searchQuery, columnFilters, sorting,             │                 │
│   │    │        │             visibleGroups }                                  │                 │
│   │    │        ▼                                                              │                 │
│   │    ├── GROUPS.filter(visibleGroups) ── D-06 (group-visibility toggle)      │                 │
│   │    │        │                                                              │                 │
│   │    │        ▼                                                              │                 │
│   │    └── GroupSection × N (one per visible group)                            │                 │
│   │             │  deals = usePipelineGroups()[group]  (pre-partitioned,        │                 │
│   │             │  unchanged from Phase 1)                                      │                 │
│   │             ▼                                                              │                 │
│   │         DealTable.tsx (useLegacyTable, controlled state:                   │                 │
│   │             state: { sorting, globalFilter, columnFilters } ── D-07/D-04   │                 │
│   │             getSortedRowModel() / getFilteredRowModel() — NEW this phase)  │                 │
│   │                                                                              │                 │
│   └──────────────────────────────────────────────────────────────────────────────┘                │
│                                                                                                    │
│   ├── Forecast tab (D-03: read-only, no Add Deal) ───────────────────────────────┐                │
│   │                                                                               │                │
│   │   ForecastPage.tsx (src/features/forecast/)                                  │                │
│   │        │  reads: usePipelineStore((s) => s.deals)                            │                │
│   │        ▼                                                                     │                │
│   │   forecast-metrics.ts (pure functions, no store import — mirrors             │                │
│   │        deal-metrics.ts's pattern)                                            │                │
│   │        ├── computeRawPipelineValue(deals)      → D-08                        │                │
│   │        ├── computeWeightedPipelineValue(deals) → D-09                        │                │
│   │        ├── computeWinRate(deals)               → D-10                        │                │
│   │        ├── computeLostByReason(deals)           → FCST-02                    │                │
│   │        └── computeLostByStage(deals)            → FCST-02                    │                │
│   │        ▼                                                                     │                │
│   │   Stat tiles (raw value / weighted value / win rate) + 2× Recharts           │                │
│   │   BarChart (lost-by-reason, lost-by-stage)                                   │                │
│   └────────────────────────────────────────────────────────────────────────────────┘              │
│                                                                                                    │
│  usePipelineStore (Zustand) — single source of `deals`, unchanged surface except:                │
│   moveStage / moveToLost / moveToWon now call a centralized clear-patch helper (D-12/D-13)        │
│   before dealsRepository.update() — prerequisite for clean FCST-02 data                           │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   └── App.tsx                       # add tab state (D-01), render Pipeline|Forecast
├── features/
│   ├── pipeline/
│   │   ├── components/
│   │   │   ├── PipelineBoard.tsx     # add shared toolbar (D-05), group-visibility toggle (D-06)
│   │   │   ├── PipelineToolbar.tsx   # NEW — search input + owner/value/closeDate filter controls
│   │   │   └── DealTable.tsx         # add getSortedRowModel/getFilteredRowModel (D-07)
│   │   ├── hooks/
│   │   │   └── usePipelineGroups.ts  # unchanged — group-visibility filtering happens above this hook
│   │   └── store/
│   │       └── pipelineStore.ts      # moveStage/moveToLost/moveToWon call clear-patch helper (D-13)
│   └── forecast/                     # NEW feature area
│       ├── components/
│       │   ├── ForecastPage.tsx
│       │   ├── StatTile.tsx
│       │   └── LostBreakdownChart.tsx
│       └── forecast-metrics.ts       # pure derived-value functions (mirrors deal-metrics.ts)
├── shared/
│   ├── types/deal.ts                 # unchanged — ConfidenceLevel/DealOutcome/PipelineStage already sufficient
│   └── utils/
│       ├── deal-metrics.ts           # unchanged, existing pattern to mirror
│       └── pipeline-group.ts         # add clear-patch helper (D-13) alongside fromPipelineGroup
```

### Pattern 1: Controlled sort/filter/search state shared across 6 table instances

**What:** `PipelineBoard` owns one shared state object (search text, column filters, sort column/direction, visible groups) and passes it down as **controlled** TanStack Table state to every `DealTable` instance, rather than letting each `useLegacyTable` call manage its own internal state.

**When to use:** Any time multiple independent table instances (here: 6, one per group) must all react to one shared toolbar (D-05/D-07's explicit requirement — "The same sort column/direction applies to all 6 group tables at once").

**Why this is necessary, not optional:** `useLegacyTable`/`useTable` defaults to *internal* state management for `sorting`/`globalFilter`/`columnFilters` when no `state`/`onXChange` pair is supplied — each table instance would then sort/filter independently, breaking D-07's "same sort column/direction applies to all 6 group tables at once" requirement. Passing `state: { sorting, globalFilter, columnFilters }` plus the matching `onSortingChange`/`onGlobalFilterChange`/`onColumnFiltersChange` callbacks makes the table a controlled component whose state lives in the parent.

**Example (skeleton, not exhaustive):**
```tsx
// Source: types read directly from node_modules/@tanstack/table-core/dist/
// features/{global-filtering,column-filtering}/*.types.d.ts (this session)
interface DealTableProps {
  deals: Deal[];
  group: PipelineGroup;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
}

const table = useLegacyTable({
  data: deals,
  columns: tableColumns,
  state: { sorting, globalFilter, columnFilters },
  onSortingChange,
  onGlobalFilterChange,
  onColumnFiltersChange,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  globalFilterFn: "includesString", // built-in — confirmed in filterFns.d.ts
});
```

Column defs gain sortable headers and per-column filter fns:
```tsx
columnHelper.accessor("owner", {
  header: "Owner",
  filterFn: "equalsString", // exact-match; owner list is free text, derive options from live deals
}),
columnHelper.accessor("value", {
  header: ({ column }) => (
    <button onClick={column.getToggleSortingHandler()}>
      Value {column.getIsSorted() === "asc" ? "▲" : column.getIsSorted() === "desc" ? "▼" : ""}
    </button>
  ),
  filterFn: "inNumberRange", // built-in — [min, max] filter value
}),
columnHelper.accessor("closeDate", {
  header: /* same sortable-header pattern */,
  filterFn: "inDateRange", // built-in — accepts Date/timestamp/parseable-string [min, max]
}),
```

### Pattern 2: Pure derived-value module for forecast math (mirrors `deal-metrics.ts`)

**What:** `forecast-metrics.ts` exports pure functions taking `Deal[]` and returning numbers/records — no Zustand import, no side effects, exactly like the existing `deal-metrics.ts` (`computeMrr`, `computeArr`, `computeLifetimeContractValue`).

**When to use:** Any value that must never be stored on `Deal` and must never go stale — this project's established convention (`shared/types/deal.ts`'s own header comment: "The 5 UI groups... are always DERIVED... never stored directly").

**Example:**
```ts
// Confidence Level → weight mapping is LOCKED (STATE.md, 2026-09-10; D-09) —
// [VERIFIED: src/shared/types/deal.ts:40] ConfidenceLevel =
// "100" | "80" | "50" | "open-to-rfp"
const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = {
  "100": 1.0,
  "80": 0.8,
  "50": 0.5,
  "open-to-rfp": 0.0,
};

export function computeRawPipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => d.outcome === "open") // D-08
    .reduce((sum, d) => sum + d.value, 0);
}

export function computeWeightedPipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => d.outcome === "open") // D-08 scope, D-09 weight
    .reduce((sum, d) => sum + d.value * CONFIDENCE_WEIGHT[d.confidenceLevel], 0);
}

export function computeWinRate(deals: Deal[]): number {
  const won = deals.filter((d) => d.outcome === "won").length;
  const lost = deals.filter((d) => d.outcome === "lost").length;
  return won + lost === 0 ? 0 : won / (won + lost); // D-10; guard divide-by-zero
}

/**
 * lostReason is stored as "{category}: {note}" or a bare category string
 * (03.1-CONTEXT.md) — always split on the first ": " and fall back to the
 * whole string, never exact-match the full field.
 */
export function computeLostByReason(deals: Deal[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of deals.filter((d) => d.outcome === "lost")) {
    const category = d.lostReason?.split(":")[0]?.trim() ?? "Unknown";
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

/**
 * pipelineStage is PRESERVED on a lost deal (pipeline-group.ts's own
 * comment: "a lost deal retain[s] the pipelineStage it was lost from") —
 * read `d.pipelineStage` directly, never `toPipelineGroup(d)` (which
 * collapses every lost deal to the single group "lost").
 */
export function computeLostByStage(deals: Deal[]): Record<PipelineStage, number> {
  const counts: Record<PipelineStage, number> = { prospect: 0, lead: 0, opportunity: 0, deal: 0 };
  for (const d of deals.filter((d) => d.outcome === "lost")) {
    counts[d.pipelineStage] += 1;
  }
  return counts;
}
```

### Pattern 3: Centralized clear-patch helper (D-12/D-13)

**What:** One function, colocated with `fromPipelineGroup` in `pipeline-group.ts`, that returns the fields to null out for a given target group — called by all 3 store actions so the clearing logic cannot drift or be forgotten by a future 4th caller.

**Example (skeleton — exact shape is planner's call per D-13):**
```ts
// src/shared/utils/pipeline-group.ts
export function clearPatchFor(group: PipelineGroup): Partial<Deal> {
  const patch: Partial<Deal> = {};
  if (group !== "lost") patch.lostReason = undefined;
  if (group !== "won") {
    patch.contractStartDate = undefined;
    patch.contractEndDate = undefined;
    patch.contractSignedDate = undefined;
    patch.paymentTerms = undefined;
  }
  return patch;
}
```
```ts
// pipelineStore.ts — same shape applied at all 3 call sites
moveStage: async (dealId, group) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = { ...fromPipelineGroup(group, current?.pipelineStage), ...clearPatchFor(group) };
  // ...unchanged
},
moveToLost: async (dealId, category, note) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = {
    ...fromPipelineGroup("lost", current?.pipelineStage),
    lostReason: note ? `${category}: ${note}` : category,
    ...clearPatchFor("lost"), // clears contract fields only — lostReason set above, not clobbered
  };
  // ...unchanged
},
moveToWon: async (dealId, terms) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = { ...fromPipelineGroup("won", current?.pipelineStage), ...terms, ...clearPatchFor("won") };
  // ...unchanged
},
```
Note the spread order: `clearPatchFor(group)` must be spread **after** the group-specific field-setting spread (e.g. `lostReason: ...` in `moveToLost`) only for the fields it is *not* supposed to clear for that target group — as written above, `clearPatchFor("lost")` only ever returns the 4 contract fields (never touches `lostReason` since `group === "lost"`), so spread order is actually safe either way for this exact implementation. Call this out explicitly in the plan/tests so a future edit to `clearPatchFor` doesn't silently reintroduce the ordering hazard.

### Pattern 4: Recharts bar chart for a categorical breakdown

**What:** A `ResponsiveContainer > BarChart` fed by the `Record<string, number>` shape `computeLostByReason`/`computeLostByStage` return (converted to an array of `{ name, count }` objects, which is Recharts' expected `data` shape).

**When to use:** FCST-02's two required breakdowns.

**Example:**
```tsx
// Source: Recharts is at v3.10.1 (confirmed via npm view this session); the
// public BarChart/ResponsiveContainer/XAxis/YAxis/Tooltip/Bar API used below
// is unaffected by the 3.0 migration's breaking changes, which are scoped to
// internal/advanced APIs (CategoricalChartState removal, Customized-wrapper
// changes) — [CITED: github.com/recharts/recharts/wiki/3.0-migration-guide]
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function toChartData(counts: Record<string, number>) {
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

export function LostBreakdownChart({ counts }: { counts: Record<string, number> }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={toChartData(counts)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```
Before writing chart color/styling code, consult the project's `dataviz` skill (available in this environment) for the palette-selection and accessibility rules it enforces — apply it on top of this project's own established group-color convention (`GroupSection.tsx`'s `GROUP_META` accent/tint pairs) so the lost-by-stage chart's bar colors can visually echo each stage's existing board color if desired.

### Anti-Patterns to Avoid

- **Re-deriving `PipelineGroup` for the lost-by-stage breakdown:** `toPipelineGroup(deal)` returns `"lost"` for every lost deal, destroying the stage information FCST-02 needs. Always read `deal.pipelineStage` directly for this specific breakdown — confirmed by `pipeline-group.ts`'s own comment (`"lets a lost deal retain the pipelineStage it was lost from"`).
- **Exact-matching the full `lostReason` string for the by-reason breakdown:** `lostReason` is `"{category}: {note}"` or a bare category (`03.1-CONTEXT.md`) — grouping by the raw string would fragment every "Other: <different note>" into its own bucket. Split on `:` first.
- **Letting each `DealTable` manage its own internal sort/filter state:** breaks D-07's "one sort applies to all 6 tables" requirement. Must be controlled state lifted to `PipelineBoard`.
- **Building the Forecast page before fixing CR-01:** any deal bounced Lost→Won→Prospect before this phase carries stale `lostReason` and/or stale contract fields that would silently corrupt FCST-02's counts. D-12/D-13's fix is a hard prerequisite, not parallelizable with FCST-02 implementation against the same data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Numeric/date range filtering (value, close date) | A custom `deal.value >= min && deal.value <= max` comparator wired to raw `useState` | `filterFn: "inNumberRange"` / `filterFn: "inDateRange"` (built into the installed `@tanstack/react-table` package, confirmed via `node_modules/@tanstack/table-core/dist/features/column-filtering/filterFns.d.ts` this session) | Built-ins already normalize blank/reversed endpoints and auto-remove empty filters — a hand-rolled comparator would need to re-solve those edge cases |
| Case-insensitive substring search across name/company | A custom `.toLowerCase().includes()` reducer over the whole `deals` array before rendering | TanStack's `globalFilterFn: "includesString"` (built-in, confirmed in the same file) | Already wired into the row-model pipeline; keeps search composable with column filters and sorting instead of a separate pre-filter pass |
| Sort-direction cycling + arrow indicator on header click | Manual `useState<"asc"\|"desc"\|null>` per column plus custom click handlers | `column.getToggleSortingHandler()` / `column.getIsSorted()` (part of `getSortedRowModel`'s public surface, confirmed present under `/legacy`) | These helpers already implement the standard 3-state (asc/desc/none) cycle TanStack tables use everywhere |
| Bar charts for the lost-deal breakdown | Hand-rolled SVG/CSS bars with manual scale math | `recharts`'s `BarChart`/`ResponsiveContainer` | CLAUDE.md's locked stack decision; Recharts already solves axis scaling, tooltips, and responsive sizing |

**Key insight:** Every piece of PIPE-04/05/06 has a corresponding built-in in the exact package version already installed — this phase is wiring, not building. The only genuinely new logic is the forecast math itself (FCST-01/02), which is intentionally simple arithmetic per the locked D-08/09/10 formulas, not a place to introduce a stats/aggregation library.

## Common Pitfalls

### Pitfall 1: CR-01 not fixed before forecast math is written against live data

**What goes wrong:** FCST-02's lost-by-reason/lost-by-stage counts look plausible in a quick demo but are quietly wrong for any deal that was ever Lost→reopened or Won→reopened, because `lostReason`/contract fields persist past the transition.

**Why it happens:** `toPipelineGroup` (the function used everywhere else to determine "what group is this deal in") only reads `outcome`/`pipelineStage`, so nothing currently *renders* incorrectly — the corruption is invisible until something reads `lostReason`/contract fields directly, which is exactly what FCST-02 does.

**How to avoid:** Land D-12/D-13's centralized clear-patch fix as its own task/commit before writing `forecast-metrics.ts`'s `computeLostByReason`, and add a verification step that moves a deal Lost→Prospect→Lost-again and confirms `lostReason` reflects only the latest transition.

**Warning signs:** A deal that shows up in the lost-by-reason chart with a `lostReason` that doesn't match its current, still-open `outcome`.

### Pitfall 2: Owner filter assumes a fixed enum

**What goes wrong:** `owner` is free text (`z.string().min(1, "Owner is required")` in `add-deal-schema.ts` — `[VERIFIED: src/features/pipeline/components/add-deal-schema.ts:13]`), not an enum. A filter UI hard-coding a dropdown of owner names will drift from whatever seed/user data actually exists.

**How to avoid:** Derive the owner filter's option list dynamically — `[...new Set(deals.map((d) => d.owner))]` — recomputed whenever `deals` changes, mirroring `usePipelineGroups`'s `useMemo` pattern.

### Pitfall 3: Uncontrolled per-table TanStack state silently breaks the "one shared sort/filter" requirement

**What goes wrong:** If `state`/`onXChange` are omitted from any of the 6 `useLegacyTable` calls, that instance falls back to independent internal state — it will still *run*, so this is easy to miss in a quick smoke test, but D-07's cross-table sync requirement silently fails only for whichever prop was forgotten.

**How to avoid:** Pass the full `{ sorting, globalFilter, columnFilters }` state triple plus all 3 `onXChange` callbacks to every `useLegacyTable` call — never a subset — and verify by sorting one group's Value column and confirming all 6 groups' arrows update together.

### Pitfall 4: `MockDealsRepository.update`'s patch type is narrower than the `DealsRepository` interface (pre-existing WR-01, `03.1-REVIEW.md`)

**What goes wrong:** `[VERIFIED: src/data/mock/mock-deals-repository.ts:69-76]` — the implementation's own `update()` signature is still `Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems">>`, missing the 4 contract-term keys the `DealsRepository` interface (`[VERIFIED: src/data/deals-repository.ts:14-33]`) already declares. This phase's D-13 clear-patch helper will pass `contractStartDate: undefined` etc. through `moveStage`/`moveToLost` — TypeScript's method-parameter bivariance plus the implementation's `{ ...this.deals[index], ...patch }` object-spread mean this works correctly at runtime today, but silently, not because the implementation's declared type honors it.

**How to avoid:** Since this phase is already touching all 3 call sites that exercise this exact gap, take the low-cost opportunity to widen `MockDealsRepository.update`'s `Pick` list to match the interface exactly (the fix `03.1-REVIEW.md` WR-01 already specified). Not required for correctness this phase (it works today), but leaving it unfixed means the next person who adds patch-key validation/whitelisting to `update()` will silently drop the 4 contract fields with zero compiler warning.

### Pitfall 5: Divide-by-zero in win rate when no deals have reached a terminal outcome

**What goes wrong:** `won / (won + lost)` is `NaN` when both counts are 0 (e.g. a freshly-loaded demo before any deal is marked Won/Lost) — `NaN` rendered directly in a stat tile shows the literal text "NaN%".

**How to avoid:** Guard with `won + lost === 0 ? 0 : won / (won + lost)` (or a distinct "no data yet" UI state) as shown in Pattern 2's `computeWinRate`.

## Code Examples

### Deriving the owner filter's option list (mirrors `usePipelineGroups`'s memoization pattern)

```ts
// [VERIFIED: src/features/pipeline/hooks/usePipelineGroups.ts:20-29] — same
// useMemo(..., [deals]) pattern reused here
const ownerOptions = useMemo(() => [...new Set(deals.map((d) => d.owner))].sort(), [deals]);
```

### Global filter wired to a search `<input>`

```tsx
// Source: node_modules/@tanstack/table-core/dist/features/global-filtering/
// globalFilteringFeature.types.d.ts (read this session) — state.globalFilter
// + onGlobalFilterChange + globalFilterFn are the full public contract
<input
  type="search"
  placeholder="Search by name or company..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| TanStack Table v8 `useReactTable`/`createColumnHelper` (what the original Phase 1 research assumed) | v9's feature-based `useTable`, with `/legacy` as an explicit v8-compat subpath | Confirmed already at Phase 1 (STATE.md: "`@tanstack/react-table@9.2.3` broke the v8-era `useReactTable` API... code now imports from the package's own `/legacy` compat subpath") | This phase must keep using `/legacy`'s stub `getSortedRowModel()`/`getFilteredRowModel()` markers, not the v9-native `features`/`tableFeatures()` API, to stay consistent with `DealTable.tsx`'s existing table instantiation |
| Recharts 2.x internal `CategoricalChartState` / cloned-prop internals | Recharts 3.x rewrote internal state management into smaller chunks; removed `CategoricalChartState`, changed the `Customized` component's role, dropped the `recharts-scale`/`react-smooth` sub-dependencies | Recharts 3.0 (2026) | Irrelevant to this phase's usage — `BarChart`/`ResponsiveContainer`/`XAxis`/`YAxis`/`Tooltip`/`Bar`'s public JSX API used in Pattern 4 is unaffected; only advanced/internal-state consumers are impacted — `[CITED: github.com/recharts/recharts/wiki/3.0-migration-guide]` |

**Deprecated/outdated:**
- TanStack Table v8-style `useReactTable`: still available in this project only via the `/legacy` compat subpath; the package's own type comments mark every v8-style row-model getter `@deprecated` in favor of the v9-native `tableFeatures()`/`useTable()` API — acceptable to keep using here since the rest of `DealTable.tsx` already committed to this subpath in Phase 1, and a mid-project v9-native migration is out of this phase's scope.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact UI widget for the close-date filter (single date-range picker vs. two plain `<input type="date">` fields vs. preset buttons like "Next 30/60/90 days") is left unspecified by CONTEXT.md and this research recommends a plain from/to date-input pair for simplicity | Architecture Patterns Pattern 1, Open Questions | Low — purely a UI-polish choice; either implementation satisfies PIPE-05's literal requirement ("filter... by... close date") and can be changed without touching the underlying `inDateRange` filter-fn wiring |
| A2 | The exact UI widget for the value filter (min/max number inputs vs. a slider) is left unspecified; this research assumes plain min/max number inputs | Architecture Patterns Pattern 1 | Low — same reasoning as A1; `inNumberRange`'s `[min, max]` filter-value contract is unaffected by which input widget produces it |
| A3 | Fixing `MockDealsRepository.update`'s narrower Pick type (Pitfall 4 / pre-existing WR-01) while this phase already touches the same 3 call sites is a low-cost improvement, not a functional requirement — assumed safe to bundle in without separately re-confirming with the user, since it only tightens an existing type to match an already-widened interface (no behavior change) | Common Pitfalls Pitfall 4 | Low — if the planner disagrees, this line item is trivially descoped without affecting any locked decision |

## Open Questions

1. **Exact filter-control UI for owner/value/close-date (D-05 scope, not detailed in CONTEXT.md)**
   - What we know: PIPE-05 requires filtering by owner, value, stage, and close date; D-06 locks the stage filter to a group-visibility toggle; owner/value/close-date are left to Claude's Discretion per CONTEXT.md's discretion list (which covers state shape/location, not the exact widget).
   - What's unclear: Whether the planner should specify a dropdown vs. free-text-match for owner, min/max inputs vs. slider for value, or a date-range picker vs. two date inputs for close date.
   - Recommendation: Owner → derived-option `<select>` (Pitfall 2). Value → two number inputs bound to `inNumberRange`. Close date → two `<input type="date">` fields bound to `inDateRange`, following this project's existing native-date-input convention already used elsewhere (`EditableCell`/`closeDate` normalization per STATE.md Phase 02 decision).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | No auth in this frontend-only prototype (PROJECT.md constraint, unchanged) |
| V3 Session Management | no | No sessions exist |
| V4 Access Control | no | Single-user prototype, no roles |
| V5 Input Validation | yes | Search text, value-range, and close-date-range filter inputs are ephemeral client-side UI state, not persisted or sent anywhere — React's default JSX escaping (already the project's established pattern, `03.1-SECURITY.md` T-03.1-02/T-03.1-05) covers reflected-search-text rendering. Numeric filter inputs should guard against `NaN` (empty/non-numeric input) before being passed to `inNumberRange`, since a `NaN` bound silently matches nothing rather than throwing |
| V6 Cryptography | no | No secrets/crypto involved in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Reflected XSS via search/filter text rendered back into the table or a "no results" message | Tampering / Information Disclosure | React's default JSX interpolation auto-escapes (confirmed pattern, `03.1-SECURITY.md` T-03.1-02); never introduce `dangerouslySetInnerHTML` for rendering the active search query or filter chips |
| Stale `lostReason`/contract-term data silently corrupting FCST-02's aggregate counts (CR-01, D-12/D-13) | Tampering / Integrity | Not a STRIDE privilege-boundary threat (no untrusted input, single legitimate user) but a data-integrity bug this phase is explicitly scoped to close via the centralized clear-patch helper — carried forward from `03.1-SECURITY.md`'s own "Additional finding" note |
| `moveStage` remaining a raw, ungated primitive (accepted risk `AR-03.1-01`/`AR-03.1-02` from Phase 3.1) | Tampering / Integrity | Unchanged this phase — still an accepted risk in a single-user, frontend-only prototype; D-12/D-13 close the *stale-field* half of this gap but do not add new enforcement to `moveStage` itself, consistent with `03.1-SECURITY.md`'s prior disposition |

## Sources

### Primary (HIGH confidence)
- `node_modules/@tanstack/react-table/dist/legacy.d.ts`, `useLegacyTable.d.ts` (read this session) — confirms `getSortedRowModel`/`getFilteredRowModel` v8-compat stub markers exist in the installed package version
- `node_modules/@tanstack/table-core/dist/features/{column-filtering,global-filtering}/*.types.d.ts` (read this session) — confirms `columnFilters`/`globalFilter` controlled-state contract and the full built-in `filterFns` registry (`includesString`, `inNumberRange`, `inDateRange`, `equalsString`, `arrIncludesSome`, etc.)
- `npm view recharts version` / `npm view recharts peerDependencies` (run this session) — 3.10.1, React 16–19 peer range
- `gsd-tools query package-legitimacy check --ecosystem npm recharts` (run this session) — `OK` verdict, 40.45M weekly downloads, real source repo
- Direct codebase reads this session: `src/shared/types/deal.ts`, `src/shared/utils/pipeline-group.ts`, `src/features/pipeline/store/pipelineStore.ts`, `src/features/pipeline/components/{DealTable,GroupSection,PipelineBoard,StageSelect}.tsx`, `src/features/pipeline/components/{lost-reason,won-contract-terms,add-deal}-schema.ts`, `src/data/{deals-repository,mock/mock-deals-repository,mock/seed-data}.ts`, `src/shared/utils/deal-metrics.ts`, `src/app/App.tsx`, `.planning/config.json`, `.planning/phases/03.1-lost-won-tracking/03.1-REVIEW.md`, `03.1-SECURITY.md`

### Secondary (MEDIUM confidence)
- `github.com/recharts/recharts/wiki/3.0-migration-guide` (WebSearch, this session) — confirms the BarChart/ResponsiveContainer public JSX API used in this research is unaffected by Recharts 3.0's breaking changes (which are scoped to internal state/advanced APIs)

### Tertiary (LOW confidence)
- None used for load-bearing claims this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library claim was verified this session either by reading installed `node_modules` source directly or via `npm view`/the package-legitimacy seam, not from training-data recall
- Architecture: HIGH — patterns are direct extensions of code already present and read this session (`DealTable.tsx`'s own comment names the exact APIs to add; `deal-metrics.ts` is the literal pattern to mirror for forecast math)
- Pitfalls: HIGH — CR-01/WR-01 pitfalls are sourced from `03.1-REVIEW.md`'s own findings (already-known, already-documented gaps in this exact codebase), not speculative

**Research date:** 2026-09-15
**Valid until:** 30 days (stable, already-installed dependencies; recharts pinned to a confirmed current version)

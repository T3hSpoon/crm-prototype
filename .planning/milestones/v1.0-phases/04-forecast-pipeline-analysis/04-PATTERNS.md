# Phase 4: Forecast & Pipeline Analysis - Pattern Map

**Mapped:** 2026-09-15
**Files analyzed:** 12
**Analogs found:** 10 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/app/App.tsx` (modify) | component | request-response (view switch) | `src/app/App.tsx` (itself, current state) | exact (self-extend) |
| `src/features/pipeline/components/PipelineBoard.tsx` (modify) | component | request-response | `src/features/pipeline/components/PipelineBoard.tsx` (itself) | exact (self-extend) |
| `src/features/pipeline/components/PipelineToolbar.tsx` (new) | component | request-response (controlled state) | `src/features/pipeline/components/GroupSection.tsx` (header/controls composition) | role-match |
| `src/features/pipeline/components/DealTable.tsx` (modify) | component | CRUD/table (add sort+filter) | `src/features/pipeline/components/DealTable.tsx` (itself, current `getCoreRowModel`-only) | exact (self-extend) |
| `src/features/pipeline/hooks/usePipelineGroups.ts` (modify, group-visibility filter applied above it) | hook | transform | `src/features/pipeline/hooks/usePipelineGroups.ts` (itself) | exact (self-extend) |
| `src/features/pipeline/store/pipelineStore.ts` (modify: moveStage/moveToLost/moveToWon call clear-patch) | store | event-driven (CRUD actions) | `src/features/pipeline/store/pipelineStore.ts` (itself) | exact (self-extend) |
| `src/shared/utils/pipeline-group.ts` (modify: add `clearPatchFor`) | utility | transform | `src/shared/utils/pipeline-group.ts` (itself, `fromPipelineGroup`) | exact (self-extend) |
| `src/features/forecast/forecast-metrics.ts` (new) | utility | transform | `src/shared/utils/deal-metrics.ts` | exact |
| `src/features/forecast/components/ForecastPage.tsx` (new) | component | request-response (read-only view) | `src/features/pipeline/components/PipelineBoard.tsx` | role-match |
| `src/features/forecast/components/StatTile.tsx` (new) | component | transform (presentational) | `src/features/pipeline/components/GroupSection.tsx` (header stat display) | role-match |
| `src/features/forecast/components/LostBreakdownChart.tsx` (new) | component | transform (chart render) | none in codebase (first Recharts usage) | no analog |
| `src/data/mock/mock-deals-repository.ts` (modify: widen `update` Pick type, WR-01 bundled fix) | service/repository | CRUD | `src/data/mock/mock-deals-repository.ts` (itself, `update()` signature) | exact (self-extend) |

## Pattern Assignments

### `src/features/pipeline/components/DealTable.tsx` (component, table)

**Analog:** itself (current file, lines 1–135) — this file's own header comment explicitly names the exact APIs to add.

**Current import pattern** (lines 1–21):
```tsx
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, legacyCreateColumnHelper, useLegacyTable } from "@tanstack/react-table/legacy";
```
Add `getSortedRowModel, getFilteredRowModel` to the same `/legacy` import — do NOT switch to the v9-native API (locked convention, `04-RESEARCH.md` "State of the Art").

**Core pattern to extend** (lines 92–135, table instantiation):
```tsx
const table = useLegacyTable({
  data: deals,
  columns: tableColumns,
  getCoreRowModel: getCoreRowModel(),
});
```
becomes controlled (per CONTEXT D-07/D-04 — one shared sort/filter state across all 6 tables, lifted to `PipelineBoard`):
```tsx
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
  globalFilterFn: "includesString",
});
```

**Column def pattern to extend** (lines 31–78, `columnHelper.accessor` calls): add `filterFn` (`"equalsString"` for owner, `"inNumberRange"` for value, `"inDateRange"` for closeDate) and sortable header via `column.getToggleSortingHandler()`/`getIsSorted()` — see RESEARCH.md Pattern 1 for exact skeleton.

**Empty-state pattern already present** (lines 154–162) — unchanged, reused per-group when a filter empties a group (D-04):
```tsx
{deals.length === 0 ? (
  <tr><td colSpan={tableColumns.length} className="px-4 py-6 text-center text-muted-foreground">
    {group === "won" ? "No contracts yet." : "No deals in this group yet."}
  </td></tr>
) : ( ... )}
```

---

### `src/features/pipeline/components/PipelineBoard.tsx` (component)

**Analog:** itself (current file, all 31 lines).

**Current shell/header pattern** (lines 15–30):
```tsx
export function PipelineBoard() {
  const groups = usePipelineGroups();
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);

  return (
    <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold">Pipeline</h1>
        <Button onClick={() => setIsAddDealOpen(true)}>Add Deal</Button>
      </div>
      {GROUPS.map((group) => (
        <GroupSection key={group} group={group} deals={groups[group]} />
      ))}
      <AddDealDialog open={isAddDealOpen} onOpenChange={setIsAddDealOpen} />
    </div>
  );
}
```
Extend the header row (D-05) with `<PipelineToolbar />` (search input + owner/value/closeDate filter controls + group-visibility toggle), lift `sorting`/`globalFilter`/`columnFilters`/`visibleGroups` state here, filter `GROUPS` by `visibleGroups` before mapping to `GroupSection`, and pass the controlled state down through `GroupSection` into `DealTable`. Reuse the exact `mx-auto flex w-[95%] flex-col gap-6 px-6 py-8` shell class for the new `ForecastPage` (D-01: "reads as a sibling view").

---

### `src/app/App.tsx` (component)

**Analog:** itself (current file, 20 lines).

**Current pattern** (lines 10–18):
```tsx
function App() {
  const load = usePipelineStore((s) => s.load);
  useEffect(() => { load(); }, [load]);
  return <PipelineBoard />;
}
```
Add local tab state (D-01, no router) and keep `PipelineBoard` mounted (hidden via CSS, per D-02's "does not remount/reset") rather than conditionally rendering:
```tsx
const [tab, setTab] = useState<"pipeline" | "forecast">("pipeline");
// ...
<div className={tab === "pipeline" ? "" : "hidden"}><PipelineBoard /></div>
{tab === "forecast" && <ForecastPage />}
```

---

### `src/features/forecast/forecast-metrics.ts` (utility, transform)

**Analog:** `src/shared/utils/deal-metrics.ts` (full file, 51 lines) — exact structural mirror per RESEARCH.md Pattern 2 and CONTEXT.md's own instruction.

**Module header/doc pattern** (lines 1–17):
```ts
import type { Deal } from "@/shared/types/deal";
import { computeSubtotal } from "@/shared/utils/line-items";

/**
 * Pure, never-stored derived-value functions ... no side effects, no
 * store/repository imports.
 */
```
Mirror this exactly for `forecast-metrics.ts`: `import type { Deal, ConfidenceLevel, PipelineStage } from "@/shared/types/deal";`, no `usePipelineStore` import.

**Core pure-function pattern** (lines 19–33, `computeMrr`/`computeArr`):
```ts
export function computeMrr(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + computeSubtotal(item), 0);
}
export function computeArr(deal: Pick<Deal, "lineItems">): number {
  return computeMrr(deal) * 12;
}
```
Same `.filter(...).reduce(...)` shape for `computeRawPipelineValue`/`computeWeightedPipelineValue`/`computeWinRate`/`computeLostByReason`/`computeLostByStage` (exact bodies specified in RESEARCH.md Pattern 2 — D-08/D-09/D-10 formulas, guard divide-by-zero per Pitfall 5).

**Critical data-shape note** (from `src/shared/utils/pipeline-group.ts` lines 1–12 and `03.1-CONTEXT.md`): lost deals retain `pipelineStage` — never call `toPipelineGroup(deal)` for the by-stage breakdown, read `deal.pipelineStage` directly (Anti-Pattern in RESEARCH.md). `lostReason` is `"{category}: {note}"` or bare category — split on `":"`, never exact-match.

---

### `src/shared/utils/pipeline-group.ts` (utility) — add `clearPatchFor` (D-13)

**Analog:** itself, `fromPipelineGroup` (lines 24–35) — "compute fields for a target group" shape to extend, not replace:
```ts
export function fromPipelineGroup(
  group: PipelineGroup,
  previousStage?: PipelineStage,
): { pipelineStage: PipelineStage; outcome: DealOutcome } {
  if (group === "lost") return { pipelineStage: previousStage ?? "prospect", outcome: "lost" };
  if (group === "won") return { pipelineStage: previousStage ?? "deal", outcome: "won" };
  return { pipelineStage: group, outcome: "open" };
}
```
Add alongside it (RESEARCH.md Pattern 3, exact skeleton):
```ts
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

---

### `src/features/pipeline/store/pipelineStore.ts` (store) — wire `clearPatchFor` into 3 actions (D-12/D-13)

**Analog:** itself — all 3 call sites already present and must all change identically (never drift, per D-13).

**`moveStage` current** (lines 47–53):
```ts
moveStage: async (dealId, group) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = fromPipelineGroup(group, current?.pipelineStage);
  const updated = await dealsRepository.update(dealId, patch);
  set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
},
```
becomes:
```ts
const patch = { ...fromPipelineGroup(group, current?.pipelineStage), ...clearPatchFor(group) };
```

**`moveToLost` current** (lines 55–72) and **`moveToWon` current** (lines 74–92) keep their existing `try/catch { console.error(...); throw err; }` error-handling shape unchanged — only the `patch` object composition changes, per RESEARCH.md Pattern 3:
```ts
// moveToLost
const patch = {
  ...fromPipelineGroup("lost", current?.pipelineStage),
  lostReason: note ? `${category}: ${note}` : category,
  ...clearPatchFor("lost"),
};
// moveToWon
const patch = { ...fromPipelineGroup("won", current?.pipelineStage), ...terms, ...clearPatchFor("won") };
```

**Error handling pattern to preserve exactly** (lines 65–71, applies to all 3 actions):
```ts
} catch (err) {
  console.error("moveToLost failed", err);
  throw err;
}
```

**Replace-by-id pattern to preserve** (appears at every action, e.g. line 64):
```ts
set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
```

---

### `src/data/mock/mock-deals-repository.ts` (repository) — widen `update()` Pick type (bundled WR-01 fix, Pitfall 4)

**Analog:** itself, current `update()` signature (per RESEARCH.md `[VERIFIED: src/data/mock/mock-deals-repository.ts:69-76]`) — currently `Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems">>`, missing the 4 contract-term keys the `DealsRepository` interface already declares (`src/data/deals-repository.ts:14-33`). Widen the `Pick` list to match the interface exactly so `clearPatchFor`'s `contractStartDate: undefined` etc. passes type-checking, not just runtime object-spread luck.

---

### `src/features/forecast/components/LostBreakdownChart.tsx` (component, chart)

**No analog in codebase** — first Recharts usage. Use RESEARCH.md Pattern 4's skeleton verbatim (imports: `Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis` from `"recharts"`; `toChartData(counts: Record<string, number>)` converts to `{ name, count }[]`). Follow `GroupSection.tsx`'s `GROUP_META` accent-color convention (lines 19–59) for bar-color choices to echo each pipeline stage's existing board color.

### `src/features/forecast/components/StatTile.tsx` (component, presentational)

**Analog:** `src/features/pipeline/components/GroupSection.tsx` header stat display (lines 91–93):
```tsx
<span className="text-sm font-semibold text-foreground/80">
  {currencyFormatter.format(total)}
</span>
```
and its `currencyFormatter` (lines 7–11) — reuse the same `Intl.NumberFormat` instantiation pattern for stat tiles showing raw/weighted pipeline value; win rate needs its own percentage formatter (`Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 })`).

## Shared Patterns

### Derived-value-never-stored convention
**Source:** `src/shared/utils/deal-metrics.ts` (whole file), `src/shared/types/deal.ts` lines 1–9, 17–21
**Apply to:** `forecast-metrics.ts`, `clearPatchFor` — no forecast number or pipeline group is ever written back onto `Deal`; always computed at render/selector time from `deals`.

### Replace-by-id, never by array index
**Source:** `src/features/pipeline/store/pipelineStore.ts` (every action, e.g. line 52/64/83/98)
```ts
set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
```
**Apply to:** any new store mutation this phase touches (none new, but `moveStage`/`moveToLost`/`moveToWon` edits must preserve this exactly).

### Store action error handling (log + rethrow)
**Source:** `src/features/pipeline/store/pipelineStore.ts` lines 65–71, 85–91, 99–105
```ts
} catch (err) {
  console.error("<actionName> failed", err);
  throw err;
}
```
**Apply to:** `moveStage`/`moveToLost`/`moveToWon` after D-13's patch-composition change — do not alter this control flow.

### `useMemo(..., [deals])` selector pattern
**Source:** `src/features/pipeline/hooks/usePipelineGroups.ts` lines 20–29
**Apply to:** deriving the owner-filter option list (`[...new Set(deals.map((d) => d.owner))].sort()`, RESEARCH.md Code Examples) and any new forecast selector hook.

### Page shell class
**Source:** `src/features/pipeline/components/PipelineBoard.tsx` line 20
```tsx
<div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
```
**Apply to:** `ForecastPage.tsx` root element, so it "reads as a sibling view, not a different app" (D-01).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/features/forecast/components/LostBreakdownChart.tsx` | component | transform (chart) | First Recharts usage in this codebase — no prior chart component to copy from; use RESEARCH.md Pattern 4's skeleton and `GROUP_META` for color convention instead |

## Metadata

**Analog search scope:** `src/features/pipeline/**`, `src/shared/**`, `src/data/**`, `src/app/App.tsx`
**Files scanned:** `DealTable.tsx`, `PipelineBoard.tsx`, `GroupSection.tsx`, `usePipelineGroups.ts`, `pipelineStore.ts`, `pipeline-group.ts`, `deal-metrics.ts`, `deal.ts`, `App.tsx`
**Pattern extraction date:** 2026-09-15

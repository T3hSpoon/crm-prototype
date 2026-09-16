# Phase 5: Confidence-Based Forecast Breakdown - Research

**Researched:** 2026-09-15
**Domain:** React/TypeScript in-app CRUD (inline-edit cell) + pure derived-data table rendering (frontend-only, no backend)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The Confidence cell uses the same click-to-edit shell as owner/value/closeDate (`EditableCell`) — clicking the cell swaps its display text for an editable control, commits on change, Escape cancels. Matches ROADMAP.md's explicit "same inline click-to-edit pattern" wording for Success Criterion 1.
- **D-02:** The control that appears is the shadcn Select component (Radix), not a native `<select>` — matches `StageSelect`'s existing enum-picker styling/pattern rather than introducing the only native form control in the table. Since `EditableCell` currently only renders a plain `<input>`, this is new: either extend `EditableCell` with a "select" variant, or build a small sibling component (e.g. `ConfidenceCell`) that reuses `EditableCell`'s click-to-reveal/commit/cancel state machine with a shadcn Select instead of an `<input>`. Planner's call on exact code shape — no constraint given beyond "click-to-reveal + shadcn Select".
- **D-03:** `confidenceLevel` needs a validation rule added to `dealEditSchema` (or an equivalent) so `EditableCell`'s existing safeParse-before-commit guard covers it, mirroring how `value`/`owner`/`closeDate` are already validated — `z.enum(["100", "80", "50", "open-to-rfp"])`.
- **D-04:** The breakdown table's "Model" column comma-joins **all** of a deal's line-item SKUs (not scoped to service-type only) — mirrors the Services column's own comma-join convention (FCST-03 wording), giving both multi-value columns the same join rule.
- **D-05:** A deal with zero line items renders an em-dash (`—`) in Model and Services, not an empty string — matches `EditableCell`'s existing em-dash convention for a missing `closeDate`.
- **D-06:** ARPU = MRR / Quantity. When Quantity (sum of service-type line-item units) is 0 — i.e. the deal has no service line items — the cell renders `—`, not `$0`. Matches D-05's em-dash convention and the Forecast page's existing "—" / "No closed deals yet." pattern for win rate when `won + lost === 0`.
- **D-07:** The same zero-guard applies to a confidence group's subtotal row and the grand-total row: if the aggregate Quantity for that row is 0, its ARPU shows `—` rather than `$0` or a division error. (FCST-04's subtotal wording only names Quantity/MRR/ARR/Lifetime Contract Value as summed columns — if the planner includes an aggregate ARPU on subtotal/grand-total rows at all, computed as aggregate-MRR / aggregate-Quantity, it must use this same em-dash guard. Whether to show ARPU on subtotal/grand-total rows in the first place is planner's call per FCST-04's literal column list.)
- **D-08:** Confidence groups appear in descending order: 100% → 80% → 50% → Open-to-RFP. Matches `forecast-metrics.ts`'s existing `CONFIDENCE_WEIGHT` mapping order (1.0/0.8/0.5/0.0).
- **D-09:** A confidence group with zero deals still renders (not hidden) with its section header and an empty-state row (subtotal effectively $0/—), matching the existing pipeline `GroupSection`/`DealTable` precedent where every group always shows, with a "No deals in this group yet." style message when empty.
- **D-10:** The new table lives in a new section on the existing `ForecastPage` component, placed below the current stat tiles + `LostBreakdownChart` charts — one scrollable read-only analysis page, no new sub-navigation/tabs introduced (consistent with Phase 4's D-03: Forecast has no separate sub-nav).
- **D-11:** All confidence groups and their deal rows are always expanded — no chevron/collapse interaction. Matches FCST-03/04's plain "view a table" framing; unlike the pipeline table's line-items sub-row (which has a genuine reason to default-collapse: verbose per-line-item detail), there's no analogous reason to hide rows here.

### Claude's Discretion

- Exact component shape for D-02 (extend `EditableCell` with a variant vs. a new sibling component) — no constraint given; pick whichever keeps `EditableCell`'s existing four-column contract (name/value/owner/closeDate) simplest to read, per the codebase's existing single-responsibility file pattern.
- Whether the breakdown table is a new plain HTML table (matching subtotal/grand-total row needs, which `@tanstack/react-table`'s `/legacy` subpath doesn't natively support) or built on TanStack Table with synthetic subtotal rows appended to `data` — no constraint given; existing `DealTable.tsx` uses the `/legacy` subpath for per-group tables, but this new table's shape (4 fixed groups + subtotal rows + 1 grand-total row) is structurally different enough that a plain table may be simpler. Planner's call.
- Whether ARPU appears at all on subtotal/grand-total rows (see D-07) — FCST-04 only lists Quantity/MRR/ARR/Lifetime Contract Value as summed columns; planner may omit an ARPU cell entirely on those rows, or include an aggregate ARPU using D-07's em-dash guard. Either satisfies the discussion.
- Whether Contract Length (months) needs any special empty-state treatment — no constraint given; `contractTermMonths` is already a required, always-populated field on `Deal` (Phase 3, DEAL-06), so no zero/missing-value gray area exists here the way it does for ARPU.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. No scope-creep suggestions came up.

### Phase Boundary (from CONTEXT.md)

Users can edit a deal's confidence level directly from the pipeline table (DEAL-07), and the Forecast page gains a new confidence-grouped financial breakdown table covering every deal in the pipeline — open, won, and lost (FCST-03, FCST-04). Does NOT touch: the existing stat tiles (raw/weighted pipeline value, win rate) or the lost-by-reason/lost-by-stage bar charts already on the Forecast page — this phase adds a new section, it doesn't modify those; does NOT touch stage-move logic (`StageSelect`, `moveStage`/`moveToLost`/`moveToWon`), line-item CRUD, or the Add Deal wizard's existing Confidence field (creation-time capture is already shipped, unaffected).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEAL-07 | User can edit a deal's confidence level inline from the pipeline table (not just at Add Deal creation) | Pattern 1 (`ConfidenceCell` component) + Pitfall 1 (`updateDeal` type widening) + Don't Hand-Roll (zod enum validation) directly enable this |
| FCST-03 | User can view all deals (open, won, and lost) in a table on the Forecast page, grouped by confidence level, showing Account Name/Model/Services/Quantity/ARPU/MRR/ARR/Lifetime Contract Value/Contract Length | Pattern 2 (`forecast-breakdown.ts` grouping) + Pattern 3 (`deal-metrics.ts` Quantity/ARPU/join extensions) directly enable this |
| FCST-04 | User can see a subtotal row per confidence group and a grand-total row summarizing Quantity/MRR/ARR/Lifetime Contract Value | Pattern 2's `computeGroupTotals` (reused for both subtotal and grand-total) + Pitfall 2 (non-aggregatable column handling) directly enable this |
</phase_requirements>

## Summary

This phase adds one new editable table cell (DEAL-07) and one new read-only breakdown table (FCST-03/FCST-04) to an already-established codebase with strong, consistent conventions: click-to-edit cells (`EditableCell`), enum-picker cells (`StageSelect`), pure derived-value modules with no store imports (`deal-metrics.ts`, `line-items.ts`, `forecast-metrics.ts`), and a Zustand store that only ever gets replaced-by-id (`updateDeal`). Nothing in this phase requires a new npm package — `@tanstack/react-table`, `zod`, and shadcn's `Select` are already installed and already used for near-identical problems elsewhere in the codebase.

The one load-bearing technical decision CONTEXT.md leaves open — plain HTML table vs. `@tanstack/react-table` for the breakdown table — resolves clearly in favor of a **plain HTML table** built from pure grouping/aggregation functions. The breakdown table has no sorting, filtering, or row-expand requirements (D-11: always expanded, no chevron), so none of TanStack's row-model machinery buys anything; using it would instead force an awkward synthetic-row workaround (subtotal/grand-total rows don't share `Deal`'s shape, breaking the table's generic `TData` typing) for a table that Phase 4's own precedent (`forecast-metrics.ts` — plain functions, no store, no TanStack) already tells you how to build.

A second, non-obvious finding blocks compile-time correctness regardless of implementation choice: `usePipelineStore`'s `updateDeal` action signature currently types its `patch` parameter as `Partial<Pick<Deal, "name" | "value" | "owner" | "closeDate" | "lineItems">>` — `confidenceLevel` is not in that union. Any task that calls `updateDeal(dealId, { confidenceLevel })` without first widening this type will fail `tsc -b`.

**Primary recommendation:** Build the Confidence cell as a new sibling component (`ConfidenceCell.tsx`) that reuses `EditableCell`'s click-to-reveal/commit/cancel state-machine shape but renders a shadcn `Select` (mirroring `StageSelect`'s stopPropagation guard) instead of an `<input>`; build the breakdown table as a new pure module (`forecast-breakdown.ts`, sibling to `forecast-metrics.ts`) plus a plain-HTML-table component (`ForecastBreakdownTable.tsx`) — no TanStack Table involvement.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Confidence inline edit (DEAL-07) | Browser / Client | — | Frontend-only prototype (no backend this milestone per PROJECT.md); edit is a Zustand store action (`updateDeal`) calling the in-memory mock repository — same seam every other inline edit already uses |
| Confidence-grouped breakdown table (FCST-03) | Browser / Client | — | Pure client-side computation over the store's in-memory `deals` array; no network, no persistence layer involved |
| Subtotal/grand-total aggregation (FCST-04) | Browser / Client | — | Derived at render time from the same in-memory array, never stored, mirroring `forecast-metrics.ts`'s existing pattern |

## Standard Stack

### Core (already installed — no new packages)
| Library | Installed Version | Purpose | Why Standard (for this phase) |
|---------|---------|---------|--------------|
| react | ^19.2.8 [VERIFIED: package.json:27] | UI runtime | Already the project's runtime; no phase-specific need |
| typescript | 5.9.3 [VERIFIED: package.json:49] | Static typing | Pinned to 5.9.x, not the 7.0 line CLAUDE.md's stack table names — consistent with CLAUDE.md's own stated fallback ("if `typescript-eslint` hasn't caught up, pin `typescript@^5.9`") |
| zod | ^4.4.3 [VERIFIED: package.json:35] | Schema validation | Reused for the new `confidenceLevel` enum rule on `dealEditSchema` (D-03) — no new dependency |
| @tanstack/react-table | ^9.2.3 [VERIFIED: package.json:20] | Headless table logic | Already used by `DealTable.tsx` via its `/legacy` subpath. **Not recommended for the new breakdown table** — see Architecture Patterns below |
| radix-ui (via `@/components/ui/select`) | ^1.6.7 [VERIFIED: package.json:26] | Select primitive | Already the control both `StageSelect.tsx` and the new `ConfidenceCell` use |

### Supporting
No new supporting libraries needed. `date-fns`, `@faker-js/faker`, `lucide-react`, `clsx`/`tailwind-merge` are already installed and none are required by this phase's scope.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain HTML table for breakdown table | `@tanstack/react-table` with synthetic subtotal/grand-total rows appended to `data` | Requires a discriminated-union row type (deal row vs. subtotal row vs. grand-total row) to satisfy the table's generic `TData`, plus per-column cell renderers that branch on row kind. Buys nothing: this table has no sort/filter/expand (D-11), so none of TanStack's row-model features are exercised. Phase 4's own `forecast-metrics.ts` precedent already solves an identical "derive + aggregate from `Deal[]`" problem with plain functions, not TanStack. |
| Sibling `ConfidenceCell` component | Extend `EditableCell`'s `EditableColumnId` union to include `"confidenceLevel"` with conditional `<input>`-vs-`<Select>` rendering | CONTEXT.md's own guidance (D-02) is to "keep `EditableCell`'s existing four-column contract... simplest to read" — mixing a Select-only column into a component whose `value: string | number` prop and single `<input>` render path are shaped around text/number/date inputs pushes it toward a harder-to-read branch-heavy component for one outlier column |

**Installation:** None required — every package this phase touches is already in `package.json`.

**Version verification:** Confirmed via `npm view @tanstack/react-table version` → `9.2.4` and `npm view zod version` → `4.6.5` (both newer than the pinned `^9.2.3`/`^4.4.3` in `package.json`, but this phase does not require a bump — it uses APIs already exercised elsewhere in the codebase).

## Package Legitimacy Audit

**No external packages are installed by this phase.** Every dependency used (`@tanstack/react-table`, `zod`, `radix-ui`/shadcn `Select`) is already present in `package.json` and already in use by sibling components (`DealTable.tsx`, `deal-edit-schema.ts`, `StageSelect.tsx`). The Package Legitimacy Gate is not applicable — skip it for this phase.

## Architecture Patterns

### System Architecture Diagram

```
Pipeline table (DealTable.tsx)
  └─ Confidence cell click
       └─ ConfidenceCell (new) — click-to-reveal shadcn Select
            └─ zod safeParse (dealEditSchema.shape.confidenceLevel)
                 └─ usePipelineStore.updateDeal(id, { confidenceLevel })  [type widened, see Pitfall 1]
                      └─ dealsRepository.update() (in-memory mock)
                           └─ store replaces deal by id → re-render

Forecast page (ForecastPage.tsx)
  └─ usePipelineStore((s) => s.deals)   [full, unfiltered array]
       └─ groupDealsByConfidence(deals)          — forecast-breakdown.ts (new, pure)
            ├─ per group: deals sorted/rendered as-is (no in-table sort/filter)
            │    └─ per deal row: joinModelSkus / joinServiceNames / computeQuantity /
            │         computeArpu / computeMrr / computeArr / computeLifetimeContractValue
            │         (deal-metrics.ts, extended)
            ├─ per group: computeGroupTotals(groupDeals)  → subtotal row
            └─ computeGroupTotals(allDeals)                → grand-total row
       └─ ForecastBreakdownTable (new) — plain <table>, always-expanded, 4 fixed groups + 1 grand-total row
```

### Recommended Project Structure
```
src/
├── shared/
│   ├── utils/
│   │   └── deal-metrics.ts         # extend: computeQuantity, computeArpu, joinModelSkus, joinServiceNames
│   └── constants/
│       └── confidence-level.ts     # new: CONFIDENCE_LEVELS (order) + CONFIDENCE_LEVEL_LABELS (display text)
├── features/
│   ├── pipeline/
│   │   └── components/
│   │       ├── ConfidenceCell.tsx  # new — sibling to EditableCell, shadcn Select variant
│   │       ├── deal-edit-schema.ts # extend: confidenceLevel enum rule
│   │       └── DealTable.tsx       # add Confidence column using ConfidenceCell
│   └── forecast/
│       ├── forecast-breakdown.ts   # new — pure grouping/aggregation, mirrors forecast-metrics.ts
│       └── components/
│           ├── ForecastBreakdownTable.tsx  # new — plain HTML table
│           └── ForecastPage.tsx    # mount new table below existing stat tiles/charts
```

### Pattern 1: Sibling click-to-edit component for an enum-picker cell (not `EditableCell` extension)
**What:** A new component reproduces `EditableCell`'s `isEditing`/`draft`/`isPending`/`error` state shape but swaps the `<input>` for a `Select`, and reuses `StageSelect`'s `e.stopPropagation()` guard so entering edit mode never triggers the row's `onRowClick`.
**When to use:** Any table cell whose edit control is a fixed enum picker rather than free text/number/date.
**Example — verified building blocks this pattern composes** (each block is an exact quote from the file cited):

```typescript
// EditableCell.tsx:38 — the click-to-reveal guard this phase's ConfidenceCell must mirror
export function EditableCell({ dealId, columnId, value }: EditableCellProps) {
  // ...
  <span
    className="block cursor-text px-1 py-0.5"
    onClick={(e) => {
      e.stopPropagation();
      if (isPending) return;
      setDraft(toEditableValue(columnId, value));
      setIsEditing(true);
    }}
  >
```

```typescript
// StageSelect.tsx:61 — the row-click guard + Select pairing to mirror for the Select control itself
<div onClick={(e) => e.stopPropagation()}>
  <Select value={currentGroup} onValueChange={handleValueChange}>
    <SelectTrigger size="sm" aria-label="Move deal to stage">
```

```typescript
// EditableCell.tsx:83-98 — the safeParse-before-commit + error-revert pattern to reuse verbatim,
// swapping columnId for the fixed "confidenceLevel" key
const parsed = dealEditSchema.shape[columnId].safeParse(candidate);
if (!parsed.success) {
  setDraft(lastCommitted);
  setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
  return;
}
setIsPending(true);
try {
  await usePipelineStore.getState().updateDeal(dealId, { [columnId]: parsed.data });
  setError(null);
} catch {
  setDraft(lastCommitted);
  setError(UPDATE_FAILED_MESSAGE);
} finally {
  setIsPending(false);
}
```

Composed recommendation (this exact shape is a synthesis of the three verified blocks above, not itself copied from a single file — mark implementation details as a recommendation, not a verified quote):

```typescript
// src/features/pipeline/components/ConfidenceCell.tsx (recommended shape)
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { dealEditSchema } from "@/features/pipeline/components/deal-edit-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";
import { CONFIDENCE_LEVEL_LABELS, CONFIDENCE_LEVELS } from "@/shared/constants/confidence-level";
import type { ConfidenceLevel } from "@/shared/types/deal";

interface ConfidenceCellProps {
  dealId: string;
  value: ConfidenceLevel;
}

export function ConfidenceCell({ dealId, value }: ConfidenceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isEditing) {
    return (
      <div>
        <span
          className="block cursor-text px-1 py-0.5"
          onClick={(e) => {
            e.stopPropagation();
            if (isPending) return;
            setIsEditing(true);
          }}
        >
          {CONFIDENCE_LEVEL_LABELS[value]}
        </span>
        {error && <span className="block px-1 text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  const commit = async (next: string) => {
    setIsEditing(false);
    if (next === value) return;
    const parsed = dealEditSchema.shape.confidenceLevel.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
      return;
    }
    setIsPending(true);
    try {
      await usePipelineStore.getState().updateDeal(dealId, { confidenceLevel: parsed.data });
      setError(null);
    } catch {
      setError(UPDATE_FAILED_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={(v) => void commit(v)}>
        <SelectTrigger size="sm" aria-label="Edit confidence level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONFIDENCE_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {CONFIDENCE_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

Note on auto-opening the Select on reveal: `EditableCell`'s `<input>` uses `autoFocus` so the control is immediately interactive after the click that revealed it. Radix's `Select` root accepts controlled `open`/`onOpenChange` props (the project's `Select` wrapper spreads `...props` onto `SelectPrimitive.Root` unfiltered [VERIFIED: src/components/ui/select.tsx:6-10] `function Select({ ...props }: ...) { return <SelectPrimitive.Root data-slot="select" {...props} /> }`, so passing `open`/`onOpenChange` is mechanically possible). Whether to wire `open={isEditing}` + `onOpenChange={(o) => !o && setIsEditing(false)}` for a true one-click reveal-and-open, versus the simpler two-click "reveal, then click again to open the dropdown" (what `StageSelect` already does uncontrolled), is a UX judgment call the specific Radix controlled-open behavior for this component tree is **not verified in this session** [ASSUMED — verify manually during implementation; fall back to the uncontrolled two-click pattern `StageSelect` already ships if controlled-open causes focus/flicker issues].

### Pattern 2: Pure grouping + aggregation module for the breakdown table (mirrors `forecast-metrics.ts`)
**What:** A new `forecast-breakdown.ts` module, structurally identical to `usePipelineGroups.ts`'s partition pattern and `forecast-metrics.ts`'s "no store import, pure `Deal[]` in / value out" convention.
**When to use:** Any time the app needs to group the full `deals` array by a fixed-cardinality enum with a locked display order and render an always-present-even-when-empty section per group — this codebase already has this pattern twice (`GROUPS` in `usePipelineGroups.ts` for pipeline stages, `CONFIDENCE_WEIGHT`'s key order in `forecast-metrics.ts` for confidence).

```typescript
// Source: usePipelineGroups.ts:7,17-29 — the exact partition shape being mirrored (verified quote)
export const GROUPS: PipelineGroup[] = ["prospect", "lead", "opportunity", "deal", "won", "lost"];

export function usePipelineGroups(): Record<PipelineGroup, Deal[]> {
  const deals = usePipelineStore((s) => s.deals);
  return useMemo(() => {
    const byGroup = Object.fromEntries(GROUPS.map((g) => [g, [] as Deal[]])) as Record<PipelineGroup, Deal[]>;
    for (const deal of deals) {
      byGroup[toPipelineGroup(deal)].push(deal);
    }
    return byGroup;
  }, [deals]);
}
```

Recommended new module (plain function, not a hook — `forecast-metrics.ts` explicitly avoids hooks/store imports so its functions are independently unit-testable):

```typescript
// src/features/forecast/forecast-breakdown.ts (recommended shape)
import type { Deal, ConfidenceLevel } from "@/shared/types/deal";
import { computeMrr, computeArr, computeLifetimeContractValue, computeQuantity } from "@/shared/utils/deal-metrics";
import { CONFIDENCE_LEVELS } from "@/shared/constants/confidence-level";

/**
 * Partitions ALL deals (open, won, and lost) by confidenceLevel — PROJECT.md's
 * locked "confidence-grouped forecast table includes all deals regardless of
 * outcome" decision, a deliberate contrast with forecast-metrics.ts's
 * open-deals-only scope for raw/weighted pipeline value.
 */
export function groupDealsByConfidence(deals: Deal[]): Record<ConfidenceLevel, Deal[]> {
  const byLevel = Object.fromEntries(
    CONFIDENCE_LEVELS.map((level) => [level, [] as Deal[]]),
  ) as Record<ConfidenceLevel, Deal[]>;
  for (const deal of deals) {
    byLevel[deal.confidenceLevel].push(deal);
  }
  return byLevel;
}

export interface GroupTotals {
  quantity: number;
  mrr: number;
  arr: number;
  lifetimeContractValue: number;
  arpu: number | null; // null => render "—" (D-06/D-07 zero-guard)
}

/** Aggregates the 4 summed columns (FCST-04) over any deal subset — used for both a
 * confidence group's subtotal row and the whole-table grand-total row. */
export function computeGroupTotals(deals: Deal[]): GroupTotals {
  const quantity = deals.reduce((sum, d) => sum + computeQuantity(d), 0);
  const mrr = deals.reduce((sum, d) => sum + computeMrr(d), 0);
  const arr = deals.reduce((sum, d) => sum + computeArr(d), 0);
  const lifetimeContractValue = deals.reduce((sum, d) => sum + computeLifetimeContractValue(d), 0);
  return { quantity, mrr, arr, lifetimeContractValue, arpu: quantity === 0 ? null : mrr / quantity };
}
```

### Pattern 3: `deal-metrics.ts` extension for Quantity/ARPU/Model-join/Services-join
**What:** Four new pure functions added to the existing `deal-metrics.ts`, matching `computeMrr`'s exact filter-then-reduce shape.
**Verified base pattern to mirror:**
```typescript
// Source: src/shared/utils/deal-metrics.ts:24-28 (verified quote — the exact shape to mirror for Quantity)
export function computeMrr(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + computeSubtotal(item), 0);
}
```
**Recommended additions:**
```typescript
/** Sum of service-type line-item units (D-06's "Quantity" definition). */
export function computeQuantity(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + item.units, 0);
}

/** ARPU = MRR / Quantity. Returns null (not 0) when Quantity is 0 — caller renders "—" (D-06). */
export function computeArpu(deal: Pick<Deal, "lineItems">): number | null {
  const quantity = computeQuantity(deal);
  return quantity === 0 ? null : computeMrr(deal) / quantity;
}

/** Comma-joins ALL line-item SKUs (D-04 — not scoped to service-type). Returns "" when
 * there are no non-empty skus; caller renders "—" (D-05), mirroring EditableCell's own
 * `value ? ... : "—"` ternary rather than baking the em-dash into the computed value. */
export function joinModelSkus(deal: Pick<Deal, "lineItems">): string {
  return deal.lineItems.map((item) => item.sku).filter(Boolean).join(", ");
}

/** Comma-joins service-type line items' productOrService names (Services column). */
export function joinServiceNames(deal: Pick<Deal, "lineItems">): string {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .map((item) => item.productOrService)
    .filter(Boolean)
    .join(", ");
}
```

### Anti-Patterns to Avoid
- **Storing Quantity/ARPU/Model/Services as `Deal` fields:** breaks the codebase's explicit "derived, never stored" convention, stated three separate times in the files read this session — `deal-metrics.ts:9-17`, `line-items.ts:5-9`, `pipeline-group.ts` comment quoted in `deal.ts:1-9`. Always compute at render time from `deal.lineItems`.
- **Reusing `EditableCell` unmodified for Confidence:** its `value: string | number` prop and single `<input>` render path have no Select branch; retrofitting it risks breaking the existing four columns' simplicity (see Alternatives Considered).
- **Using `@tanstack/react-table`'s `getGroupedRowModel`/`getExpandedRowModel` for the breakdown table:** the codebase has twice already rejected the "let TanStack group rows" approach in favor of pre-partitioning outside the table (`usePipelineGroups.ts`'s own comment: "never `TanStack`'s `getGroupedRowModel`" [VERIFIED: usePipelineGroups.ts:12-13] `partitions the store's flat deals list into the 6 fixed pipeline groups... see 01-RESEARCH.md Architecture Patterns Pattern 1 (pre-partition, not getGroupedRowModel)`). Follow that precedent for confidence grouping too.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confidence enum validation | A hand-written `if` chain checking `confidenceLevel` is one of 4 strings | `z.enum(["100", "80", "50", "open-to-rfp"])` added to `dealEditSchema`, validated via the existing `.safeParse` call site | Matches every other field's validation path exactly; zod is already the project's validation library |
| Select dropdown UI | A custom `<div>`-based popover/listbox | shadcn's already-generated `@/components/ui/select` (Radix-backed) | Zero new dependency, already accessible (keyboard nav, ARIA), already the pattern `StageSelect` uses |
| Currency formatting for new columns (ARPU/MRR/ARR/Lifetime Contract Value) | A new formatter | The `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })` instance already duplicated identically in `DealTable.tsx`, `EditableCell.tsx`, and `ForecastPage.tsx` — instantiate a 4th matching copy in the new component for consistency (an extraction to a shared `formatCurrency` util is a reasonable cleanup but out of this phase's explicit scope; not required) | Keeps formatting output pixel-identical to every existing money cell in the app |

**Key insight:** This phase's actual engineering risk is not "which library" (nothing new is needed) but "which existing module gets a new function added to it, and whether that function is typed consistently with its siblings" — `computeQuantity`/`computeArpu` must accept `Pick<Deal, "lineItems">` exactly like `computeMrr` does, not the full `Deal`, so they stay composable and unit-testable the same way.

## Common Pitfalls

### Pitfall 1: `usePipelineStore.updateDeal`'s patch type doesn't include `confidenceLevel`
**What goes wrong:** `updateDeal(dealId, { confidenceLevel: "80" })` fails to typecheck.
**Why it happens:** The store's action signature is currently narrowed to a fixed field list that predates this phase:
```typescript
// Source: src/features/pipeline/store/pipelineStore.ts:20-23 (verified quote)
updateDeal: (
  id: string,
  patch: Partial<Pick<Deal, "name" | "value" | "owner" | "closeDate" | "lineItems">>,
) => Promise<void>;
```
**How to avoid:** Add `"confidenceLevel"` to that `Pick<Deal, ...>` union as an explicit task before/alongside building `ConfidenceCell`. This is a one-line, low-risk change (the runtime path is already generic — `dealsRepository.update(id, patch)` passes the patch through untyped-at-runtime; only the compile-time signature needs widening).
**Warning signs:** `tsc -b` (the project's build script, `"build": "tsc -b && vite build"` [VERIFIED: package.json:8]) fails with a type error at the `ConfidenceCell`/`EditableCell` call site the moment this task is skipped.

### Pitfall 2: Subtotal/grand-total rows don't have a natural value for non-aggregatable columns
**What goes wrong:** Account Name, Model, Services, and Contract Length have no meaningful per-group sum — leaving these cells rendering `undefined`/`NaN`/a stray `0` looks like a bug.
**Why it happens:** FCST-04's literal column list for summed values is `Quantity/MRR/ARR/Lifetime Contract Value` only — the other 5 columns (Account Name, Model, Services, ARPU, Contract Length) are deliberately excluded from that list.
**How to avoid:** On subtotal rows, put a label ("Subtotal — 100%", etc., built from `CONFIDENCE_LEVEL_LABELS`) in the Account Name column position and render `"—"` for Model/Services/Contract Length; on the grand-total row use "Grand Total" the same way. ARPU on these rows is Claude's Discretion per D-07 — if included, use `computeGroupTotals(...).arpu` with the same `null` → `"—"` guard as per-deal ARPU.
**Warning signs:** A subtotal/grand-total row with a blank or `0` Contract Length that reads as "this group's contracts are 0 months long," which is misleading rather than merely empty.

### Pitfall 3: Confidence group order drifting from `CONFIDENCE_WEIGHT`'s key order
**What goes wrong:** Confidence groups render in object-insertion or alphabetical order instead of the locked 100% → 80% → 50% → Open-to-RFP order (D-08).
**Why it happens:** `Object.keys()`/`Object.entries()` on a `Record<ConfidenceLevel, ...>` is not guaranteed to preserve a semantically meaningful order for consumers unless the iteration explicitly walks a separate ordered array.
**How to avoid:** Always iterate the new `CONFIDENCE_LEVELS` ordered array (`["100", "80", "50", "open-to-rfp"]`) to drive rendering, never `Object.keys(groupedDeals)`. This exact array already exists once in the codebase for an unrelated purpose (`CONFIDENCE_LEVELS: ConfidenceLevel[] = ["100", "80", "50", "open-to-rfp"]` [VERIFIED: src/data/mock/seed-data.ts:20], used there only to pick a random seed value) — reusing or re-declaring the same literal order in the new shared constants file keeps both usages consistent by construction.
**Warning signs:** Groups appear to reorder themselves after a deal's confidence is edited, or don't match the pipeline table's `StageSelect`-adjacent mental model of a fixed funnel order.

### Pitfall 4: Line items with a blank `sku` or `productOrService` producing bare/double commas in the Model or Services join
**What goes wrong:** `deal.lineItems.map(i => i.sku).join(", ")` on a deal whose line items exist but have some empty-string `sku` values (the schema explicitly permits this: `productOrService`/`sku` are "intentionally NOT required-non-empty" [VERIFIED: src/features/pipeline/components/deal-edit-schema.ts:24-27]) produces `"ABC123, , DEF456"` instead of a clean join.
**Why it happens:** D-05's em-dash rule only covers the "zero line items" case explicitly; it doesn't address a non-empty `lineItems` array containing blank-string fields.
**How to avoid:** `.filter(Boolean)` before `.join(", ")` in both `joinModelSkus` and `joinServiceNames` (shown in Pattern 3's code above) so blank entries are dropped rather than joined as empty segments. This is a reasonable extrapolation of D-05's intent, not itself confirmed by CONTEXT.md — flagged in Assumptions Log.
**Warning signs:** A Model or Services cell displaying a comma with nothing before/after it.

## Code Examples

Already included inline above under Architecture Patterns 1-3 (`ConfidenceCell.tsx`, `forecast-breakdown.ts`, `deal-metrics.ts` extensions) — all quoted base patterns are cited with exact file:line, and all composed/recommended code is explicitly labeled as a recommendation rather than a verified excerpt.

## State of the Art

Not applicable — this is a small, in-repo feature addition to an already-current stack (React 19.2, TypeScript 5.9, TanStack Table 9, Zod 4, all confirmed current or near-current against the npm registry this session). No deprecated/outdated pattern is being replaced.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Radix `Select`'s controlled `open`/`onOpenChange` props will cleanly auto-open the dropdown the instant `ConfidenceCell` enters edit mode (mirroring `EditableCell`'s `autoFocus`) | Architecture Patterns, Pattern 1 | Minor UX-only risk — worst case, fall back to `StageSelect`'s existing uncontrolled two-click pattern (click cell, then click Select to open); no functional/data risk |
| A2 | Blank `sku`/`productOrService` string values should be filtered out of the Model/Services join rather than shown as empty segments between commas | Common Pitfalls, Pitfall 4 | Low — worst case is a cosmetic double-comma in a demo dataset; easy to patch post-hoc without touching the data layer |
| A3 | Confidence group order should live in a new shared constants file (`src/shared/constants/confidence-level.ts`) rather than duplicating the `CONFIDENCE_LEVEL_OPTIONS` local const already in `AddDealDialog.tsx` | Recommended Project Structure | Low — worst case is the planner instead inlines a local ordered array + label map directly in the two new files (`ConfidenceCell.tsx`, `ForecastBreakdownTable.tsx`), which still satisfies D-08 correctness, just with more duplication across 3 files instead of 2 |
| A4 | Whether ARPU should appear on subtotal/grand-total rows at all (D-07 leaves this to planner discretion) | Common Pitfalls, Pitfall 2 | None — either choice satisfies FCST-04's literal column list; purely a presentation call |

**If this table is empty:** N/A — see rows above; none of these are compliance/security/performance-sensitive, all are UI/DX judgment calls appropriate for the planner to lock down.

## Open Questions

1. **Should `ConfidenceCell` auto-open its Select on the reveal click, or require a second click (matching `StageSelect`'s current uncontrolled behavior)?**
   - What we know: `Select`'s wrapper component spreads all props onto `SelectPrimitive.Root` unfiltered [VERIFIED: src/components/ui/select.tsx:6-10], so a controlled `open` prop is mechanically pass-through-able.
   - What's unclear: Whether Radix's controlled-open behavior interacts cleanly with this specific reveal-on-click pattern (focus management, first keypress capture) — not tested this session.
   - Recommendation: Try the one-click auto-open version first (better UX parity with `EditableCell`'s `autoFocus`); if it causes focus/flicker issues during implementation, fall back to `StageSelect`'s proven two-click pattern without blocking the rest of the phase.

2. **Where exactly in `DealTable.tsx`'s `columns` array should the new Confidence column be inserted?**
   - What we know: No ordering constraint given in CONTEXT.md; existing column order is Name, Company, Value, Owner, Close Date, Lifetime Contract Value (display), Stage, ID.
   - What's unclear: Whether Confidence should sit near Close Date (both deal-attribute edits) or near Stage/Lifetime Contract Value (both forecast-adjacent).
   - Recommendation: Insert after Close Date, before the Lifetime Contract Value display column — keeps all 5 directly-editable fields (Name/Value/Owner/Close Date/Confidence) contiguous, with computed/display-only columns (Lifetime Contract Value, Stage, ID) trailing.

## Environment Availability

Skipped — this phase introduces zero new external dependencies, network calls, or services. Every library used is already installed (`package.json`, verified this session) and the app remains frontend-only/in-memory per PROJECT.md's Phase 5 constraints.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` [VERIFIED: .planning/config.json:47-48]. This phase is entirely client-side, in-memory state mutation with no network calls, no authentication, and no persistence layer (PROJECT.md constraint, unaffected by this phase) — the large majority of ASVS categories are not applicable to this milestone's architecture.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Out of scope for entire milestone (frontend-only prototype, no auth) |
| V3 Session Management | No | No sessions exist in this app |
| V4 Access Control | No | Single-user prototype, no roles/permissions |
| V5 Input Validation | Yes | `z.enum(["100", "80", "50", "open-to-rfp"])` on `dealEditSchema.confidenceLevel`, validated via the existing `safeParse`-before-commit gate every other editable field already uses — this is the standard control, not a new pattern |
| V6 Cryptography | No | No secrets, no crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid enum value written to store via a malformed/spoofed `updateDeal` call (e.g. dev-tools console tampering) | Tampering | The zod `safeParse` gate rejects any value outside the 4-member enum before it reaches `updateDeal` — already the pattern for `value`/`owner`/`closeDate`; extending it to `confidenceLevel` closes the same gap consistently |

## Sources

### Primary (HIGH confidence — direct file reads this session)
- `src/features/pipeline/components/EditableCell.tsx` — click-to-edit state machine
- `src/features/pipeline/components/StageSelect.tsx` — Select + stopPropagation pattern
- `src/features/pipeline/components/deal-edit-schema.ts` — validation schema shape
- `src/features/pipeline/components/DealTable.tsx` — column array integration point
- `src/features/pipeline/store/pipelineStore.ts` — `updateDeal` signature gap (Pitfall 1)
- `src/features/pipeline/hooks/usePipelineGroups.ts` — pre-partition pattern to mirror
- `src/features/pipeline/components/GroupSection.tsx` — always-render-empty-group precedent
- `src/features/pipeline/components/AddDealDialog.tsx` — confidence label text source
- `src/features/forecast/components/ForecastPage.tsx` — mount point for new table
- `src/features/forecast/forecast-metrics.ts` — pure-module convention + `CONFIDENCE_WEIGHT` order
- `src/shared/utils/deal-metrics.ts` — `computeMrr`/`computeArr`/`computeLifetimeContractValue` to extend
- `src/shared/utils/line-items.ts` — `computeSubtotal` convention
- `src/shared/types/deal.ts` — `Deal`/`ConfidenceLevel`/`LineItem` shapes
- `src/components/ui/select.tsx` — shadcn Select wrapper, prop passthrough
- `src/data/mock/seed-data.ts` — existing `CONFIDENCE_LEVELS` array (grep-confirmed)
- `package.json` — installed versions
- `.planning/config.json` — workflow flags (`nyquist_validation: false`, `security_enforcement: true`)

### Secondary (MEDIUM confidence)
- `npm view @tanstack/react-table version` / `npm view zod version` — registry check confirming installed versions are current or near-current (not requiring an upgrade for this phase)

### Tertiary (LOW confidence)
- Radix `Select` controlled `open`/`onOpenChange` behavior (Open Question 1 / Assumption A1) — based on general Radix API knowledge, not verified against Radix's docs this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, every library already installed and in use for near-identical problems
- Architecture: HIGH — recommendation is directly grounded in 3 existing in-repo precedents (`usePipelineGroups.ts`, `forecast-metrics.ts`, `deal-metrics.ts`) read this session
- Pitfalls: HIGH for Pitfalls 1-3 (each backed by a verified file read); MEDIUM for Pitfall 4 (a reasonable extrapolation, flagged in Assumptions Log)

**Research date:** 2026-09-15
**Valid until:** 30 days (stable, internal-codebase-driven research; no fast-moving external dependency risk)

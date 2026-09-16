# Phase 5: Confidence-Based Forecast Breakdown - Pattern Map

**Mapped:** 2026-09-15
**Files analyzed:** 8 (2 new components, 1 new util module, 1 new constants file, 4 modified files)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/features/pipeline/components/ConfidenceCell.tsx` (new) | component (editable table cell) | request-response (click → commit → store write) | `src/features/pipeline/components/EditableCell.tsx` + `src/features/pipeline/components/StageSelect.tsx` | exact (composite of two direct analogs) |
| `src/shared/constants/confidence-level.ts` (new) | config/constants | transform (lookup tables) | `src/features/pipeline/components/AddDealDialog.tsx` lines 67-73 (`CONFIDENCE_LEVEL_OPTIONS`) + `src/features/pipeline/hooks/usePipelineGroups.ts` line 7 (`GROUPS` ordered array) | role-match |
| `src/features/forecast/forecast-breakdown.ts` (new) | service (pure derived-value module) | transform / CRUD-aggregate | `src/features/forecast/forecast-metrics.ts` | exact |
| `src/features/forecast/components/ForecastBreakdownTable.tsx` (new) | component (read-only table) | request-response (render-only) | `src/features/pipeline/components/DealTable.tsx` (table shell/empty-state) + `src/features/pipeline/components/GroupSection.tsx` (always-render-group-with-header precedent) | role-match |
| `src/shared/utils/deal-metrics.ts` (modify — add `computeQuantity`, `computeArpu`, `joinModelSkus`, `joinServiceNames`) | utility | transform | itself (`computeMrr`/`computeArr`/`computeLifetimeContractValue`, same file) | exact |
| `src/features/pipeline/store/pipelineStore.ts` (modify — widen `updateDeal` patch type) | store | CRUD | itself | exact |
| `src/features/pipeline/components/deal-edit-schema.ts` (modify — add `confidenceLevel` enum) | config (validation schema) | transform | itself (`value`/`owner`/`closeDate` fields, same file) | exact |
| `src/features/pipeline/components/DealTable.tsx` (modify — add Confidence column) | controller (table columns) | request-response | itself (existing `EditableCell`/`StageSelect` column defs) | exact |
| `src/features/forecast/components/ForecastPage.tsx` (modify — mount new table section) | component (page) | request-response | itself (existing stat-tile/chart mount pattern) | exact |

## Pattern Assignments

### `src/features/pipeline/components/ConfidenceCell.tsx` (new component, request-response)

**Analogs:** `src/features/pipeline/components/EditableCell.tsx` (state machine) + `src/features/pipeline/components/StageSelect.tsx` (Select control + stopPropagation)

**Imports pattern** (`EditableCell.tsx` lines 1-5):
```typescript
import { useState } from "react";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { dealEditSchema } from "@/features/pipeline/components/deal-edit-schema";
import { UPDATE_FAILED_MESSAGE } from "@/features/pipeline/constants";
```
Add for the Select variant (`StageSelect.tsx` lines 2-8):
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

**Click-to-reveal guard** (`EditableCell.tsx` lines 56-72) — the exact shell to reproduce, swapping the `<input>` branch for a `Select`:
```typescript
if (!isEditing) {
  return (
    <div>
      <span
        className="block cursor-text px-1 py-0.5"
        onClick={(e) => {
          e.stopPropagation();
          if (isPending) return;
          setDraft(toEditableValue(columnId, value));
          setIsEditing(true);
        }}
      >
        {displayText}
      </span>
      {error && <span className="block px-1 text-xs text-destructive">{error}</span>}
    </div>
  );
}
```

**Select + stopPropagation pattern** (`StageSelect.tsx` lines 57-61, 73-84) — mirror this for the edit-mode branch instead of `EditableCell`'s `<input>`:
```typescript
<div onClick={(e) => e.stopPropagation()}>
  <Select value={currentGroup} onValueChange={handleValueChange}>
    <SelectTrigger size="sm" aria-label="Move deal to stage">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {GROUP_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Commit / safeParse / error-revert pattern** (`EditableCell.tsx` lines 77-102) — reuse verbatim with `columnId` fixed to `"confidenceLevel"`:
```typescript
const commit = async () => {
  setIsEditing(false);
  if (isPending || draft === lastCommitted) return;
  const candidate = draft; // no numeric coercion needed for confidenceLevel
  const parsed = dealEditSchema.shape.confidenceLevel.safeParse(candidate);
  if (!parsed.success) {
    setDraft(lastCommitted);
    setError(parsed.error.issues[0]?.message ?? UPDATE_FAILED_MESSAGE);
    return;
  }
  setIsPending(true);
  try {
    await usePipelineStore.getState().updateDeal(dealId, { confidenceLevel: parsed.data });
    setError(null);
  } catch {
    setDraft(lastCommitted);
    setError(UPDATE_FAILED_MESSAGE);
  } finally {
    setIsPending(false);
  }
};
```

**Display text:** Use `CONFIDENCE_LEVEL_LABELS[value]` (new constants file) instead of `EditableCell`'s `String(value)` — mirrors how `EditableCell.tsx` line 46 branches `displayText` per-column for special formatting (currency for `value`, formatted date for `closeDate`).

**Decision per CONTEXT.md D-02/Discretion:** Build as a new sibling component, NOT an `EditableCell` variant — keeps `EditableCell`'s existing 4-column `EditableColumnId` union (`"name" | "value" | "owner" | "closeDate"`, line 13) simple; do not add `"confidenceLevel"` to that union.

---

### `src/shared/constants/confidence-level.ts` (new, config/constants)

**Analogs:** `AddDealDialog.tsx` lines 67-73 (label map source) + `usePipelineGroups.ts` line 7 (ordered-array-drives-render-order convention)

**Label map source** (`AddDealDialog.tsx` lines 67-73):
```typescript
const CONFIDENCE_LEVEL_OPTIONS: { value: AddDealFormValues["confidenceLevel"]; label: string }[] = [
  { value: "100", label: "100%" },
  { value: "80", label: "80%" },
  { value: "50", label: "50%" },
  { value: "open-to-rfp", label: "Open to RFP Bids" },
];
```

**Ordered-array convention** (`usePipelineGroups.ts` line 7 — "Fixed display order... never derived, never reordered"):
```typescript
export const GROUPS: PipelineGroup[] = ["prospect", "lead", "opportunity", "deal", "won", "lost"];
```

**Recommended shape** — a plain ordered array + label record, consumed by both `ConfidenceCell.tsx` (Select options) and `forecast-breakdown.ts`/`ForecastBreakdownTable.tsx` (group iteration order, D-08):
```typescript
import type { ConfidenceLevel } from "@/shared/types/deal";

/** Fixed display order, descending confidence (D-08) — never derived from Object.keys(). */
export const CONFIDENCE_LEVELS: ConfidenceLevel[] = ["100", "80", "50", "open-to-rfp"];

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  "100": "100%",
  "80": "80%",
  "50": "50%",
  "open-to-rfp": "Open to RFP Bids",
};
```
Note: `src/data/mock/seed-data.ts` line 20 already declares a same-named/same-order local `CONFIDENCE_LEVELS` array for an unrelated purpose (random seed selection) — leave that one alone; it is not this file and does not need to import from it (Assumption A3 in RESEARCH.md treats this as low-risk duplication either way).

---

### `src/features/forecast/forecast-breakdown.ts` (new, pure module)

**Analog:** `src/features/forecast/forecast-metrics.ts` (entire file — the convention to mirror)

**Module-header convention** (`forecast-metrics.ts` lines 1-9):
```typescript
import type { Deal, ConfidenceLevel, PipelineStage } from "@/shared/types/deal";

/**
 * Pure, never-stored derived-value functions for the Forecast page...
 * Mirrors `deal-metrics.ts`'s existing module shape: no side effects, no
 * side effects, no store/repository import — every function here takes a
 * `Deal[]` and returns a plain computed value...
 */
```

**Filter-then-reduce aggregation shape** (`forecast-metrics.ts` lines 27-29, `computeRawPipelineValue`):
```typescript
export function computeRawPipelineValue(deals: Deal[]): number {
  return deals.filter((d) => d.outcome === "open").reduce((sum, d) => sum + d.value, 0);
}
```
For this phase's `groupDealsByConfidence`/`computeGroupTotals`, do NOT filter by `outcome` — CONTEXT.md's PROJECT.md-locked decision is "all deals regardless of outcome," a deliberate contrast with this analog's open-only scope. Flag this contrast in code comments the way `forecast-metrics.ts` itself flags its own scope (see lines 23-26).

**Pre-partition (not `getGroupedRowModel`) convention** (`usePipelineGroups.ts` lines 17-29):
```typescript
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
`forecast-breakdown.ts`'s `groupDealsByConfidence` mirrors this shape but as a plain function (no hook, no `useMemo`, no store import) — same convention `forecast-metrics.ts` already follows (plain `Deal[]` in / value out, unit-testable independent of Zustand).

**Divide-by-zero guard convention** (`forecast-metrics.ts` lines 48-52, `computeWinRate`):
```typescript
export function computeWinRate(deals: Deal[]): number {
  const won = deals.filter((d) => d.outcome === "won").length;
  const lost = deals.filter((d) => d.outcome === "lost").length;
  return won + lost === 0 ? 0 : won / (won + lost);
}
```
Apply the same null/zero-guard shape to `computeGroupTotals`'s `arpu` field (D-06/D-07): `arpu: quantity === 0 ? null : mrr / quantity`.

---

### `src/shared/utils/deal-metrics.ts` (modify — add 4 functions)

**Analog:** itself — `computeMrr` (lines 24-28), the exact shape every new function must mirror:
```typescript
export function computeMrr(deal: Pick<Deal, "lineItems">): number {
  return deal.lineItems
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + computeSubtotal(item), 0);
}
```

**Rule to follow:** every new function accepts `Pick<Deal, "lineItems">` (or `Pick<Deal, "lineItems" | "contractTermMonths">` where needed, per `computeLifetimeContractValue` line 43-45), never the full `Deal` — keeps composability/testability identical to existing siblings. Add `computeQuantity`, `computeArpu`, `joinModelSkus`, `joinServiceNames` per RESEARCH.md Pattern 3 (exact code already drafted there — copy verbatim, including the `.filter(Boolean)` guard on both join functions per Pitfall 4).

Update the file's own header comment (lines 4-17) — it currently states "ARPU was removed entirely (calculation and column)"; this phase reverses that specific line, so the comment must be corrected, not left contradicting the new export.

---

### `src/features/forecast/components/ForecastBreakdownTable.tsx` (new component)

**Analogs:** `src/features/pipeline/components/DealTable.tsx` (table shell markup, empty-state row) + `src/features/pipeline/components/GroupSection.tsx` (always-render-group-with-header, even when empty)

**Table shell + empty-state pattern** (`DealTable.tsx` lines 218-243):
```typescript
<div className="overflow-x-auto rounded-lg border border-border">
  <table className="w-full min-w-max text-left text-sm">
    <thead className="bg-muted/50 text-muted-foreground">
      {/* header row */}
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
            No deals in this group yet.
          </td>
        </tr>
      ) : (
        rows.map((row) => <tr key={row.id} className="border-t border-border">{/* cells */}</tr>)
      )}
    </tbody>
  </table>
</div>
```
Since D-11 requires no TanStack (plain HTML table per RESEARCH.md's resolved recommendation), skip `flexRender`/`useLegacyTable` entirely — write `<tr>`/`<td>` directly from `groupDealsByConfidence(deals)[level]`.

**Always-render-group-even-if-empty precedent** (`GroupSection.tsx` lines 76-77, 93-125 — header always renders regardless of whether `deals` is empty):
```typescript
// The header always renders, regardless of whether `deals` is empty — a
// group never disappears just because it currently has 0 deals.
```
Apply this identically to each of the 4 confidence-level sections (D-09): always render group header + subtotal row, with an empty-state message row when the group's deal list is empty.

**Currency formatting convention** (duplicated identically in `DealTable.tsx` lines 32-36, `EditableCell.tsx` lines 7-11, `ForecastPage.tsx` lines 13-17) — instantiate a 4th matching copy:
```typescript
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
```

**Subtotal/grand-total row non-aggregatable-column handling (Pitfall 2):** put the group/grand-total label in the Account Name column position and render `"—"` for Model/Services/Contract Length, per RESEARCH.md's exact recommendation.

---

### `src/features/pipeline/store/pipelineStore.ts` (modify)

**Current state to change** (lines 20-23):
```typescript
updateDeal: (
  id: string,
  patch: Partial<Pick<Deal, "name" | "value" | "owner" | "closeDate" | "lineItems">>,
) => Promise<void>;
```
**Required change:** add `"confidenceLevel"` to the `Pick<Deal, ...>` union. This is the only change needed — `updateDeal`'s implementation (lines 96-108) is already generic/untyped-at-runtime (`dealsRepository.update(id, patch)`), so no other edit is required in this file.

---

### `src/features/pipeline/components/deal-edit-schema.ts` (modify)

**Current shape** (lines 8-13):
```typescript
export const dealEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
});
```
**Required addition** (D-03):
```typescript
confidenceLevel: z.enum(["100", "80", "50", "open-to-rfp"]),
```
Add as a new key in the same object literal — no other structural change; `DealEditFormValues`/`DealEditFormInput` type exports (lines 15, 21) auto-update via `z.infer`/`z.input`.

---

### `src/features/pipeline/components/DealTable.tsx` (modify)

**Column definition pattern to mirror** (lines 67-83, the `owner` column — closest analog since Confidence is also a `columnHelper.accessor` on an enum-like field):
```typescript
columnHelper.accessor("owner", {
  header: ({ column }) => ( /* sortable header button, optional for Confidence */ ),
  enableGlobalFilter: false,
  filterFn: "equalsString",
  cell: (info) => (
    <EditableCell dealId={info.row.original.id} columnId="owner" value={info.getValue()} />
  ),
}),
```
New Confidence column: `columnHelper.accessor("confidenceLevel", { ..., cell: (info) => <ConfidenceCell dealId={info.row.original.id} value={info.getValue()} /> })`.

**Insertion point recommendation** (RESEARCH.md Open Question 2): insert after the `closeDate` column (line 84-100) and before the `lifetimeContractValue` display column (line 101-106) — keeps all directly-editable fields contiguous.

---

### `src/features/forecast/components/ForecastPage.tsx` (modify)

**Mount pattern to extend** (lines 26-55) — the new breakdown table section is a new sibling `<div>`/`<section>` appended after the existing chart grid (line 49-52), reading the same unfiltered store selector already at line 27:
```typescript
const deals = usePipelineStore((s) => s.deals);
// ... existing raw/weighted/winRate/lostByReason/lostByStage ...
return (
  <div className="mx-auto flex w-[95%] flex-col gap-6 px-6 py-8">
    {/* existing h1, StatTile grid, LostBreakdownChart grid unchanged */}
    <ForecastBreakdownTable deals={deals} />
  </div>
);
```
Do not add a new store subscription — reuse the `deals` variable already destructured at line 27, per the file's own documented rule (lines 19-25): "Reads the store's full, unfiltered `deals` array directly... Forecast numbers must never silently reflect a forgotten search/filter."

## Shared Patterns

### Click-to-edit-in-place shell (isEditing/draft/isPending/error state)
**Source:** `src/features/pipeline/components/EditableCell.tsx` (whole file)
**Apply to:** `ConfidenceCell.tsx`

### stopPropagation guard so cell-edit clicks never trigger row click / drag
**Source:** `src/features/pipeline/components/StageSelect.tsx` lines 57-61, `EditableCell.tsx` line 62/119
**Apply to:** `ConfidenceCell.tsx`

### zod safeParse-before-commit validation gate
**Source:** `src/features/pipeline/components/EditableCell.tsx` lines 83-89, `src/features/pipeline/components/deal-edit-schema.ts`
**Apply to:** `ConfidenceCell.tsx` (validates against `dealEditSchema.shape.confidenceLevel`)

### Derived-value module convention (pure functions, no store/hook imports, `Pick<Deal, ...>` params)
**Source:** `src/shared/utils/deal-metrics.ts`, `src/shared/utils/line-items.ts`, `src/features/forecast/forecast-metrics.ts`
**Apply to:** new functions in `deal-metrics.ts`, new `forecast-breakdown.ts` module

### Ordered-array-drives-render-order (never `Object.keys()` on an enum-keyed record)
**Source:** `src/features/pipeline/hooks/usePipelineGroups.ts` line 7 (`GROUPS`)
**Apply to:** `CONFIDENCE_LEVELS` constant, consumed by both `ConfidenceCell.tsx`'s Select options and `ForecastBreakdownTable.tsx`'s group iteration (D-08, Pitfall 3)

### Always-render-group-even-when-empty
**Source:** `src/features/pipeline/components/GroupSection.tsx` lines 76-77; `DealTable.tsx` lines 235-243 (empty-state row text)
**Apply to:** `ForecastBreakdownTable.tsx`'s 4 confidence-level sections (D-09)

### Shared currency formatter instance (duplicated per-file, not extracted — established convention)
**Source:** `DealTable.tsx` lines 32-36, `EditableCell.tsx` lines 7-11, `ForecastPage.tsx` lines 13-17
**Apply to:** `ForecastBreakdownTable.tsx` (a 4th identical copy — do not extract to a shared util this phase, per RESEARCH.md's explicit "out of scope" note)

### Replace-by-id, never by array index, on store writes
**Source:** `src/features/pipeline/store/pipelineStore.ts` lines 52, 65, 85, 100 (`set({ deals: get().deals.map((d) => (d.id === id ? updated : d)) })`)
**Apply to:** No new write path needed — `ConfidenceCell` reuses the existing `updateDeal` action verbatim, which already follows this rule; listed for completeness since `ForecastBreakdownTable.tsx`'s row-keying should also key by `deal.id`, never index.

## No Analog Found

None — every file in scope has a direct or composite analog already in the codebase.

## Metadata

**Analog search scope:** `src/features/pipeline/`, `src/features/forecast/`, `src/shared/utils/`, `src/shared/types/`, `src/shared/constants/`, `src/data/mock/`, `src/components/ui/select.tsx`
**Files scanned:** 12 (all Read in full this session)
**Pattern extraction date:** 2026-09-15

# Phase 2: Deal Detail & Line Items - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 9 (new + modified)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/shared/types/deal.ts` (modify: + `LineItem`, `LineItemType`, `Deal.lineItems`) | model | CRUD | itself (existing `Deal`/`NewDealInput` shape) | exact |
| `src/shared/utils/line-items.ts` (new: `computeSubtotal`, `sumLineItems`, `hasManualOverride`) | utility | transform | `src/shared/utils/pipeline-group.ts` | role-match |
| `src/data/deals-repository.ts` (modify: widen `update()` patch type) | model/interface | CRUD | itself | exact |
| `src/data/mock/mock-deals-repository.ts` (modify: none — signature-only change) | service | CRUD | itself (`update()` already spread-merges) | exact |
| `src/features/pipeline/store/pipelineStore.ts` (modify: + `updateDeal` action) | store | CRUD | `moveStage` action in same file | exact |
| `src/features/pipeline/components/DealTable.tsx` (modify: row onClick opens drawer; core-field columns use `EditableCell`) | component | request-response | itself (existing column/cell pattern) | exact |
| `src/features/pipeline/components/EditableCell.tsx` (new) | component | request-response | `src/features/pipeline/components/StageSelect.tsx` (per-row control calling a store action) | role-match |
| `src/features/pipeline/components/DealDetailDrawer.tsx` (new) | component | request-response | `src/features/pipeline/components/AddDealDialog.tsx` (controlled Dialog/Sheet, RHF+zod) | exact (Dialog→Sheet swap) |
| `src/features/pipeline/components/LineItemsTable.tsx` (new) | component | CRUD | `DealTable.tsx` (headless table) + `AddDealDialog.tsx` (RHF pattern) | role-match |
| `src/features/pipeline/components/deal-edit-schema.ts` (new: core-field edit schema + `lineItemSchema`) | utility (validation) | transform | `src/features/pipeline/components/add-deal-schema.ts` | exact |
| `src/features/pipeline/components/StageSelect.tsx` (modify: add `stopPropagation` wrapper) | component | request-response | itself | exact |
| `src/components/ui/sheet.tsx` (new, via `npx shadcn@latest add sheet`) | component (primitive) | request-response | `src/components/ui/dialog.tsx` | exact (same Radix Dialog primitive) |

## Pattern Assignments

### `src/shared/types/deal.ts` (model)

**Analog:** itself — existing `Deal`/`NewDealInput` conventions (`src/shared/types/deal.ts:1-52`, read in full)

**Convention to copy:** Every derived/computed concept (like `PipelineGroup`) is documented in a comment as "never stored directly" and computed via a utility function. Apply the same convention to line-item subtotal/deal total — do NOT add a `subtotal` field to `LineItem` or a `total`/`computedValue` field to `Deal`.

```typescript
// Existing pattern (lines 17-21):
/**
 * The 5 UI groups the pipeline board renders. Always derived from
 * `pipelineStage` + `outcome` via `toPipelineGroup` — never stored directly.
 */
export type PipelineGroup = "prospect" | "lead" | "opportunity" | "deal" | "lost";
```

New additions should follow the same interface style (plain fields, no optional unless truly optional like `lostReason?`):

```typescript
export type LineItemType = "product" | "service";

export interface LineItem {
  id: string;
  productOrService: string;
  sku: string;
  units: number;
  unitPrice: number;
  type: LineItemType;
  // subtotal intentionally NOT a field — compute via computeSubtotal(item)
}

export interface Deal {
  // ...existing fields unchanged...
  lineItems: LineItem[];
}
```

---

### `src/shared/utils/line-items.ts` (utility, transform)

**Analog:** `src/shared/utils/pipeline-group.ts` — a pure-function derived-value module (not read in full this pass, but its role is confirmed by `deal.ts`'s comments: `toPipelineGroup`/`fromPipelineGroup` compute a derived concept from stored fields, imported into components/store, never mutating state).

**Core pattern:** Pure functions, no side effects, no store/repository imports.

```typescript
export function computeSubtotal(item: Pick<LineItem, "units" | "unitPrice">): number {
  return item.units * item.unitPrice;
}

export function sumLineItems(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + computeSubtotal(item), 0);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function hasManualOverride(deal: Pick<Deal, "value" | "lineItems">): boolean {
  if (deal.lineItems.length === 0) return false;
  return round2(deal.value) !== round2(sumLineItems(deal.lineItems));
}
```

Import site convention: `import { toPipelineGroup } from "@/shared/utils/pipeline-group";` (see `DealTable.tsx:15`) — mirror with `import { sumLineItems, hasManualOverride } from "@/shared/utils/line-items";`.

---

### `src/data/deals-repository.ts` (model/interface, CRUD)

**Analog:** itself (`src/data/deals-repository.ts:1-18`, read in full)

**Current interface (lines 11-18):**
```typescript
export interface DealsRepository {
  list(): Promise<Deal[]>;
  create(input: NewDealInput): Promise<Deal>;
  update(
    id: string,
    patch: Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason">>,
  ): Promise<Deal>;
}
```

**Change required:** widen only the `Pick<...>` union — no new methods, no logic:
```typescript
update(
  id: string,
  patch: Partial<
    Pick<Deal, "pipelineStage" | "outcome" | "lostReason" | "name" | "value" | "owner" | "closeDate" | "lineItems">
  >,
): Promise<Deal>;
```

The header comment (lines 3-10) describing the repository-seam rationale should stay unchanged — no architectural change, only a type widening.

---

### `src/data/mock/mock-deals-repository.ts` (service, CRUD)

**Analog:** itself — `update()` method (`src/data/mock/mock-deals-repository.ts:43-56`, read in full)

**Core pattern (no code change needed, only the imported `DealsRepository` type widens):**
```typescript
update(
  id: string,
  patch: Partial<Pick<Deal, "pipelineStage" | "outcome" | "lostReason">>,
): Promise<Deal> {
  // Find by stable id, never by array index (research/PITFALLS.md Pitfall 5)
  const index = this.deals.findIndex((d) => d.id === id);
  if (index === -1) {
    return Promise.reject(new Error(`Deal with id "${id}" not found`));
  }
  const updated: Deal = { ...this.deals[index], ...patch };
  this.deals[index] = updated;
  return Promise.resolve(updated);
}
```
This already spread-merges an arbitrary patch object — only the type signature parameter needs to widen to match the interface change above. **Do not add a second method for line items** — `updateDeal(id, { lineItems: [...] })` goes through this same method.

---

### `src/features/pipeline/store/pipelineStore.ts` (store, CRUD)

**Analog:** `moveStage` action, same file (`src/features/pipeline/store/pipelineStore.ts:35-41`, read in full)

**Imports pattern (lines 1-4):**
```typescript
import { create } from "zustand";
import { dealsRepository } from "@/data";
import type { Deal, NewDealInput, PipelineGroup } from "@/shared/types/deal";
import { fromPipelineGroup } from "@/shared/utils/pipeline-group";
```

**Core pattern to copy (existing `moveStage`, lines 35-41):**
```typescript
moveStage: async (dealId, group) => {
  const current = get().deals.find((d) => d.id === dealId);
  const patch = fromPipelineGroup(group, current?.pipelineStage);
  const updated = await dealsRepository.update(dealId, patch);
  // Replace by id, never by array index (research/PITFALLS.md Pitfall 5).
  set({ deals: get().deals.map((d) => (d.id === dealId ? updated : d)) });
},
```

**New `updateDeal` action — same shape:**
```typescript
updateDeal: async (id, patch) => {
  const updated = await dealsRepository.update(id, patch);
  set({ deals: get().deals.map((d) => (d.id === id ? updated : d)) });
},
```

**Error-handling gap to fix (per 01-REVIEW.md, carried into 02-CONTEXT.md Integration Points):** neither `addDeal` nor `moveStage` currently wraps the `await dealsRepository.*` call in try/catch — this is a documented, non-blocking Phase 1 finding. Since this phase is told explicitly to not repeat the gap, `updateDeal` should add minimal error handling, e.g.:
```typescript
updateDeal: async (id, patch) => {
  try {
    const updated = await dealsRepository.update(id, patch);
    set({ deals: get().deals.map((d) => (d.id === id ? updated : d)) });
  } catch (err) {
    // surface/log — do not leave promise unhandled (carried-forward fix, 01-REVIEW.md)
    console.error("updateDeal failed", err);
  }
},
```
Add the new action's signature to the `PipelineState` interface (lines 6-12) alongside `moveStage`.

---

### `src/features/pipeline/components/StageSelect.tsx` (component, request-response — modify)

**Analog:** itself (`src/features/pipeline/components/StageSelect.tsx:1-51`, read in full)

**Current render (lines 37-50) has no propagation guard:**
```tsx
return (
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
);
```

**Required change (D-02 / Pitfall 2):** wrap in a `stopPropagation` element, since Radix's `SelectTrigger` does not stop propagation itself:
```tsx
return (
  <div onClick={(e) => e.stopPropagation()}>
    <Select value={currentGroup} onValueChange={handleValueChange}>
      {/* ...unchanged... */}
    </Select>
  </div>
);
```

---

### `src/features/pipeline/components/DealTable.tsx` (component, request-response — modify)

**Analog:** itself (`src/features/pipeline/components/DealTable.tsx:1-111`, read in full)

**Imports pattern (lines 1-15) — MUST reuse the `/legacy` subpath for any new table code (line-items table):**
```tsx
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, legacyCreateColumnHelper, useLegacyTable } from "@tanstack/react-table/legacy";
import { format, parseISO } from "date-fns";
import { StageSelect } from "@/features/pipeline/components/StageSelect";
import type { Deal } from "@/shared/types/deal";
import { toPipelineGroup } from "@/shared/utils/pipeline-group";
```

**Column definition pattern (lines 25-50) — the four editable columns (`name`, `value`, `owner`, `closeDate`) swap their bare accessor `cell` for an `EditableCell` renderer:**
```tsx
const columns = [
  columnHelper.accessor("name", { header: "Name" }),
  // ...
  columnHelper.accessor("value", {
    header: "Value",
    cell: (info) => currencyFormatter.format(info.getValue()),
  }),
  // ...
  columnHelper.display({
    id: "stage",
    header: "Stage",
    cell: (info) => (
      <StageSelect dealId={info.row.original.id} currentGroup={toPipelineGroup(info.row.original)} />
    ),
  }),
];
```
Replace e.g. the `value` cell renderer with `<EditableCell dealId={info.row.original.id} columnId="value" value={info.getValue()} onCommit={...} />`, following the same `columnHelper.display`/`accessor` shape already used for `stage`.

**Row-click integration (lines 97-105) — currently no row-level click handler:**
```tsx
table.getRowModel().rows.map((row) => (
  <tr key={row.id} className="border-t border-border">
    {row.getVisibleCells().map((cell) => (
      <td key={cell.id} className="px-4 py-2">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    ))}
  </tr>
))
```
Add `onClick={() => onRowClick(row.original.id)}` to the `<tr>`, with `onRowClick` passed down as a new `DealTableProps` field (mirrors how `PipelineBoard` owns the Add Deal dialog's open state per 01-04-SUMMARY.md — `DealTable`/`PipelineBoard` should own `selectedDealId: string | null` the same way).

---

### `src/features/pipeline/components/EditableCell.tsx` (component, request-response — new)

**Analog:** `src/features/pipeline/components/StageSelect.tsx` (per-row control that reads current value + calls a store action on change) — closest existing analog for "a small per-row interactive control living inside a `DealTable` cell."

**Pattern to copy from `StageSelect.tsx` (lines 32-35):**
```tsx
export function StageSelect({ dealId, currentGroup }: StageSelectProps) {
  const handleValueChange = (group: PipelineGroup) => {
    void usePipelineStore.getState().moveStage(dealId, group);
  };
  ...
```
`EditableCell` should call `usePipelineStore.getState().updateDeal(dealId, { [columnId]: draft })` the same way — direct `getState()` call from a per-row component, not a `usePipelineStore(selector)` subscription (avoids re-rendering every cell on unrelated state changes).

**Full component shape (from RESEARCH.md Pattern 2, cross-checked against `StageSelect`'s prop-drilling style — `dealId`/current value passed as props from `DealTable`'s column def):**
```tsx
function EditableCell({ dealId, columnId, value, onCommit }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!isEditing) {
    return (
      <span
        className="block cursor-text px-1 py-0.5"
        onClick={(e) => {
          e.stopPropagation(); // D-02: must not also open the drawer
          setIsEditing(true);
        }}
      >
        {value}
      </span>
    );
  }

  const commit = () => {
    setIsEditing(false);
    if (draft !== String(value)) onCommit(dealId, columnId, draft);
  };

  return (
    <input
      autoFocus
      className="w-full px-1 py-0.5"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(String(value)); setIsEditing(false); }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
```

---

### `src/features/pipeline/components/DealDetailDrawer.tsx` (component, request-response — new)

**Analog:** `src/features/pipeline/components/AddDealDialog.tsx` (fully-controlled Dialog + RHF + zod pattern), swapping `Dialog`/`DialogContent` for `Sheet`/`SheetContent`.

**Imports pattern to copy (`AddDealDialog.tsx` lines 1-25, adapted):**
```tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePipelineStore } from "@/features/pipeline/store/pipelineStore";
import { dealEditSchema, type DealEditFormInput, type DealEditFormValues } from "@/features/pipeline/components/deal-edit-schema";
```

**Controlled-open pattern to copy (`AddDealDialog.tsx` lines 45-48, 57, 77-78):**
```tsx
interface DealDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
}

export function DealDetailDrawer({ open, onOpenChange, dealId }: DealDetailDrawerProps) {
  ...
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{deal?.name}</SheetTitle>
        </SheetHeader>
        {/* field-level auto-commit fields + LineItemsTable */}
      </SheetContent>
    </Sheet>
  );
}
```

**Critical deviation from `AddDealDialog`'s `onSubmit` (lines 64-68) — DO NOT COPY the auto-close line:**
```tsx
// AddDealDialog.tsx — DO NOT replicate this in the drawer (violates D-03):
const onSubmit = async (values: AddDealFormValues) => {
  await addDeal(values);
  form.reset(DEFAULT_VALUES);
  onOpenChange(false);   // <-- drawer must NEVER call this from a field commit
};
```
The drawer's field handlers call `updateDeal` on blur and never call `onOpenChange(false)` — only the Sheet's own close button/overlay/Escape does that (Radix built-in, same as `DialogContent`'s `showCloseButton` in `src/components/ui/dialog.tsx:48-84`).

**Field pattern to copy verbatim (`AddDealDialog.tsx` lines 85-95, `Controller` + `Field`/`FieldLabel`/`FieldError` shadcn composition) — apply per-field with `onBlur` triggering `updateDeal` instead of a page-level submit:**
```tsx
<Controller
  name="name"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid}
        onBlur={() => { field.onBlur(); void updateDeal(dealId, { name: field.value }); }} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

### `src/features/pipeline/components/LineItemsTable.tsx` (component, CRUD — new)

**Analog (dual):** `src/features/pipeline/components/DealTable.tsx` (headless-table shell/markup) + `AddDealDialog.tsx` (RHF/zod field pattern, `z.coerce.number()` two-type-parameter fix)

**Table shell pattern to copy from `DealTable.tsx` (lines 70-111):** same `<div className="overflow-x-auto rounded-lg border border-border">` / `<table className="w-full min-w-max text-left text-sm">` wrapper, `thead` with `bg-muted/50 text-muted-foreground`, empty-state row (`colSpan={columns.length}`, "No deals in this group yet." → adapt to "No line items yet.").

**`useFieldArray` pattern (RESEARCH.md Pattern 3, cross-verified against the `z.coerce.number()` fix already shipped in `add-deal-schema.ts`):**
```tsx
const form = useForm<LineItemsFormInput, unknown, LineItemsFormValues>({
  resolver: zodResolver(lineItemsSchema),
  defaultValues: { lineItems: deal.lineItems },
});
const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });

// Add — id assigned exactly like MockDealsRepository.create() assigns Deal.id (mock-deals-repository.ts:29):
append({ id: crypto.randomUUID(), productOrService: "", sku: "", units: 1, unitPrice: 0, type: "product" });

// Render — keyed by fields[i].id (RHF-generated stable key), never index:
{fields.map((field, index) => (
  <tr key={field.id}>
    <Controller name={`lineItems.${index}.productOrService`} control={form.control} render={...} />
    {/* sku, units, unitPrice, type */}
    <td>{currencyFormatter.format(computeSubtotal(field))}</td>
    <button onClick={() => remove(index)}>Remove</button>
  </tr>
))}
```
`currencyFormatter` — reuse the exact `Intl.NumberFormat` instance pattern from `DealTable.tsx:17-21`:
```tsx
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
```

Each row/field change commits via `updateDeal(dealId, { lineItems: nextArray })` (field-level auto-commit, consistent with the drawer's core fields — no page-level Save button per RESEARCH.md Anti-Patterns).

---

### `src/features/pipeline/components/deal-edit-schema.ts` (utility, transform — new)

**Analog:** `src/features/pipeline/components/add-deal-schema.ts` (`src/features/pipeline/components/add-deal-schema.ts:1-27`, read in full)

**Exact pattern to copy — the `z.coerce.number()` / two-type-export fix:**
```typescript
import { z } from "zod";

export const addDealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
  group: z.enum(["prospect", "lead", "opportunity", "deal", "lost"]),
});

export type AddDealFormValues = z.infer<typeof addDealSchema>;

/**
 * Pre-coercion input shape ... needed so the zod resolver's input/output
 * types line up — see AddDealDialog.tsx's `useForm<AddDealFormInput, any,
 * AddDealFormValues>` for how the two are threaded through.
 */
export type AddDealFormInput = z.input<typeof addDealSchema>;
```

**New `deal-edit-schema.ts` — apply identically, for both the core-field edit schema and the line-item schema:**
```typescript
export const dealEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.coerce.number().positive("Value must be positive"),
  owner: z.string().min(1, "Owner is required"),
  closeDate: z.string().min(1, "Close date is required"),
});
export type DealEditFormValues = z.infer<typeof dealEditSchema>;
export type DealEditFormInput = z.input<typeof dealEditSchema>;

export const lineItemSchema = z.object({
  id: z.string(),
  productOrService: z.string().min(1, "Required"),
  sku: z.string().min(1, "Required"),
  units: z.coerce.number().positive("Must be positive"),
  unitPrice: z.coerce.number().positive("Must be positive"),
  type: z.enum(["product", "service"]),
});
export const lineItemsSchema = z.object({ lineItems: z.array(lineItemSchema) });
export type LineItemsFormValues = z.infer<typeof lineItemsSchema>;
export type LineItemsFormInput = z.input<typeof lineItemsSchema>;
```

---

### `src/components/ui/sheet.tsx` (component primitive, request-response — new, generated)

**Analog:** `src/components/ui/dialog.tsx` (`src/components/ui/dialog.tsx:1-167`, read in full) — same underlying Radix `Dialog` primitive; shadcn's `sheet` generator produces a structurally identical file with `SheetPrimitive` naming and a `side` prop added to `SheetContent`.

**Import/composition convention already established (lines 1-11):**
```tsx
import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
```
Expect `sheet.tsx` (generated by `npx shadcn@latest add sheet`) to follow this exact shape with `Dialog as SheetPrimitive` and a `data-slot="sheet"` convention, plus a `side` variant (via `class-variance-authority`, already installed per package.json) on `SheetContent`'s positioning classes (`fixed inset-y-0 right-0 h-full w-3/4 ...` for `side="right"`). Do not hand-write this file — run the CLI command and only restyle output classes to match the project's existing `cn()`/Tailwind conventions shown in `dialog.tsx`'s `DialogOverlay`/`DialogContent` (lines 32-84).

**Do not hand-edit generated primitives beyond restyling** — treat it the same as `dialog.tsx`/`select.tsx`: a copied, owned source file, not a library import.

---

## Shared Patterns

### Repository seam / id-based updates
**Source:** `src/data/mock/mock-deals-repository.ts:43-56`, `src/features/pipeline/store/pipelineStore.ts:35-41`
**Apply to:** `updateDeal` store action, `EditableCell` commit handler, `LineItemsTable` row commits
```typescript
// Find by stable id, never by array index (research/PITFALLS.md Pitfall 5)
const index = this.deals.findIndex((d) => d.id === id);
```
Every new write path (core-field inline edit, line-item add/edit/remove) must route through `usePipelineStore`'s `updateDeal` action → `dealsRepository.update(id, patch)`, never mutate `Deal`/`LineItem` objects directly and never import `mock-deals-repository.ts` outside `src/data/index.ts`.

### Controlled Dialog/Sheet ownership
**Source:** `src/features/pipeline/components/AddDealDialog.tsx:45-48, 57, 77-78`
**Apply to:** `DealDetailDrawer`
```tsx
interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function AddDealDialog({ open, onOpenChange }: AddDealDialogProps) { ... }
```
`DealDetailDrawer` takes the identical `{ open, onOpenChange, dealId }` shape; the parent (`DealTable`/`PipelineBoard`) owns `selectedDealId` state exactly as it owns the Add Deal dialog's open boolean.

### Click-propagation guards on nested interactive controls
**Source:** RESEARCH.md Pattern 2 / Pitfall 2, applied to `StageSelect.tsx` and `EditableCell.tsx`
**Apply to:** Every interactive element living inside a `DealTable` row once row-click opens the drawer (D-02)
```tsx
onClick={(e) => e.stopPropagation()}
```

### `z.coerce.number()` + react-hook-form 3-generic fix
**Source:** `src/features/pipeline/components/add-deal-schema.ts:9-27`, `AddDealDialog.tsx:59-62`
**Apply to:** `deal-edit-schema.ts` (`value` field), `lineItemSchema` (`units`, `unitPrice`)
```typescript
export type XFormValues = z.infer<typeof xSchema>;
export type XFormInput = z.input<typeof xSchema>;
// usage: useForm<XFormInput, unknown, XFormValues>({ resolver: zodResolver(xSchema), ... })
```

### Currency formatting
**Source:** `src/features/pipeline/components/DealTable.tsx:17-21`
**Apply to:** `LineItemsTable` subtotal column, `DealDetailDrawer` value/reset-to-sum display
```tsx
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
```

### Never store derived values
**Source:** `src/shared/types/deal.ts:1-9` (comment on `PipelineGroup`)
**Apply to:** `LineItem` (no `subtotal` field), `Deal` (no `total`/`computedValue`/`hasManualOverride` field) — compute via `src/shared/utils/line-items.ts`'s `computeSubtotal`/`sumLineItems`/`hasManualOverride` at render/selector time.

## No Analog Found

None — every new/modified file for this phase has a direct, load-bearing analog already shipped in Phase 1's codebase (confirmed by RESEARCH.md's own "Key insight": every "don't hand-roll" item already has a working Phase 1 reference implementation).

## Metadata

**Analog search scope:** `src/features/pipeline/components/`, `src/features/pipeline/store/`, `src/data/`, `src/shared/types/`, `src/shared/utils/`, `src/components/ui/`
**Files scanned/read in full:** `DealTable.tsx`, `StageSelect.tsx`, `AddDealDialog.tsx`, `add-deal-schema.ts`, `deals-repository.ts`, `mock-deals-repository.ts`, `pipelineStore.ts`, `deal.ts`, `dialog.tsx` (9 files, all read in full this session)
**Pattern extraction date:** 2026-09-07
